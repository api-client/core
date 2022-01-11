import { assert } from '@esm-bundle/chai';
import { Server, IServer, Kind as ServerKind } from '../../src/models/Server.js';

describe('Models', () => {
  describe('Server', () => {
    describe('Server.fromUri()', () => {
      it('sets the kind', () => {
        const result = Server.fromUri('https://dot.com');
        assert.equal(result.kind, ServerKind);
      });

      it('sets the name', () => {
        const result = Server.fromUri('https://dot.com');
        assert.equal(result.uri, 'https://dot.com');
      });
    });

    describe('constructor()', () => {
      it('creates an empty Thing', () => {
        const result = new Server();
        assert.equal(result.kind, ServerKind);
        assert.equal(result.uri, '');
        assert.isUndefined(result.description);
        assert.isUndefined(result.protocol);
        assert.isUndefined(result.basePath);
      });

      it('creates a Thing from the schema values', () => {
        const schema: IServer = {
          kind: ServerKind,
          uri: 'dot.com',
          description: 'a desc',
          protocol: 'https:',
          basePath: '/api',
        };
        const result = new Server(schema);
        assert.equal(result.kind, ServerKind);
        assert.equal(result.uri, 'dot.com');
        assert.equal(result.description, 'a desc');
        assert.equal(result.protocol, 'https:');
        assert.equal(result.basePath, '/api');
      });

      it('creates a Thing from the JSON schema string', () => {
        const schema: IServer = {
          kind: ServerKind,
          uri: 'dot.com',
          description: 'a desc',
          protocol: 'https:',
          basePath: '/api',
        };
        const result = new Server(JSON.stringify(schema));
        assert.equal(result.kind, ServerKind);
        assert.equal(result.uri, 'dot.com');
        assert.equal(result.description, 'a desc');
        assert.equal(result.protocol, 'https:');
        assert.equal(result.basePath, '/api');
      });

      it('throws when invalid schema', () => {
        assert.throws(() => {
          new Server(JSON.stringify({
            name: 'a name',
          }));
        });
      });
    });

    describe('toJSON()', () => {
      let thing: Server;
      beforeEach(() => {
        thing = new Server();
      });

      it('serializes the kind', () => {
        const result = thing.toJSON();
        assert.equal(result.kind, ServerKind);
      });

      it('serializes the name', () => {
        thing.uri = 'dot.com';
        const result = thing.toJSON();
        assert.equal(result.uri, 'dot.com');
      });

      it('serializes the description', () => {
        thing.description = 'a description';
        const result = thing.toJSON();
        assert.equal(result.description, 'a description');
      });

      it('does not serialize description when missing', () => {
        const result = thing.toJSON();
        assert.isUndefined(result.description);
      });

      it('serializes the protocol', () => {
        thing.protocol = 'a protocol';
        const result = thing.toJSON();
        assert.equal(result.protocol, 'a protocol');
      });

      it('does not serialize protocol when missing', () => {
        const result = thing.toJSON();
        assert.isUndefined(result.protocol);
      });

      it('serializes the basePath', () => {
        thing.basePath = 'a basePath';
        const result = thing.toJSON();
        assert.equal(result.basePath, 'a basePath');
      });

      it('does not serialize basePath when missing', () => {
        const result = thing.toJSON();
        assert.isUndefined(result.basePath);
      });
    });

    describe('readUri()', () => {
      it('returns empty string when no data', () => {
        const info = new Server();
        const result = info.readUri();
        assert.equal(result, '');
      });

      it('returns the uri value', () => {
        const info = new Server();
        info.uri = 'dot.com'
        const result = info.readUri();
        assert.equal(result, 'dot.com');
      });

      it('adds the protocol when missing', () => {
        const info = new Server();
        info.uri = 'dot.com';
        info.protocol = 'http:';
        const result = info.readUri();
        assert.equal(result, 'http://dot.com');
      });

      it('ignores the protocol when not missing', () => {
        const info = new Server();
        info.uri = 'https://dot.com';
        info.protocol = 'http:';
        const result = info.readUri();
        assert.equal(result, 'https://dot.com');
      });

      it('adds the base path', () => {
        const info = new Server();
        info.uri = 'dot.com';
        info.basePath = '/api';
        const result = info.readUri();
        assert.equal(result, 'dot.com/api');
      });

      it('clears the base uri before adding the base path', () => {
        const info = new Server();
        info.uri = 'dot.com/';
        info.basePath = '/api';
        const result = info.readUri();
        assert.equal(result, 'dot.com/api');
      });

      it('normalizes the base path', () => {
        const info = new Server();
        info.uri = 'dot.com';
        info.basePath = 'api';
        const result = info.readUri();
        assert.equal(result, 'dot.com/api');
      });
    });
  });
});
