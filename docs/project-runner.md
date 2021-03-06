# Project runner

This is available in the **node** only.

The `ProjectRequestRunner` class specializes in running requests defined in API Client projects. The class allows to select a project folder end execute each request one-by-one.

## Running requests in the root of a project

```ts
import { ProjectRequestRunner, HttpProject } from '@api-client/core';

const project = new HttpProject(...);
const runner = new ProjectRequestRunner(project);
const result = await runner.run(folder.key);
```

## Running requests in a folder

```ts
import { ProjectRequestRunner, HttpProject } from '@api-client/core';

const project = new HttpProject();
const folder = project.addFolder();

const request = ProjectRequest.fromHttpRequest({
  url: `http://localhost:${httpPort}/v1/get`,
  method: 'GET',
  headers: 'x-test: true',
}, project);
folder.addRequest(request);

const runner = new ProjectRequestRunner(project);
const result = await runner.run(folder.key);
```

## Applying custom environment

When passing a second argument to the `ProjectRequestRunner` constructor it overrides any existing in the project environments and use this definition instead. It is a flexible way to manage environments in the project.

```ts
import { ProjectRequestRunner, HttpProject, Environment } from '@api-client/core';

const project = new HttpProject(...);
const env = Environment.fromName('master');
env.addVariable('httpPort', httpPort);
const runner = new ProjectRequestRunner(project);
const result = await runner.run();
```
