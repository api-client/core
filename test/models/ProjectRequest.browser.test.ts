/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { Kind as ProjectRequestKind, ProjectRequest, IProjectRequest } from '../../src/models/ProjectRequest.js';
import { HttpProject } from '../../src/models/HttpProject.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';
import { Kind as HttpRequestKind, IHttpRequest } from '../../src/models/HttpRequest.js';
import { Kind as RequestLogKind, RequestLog } from '../../src/models/RequestLog.js';
import { SentRequest } from '../../src/models/SentRequest.js';
import { RequestConfig } from '../../src/models/RequestConfig.js';
import { RequestAuthorization } from '../../src/models/RequestAuthorization.js';
import { IRequestUiMeta } from '../../src/models/RequestUiMeta.js';
import { Request, IRequest, Kind as RequestKind } from '../../src/models/Request.js';
import { Kind as ProjectFolderKind, ProjectFolder } from '../../src/models/ProjectFolder.js';

describe('Models', () => {
  describe('ProjectRequest', () => {
    describe('Initialization', () => {
      describe('Default project initialization', () => {
        let project: HttpProject;
        beforeEach(() => {
          project = new HttpProject();
        });

        it('initializes a default project request', () => {
          const result = new ProjectRequest(project);
          assert.equal(result.kind, ProjectRequestKind, 'sets the kind property');
          assert.typeOf(result.created, 'number', 'sets the created property');
          assert.equal(result.updated, result.created, 'sets the updated property');
          assert.typeOf(result.midnight, 'number', 'sets the updated property');
          assert.typeOf(result.key, 'string', 'sets the key property');
          assert.typeOf(result.info, 'object', 'sets the info property');
          assert.typeOf(result.expects, 'object', 'sets the expects property');
          assert.isUndefined(result.log, 'does not set the log property');
          assert.isUndefined(result.config, 'does not set the config property');
          assert.isUndefined(result.authorization, 'does not set the authorization property');
          assert.isUndefined(result.ui, 'does not set the ui property');
          assert.isUndefined(result.actions, 'does not set the actions property');
          assert.isUndefined(result.clientCertificate, 'does not set the clientCertificate property');
        });
      });

      describe('From schema initialization', () => {
        let project: HttpProject;
        let base: IProjectRequest;
        beforeEach(() => {
          project = new HttpProject();
          base = {
            kind: ProjectRequestKind,
            info: {
              kind: ThingKind,
              name: '',
            },
            key: '',
            expects: {
              kind: HttpRequestKind,
              method: '',
              url: '',
            }
          }
        });

        it('sets the kind property', () => {
          const init: IProjectRequest = { ...base };
          const request = new ProjectRequest(project, init);
          assert.equal(request.kind, ProjectRequestKind);
        });

        it('sets the key property when missing', () => {
          const init: IProjectRequest = { ...base };
          delete init.key;
          const request = new ProjectRequest(project, init);
          assert.typeOf(request.key, 'string');
          assert.isNotEmpty(request.key);
        });

        it('sets the key property', () => {
          const init: IProjectRequest = { ...base, ... { key: 'test' } };
          const request = new ProjectRequest(project, init);
          assert.equal(request.key, 'test');
        });

        it('sets the expects property when missing', () => {
          const init: IProjectRequest = { ...base };
          delete init.expects;
          const request = new ProjectRequest(project, init);
          assert.typeOf(request.expects, 'object');
          assert.equal(request.expects.method, 'GET');
          assert.equal(request.expects.url, '');
        });

        it('sets the expects property', () => {
          const init: IProjectRequest = { ...base, ... { expects: { kind: HttpRequestKind, url: 'test.com', method: 'GET' } } };
          const request = new ProjectRequest(project, init);
          assert.typeOf(request.expects, 'object');
          assert.equal(request.expects.method, 'GET');
          assert.equal(request.expects.url, 'test.com');
        });

        it('sets the info property when missing', () => {
          const init: IProjectRequest = { ...base };
          delete init.info;
          const request = new ProjectRequest(project, init);
          assert.typeOf(request.info, 'object');
          assert.equal(request.info.name, '');
        });

        it('sets the info property', () => {
          const init: IProjectRequest = { ...base, ... { info: { kind: ThingKind, name: 'A request' } } };
          const request = new ProjectRequest(project, init);
          assert.typeOf(request.info, 'object');
          assert.equal(request.info.name, 'A request');
        });

        it('sets the log property', () => {
          const sentRequest = SentRequest.fromBaseValues({
            url: 'test.com', 
            startTime: Date.now(),
          });
          const log = RequestLog.fromRequest(sentRequest.toJSON());
          const init: IProjectRequest = { ...base, ... { log: log.toJSON() } };
          const request = new ProjectRequest(project, init);
          assert.typeOf(request.log, 'object');
          assert.equal(request.log.kind, RequestLogKind);
          assert.typeOf(request.log.request, 'object');
          assert.equal(request.log.request.url, 'test.com');
        });

        it('sets the config property', () => {
          const config = RequestConfig.withDefaults();
          const init: IProjectRequest = { ...base, ... { config: config.toJSON() } };
          const request = new ProjectRequest(project, init);
          assert.typeOf(request.config, 'object');
          assert.isTrue(request.config.enabled);
          assert.equal(request.config.timeout, 90);
        });

        it('sets the authorization property', () => {
          const authorization = new RequestAuthorization();
          const init: IProjectRequest = { ...base, ... { authorization: [authorization.toJSON()] } };
          const request = new ProjectRequest(project, init);
          assert.typeOf(request.authorization, 'array');
          assert.lengthOf(request.authorization, 1);
        });

        it('sets the created property', () => {
          const init: IProjectRequest = { ...base, ...{ created: 123 } };
          const request = new ProjectRequest(project, init);
          assert.equal(request.created, 123);
        });

        it('sets the default created property', () => {
          const init: IProjectRequest = { ...base };
          const request = new ProjectRequest(project, init);
          assert.typeOf(request.created, 'number');
        });

        it('sets the updated property', () => {
          const init: IProjectRequest = { ...base, ...{ updated: 123 } };
          const request = new ProjectRequest(project, init);
          assert.equal(request.updated, 123);
        });

        it('sets the default updated property', () => {
          const init: IProjectRequest = { ...base };
          const request = new ProjectRequest(project, init);
          assert.equal(request.updated, request.created);
        });

        it('sets the midnight property', () => {
          const init: IProjectRequest = { ...base, ...{ midnight: 123 } };
          const request = new ProjectRequest(project, init);
          assert.equal(request.midnight, 123);
        });

        it('sets the default midnight property', () => {
          const now = new Date();
          const init: IProjectRequest = { ...base, updated: now.getTime() };
          const request = new ProjectRequest(project, init);
          now.setHours(0, 0, 0, 0);
          assert.equal(request.midnight, now.getTime());
        });

        it('sets the ui property', () => {
          const ui: IRequestUiMeta = {
            selectedEditor: 1,
          };
          const init: IProjectRequest = { ...base, ui };
          const request = new ProjectRequest(project, init);
          assert.typeOf(request.ui, 'object');
          assert.equal(request.ui.selectedEditor, 1);
        });
      });

      describe('From JSON string initialization', () => {
        it('restores project data from JSON string', () => {
          const project = new HttpProject();
          const request = project.addRequest('https://api.com');
          const str = JSON.stringify(request);
          
          const result = new ProjectRequest(project, str);

          assert.equal(result.key, request.key, 'restores the key');
          assert.equal(result.info.name, 'https://api.com', 'restores the info object');
          assert.equal(result.expects.url, 'https://api.com', 'restores the expects object');
        });
      });

      describe('ProjectRequest.fromUrl()', () => {
        const url = 'https://api.com';

        let project: HttpProject;
        beforeEach(() => {
          project = new HttpProject();
        });

        it('sets the request values', () => {
          const request = ProjectRequest.fromUrl(url, project);
          const { expects } = request;
          assert.equal(expects.url, url, 'sets the url');
          assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
          assert.equal(expects.method, 'GET', 'sets the HTTP method');
        });

        it('sets the info values', () => {
          const request = ProjectRequest.fromUrl(url, project);
          const { info } = request;
          assert.equal(info.name, url, 'sets the name');
          assert.equal(info.kind, ThingKind, 'sets the kind');
        });

        it('sets request meta', () => {
          const request = ProjectRequest.fromUrl(url, project);
          assert.typeOf(request.key, 'string', 'has the key');
          assert.equal(request.kind, ProjectRequestKind, 'sets the kind');
          assert.typeOf(request.created, 'number', 'sets the created');
          assert.equal(request.updated, request.created, 'sets the updated');
        });

        it('throws when the project ius missing', () => {
          assert.throws(() => {
            ProjectRequest.fromUrl(url);
          }, 'The project is required.');
        });
      });

      describe('ProjectRequest.fromName()', () => {
        const name = 'a request';

        let project: HttpProject;
        beforeEach(() => {
          project = new HttpProject();
        });

        it('sets the request values', () => {
          const request = ProjectRequest.fromName(name, project);
          const { expects } = request;
          assert.equal(expects.url, '', 'sets the empty url');
          assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
          assert.equal(expects.method, 'GET', 'sets the HTTP method');
        });

        it('sets the info values', () => {
          const request = ProjectRequest.fromName(name, project);
          const { info } = request;
          assert.equal(info.name, name, 'sets the name');
          assert.equal(info.kind, ThingKind, 'sets the kind');
        });

        it('sets request meta', () => {
          const request = ProjectRequest.fromName(name, project);
          assert.typeOf(request.key, 'string', 'has the key');
          assert.equal(request.kind, ProjectRequestKind, 'sets the kind');
          assert.typeOf(request.created, 'number', 'sets the created');
          assert.equal(request.updated, request.created, 'sets the updated');
        });

        it('throws when the project ius missing', () => {
          assert.throws(() => {
            ProjectRequest.fromName(name);
          }, 'The project is required.');
        });
      });

      describe('ProjectRequest.fromHttpRequest()', () => {
        let iRequest: IHttpRequest;

        let project: HttpProject;
        beforeEach(() => {
          project = new HttpProject();
          iRequest = {
            kind: HttpRequestKind,
            method: 'PUT',
            url: 'https://api.com',
            headers: 'x-test: true',
            payload: 'something',
          };
        });

        it('sets the request values', () => {
          const request = ProjectRequest.fromHttpRequest(iRequest, project);
          const { expects } = request;
          assert.equal(expects.url, iRequest.url, 'sets the empty url');
          assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
          assert.equal(expects.method, iRequest.method, 'sets the HTTP method');
          assert.equal(expects.headers, iRequest.headers, 'sets the headers');
          assert.equal(expects.payload, iRequest.payload, 'sets the payload');
        });

        it('sets the info values', () => {
          const request = ProjectRequest.fromHttpRequest(iRequest, project);
          const { info } = request;
          assert.equal(info.name, iRequest.url, 'sets the name');
          assert.equal(info.kind, ThingKind, 'sets the kind');
        });

        it('sets request meta', () => {
          const request = ProjectRequest.fromHttpRequest(iRequest, project);
          assert.typeOf(request.key, 'string', 'has the key');
          assert.equal(request.kind, ProjectRequestKind, 'sets the kind');
          assert.typeOf(request.created, 'number', 'sets the created');
          assert.equal(request.updated, request.created, 'sets the updated');
        });

        it('throws when the project ius missing', () => {
          assert.throws(() => {
            ProjectRequest.fromHttpRequest(iRequest);
          }, 'The project is required.');
        });
      });

      describe('ProjectRequest.fromRequest()', () => {
        let iRequest: IRequest;

        let project: HttpProject;
        beforeEach(() => {
          project = new HttpProject();
          const httpRequest: IHttpRequest = {
            kind: RequestKind,
            method: 'PUT',
            url: 'https://api.com',
            headers: 'x-test: true',
            payload: 'something',
          };
          const r = Request.fromHttpRequest(httpRequest);
          r.info.name = 'a name';
          iRequest = r.toJSON();
        });

        it('sets the request values', () => {
          const request = ProjectRequest.fromRequest(iRequest, project);
          const { expects } = request;
          assert.equal(expects.url, iRequest.expects.url, 'sets the empty url');
          assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
          assert.equal(expects.method, iRequest.expects.method, 'sets the HTTP method');
          assert.equal(expects.headers, iRequest.expects.headers, 'sets the headers');
          assert.equal(expects.payload, iRequest.expects.payload, 'sets the payload');
        });

        it('sets the info values', () => {
          const request = ProjectRequest.fromRequest(iRequest, project);
          const { info } = request;
          assert.equal(info.name, 'a name', 'sets the name');
          assert.equal(info.kind, ThingKind, 'sets the kind');
        });

        it('sets request meta', () => {
          const request = ProjectRequest.fromRequest(iRequest, project);
          assert.typeOf(request.key, 'string', 'has the key');
          assert.equal(request.kind, ProjectRequestKind, 'sets the kind');
          assert.typeOf(request.created, 'number', 'sets the created');
          assert.equal(request.updated, request.created, 'sets the updated');
        });
      });
    });

    describe('getParent()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('returns the project object', () => {
        const r = project.addRequest('https://api.com');
        const result = r.getParent();
        assert.isTrue(result === project);
      });

      it('returns the folder object', () => {
        const folder = project.addFolder('a folder');
        const r = folder.addRequest('https://api.com');
        const result = r.getParent();
        assert.isTrue(result === folder);
      });
    });

    describe('getProject()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('returns the project when added to the project', () => {
        const r = project.addRequest('https://api.com');
        const result = r.getProject();
        assert.isTrue(result === project);
      });

      it('returns the project when added to a folder', () => {
        const folder = project.addFolder('a folder');
        const r = folder.addRequest('https://api.com');
        const result = r.getProject();
        assert.isTrue(result === project);
      });
    });

    describe('remove()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('removes from a project root', () => {
        const r = project.addRequest('https://api.com');
        r.remove();
        assert.deepEqual(project.items, []);
        assert.deepEqual(project.definitions, []);
      });

      it('removes from a folder', () => {
        const folder = project.addFolder('a folder');
        const r = folder.addRequest('https://api.com');
        r.remove();
        assert.deepEqual(folder.items, [], 'folder has no items');
        assert.lengthOf(project.items, 1, 'projects has a single item');
        assert.lengthOf(project.items.filter(i => i.kind === ProjectFolderKind), 1, 'projects has only folder items');
        assert.lengthOf(project.definitions, 1, 'projects has a single definition');
        assert.lengthOf(project.definitions.filter(i => i.kind === ProjectFolderKind), 1, 'projects has only folder definition');
      });
    });

    describe('clone()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      describe('project root', () => {
        it('clones with defaults from a project root', () => {
          const r = project.addRequest('https://api.com');
          const result = r.clone();
          assert.typeOf(result.key, 'string', 'has the key');
          assert.notEqual(result.key, r.key, 'has a different key');
          assert.lengthOf(project.items, 2, 'project has a new item');
          assert.isTrue(project.items.some(i => i.key === result.key), 'the project has the new item');
          assert.lengthOf(project.definitions, 2, 'project has a new definition');
          assert.isTrue(project.definitions.some(i => i.key === result.key), 'the project has the new definition');
        });

        it('does not change the key', () => {
          const r = project.addRequest('https://api.com');
          const result = r.clone({ withoutRevalidate: true });
          assert.equal(result.key, r.key);
        });

        it('does not attach to the project', () => {
          const r = project.addRequest('https://api.com');
          const result = r.clone({ withoutAttach: true });
          
          assert.lengthOf(project.items, 1, 'project has no new items');
          assert.isFalse(project.items.some(i => i.key === result.key), 'the project has the new item');
          assert.lengthOf(project.definitions, 1, 'project has no new definitions');
          assert.isFalse(project.definitions.some(i => i.key === result.key), 'the project has no new definitions');
        });

        it('copies a request from one project to another', () => {
          const r = project.addRequest('https://api.com');
          const result = r.clone({ withoutAttach: true });
          const target = new HttpProject();
          target.addRequest(result);
          assert.isTrue(result.getProject() === target, 'the request has a new project');
          assert.lengthOf(target.items, 1);
          assert.lengthOf(target.definitions, 1);
        });
      });

      describe('folder root', () => {
        let request: ProjectRequest;
        let folder: ProjectFolder;
        beforeEach(() => {
          folder = project.addFolder('a folder');
          request = folder.addRequest('https://api.com');
        });

        it('clones with defaults from a folder root', () => {
          const result = request.clone();
          assert.typeOf(result.key, 'string', 'has the key');
          assert.notEqual(result.key, request.key, 'has a different key');
          assert.lengthOf(project.items, 1, 'project has still a single item');
          assert.lengthOf(folder.items, 2, 'folder has a new item');
          assert.isTrue(folder.items.some(i => i.key === result.key), 'the folder has the new item');
          assert.lengthOf(project.definitions, 3, 'project has a new definition');
          assert.isTrue(project.definitions.some(i => i.key === result.key), 'the project has the new definition');
        });

        it('copies a request from one project to another', () => {
          const result = request.clone({ withoutAttach: true });
          const target = new HttpProject();
          target.addRequest(result);
          assert.isTrue(result.getProject() === target, 'the request has a new project');
          assert.lengthOf(target.items, 1);
          assert.lengthOf(target.definitions, 1);
        });
      });
    });

    describe('ProjectRequest.clone()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('clones the request', () => {
        const request = project.addRequest('https://api.com');
        const result = ProjectRequest.clone(request.toJSON(), project);

        assert.typeOf(result.key, 'string', 'has the key');
        assert.notEqual(result.key, request.key, 'has a different key');
        assert.lengthOf(project.items, 2, 'project has a new item');
        assert.isTrue(project.items.some(i => i.key === result.key), 'the project has the new item');
        assert.lengthOf(project.definitions, 2, 'project has a new definition');
        assert.isTrue(project.definitions.some(i => i.key === result.key), 'the project has the new definition');
      });
    });
  });
});
