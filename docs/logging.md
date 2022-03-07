# Logging

This is available in: **browser** and **node**.

The library contains a base definition of loggers used in the API Client ecosystem.
You can use them to create own loggers, use a default one, or use a dummy to prevent logging output.

## The default logger

```ts
import { DefaultLogger } from '@api-client/core';

const logger = new DefaultLogger(); // uses the default `console`

const factory = new RequestFactory(new EventsTarget());
factory.logger = logger;
```

## The dummy logger

```ts
import { DummyLogger } from '@api-client/core';

const logger = new DummyLogger(); // no output

const factory = new RequestFactory(new EventsTarget());
factory.logger = logger;
```

### Defining custom logger

```ts
import { Logger } from '@api-client/core';

class FileLogger extends Logger {
  file: string;

  constructor(file: string) {
    this.file = file;
  }

  private commit(type, ...args: unknown[]): Promise<void> {
    // ...save to file
    // also, this is not safe. Use queues to save data to the file.
  }

  warn(...args: unknown[]): void {
    this.commit('warn', ...args);
  }
  info(...args: unknown[]): void {
    this.commit('info', ...args);
  }
  error(...args: unknown[]): void {
    this.commit('error', ...args);
  }
  log(...args: unknown[]): void {
    this.commit('log', ...args);
  }
  debug(...args: unknown[]): void {
    this.commit('debug', ...args);
  }
}
```
