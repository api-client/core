export const Kind = 'Core#Server';

export interface IServer {
  kind: typeof Kind;
  /**
   * The base URI of the server.
   * 
   * Note, the URL can contain URI templates (e.g. `http://{host}.api.com/v1`)
   * In this case the variable is replaced with the system or project variables.
   * 
   * For simplicity, the `uri` can be the full base URI with protocol, host, and the `basePath`
   */
  uri: string;
  /**
   * Usually included in the `uri`. When the `uri` is missing a protocol 
   * this is then used.
   */
  protocol?: string;
  /**
   * The base path for the server. It starts with the `/`.
   * When set, it is appended to the `uri` value.
   */
  basePath?: string;
  /**
   * Optional description of the server.
   */
  description?: string;
}

export class Server {
  kind = Kind;
  /**
   * The base URI of the server.
   * 
   * Note, the URL can contain URI templates (e.g. `http://{host}.api.com/v1`)
   * In this case the variable is replaced with the system or project variables.
   * 
   * For simplicity, the `uri` can be the full base URI with protocol, host, and the `basePath`
   */
  uri = '';
  /**
   * Usually included in the `uri`. When the `uri` is missing a protocol 
   * this is then used.
   */
  protocol?: string;
  /**
   * The base path for the server. It starts with the `/`.
   * When set, it is appended to the `uri` value.
   */
  basePath?: string;
  /**
   * Optional description of the server.
   */
  description?: string;

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
   * Note, this throws an error when the server is not a server.
   */
  new(init: IServer): void {
    if (!Server.isServer(init)) {
      throw new Error(`Not a server.`);
    }
    const { uri, description, protocol, basePath } = init;
    this.kind = Kind;
    this.uri = uri;
    this.description = description;
    this.protocol = protocol;
    this.basePath = basePath;
  }

  /**
   * Checks whether the input is a definition of a server.
   */
  static isServer(input: unknown): boolean {
    const typed = input as IServer;
    if (!input || typeof typed.uri === 'undefined' || typed.kind !== Kind) {
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
    if (this.basePath) {
      result.basePath = this.basePath;
    }
    return result;
  }

  /**
   * Constructs the final URI from the server configuration.
   */
  readUri(): string {
    const { uri, protocol, basePath } = this;
    let result = '';
    if (!uri) {
      return result;
    }
    
    let tmp = uri;
    if (protocol && !uri.includes('://')) {
      tmp = `${protocol}//${uri}`;
    }
    result = tmp;
    if (basePath) {
      if (result.endsWith('/')) {
        result = result.substring(0, result.length - 1);
      }
      result += basePath.startsWith('/') ? basePath : `/${basePath}`
    }
    return result;
  }
}
