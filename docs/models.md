# Models

This is available in: **browser** and **node**.

This is the core of the ARC / API Client logic. It contains definitions and logic related to ARC projects (2022 version), HTTP request and responses, and all helper models working around these 3 definitions.

Using these models ensures:

- data consistency between versions
- consistent logic and data processing
- data serialization and deserialization

Each model implements the `toJSON()` function so it is safe to serialize a model with the `JSON.stringify()` function. Model serialized this way is easy to store in a key-value data store and then restored again.

```ts
import { HttpProject } from '@advanced-rest-client/core';

const project = HttpProject.fromName('My project');
const request = project.addRequest('https://api.com');

...

idbHandle.put(project, 'project123');

...

const idbRequest = idbHandle.get('project123');
idbRequest.onsuccess = () => {
  const restored = new HttpProject(idbRequest.result);
  const readRequest = restored.findRequest(request.key);

  assert.deepEqual(request, readRequest);
});
```
