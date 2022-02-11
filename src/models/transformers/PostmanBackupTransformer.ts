import v4 from '../../lib/uuid.js';
import { dataValue } from './BaseTransformer.js';
import { PostmanTransformer } from './PostmanTransformer.js';
import {
  ArcExportObject,
  ExportArcProjects,
  ExportArcSavedRequest,
  ExportArcHistoryRequest,
  ExportArcVariable,
} from '../legacy/DataExport.js';

export declare interface PostmanBackupV1 {
  version: number;
  collections?: PostmanCollection[];
  environments?: PostmanEnvironment[];
  headerPresets?: PostmanHeadersPreset[];
  globals?: PostmanVariable[];
}

export declare interface PostmanCollection {
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
}
export declare interface PostmanRequest {
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
}
export declare interface PostmanEnvironment {
  id: string;
  name: string;
  timestamp: number;
  synced: boolean;
  values: PostmanParameter[];
}
export declare interface PostmanHeadersPreset {
  id: string;
  name: string;
  headers: PostmanHeader[];
  timestamp: number;
}
export declare interface PostmanParameter {
  enabled: boolean;
  key: string;
  value: string;
  type: string;
}
export declare interface PostmanBodyParam extends PostmanParameter {
  description: string;
}
export declare interface PostmanVariable extends PostmanParameter {
}
export declare interface PostmanHeader extends PostmanParameter {
  description: string;
  warning: string;
}
export declare interface PostmanFolder {
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
export declare interface PostmanArcRequestData {
  projects: ExportArcProjects[];
  requests: ExportArcSavedRequest[];
}
export declare interface PostmanArcCollection {
  project: ExportArcProjects;
  requests: ExportArcSavedRequest[];
}

/**
 * Transformer for Postman backup file.
 */
export class PostmanBackupTransformer extends PostmanTransformer {
  /**
   * Transforms `_data` into ARC data model.
   * @return Promise resolved when data are transformed.
   */
  transform(): Promise<ArcExportObject> {
    const raw = /** @type PostmanBackupV1 */ (this[dataValue]);

    const collections = this.readRequestsData(raw.collections);
    const result: ArcExportObject = {
      createdAt: new Date().toISOString(),
      version: 'postman-backup',
      kind: 'ARC#Import',
      requests: collections.requests,
      projects: collections.projects,
    };
    const variables = this.computeVariables(raw);
    if (variables && variables.length) {
      result.variables = variables;
    }
    return Promise.resolve(result);
  }

  /**
   * Iterates over collection requests array and transforms objects
   * to ARC requests.
   *
   * @returns List of ARC request objects.
   */
  readRequestsData(data: PostmanCollection[]): PostmanArcRequestData {
    const result: PostmanArcRequestData = {
      projects: [],
      requests: [],
    };
    if (!data || !data.length) {
      return result;
    }
    const parts = data.map((item, index) => this.readCollectionData(item, index));
    parts.forEach((part) => {
      result.projects.push(part.project);
      result.requests = result.requests.concat(part.requests);
    });
    return result;
  }

  /**
   * Reads collections data.
   *
   * @return Map of projects and requests.
   */
  readCollectionData(collection: PostmanCollection, index: number): PostmanArcCollection {
    const project: ExportArcProjects = {
      kind: 'ARC#ProjectData',
      key: collection.id,
      name: collection.name,
      description: collection.description,
      order: index,
      created: collection.createdAt,
      updated: collection.updatedAt,
    };
    const requests = this.computeRequestsOrder(collection);
    const result: PostmanArcCollection = {
      project,
      requests: requests.map((item) => this.createRequestObject(item, project)),
    };
    return result;
  }

  /**
   * Creates ordered list of requests as defined in collection order property.
   * This creates a flat structure of requests and order assumes ARC's flat
   * structure.
   *
   * @returns List of ordered Postman requests
   */
  computeRequestsOrder(collection: PostmanCollection): PostmanRequest[] {
    let ordered:string[] = [];
    if (collection.order && collection.order.length) {
      ordered = ordered.concat(collection.order);
    }
    if (collection.folders) {
      const folders = this.computeOrderedFolders(collection.folders, collection.folders_order);
      if (folders) {
        folders.forEach((folder) => {
          if (folder.order && folder.order.length) {
            ordered = ordered.concat(folder.order);
          }
        });
      }
    }
    const { requests } = collection;
    const result: PostmanRequest[] = ordered.map((id) => requests.find((request) => request.id === id)).filter((item) => !!item) as PostmanRequest[];
    return result;
  }

  /**
   * Computes list of folders including sub-folders .
   *
   * @param folders Collection folders definition
   * @param orderIds Collection order info array
   * @returns Ordered list of folders.
   */
  computeOrderedFolders(folders: PostmanFolder[], orderIds: string[]): PostmanFolder[]|undefined {
    if (!folders || !folders.length) {
      return undefined;
    }
    if (!orderIds || !orderIds.length) {
      return folders;
    }
    const result = orderIds.map((id) => folders.find((folder) => folder.id === id)).filter((item) => !!item) as PostmanFolder[];
    return result;
  }

  /**
   * Transforms postman request to ARC request
   * @param item Postman request object
   * @param project Project object
   * @returns ARC request object
   */
  createRequestObject(item: PostmanRequest, project: ExportArcProjects): ExportArcSavedRequest {
    const name = item.name || 'unnamed';
    let url = item.url || 'http://';
    url = this.ensureVariablesSyntax(url) as string;
    let method = item.method || 'GET';
    method = this.ensureVariablesSyntax(method) as string;
    let headers = item.headers || '';
    headers = this.ensureVariablesSyntax(headers) as string;
    const body = this.computeBodyOld(item);

    let created = Number(item.time);
    if (Number.isNaN(created)) {
      created = Date.now();
    }
    const result: ExportArcSavedRequest = {
      key: '',
      created,
      updated: Date.now(),
      headers,
      method,
      name,
      payload: body,
      type: 'saved',
      url
    };
    const id = this.generateRequestId(result, project && project.key);
    result.key = id;
    if (project) {
      this.addProjectReference(result, project.key);
      this.addRequestReference(project, id);
    }
    if (item.description) {
      result.description = item.description;
    }
    // @ts-ignore
    if (item.multipart) {
      // @ts-ignore
      result.multipart = item.multipart;
    }
    return result;
  }

  /**
   * Computes list of variables to import.
   *
   * @param data Postman import object
   * @return List of variables or undefined if no variables found.
   */
  computeVariables(data: PostmanBackupV1): ExportArcVariable[]|undefined {
    const result: ExportArcVariable[] = [];
    if (data.globals && data.globals.length) {
      data.globals.forEach((item) => {
        const obj = this.computeVariableObject(item, 'default');
        result.push(obj);
      });
    }

    if (data.environments && data.environments.length) {
      data.environments.forEach((env) => {
        if (!env.values || !env.values.length) {
          return;
        }
        const name = env.name || 'Unnamed';
        env.values.forEach((item) => {
          const obj = this.computeVariableObject(item, name);
          result.push(obj);
        });
      });
    }
    return result.length ? result : undefined;
  }

  /**
   * Creates a variable object item.
   *
   * @param item Postman's variable definition.
   * @param environment Environment name
   * @return ARC's variable definition.
   */
  computeVariableObject(item: PostmanVariable, environment: string): ExportArcVariable {
    const result = {
      kind: 'ARC#VariableData',
      key: v4(),
      enabled: item.enabled || true,
      environment,
      value: this.ensureVariablesSyntax(item.value),
      name: item.key,
    };
    return result;
  }
}
