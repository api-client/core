import { ModelEventTypes } from './models/ModelEventTypes.js';
import { CookieEventTypes } from './cookies/CookieEventTypes.js';
import { AuthorizationEventTypes } from './authorization/AuthorizationEventTypes.js';
import { EncryptionEventTypes } from './encryption/EncryptionEventTypes.js';
import { ProcessEventTypes } from './process/ProcessEventTypes.js';
import { ReportingEventTypes } from './reporting/ReportingEventTypes.js';

export const EventTypes = Object.freeze({
  Authorization: AuthorizationEventTypes,
  Cookie: CookieEventTypes,
  Encryption: EncryptionEventTypes,
  Model: ModelEventTypes,
  Process: ProcessEventTypes,
  Reporting: ReportingEventTypes,
});
