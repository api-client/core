import { IProjectRunnerOptions } from "../runtime/node/InteropInterfaces.js";
import { AppProject, AppProjectKind, IAppProject } from "../models/AppProject.js";
import { ApiError } from "../runtime/store/Errors.js";
import { StoreSdk } from "../runtime/store/StoreSdkNode.js";
import { ProjectSerialRunner } from "../runtime/node/ProjectSerialRunner.js";
import { ProjectParallelRunner } from "../runtime/node/ProjectParallelRunner.js";
import Proxy, { IProxyResult } from "./Proxy.js";
import { IProjectExecutionLog } from "../runtime/reporters/Reporter.js";

export interface IAppProjectProxyInit {
  kind: typeof AppProjectKind;
  /**
   * Project key
   */
  pid: string;
  /**
   * Application that created the project id.
   */
  appId: string;
  /**
   * Runner options.
   */
  options: IProjectRunnerOptions;
}

/**
 * Runs requests from an AppProject read from the store.
 */
export default class AppProjectProxy extends Proxy {
  project?: AppProject;
  options?: IProjectRunnerOptions;

  async configure(init: IAppProjectProxyInit, token: string, baseUri: string): Promise<void> {
    const { pid, appId, options } = init;
    if (!pid) {
      throw new ApiError({
        error: true,
        message: 'Invalid request',
        detail: 'The "pid" parameter is required.',
        code: 400,
      });
    }
    if (!appId) {
      throw new ApiError({
        error: true,
        message: 'Invalid request',
        detail: 'The "appId" parameter is required.',
        code: 400,
      });
    }
    if (!options) {
      throw new ApiError({
        error: true,
        message: 'Invalid request',
        detail: 'The "options" parameter is required.',
        code: 400,
      });
    }
    if (!token) {
      throw new ApiError({
        error: true,
        message: 'Invalid request',
        detail: 'Set the authentication credentials.',
        code: 400,
      });
    }
    if (!baseUri) {
      throw new ApiError({
        error: true,
        message: 'Invalid request',
        detail: 'The store uri is missing.',
        code: 400,
      });
    }
    if (!baseUri.startsWith('http')) {
      throw new ApiError({
        error: true,
        message: 'Invalid request',
        detail: 'The store uri is invalid.',
        code: 400,
      });
    }
    const sdk = new StoreSdk(baseUri);
    sdk.token = token;
    let project: IAppProject;
    try {
      project = await sdk.app.projects.read(pid, appId);
    } catch (cause) {
      const e = cause as Error;
      throw new ApiError(e.message, 400);
    }
    if (project.key !== pid) {
      throw new ApiError(`Unable to read the project.`, 500);
    }
    this.options = options;
    this.project = new AppProject(project);
  }

  async execute(): Promise<IProxyResult<IProjectExecutionLog>> {
    const project = this.project as AppProject;
    const opts = this.options as IProjectRunnerOptions;
    let factory: ProjectParallelRunner | ProjectSerialRunner;
    if (opts.parallel) {
      factory = new ProjectParallelRunner(project, opts);
    } else {
      factory = new ProjectSerialRunner();
      factory.configure(project, opts);
    }

    // eslint-disable-next-line no-inner-declarations
    function unhandledRejection(): void { 
      // 
    }
    // the executing library handles all related errors it need.
    // However, when executing a request to an unknown host Node process may 
    // throw unhandled error event when the error is properly reported by the 
    // application. This suppresses these errors.
    // Note, uncomment this line for debug.
    process.on('unhandledRejection', unhandledRejection);
    const report = await factory.execute();
    process.off('unhandledRejection', unhandledRejection);
    return {
      result: report,
    };
  }
}
