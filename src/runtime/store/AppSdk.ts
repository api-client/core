import { SdkBase, E_RESPONSE_STATUS, E_RESPONSE_NO_VALUE, E_INVALID_JSON, E_RESPONSE_UNKNOWN, ISdkRequestOptions } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IBatchDeleteResult, IBatchReadResult, IBatchUpdate, IBatchUpdateResult, IDeleteRecord, IListOptions, IListResponse, IPatchInfo, IPatchRevision, IRevertResponse } from '../../models/store/Backend.js';
import { AppRequest, IAppRequest, Kind as AppRequestKind } from '../../models/AppRequest.js';
import { AppProject, IAppProject, AppProjectKind } from '../../models/AppProject.js';
import { Sdk } from './Sdk.js';
import { SdkError } from './Errors.js';

/**
 * SDK for the Application HTTP requests.
 */
export class AppRequestsSdk extends SdkBase {
  /**
   * Adds a single HTTP request to the app.
   * 
   * @param value The HTTP request to add.
   * @param appId The application id for which to create the request.
   * @param request Optional request options
   * @returns The created AppRequest with updated server-side properties.
   */
  async create(value: IAppRequest | AppRequest, appId: string, request: ISdkRequestOptions = {}): Promise<IAppRequest> {
    if (!value) {
      throw new Error(`Expected a value when inserting an app request.`);
    }
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appRequests(appId));
    const body = JSON.stringify(value);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to create the app request. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IAppRequest;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (data.kind !== AppRequestKind) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Lists application requests.
   * 
   * @param appId The application id to which lists the requests.
   * @param options List query options.
   * @param request Optional request options
   * @returns The list response with `AppRequest`s
   */
  async list(appId: string, options?: IListOptions, request: ISdkRequestOptions = {}): Promise<IListResponse<IAppRequest>> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appRequests(appId));
    this.sdk.appendListOptions(url, options);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to list app request. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IListResponse<IAppRequest>;
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

  /**
   * Creates a number of `AppRequest`s in a batch operation.
   * 
   * @param values The `AppRequest`s list to insert.
   * @param appId The application id generating these requests.
   * @param request Optional request options
   * @returns The ordered list of created requests.
   */
  async createBatch(values: (IAppRequest | AppRequest)[], appId: string, request: ISdkRequestOptions = {}): Promise<IBatchUpdateResult> {
    if (!Array.isArray(values)) {
      throw new Error(`Expected a value when inserting app request list.`);
    }
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appRequestsBatchCreate(appId));
    const content: IBatchUpdate = {
      items: values,
    };
    const body = JSON.stringify(content);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to create a app request in bulk. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IBatchUpdateResult;
    try {
      data = JSON.parse(result.body) as IBatchUpdateResult;
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!Array.isArray(data.items)) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Reads `AppRequest`s in a batch operation.
   * 
   * @param keys The list of request keys to read.
   * @param appId The application id that generated the app requests.
   * @param request Optional HTTP request options
   * @returns The ordered list of results. The undefined/null value means the object couldn't be read (does not exists or no access).
   */
  async readBatch(keys: string[], appId: string, request: ISdkRequestOptions = {}): Promise<IBatchReadResult<IAppRequest>> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appRequestsBatchRead(appId));
    const body = JSON.stringify(keys);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to read app request in bulk. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IBatchReadResult<IAppRequest>;
    try {
      data = JSON.parse(result.body) as IBatchReadResult<IAppRequest>;
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!Array.isArray(data.items)) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Deletes `AppRequest`s in a batch operation.
   * 
   * @param keys The list of request keys to delete.
   * @param appId The application id that generated the app requests.
   * @param request Optional HTTP request options
   * @returns A delete record for each request or null/undefined when couldn't delete the record.
   */
  async deleteBatch(keys: string[], appId: string, request: ISdkRequestOptions = {}): Promise<IBatchDeleteResult> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appRequestsBatchDelete(appId));
    const body = JSON.stringify(keys);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to delete a app request in bulk. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IBatchDeleteResult;
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

  /**
   * Restores previously deleted `AppRequest`s.
   * 
   * @param keys The list of keys of deleted records.
   * @param appId The application id that generated the app requests.
   * @param request Optional HTTP request options
   * @returns The ordered list of the restored requests. An item can be null/undefined when the service couldn't restore the request.
   */
  async undeleteBatch(keys: string[], appId: string, request: ISdkRequestOptions = {}): Promise<IRevertResponse<IAppRequest>> {
    if (!keys) {
      throw new Error(`The "records" argument is missing.`);
    }
    if (!Array.isArray(keys)) {
      throw new Error(`The "records" argument expected to be an array.`);
    }
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appRequestsBatchUndelete(appId));
    const body = JSON.stringify(keys);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to restore app request in bulk. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IRevertResponse<IAppRequest>;
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

  /**
   * Reads a single AppRequest entry from the store.
   * 
   * @param key The key of the request to read.
   * @param appId The application id that created this entry.
   * @param request Optional request options
   * @returns The stored AppRequest.
   */
  async read(key: string, appId: string, request: ISdkRequestOptions = {}): Promise<IAppRequest> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appRequestItem(appId, key));
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to read app request. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IAppRequest;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (data.kind !== AppRequestKind) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Deletes a single AppRequest.
   * 
   * @param key The key of the AppRequest to delete.
   * @param appId The application id that created this entry.
   * @param request Optional request options
   * @returns The delete record for the request.
   */
  async delete(key: string, appId: string, request: ISdkRequestOptions = {}): Promise<IDeleteRecord> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appRequestItem(appId, key));
    url.searchParams.set('appId', appId);
    const result = await this.sdk.http.delete(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to delete a app request. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    return { key };
  }

  /**
   * Patches an app request in the store.
   * 
   * @param key The key of the request to patch
   * @param value The JSON patch to be processed.
   * @param request Optional HTTP request options.
   * @returns The JSON patch to revert the change using the `@api-client/json` library
   */
  async patch(key: string, appId: string, value: IPatchInfo, request: ISdkRequestOptions = {}): Promise<IPatchRevision> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appRequestItem(appId, key));
    const body = JSON.stringify(value);
    const result = await this.sdk.http.patch(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to patch an app project. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IPatchRevision;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    // revert is added to the response
    if (!data.revert) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }
}

/**
 * SDK for the Application projects.
 */
export class AppProjectsSdk extends SdkBase {
  /**
   * Adds a single project to the app.
   * 
   * @param value The project to add.
   * @param appId The application id for which to create the project.
   * @param request Optional request options
   * @returns The created project with updated server-side properties.
   */
  async create(value: IAppProject | AppProject, appId: string, request: ISdkRequestOptions = {}): Promise<IAppProject> {
    if (!value) {
      throw new Error(`Expected a value when inserting an app project.`);
    }
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appProjects(appId));
    const body = JSON.stringify(value);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to create the app project. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IAppProject;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (data.kind !== AppProjectKind) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Lists application projects.
   * 
   * @param appId The application id to which lists the projects.
   * @param options List query options.
   * @param request Optional request options
   * @returns The list response with `AppProject`s
   */
  async list(appId: string, options?: IListOptions, request: ISdkRequestOptions = {}): Promise<IListResponse<IAppProject>> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appProjects(appId));
    this.sdk.appendListOptions(url, options);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to list app project. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IListResponse<IAppProject>;
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

  /**
   * Creates a number of `AppProject`s in a batch operation.
   * 
   * @param values The `AppProject`s list to insert.
   * @param appId The application id generating these projects.
   * @param request Optional request options
   * @returns The ordered list of created projects.
   */
  async createBatch(values: (IAppProject | AppProject)[], appId: string, request: ISdkRequestOptions = {}): Promise<IBatchUpdateResult> {
    if (!Array.isArray(values)) {
      throw new Error(`Expected a value when inserting app project list.`);
    }
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appProjectsBatchCreate(appId));
    const content: IBatchUpdate = {
      items: values,
    };
    const body = JSON.stringify(content);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to create a app project in bulk. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IBatchUpdateResult;
    try {
      data = JSON.parse(result.body) as IBatchUpdateResult;
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!Array.isArray(data.items)) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Reads `AppProject`s in a batch operation.
   * 
   * @param keys The list of project keys to read.
   * @param appId The application id that generated the app projects.
   * @param request Optional HTTP request options
   * @returns The ordered list of results. The undefined/null value means the object couldn't be read (does not exists or no access).
   */
  async readBatch(keys: string[], appId: string, request: ISdkRequestOptions = {}): Promise<IBatchReadResult<IAppProject>> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appProjectsBatchRead(appId));
    const body = JSON.stringify(keys);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to read app project in bulk. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IBatchReadResult<IAppProject>;
    try {
      data = JSON.parse(result.body) as IBatchReadResult<IAppProject>;
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!Array.isArray(data.items)) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Deletes `AppProject`s in a batch operation.
   * 
   * @param keys The list of project keys to delete.
   * @param appId The application id that generated the app projects.
   * @param request Optional HTTP request options
   * @returns A delete record for each project or null/undefined when couldn't delete the record.
   */
  async deleteBatch(keys: string[], appId: string, request: ISdkRequestOptions = {}): Promise<IBatchDeleteResult> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appProjectsBatchDelete(appId));
    const body = JSON.stringify(keys);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to delete a app project in bulk. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IBatchDeleteResult;
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

  /**
   * Restores previously deleted `AppProject`s.
   * 
   * @param keys The list of keys of deleted records.
   * @param appId The application id that generated the app projects.
   * @param request Optional HTTP request options
   * @returns The ordered list of the restored projects. An item can be null/undefined when the service couldn't restore the project.
   */
  async undeleteBatch(keys: string[], appId: string, request: ISdkRequestOptions = {}): Promise<IRevertResponse<IAppProject>> {
    if (!keys) {
      throw new Error(`The "records" argument is missing.`);
    }
    if (!Array.isArray(keys)) {
      throw new Error(`The "records" argument expected to be an array.`);
    }
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appProjectsBatchUndelete(appId));
    const body = JSON.stringify(keys);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to restore app project in bulk. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IRevertResponse<IAppProject>;
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

  /**
   * Reads a single AppProject entry from the store.
   * 
   * @param key The key of the project to read.
   * @param appId The application id that created this entry.
   * @param request Optional request options
   * @returns The stored AppProject.
   */
  async read(key: string, appId: string, request: ISdkRequestOptions = {}): Promise<IAppProject> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appProjectItem(appId, key));
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to read app project. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IAppProject;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (data.kind !== AppProjectKind) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Deletes a single `AppProject`.
   * 
   * @param key The key of the `AppProject` to delete.
   * @param appId The application id that created this entry.
   * @param request Optional request options
   * @returns The delete record for the project.
   */
  async delete(key: string, appId: string, request: ISdkRequestOptions = {}): Promise<IDeleteRecord> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appProjectItem(appId, key));
    url.searchParams.set('appId', appId);
    const result = await this.sdk.http.delete(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to delete a app project. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    return { key };
  }

  /**
   * Patches an app project in the store.
   * 
   * @param key The key of the project to patch
   * @param value The JSON patch to be processed.
   * @param request Optional request options.
   * @returns The JSON patch to revert the change using the `@api-client/json` library
   */
  async patch(key: string, appId: string, value: IPatchInfo, request: ISdkRequestOptions = {}): Promise<IPatchRevision> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.appProjectItem(appId, key));
    const body = JSON.stringify(value);
    const result = await this.sdk.http.patch(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to patch an app project. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IPatchRevision;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    // revert is added to the response
    if (!data.revert) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }
}

/**
 * Sdk used by the HTTP Client.
 */
export class AppSdk extends SdkBase {
  requests: AppRequestsSdk;
  projects: AppProjectsSdk;

  constructor(sdk: Sdk) {
    super(sdk);
    this.requests = new AppRequestsSdk(sdk);
    this.projects = new AppProjectsSdk(sdk);
  }
}
