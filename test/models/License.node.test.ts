import { assert } from 'chai';
import { LicenseKind, License, ILicense } from '../../index.js';

//
// Note, the actual unit tests are located in the `License.browser.test.ts` file.
// This is to make sure that everything is working in the NodeJS module as well.
//

describe('Models', () => {
  describe('License', () => {
    describe('Initialization', () => {
      describe('Default project initialization', () => {
        it('initializes a default rule', () => {
          const result = new License();
          assert.equal(result.kind, LicenseKind, 'sets the kind property');
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
      });

      describe('fromUrl()', () => {
        it('sets the url', () => {
          const result = License.fromUrl('https://');
          assert.equal(result.url, 'https://')
        });
      });

      describe('fromContent()', () => {
        it('sets the content', () => {
          const result = License.fromContent('# The license');
          assert.equal(result.content, '# The license')
        });
      });
    });

    describe('toJSON()', () => {
      it('serializes the url value', () => {
        const rule = License.fromUrl('https://');
        const result = rule.toJSON();
        assert.equal(result.url, 'https://');
      });
    });
  });
});
