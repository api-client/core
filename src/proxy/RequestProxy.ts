import { IHttpRequest, Kind as HttpRequestKind } from '../models/HttpRequest.js';
import { IRequestAuthorization } from '../models/RequestAuthorization.js';
import { IRequestConfig } from '../models/RequestConfig.js';
import Proxy, { IProxyResult } from "./Proxy.js";
import { HttpCertificate } from '../models/ClientCertificate.js';
import { IHttpActionFlow } from '../models/http-actions/HttpActions.js';
import { ApiError } from '../runtime/store/Errors.js';
import { DummyLogger } from '../lib/logging/DummyLogger.js';
import { HttpRequestRunner } from '../runtime/http-runner/HttpRequestRunner.js';
import { IRequestLog } from "../models/RequestLog.js";

export interface IRequestProxyInit {
  kind: typeof HttpRequestKind;
  /**
   * The request to execute.
   */
  request: IHttpRequest;
  /**
   * The authorization data to apply.
   */
  authorization?: IRequestAuthorization[];
  /**
   * The request configuration.
   */
  config?: IRequestConfig;
  /**
   * The list of execution variables to use with the request.
   */
  variables?: Record<string, string>;
  /**
   * The certificate data to use with the request.
   */
  certificate?: HttpCertificate;
  /**
   * The request flows to execute with the request.
   */
  flows?: IHttpActionFlow[];
}

/**
 * Proxies a single HTTP request
 */
export default class RequestProxy extends Proxy {
  init?: IRequestProxyInit;

  async configure(init: IRequestProxyInit): Promise<void> {
    const { request } = init;
    if (!request) {
      throw new ApiError({
        error: true,
        message: 'Invalid request',
        detail: 'The "request" parameter is required.',
        code: 400,
      });
    }
    if (!request.url) {
      throw new ApiError({
        error: true,
        message: 'Invalid request',
        detail: 'The "request.url" parameter is required.',
        code: 400,
      });
    }
    this.init = init;
  }

  async execute(): Promise<IProxyResult<IRequestLog>> {
    const data = this.init as IRequestProxyInit;
    const { request, authorization, certificate, config={}, variables={}, flows } = data;
    const factory = new HttpRequestRunner();
    factory.variables = variables;
    factory.logger = new DummyLogger();
    factory.config = { ...config, enabled: true } as IRequestConfig;
    if (Array.isArray(authorization) && authorization.length) {
      factory.authorization = authorization;
    }
    if (Array.isArray(flows) && flows.length) {
      factory.flows = flows;
    }
    if (certificate) {
      factory.certificates = [certificate];
    }
    const result = await factory.run(request);
    return {
      result: result,
      variables,
    };
  }
}
