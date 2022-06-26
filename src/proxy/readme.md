# HTTP Proxy

The libraries to create an HTTP/Socket proxy for API things (projects, requests).

## Libraries

- `AppProjectProxy` - a class that runs request from an `AppProject`
- `HttpProjectProxy` - a class that runs request from an `HttpProject`
- `RequestProxy` - a class that runs a single request as `HttpRequest`

## Architecture

The proxy is a 2-step process. In the first step the client sets-up a session (in a server that implements the proxy), processes the configuration, and validates the data.
In the second step the request is actually being executed. This 2nd step is very important when proxying `HttpRequest` as the `payload` read from the second server call is passed to the outgoing request (if any).
