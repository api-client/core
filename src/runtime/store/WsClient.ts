import WebSocketNode from 'ws';
import { SdkBase } from './SdkBase.js';

export abstract class WsClient extends SdkBase {
  /**
   * Creates a WS client with optional token
   * @param addr The ws:// address
   * @param token Optional token to add.
   */
  abstract getClient(addr: string, token?: string): WebSocket | WebSocketNode;

  /**
   * Connect to the WS server
   * 
   * @param client The client to wait for connection.
   */
  abstract connect(client: WebSocket | WebSocketNode): Promise<void>;

  /**
   * Disconnects from the WS server.
   */
  abstract disconnect(client: WebSocket | WebSocketNode): Promise<void>;

  /**
   * The combination of `getClient()` and `connect()`.
   */
  abstract createAndConnect(addr: string, token?: string): Promise<WebSocket | WebSocketNode>;
}
