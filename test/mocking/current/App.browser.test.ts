import { assert } from '@esm-bundle/chai';
import { App } from '../../../src/mocking/lib/App.js';
import { Kind as AppRequestKind } from '../../../src/models/AppRequest.js';

describe('App', () => {
  describe('appRequest()', () => {
    let app: App;

    before(() => { app = new App(); });

    it('returns an object', () => {
      const result = app.appRequest();
      assert.typeOf(result, 'object');
    });

    it('generates the app', () => {
      const result = app.appRequest();
      assert.typeOf(result.app, 'string');
      assert.isNotEmpty(result.app);
    });

    it('respects the passed app', () => {
      const result = app.appRequest({ app: 'abc' });
      assert.equal(result.app, 'abc');
    });

    it('generates the key', () => {
      const result = app.appRequest();
      assert.typeOf(result.key, 'string');
      assert.isNotEmpty(result.key);
    });

    it('generates the ISO time key', () => {
      const result = app.appRequest({ isoKey: true });
      const key = new Date(result.created).toJSON();
      assert.equal(result.key, key);
    });

    it('sets the kind', () => {
      const result = app.appRequest();
      assert.equal(result.kind, AppRequestKind);
    });
  });

  describe('appRequests()', () => {
    let app: App;

    before(() => { app = new App(); });

    it('returns an array', () => {
      const result = app.appRequests(1);
      assert.typeOf(result, 'array');
    });

    it('respects the size limit', () => {
      const result = app.appRequests(2);
      assert.lengthOf(result, 2);
    });

    it('generates the "app" for all requests', () => {
      const result = app.appRequests(3);
      const [r1, r2, r3] = result;
      assert.equal(r1.app, r2.app, 'request #1 and request #2 has the same app');
      assert.equal(r2.app, r3.app, 'request #2 and request #3 has the same app');
    });
  });

  describe('appProject()', () => {
    let app: App;

    before(() => { app = new App(); });

    it('returns an object', () => {
      const result = app.appProject();
      assert.typeOf(result, 'object');
    });

    it('has the name', () => {
      const result = app.appProject();
      assert.typeOf(result.info.name, 'string');
      assert.isNotEmpty(result.info.name);
    });

    it('adds folders with the passed size', () => {
      const result = app.appProject({ foldersSize: 4 });
      assert.lengthOf(result.definitions.folders, 4);
    });

    it('adds requests to the project', () => {
      const result = app.appProject({ foldersSize: 4 });
      assert.isAbove(result.definitions.requests.length, 0);
    });

    it('respects the "noRequests" property', () => {
      const result = app.appProject({ foldersSize: 4, noRequests: true });
      assert.isUndefined(result.definitions.requests);
    });
  });

  describe('appProjects()', () => {
    let app: App;

    before(() => { app = new App(); });

    it('returns an array', () => {
      const result = app.appProjects(1);
      assert.typeOf(result, 'array');
    });

    it('respects the size limit', () => {
      const result = app.appProjects(2);
      assert.lengthOf(result, 2);
    });
  });
});
