import { SdkBase, IStoreRequestOptions, IStoreResponse } from './SdkBase.js';

export abstract class Http extends SdkBase {
  /**
   * Performs the GET request.
   * 
   * @param url The request URL
   * @param opts The request options
   * @returns The response info.
   */
  abstract get(url: string, opts?: IStoreRequestOptions): Promise<IStoreResponse>;

  abstract post(url: string, opts?: IStoreRequestOptions): Promise<IStoreResponse>;

  abstract patch(url: string, opts?: IStoreRequestOptions): Promise<IStoreResponse>;

  abstract put(url: string, opts?: IStoreRequestOptions): Promise<IStoreResponse>;

  abstract delete(url: string, opts?: IStoreRequestOptions): Promise<IStoreResponse>;
}
