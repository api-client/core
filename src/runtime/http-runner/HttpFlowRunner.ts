import { CookieJar } from "../../cookies/CookieJar.js";
import { IHttpRequest } from "../../models/HttpRequest.js";
import { ISentRequest } from "../../models/SentRequest.js";
import { IResponse } from "../../models/Response.js";
import { IErrorResponse } from "../../models/ErrorResponse.js";
import { HttpCookie } from "../../models/HttpCookie.js";
import { ActionSourceEnum, DeleteCookieStepKind, IActionStep, IDeleteCookieStep, IHttpAction, IHttpActionFlow, IHttpCondition, IReadDataStep, ISetCookieStep, ISetDataStep, ISetVariableStep, ReadDataStepKind, SetCookieStepKind, SetDataStepKind, SetVariableStepKind } from '../../models/http-actions/HttpActions.js';
import { RequestDataExtractor } from "../../data/RequestDataExtractor.js";
import { checkCondition } from "./ConditionCheck.js";
import { ApiSchemaValues } from "../../amf/ApiSchemaValues.js";
import { SameSiteValue } from "../../cookies/CookieParser.js";

type FlowValue = string | number | boolean | null | undefined;

export class HttpFlowRunner {
  /**
   * The cumulative list of all variables to be applied to the request and other properties.
   * The variables must be already processed for variables in values (evaluated).
   * 
   * These variables are passed by reference. Changes made anywhere to the variables will result 
   * with updating this list.
   */
  variables?: Record<string, string>;

  /**
   * An instance of a cookie jar (store) to put/read cookies.
   */
  cookies?: CookieJar;

  async request(request: IHttpRequest, flows?: IHttpActionFlow[]): Promise<void> {
    if (!flows || !flows.length) {
      return;
    }
    for (const flow of flows) {
      for (const action of flow.actions) {
        await this._runAction(action, request);
      }
    }
  }

  async response(request: IHttpRequest | ISentRequest, response: IResponse | IErrorResponse, flows?: IHttpActionFlow[]): Promise<void> {
    if (!flows || !flows.length) {
      return;
    }
    for (const flow of flows) {
      for (const action of flow.actions) {
        await this._runAction(action, request, response);
      }
    }
  }

  async _runAction(action: IHttpAction, request: IHttpRequest | ISentRequest, response?: IResponse | IErrorResponse): Promise<void> {
    const { steps, condition } = action;
    if (!Array.isArray(steps) || !steps.length) {
      return;
    }
    if (condition) {
      const meet = await this._satisfied(condition, request, response);
      if (!meet) {
        return;
      }
    }

    // this keeps a value from the last step to be passed to the next step.
    let lastResult: FlowValue;
    for (const step of steps) {
      lastResult = await this._runStep(step, lastResult, request, response);
    }
  }

  async _satisfied(condition: IHttpCondition, request: IHttpRequest | ISentRequest, response?: IResponse | IErrorResponse): Promise<boolean> {
    const { source, data, path, operator, value } = condition;
    if (!source || !operator) {
      return false;
    }
    const extractor = new RequestDataExtractor(request, response);
    const readValue = await extractor.extract(source, data, path);
    return checkCondition(readValue, operator, value);
  }

  async _runStep(step: IActionStep, input: FlowValue, request: IHttpRequest | ISentRequest, response?: IResponse | IErrorResponse): Promise<FlowValue> {
    switch (step.kind) {
      case ReadDataStepKind: return this._runReadDataStep(step as IReadDataStep, request, response);
      case SetDataStepKind: return this._runSetDataStep(step as ISetDataStep);
      case SetVariableStepKind: return this._runSetVariableStep(step as ISetVariableStep, input);
      case SetCookieStepKind: return this._runSetCookieStep(step as ISetCookieStep, input, request);
      case DeleteCookieStepKind: return this._runDeleteCookieStep(step as IDeleteCookieStep, request);
      default: return undefined;
    }
  }

  /**
   * A step that reads data from the request, response, or variables.
   * 
   * @param step The step configuration.
   * @param request The HttpRequest or the SentRequest (for responses)
   * @param response When available, the response data
   * @returns The read value or undefined.
   */
  async _runReadDataStep(step: IReadDataStep, request: IHttpRequest | ISentRequest, response?: IResponse | IErrorResponse): Promise<string | number | undefined> {
    const { source, data, enabled, path } = step;
    if (enabled === false) {
      return undefined;
    }
    if (source === ActionSourceEnum.request) {
      const extractor = new RequestDataExtractor(request);
      return extractor.extract(source, data, path);
    }

    if (source === ActionSourceEnum.response) {
      const extractor = new RequestDataExtractor(request, response);
      return extractor.extract(source, data, path);
    }

    if (source === ActionSourceEnum.variable && path && this.variables) {
      return this.variables[path];
    }

    return undefined;
  }

  /**
   * A step that returns a pre-configured value.
   * 
   * @param step The step configuration.
   * @returns The read value with applied data type.
   */
  _runSetDataStep(step: ISetDataStep): FlowValue {
    const { value, dataType, enabled } = step;
    if (enabled === false) {
      return undefined;
    }
    if (value === null || value === undefined) {
      return undefined;
    }
    return ApiSchemaValues.parseScalar(value, dataType);
  }

  /**
   * A step that sets a variable in the current environment.
   * 
   * @param step The step configuration.
   * @param value The value to set. A value that is `null` or `undefined` deletes the variable.
   */
  _runSetVariableStep(step: ISetVariableStep, value: FlowValue): FlowValue {
    const { name, enabled } = step;
    if (enabled === false || !name || !this.variables) {
      return undefined;
    }
    if (value === null || typeof value === undefined) {
      delete this.variables[name];
    } else {
      this.variables[name] = String(value);
    }
    return undefined;
  }

  /**
   * A step that sets a cookie.
   * 
   * @param step The step configuration.
   * @param value The value to sent on the cookie.
   * @param request The request object.
   */
  async _runSetCookieStep(step: ISetCookieStep, value: FlowValue, request: IHttpRequest | ISentRequest): Promise<FlowValue> {
    const { name, enabled, expires, hostOnly, httpOnly, sameSite, secure, session } = step;
    const { cookies } = this;
    if (enabled === false || !name || !cookies ) {
      return undefined;
    }
    if (value === null || typeof value === undefined) {
      return undefined;
    }
    const typedValue = String(value);
    let url: string;
    if (step.url) {
      url = step.url;
    } else {
      url = request.url;
    }
    const uri = new URL(url);
    const cookie = new HttpCookie({
      name: name,
      value: typedValue,
      sameSite: 'unspecified',
      domain: uri.host, // parser.hostname,
      path: uri.pathname,
    });

    const typed = sameSite as SameSiteValue;
    switch (typed.toLowerCase()) {
      case 'lax': cookie.sameSite = 'lax'; break;
      case 'strict': cookie.sameSite = 'strict'; break;
      case 'none': cookie.sameSite = 'no_restriction'; break;
    }
    if (expires) {
      cookie.expirationDate = expires;
    }
    if (typeof hostOnly === 'boolean') {
      cookie.hostOnly = hostOnly;
    }
    if (typeof httpOnly === 'boolean') {
      cookie.httpOnly = httpOnly;
    }
    if (typeof secure === 'boolean') {
      cookie.secure = secure;
    }
    if (typeof session === 'boolean') {
      cookie.session = session;
    }
    await cookies.setCookies(url, [cookie]);
    return undefined;
  }

  /**
   * A step to delete cookies from the cookie jar.
   */
  async _runDeleteCookieStep(step: IDeleteCookieStep, request: IHttpRequest | ISentRequest): Promise<FlowValue> {
    const { name, enabled } = step;
    const { cookies } = this;
    if (enabled === false || !cookies ) {
      return undefined;
    }
    let url: string;
    if (step.url) {
      url = step.url;
    } else {
      url = request.url;
    }
    await cookies.deleteCookies(url, name);
    return undefined;
  }
}
