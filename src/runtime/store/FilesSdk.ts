import { JsonPatch } from 'json8-patch';
import { SdkBase, E_RESPONSE_STATUS, E_RESPONSE_NO_VALUE, E_INVALID_JSON, E_RESPONSE_UNKNOWN, E_RESPONSE_LOCATION } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IListOptions, IListResponse } from '../../models/Backend.js';
import { IWorkspace, Workspace, Kind as WorkspaceKind } from '../../models/Workspace.js';
import { AccessOperation } from '../../models/store/Permission.js';
import { IUser } from '../../models/store/User.js';
import { IFile } from '../../models/store/File.js';
import WebSocketNode from 'ws';

export interface IFileCreateOptions {
  /**
   * Optional parent space id.
   * When set it creates a space under this parent.
   */
  parent?: string;
}

export class FilesSdk extends SdkBase {
  /**
   * Lists files (spaces, projects, etc) in the store.
   * @param options Optional query options.
   */
  async list(options?: IListOptions): Promise<IListResponse<IFile>> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.files());
    this.sdk.appendListOptions(url, options);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to list spaces. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
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
   * Creates a workspace in the store.
   * @param space The workspace definition.
   * @returns The key of the creates space.
   */
  async create(space: IWorkspace | Workspace, opts: IFileCreateOptions = {}): Promise<string> {
    const { token } = this.sdk;
    const path = opts.parent ? RouteBuilder.file(opts.parent) : RouteBuilder.files();
    const url = this.sdk.getUrl(path);
    const body = JSON.stringify(space);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to create a user space. ';
    if (result.status !== 204) {
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
   * Reads file metadata from the store.
   * 
   * @param key The file key
   * @returns THe file metadata
   */
  read(key: string, media: false): Promise<IFile>;
  /**
   * Reads file contents from the store.
   * 
   * @param key The file key
   * @returns THe file contents
   */
  read(key: string, media: true): Promise<unknown>;

  /**
   * Reads a user file definition from the store.
   * @param key The file key
   * @param media When true it reads file contents rather than metadata.
   */
  async read(key: string, media?: boolean): Promise<IFile | unknown> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.file(key));
    if (media) {
      url.searchParams.set('alt', 'media');
    }
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to read a user space. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IWorkspace;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (data.kind !== WorkspaceKind) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Patches file's meta in the store.
   * 
   * @param key The file key
   * @param value The patch to apply.
   */
  patch(key: string, value: JsonPatch, media: false): Promise<JsonPatch>;

  /**
   * Patches file's content in the store.
   * 
   * @param key The file key
   * @param value The patch to apply.
   */
  patch(key: string, value: JsonPatch, media: true): Promise<JsonPatch>;

  /**
   * Patches a user space in the store.
   * @param key The key of the user space to patch
   * @param value The JSON patch to be processed.
   * @returns The JSON patch to revert the change using the `json8-patch` library
   */
  async patch(key: string, value: JsonPatch, media?: boolean): Promise<JsonPatch> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.file(key));
    if (media) {
      url.searchParams.set('alt', 'media');
    }
    const body = JSON.stringify(value);
    const result = await this.sdk.http.patch(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to patch a user space. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
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
    return data.revert as JsonPatch;
  }

  /**
   * Deletes the space in the store.
   * 
   * @param key The key of the space to delete.
   */
  async delete(key: string): Promise<void> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.file(key));
    const result = await this.sdk.http.delete(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to delete a user space. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
  }

  /**
   * Updates the sharing options of the space.
   * 
   * @param key The user space key
   * @param value The patch operation on the space's ACL
   */
  async patchUsers(key: string, value: AccessOperation[]): Promise<void> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.fileUsers(key));
    const body = JSON.stringify(value);
    const result = await this.sdk.http.patch(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to patch a user space. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
  }

  /**
   * Lists uses having access to the user space.
   * 
   * @param key The user space key
   */
  async listUsers(key: string): Promise<IListResponse<IUser>> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.fileUsers(key));
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to list users in the space. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
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
   * Creates a WS client that listens to the spaces events.
   */
  async observeFiles(): Promise<WebSocketNode | WebSocket> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.files());
    return this.sdk.ws.createAndConnect(url.toString(), token);
  }
}
