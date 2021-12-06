import * as DataUtils from './DataUtils.js';
import { IHttpRequest } from '../../../models/HttpRequest.js';
import { IHttpResponse } from '../../../models/HttpResponse.js';
import { IErrorResponse } from '../../../models/ErrorResponse.js';
import { IDataSourceConfiguration } from '../../../models/actions/Condition.js';
import { ActionTypeEnum } from '../../../models/actions/Enums.js';
import { Headers } from '../../headers/Headers.js';
import { Payload } from '../../transformers/PayloadSerializer.js';

/**
 * A class to extract data from JSON or XML body.
 *
 * The `request` is ARC request object as described in
 * https://github.com/advanced-rest-client/api-components-api/blob/master/docs/
 * api-request-and-response.md#api-request document.
 * It should contain at lease `url`, `method`, `headers`, and `payload`
 *
 * The `response` is a "response" property of the `api-response` custom event
 * as described in
 * https://github.com/advanced-rest-client/api-components-api/blob/master/docs/
 * api-request-and-response.md#api-response.
 * It should contain `status`, `payload`, `headers` and `url` properties.
 * The `url` property should be the final request URL after all redirects.
 *
 * Note: This element uses `URLSearchParams` class which is relatively new
 * interface in current browsers. You may need to provide a polyfill if you
 * are planning to use this component in older browsers.
 */
export class RequestDataExtractor {
  /**
   * The request that has been sent to the server.
   */
  request: IHttpRequest;
  /**
   * The response object
   */
  response?: IHttpResponse | IErrorResponse;
  constructor(request: IHttpRequest, response?: IHttpResponse | IErrorResponse) {
    this.request = request;
    this.response = response;
  }

  /**
   * Reads the data from the selected path.
   * 
   * @param config The configuration of the data source
   * @return Data to be processed
   */
  async extract(config: IDataSourceConfiguration): Promise<string | number | URLSearchParams | Headers | undefined> {
    const { type, source, path, value, iteratorEnabled, iterator } = config;
    if (source === 'value') {
      return value;
    }
    const it = iteratorEnabled === false ? undefined : iterator;
    const args = path ? path.split('.') : [];
    switch (source) {
      case 'url':
        return DataUtils.getDataUrl(this.getUrl(), args);
      case 'headers':
        return DataUtils.getDataHeaders(this.getHeaders(type), args);
      case 'status':
        return this.response && this.response.status;
      case 'method':
        return this.request.method;
      case 'body':
        return DataUtils.getDataPayload(this.getBody(type), this.getHeaders(type), args, it);
      default:
        throw new Error(`Unknown source ${source} for ${type} data`);
    }
  }

  /**
   * @param source The source name 
   * @returns The URL of the request
   */
  getUrl(): string {
    return this.request.url;
  }

  /**
   * @param source The source name 
   * @returns The headers from the request / response
   */
  getHeaders(source?: ActionTypeEnum): string {
    if (source === 'request') {
      return this.request.headers || '';
    }
    return this.response && this.response.headers || '';
  }

  /**
   * @param source The source name 
   * @returns The headers from the request / response
   */
  getBody(source?: ActionTypeEnum): Payload | undefined {
    if (source === 'request') {
      return this.request.payload;
    }
    return this.response && this.response.payload;
  }
}
