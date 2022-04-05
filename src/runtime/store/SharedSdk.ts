import { SdkBase, E_RESPONSE_STATUS, E_RESPONSE_NO_VALUE, E_INVALID_JSON, E_RESPONSE_UNKNOWN } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IListOptions, IListResponse } from '../../models/Backend.js';

export class SharedSdk extends SdkBase {
  /**
   * Lists shared with the user spaces.
   * @param options Optional query options.
   */
  async list(options?: IListOptions): Promise<IListResponse> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(RouteBuilder.shared());
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
}
