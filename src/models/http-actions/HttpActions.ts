import { SameSiteValue } from '../../cookies/CookieParser.js';

export const ReadDataStepKind = 'HttpAction#ReadData';
export const SetDataStepKind = 'HttpAction#SetData';
export const SetVariableStepKind = 'HttpAction#SetVariable';
export const SetCookieStepKind = 'HttpAction#SetCookie';
export const DeleteCookieStepKind = 'HttpAction#DeleteCookie';

export enum ActionSourceEnum {
  /**
   * The request object.
   */
  request = 'request',
  /**
   * The response object.
   */
  response = 'response',
  /**
   * A variable from the current environment.
   */
  variable = 'variable',
}

export enum ActionOperatorEnum {
  equal = "equal",
  notEqual = "not-equal",
  greaterThan = "greater-than",
  greaterThanEqual = "greater-than-equal",
  lessThan = "less-than",
  lessThanEqual = "less-than-equal",
  contains = "contains",
  regex = "regex",
}

export enum ActionRequestDataEnum {
  url = "url",
  method = "method",
  headers = "headers",
  body = "body"
}

export enum ActionResponseDataEnum {
  url = "url",
  status = "status",
  headers = "headers",
  body = "body"
}

/**
 * A flow represents a series of actions to be performed one-by-one after the HTTP request is sent or when the response 
 * is ready.
 */
export interface IHttpActionFlow {
  /**
   * The description of the flow
   */
  description?: string;
  /**
   * Describes when the flow is executed.
   * The `request` means the flow is executed before the request is sent to the HTTP engine.
   * The `response` means the flow is executed after the response has been received in full, but before reporting 
   * the response to the UI.
   */
  trigger: 'request' | 'response';
  /**
   * The ordered list of actions to execute.
   */
  actions: IHttpAction[];
}

/**
 * Describes a single action in a flow.
 * An action can have a condition that is checked against the current context.
 * Action is not executed when the condition is not meet.
 * 
 * Each action has one or more steps (when 0 items then the action is ignored). Each step performs a task.
 * The result of a task is passed to the next step as an input. The result of a task may be `void`, `null`, or `undefined` which is treated as `void`.
 */
export interface IHttpAction {
  /**
   * The description of the action
   */
  description?: string;
  /**
   * A condition to check before performing the action.
   */
  condition?: IHttpCondition;
  /**
   * The list of steps to perform. This is an ordered list of action tasks.
   * Each step is described by the `kind` property which tells the runner what action to perform.
   */
  steps: IActionStep[];
}

/**
 * A condition to execute for an action.
 */
export interface IHttpCondition {
  /**
   * The main data source.
   * In the legacy actions this was `type`.
   */
  source?: ActionSourceEnum;
  /**
   * Source of the data.
   * In the legacy actions this was `source`.
   * This is not required when the source is not `request` or `response`.
   */
  data?: ActionRequestDataEnum | ActionResponseDataEnum;
  /**
   * The path to the data.
   * For JSON value use https://jmespath.org/ syntax.
   * For XML use xpath.
   * For any other use a simple path to the data separated by dot (e.g. headers.content-type)
   */
  path?: string;
  /**
   * The comparison operator.
   */
  operator?: ActionOperatorEnum;
  /**
   * The value to compare the read result.
   * In runtime, the type is casted to the same type as read value.
   * 
   * When this is not set it compares to an empty string value or `0`.
   * 
   * In ARC actions this was the `predictedValue`.
   */
  value?: string;
}

export interface IActionStep {
  /**
   * The kind of the action to perform.
   */
  kind: string;
  /**
   * Whether the step is disabled in the flow.
   */
  enabled?: boolean;
}

/**
 * Reads the data from various sources.
 */
export interface IReadDataStep extends IActionStep {
  kind: typeof ReadDataStepKind;
  /**
   * The main data source.
   * In the legacy actions this was `type`.
   */
  source?: ActionSourceEnum;
  /**
   * Source of the data.
   * In the legacy actions this was `source`.
   * This is not required when the source is not `request` or `response`.
   */
  data?: ActionRequestDataEnum | ActionResponseDataEnum;
  /**
   * The path to the data.
   * For JSON value use https://jmespath.org/ syntax.
   * For XML use xpath.
   * For any other use a simple path to the data separated by dot (e.g. headers.content-type)
   */
  path?: string;
}

/**
 * Sets a manually defined value that can be passed to the next step.
 */
export interface ISetDataStep extends IActionStep {
  kind: typeof SetDataStepKind;
  /**
   * The value to return to the next step.
   * This is always a string. Use the `dataType` to determine the correct data type.
   */
  value: string;
  /**
   * The data type of the value. This is a value prefixed with 
   * `http://www.w3.org/2001/XMLSchema#` or `http://a.ml/vocabularies/shapes#`.
   * 
   * Examples:
   * 
   * - `http://www.w3.org/2001/XMLSchema#boolean`
   * - `http://www.w3.org/2001/XMLSchema#string`
   * - `http://www.w3.org/2001/XMLSchema#number`
   * - `http://www.w3.org/2001/XMLSchema#integer`
   * - `http://www.w3.org/2001/XMLSchema#long`
   * - `http://a.ml/vocabularies/shapes#number`
   * - `http://a.ml/vocabularies/shapes#integer`
   * - `http://a.ml/vocabularies/shapes#double`
   * - ...
   * 
   * @default `http://www.w3.org/2001/XMLSchema#string`
   */
  dataType?: string;
}

/**
 * A step that accepts an input from the previous step and sets a variable in the current environment
 * with this value. If the value is `void`, `null`, or `undefined` then the variable is removed from the 
 * environment.
 * 
 * All variables are strings.
 */
export interface ISetVariableStep extends IActionStep {
  kind: typeof SetVariableStepKind;
  /**
   * The name of the variable to set
   */
  name: string;
}

/**
 * A step that allows to set a cookie with the value returned by a previous step.
 */
export interface ISetCookieStep extends IActionStep {
  kind: typeof SetCookieStepKind;
  /**
   * Name of the cookie
   */
  name: string;
  /**
   * The URL associated with the cookie. When not set it uses the request URL or the request URL of the last redirect.
   */
  url?: string;
  /**
   * The cookie expiration time. It can be a valid cookie date or a string representing a relative time to "now"
   * like `4d`, `600s`, etc.
   */
  expires?: string;
  /**
   * Whether the cookie is host only
   */
  hostOnly?: boolean;
  /**
   * Whether the cookie is HTTP only
   */
  httpOnly?: boolean;
  /**
   * Whether the cookie is HTTPS only
   */
  secure?: boolean;
  /**
   * Whether the cookie is a session cookie
   */
  session?: boolean;
  /**
   * The SameSite parameter of the cookie.
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#creating_cookies
   */
  sameSite?: SameSiteValue;
}

/**
 * A step allowing to delete a cookie for the given configuration.
 * This step does not require an input.
 */
export interface IDeleteCookieStep extends IActionStep {
  kind: typeof DeleteCookieStepKind;
  /**
   * The URL associated with the cookie. When not set it uses the request URL or the request URL of the last redirect.
   */
  url?: string;
  /**
   * Name of the cookie to remove.
   * When not set it removes all cookies for the URL.
   */
  name?: string;
}
