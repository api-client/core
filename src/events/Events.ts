import { ModelEvents } from './models/ModelEvents.js';
import { CookieEvents } from './cookies/CookieEvents.js';

export const Events = Object.freeze({
  Model: ModelEvents,
  Cookie: CookieEvents,
});
