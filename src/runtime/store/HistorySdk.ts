import { SdkBase, E_RESPONSE_STATUS, E_RESPONSE_NO_VALUE, E_INVALID_JSON, E_RESPONSE_UNKNOWN, E_RESPONSE_LOCATION, ISdkRequestOptions } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IListResponse, HistoryListOptions, IHistoryRequestListOptions } from '../../models/store/Backend.js';
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
   * @param request Optional request options.
   * @returns The key of the created history.
   */
  async create(history: IHttpHistory, request: ISdkRequestOptions = {}): Promise<string> {
    const token = request.token || this.sdk.token;
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
   * @param request Optional request options.
   */
  async createBulk(info: IHttpHistoryBulkAdd, request: ISdkRequestOptions = {}): Promise<string[]> {
    const token = request.token || this.sdk.token;
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
      data = JSON.parse(result.body).items;
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    return data;
  }

  /**
   * Lists the history.
   * 
   * @param options Optional query options.
   * @param request Optional request options.
   */
  async list(options: HistoryListOptions, request: ISdkRequestOptions = {}): Promise<IListResponse<IHttpHistory>> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.history());
    this.appendHistoryListParameters(url, options);
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
    let data: IListResponse<IHttpHistory>;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!Array.isArray(data.items)) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  appendHistoryListParameters(url: URL, options: HistoryListOptions): void {
    this.sdk.appendListOptions(url, options);
    const { searchParams } = url;
    if (options.type) {
      searchParams.set('type', options.type);
    }
    const projectOptions = options as IHistoryRequestListOptions;
    if (projectOptions.id) {
      searchParams.set('id', projectOptions.id);
    }
    if (projectOptions.user) {
      searchParams.set('user', 'true');
    }
    if (projectOptions.project) {
      searchParams.set('project', projectOptions.project);
    }
  }

  /**
   * Deletes a history object form the store.
   * 
   * @param key The key returned by the store when created the history. Also available via the `key` property on the history object.
   * @param request Optional request options.
   */
  delete(key: string, request?: ISdkRequestOptions): Promise<void>;
  /**
   * Deletes a list of history objects in a batch operation.
   * 
   * @param keys The keys returned by the store when created the history. Also available via the `key` property on the history object.
   * @param request Optional request options.
   */
  delete(keys: string[], request?: ISdkRequestOptions): Promise<void>;
  /**
   * Deletes a history or a list of history objects from the store.
   * @param key A key or a list of keys.
   * @param request Optional request options.
   */
  async delete(key: string | string[], request: ISdkRequestOptions = {}): Promise<void> {
    const token = request.token || this.sdk.token;
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
   * @param request Optional request options.
   * @returns The history object
   */
  async read(key: string, request: ISdkRequestOptions = {}): Promise<IHttpHistory> {
    const token = request.token || this.sdk.token;
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
