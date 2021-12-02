import { Logger } from './Logger';

export class DefaultLogger extends Logger {
  warn(...args: unknown[]): void {
    console.warn(...args);
  }
  info(...args: unknown[]): void {
    console.info(...args);
  }
  error(...args: unknown[]): void {
    console.error(...args);
  }
  log(...args: unknown[]): void {
    console.log(...args);
  }
  debug(...args: unknown[]): void {
    console.debug(...args);
  }
}
