import { assert } from '@esm-bundle/chai';
import { DataTestHelper } from './DataTestHelper.js';
import { PostmanDataTransformer } from '../../src/models/transformers/PostmanDataTransformer.js';
import { HttpProject } from '../../src/models/HttpProject.js';
import { IMultipartBody, ISafePayload } from '../../src/lib/transformers/PayloadSerializer.js';

describe('Postman transformers', () => {
  describe('Postman data dump', () => {
    let projects: HttpProject[];
    before(async () => {
      const response = await DataTestHelper.getFile('Backup.postman_dump.json');
      const jsonData = JSON.parse(response);
      projects = await PostmanDataTransformer.transform(jsonData) as HttpProject[];
    });

    it('creates a project', () => {
      assert.typeOf(projects, 'array', 'returns an array');
      assert.lengthOf(projects, 1, 'has the project');
      const [project] = projects;
      
      assert.equal(project.info.name, 'HTTPBin');
    });

    it('creates an environment', () => {
      const { environments } = projects[0].definitions;
      assert.typeOf(environments, 'array', 'has the array');
      assert.lengthOf(environments, 1, 'has the environment');
      assert.equal(environments[0].info.name, 'Default', 'has the name');

      const { variables } = environments[0];
      assert.typeOf(variables, 'array', 'has the variables');
      assert.lengthOf(variables, 3, 'has all variables');
      
      const [v1, v2, v3] = variables;

      assert.equal(v1.name, 'collectionVariable');
      assert.equal(v1.value, 'test1234');
      assert.isTrue(v1.enabled);

      assert.equal(v2.name, 'disabledVariable');
      assert.equal(v2.value, 'other');
      assert.isFalse(v2.enabled);

      assert.equal(v3.name, 'withVar');
      assert.equal(v3.value, '${collectionVariable}-test');
      assert.isTrue(v3.enabled);
    });

    it('creates folders', () => {
      const [project] = projects;

      const folders = project.listFolders();
      assert.lengthOf(folders, 2, 'has 2 folders');
      
      const [f1, f2] = folders;

      assert.equal(f1.info.name, 'HTTP Methods');
      assert.equal(f1.info.description, 'Testing different HTTP verbs');
      assert.equal(f2.info.name, 'Status codes');
      assert.equal(f2.info.description, 'Generates responses with given status code');
    });

    it('creates sub-folders', () => {
      const [project] = projects;

      const folders = project.listFolders();
      const [, f2] = folders;
      
      const sub = f2.listFolders();

      assert.lengthOf(sub, 1, 'has all sub-folders');
      assert.equal(sub[0].info.name, 'Sub status codes');
    });

    it('creates requests on the root', () => {
      const [project] = projects;

      const requests = project.listRequests();
      assert.lengthOf(requests, 1, 'has the request');
      const [request] = requests;
      assert.equal(request.info.name, 'Free request');
      assert.equal(request.expects.url, 'https://api.com');
      assert.equal(request.expects.method, 'GET');
    });

    it('creates requests on a folder', () => {
      const [project] = projects;
      const folders = project.listFolders();
      const requests = folders[0].listRequests();
      
      assert.lengthOf(requests, 5, 'has all requests');
      const request = requests[2];
      assert.equal(request.info.name, '/put');
      assert.equal(request.info.description, 'The request\'s PUT parameters.');
      assert.equal(request.expects.url, 'https://httpbin.org/put');
      assert.equal(request.expects.method, 'PUT');
      assert.equal(request.expects.headers, 'Accept: application/json\n');
      assert.equal(request.expects.payload, 'www-form-urlencoded-value=a value&other-key=other value');
    });

    it('creates requests on a sub-folder', () => {
      const [project] = projects;
      const folders = project.listFolders();
      const [, f2] = folders;
      
      const sub = f2.listFolders();
      const requests = sub[0].listRequests();
      assert.lengthOf(requests, 1, 'has all requests');
      const [request] = requests;
      
      assert.equal(request.info.name, 'PUT status');
      assert.isUndefined(request.info.description);
      assert.equal(request.expects.url, 'https://httpbin.org/status/201');
      assert.equal(request.expects.method, 'PUT');
      assert.isUndefined(request.expects.headers);
      assert.isUndefined(request.expects.payload);
    });

    it('adds the "urlencoded" body', () => {
      const [project] = projects;
      const request = project.findRequest('/put');
      assert.equal(request.expects.payload, 'www-form-urlencoded-value=a value&other-key=other value');
    });

    it('ignores the "binary" body', () => {
      const [project] = projects;
      const request = project.findRequest('PUT status');
      assert.isUndefined(request.expects.payload);
    });

    it('adds the "params" body', () => {
      const [project] = projects;
      const request = project.findRequest('/patch');
      const body = request.expects.payload as ISafePayload;
      assert.typeOf(body, 'object');
      
      assert.equal(body.type, 'formdata');
      // file is ignored
      assert.lengthOf(body.data, 1);
      const part = body.data[0] as IMultipartBody;
      assert.isFalse(part.isFile);
      assert.isTrue(part.enabled);
      assert.equal(part.name, 'text-part');
      assert.equal(part.value, 'text value');
    });

    it('adds the "raw" body', () => {
      const [project] = projects;
      const request = project.findRequest('/post');
      const body = request.expects.payload as string;
      assert.typeOf(body, 'string');
      
      assert.equal(body, '{\n    "kind": "test",\n    "key": "value"\n}');
    });
  });

  describe('Collection v2.0', () => {
    let project: HttpProject;
    before(async () => {
      const response = await DataTestHelper.getFile('HTTPBin.postman_collection-2.0.json');
      const jsonData = JSON.parse(response);
      project = await PostmanDataTransformer.transform(jsonData) as HttpProject;
    });

    it('creates a project', () => {
      assert.typeOf(project, 'object', 'returns the project');
      
      assert.equal(project.info.name, 'HTTPBin');
    });

    it('creates an environment', () => {
      const { environments } = project.definitions;
      assert.typeOf(environments, 'array', 'has the array');
      assert.lengthOf(environments, 1, 'has the environment');
      assert.equal(environments[0].info.name, 'Default', 'has the name');

      const { variables } = environments[0];
      assert.typeOf(variables, 'array', 'has the variables');
      assert.lengthOf(variables, 3, 'has all variables');
      
      const [v1, v2, v3] = variables;

      assert.equal(v1.name, 'collectionVariable');
      assert.equal(v1.value, 'test1234');
      assert.isTrue(v1.enabled);

      assert.equal(v2.name, 'disabledVariable');
      assert.equal(v2.value, 'other');
      assert.isFalse(v2.enabled);

      assert.equal(v3.name, 'withVar');
      assert.equal(v3.value, '${collectionVariable}-test');
      assert.isTrue(v3.enabled);
    });

    it('creates folders', () => {
      const folders = project.listFolders();
      assert.lengthOf(folders, 2, 'has 2 folders');
      
      const [f1, f2] = folders;

      assert.equal(f1.info.name, 'HTTP Methods');
      assert.equal(f1.info.description, 'Testing different HTTP verbs');
      assert.equal(f2.info.name, 'Status codes');
      assert.equal(f2.info.description, 'Generates responses with given status code');
    });

    it('creates sub-folders', () => {
      const folders = project.listFolders();
      const [, f2] = folders;
      
      const sub = f2.listFolders();

      assert.lengthOf(sub, 1, 'has all sub-folders');
      assert.equal(sub[0].info.name, 'Sub status codes');
    });

    it('creates requests on the root', () => {
      const requests = project.listRequests();
      assert.lengthOf(requests, 1, 'has the request');
      const [request] = requests;
      assert.equal(request.info.name, 'Free request');
      assert.equal(request.expects.url, 'https://api.com');
      assert.equal(request.expects.method, 'GET');
    });

    it('creates requests on a folder', () => {
      const folders = project.listFolders();
      const requests = folders[0].listRequests();
      
      assert.lengthOf(requests, 5, 'has all requests');
      const request = requests[2];
      assert.equal(request.info.name, '/put');
      assert.equal(request.info.description, 'The request\'s PUT parameters.');
      assert.equal(request.expects.url, 'https://httpbin.org/put');
      assert.equal(request.expects.method, 'PUT');
      assert.equal(request.expects.headers, 'Accept: application/json');
      assert.equal(request.expects.payload, 'www-form-urlencoded-value=a value&other-key=other value');
    });

    it('creates requests on a sub-folder', () => {
      const folders = project.listFolders();
      const [, f2] = folders;
      const sub = f2.listFolders();
      const requests = sub[0].listRequests();
      const [request] = requests;
      
      assert.equal(request.info.name, 'PUT status');
      assert.isUndefined(request.info.description);
      assert.equal(request.expects.url, 'https://httpbin.org/status/201');
      assert.equal(request.expects.method, 'PUT');
      assert.isUndefined(request.expects.headers);
      assert.isUndefined(request.expects.payload);
    });

    it('adds the "urlencoded" body', () => {
      const request = project.findRequest('/put');
      assert.equal(request.expects.payload, 'www-form-urlencoded-value=a value&other-key=other value');
    });

    it('ignores the "binary" body', () => {
      const request = project.findRequest('PUT status');
      assert.isUndefined(request.expects.payload);
    });

    it('adds the "params" body', () => {
      const request = project.findRequest('/patch');
      const body = request.expects.payload as ISafePayload;
      assert.typeOf(body, 'object');
      
      assert.equal(body.type, 'formdata');
      // file is ignored
      assert.lengthOf(body.data, 1);
      const part = body.data[0] as IMultipartBody;
      assert.isFalse(part.isFile);
      assert.isTrue(part.enabled);
      assert.equal(part.name, 'text-part');
      assert.equal(part.value, 'text value');
    });

    it('adds the "raw" body', () => {
      const request = project.findRequest('/post');
      const body = request.expects.payload as string;
      assert.typeOf(body, 'string');
      
      assert.equal(body, '{\n    "kind": "test",\n    "key": "value"\n}');
    });
  });

  describe('Collection v2.1', () => {
    let project: HttpProject;
    before(async () => {
      const response = await DataTestHelper.getFile('HTTPBin.postman_collection-2.1.json');
      const jsonData = JSON.parse(response);
      project = await PostmanDataTransformer.transform(jsonData) as HttpProject;
    });

    it('creates a project', () => {
      assert.typeOf(project, 'object', 'returns the project');
      
      assert.equal(project.info.name, 'HTTPBin');
    });

    it('creates an environment', () => {
      const { environments } = project.definitions;
      assert.typeOf(environments, 'array', 'has the array');
      assert.lengthOf(environments, 1, 'has the environment');
      assert.equal(environments[0].info.name, 'Default', 'has the name');

      const { variables } = environments[0];
      assert.typeOf(variables, 'array', 'has the variables');
      assert.lengthOf(variables, 3, 'has all variables');
      
      const [v1, v2, v3] = variables;

      assert.equal(v1.name, 'collectionVariable');
      assert.equal(v1.value, 'test1234');
      assert.isTrue(v1.enabled);

      assert.equal(v2.name, 'disabledVariable');
      assert.equal(v2.value, 'other');
      assert.isFalse(v2.enabled);

      assert.equal(v3.name, 'withVar');
      assert.equal(v3.value, '${collectionVariable}-test');
      assert.isTrue(v3.enabled);
    });

    it('creates folders', () => {
      const folders = project.listFolders();
      assert.lengthOf(folders, 2, 'has 2 folders');
      
      const [f1, f2] = folders;

      assert.equal(f1.info.name, 'HTTP Methods');
      assert.equal(f1.info.description, 'Testing different HTTP verbs');
      assert.equal(f2.info.name, 'Status codes');
      assert.equal(f2.info.description, 'Generates responses with given status code');
    });

    it('creates sub-folders', () => {
      const folders = project.listFolders();
      const [, f2] = folders;
      
      const sub = f2.listFolders();

      assert.lengthOf(sub, 1, 'has all sub-folders');
      assert.equal(sub[0].info.name, 'Sub status codes');
    });

    it('creates requests on the root', () => {
      const requests = project.listRequests();
      assert.lengthOf(requests, 1, 'has the request');
      const [request] = requests;
      assert.equal(request.info.name, 'Free request');
      assert.equal(request.expects.url, 'https://api.com');
      assert.equal(request.expects.method, 'GET');
    });

    it('creates requests on a folder', () => {
      const folders = project.listFolders();
      const requests = folders[0].listRequests();
      
      assert.lengthOf(requests, 5, 'has all requests');
      const request = requests[2];
      assert.equal(request.info.name, '/put');
      assert.equal(request.info.description, 'The request\'s PUT parameters.');
      assert.equal(request.expects.url, 'https://httpbin.org/put');
      assert.equal(request.expects.method, 'PUT');
      assert.equal(request.expects.headers, 'Accept: application/json');
      assert.equal(request.expects.payload, 'www-form-urlencoded-value=a value&other-key=other value');
    });

    it('creates requests on a sub-folder', () => {
      const folders = project.listFolders();
      const [, f2] = folders;
      
      const sub = f2.listFolders();
      const requests = sub[0].listRequests();
      assert.lengthOf(requests, 1, 'has all requests');
      const [request] = requests;
      
      assert.equal(request.info.name, 'PUT status');
      assert.isUndefined(request.info.description);
      assert.equal(request.expects.url, 'https://httpbin.org/status/201');
      assert.equal(request.expects.method, 'PUT');
      assert.isUndefined(request.expects.headers);
      assert.isUndefined(request.expects.payload);
    });

    it('adds the "urlencoded" body', () => {
      const request = project.findRequest('/put');
      assert.equal(request.expects.payload, 'www-form-urlencoded-value=a value&other-key=other value');
    });

    it('ignores the "binary" body', () => {
      const request = project.findRequest('PUT status');
      assert.isUndefined(request.expects.payload);
    });

    it('adds the "params" body', () => {
      const request = project.findRequest('/patch');
      const body = request.expects.payload as ISafePayload;
      assert.typeOf(body, 'object');
      
      assert.equal(body.type, 'formdata');
      // file is ignored
      assert.lengthOf(body.data, 1);
      const part = body.data[0] as IMultipartBody;
      assert.isFalse(part.isFile);
      assert.isTrue(part.enabled);
      assert.equal(part.name, 'text-part');
      assert.equal(part.value, 'text value');
    });

    it('adds the "raw" body', () => {
      const request = project.findRequest('/post');
      const body = request.expects.payload as string;
      assert.typeOf(body, 'string');
      
      assert.equal(body, '{\n    "kind": "test",\n    "key": "value"\n}');
    });
  });
});
