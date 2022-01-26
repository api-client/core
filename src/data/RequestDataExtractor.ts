import * as DataUtils from './DataUtils.js';
import { IHttpRequest, HttpRequest } from '../models/HttpRequest.js';
import { ISentRequest, SentRequest } from '../models/SentRequest.js';
import { IHttpResponse, HttpResponse } from '../models/HttpResponse.js';
import { IErrorResponse, ErrorResponse } from '../models/ErrorResponse.js';
import { IDataSource } from '../models/actions/Condition.js';
import { ActionTypeEnum } from '../models/actions/Enums.js';
import { Headers } from '../lib/headers/Headers.js';
import { JsonReader } from './JsonReader.js';
import { XmlReader } from './XmlReader.js';
import { UrlEncodedReader } from './UrlEncodedReader.js';
import { DataReader } from './DataReader.js';

/**
 * A class to extract data from the request or the response.
 */
export class RequestDataExtractor {
  /**
   * The request that has been sent to the server.
   */
  request: HttpRequest | SentRequest;
  /**
   * The response object
   */
  response?: HttpResponse | ErrorResponse;
  constructor(request: IHttpRequest | ISentRequest, response?: IHttpResponse | IErrorResponse) {
    this.request = new HttpRequest(request);
    if (response) {
      if (ErrorResponse.isErrorResponse(response)) {
        this.response = new ErrorResponse(response as IErrorResponse);
      } else {
        this.response = new HttpResponse(response);
      }
    }
  }

  /**
   * Reads the data from the selected path.
   * 
   * @param config The configuration of the data source
   * @return Data to be processed
   */
  async extract(config: IDataSource): Promise<string | number | undefined> {
    const { type, source, path, value } = config;
    if (source === 'value') {
      return value;
    }
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
        return this.processBody(path, type);
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

  async processBody(path?: string, source?: ActionTypeEnum): Promise<string | undefined> {
    const value = await this.getBody(source);
    if (!value) {
      return undefined;
    }
    if (!path) {
      return value;
    }
    const headersValue = this.getHeaders(source);
    if (!headersValue) {
      return undefined;
    }
    const headers = new Headers(headersValue);
    const mime = headers.get('content-type');
    if (!mime) {
      return undefined;
    }
    return this.extractBody(value, mime, path);
  }

  /**
   * @param source The source name 
   * @returns The headers from the request / response
   */
  async getBody(source?: ActionTypeEnum): Promise<string | undefined> {
    if (source === 'request') {
      return this.request.readPayloadAsString();
    }
    if (this.response) {
      return this.response.readPayloadAsString();
    }
    return undefined;
  }

  async extractBody(value: string, mime: string, path: string): Promise<string | undefined> {
    let reader: DataReader | undefined;
    if (mime.includes('json')) {
      reader = new JsonReader();
    } else if (mime.includes('xml')) {
      reader = new XmlReader();
    } else if (mime.includes('x-www-form-urlencoded')) {
      reader = new UrlEncodedReader();
    }
    if (!reader) {
      return undefined;
    }
    await reader.writePayload(value);
    return reader.getValue(path) as Promise<string>;
  }
}
