export const Kind = 'ARC#Server';

export interface IServer {
  kind: 'ARC#Server';
  /**
   * The base URI of the server.
   * Note, the URL can contain URI templates (e.g. `http://{host}.api.com/v1`)
   */
  uri: string;
  description?: string;
  /**
   * Usually included in the `url`. When the `url` is missing a protocol 
   * this is then used.
   */
  protocol?: string;
  /**
   * The security to be applied to any request that are going to this server.
   */
  security?: unknown[];
}

export class Server {
  kind = Kind;
  /**
   * The base URI of the server.
   * Note, the URL can contain URI templates (e.g. `http://{host}.api.com/v1`)
   */
  uri = '';
  description?: string;
  /**
   * Usually included in the `url`. When the `url` is missing a protocol 
   * this is then used.
   */
  protocol?: string;
  /**
   * The security to be applied to any request that are going to this server.
   */
  security?: unknown[];

  /**
   * Creates a server definition from a base URI.
   */
  static fromUri(uri: string): Server {
    const srv = new Server({
      kind: Kind,
      uri,
    });
    return srv;
  }

  /**
   * @param input The server definition used to restore the state.
   */
  constructor(input?: string|IServer) {
    let init: IServer;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        uri: '',
      };
    }
    this.new(init);
  }

  /**
   * Creates a new server clearing anything that is so far defined.
   * 
   * Note, this throws an error when the server is not an ARC server.
   */
  new(init: IServer): void {
    if (!Server.isServer(init)) {
      throw new Error(`Not an ARC server.`);
    }
    const { uri, description, protocol, security } = init;
    this.kind = Kind;
    this.uri = uri;
    this.description = description;
    this.protocol = protocol;
    this.security = security;
  }

  /**
   * Checks whether the input is a definition of a server.
   */
  static isServer(input: unknown): boolean {
    const typed = input as IServer;
    if (!input || !typed.uri || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IServer {
    const result: IServer = {
      kind: Kind,
      uri: this.uri,
    };
    if (this.description) {
      result.description = this.description;
    }
    if (this.protocol) {
      result.protocol = this.protocol;
    }
    if (this.security) {
      result.security = this.security;
    }
    return result;
  }
}
