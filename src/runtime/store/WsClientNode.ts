import WebSocket from 'ws';
import { WsClient } from './WsClient.js';

export class WsClientNode extends WsClient {
  /**
   * Creates a WS client with optional token
   * @param addr The ws:// address
   * @param token Optional token to add.
   */
  getClient(addr: string, token = this.sdk.token): WebSocket {
    let url = addr;
    if (token) {
      url += url.includes('?') ? '&' : '?';
      url += 'token=';
      url += token;
    }
    if (url.startsWith('http:')) {
      url = `ws:${url.substring(5)}`;
    } else if (url.startsWith('https:')) {
      url = `wss:${url.substring(6)}`;
    }
    return new WebSocket(url);
  }

  /**
   * Connect to the WS server
   * 
   * @param client The client to wait for connection.
   */
  connect(client: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      client.once('open', () => {
        client.removeAllListeners('error');
        resolve();
      });
      client.once('error', (err) => {
        client.removeAllListeners('open');
        reject(err);
      });
    });
  }

  /**
   * Disconnects from the WS server.
   */
  disconnect(client: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      client.once('close', () => {
        client.removeAllListeners('error');
        resolve();
      });
      client.once('error', (err) => {
        client.removeAllListeners('close');
        reject(err);
      });
      client.close();
    });
  }

  /**
   * The combination of `getClient()` and `connect()`.
   */
  async createAndConnect(addr: string, token?: string): Promise<WebSocket> {
    const client = this.getClient(addr, token);
    await this.connect(client);
    return client;
  }
}
