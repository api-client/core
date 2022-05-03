import { SdkBase, E_RESPONSE_STATUS, E_RESPONSE_NO_VALUE, E_INVALID_JSON, E_RESPONSE_UNKNOWN, ISdkRequestOptions } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IListOptions, IListResponse } from '../../models/store/Backend.js';
import { IFile } from '../../models/store/File.js';
import { SdkError } from './Errors.js';
import { ListFileKind } from './FilesSdk.js';

export class SharedSdk extends SdkBase {
  /**
   * Lists shared with the user spaces.
   * 
   * @param kinds the list of kinds to list. Spaces are always included.
   * @param options Optional query options.
   * @param request Optional request options.
   */
  async list(kinds?: ListFileKind[], options?: IListOptions, request: ISdkRequestOptions = {}): Promise<IListResponse<IFile>> {
    const token = request.token || this.sdk.token;
    const url = this.sdk.getUrl(RouteBuilder.shared());
    this.sdk.appendListOptions(url, options);
    if (Array.isArray(kinds)) {
      kinds.forEach(k => url.searchParams.append('kind', k));
    }
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status, result.body);
    const E_PREFIX = 'Unable to list spaces. ';
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
      throw new SdkError(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`, 0);
    }
    let data: IListResponse<IFile>;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      const err = new SdkError(`${E_PREFIX}${E_INVALID_JSON}.`, 0);
      err.response = result.body;
      throw err;
    }
    if (!Array.isArray(data.data)) {
      const err = new SdkError(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`, 0);
      err.response = result.body;
      throw err;
    }
    return data;
  }
}
