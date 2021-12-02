import { ISetVariableAction } from './SetVariableAction';
import { ISetCookieAction } from './SetCookieAction';
import { IDeleteCookieAction } from './DeleteCookieAction';
/**
 * Convenience type that gathers all configurations in one type.
 */
export type IActions = IDeleteCookieAction | ISetCookieAction | ISetVariableAction;
