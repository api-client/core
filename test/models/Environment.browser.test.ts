/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { Kind as ThingKind } from '../../src/models/Thing.js';
import { Environment, IEnvironment, Kind as EnvironmentKind } from '../../src/models/Environment.js';
import { Server, Kind as ServerKind } from '../../src/models/Server.js';
import { Property, Kind as PropertyKind } from '../../src/models/Property.js';

describe('Models', () => {
  describe('Environment', () => {
    describe('Initialization', () => {
      it('initializes a default environment', () => {
        const result = new Environment();
        assert.equal(result.kind, EnvironmentKind, 'sets the kind property');
        assert.typeOf(result.key, 'string', 'sets the key property');
        
        const { info } = result;
        assert.typeOf(info, 'object', 'sets the default info property');
        assert.equal(info.kind, ThingKind, 'sets the info.kind property');
        assert.equal(info.name, '', 'sets the empty info.name property');
      });
    });

    describe('From schema initialization', () => {
      let base: IEnvironment;
      beforeEach(() => {
        base = {
          kind: EnvironmentKind,
          key: 'test1234',
          info: {
            kind: ThingKind,
            name: 'An env',
          },
          variables: [
            {
              kind: PropertyKind,
              name: 'a var',
              type: 'string',
              value: '',
            }
          ],
          encapsulated: true,
          server: {
            kind: ServerKind,
            uri: 'api.com',
            basePath: '/',
            description: 'a server',
            protocol: 'https',
          },
        }
      });

      it('sets the info', () => {
        const init: IEnvironment = { ...base, ...{ info: {
          kind: ThingKind,
          name: 'Test env',
          description: 'Env description',
          version: '1.2.3',
        }}};
        const result = new Environment(init);
        const { info } = result;
        assert.equal(info.kind, ThingKind, 'sets the info.kind property');
        assert.equal(info.name, 'Test env', 'sets the info.name property');
        assert.equal(info.description, 'Env description', 'sets the info.description property');
        assert.equal(info.version, '1.2.3', 'sets the info.version property');
      });

      it('sets the server', () => {
        const result = new Environment(base);
        const { server } = result;

        assert.equal(server.uri, 'api.com');
        assert.equal(server.basePath, '/');
        assert.equal(server.description, 'a server');
        assert.equal(server.protocol, 'https');
      });

      it('sets the passed key', () => {
        const result = new Environment(base);
        assert.equal(result.key, 'test1234');
      });

      it('sets a new key when the passed key is missing', () => {
        const init: IEnvironment = { ...base };
        delete init.key;
        const result = new Environment(init);
        assert.typeOf(result.key, 'string');
      });

      it('sets the variables', () => {
        const result = new Environment(base);
        assert.lengthOf(result.variables, 1, 'has the variables');
        const [var1] = result.variables;
        assert.equal(var1.kind, PropertyKind);
        assert.equal(var1.name, 'a var');
        assert.equal(var1.type, 'string');
        assert.equal(var1.value, '');
      });

      it('sets the default variables', () => {
        const init: IEnvironment = { ...base };
        delete init.variables;
        const result = new Environment(init);
        assert.deepEqual(result.variables, []);
      });
    });

    describe('From JSON string initialization', () => {
      it('restores the data from JSON string', () => {
        const env = new Environment();
        env.info.name = 'an environment';
        env.addVariable('test', 123);
        env.addServer('https://api.com');
        const str = JSON.stringify(env);
        
        const result = new Environment(str);

        assert.equal(result.key, env.key, 'restores the key');
        assert.equal(result.info.name, 'an environment', 'restores the info object');
        assert.lengthOf(result.variables, 1, 'restores the variables');
        assert.equal(result.server.uri, 'https://api.com', 'restores the server');
      });

      it('throws when invalid folder object', () => {
        const env = new Environment();
        env.info.name = 'an environment';
        const schema = env.toJSON();
        delete schema.kind;
        const str = JSON.stringify(schema);

        assert.throws(() => {
          new Environment(str);
        });
      });
    });

    describe('Environment.fromName()', () => {
      it('adds the name', () => {
        const result = Environment.fromName('an env');
        assert.equal(result.info.name, 'an env');
      });

      it('generates the key', () => {
        const result = Environment.fromName('an env');
        assert.typeOf(result.key, 'string');
      });

      it('adds empty variables', () => {
        const result = Environment.fromName('an env');
        assert.deepEqual(result.variables, []);
      });
    });

    describe('Environment.fromLegacyVariables()', () => {
      it('adds the name', () => {
        const result = Environment.fromLegacyVariables('an env', []);
        assert.equal(result.info.name, 'an env');
      });

      it('generates the key', () => {
        const result = Environment.fromLegacyVariables('an env', []);
        assert.typeOf(result.key, 'string');
      });

      it('adds the variable', () => {
        const result = Environment.fromLegacyVariables('an env', [
          {
            environment: 'any',
            name: 'n1',
            value: 'v1',
          }
        ]);
        assert.lengthOf(result.variables, 1, 'has the variable');
        const [v1] = result.variables;
        assert.equal(v1.kind, PropertyKind);
        assert.equal(v1.name, 'n1');
        assert.equal(v1.value, 'v1');
        assert.equal(v1.type, 'string');
      });
    });

    describe('new()', () => {
      it('adds default info', () => {
        const env = Environment.fromName('a');
        const schema = env.toJSON();
        delete schema.info;
        env.new(schema);

        assert.typeOf(env.info, 'object', 'sets the info object');
        assert.equal(env.info.name, '', 'sets the empty name');
      });

      it('removes the server when not defined in the schema', () => {
        const env = Environment.fromName('a');
        env.server = Server.fromUri('https://api.com');
        const schema = env.toJSON();
        delete schema.server;
        env.new(schema);

        assert.isUndefined(env.server, 'sets the server');
      });

      it('sets the passed server', () => {
        const env = Environment.fromName('a');
        const schema = env.toJSON();
        schema.server = {
          kind: ServerKind,
          uri: 'abc',
        };
        env.new(schema);

        assert.typeOf(env.server, 'object', 'sets the server');
        assert.equal(env.server.uri, 'abc');
      });

      it('clears the variables when not defined in the schema', () => {
        const env = Environment.fromName('a');
        env.addVariable('a', 'b');
        const schema = env.toJSON();
        delete schema.variables;
        env.new(schema);

        assert.deepEqual(env.variables, []);
      });

      it('sets the passed variables', () => {
        const env = Environment.fromName('a');
        const schema = env.toJSON();
        schema.variables = [
          {
            kind: PropertyKind,
            name: 'a',
            value: 'b',
            type: 'string',
          }
        ];
        env.new(schema);

        assert.lengthOf(env.variables, 1, 'has a variable');
        assert.equal(env.variables[0].name, 'a');
      });

      it('re-sets the kind', () => {
        const env = Environment.fromName('a');
        env.kind = 'test';
        const schema = env.toJSON();
        env.new(schema);

        assert.equal(env.kind, EnvironmentKind);
      });

      it('sets the key', () => {
        const env = Environment.fromName('a');
        const schema = env.toJSON();
        schema.key = '1234';
        env.new(schema);

        assert.equal(env.key, '1234');
      });

      it('generates a new key', () => {
        const env = Environment.fromName('a');
        const schema = env.toJSON();
        delete schema.key;
        env.new(schema);

        assert.typeOf(env.key, 'string');
      });

      it('sets default "encapsulated"', () => {
        const env = Environment.fromName('a');
        const schema = env.toJSON();
        delete schema.encapsulated;
        env.new(schema);

        assert.isFalse(env.encapsulated);
      });

      it('sets the "encapsulated"', () => {
        const env = Environment.fromName('a');
        const schema = env.toJSON();
        schema.encapsulated = true;
        env.new(schema);

        assert.isTrue(env.encapsulated);
      });
    });

    describe('toJSON()', () => {
      let base: IEnvironment;
      beforeEach(() => {
        base = {
          kind: EnvironmentKind,
          key: 'test1234',
          info: {
            kind: ThingKind,
            name: 'An env',
          },
          variables: [
            {
              kind: PropertyKind,
              name: 'a var',
              type: 'string',
              value: '',
            }
          ],
          encapsulated: true,
          server: {
            kind: ServerKind,
            uri: 'api.com',
            basePath: '/',
            description: 'a server',
            protocol: 'https',
          },
        }
      });

      it('sets the info', () => {
        const init: IEnvironment = { ...base, ...{ info: {
          kind: ThingKind,
          name: 'Test env',
          description: 'Env description',
          version: '1.2.3',
        }}};
        const env = new Environment(init);
        const result = env.toJSON();
        const { info } = result;
        assert.equal(info.kind, ThingKind, 'sets the info.kind property');
        assert.equal(info.name, 'Test env', 'sets the info.name property');
        assert.equal(info.description, 'Env description', 'sets the info.description property');
        assert.equal(info.version, '1.2.3', 'sets the info.version property');
      });

      it('serializes the key', () => {
        const init: IEnvironment = { ...base };
        const env = new Environment(init);
        const result = env.toJSON();
        assert.equal(result.key, init.key);
      });

      it('serializes the encapsulated', () => {
        const init: IEnvironment = { ...base };
        const env = new Environment(init);
        const result = env.toJSON();
        assert.isTrue(result.encapsulated);
      });

      it('serializes the server', () => {
        const init: IEnvironment = { ...base };
        const env = new Environment(init);
        const result = env.toJSON();
        const { server } = result;
        assert.equal(server.kind, ServerKind);
        assert.equal(server.uri, 'api.com');
        assert.equal(server.basePath, '/');
        assert.equal(server.description, 'a server');
        assert.equal(server.protocol, 'https');
      });

      it('serializes variables', () => {
        const init: IEnvironment = { ...base };
        const env = new Environment(init);
        const result = env.toJSON();
        const { variables } = result;
        assert.lengthOf(variables, 1, 'has the variable');
        const [v1] = variables;

        assert.equal(v1.name, 'a var');
        assert.equal(v1.type, 'string');
        assert.equal(v1.value, '');
      });
    });

    describe('addVariable()', () => {
      it('adds variable by name and value', () => {
        const env = new Environment();
        const result = env.addVariable('a', 'b');

        assert.typeOf(result, 'object', 'returns the created property');
        assert.equal(result.name, 'a', 'the created property has the name');
        assert.equal(result.value, 'b', 'the created property has the value');
        assert.equal(result.type, 'string', 'the created property has the type');
        assert.lengthOf(env.variables, 1, 'has the variable');
        assert.deepEqual(env.variables[0], result, 'inserted variable is the created property');
      });

      it('adds variable by property schema', () => {
        const env = new Environment();
        const prop = Property.Integer('a', 1);
        const result = env.addVariable(prop.toJSON());

        assert.typeOf(result, 'object', 'returns the created property');
        assert.equal(result.name, 'a', 'the created property has the name');
        assert.equal(result.value, 1, 'the created property has the value');
        assert.equal(result.type, 'integer', 'the created property has the type');
        assert.lengthOf(env.variables, 1, 'has the variable');
        assert.deepEqual(env.variables[0], prop, 'inserted variable is the created property');
      });

      it('creates variables array when missing', () => {
        const env = new Environment();
        delete env.variables;
        env.addVariable('a', 'b');
        assert.typeOf(env.variables, 'array');
        assert.lengthOf(env.variables, 1);
      });
    });

    describe('getServer()', () => {
      it('returns undefined when no server', () => {
        const env = new Environment();
        const result = env.getServer();
        assert.isUndefined(result);
      });

      it('returns the default server when forced', () => {
        const env = new Environment();
        const result = env.getServer(true);
        assert.typeOf(result, 'object', 'has the server');
        assert.equal(result.readUri(), '', 'has the default URI');
      });

      it('returns existing server', () => {
        const env = new Environment();
        env.addServer('https://api.com');
        const result = env.getServer();
        assert.typeOf(result, 'object', 'has the server');
        assert.equal(result.readUri(), 'https://api.com');
      });
    });

    describe('addServer()', () => {
      it('adds a server by URI', () => {
        const env = new Environment();
        env.addServer('https://happy.server');

        assert.equal(env.getServer().uri, 'https://happy.server');
      });

      it('adds a server from schema', () => {
        const env = new Environment();
        const srv = new Server();
        srv.uri = 'https://happy.server';
        env.addServer(srv.toJSON());

        assert.equal(env.getServer().uri, 'https://happy.server');
      });
    });

    describe('clone()', () => {
      it('makes a copy of the environment', () => {
        const src = Environment.fromName('abc');
        const copy = src.clone();
        assert.equal(copy.info.name, 'abc');
      });

      it('regenerates the key by default', () => {
        const src = Environment.fromName('abc');
        const copy = src.clone();
        assert.notEqual(copy.key, src.key);
        assert.typeOf(copy.key, 'string');
      });

      it('skips key regeneration when configured', () => {
        const src = Environment.fromName('abc');
        const copy = src.clone({ withoutRevalidate: true });
        assert.equal(copy.key, src.key);
      });
    });
  });
});
