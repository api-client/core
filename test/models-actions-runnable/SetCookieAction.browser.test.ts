import { assert } from '@esm-bundle/chai';
import { ResponseDataSourceEnum } from '../../src/models/actions/Enums.js';
import { SetCookieAction, ISetCookieAction, Kind as SetCookieActionKind } from '../../src/models/actions/runnable/SetCookieAction.js';

describe('Models', () => {
  describe('SetCookieAction', () => {
    describe('SetCookieAction.fromLegacy()', () => {
      it('sets the kind', () => {
        const result = SetCookieAction.fromLegacy({
          name: 'a',
          source: { source: 'body' }
        });
        assert.equal(result.kind, SetCookieActionKind);
      });

      it('sets the name', () => {
        const result = SetCookieAction.fromLegacy({
          name: 'a',
          source: { source: 'body' }
        });
        assert.equal(result.name, 'a');
      });

      it('sets the source', () => {
        const result = SetCookieAction.fromLegacy({
          name: 'a',
          source: { source: 'body' }
        });
        assert.typeOf(result.source, 'object');
        assert.equal(result.source.source, 'body');
      });

      it('sets the url', () => {
        const result = SetCookieAction.fromLegacy({
          name: 'a',
          source: { source: 'body' },
          url: 'https://dot.com',
        });
        assert.equal(result.url, 'https://dot.com');
      });

      it('sets the useRequestUrl', () => {
        const result = SetCookieAction.fromLegacy({
          name: 'a',
          source: { source: 'body' },
          useRequestUrl: false,
        });
        assert.isFalse(result.useRequestUrl);
      });

      it('sets the expires', () => {
        const result = SetCookieAction.fromLegacy({
          name: 'a',
          source: { source: 'body' },
          expires: '2022-10-15',
        });
        assert.equal(result.expires, '2022-10-15');
      });

      it('sets the hostOnly', () => {
        const result = SetCookieAction.fromLegacy({
          name: 'a',
          source: { source: 'body' },
          hostOnly: false,
        });
        assert.isFalse(result.hostOnly);
      });

      it('sets the httpOnly', () => {
        const result = SetCookieAction.fromLegacy({
          name: 'a',
          source: { source: 'body' },
          httpOnly: false,
        });
        assert.isFalse(result.httpOnly);
      });

      it('sets the secure', () => {
        const result = SetCookieAction.fromLegacy({
          name: 'a',
          source: { source: 'body' },
          secure: false,
        });
        assert.isFalse(result.secure);
      });

      it('sets the session', () => {
        const result = SetCookieAction.fromLegacy({
          name: 'a',
          source: { source: 'body' },
          session: false,
        });
        assert.isFalse(result.session);
      });
    });

    describe('constructor()', () => {
      it('creates default values', () => {
        const result = new SetCookieAction;
        assert.equal(result.kind, SetCookieActionKind);
      });

      it('creates an instance from the schema', () => {
        const schema: ISetCookieAction = {
          kind: SetCookieActionKind,
          name: 'a name',
          source: { source: ResponseDataSourceEnum.status },
          expires: '2022-10-15',
          useRequestUrl: false,
          hostOnly: false,
          httpOnly: false,
          secure: false,
          session: false,
        };
        const result = new SetCookieAction(schema);
        assert.equal(result.kind, SetCookieActionKind);
        assert.equal(result.name, 'a name');
        assert.typeOf(result.source, 'object');
        assert.equal(result.source.source, ResponseDataSourceEnum.status);
        assert.equal(result.expires, '2022-10-15');
        assert.isFalse(result.useRequestUrl);
        assert.isFalse(result.hostOnly);
        assert.isFalse(result.session);
      });

      it('creates an instance from the JSON schema string', () => {
        const schema: ISetCookieAction = {
          kind: SetCookieActionKind,
          name: 'a name',
          source: { source: ResponseDataSourceEnum.status },
          expires: '2022-10-15',
          useRequestUrl: false,
          hostOnly: false,
          httpOnly: false,
          secure: false,
          session: false,
        };
        const result = new SetCookieAction(JSON.stringify(schema));
        assert.equal(result.kind, SetCookieActionKind);
        assert.equal(result.name, 'a name');
        assert.typeOf(result.source, 'object');
        assert.equal(result.source.source, ResponseDataSourceEnum.status);
        assert.equal(result.expires, '2022-10-15');
        assert.isFalse(result.useRequestUrl);
        assert.isFalse(result.hostOnly);
        assert.isFalse(result.session);
      });
    });

    describe('new()', () => {
      let schema: ISetCookieAction;
      let action: SetCookieAction;
      beforeEach(() => {
        schema = {
          kind: SetCookieActionKind,
          name: 'a test',
          source: { source: ResponseDataSourceEnum.status },
        };
        action = new SetCookieAction(schema);
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
        schema.name = 'other';
        action.new(schema);
        assert.equal(action.name, 'other');
      });

      it('sets the expires', () => {
        action.expires = '2022-10-15';
        const result = action.toJSON();
        assert.equal(result.expires, '2022-10-15');
      });

      it('does not set the expires when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.expires);
      });

      it('sets the hostOnly', () => {
        action.hostOnly = false;
        const result = action.toJSON();
        assert.isFalse(result.hostOnly);
      });

      it('does not set the hostOnly when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.hostOnly);
      });

      it('sets the httpOnly', () => {
        action.httpOnly = false;
        const result = action.toJSON();
        assert.isFalse(result.httpOnly);
      });

      it('does not set the httpOnly when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.httpOnly);
      });

      it('sets the secure', () => {
        action.secure = false;
        const result = action.toJSON();
        assert.isFalse(result.secure);
      });

      it('does not set the secure when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.secure);
      });

      it('sets the session', () => {
        action.session = false;
        const result = action.toJSON();
        assert.isFalse(result.session);
      });

      it('does not set the session when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.session);
      });
    });

    describe('toJSON()', () => {
      let action: SetCookieAction;
      beforeEach(() => {
        action = new SetCookieAction({
          kind: SetCookieActionKind,
          source: { source: ResponseDataSourceEnum.status },
          name: 'a name',
        });
      });

      it('sets the kind', () => {
        const result = action.toJSON();
        assert.equal(result.kind, SetCookieActionKind);
      });

      it('sets the source', () => {
        const result = action.toJSON();
        assert.equal(result.source.source, ResponseDataSourceEnum.status);
      });

      it('sets the name', () => {
        action.name = 'a test';
        const result = action.toJSON();
        assert.equal(result.name, 'a test');
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

      it('sets the useRequestUrl', () => {
        action.useRequestUrl = false;
        const result = action.toJSON();
        assert.isFalse(result.useRequestUrl);
      });

      it('does not set the useRequestUrl when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.useRequestUrl);
      });
      
      it('sets the hostOnly', () => {
        action.hostOnly = false;
        const result = action.toJSON();
        assert.isFalse(result.hostOnly);
      });

      it('does not set the hostOnly when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.hostOnly);
      });
      
      it('sets the httpOnly', () => {
        action.httpOnly = false;
        const result = action.toJSON();
        assert.isFalse(result.httpOnly);
      });

      it('does not set the httpOnly when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.httpOnly);
      });
      
      it('sets the secure', () => {
        action.secure = false;
        const result = action.toJSON();
        assert.isFalse(result.secure);
      });

      it('does not set the secure when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.secure);
      });
      
      it('sets the session', () => {
        action.session = false;
        const result = action.toJSON();
        assert.isFalse(result.session);
      });

      it('does not set the session when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.session);
      });
      
      it('sets the expires', () => {
        action.expires = '2022-10-15';
        const result = action.toJSON();
        assert.equal(result.expires, '2022-10-15');
      });

      it('does not set the expires when missing', () => {
        const result = action.toJSON();
        assert.isUndefined(result.expires);
      });
    });

    describe('isValid()', () => {
      it('returns false has no cookie target', () => {
        const action = new SetCookieAction({
          kind: SetCookieActionKind,
          source: { source: ResponseDataSourceEnum.status },
          name: ''
        });
        assert.isFalse(action.isValid());
      });

      it('returns false when no source', () => {
        const action = new SetCookieAction({
          kind: SetCookieActionKind,
          source: undefined,
          name: 'test'
        });
        delete action.source;
        assert.isFalse(action.isValid());
      });

      it('returns true when has useRequestUrl', () => {
        const action = new SetCookieAction({
          kind: SetCookieActionKind,
          source: { source: ResponseDataSourceEnum.status },
          name: 'test',
          useRequestUrl: true,
        });
        assert.isTrue(action.isValid());
      });

      it('returns true when has url', () => {
        const action = new SetCookieAction({
          kind: SetCookieActionKind,
          source: { source: ResponseDataSourceEnum.status },
          name: 'test',
          url: 'https://api.com',
        });
        assert.isTrue(action.isValid());
      });
    });
  });
});
