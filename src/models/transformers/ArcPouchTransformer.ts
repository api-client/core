/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import v4 from '../../lib/uuid.js';
import { BaseTransformer, dataValue } from './BaseTransformer.js';
import {
  ArcExportObject,
  ExportArcProjects,
  ExportArcSavedRequest,
  ExportArcHistoryRequest,
  ExportArcClientCertificateData,
  ExportArcVariable,
} from '../legacy/DataExport.js';

/**
 * Updates `updated` property and ensures `created` property
 * @param item An item to updated
 * @returns Shallow copy of the passed item.
 */
export function updateItemTimings<T>(item: T): T {
  const data = { ...item } as any;
  if (!data.updated || Number.isNaN(data.updated)) {
    data.updated = Date.now();
  }
  if (!data.created) {
    data.created = data.updated;
  }
  return data;
}

/**
 * Transforms data exported by the PouchDB system (legacy)
 */
export class ArcPouchTransformer extends BaseTransformer {
  /**
   * Transforms PouchDB ARC export object based into current export data model.
   *
   * @returns New data model object.
   */
  async transform(): Promise<ArcExportObject> {
    const data = ({ ...this[dataValue] }) as ArcExportObject;
    if (data.projects && data.projects.length) {
      data.projects = this.transformProjects(data.projects);
    }
    if (data.requests && data.requests.length) {
      data.requests = this.transformRequests(data.requests, data.projects);
    }
    if (data.projects && data.projects.length) {
      (data.projects as any[]).forEach((item) => {
        // @ts-ignore
        delete item._referenceId;
      });
    }
    if (data.history && data.history.length) {
      data.history = this.transformHistory(data.history);
    }
    const socketUrls = (data['websocket-url-history'] || data.websocketurlhistory);
    if (socketUrls && socketUrls.length) {
      data.websocketurlhistory = socketUrls;
    }
    const urls = (data['url-history'] || data.urlhistory);
    if (urls && urls.length) {
      data.urlhistory = urls;
    }
    const authData = (data['auth-data'] || data.authdata);
    if (authData && authData.length) {
      data.authdata = authData;
    }
    const hostRules = (data['host-rules'] || data.hostrules);
    if (hostRules && hostRules.length) {
      data.hostrules = hostRules;
    }
    if (Array.isArray(data.variables) && data.variables.length) {
      data.variables = this.transformVariables(data.variables);
    }
    if (!data.loadToWorkspace) {
      data.kind = 'ARC#Import';
    }
    const ccs = (data['client-certificates'] || data.clientcertificates);
    if (ccs && ccs.length) {
      data.clientcertificates = this.transformClientCertificates(ccs);
    }
    return data;
  }

  /**
   * Transforms the projects array.
   *
   * @param projects Projects list to upgrade
   * @return Processed list
   */
  transformProjects(projects: ExportArcProjects[]): ExportArcProjects[] {
    return projects.map((item) => {
      const project = { ...item };
      if (!project.key) {
        project.key = v4();
      }
      return updateItemTimings(project);
    });
  }

  /**
   * @param requests The list of requests to process
   * @param projects List of projects
   * @returns Processed requests.
   */
  transformRequests(requests: ExportArcSavedRequest[], projects: ExportArcProjects[]=[]): ExportArcSavedRequest[] {
    return requests.map((object) => {
      const request = { ...object };
      if (!request.key) {
        // @ts-ignore
        const refId = request._referenceLegacyProject || request.legacyProject;
        request.key = this.generateRequestId(request, refId);
      }
      // @ts-ignore
      const refId = request._referenceLegacyProject || request.legacyProject;
      if (refId) {
        // @ts-ignore
        delete request._referenceLegacyProject;
        // @ts-ignore
        delete request.legacyProject;
        // @ts-ignore
        const project = projects.find((item) => item.key === refId || item._referenceId === refId);
        if (project) {
          this.addProjectReference(request, project.key);
          this.addRequestReference(project, request.key);
        }
      }
      request.name = request.name || 'unnamed';
      request.url = request.url || 'http://';
      request.method = request.method || 'GET';
      request.headers = request.headers || '';
      request.payload = request.payload || '';
      request.kind = 'ARC#HttpRequest';
      return updateItemTimings(request);
    });
  }

  transformHistory(history: ExportArcHistoryRequest[]): ExportArcHistoryRequest[] {
    return history.map((object) => {
      const item = { ...object };
      const result = updateItemTimings(item);
      result.url = item.url || 'http://';
      result.method = item.method || 'GET';
      result.headers = item.headers || '';
      result.payload = item.payload || '';
      if (!result.key) {
        result.key = this.generateHistoryId(item.created, item);
      }
      return result;
    });
  }

  /**
   * Transforms ARC's client certificate export object into intermediate structure
   * used by the import panel.
   *
   * @return A list of certificates to import. In each element
   * first item is the index data and the second is the certificates data.
   */
  transformClientCertificates(items: ExportArcClientCertificateData[]): ExportArcClientCertificateData[] {
    const result: ExportArcClientCertificateData[] = [];
    items.forEach((item) => {
      if (item.kind !== 'ARC#ClientCertificate') {
        return;
      }
      const data = updateItemTimings(item);
      result[result.length] = data;
    });
    return result;
  }

  /**
   * Maps the old `variable` property to the new `name` property.
   */
  transformVariables(variables: ExportArcVariable[]): ExportArcVariable[] {
    return variables.map((item) => {
      const variable = { ...item };
      if (variable.variable && !variable.name) {
        variable.name = variable.variable;
        delete variable.variable;
      }
      return variable;
    });
  }
}
