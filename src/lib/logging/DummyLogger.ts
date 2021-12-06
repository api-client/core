/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from './Logger.js';

export class DummyLogger extends Logger {
  warn(...args: unknown[]): void {
    // ...
  }
  info(...args: unknown[]): void {
    // ...
  }
  error(...args: unknown[]): void {
    // ...
  }
  log(...args: unknown[]): void {
    // ...
  }
  debug(...args: unknown[]): void {
    // ...
  }
}
