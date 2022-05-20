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
   * @param description The error description
   * @param error Optional original error object that has caused this event
   * @param component Optional component name.
   * @param target A node on which to dispatch the event
   */
  static error(description: string, error?: Error, component?: string, target: EventTarget = window): void {
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
