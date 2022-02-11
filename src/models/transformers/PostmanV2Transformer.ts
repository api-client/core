/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

import { dataValue } from './BaseTransformer.js';
import { PostmanTransformer, paramValue } from './PostmanTransformer.js';
import { aTimeout } from './ImportUtils.js';
import { ArcExportObject, ExportArcSavedRequest, ExportArcProjects } from '../legacy/DataExport.js';

export const currentItemValue = Symbol('currentItemValue');

interface PostmanInfo {
  /**
   * Name of the collection
   */
  name: string;
  /**
   * This should ideally hold a link to the Postman schema that is used to validate this collection. E.g: https://schema.getpostman.com/collection/v1
   */
  schema: string;
  /**
   * Every collection is identified by the unique value of this field. The value of this field is usually easiest to generate using a UID generator function. If you already have a collection, it is recommended that you maintain the same id since changing the id usually implies that is a different collection than it was originally.\n *Note: This field exists for compatibility reasons with Collection Format V1.
   */
  _postman_id?: string;
  description?: string;
}

interface PostmanRequestUrl {
  raw?: string;
  protocol?: string;
  host?: string | string[];
  path?: string | string[];
  port?: string;
}
interface PostmanParameter {
  key?: string|null;
  value?: string|null;
  disabled?: boolean;
  description?: string;
}
interface PostmanRequestUrlQuery extends PostmanParameter {
}
interface PostmanHeader extends PostmanParameter {
}
interface PostmanUrlEncoded extends PostmanParameter {
  type?: string;
}
interface PostmanFormData extends PostmanParameter {
  type?: string;
  src?: string;
  contentType?: string;
}
interface PostmanFile {
  src: string|null;
  contentType?: string;
}
interface PostmanBody {
  mode: string | null;
  raw?: string;
  urlencoded?: PostmanUrlEncoded[];
  formdata?: PostmanFormData[];
  file?: PostmanFile;
}

interface PostmanRequest {
  url?: string | PostmanRequestUrl;
  method?: string;
  description?: string;
  header?: string|PostmanHeader[];
  body?: PostmanBody;
}

interface PostmanResponse {
}

interface PostmanItem {
  /**
   * A unique ID that is used to identify collections internally
   */
  id?: string;
  /**
   * Name of the collection
   */
  name?: string;
  description?: string;
  request: PostmanRequest;
  response?: PostmanResponse[];
}

interface PostmanItemGroup {
  /**
   * A folder's friendly name is defined by this field. You would want to set this field to a value that would allow you to easily identify this folder.
   */
  name?: string;
  description?: string;
  item: PostmanItem[] | PostmanItemGroup[];
}

interface PostmanV2 {
  variables?: any[];
  info: PostmanInfo;
  item: PostmanItem[] | PostmanItemGroup[];
}

/**
 * Transforms Postman v2 collections to ARC import object.
 */
export class PostmanV2Transformer extends PostmanTransformer {
  chunkSize = 200;
  [currentItemValue] = 0;

  /**
   * Transforms `_data` into ARC data model.
   * @returns Promise resolved when data are transformed.
   */
  async transform(): Promise<ArcExportObject> {
    const requests = await this.readRequestsData();
    const project = this.readProjectInfo(requests);
    const result: ArcExportObject = {
      createdAt: new Date().toISOString(),
      version: 'postman-collection-v2',
      kind: 'ARC#Import',
      requests,
      projects: [project],
    };
    return result;
  }

  /**
   * Creates the project model based on Postman collection
   *
   * @param requests list of read requests
   * @return Arc project data model.
   */
  readProjectInfo(requests: ExportArcSavedRequest[]): ExportArcProjects {
    const raw = /** @type PostmanV2 */ (this[dataValue]);
    const { info } = raw;
    const time = Date.now();
    const result: ExportArcProjects = {
      kind: 'ARC#ProjectData',
      key: info._postman_id,
      name: info.name,
      description: info.description,
      created: time,
      updated: time,
      order: 0
    };
    if (requests && requests.length) {
      result.requests = requests.map((item) => item._id) as string[];
    }
    return result;
  }

  /**
   * Iterates over collection requests array and transforms objects
   * to ARC requests.
   *
   * @returns Promise resolved to list of ARC request objects.
   */
  async readRequestsData(): Promise<ExportArcSavedRequest[]> {
    const raw = this[dataValue] as PostmanV2;
    const data = raw.item;
    if (!data || !data.length) {
      return [];
    }
    return this.extractRequestsV2(data);
  }

  /**
   * Extracts all requests in order from postman v2 collection.
   *
   * @param data List of Postman V2 collection `item`. (why it's called item and not items?)
   * @param result Array where to append results.
   * @return Promise resolved when all objects are computed.
   */
  async extractRequestsV2(data: (PostmanItem|PostmanItemGroup)[], result: ExportArcSavedRequest[]=[]): Promise<ExportArcSavedRequest[]> {
    const item = data.shift();
    if (!item) {
      return result;
    }
    const group = item as PostmanItemGroup;
    // is it a folder?
    if (group.item) {
      await this.extractRequestsV2(group.item, result);
      // Array is passed by reference so it can be reused here
      return this.extractRequestsV2(data, result);
    }
    const arcRequest = this.computeArcRequest(item as PostmanItem);
    result.push(arcRequest);
    const currIt = this[currentItemValue];
    if (currIt === this.chunkSize) {
      await aTimeout(16);
      this[currentItemValue] = 0;
      return this.extractRequestsV2(data, result);
    }
    this[currentItemValue] = currIt + 1;
    return this.extractRequestsV2(data, result);
  }

  /**
   * Computes ARC request out of Postman v2 item.
   *
   * @param item Postman v2 item.
   * @return ARC request object.
   */
  computeArcRequest(item: PostmanItem): ExportArcSavedRequest {
    const { request } = item;
    const name = item.name || 'unnamed';
    let url: string;
    if (typeof request.url === 'string') {
      url = request.url;
    } else if (request.url && request.url.raw) {
      url = request.url.raw;
    } else {
      url = 'http://';
    }
    url = this.ensureVariablesSyntax(url) as string;
    let method = request.method || 'GET';
    method = this.ensureVariablesSyntax(method) as string;
    const header = this.ensureVarsRecursively(request.header);
    const time = Date.now();
    const result: ExportArcSavedRequest = {
      kind: 'ARC#HttpRequest',
      name,
      url,
      method,
      created: time,
      updated: time,
      type: 'saved',
      headers: this.computeHeaders(header),
      key: '',
    };
    const raw = this[dataValue] as PostmanV2;
    const projectId = raw.info._postman_id;
    result.key = this.generateRequestId(result, projectId);
    if (request.body) {
      result.payload = this.computePayload(request.body, result);
    }
    this.addProjectReference(result, projectId);
    return result;
  }

  /**
   * Computes headers string from item's headers.
   *
   * @param headers Postman Request.header model.
   * @return Computed value of headers.
   */
  computeHeaders(headers: string|PostmanHeader[]): string {
    if (typeof headers === 'string') {
      return headers;
    }
    if (!Array.isArray(headers)) {
      return '';
    }
    const tmp = headers.filter((h) => !h.disabled);
    return tmp.map((item) => `${item.key}: ${item.value}`).join('\n');
  }

  /**
   * Computes body value for v2 request.body.
   *
   * @param body v2 request.body
   * @param item ARC request object.
   * @return Body value as string.
   */
  computePayload(body: PostmanBody, item: ExportArcSavedRequest): string|undefined {
    if (!body.mode) {
      return '';
    }
    const def = body[body.mode as keyof PostmanBody];
    if (!def) {
      return '';
    }
    switch (body.mode) {
      case 'raw': return this.ensureVariablesSyntax(body.raw);
      case 'formdata': return this.formDataBody(def as PostmanFormData[], item);
      case 'urlencoded': return this.urlEncodedBody(def as PostmanUrlEncoded[]);
      default: return '';
    }
  }

  /**
   * Computes body as a FormData data model.
   * This function sets `multipart` property on the item.
   *
   * @param items List of `formdata` models.
   * @param item ARC request object.
   * @return Body value. Always empty string.
   */
  formDataBody(items: PostmanFormData[], item: ExportArcSavedRequest): string {
    if (!Array.isArray(items)) {
      return '';
    }
    const body = this.ensureVarsRecursively(items) as PostmanFormData[];
    item.multipart = body.map((data) => {
      const obj: any = {
        enabled: !data.disabled,
        name: data.key,
        isFile: data.type === 'file',
        value: data.type === 'file' ? '' : data.value
      };
      return obj;
    });
    return '';
  }

  /**
   * Computes body as a URL encoded data model.
   *
   * @param items List of `urlencoded` models.
   * @returns Body value.
   */
  urlEncodedBody(items: PostmanUrlEncoded[]): string {
    if (!Array.isArray(items)) {
      return '';
    }
    const result: string[] = [];
    const model = [];
    const body = this.ensureVarsRecursively(items) as PostmanUrlEncoded[];
    body.forEach((data) => {
      const name = paramValue(data.key as string);
      const value = paramValue(data.value as string);
      model.push({
        name,
        value,
        enabled: !data.disabled
      });
      if (!data.disabled) {
        result.push(`${name}=${value}`);
      }
    });
    return result.join('&');
  }
}
