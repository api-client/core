import * as DataUtils from './DataUtils.js';
import { IHttpRequest, HttpRequest } from '../models/HttpRequest.js';
import { ISentRequest, SentRequest } from '../models/SentRequest.js';
import { IHttpResponse, HttpResponse } from '../models/HttpResponse.js';
import { IErrorResponse, ErrorResponse } from '../models/ErrorResponse.js';
import { ActionRequestDataEnum, ActionResponseDataEnum, ActionSourceEnum } from '../models/http-actions/HttpActions.js';
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
   * @param source The source of the data to read. Note, variables are not supported here.
   * @param data The kind of data to read the value from
   * @param path The path to the data.
   * @return Data to be processed
   */
  async extract(source: ActionSourceEnum, data?: ActionRequestDataEnum | ActionResponseDataEnum, path?: string): Promise<string | number | undefined> {
    const args = path ? path.split('.') : [];
    switch (data) {
      case 'url':
        return DataUtils.getDataUrl(this.getUrl(), args);
      case 'headers':
        return DataUtils.getDataHeaders(this.getHeaders(source), args);
      case 'status':
        return this.response && this.response.status;
      case 'method':
        return this.request.method;
      case 'body':
        return this.processBody(path, source);
      default:
        throw new Error(`Unknown data ${data} for ${source} data`);
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
  getHeaders(source?: ActionSourceEnum): string {
    if (source === 'request') {
      return this.request.headers || '';
    }
    return this.response && this.response.headers || '';
  }

  async processBody(path?: string, source?: ActionSourceEnum): Promise<string | undefined> {
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
  async getBody(source?: ActionSourceEnum): Promise<string | undefined> {
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
