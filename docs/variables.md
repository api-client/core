# Variables

This defines the behavior of *variables* in the Core libraries when executing an HTTP request, `HttpProject` request(s), or `AppProject` request(s).

## Single HTTP Request

When a single request executed outside the project then the variables are created only locally at runtime and are not propagated back to the project.

## Project request

During the execution the variables are evaluated from the project root (the application looks for an environment defined in the project root) and then merges variables with all environments read on the way to the current folder (if any).
Such prepared environment is passed to the HTTP request factory. By default environments inherit variables from all parents (in order from the project root to the current folder). If a variable is defined on a sub folder it is discarded by a parent folder when switching folders. However, when an HTTP request defines a flow where a variable is set then this variable is propagated to other (including parent) folders. This does not apply when the folder environment declares a variable (these variables are never propagated to the parent).
When an environment in a folder is marked as `encapsulated` then a new and empty variables list is created discarding previously set variables. These variables are propagated to child folders but none of them are propagated upwards to the parent.

This works the same in a serial or parallel mode.

## Usage examples

Say, you have an API where all requests are protected by a Bearer token. To run requests in a project you first need to perform authentication, then set a variable, and then run other requests in the project. To make this more complicated, the authorization server is in a different domain than the rest of the API.

For this, we create a project with a main environment definition with server configured as the base URI of the API, say `https://api.com/v1`.

Then we create a folder called `Authorization` and in it we create an environment with the folder environment, where the server is configured to the authorization server base URI. Say, `https://auth.com/oauth2`.
In the `Authorization` folder we create requests that correspond to the user OAuth2 flow. One request performs `POST` request to establish a session in the authentication server, like the user would by providing the username and the password. The second request performs token exchange. In both requests we use relative URLs to the configured environment's server base URI.
The token exchange request has configured an HTTP flow that performs the set variable step with name `apiToken`. This variable value is read from the response body. The `apiToken` variable is set for all other requests in the project.

After that we define the rest of the API calls adding the "Bearer" authorization configuration with the value `{apiToken}` (as defined in the authorization request from the previous step). Now each request executed in the project will have the authorization header set to `Bearer xxx` where the `xxx` is the value read from the authorization response.

## Reserved variable names

### baseUri

The base URI variable (`baseUri`) is always generated at runtime and the value is set to the current environment's base URI or to an empty string. Don't set this variable in your environments or HTTP flows as it will always be overwritten by the application logic.
