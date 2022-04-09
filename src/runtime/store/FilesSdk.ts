import WebSocketNode from 'ws';
import { Patch } from '@api-client/json';
import { SdkBase, E_RESPONSE_STATUS, E_RESPONSE_NO_VALUE, E_INVALID_JSON, E_RESPONSE_UNKNOWN, E_RESPONSE_LOCATION, ISdkRequestOptions } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IListOptions, IListResponse } from '../../models/Backend.js';
import { AccessOperation } from '../../models/store/Permission.js';
import { IUser } from '../../models/store/User.js';
import { IFile } from '../../models/store/File.js';
import { Kind as ProjectKind } from '../../models/Project.js';
import { Kind as WorkspaceKind } from '../../models/Workspace.js';
import { IHttpProject } from '../../models/HttpProject.js';
import { SdkError } from './Errors.js';

export interface IFileCreateOptions {
  /**
   * Optional parent file id.
   * When set it creates a file under this parent.
   */
  parent?: string;
}

export class FilesSdk extends SdkBase {
  /**
   * Lists files (spaces, projects, etc) in the store.
   * 
   * @param kinds the list of kinds to list. Spaces are always included.
   * @param options Optional query options.
   * @param request Optional request options.
   */
  async list(kinds: (typeof ProjectKind | typeof WorkspaceKind)[], options?: IListOptions, request: ISdkRequestOptions = {}): Promise<IListResponse<IFile>> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.files());
    this.sdk.appendListOptions(url, options);
    kinds.forEach(k => url.searchParams.append('kind', k));
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to list files. ';
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
    let data: IListResponse<IFile>;
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
   * Creates a file in the store.
   * 
   * @param file The definition of a file that extends the IFile interface or one of the supported by the server schemas.
   * @param opts Optional options when creating a file
   * @param request Optional request options.
   * @returns The key of the creates file.
   */
  async create(file: IFile | IHttpProject, opts: IFileCreateOptions = {}, request: ISdkRequestOptions = {}): Promise<string> {
    const token = request.token || this.sdk.token;
    const path = opts.parent ? RouteBuilder.file(opts.parent) : RouteBuilder.files();
    const url = this.sdk.getUrl(path);
    const body = JSON.stringify(file);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to create a file. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
    const location = result.headers.get('location');
    if (!location) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_LOCATION}`);
    }
    const id = location.split('/').pop();
    return id as string;
  }

  /**
   * Reads file metadata from the store.
   * 
   * @param key The file key
   * @param request Optional request options.
   * @returns THe file metadata
   */
  read(key: string, media: false, request?: ISdkRequestOptions): Promise<IFile>;
  /**
   * Reads file contents from the store.
   * 
   * @param key The file key
   * @param request Optional request options.
   * @returns THe file contents
   */
  read(key: string, media: true, request?: ISdkRequestOptions): Promise<unknown>;

  /**
   * Reads a user file definition from the store.
   * @param key The file key
   * @param media When true it reads file contents rather than metadata.
   * @param request Optional request options.
   */
  async read(key: string, media?: boolean, request: ISdkRequestOptions = {}): Promise<IFile | unknown> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.file(key));
    if (media) {
      url.searchParams.set('alt', 'media');
    }
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to read a file. ';
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
    let data: IFile;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!data.kind) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Reads a number of files in a bulk operation.
   * 
   * @param keys The list of keys to read. When the user has no access to the file it returns undefined 
   * in that place. It also inserts `undefined` in place of a file that doesn't exist.
   * @param request Optional request options.
   */
  async readBulk(keys: string[], request: ISdkRequestOptions = {}): Promise<IListResponse<IFile|undefined>> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.filesBulk());
    const body = JSON.stringify(keys);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to read files in bulk. ';
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
    let data: IListResponse<IFile | undefined>;
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
   * Patches file's meta in the store.
   * 
   * @param key The file key
   * @param value The patch to apply.
   * @param request Optional request options.
   */
  patch(key: string, value: Patch.JsonPatch, media: false, request?: ISdkRequestOptions): Promise<Patch.JsonPatch>;

  /**
   * Patches file's content in the store.
   * 
   * @param key The file key
   * @param value The patch to apply.
   * @param request Optional request options.
   */
  patch(key: string, value: Patch.JsonPatch, media: true, request?: ISdkRequestOptions): Promise<Patch.JsonPatch>;

  /**
   * Patches a file in the store.
   * @param key The key of the file to patch
   * @param value The JSON patch to be processed.
   * @param request Optional request options.
   * @returns The JSON patch to revert the change using the `@api-client/json` library
   */
  async patch(key: string, value: Patch.JsonPatch, media?: boolean, request: ISdkRequestOptions = {}): Promise<Patch.JsonPatch> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.file(key));
    if (media) {
      url.searchParams.set('alt', 'media');
    }
    const body = JSON.stringify(value);
    const result = await this.sdk.http.patch(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to patch a file. ';
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
    let data: any;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!data.revert) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data.revert as Patch.JsonPatch;
  }

  /**
   * Deletes the file in the store.
   * 
   * @param key The key of the file to delete.
   * @param request Optional request options.
   */
  async delete(key: string, request: ISdkRequestOptions = {}): Promise<void> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.file(key));
    const result = await this.sdk.http.delete(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to delete a file. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
  }

  /**
   * Updates the sharing options of the file.
   * 
   * @param key The file key
   * @param value The patch operation on the file's ACL
   * @param request Optional request options.
   */
  async patchUsers(key: string, value: AccessOperation[], request: ISdkRequestOptions = {}): Promise<void> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.fileUsers(key));
    const body = JSON.stringify(value);
    const result = await this.sdk.http.patch(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to patch a file. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      let e = this.createGenericSdkError(result.body)
      if (!e) {
        e = new SdkError(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`, result.status);
        e.response = result.body;
      }
      throw e;
    }
  }

  /**
   * Lists uses having access to the file.
   * 
   * @param key The file key
   * @param request Optional request options.
   */
  async listUsers(key: string, request: ISdkRequestOptions = {}): Promise<IListResponse<IUser>> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.fileUsers(key));
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to list users in the file. ';
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
    let data: IListResponse<IUser>;
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
   * Creates a WS client that listens to the files events.
   * @param request Optional request options.
   */
  async observeFiles(request: ISdkRequestOptions = {}): Promise<WebSocketNode | WebSocket> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.files());
    return this.sdk.ws.createAndConnect(url.toString(), token);
  }
}
