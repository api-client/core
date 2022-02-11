import { dataValue } from './BaseTransformer.js';
import { PostmanTransformer } from './PostmanTransformer.js';
import { ArcExportObject, ExportArcSavedRequest, ExportArcProjects } from '../legacy/DataExport.js';

interface PostmanV1 {
  id: string;
  name: string;
  description?: string;
  order: string[];
  requests: PostmanRequest[];
  folders_order?: string[];
  folders?: PostmanFolder[];
  timestamp?: number;
  owner?: number;
  public?: boolean;
}

interface PostmanRequest {
  folder?: string;
  id: string;
  name: string;
  dataMode?: string;
  dataDisabled?: boolean;
  data?: any;
  descriptionFormat?: string;
  description?: string;
  headers: string;
  method: string;
  url: string;
  rawModeData?: string|any[];
  collectionId?: string;
  collection?: string;
  time?: number;
  currentHelper: string;
}

interface PostmanFolder {
  id: string;
  name: string;
  description?: string;
  order: string[];
  folders_order?: string[];
  collection_id?: string;
  collection?: string;
}

/**
 * Transforms Postman v1 collections to ARC import object.
 */
export class PostmanV1Transformer extends PostmanTransformer {
  /**
   * Transforms `_data` into ARC data model.
   * @returns Promise resolved when data are transformed.
   */
  async transform(): Promise<ArcExportObject> {
    const project = this.readProjectInfo();
    const requests = this.readRequestsData(project);
    const result: ArcExportObject = {
      createdAt: new Date().toISOString(),
      version: 'postman-collection-v1',
      kind: 'ARC#Import',
      requests,
      projects: [project]
    };
    return result;
  }

  /**
   * Creates the project model based on Postman collections
   *
   * @returns Arc project data model.
   */
  readProjectInfo(): ExportArcProjects {
    const raw = this[dataValue] as PostmanV1;

    let time = Number(raw.timestamp);
    if (Number.isNaN(time)) {
      time = Date.now();
    }
    const result: ExportArcProjects = {
      kind: 'ARC#ProjectData',
      key: raw.id,
      name: raw.name,
      description: raw.description,
      created: time,
      updated: time,
      order: 0
    };
    return result;
  }

  /**
   * Iterates over collection requests array and transforms objects to ARC requests.
   *
   * @param project Project object
   * @returns List of ARC request objects.
   */
  readRequestsData(project: ExportArcProjects): ExportArcSavedRequest[] {
    const raw = this[dataValue] as PostmanV1;

    let result: ExportArcSavedRequest[] = [];
    if (!raw.requests || !raw.requests.length) {
      return result;
    }

    const requests = this.computeRequestsInOrder();
    result = requests.map((postmanRequest) =>
      this.postmanRequestToArc(postmanRequest, project));
    return result;
  }

  /**
   * Creates ordered list of requests as defined in collection order property.
   * This creates a flat structure of requests and order assumes ARC's flat
   * structure.
   *
   * @returns List of ordered Postman requests
   */
  computeRequestsInOrder(): PostmanRequest[] {
    const raw = this[dataValue] as PostmanV1;

    let ordered: string[] = [];
    if (raw.order && raw.order.length) {
      ordered = ordered.concat(raw.order);
    }
    if (raw.folders) {
      const folders = this.computeOrderedFolders(raw.folders, raw.folders_order);
      if (folders) {
        folders.forEach((folder) => {
          if (folder.order && folder.order.length) {
            ordered = ordered.concat(folder.order);
          }
        });
      }
    }
    const {requests} = raw;
    const result = ordered.map((id) => requests.find((request) => request.id === id)).filter((item) => !!item) as PostmanRequest[];
    return result;
  }

  /**
   * Computes list of folders including sub-folders .
   *
   * @param folders Collection folders definition
   * @param orderIds Collection order info array
   * @return Ordered list of folders.
   */
  computeOrderedFolders(folders: PostmanFolder[], orderIds?: string[]): PostmanFolder[] {
    if (!folders || !folders.length) {
      return folders;
    }
    if (!orderIds || !orderIds.length) {
      return folders;
    }
    const result: PostmanFolder[] = [];
    const copy = Array.from(folders);
    orderIds.forEach((id) => {
      const i = copy.findIndex((item) => item.id === id);
      if (i === -1) {
        return;
      }
      result[result.length] = copy[i];
      copy.splice(i, 1);
    });
    return result;
  }

  /**
   * Transforms postman request to ARC request
   * @param item Postman request object
   * @param project Project object
   * @returns ARC request object
   */
  postmanRequestToArc(item: PostmanRequest, project: ExportArcProjects): ExportArcSavedRequest {
    const raw = this[dataValue] as PostmanV1;
    item.name = item.name || 'unnamed';
    let url = item.url || 'http://';
    url = this.ensureVariablesSyntax(url) as string;
    let method = item.method || 'GET';
    method = this.ensureVariablesSyntax(method) as string;
    let headers = item.headers || '';
    headers = this.ensureVariablesSyntax(headers) as string;
    const body = this.computeBodyOld(item);
    const copy: ExportArcSavedRequest = {
      ...item,
      type: 'saved',
      kind: 'ARC#HttpRequest',
      key: '',
    };
    const id = this.generateRequestId(copy, raw.id);
    let created = Number(item.time);
    if (Number.isNaN(created)) {
      created = Date.now();
    }
    const result: ExportArcSavedRequest = {
      kind: 'ARC#HttpRequest',
      key: id,
      created,
      updated: Date.now(),
      headers: headers || '',
      method,
      name: item.name,
      payload: body,
      type: 'saved',
      url,
    };
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
}
