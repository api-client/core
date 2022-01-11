import { assert } from '@esm-bundle/chai';
import { DeleteCookieAction, IDeleteCookieAction, Kind as DeleteCookieActionKind } from '../../src/models/actions/runnable/DeleteCookieAction.js';

describe('Models', () => {
  describe('DeleteCookieAction', () => {
    describe('DeleteCookieAction.fromLegacy()', () => {
      it('sets the kind', () => {
        const result = DeleteCookieAction.fromLegacy({
          name: 'a',
          url: 'b',
        });
        assert.equal(result.kind, DeleteCookieActionKind);
      });

      it('sets the name', () => {
        const result = DeleteCookieAction.fromLegacy({
          name: 'a',
          url: 'b',
        });
        assert.equal(result.name, 'a');
      });

      it('sets the url', () => {
        const result = DeleteCookieAction.fromLegacy({
          name: 'a',
          url: 'b',
        });
        assert.equal(result.url, 'b');
      });

      it('sets the useRequestUrl', () => {
        const result = DeleteCookieAction.fromLegacy({
          name: 'a',
          useRequestUrl: true,
        });
        assert.isTrue(result.useRequestUrl);
      });

      it('removes the name when removeAll', () => {
        const result = DeleteCookieAction.fromLegacy({
          name: 'a',
          removeAll: true,
        });
        assert.isUndefined(result.name);
      });
    });

    describe('constructor()', () => {
      it('creates default values', () => {
        const result = new DeleteCookieAction;
        assert.equal(result.kind, DeleteCookieActionKind);
      });

      it('creates an instance from the schema', () => {
        const schema: IDeleteCookieAction = {
          kind: 'ARC#DeleteCookieAction',
          name: 'a name',
          url: 'https://dot.com',
        };
        const result = new DeleteCookieAction(schema);
        assert.equal(result.kind, DeleteCookieActionKind);
        assert.equal(result.name, 'a name');
        assert.equal(result.url, 'https://dot.com');
      });

      it('creates an instance from the JSON schema string', () => {
        const schema: IDeleteCookieAction = {
          kind: 'ARC#DeleteCookieAction',
          name: 'a name',
          url: 'https://dot.com',
        };
        const result = new DeleteCookieAction(JSON.stringify(schema));
        assert.equal(result.kind, DeleteCookieActionKind);
        assert.equal(result.name, 'a name');
        assert.equal(result.url, 'https://dot.com');
      });
    });

    describe('new()', () => {
      let schema: IDeleteCookieAction;
      let action: DeleteCookieAction;
      beforeEach(() => {
        schema = {
          kind: 'ARC#DeleteCookieAction',
          name: 'a test',
          url: 'https://dot.com',
          useRequestUrl: true,
        };
        action = new DeleteCookieAction(schema);
      });

      it('sets the useRequestUrl', () => {
        schema.useRequestUrl = false;
        action.new(schema);
        assert.isFalse(action.useRequestUrl);
      });

      it('clears the useRequestUrl when missing', () => {
        delete schema.useRequestUrl;
        action.new(schema);
        assert.isUndefined(action.useRequestUrl);
      });

      it('sets the url', () => {
        schema.url = 'https://onet.pl';
        action.new(schema);
        assert.equal(action.url, 'https://onet.pl');
      });

      it('clears the url when missing', () => {
        delete schema.url;
        action.new(schema);
        assert.isUndefined(action.url);
      });

      it('sets the name', () => {
        schema.name = 'other';
        action.new(schema);
        assert.equal(action.name, 'other');
      });

      it('clears the name when missing', () => {
        delete schema.name;
        action.new(schema);
        assert.isUndefined(action.name);
      });
    });

    describe('toJSON()', () => {
      let action: DeleteCookieAction;
      beforeEach(() => {
        action = new DeleteCookieAction({
          kind: 'ARC#DeleteCookieAction',
        });
      });

      it('sets the kind', () => {
        const result = action.toJSON();
        assert.equal(result.kind, DeleteCookieActionKind);
      });

      it('sets the url', () => {
        action.url = 'https://dot.com';
        const result = action.toJSON();
        assert.equal(result.url, 'https://dot.com');
      });

      it('does not set the url when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.url);
      });

      it('sets the name', () => {
        action.name = 'a test';
        const result = action.toJSON();
        assert.equal(result.name, 'a test');
      });

      it('does not set the name when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.name);
      });

      it('sets the useRequestUrl', () => {
        action.useRequestUrl = false;
        const result = action.toJSON();
        assert.isFalse(result.useRequestUrl);
      });

      it('does not set the useRequestUrl when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.useRequestUrl);
      });
    });
  });
});
