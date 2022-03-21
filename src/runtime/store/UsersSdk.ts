import { SdkBase, E_RESPONSE_STATUS, E_RESPONSE_NO_VALUE, E_INVALID_JSON, E_RESPONSE_UNKNOWN } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IListOptions, IListResponse } from '../../models/Backend.js';
import { IUser } from '../../models/User.js';

export class UsersSdk extends SdkBase {
  async me(): Promise<IUser> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.usersMe());
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to read a user. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IUser;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!data.key) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Lists users in the store
   * 
   * @param options Optional query options.
   */
  async list(options?: IListOptions): Promise<IListResponse> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.users());
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
   * Reads a user information from the store.
   * @param key The user key.
   * @returns The user object
   */
  async read(key: string): Promise<IUser> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.user(key));
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to read the user info. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IUser;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    return data;
  }
}
