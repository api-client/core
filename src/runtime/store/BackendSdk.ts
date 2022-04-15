import { SdkBase } from './SdkBase.js';
import { RouteBuilder } from './RouteBuilder.js';
import { IBackendInfo } from '../../models/store/Backend.js';

export class BackendSdk extends SdkBase {
  /**
   * @returns Client information about the store configuration.
   */
  async getInfo(): Promise<IBackendInfo> {
    const url = this.sdk.getUrl(RouteBuilder.backend());
    const result = await this.sdk.http.get(url.toString());
    this.inspectCommonStatusCodes(result.status);
    if (result.status !== 200) {
      throw new Error(`Invalid store response. Expected 200 status and ${result.status} received.`);
    }
    const body = result.body as string;
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      throw new Error(`The server returned invalid response. Unable to read store status.`);
    }
    return data as IBackendInfo;
  }
}
