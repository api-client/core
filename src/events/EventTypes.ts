import { ModelEventTypes } from './models/ModelEventTypes.js';
import { CookieEventTypes } from './cookies/CookieEventTypes.js';
import { AuthorizationEventTypes } from './authorization/AuthorizationEventTypes.js';

export const EventTypes = Object.freeze({
  Authorization: AuthorizationEventTypes,
  Cookie: CookieEventTypes,
  Model: ModelEventTypes,
});
