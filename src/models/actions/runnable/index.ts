import { ISetVariableAction } from './SetVariableAction.js';
import { ISetCookieAction } from './SetCookieAction.js';
import { IDeleteCookieAction } from './DeleteCookieAction.js';
/**
 * Convenience type that gathers all configurations in one type.
 */
export type IActions = IDeleteCookieAction | ISetCookieAction | ISetVariableAction;
