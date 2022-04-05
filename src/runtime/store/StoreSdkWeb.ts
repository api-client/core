import { HttpWeb } from './HttpWeb.js';
import { WsClientWeb } from './WsClientWeb.js';
import { Sdk } from './Sdk.js';
import { Http } from './Http.js';
import { WsClient } from './WsClient.js';

export { IStoreTokenInfo, IStoreResponse, IStoreRequestOptions } from './SdkBase.js';
export { IFileCreateOptions as ISpaceCreateOptions } from './FilesSdk.js';

/**
 * NodeJS API for API Client's net-store module.
 */
export class StoreSdk extends Sdk {
  http: Http = new HttpWeb(this);
  ws: WsClient = new WsClientWeb(this);
}
