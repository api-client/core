import { assert } from '@esm-bundle/chai';
import { Provider, IProvider, Kind as ProviderKind } from '../../src/models/Provider.js';
import * as PatchUtils from '../../src/models/PatchUtils.js';

describe('Models', () => {
  describe('Provider', () => {
    describe('constructor()', () => {
      it('creates a default instance', () => {
        const result = new Provider();
        assert.equal(result.kind, ProviderKind);
        assert.isUndefined(result.url);
        assert.isUndefined(result.name);
        assert.isUndefined(result.email);
      });

      it('creates an instance from a schema', () => {
        const init: IProvider = {
          kind: ProviderKind,
          name: 'test name',
          url: 'https://dot.com',
          email: 'a@b.c',
        };
        const result = new Provider(init);
        assert.equal(result.kind, ProviderKind);
        assert.equal(result.url, init.url);
        assert.equal(result.name, init.name);
        assert.equal(result.email, init.email);
      });

      it('creates an instance from a JSON schema string', () => {
        const init: IProvider = {
          kind: ProviderKind,
          name: 'test name',
          url: 'https://dot.com',
          email: 'a@b.c',
        };
        const result = new Provider(JSON.stringify(init));
        assert.equal(result.kind, ProviderKind);
        assert.equal(result.url, init.url);
        assert.equal(result.name, init.name);
        assert.equal(result.email, init.email);
      });
    });

    describe('new()', () => {
      it('throws when invalid schema', () => {
        const result = new Provider();
        assert.throws(() => {
          // @ts-ignore
          result.new({});
        });
      });

      it('sets the URL', () => {
        const instance = new Provider();
        const schema = instance.toJSON();
        schema.url = 'https://dot.com';
        instance.new(schema);
        assert.equal(instance.url, 'https://dot.com');
      });

      it('sets the name', () => {
        const instance = new Provider();
        const schema = instance.toJSON();
        schema.name = 'test name';
        instance.new(schema);
        assert.equal(instance.name, 'test name');
      });

      it('sets the email', () => {
        const instance = new Provider();
        const schema = instance.toJSON();
        schema.email = 'a@b.c';
        instance.new(schema);
        assert.equal(instance.email, 'a@b.c');
      });
    });

    describe('toJSON()', () => {
      it('sets the kind', () => {
        const instance = new Provider();
        const result = instance.toJSON();
        assert.equal(result.kind, ProviderKind);
      });

      it('does not set the url when missing', () => {
        const instance = new Provider();
        const result = instance.toJSON();
        assert.isUndefined(result.url);
      });

      it('sets the url', () => {
        const instance = new Provider();
        instance.url = 'http://dot.com'
        const result = instance.toJSON();
        assert.equal(result.url, 'http://dot.com');
      });

      it('does not set the email when missing', () => {
        const instance = new Provider();
        const result = instance.toJSON();
        assert.isUndefined(result.email);
      });

      it('sets the email', () => {
        const instance = new Provider();
        instance.email = 'a@b.c'
        const result = instance.toJSON();
        assert.equal(result.email, 'a@b.c');
      });

      it('does not set the name when missing', () => {
        const instance = new Provider();
        const result = instance.toJSON();
        assert.isUndefined(result.name);
      });

      it('sets the name', () => {
        const instance = new Provider();
        instance.name = 'test'
        const result = instance.toJSON();
        assert.equal(result.name, 'test');
      });
    });

    describe('patch()', () => {
      const properties: (keyof Provider)[] = [
        'name',
        'url',
        'email'
      ];

      properties.forEach((property) => {
        it(`updates the value of the ${property} property`, () => {
          const license = new Provider();
          license.patch('set', property, 'test');
          assert.equal(license[property], 'test');
        });

        it(`deletes the value of the ${property} property`, () => {
          const license = new Provider();
          license.patch('set', property, 'test');
          license.patch('delete', property);
          assert.isUndefined(license[property]);
        });

        it(`throws when trying to append to ${property}`, () => {
          const folder = new Provider();
          assert.throws(() => {
            folder.patch('append', property, 'test');
          }, Error, `Unable to "append" to the "${property}" property. Did you mean "set"?`);
        });
      });

      it(`throws when accessing an unknown property`, () => {
        const license = new Provider();
        assert.throws(() => {
          license.patch('set', `some`, 'a');
        }, Error, PatchUtils.TXT_unknown_path);
      });

      it(`throws when accessing the kind`, () => {
        const license = new Provider();
        assert.throws(() => {
          license.patch('set', `kind`, 'a');
        }, Error, PatchUtils.TXT_delete_kind);
      });

      it(`throws when accessing an unknown operation`, () => {
        const license = new Provider();
        assert.throws(() => {
          // @ts-ignore
          license.patch('other', `name`, 'a');
        }, Error, `Unknown operation: other`);
      });

      it(`throws when not providing a value when required`, () => {
        const license = new Provider();
        assert.throws(() => {
          license.patch('set', `name`, undefined);
        }, Error, PatchUtils.TXT_value_required);
      });
    });
  });
});
