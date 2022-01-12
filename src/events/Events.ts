import { ModelEvents } from './models/ModelEvents.js';
import { CookieEvents } from './cookies/CookieEvents.js';
import { AuthorizationEvents } from './authorization/AuthorizationEvents.js';

export const Events = Object.freeze({
  Authorization: AuthorizationEvents,
  Cookie: CookieEvents,
  Model: ModelEvents,
});
