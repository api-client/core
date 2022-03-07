# HTTP modules

This is available in the **node** only.

The request modules allow to extend ARC project's (or rather RequestFactory/ProjectRunner) functionality by providing a pluggable interface to inject *modules* before the request is sent to the remote machine or after the response is ready.

## The HTTP request modules

These modules are executed in order of registration after all variables are evaluated and the request actions are performed, but before the request is sent to the HTTP engine.

To register a request action use the `ModulesRegistry` class.

```ts
ModulesRegistry.register('request', 'request/cookies', cookiesProcessorFunction);
```

The first argument is controls whether the module is executed when in the request or the response phase. The second argument is the identifier of the module. Only a single module can be registered with the same id. You can use it to unregister a module later. The third argument is the function to be executed.

The registry also accepts the 4th argument which is the list of permissions the module requires to execute it's logic. The `RegistryPermission.events` adds access to the internal events bus of the application. The `RegistryPermission.environment` gives the module access to the current environment variables.

The callback function takes two arguments: the request object and the execution context.

```ts
import { IHttpRequest, ExecutionContext } from '@api-client/core';

async function processRequestCookies(request: IHttpRequest, context: ExecutionContext): Promise<void> {
  // do fun stuff
}
```

## The HTTP response modules

These modules are executed in order of registration after the response is received and the response actions are performed, but before the response is sent back to the UI.

To register a response action use the `ModulesRegistry` class.

```ts
ModulesRegistry.register('response', 'response/cookies', cookiesProcessorFunction);
```

The first argument is controls whether the module is executed when in the request or the response phase. The second argument is the identifier of the module. Only a single module can be registered with the same id. You can use it to unregister a module later. The third argument is the function to be executed.

The registry also accepts the 4th argument which is the list of permissions the module requires to execute it's logic. The `RegistryPermission.events` adds access to the internal events bus of the application. The `RegistryPermission.environment` gives the module access to the current environment variables.

The callback function takes two arguments: the log object and the execution context.

```ts
import { IRequestLog, ExecutionContext } from '@api-client/core';

async function processRequestCookies(log: IRequestLog, context: ExecutionContext): Promise<void> {
  // do fun stuff
}
```

## Execution context

By default the following properties are set on the context object:

```ts
interface ExecutionContext {
  /**
   * The event target for events
   */
  eventsTarget: EventTarget;
  /**
   * Request authorization configuration
   */
  authorization?: IRequestAuthorization[];
  /**
   * Optional request configuration.
   */
  config?: IRequestConfig;
  /**
   * Can be altered by the actions.
   */
  certificates?: IRequestCertificate[];
}
```

The `eventsTarget` is an events bus a module can use to communicate with the application or other logic connected to the same events bus.

The `authorization` is set only when the request object has authorization configuration. You should filter out the authorizations that are not enabled or invalid.

The `config` is set when the request has custom configuration passed to the HTTP engine.

The `certificates` is only populated by the `RequestAuthorization` module (built-in) which queries a data stere using the events bus for the certificate data. You can build own logic around that. Certificates are not populated when the `RequestAuthorization` module is not registered or when the events bus don't have the corresponding event attached to it.

Additionally, two more properties can be set on the context object depending on the permissions configuration.

## Requesting permissions

The fourth argument when registering a module is a list of permissions the module requires. Currently you can use the `events` and `environment` permissions.

### Events permission

It allows the module to access the internal events system that has several well-defined events to communicate with the application data store or other logic.

The executions events are:

- Authorization - allows to query for stored authorization data or to store authorization data.
- Environment - allows to query or modify environments data.
- Cookie - provides unlimited access to the session cookies
- Encryption - A service to encrypt or decrypt data. Currently only AES is supported.
- Process - Provides access to the internal user notification system
- ClientCertificate - Provides access to the client certificates store

Note, depending on the environment and the configuration not all events may be supported. For example a CLI tool may not be able to store cookies or environment data but the API Client does.

```ts
import { IHttpRequest, ExecutionContext, ExecutionResponse, RequestAuthorizationModule, RegistryPermission } from '@api-client/core';

async function handleAuth(request: IHttpRequest, context: ExecutionContext): Promise<number> {
  const cert = await context.Events.ClientCertificate.read(context.eventsTarget, 'cert-id');
  if (!result) {
    return ExecutionResponse.OK; // or ABORT
  }
  if (!Array.isArray(context.certificates)) {
    context.certificates = [];
  }
  context.certificates.push(result);
  return ExecutionResponse.OK;
}

ModulesRegistry.register('request', 'request/auth', handleAuth, [RegistryPermission.events]);
```

### Environment permission

This permission gives you access to the current environment variables. Note, this list may contains secrets. **Do not log any values from the environment**.

```ts
import { IHttpRequest, ExecutionContext, ExecutionResponse, RequestAuthorizationModule, RegistryPermission } from '@api-client/core';

async function handleRequest(request: IHttpRequest, context: ExecutionContext): Promise<number> {
  const { MY_TOKEN } = context.variables;
  await logRequest(request, MY_TOKEN);
  return ExecutionResponse.OK;
}

ModulesRegistry.register('request', 'request/env', handleRequest, [RegistryPermission.environment]);
```
