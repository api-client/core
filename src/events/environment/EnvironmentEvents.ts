import { EnvironmentEventTypes } from './EnvironmentEventTypes.js';
import { ContextEvent } from "../BaseEvents.js";

export interface ISetVariableDetail {
  name: string;
  value: string;
}

export class EnvironmentEvents {
  /**
   * An event dispatched to set a variable in the current environment.
   * 
   * @param name Variable name
   * @param value Variable value
   * @param target A node on which to dispatch the event.
   * @returns Nothing. The promise resolves when the variable is set.
   */
  static async set(name: string, value: string, target: EventTarget = window): Promise<void> {
    const detail: ISetVariableDetail = { name, value };
    const e = new ContextEvent<ISetVariableDetail, void>(EnvironmentEventTypes.set, detail);
    target.dispatchEvent(e);
    return e.detail.result;
  }
}
