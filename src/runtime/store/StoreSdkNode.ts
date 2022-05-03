import { HttpNode } from './HttpNode.js';
import { WsClientNode } from './WsClientNode.js';
import { Sdk } from './Sdk.js';
import { Http } from './Http.js';
import { WsClient } from './WsClient.js';

export { IStoreTokenInfo, IStoreResponse, IStoreRequestOptions } from './SdkBase.js';
export { IFileCreateOptions, ListFileKind } from './FilesSdk.js';

/**
 * NodeJS API for API Client's net-store module.
 */
export class StoreSdk extends Sdk {
  http: Http = new HttpNode(this);
  ws: WsClient = new WsClientNode(this);
}
