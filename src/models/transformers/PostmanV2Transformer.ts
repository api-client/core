import { PostmanTransformer, dataValue, paramValue } from './PostmanTransformer.js';
import { HttpProject, IHttpProject, Kind as ProjectKind } from '../HttpProject.js';
import { ProjectFolder } from '../ProjectFolder.js';
import { ProjectRequest } from '../ProjectRequest.js';
import { IMultipartBody } from '../../lib/transformers/PayloadSerializer.js';
import v4 from '../../lib/uuid.js';
import { Environment } from '../Environment.js';

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
  header?: string|PostmanParameter[];
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

interface PostmanVariable {
  disabled?: boolean;
  key: string;
  value: string;
}

interface PostmanV2 {
  variable?: PostmanVariable[];
  info: PostmanInfo;
  item: PostmanItem[] | PostmanItemGroup[];
}

/**
 * Transforms Postman v2 collections to ARC import object.
 */
export class PostmanV2Transformer extends PostmanTransformer {
  /**
   * Transforms `_data` into ARC data model.
   * @returns Promise resolved when data are transformed.
   */
  async transform(): Promise<HttpProject> {
    const raw = this[dataValue] as PostmanV2;
    const project = this.createProject(raw);
    this.setProjectVariables(project, raw);
    if (Array.isArray(raw.item)) {
      for (const item of raw.item) {
        await this.addProjectItem(project, item);
      }
    }
    return project;
  }

  createProject(data: PostmanV2): HttpProject {
    const { info } = data;
    const init: IHttpProject = {
      kind: ProjectKind,
      definitions: [],
      environments: [],
      info: {
        kind: 'ARC#Thing',
        name: info.name || 'Unnamed Postman project',
      },
      items: [],
      key: info._postman_id || v4(),
    };
    if (info.description) {
      init.info.description = info.description;
    }
    const project = new HttpProject(init);
    return project;
  }

  setProjectVariables(project: HttpProject, collection: PostmanV2): void {
    const { variable } = collection;
    if (!Array.isArray(variable)) {
      return;
    }
    const env = Environment.fromName('Default');
    project.addEnvironment(env);
    variable.forEach((param) => {
      const { disabled=false, key, value } = param;

      const parsed = this.ensureVariablesSyntax(value) as string;
      const created = env.addVariable(key, parsed);
      created.enabled = !disabled;
    });
  }

  async addProjectItem(current: HttpProject | ProjectFolder, item: PostmanItem | PostmanItemGroup): Promise<void> {
    const typedGroup = item as PostmanItemGroup;
    if (typedGroup.item) {
      return this.addProjectFolder(current, typedGroup);
    }
    const typedItem = item as PostmanItem;
    if (typedItem.request) {
      return this.addProjectRequest(current, item as PostmanItem);
    }
    this.addLog('error', 'Error when adding an item to the project. Unable to determine item type. Tested for a folder and a request.');
  }

  async addProjectFolder(current: HttpProject | ProjectFolder, group: PostmanItemGroup): Promise<void> {
    const { description, name='Unnamed folder', item } = group;
    const created = current.addFolder(name);
    if (description) {
      created.info.description = description;
    }

    if (Array.isArray(item)) {
      for (const tmp of item) {
        await this.addProjectItem(created, tmp);
      }
    }
  }

  async addProjectRequest(current: HttpProject | ProjectFolder, item: PostmanItem): Promise<void> {
    const { request, description } = item;
    const name = item.name || 'Unnamed request';
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
    const headers = this.computeHeaders(header);

    const created = current.addRequest(url);
    created.info.name = name;
    if (request.description) {
      created.info.description = request.description;
    } else if (description) {
      created.info.description = description;
    }
    created.expects.method = method;
    if (headers) {
      created.expects.headers = headers;
    }

    await this.addRequestBody(created, request.body);
  }

  /**
   * Computes headers string from item's headers.
   *
   * @param headers Postman Request.header model.
   * @return Computed value of headers.
   */
  computeHeaders(headers?: string|PostmanParameter[]): string {
    if (typeof headers === 'string') {
      return headers;
    }
    if (!Array.isArray(headers)) {
      return '';
    }
    const tmp = headers.filter((h) => !h.disabled);
    return tmp.map((item) => `${item.key}: ${item.value}`).join('\n');
  }

  async addRequestBody(created: ProjectRequest, body?: PostmanBody): Promise<void> {
    if (!body) {
      return;
    }
    switch (body.mode) {
      case 'file': return this.addBinaryBody(created, body);
      case 'urlencoded': return this.addUrlencodedBody(created, body);
      case 'formdata': return this.addParamsBody(created, body);
      case 'raw': return this.addRawBody(created, body);
    }
  }

  async addBinaryBody(created: ProjectRequest, body: PostmanBody): Promise<void> {
    // Postman sets the `body.file.src` property with the path to the file
    // but not data itself. Because of that this method is a stub that can be extended
    // by particular implementation (like node, CLI).
  }

  async addUrlencodedBody(created: ProjectRequest, body: PostmanBody): Promise<void> {
    const items = body[body.mode as keyof PostmanBody] as PostmanUrlEncoded[];
    if (!Array.isArray(items)) {
      return;
    }
    const data = this.ensureVarsRecursively(items) as PostmanUrlEncoded[];
    const str =  data.map(i => `${paramValue(i.key || 'missing name')}=${paramValue(i.value || '')}`).join('&');
    await created.expects.writePayload(str);
  }

  async addParamsBody(created: ProjectRequest, body: PostmanBody): Promise<void> {
    const items = body[body.mode as keyof PostmanBody] as PostmanFormData[];
    if (!Array.isArray(items)) {
      return;
    }
    const data = this.ensureVarsRecursively(items) as PostmanFormData[];
    const multipartBody: IMultipartBody[] = [];
    for (const part of data) {
      if (part.type === 'text') {
        await this.addParamsTextPart(multipartBody, part);
      } else if (part.type === 'file') {
        await this.addParamsFilePart(multipartBody, part);
      }
    }
    created.expects.payload = {
      type: 'formdata',
      data: multipartBody,
    };
  }

  async addParamsTextPart(body: IMultipartBody[], param: PostmanFormData): Promise<void> {
    const { key, value, disabled=false, } = param;
    body.push({
      isFile: false,
      name: key || 'unnamed part',
      value: value || '',
      enabled: !disabled,
    });
  }

  async addParamsFilePart(body: IMultipartBody[], param: PostmanFormData): Promise<void> {
    // Postman sets the `value` property with the path to the file
    // but not data itself. Because of that this method is a stub that can be extended
    // by particular implementation (like node, CLI).
  }

  async addRawBody(created: ProjectRequest, body: PostmanBody): Promise<void> {
    if (body.raw) {
      await created.expects.writePayload(body.raw);
    }
  }
}
