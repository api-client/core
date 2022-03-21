import { SdkBase, E_RESPONSE_STATUS, E_RESPONSE_NO_VALUE, E_INVALID_JSON, E_RESPONSE_UNKNOWN, E_RESPONSE_LOCATION } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IListResponse, HistoryListOptions } from '../../models/Backend.js';
import { IHttpHistory, IHttpHistoryBulkAdd, Kind as HttpHistoryKind } from '../../models/HttpHistory.js';

export class HistorySdk extends SdkBase {
  /**
   * Creates a history object.
   * A history object can be created per app (type = app) or a store's space/[project/[request]].
   * 
   * The user can always read their own history. If the history is created for a space/project then 
   * history records are shared as any other object in the space.
   * 
   * Note, history objects cannot be updated. They can only be created or deleted.
   * 
   * @param history The history to create
   * @returns The key of the created history.
   */
  async create(history: IHttpHistory): Promise<string> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.history());
    const body = JSON.stringify(history);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to create a history. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    const location = result.headers.get('location');
    if (!location) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_LOCATION}`);
    }
    const id = location.split('/').pop();
    return id as string;
  }

  /**
   * Creates a multiple history objects in a batch operation.
   * 
   * @param info The bulk create info object.
   */
  async createBulk(info: IHttpHistoryBulkAdd): Promise<string[]> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.historyBatchCreate());
    const body = JSON.stringify(info);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to create a bulk history. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: string[];
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    return data;
  }

  /**
   * Lists the history.
   * 
   * @param options Optional query options.
   */
  async list(options: HistoryListOptions): Promise<IListResponse> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.history());
    this.sdk.appendListOptions(url, options);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to list history. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IListResponse;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!Array.isArray(data.data)) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Deletes a history object form the store.
   * 
   * @param key The key returned by the store when created the history. Also available via the `key` property on the history object.
   */
  delete(key: string): Promise<void>;
  /**
   * Deletes a list of history objects in a batch operation.
   * 
   * @param keys The keys returned by the store when created the history. Also available via the `key` property on the history object.
   */
  delete(keys: string[]): Promise<void>;
  /**
   * Deletes a history or a list of history objects from the store.
   * @param key A key or a list of keys.
   */
  async delete(key: string | string[]): Promise<void> {
    const { token } = this.sdk;
    const isArray = Array.isArray(key);
    const path = isArray ? RouteBuilder.historyBatchDelete() : RouteBuilder.historyItem(key);
    const url = this.sdk.getUrl(path);

    const result = isArray ? await this.sdk.http.post(url.toString(), { token, body: JSON.stringify(key) }) : await this.sdk.http.delete(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to delete history. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
  }

  /**
   * Reads a history definition from the store.
   * @param key The history key
   * @returns The history object
   */
  async read(key: string): Promise<IHttpHistory> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.historyItem(key));
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to read a history. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IHttpHistory;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (data.kind !== HttpHistoryKind) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }
}
