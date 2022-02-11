import {
  ExportArcSavedRequest,
  ExportArcHistoryRequest,
  ExportArcProjects,
} from '../legacy/DataExport.js';

export const dataValue = Symbol('dataValue');

/**
 * Base class for all transformers.
 * Has common functions for the transformers.
 */
export class BaseTransformer {
  [dataValue]: any;
  /**
   * @param data Data to be transformed.
   */
  constructor(data: any) {
    this[dataValue] = data;
  }

  /**
   * Generates request's datastore ID value.
   *
   * @param item A request object property.
   * @param projectId If set it adds project information to the ID.
   * @return Request ID value.
   */
  generateRequestId(item: ExportArcSavedRequest | ExportArcHistoryRequest, projectId?: string): string {
    const assumed = item as ExportArcSavedRequest;
    const name = (assumed.name || 'unknown name').toLowerCase();
    const url = (item.url || 'https://').toLowerCase();
    const method = (item.method || 'GET').toLowerCase();

    const eName = encodeURIComponent(name);
    const eUrl = encodeURIComponent(url);

    let id = `${eName}/${eUrl}/${method}`;
    if (projectId) {
      id += `/${projectId}`;
    }
    return id;
  }

  /**
   * Computes history item ID
   *
   * @param timestamp The timestamp to use
   * @param item History item
   * @return Datastore ID
   */
  generateHistoryId(timestamp=Date.now(), item: ExportArcHistoryRequest): string {
    const url = item.url.toLowerCase();
    const method = item.method.toLowerCase();
    let today;
    try {
      today = this.getDayToday(timestamp);
    } catch (e) {
      today = this.getDayToday(Date.now());
    }
    return `${today}/${encodeURIComponent(url)}/${method}`;
  }

  /**
   * Sets hours, minutes, seconds and ms to 0 and returns timestamp.
   *
   * @param timestamp Day's timestamp.
   * @returns Timestamp to the day.
   */
  getDayToday(timestamp: number): number {
    const d = new Date(timestamp);
    const tCheck = d.getTime();
    if (Number.isNaN(tCheck)) {
      throw new Error(`Invalid timestamp: ${  timestamp}`);
    }
    d.setMilliseconds(0);
    d.setSeconds(0);
    d.setMinutes(0);
    d.setHours(0);
    return d.getTime();
  }

  /**
   * Adds project reference to a request object.
   * @param request Request object to alter
   * @param id Project id
   */
  addProjectReference(request: ExportArcSavedRequest, id?: string): void {
    if (!id) {
      return;
    }
    if (!request.projects) {
      request.projects = [];
    }
    if (request.projects.indexOf(id) === -1) {
      request.projects.push(id);
    }
  }

  /**
   * Adds request reference to a project object.
   * @param project Project object to alter
   * @param id Request id
   */
  addRequestReference(project: ExportArcProjects, id: string): void {
    if (!id) {
      return;
    }
    if (!project.requests) {
      project.requests = [];
    }
    if (project.requests.indexOf(id) === -1) {
      project.requests.push(id);
    }
  }
}
