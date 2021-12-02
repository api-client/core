export interface IRunnable {
  kind?: unknown;
}

export abstract class Runnable {
  kind: unknown;
  abstract isValid(): boolean;
  abstract toJSON(): unknown;
}
