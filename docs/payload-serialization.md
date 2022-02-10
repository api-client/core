# Payload serialization

This is available in: **browser** and **node**. However, due to API limitations in Node some features are not available.

Payload on the request or the response object can be anything from string, FormData, Blob/File, or any binary format. To deal with content serialization, specifically for files or data stores, this module comes with the `PayloadSerializer` class that transforms the data from the original type to a string and back to the original format. In most cases covered by the Advanced REST Client / API Client ecosystem it is not necessary to use this class as the corresponding models already use it internally. However, this class can be used directly.

## Low-level API

```ts
import { PayloadSerializer } from '@advanced-rest-client/core';

const serialized = await PayloadSerializer.serialize(new Blob(['test'], { type: 'plain/text' }));
// {
//   type: 'blob',
//   data: '....',
//   mime: 'plain/tex',
// }

const blob = await PayloadSerializer.deserialize(serialized);
// Blob(...)
```

### High-level API

The high level API is available in all models that deal with payload which extends the `SerializablePayload` class: `DataReader`, `HttpRequest`, `HttpResponse`, `ArcResponse`, `ErrorResponse`, and `SentRequest`.

These classes inherit a number of method that allow to read or write the payload on the instance.

```ts
import { HttpResponse } from '@advanced-rest-client/core';

const response = HttpResponse.fromValues(200, 'OK', 'content-type: application/json');
const data = JSON.stringify({ test: true });
const payload = Buffer.from(data);

await response.writePayload(Buffer.from(payload));
// sets the `payload` property.

const body = await response.readPayload();
// Buffer(...)

const forcedString = await response.readPayloadAsString();
// "{ \"test\": true }" but for other types it may be `undefined`.
```
