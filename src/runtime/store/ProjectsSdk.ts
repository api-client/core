import { JsonPatch } from 'json8-patch';
import { SdkBase, E_RESPONSE_STATUS, E_RESPONSE_NO_VALUE, E_INVALID_JSON, E_RESPONSE_UNKNOWN, E_RESPONSE_LOCATION } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IListOptions, IListResponse } from '../../models/Backend.js';
import { HttpProject, IHttpProject, Kind as HttpProjectKind } from '../../models/HttpProject.js';

export class ProjectsSdk extends SdkBase {
  /**
   * Creates a project in a user space.
   * 
   * @param space The user space key
   * @param project THe project to create
   * @returns The key of the created project.
   */
  async create(space: string, project: IHttpProject | HttpProject): Promise<string> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.spaceProjects(space));
    const body = JSON.stringify(project);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to create a project. ';
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
   * Reads a project definition from the store.
   * @param space The user space key
   * @param project The project key
   * @returns The definition of the project.
   */
  async read(space: string, project: string): Promise<IHttpProject> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.spaceProject(space, project));
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to read a project. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IHttpProject;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (data.kind !== HttpProjectKind) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Lists projects in the space
   * 
   * @param space The user space key
   * @param options Optional query options.
   */
  async list(space: string, options?: IListOptions): Promise<IListResponse> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.spaceProjects(space));
    this.sdk.appendListOptions(url, options);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to list projects. ';
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
   * Deletes a project form the store.
   * 
   * @param space The key of the parent space.
   * @param project The key of the project to delete.
   */
  async delete(space: string, project: string): Promise<void> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.spaceProject(space, project));
    const result = await this.sdk.http.delete(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to delete a project. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
  }

  /**
   * Patches a project in the store.
   * @param space The key of the parent user space
   * @param project The key of project to patch.
   * @param value The JSON patch to be processed.
   * @returns The JSON patch to revert the change using the `json8-patch` library
   */
  async patch(space: string, project: string, value: JsonPatch): Promise<JsonPatch> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.spaceProject(space, project));
    const body = JSON.stringify(value);
    const result = await this.sdk.http.patch(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to patch a project. ';
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
}
