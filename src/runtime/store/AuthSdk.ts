import { SdkBase, IStoreTokenInfo } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { Headers } from '../../lib/headers/Headers.js';
import WebSocketNode from 'ws';

export class AuthSdk extends SdkBase {
  protected getExpires(headers: Headers): number | undefined {
    const expires = headers.get('expires');
    if (!expires) {
      return undefined;
    }
    const d = new Date(expires);
    const time = d.getTime();
    if (Number.isNaN(time)) {
      console.warn(`Invalid session response: the expires header cannot be parsed.`);
      return undefined;
    }
    return time;
  }

  /**
   * Creates unauthenticated session in the backend.
   * @returns The JWT for unauthenticated user.
   */
  async createSession(): Promise<IStoreTokenInfo> {
    const url = this.sdk.getUrl(RouteBuilder.sessions());
    // console.log('Create session: ', url);
    const result = await this.sdk.http.post(url.toString());
    this.inspectCommonStatusCodes(result.status);
    if (result.status !== 200) {
      throw new Error(`Unable to create the session. Invalid response status: ${result.status}`);
    }
    if (!result.body) {
      throw new Error(`Unable to create the session. Response has no token.`);
    }
    const info: IStoreTokenInfo = {
      token: result.body,
    };
    const expires = this.getExpires(result.headers);
    if (expires) {
      info.expires = expires;
    }
    return info;
  }

  /**
   * Initializes the authentication session.
   * @param token The unauthenticated session JWT. Required when not set on the class.
   * @returns The location of the authorization endpoint.
   */
  async createAuthSession(token?: string, loginPath = '/auth/login'): Promise<string> {
    const url = this.sdk.getUrl(loginPath);
    const result = await this.sdk.http.post(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const loc = result.headers.get('location');
    if (!loc) {
      throw new Error(`The location header not returned by the server.`);
    }
    return loc;
  }

  /**
   * Listens to the first message coming to the client from the auth endpoint.
   * @param authPath The authorization path returned by the server info or 401 response.
   * @param token Optional token to use.
   */
  async listenAuth(authPath: string, token?: string): Promise<void> {
    const url = this.sdk.getUrl(authPath);
    const client = await this.sdk.ws.createAndConnect(url.toString(), token);
    return new Promise((resolve, reject) => {
      const { sdk } = this;
      async function finishData(data: any): Promise<void> {
        let message: any;
        try {
          message = JSON.parse(data.toString());
          await sdk.ws.disconnect(client);
        } catch (cause) {
          reject(cause);
          return;
        }
        if (message.status === 'OK') {
          resolve();
        } else {
          reject(new Error(message.message || 'Unknown error'));
        }
      }
      const typedNode = client as WebSocketNode;
      if (typeof typedNode.on === 'function') {
        typedNode.on('message', (data: Buffer) => {
          finishData(data);
        });
      } else {
        const typedWeb = client as WebSocket;
        typedWeb.addEventListener('message', (event) => {
          finishData(event.data);
        });
      }
    });
  }

  /**
   * Renews authenticated token to a new one when the token expires.
   * @param token Optional token to use.
   * @returns 
   */
  async renewToken(token = this.sdk.token): Promise<IStoreTokenInfo> {
    const authPath = RouteBuilder.sessionRenew();
    const url = this.sdk.getUrl(authPath);
    const result = await this.sdk.http.post(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    if (result.status !== 200) {
      throw new Error(`Unable to renew the token. Invalid response status: ${result.status}`);
    }
    if (!result.body) {
      throw new Error(`Unable to create the session. Response has no token.`);
    }
    const info: IStoreTokenInfo = {
      token: result.body,
    };
    const expires = this.getExpires(result.headers);
    if (expires) {
      info.expires = expires;
    }
    return info;
  }
}
