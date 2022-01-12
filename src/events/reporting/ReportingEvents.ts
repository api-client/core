import { ReportingEventTypes } from './ReportingEventTypes.js';

export interface IReportingErrorDetail {
  description: string;
  error?: Error;
  component?: string;
}

export class ReportingEvents {
  /**
   * Dispatches the general error event for UI logging purposes.
   * 
   * @param target A node on which to dispatch the event
   * @param description The error description
   * @param error Optional original error object that has caused this event
   * @param component Optional component name.
   */
  static error(target: EventTarget, description: string, error?: Error, component?: string): void {
    const detail: IReportingErrorDetail = { error, description, component };
    const e = new CustomEvent(ReportingEventTypes.error, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    target.dispatchEvent(e);
  }
}
