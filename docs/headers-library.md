# Headers library

This is available in: **browser** and **node**.

The library is a drop-in replacement for native JavaScript's `Header` class, but without limitations of setting and reading the data.
Per Fetch object specification authors cannot set or read some headers. Because of that the original implementation is not the best choice to use with API testing tools.

To overcome this issue and be compatible with standards this module contains an implementation of the `Headers` class according to the Fetch specification. This implementation does not limit setting or reading of the data.

```ts
import { Headers } from '@api-client/core';

const headers = new Headers(`set-cookie: a=b;c=d`);
const cookies = headers.get('set-cookie');
console.log(cookies);
// a=b;c=d
```
