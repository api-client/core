# HTTP engine

This is available in the **node** only.

This module comes with own implementation of an HTTP engine. It is so to cover all use-cases for ARC / API Client. The engine operates directly on the socket and manages it's own connections. At the same time it produces a log of the performed operation with detailed timings and other details.

## Supported features

- HTTP 1.1 request
- Redirections
- Proxy (http proxy and tunneling for SSL connections)
- Proxy authorization
- Client certificates
- NTLM authorization
- Chunked connection
- compression: gzip, deflate, brotli
- events dispatched during crucial times of the request or response (loadstart, firstbyte, loadend, headersreceived)
- ergonomic async API
- timeouts
- aborting
- auto-filling headers to mimic base browser behavior

## Base request

```ts
import { ArcEngine, IHttpRequest, ArcResponse, IArcResponse, Headers } from '@advanced-rest-client/core';

const request: IHttpRequest = {
  url: 'https://google.com',
  method: 'GET',
};
const engine = new ArcEngine(request, {
  followRedirects: true,
});
const log = await request.send();
const response = new ArcResponse(data.response as IArcResponse);
const payload = await response.readPayload() as Buffer;
const headers = new Headers(response.headers);
```

## No logging output

```ts
import { ArcEngine, IHttpRequest, DummyLogger } from '@advanced-rest-client/core';

const logger = new DummyLogger();
const request: IHttpRequest = {
  url: 'https://google.com',
  method: 'GET',
};
const engine = new ArcEngine(request, {
  followRedirects: true,
  logger,
});
```

## PEM certificates

```ts
import { ArcEngine, IHttpRequest } from '@advanced-rest-client/core';

const request: IHttpRequest = {
  url: 'https://api.com/certs',
  method: 'GET',
};
const engine = new ArcEngine(request, {
  certificates: [{
    cert: {
      data: fs.readFileSync('./cert.pem', 'utf8'),
    },
    key: {
      data: fs.readFileSync('./key.pem', 'utf8'),
    },
    type: 'pem',
  }],
});
const log = await request.send();
```

## P12 certificates

```ts
import { ArcEngine, IHttpRequest } from '@advanced-rest-client/core';

const request: IHttpRequest = {
  url: 'https://api.com/certs',
  method: 'GET',
  headers: 'user-agent: api-client',
};
const engine = new ArcEngine(request, {
  certificates: [{
    cert: {
      data: fs.readFileSync('./cert.p12'),
      passphrase: 'my-pass',
    },
    type: 'p12',
  }],
});
const log = await request.send();
```

## Certificates validation

```ts
import { ArcEngine, IHttpRequest } from '@advanced-rest-client/core';

const request: IHttpRequest = {
  url: 'https://expired.badssl.com',
  method: 'GET',
};
const engine = new ArcEngine(request, {
  validateCertificates: false,
});
const log = await request.send();
// log.response.status === 200
```

## Sending body

```ts
import { ArcEngine, IHttpRequest } from '@advanced-rest-client/core';

const request: IHttpRequest = {
  url: 'https://api.com',
  method: 'POST',
  headers: 'Content-Length: 4\ncontent-type: plain/text',
  payload: 'test',
};
const engine = new ArcEngine(request);
const log = await request.send();
```

## Aborting the request

```ts
import { ArcEngine, IHttpRequest } from '@advanced-rest-client/core';

const request: IHttpRequest = {
  url: 'https://api.com',
  method: 'GET',
};
const engine = new ArcEngine(request);
const promise = request.send();
engine.abort();
promise.then(log => { ... });
```

## Virtual hosts

```ts
import { ArcEngine, IHttpRequest } from '@advanced-rest-client/core';

const request: IHttpRequest = {
  url: 'https://virtual.com/resource?a=b',
  method: 'GET',
};
const engine = new ArcEngine(request, {
  hosts: [
    {
      kind: 'ARC#HostRule',
      from: 'virtual.com',
      to: '127.0.0.1',
    }
  ],
});
const engine = new ArcEngine(request);
const log = await request.send();
// the request has the `virtual.com` host header but the connection is made to `127.0.0.1`. No DNS lookup.
```

## NTLM authorization

```ts
import { ArcEngine, IHttpRequest } from '@advanced-rest-client/core';

const request: IHttpRequest = {
  url: 'https://api.com/ntlm',
  method: 'GET',
};
const engine = new ArcEngine(request, {
  authorization: [
    {
      kind: 'ARC#RequestAuthorization',
      enabled: true,
      type: 'ntlm',
      valid: true,
      config: {
        username: 'u1',
        password: 'u2',
        domain: 'custom.com',
      },
    }
  ],
});
const engine = new ArcEngine(request);
const log = await request.send();
```

## HTTP proxy

```ts
import { ArcEngine, IHttpRequest } from '@advanced-rest-client/core';

const request: IHttpRequest = {
  url: 'https://api.com/resource',
  method: 'GET',
};
const engine = new ArcEngine(request, {
  proxy: '127.0.0.1:8080',
  proxyUsername: 'proxy-user',
  proxyPassword: 'proxy-password',
});
const engine = new ArcEngine(request);
const log = await request.send();
```
