/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { Kind as ProjectRequestKind, ProjectRequest, IProjectRequest } from '../../src/models/ProjectRequest.js';
import { HttpProject } from '../../src/models/HttpProject.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';
import { Kind as HttpRequestKind } from '../../src/models/HttpRequest.js';
import { Kind as RequestLogKind, RequestLog } from '../../src/models/RequestLog.js';
import { SentRequest } from '../../src/models/SentRequest.js';
import { RequestConfig } from '../../src/models/RequestConfig.js';
import { RequestAuthorization } from '../../src/models/RequestAuthorization.js';
import { IRequestUiMeta } from '../../src/models/RequestUiMeta.js';

describe('Models', () => {
  describe('ProjectRequest', () => {
    describe('Initialization', () => {
      describe('Default project initialization', () => {
        let project: HttpProject;
        beforeEach(() => {
          project = new HttpProject();
        });

        it('initializes a default rule', () => {
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
    });
  });
});
