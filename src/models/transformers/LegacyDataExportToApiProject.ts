import { HttpProject } from '../HttpProject.js';
import { ArcExportObject, ExportArcSavedRequest, ExportArcProjects, ExportArcVariable } from '../legacy/DataExport.js';
import { ARCProject } from '../legacy/models/ArcLegacyProject.js';
import { ARCSavedRequest } from '../legacy/request/ArcRequest.js';
import { Environment, IEnvironment } from '../Environment.js';

/**
 * A class that transforms legacy export objects into API projects.
 * Note, this only cares about the HttpProject data. All other data are discarded.
 */
export class LegacyDataExportToApiProject {
  async readProjects(data: ArcExportObject): Promise<HttpProject[]> {
    const result: HttpProject[] = [];
    const { variables } = data;
    const projects = this.mapProjects(data.projects);
    const requests = this.mapRequests(data.requests);
    if (!projects.length || !requests.length) {
      return result;
    }
    const environments = this.createEnvironments(variables);
    const ps = projects.map(async (oldProject) => {
      const project = await HttpProject.fromLegacy(oldProject, [...requests]);
      environments.forEach(e => project.addEnvironment(e));
      result.push(project);
    });
    await Promise.all(ps);
    return result;
  }

  mapRequests(items?: ExportArcSavedRequest[]): ARCSavedRequest[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map((item) => {
      const cp = { ...item } as ARCSavedRequest;
      cp._id = item.key;
      // @ts-ignore
      delete cp.key;
      return cp;
    });
  }

  mapProjects(items?: ExportArcProjects[]): ARCProject[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map((item) => {
      const cp = { ...item } as ARCProject;
      cp._id = item.key;
      // @ts-ignore
      delete cp.key;
      return cp;
    });
  }

  createEnvironments(vars?: ExportArcVariable[]): IEnvironment[] {
    if (!Array.isArray(vars) || !vars.length) {
      return [];
    }
    const tmp: Record<string, ExportArcVariable[]> = {};
    vars.forEach((variable) => {
      const { environment='default' } = variable;
      if (!tmp[environment]) {
        tmp[environment] = [];
      }
      tmp[environment].push(variable);
    });
    const result:IEnvironment[] = [];
    Object.keys(tmp).forEach((name) => {
      const envVars = tmp[name];
      const environment = Environment.fromLegacyVariables(name, envVars);
      result.push(environment.toJSON());
    });
    return result;
  }
}
