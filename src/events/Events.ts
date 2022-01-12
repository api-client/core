import { ModelEvents } from './models/ModelEvents.js';
import { CookieEvents } from './cookies/CookieEvents.js';
import { AuthorizationEvents } from './authorization/AuthorizationEvents.js';
import { EncryptionEvents } from './encryption/EncryptionEvents.js';
import { ProcessEvents } from './process/ProcessEvents.js';
import { ReportingEvents } from './reporting/ReportingEvents.js';

export const Events = Object.freeze({
  Authorization: AuthorizationEvents,
  Cookie: CookieEvents,
  Encryption: EncryptionEvents,
  Model: ModelEvents,
  Process: ProcessEvents,
  Reporting: ReportingEvents, 
});
