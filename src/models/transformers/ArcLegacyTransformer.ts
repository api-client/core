import v4 from '../../lib/uuid.js';
import { BaseTransformer, dataValue } from './BaseTransformer.js';
import {
  ArcExportObject,
  ExportArcProjects,
  ExportArcSavedRequest,
} from '../legacy/DataExport.js';

interface LegacyExport {
  requests: LegacyRequest[];
  projects: LegacyProject[];
}

interface LegacyRequest {
  id: number;
  name: string;
  project: number;
  url: string;
  method: string;
  encoding: string|null;
  headers: string|null;
  payload: string|null;
  skipProtocol: boolean;
  skipServer: boolean;
  skipParams: boolean;
  skipHistory: boolean;
  skipMethod: boolean;
  skipPayload: boolean;
  skipHeaders: boolean;
  skipPath: boolean;
  time: number;
  driveId?: string|null;
}

interface LegacyProject {
  created: number;
  id: number;
  name: string;
}

interface LegacyProjectProcessing extends ExportArcProjects {
  originId: number;
}

/**
 * Tests if the data import is a single request export.
 *
 * @param data Imported data
 * @return True if `data` represents single request
 */
export function isSingleRequest(data: any): boolean {
  if ('requests' in data || 'projects' in data) {
    return false;
  }
  return true;
}


/**
 * Transforms the first ARC data object to current schema.
 */
export class ArcLegacyTransformer extends BaseTransformer {
  /**
   * Transforms legacy ARC export object into current export data model.
   *
   * @return New data model object.
   */
  async transform(): Promise<ArcExportObject> {
    const raw = this[dataValue] as any;

    let projects: ExportArcProjects[] | undefined;
    let requests: ExportArcSavedRequest[] | undefined;
    if (isSingleRequest(raw)) {
      const item = raw as LegacyRequest;
      projects = [];
      requests = [this.transformRequest(item)];
    } else {
      const data = raw as LegacyExport;
      const tmp = projects = this.transformProjects(data.projects);
      requests = this.transformRequests(data.requests, tmp);
      projects = projects.map((item) => {
        // @ts-ignore
        delete item.originId;
        return item;
      });
    }

    const result: ArcExportObject = {
      createdAt: new Date().toISOString(),
      version: 'unknown',
      kind: 'ARC#Import',
      requests,
      projects,
    };

    return result;
  }

  /**
   * Returns a list of projects from a legacy export file.
   *
   * Each project will have newly generated ID to not make conflicts with
   * existing projects. Old project id is moved to the `originId` property.
   *
   * @param projects List of legacy project objects
   * @returns List of project object in current data model. It can be
   * empty array.
   */
  transformProjects(projects: LegacyProject[]): LegacyProjectProcessing[] {
    if (!projects || !(projects instanceof Array) || !projects.length) {
      return [];
    }
    return projects.map((item) => {
      let created = Number(item.created);
      if (Number.isNaN(created)) {
        created = Date.now();
      }
      return {
        kind: 'ARC#ProjectData',
        key: v4(),
        created,
        name: item.name || 'unnamed',
        order: 0,
        updated: Date.now(),
        originId: item.id,
      };
    });
  }

  /**
   * Transform the list of requests into new data model.
   */
  transformRequests(requests: LegacyRequest[], projects?: LegacyProjectProcessing[]): ExportArcSavedRequest[] {
    if (!requests || !(requests instanceof Array) || !requests.length) {
      return [];
    }
    return requests.map((item) => this.transformRequest(item, projects));
  }

  /**
   * Transforms a single request object into current data model.
   *
   * Note that required properties will be default to the following:
   * -   `name` - "unnamed"
   * -   `url` - "http://"
   * -   `method` - "GET"
   *
   * @param item Legacy request definition
   * @param projects List of projects in the import file.
   * @return Current model of the request object.
   */
  transformRequest(item: LegacyRequest, projects?: LegacyProjectProcessing[]): ExportArcSavedRequest {
    // LegacyRequest may have `null` values.
    item.name = item.name || 'unnamed';
    item.url = item.url || 'http://';
    item.method = item.method || 'GET';

    const project = this.findProject(item.project, projects);
    const projectId = project ? project.key : undefined;
    const id = v4();
    let created = Number(item.time);
    if (Number.isNaN(created)) {
      created = Date.now();
    }
    const result: ExportArcSavedRequest = {
      kind: 'ARC#HttpRequest',
      key: id,
      created,
      updated: Date.now(),
      headers: item.headers || '',
      method: item.method,
      name: item.name,
      payload: item.payload || '',
      type: 'saved',
      url: item.url,
    };
    if (project && projectId) {
      result.projects = [projectId];
      this.addRequestReference(project, id);
    }
    if (item.driveId) {
      result.driveId = item.driveId;
    }
    return result;
  }

  /**
   * Finds a project in the list of projects.
   *
   * @param projectId A project ID to search for
   * @param projects List of project to look into. It compares the `originId` property of the list items.
   * @returns A project object or null if not found.
   */
  findProject(projectId: number, projects?: LegacyProjectProcessing[]): LegacyProjectProcessing|undefined {
    if (!projectId || !Array.isArray(projects)) {
      return undefined;
    }
    return projects.find((p) => p.originId === projectId);
  }
}
