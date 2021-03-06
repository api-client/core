import { ModelEvents } from './models/ModelEvents.js';
import { CookieEvents } from './cookies/CookieEvents.js';
import { AuthorizationEvents } from './authorization/AuthorizationEvents.js';
import { EncryptionEvents } from './encryption/EncryptionEvents.js';
import { ProcessEvents } from './process/ProcessEvents.js';
import { ReportingEvents } from './reporting/ReportingEvents.js';
import { TelemetryEvents } from './telemetry/TelemetryEvents.js';
import { TransportEvent } from './transport/TransportEvents.js';
import { EnvironmentEvents } from './environment/EnvironmentEvents.js';
import { AmfEvents } from './amf/AmfEvents.js';

export const Events = Object.freeze({
  Amf: AmfEvents,
  Authorization: AuthorizationEvents,
  Cookie: CookieEvents,
  Encryption: EncryptionEvents,
  Model: ModelEvents,
  Process: ProcessEvents,
  Reporting: ReportingEvents, 
  Telemetry: TelemetryEvents,
  Transport: TransportEvent,
  Environment: EnvironmentEvents,
});
