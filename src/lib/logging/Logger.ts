export interface ILogger {
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

export abstract class Logger {
  abstract warn(...args: unknown[]): void;
  abstract info(...args: unknown[]): void;
  abstract error(...args: unknown[]): void;
  abstract log(...args: unknown[]): void;
  abstract debug(...args: unknown[]): void;
}
