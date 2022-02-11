import { PostmanTransformer, dataValue, paramValue } from './PostmanTransformer.js';
import { HttpProject, IHttpProject, Kind as ProjectKind } from '../HttpProject.js';
import { ProjectFolder } from '../ProjectFolder.js';
import { ProjectRequest } from '../ProjectRequest.js';
import { IMultipartBody } from '../../lib/transformers/PayloadSerializer.js';
import { Environment } from '../Environment.js';

interface PostmanBackupV1 {
  version: number;
  collections?: PostmanCollection[];
  environments?: PostmanEnvironment[];
  headerPresets?: PostmanHeadersPreset[];
  globals?: PostmanVariable[];
}

interface PostmanCollection {
  id: string;
  name: string;
  description: string;
  order: string[];
  folders?: PostmanFolder[];
  folders_order: string[];
  timestamp: number;
  synced: boolean;
  remote_id: number;
  owner: number;
  sharedWithTeam: boolean;
  subscribed: boolean;
  remoteLink: string;
  remoteLinkUpdatedAt: string;
  public: boolean;
  createdAt: number;
  updatedAt: number;
  write: boolean;
  published: boolean;
  favorite: boolean;
  requests: PostmanRequest[];
  variables?: PostmanVariable[];
}
interface PostmanRequest {
  id: string;
  name: string;
  time: number;
  headers: string;
  url: string;
  queryParams: PostmanParameter[];
  headerData: PostmanParameter[];
  pathVariableData: PostmanParameter[];
  preRequestScript: string;
  method: string;
  collectionId: string;
  data: string|PostmanBodyParam[]|null;
  dataMode: string;
  description: string;
  descriptionFormat: string;
  version: number;
  tests: string;
  currentHelper: string;
  rawModeData?: string;
}
interface PostmanEnvironment {
  id: string;
  name: string;
  timestamp: number;
  synced: boolean;
  values: PostmanParameter[];
}
interface PostmanHeadersPreset {
  id: string;
  name: string;
  headers: PostmanHeader[];
  timestamp: number;
}

interface PostmanVariable {
  disabled: boolean;
  key: string;
  value: string;
}

interface PostmanParameter {
  enabled: boolean;
  key: string;
  value: string;
  type: string;
}
interface PostmanBodyParam extends PostmanParameter {
  description: string;
}
interface PostmanHeader extends PostmanParameter {
  description: string;
  warning: string;
}
interface PostmanFolder {
  name: string;
  description: string;
  collectionId: string;
  collection: string;
  order: string[];
  owner: number;
  folders_order: string[];
  createdAt: number;
  updatedAt: number;
  id: string;
  collection_id: string;
}

/**
 * Transformer for Postman backup file.
 */
export class PostmanBackupTransformer extends PostmanTransformer {
  async transform(): Promise<HttpProject[]> {
    const raw = this[dataValue] as PostmanBackupV1;
    const result: HttpProject[] = [];
    if (!raw.collections) {
      return result;
    }
    for (const collection of raw.collections) {
      const project = await this.transformCollection(collection);
      result.push(project);
    }
    return result;
  }

  async transformCollection(collection: PostmanCollection): Promise<HttpProject> {
    const { folders_order, order } = collection;
    const project = this.createProject(collection);
    this.setProjectVariables(project, collection);
    if (Array.isArray(folders_order)) {
      for (const id of folders_order) {
        await this.addFolder(project, collection, id);
      }
    }
    if (Array.isArray(order)) {
      for (const id of order) {
        await this.addRequest(project, collection, id);
      }
    }
    return project;
  }

  createProject(collection: PostmanCollection): HttpProject {
    const { description, id, name } = collection;
    const init: IHttpProject = {
      kind: ProjectKind,
      definitions: [],
      environments: [],
      info: {
        kind: 'ARC#Thing',
        name,
      },
      items: [],
      key: id,
    };
    if (description) {
      init.info.description = description;
    }
    const project = new HttpProject(init);
    return project;
  }

  setProjectVariables(project: HttpProject, collection: PostmanCollection): void {
    const { variables } = collection;
    if (!Array.isArray(variables)) {
      return;
    }
    const env = Environment.fromName('Default');
    project.addEnvironment(env);
    variables.forEach((param) => {
      const { disabled=false, key, value } = param;

      const parsed = this.ensureVariablesSyntax(value) as string;
      const created = env.addVariable(key, parsed);
      created.enabled = !disabled;
    });
  }

  async addFolder(current: HttpProject | ProjectFolder, collection: PostmanCollection, id: string): Promise<void> {
    const { folders } = collection;
    const folder = folders?.find(i => i.id === id);
    if (!folder) {
      this.addLog('warning', `Folder ${id} not found in the collection.`);
      return;
    }
    const created = current.addFolder(folder.name);
    if (folder.description) {
      created.info.description = folder.description;
    }
    if (Array.isArray(folder.folders_order)) {
      for (const id of folder.folders_order) {
        await this.addFolder(created, collection, id);
      }
    }
    if (Array.isArray(folder.order)) {
      for (const id of folder.order) {
        await this.addRequest(created, collection, id);
      }
    }
  }

  async addRequest(current: HttpProject | ProjectFolder, collection: PostmanCollection, id: string): Promise<void> {
    const { requests } = collection;
    const request = requests?.find(i => i.id === id);
    if (!request) {
      this.addLog('warning', `Request ${id} not found in the collection.`);
      return;
    }

    const name = request.name || 'unnamed';
    let url = request.url || 'http://';
    url = this.ensureVariablesSyntax(url) as string;
    let method = request.method || 'GET';
    method = this.ensureVariablesSyntax(method) as string;
    let headers = request.headers || '';
    headers = this.ensureVariablesSyntax(headers) as string;

    let createdTime = Number(request.time);
    if (Number.isNaN(createdTime)) {
      createdTime = Date.now();
    }

    const created = current.addRequest(url);
    created.info.name = name;
    if (request.description) {
      created.info.description = request.description;
    }
    created.expects.method = method;
    if (headers) {
      created.expects.headers = headers;
    }

    await this.addRequestBody(created, request);
  }

  async addRequestBody(created: ProjectRequest, request: PostmanRequest): Promise<void> {
    switch (request.dataMode) {
      case 'urlencoded': return this.addUrlencodedBody(created, request);
      case 'binary': return this.addBinaryBody(created, request);
      case 'params': return this.addParamsBody(created, request);
      case 'raw': return this.addRawBody(created, request);
    }
  }

  async addUrlencodedBody(created: ProjectRequest, request: PostmanRequest): Promise<void> {
    if (!Array.isArray(request.data)) {
      return;
    }
    const data = request.data as PostmanBodyParam[];
    const body =  data.map(i => `${paramValue(i.key)}=${paramValue(i.value)}`).join('&');
    await created.expects.writePayload(body);
  }

  async addBinaryBody(created: ProjectRequest, request: PostmanRequest): Promise<void> {
    // Postman sets the `rawModeData` property with the path to the file
    // but not data itself. Because of that this method is a stub that can be extended
    // by particular implementation (like node, CLI).
  }

  async addParamsBody(created: ProjectRequest, request: PostmanRequest): Promise<void> {
    // "params" is Postman's FormData implementation.
    // Similarly to the `addBinaryBody()`, file parts carry no data.
    // Override the `addParamsFilePart()` to handle file read from the filesystem.
    if (!Array.isArray(request.data)) {
      return;
    }
    const data = request.data as PostmanBodyParam[];
    const body: IMultipartBody[] = [];
    for (const part of data) {
      if (part.type === 'text') {
        await this.addParamsTextPart(body, part);
      } else if (part.type === 'file') {
        await this.addParamsFilePart(body, part);
      }
    }
    created.expects.payload = {
      type: 'formdata',
      data: body,
    };
  }

  async addParamsTextPart(body: IMultipartBody[], param: PostmanBodyParam): Promise<void> {
    const { key, value, enabled=true } = param;
    body.push({
      isFile: false,
      name: key,
      value,
      enabled,
    });
  }

  async addParamsFilePart(body: IMultipartBody[], param: PostmanBodyParam): Promise<void> {
    // Postman sets the `value` property with the path to the file
    // but not data itself. Because of that this method is a stub that can be extended
    // by particular implementation (like node, CLI).
  }

  async addRawBody(created: ProjectRequest, request: PostmanRequest): Promise<void> {
    const { rawModeData, data } = request;
    if (rawModeData && typeof rawModeData === 'string') {
      await created.expects.writePayload(rawModeData);
    } else if (data && typeof data === 'string') {
      await created.expects.writePayload(data);
    }
  }
}
