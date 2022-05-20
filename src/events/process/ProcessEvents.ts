import { ProcessEventTypes } from './ProcessEventTypes.js';

export interface IProcessStartDetail {
  pid: string;
  message: string;
}

export interface IProcessStopDetail {
  pid: string;
}

export interface IProcessErrorDetail {
  pid: string;
  message: string;
  error?: Error
}

export class ProcessEvents {
  /**
   * An event to be dispatched when the application is stating a long running process
   * in the background. The side effect of the event is the UI showing a process
   * indicator.
   * 
   * @param pid The id of the process. The same id has to be passed to the stop event.
   * @param message Optional message rendered in the UI.
   * @param target A node on which to dispatch the event.
   */
  static loadingStart(pid: string, message: string, target: EventTarget = window): void {
    const detail: IProcessStartDetail = { pid, message };
    const e = new CustomEvent(ProcessEventTypes.loadingStart, {
      cancelable: true,
      composed: true,
      bubbles: true,
      detail,
    });
    target.dispatchEvent(e);
  }

  /**
   * An event to be dispatched when the application has finished a long running process
   * in the background.
   * 
   * @param pid The id of the process. The same id has to be passed to the stop event.
   * @param target A node on which to dispatch the event.
   */
  static loadingStop(pid: string, target: EventTarget = window): void {
    const detail: IProcessStopDetail = { pid };
    const e = new CustomEvent(ProcessEventTypes.loadingStop, {
      cancelable: true,
      composed: true,
      bubbles: true,
      detail,
    });
    target.dispatchEvent(e);
  }

  /**
   * An event to be dispatched when the application has finished a long running process
   * in the background with an error.
   * 
   * @param pid The id of the process used to start it.
   * @param message The message to be rendered to the user.
   * @param error The error object caused the event. Optional.
   * @param target A node on which to dispatch the event.
   */
  static loadingError(pid: string, message: string, error?: Error, target: EventTarget = window): void {
    const detail: IProcessErrorDetail = { pid, message, error };
    const e = new CustomEvent(ProcessEventTypes.loadingError, {
      cancelable: true,
      composed: true,
      bubbles: true,
      detail,
    });
    target.dispatchEvent(e);
  }
}
