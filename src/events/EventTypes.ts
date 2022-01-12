import { ModelEventTypes } from './models/ModelEventTypes.js';
import { CookieEventTypes } from './cookies/CookieEventTypes.js';

export const EventTypes = Object.freeze({
  Model: ModelEventTypes,
  Cookie: CookieEventTypes,
});
