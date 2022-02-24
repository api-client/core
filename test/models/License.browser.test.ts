/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { Kind as LicenseKind, License, ILicense } from '../../src/models/License.js';
import { Property } from '../../src/models/Property.js';

describe('Models', () => {
  describe('License', () => {
    describe('Initialization', () => {
      describe('Default project initialization', () => {
        it('initializes a default rule', () => {
          const result = new License();
          assert.equal(result.kind, LicenseKind, 'sets the kind property');
          assert.isUndefined(result.url, 'does not set the url property');
          assert.isUndefined(result.name, 'does not set the name property');
          assert.isUndefined(result.content, 'does not set the content property');
        });
      });

      describe('From schema initialization', () => {
        let base: ILicense;
        beforeEach(() => {
          base = {
            kind: LicenseKind,
          }
        });

        it('sets the url property', () => {
          const init: ILicense = { ...base, ...{ url: 'test' }};
          const rule = new License(init);
          assert.equal(rule.url, 'test');
        });

        it('sets the name property', () => {
          const init: ILicense = { ...base, ...{ name: 'test' }};
          const rule = new License(init);
          assert.equal(rule.name, 'test');
        });

        it('sets the content property', () => {
          const init: ILicense = { ...base, ...{ content: 'test' }};
          const rule = new License(JSON.stringify(init));
          assert.equal(rule.content, 'test');
        });
      });

      describe('fromUrl()', () => {
        it('sets the url', () => {
          const result = License.fromUrl('https://');
          assert.equal(result.url, 'https://')
        });

        it('sets the name', () => {
          const result = License.fromUrl('https://', 'test');
          assert.equal(result.name, 'test')
        });
      });

      describe('fromContent()', () => {
        it('sets the content', () => {
          const result = License.fromContent('# The license');
          assert.equal(result.content, '# The license')
        });

        it('sets the name', () => {
          const result = License.fromContent('https://', 'test');
          assert.equal(result.name, 'test')
        });
      });
    });

    describe('toJSON()', () => {
      it('serializes the url value', () => {
        const rule = License.fromUrl('https://');
        const result = rule.toJSON();
        assert.equal(result.url, 'https://');
      });

      it('serializes the name value', () => {
        const rule = License.fromUrl('https://', 'test');
        const result = rule.toJSON();
        assert.equal(result.name, 'test');
      });

      it('serializes the content value', () => {
        const rule = License.fromContent('test');
        const result = rule.toJSON();
        assert.equal(result.content, 'test');
      });

      it('serializes the kind value', () => {
        const rule = License.fromUrl('https://');
        const result = rule.toJSON();
        assert.equal(result.kind, LicenseKind);
      });
    });

    describe('License.isLicense()', () => {
      it('returns false when no input', () => {
        const result = License.isLicense(undefined);
        assert.isFalse(result);
      });

      it('returns false when invalid type', () => {
        const instance = Property.String('abc');
        const result = License.isLicense(instance);
        assert.isFalse(result);
      });

      it('returns true when HttpRequest type', () => {
        const instance = new License();
        const result = License.isLicense(instance);
        assert.isTrue(result);
      });
    });
  });
});
