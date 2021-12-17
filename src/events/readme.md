# Events

This package contains a definition of events used by the ARC ecosystem to communicate with context providers.

## Context provider

A context provider is any service that is listening for relevant events and responds to them by taking some action.

For example a Store Context Provider is a provider that listens to events related to the data models and performs CRUD operations on the data store. The result of the operation is passed to the `result` object of the event. The event is an instance of the CustomEvent class.

## Communication architecture

A module or an application wants to read the context value from a context provider. The module dispatches a CustomEvent on the application's EventTarget with the corresponding `type` handled by the context provider.

The provider handles the event, cancels it (when applicable, prevents duplication), and calls the corresponding asynchronous logic. The result of the operation is always a Promise. The promise is resolved when the operation finish

The promise is set on the `detail` object if the `CustomEvent` as the `result` property.

This has the following implications:

- all events are processed asynchronously
- all events must extend `CustomEvent` class, unless they have no side effects (no result, no data to pass to the provider)
