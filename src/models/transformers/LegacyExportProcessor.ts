/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  ExportOptionsInternal,
  ArcExportObject,
  ExportArcSavedRequest,
  ExportArcHistoryRequest,
  ExportArcProjects,
  ExportArcWebsocketUrl,
  ExportArcUrlHistory,
  ExportArcHostRule,
  ExportArcVariable,
  ExportArcAuthData,
  ArcExportProcessedData,
  ArcNativeDataExport,
  ArcExportClientCertificateData,
  ExportArcClientCertificateData,
} from '../legacy/DataExport.js';
import { ARCProject } from '../legacy/models/ArcLegacyProject.js';
import { ARCAuthData } from '../legacy/models/AuthData.js';
import { ARCWebsocketUrlHistory, ARCUrlHistory } from '../legacy/models/UrlHistory.js';
import { ARCHostRule } from '../legacy/models/HostRule.js';
import { ARCVariable } from '../legacy/models/Variable.js';
import { ARCHistoryRequest, ARCSavedRequest } from '../legacy/request/ArcRequest.js';

/**
 * A class that processes ARC data to create a standard export object.
 */
export class LegacyExportProcessor {
  electronCookies: boolean;
  /**
   * @param electronCookies True if the cookies were read from electron storage
   */
  constructor(electronCookies: boolean) {
    this.electronCookies = electronCookies;
  }

  /**
   * Creates an export object for the data.
   *
   * @param exportData
   * @param options Export configuration object
   * @returns ARC export object declaration.
   */
  createExportObject(exportData: ArcExportProcessedData[], options: ExportOptionsInternal): ArcExportObject {
    const result: ArcExportObject = {
      createdAt: new Date().toISOString(),
      version: options.appVersion,
      kind: options.kind || '',
      electronCookies: this.electronCookies,
    };
    if (options.skipImport) {
      result.loadToWorkspace = true;
    }
    exportData.forEach(({ key, data }) => {
      if (!data) {
        return;
      }
      result[key] = this.prepareItem(key, data);
    });
    return result;
  }

  prepareItem(key: keyof ArcNativeDataExport, values: any[]): any[]|undefined {
    switch (key) {
      case 'authdata': return this.prepareAuthData(values);
      case 'clientcertificates': return this.prepareClientCertData(values);
      case 'cookies': return this.prepareCookieData(values);
      case 'history': return this.prepareHistoryDataList(values);
      case 'hostrules': return this.prepareHostRulesData(values);
      case 'projects': return this.prepareProjectsList(values);
      case 'requests': return this.prepareRequestsList(values);
      case 'urlhistory': return this.prepareUrlHistoryData(values);
      case 'variables': return this.prepareVariablesData(values);
      case 'websocketurlhistory': return this.prepareWsUrlHistoryData(values);
      default: return undefined;
    }
  }

  /**
   * Maps list of request to the export object.
   * @param requests The list of requests to process.
   */
  prepareRequestsList(requests: ARCSavedRequest[]): ExportArcSavedRequest[] {
    const result = requests.map((item) => {
      const request = { ...item } as ExportArcSavedRequest;
      // @ts-ignore
      if (item.legacyProject) {
        if (item.projects) {
          // @ts-ignore
          request.projects[item.projects.length] = item.legacyProject;
        } else {
          // @ts-ignore
          request.projects = [request.legacyProject];
        }
        // @ts-ignore
        delete request.legacyProject;
      }
      request.kind = 'ARC#HttpRequest';
      request.key = item._id as string;
      delete request._rev;
      delete request._id;
      return request;
    });
    return result;
  }

  prepareProjectsList(projects: ARCProject[]): ExportArcProjects[] {
    return projects.map((item) => {
      const project = { ...item } as ExportArcProjects;
      project.kind = 'ARC#ProjectData';
      project.key = item._id as string;
      // @ts-ignore
      delete project._rev;
      // @ts-ignore
      delete project._id;
      return project;
    });
  }

  /**
   * @param history The list of requests to process.
   */
  prepareHistoryDataList(history: ARCHistoryRequest[]): ExportArcHistoryRequest[] {
    const result = history.map((item) => {
      const request = { ...item } as ExportArcHistoryRequest;
      request.kind = 'ARC#HttpRequest';
      request.key = item._id as string;
      // @ts-ignore
      delete request._rev;
      // @ts-ignore
      delete request._id;
      return request;
    });
    return result;
  }

  prepareWsUrlHistoryData(data: ARCWebsocketUrlHistory[]): ExportArcWebsocketUrl[] {
    const result = data.map((item) => {
      const history = { ...item } as ExportArcWebsocketUrl;
      history.key = item._id as string;
      // @ts-ignore
      delete history._rev;
      // @ts-ignore
      delete history._id;
      history.kind = 'ARC#WebsocketHistoryData';
      return history;
    });
    return result;
  }

  prepareUrlHistoryData(data: ARCUrlHistory[]): ExportArcUrlHistory[] {
    const result = data.map((item) => {
      const history = { ...item } as ExportArcUrlHistory;
      history.key = item._id as string;
      // @ts-ignore
      delete history._rev;
      // @ts-ignore
      delete history._id;
      history.kind = 'ARC#UrlHistoryData';
      return history;
    });
    return result;
  }

  prepareVariablesData(data: ARCVariable[]): ExportArcVariable[] {
    const result: ExportArcVariable[] = [];
    data.forEach((item) => {
      const value = { ...item } as ExportArcVariable;
      if (!value.environment) {
        // PouchDB creates some views in the main datastore and it is added to
        // get all docs function without any reason. It should be eliminated
        return;
      }
      if (value.variable) {
        value.name = value.variable;
        delete value.variable;
      }
      value.key = item._id as string;
      // @ts-ignore
      delete value._rev;
      // @ts-ignore
      delete value._id;
      value.kind = 'ARC#Variable';
      result.push(value);
    });
    return result;
  }

  prepareAuthData(authData: ARCAuthData[]): ExportArcAuthData[] {
    const result = authData.map((item) => {
      const value = item as ExportArcAuthData;
      value.key = item._id as string;
      // @ts-ignore
      delete value._rev;
      // @ts-ignore
      delete value._id;
      value.kind = 'ARC#AuthData';
      return value;
    });
    return result;
  }

  prepareCookieData(cookies: any[]): any[] {
    const isElectron = this.electronCookies;
    const result = cookies.map((item) => {
      const value = item as any;
      if (!isElectron) {
        value.key = item._id as string;
        // @ts-ignore
        delete value._rev;
        // @ts-ignore
        delete value._id;
      }
      value.kind = 'ARC#Cookie';
      return item;
    });
    return result;
  }

  /**
   * @param {ARCHostRule[]} hostRules
   * @return {ExportArcHostRule[]}
   */
  prepareHostRulesData(hostRules: ARCHostRule[]): ExportArcHostRule[] {
    return hostRules.map((item) => {
      const value = item as ExportArcHostRule;
      value.key = value._id as string;
      // @ts-ignore
      delete value._rev;
      // @ts-ignore
      delete value._id;
      value.kind = 'ARC#HostRule';
      return value;
    });
  }

  prepareClientCertData(items: ArcExportClientCertificateData[]): ExportArcClientCertificateData[] {
    return items.map(({ item, data }) => {
      const value = item as ExportArcClientCertificateData;
      value.key = item._id as string;
      // @ts-ignore
      delete value._rev;
      // @ts-ignore
      delete value._id;
      value.kind = 'ARC#ClientCertificate';
      value.cert = data.cert;
      if (data.key) {
        value.pKey = data.key;
      }
      return value;
    });
  }
}
