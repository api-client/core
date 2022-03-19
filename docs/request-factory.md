# Request factory

This is available in the **node** only.

Request factory is a utility class that performs all tasks described in the [Request architecture](request-architecture.md) document. It is not necessary to use it, but it is helpful in many use-cases of API Client.

## Event bus and context stores

For the factory to pork correctly you need to attach an `eventTarget` that has context-stores attached to it. Context stores offer an indirect access to the application data stores / services. They register event listeners and when the event is handled they perform an asynchronous operation.

An example of such context-store is Electron's cookie service. YOu can create a bridge that listens for the cookie query events and then rely this query to the Electron's main process to query for cookies. In the response the store sets the data back on the event's `detail` object which is then returned to the requesting module.

In the most basic scenario you can use a simple `EventTarget` class to initialize the factory class.

```ts
import { RequestFactory, EventTypes } from '@api-client/core';

const target = new EventTarget(); // since Node v15.4.0

async function encryptData(data: string, passphrase?: string, method='AES'): Promise<string> {
  ...
}

target.addEventListener(EventTypes.Encryption.encrypt, (e) => {
  const ev = e as CustomEvent;
  const { data, passphrase, method } = e.detail;
  e.detail.result = encryptData(data, passphrase, method);
});

const factory = new RequestFactory(target);
```

## Sending a request

To send a request simply call the `run()` function with the `IHttpRequest` object as an argument. Depending on the configuration the factory performs different tasks.

```ts
import { RequestFactory, EventTypes, IHttpRequest } from '@api-client/core';

const target = new EventTarget();
const factory = new RequestFactory(target);
const request: IHttpRequest = {
  url: `http://api.com`,
  method: 'GET',
  headers: 'x-test: true',
};
const log = await factory.run(request);
```

### Request configuration

Set the `config` property to configure the behavior of the HTTP engine.

```ts
const factory = new RequestFactory(target);
factory.config = {
  kind: 'Core#RequestConfig',
  enabled: true,
  defaultHeaders: true,
  followRedirects: true,
};
```

### Request authorization

Set the `authorization` property to configure the authorization. Note, to apply the authorization data register the `RequestAuthorizationModule` HTTP module. Otherwise these data are ignored.

```ts
import { RequestFactory, RequestAuthorizationModule, RegistryPermission } from '@api-client/core';

ModulesRegistry.register('request', 'request/auth', RequestAuthorizationModule.default, [RegistryPermission.events]);

const factory = new RequestFactory(target);
factory.authorization = {
  kind: 'Core#RequestAuthorization',
  config: {
    token: 'test123',
  },
  enabled: true,
  type: 'bearer',
  valid: true,
};
```

### Request actions

Set the `actions` property to the request's request and response actions.

```ts
import { RequestFactory, Condition } from '@api-client/core';

const factory = new RequestFactory(target);
factory.actions = {
  response: [
    {
      kind: 'Core#RunnableAction',
      enabled: true,
      condition: Condition.alwaysPass().toJSON(),
      actions: [{
        kind: 'Core#Action',
        config: {
          kind: 'Core#DeleteCookieAction',
          url: 'https://api.com',
        }
      }]
    }
  ],
};
```

### Request certificates

Set the `certificates` property with the list of client certificates to use.

```ts
const factory = new RequestFactory(target);
factory.actions = {
  certificates: [
    {
      cert: {
        data: fs.readFileSync('./cert.pem', 'utf8'),
      },
      key: {
        data: fs.readFileSync('./key.pem', 'utf8'),
      },
      type: 'pem',
    }
  ],
};
```

### Environment variables

Set the `variables` property with the variables to be applies to the HTTP request data and request/response actions.

```ts
const factory = new RequestFactory(target);
factory.variables = {
  MY_TOKEN: '...',
  ...
};
```

### Logger

Set the `logger` property to use the passed logger

```ts
import { RequestFactory, DummyLogger } from '@api-client/core';
const factory = new RequestFactory(target);
factory.logger = new DummyLogger();
```
