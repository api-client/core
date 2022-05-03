import WebSocketNode from 'ws';
import { SdkBase, E_RESPONSE_STATUS, E_RESPONSE_NO_VALUE, E_INVALID_JSON, E_RESPONSE_UNKNOWN, E_RESPONSE_LOCATION, ISdkRequestOptions } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IListOptions, IListResponse, IPatchInfo, IPatchRevision, IAccessPatchInfo } from '../../models/store/Backend.js';
import { IUser } from '../../models/store/User.js';
import { IFile } from '../../models/store/File.js';
import { Kind as ProjectKind } from '../../models/Project.js';
import { Kind as WorkspaceKind } from '../../models/Workspace.js';
import { Kind as DataNamespaceKind } from '../../models/data/DataNamespace.js';
import { SdkError } from './Errors.js';

export interface IMetaCreateOptions {
  /**
   * Optional parent file id.
   * When set it creates a file under this parent.
   */
  parent?: string;
}

export interface IMediaCreateOptions {
  /**
   * Optional contents mime type.
   * Default to `application/json`.
   */
  mime?: string;
}

export interface IFileCreateOptions extends IMetaCreateOptions, IMediaCreateOptions {

}

export type ListFileKind = typeof ProjectKind | typeof WorkspaceKind | typeof DataNamespaceKind;

/**
 * In the store, the file is represented by the meta and the media.
 * 
 * The meta is used to represent the file in the UI when listing files or presenting their metadata (like name, last modified, etc).
 * The media is the actual contents of the file and is only used by application specializing in this file modification.
 */
export class FilesSdk extends SdkBase {
  /**
   * Lists files (spaces, projects, etc) in the store.
   * 
   * @param kinds Optional list of kinds to limit the file types in the result. Spaces are always included.
   * @param options Optional query options.
   * @param request Optional request options.
   */
  async list(kinds?: ListFileKind[], options?: IListOptions, request: ISdkRequestOptions = {}): Promise<IListResponse<IFile>> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.files());
    this.sdk.appendListOptions(url, options);
    if (Array.isArray(kinds)) {
      kinds.forEach(k => url.searchParams.append('kind', k));
    }
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
   * Creates both the meta and the media for a file.
   * 
   * @param meta The file meta
   * @param contents The file contents
   * @param opts Meta and media create options. 
   * @param request Optional request details
   * @returns The id of the created file meta.
   */
  async create(meta: IFile, contents: unknown, opts: IFileCreateOptions = {}, request: ISdkRequestOptions = {}): Promise<string> {
    const id = await this.createMeta(meta, opts, request);
    await this.createMedia(contents, id, opts, request);
    return id;
  }

  /**
   * Creates a file in the store.
   * 
   * @param file The definition of a file that extends the IFile interface.
   * @param opts Optional options when creating a file
   * @param request Optional request options.
   * @returns The key of the creates file.
   */
  async createMeta(file: IFile, opts: IMetaCreateOptions = {}, request: ISdkRequestOptions = {}): Promise<string> {
    const token = request.token || this.sdk.token;
    const path = RouteBuilder.files();
    const url = this.sdk.getUrl(path);
    if (opts.parent) {
      url.searchParams.set('parent', opts.parent);
    }
    const body = JSON.stringify(file);
    const result = await this.sdk.http.post(url.toString(), { 
      token, 
      body,
      headers: {
        'content-type': 'application/json'
      },
    });
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
   * Creates a file contents (the media) after the file meta was created.
   * 
   * @param contents The file contents to upload to the server.
   * @param key The created file meta key.
   * @param opts Contents create options. You can define content's mime type here.
   * @param request Optional request.
   */
  async createMedia(contents: unknown, key: string, opts: IMediaCreateOptions = {}, request: ISdkRequestOptions = {}): Promise<void> {
    const token = request.token || this.sdk.token;
    const path = RouteBuilder.file(key);
    const url = this.sdk.getUrl(path);
    url.searchParams.set('alt', 'media');
    const mime = opts.mime || 'application/json';
    let body: string;
    if (mime.includes('json')) {
      body = JSON.stringify(contents);
    } else {
      body = String(contents);
    }
    const result = await this.sdk.http.put(url.toString(), { 
      token, 
      body,
      headers: {
        'content-type': mime
      },
    });
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
  patch(key: string, value: IPatchInfo, media: false, request?: ISdkRequestOptions): Promise<IPatchRevision>;

  /**
   * Patches file's content in the store.
   * 
   * @param key The file key
   * @param value The patch to apply.
   * @param request Optional request options.
   */
  patch(key: string, value: IPatchInfo, media: true, request?: ISdkRequestOptions): Promise<IPatchRevision>;

  /**
   * Patches a file in the store.
   * @param key The key of the file to patch
   * @param value The JSON patch to be processed.
   * @param request Optional request options.
   * @returns The JSON patch to revert the change using the `@api-client/json` library
   */
  async patch(key: string, value: IPatchInfo, media?: boolean, request: ISdkRequestOptions = {}): Promise<IPatchRevision> {
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
  async patchUsers(key: string, value: IAccessPatchInfo, request: ISdkRequestOptions = {}): Promise<void> {
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

  /**
   * Creates a WS client that listens to the file events.
   * 
   * @param key The file key to observe
   * @param media Whether to observe changes to the file media instead of meta.
   * @param request Optional request options.
   */
  async observeFile(key: string, media?: boolean, request: ISdkRequestOptions = {}): Promise<WebSocketNode | WebSocket> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.file(key));
    if (media) {
      url.searchParams.set('alt', 'media');
    }
    return this.sdk.ws.createAndConnect(url.toString(), token);
  }
}
