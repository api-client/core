import { TelemetryEventTypes } from './TelemetryEventTypes.js';

export interface ITelemetryCustomMetric {
  index: number;
  value: number;
}
export interface ITelemetryCustomValue {
  index: number;
  value: string;
}

export interface ITelemetryDetail {
  customMetrics?: ITelemetryCustomMetric[];
  customDimensions?: ITelemetryCustomValue[];
}

export interface ITelemetryScreenViewDetail extends ITelemetryDetail {
  screenName: string;
}

export interface ITelemetryEventDetail extends ITelemetryDetail {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

export interface ITelemetryExceptionDetail extends ITelemetryDetail {
  description: string;
  fatal?: boolean;
}
export interface ITelemetrySocialDetail extends ITelemetryDetail {
  network: string;
  action: string;
  target: string;
}
export interface ITelemetryTimingDetail extends ITelemetryDetail {
  category: string;
  variable: string;
  value: number;
  label?: string;
}

export class TelemetryEvents {
  /**
   * Sends application screen view event
   * @param target A node on which to dispatch the event
   * @param screenName The screen name
   * @param info Analytics base configuration
   */
  static view(screenName: string, target: EventTarget = window, info: ITelemetryDetail = {}): void {
    const detail: ITelemetryScreenViewDetail = {
      ...info, screenName,
    };
    const e = new CustomEvent(TelemetryEventTypes.view, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    target.dispatchEvent(e);
  }

  /**
   * Sends a Google Analytics event information
   * @param target A node on which to dispatch the event
   * @param detail The event configuration
   */
  static event(detail: ITelemetryEventDetail, target: EventTarget = window): void {
    const e = new CustomEvent(TelemetryEventTypes.event, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    target.dispatchEvent(e);
  }

  /**
   * Sends a Google Analytics exception information
   * @param target A node on which to dispatch the event
   * @param description The exception description
   * @param fatal Whether the exception was fatal to the application
   * @param info Analytics base configuration
   */
  static exception(description: string, fatal?: boolean, target: EventTarget = window, info: ITelemetryDetail = {}): void {
    const detail: ITelemetryExceptionDetail = { ...info, description, fatal };
    const e = new CustomEvent(TelemetryEventTypes.exception, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    target.dispatchEvent(e);
  }

  /**
   * Sends a Google Analytics social share information
   * @param target A node on which to dispatch the event
   * @param network The network where the shared content is shared
   * @param action The share action, eg. 'Share'
   * @param url The share url
   * @param info Analytics base configuration
   */
  static social(network: string, action: string, url: string, target: EventTarget = window, info: ITelemetryDetail = {}): void {
    const detail: ITelemetrySocialDetail = { ...info, network, action, target: url };
    const e = new CustomEvent(TelemetryEventTypes.social, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    target.dispatchEvent(e);
  }

  /**
   * Sends a Google Analytics application timing information
   * @param target A node on which to dispatch the event
   * @param category The timing category
   * @param variable The timing variable
   * @param value The timing value
   * @param label The timing label
   * @param info Analytics base configuration
   */
  static timing(category: string, variable: string, value: number, label?: string, target: EventTarget = window, info: ITelemetryDetail = {}): void {
    const detail: ITelemetryTimingDetail = { ...info, category, variable, value, label };
    const e = new CustomEvent(TelemetryEventTypes.timing, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    target.dispatchEvent(e);
  }

  static get State(): typeof StateEvents {
    return StateEvents;
  }
}

class StateEvents {
  /** 
   * Dispatched when the user made the initial telemetry settings.
   * The application can check for the sate of the telemetry in the corresponding configuration.
   * 
   * @param target The node on which to dispatch the event.
   */
  static set(target: EventTarget = window): void {
    const e = new Event(TelemetryEventTypes.State.set, {
      composed: true,
      cancelable: true,
      bubbles: true,
    });
    target.dispatchEvent(e);
  }
}
