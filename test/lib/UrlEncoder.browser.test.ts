import { assert } from '@esm-bundle/chai';
import { UrlEncoder } from '../../src/lib/parsers/UrlEncoder.js';

describe('Utils', () => {
  describe('encodeQueryString()', () => {
    it('Returns empty string when argument is empty', () => {
      const result = UrlEncoder.encodeQueryString('', true);
      assert.equal(result, '');
    });

    it('Returns empty string when argument is empty', () => {
      const result = UrlEncoder.encodeQueryString('', true);
      assert.equal(result, '');
    });

    it('URL encodes string', () => {
      const result = UrlEncoder.encodeQueryString(';This / is? &test:= + $ , #', true);
      assert.equal(result, '%3BThis+%2F+is%3F+%26test%3A%3D+%2B+%24+%2C+%23');
    });
  });

  describe('decodeQueryString()', () => {
    it('Returns empty string when argument is empty', () => {
      const result = UrlEncoder.decodeQueryString('', true);
      assert.equal(result, '');
    });

    it('Returns empty string when argument is empty', () => {
      const result = UrlEncoder.decodeQueryString('', true);
      assert.equal(result, '');
    });

    it('URL encodes string', () => {
      const result = UrlEncoder.decodeQueryString('%3BThis+%2F+is%3F+%26test%3A%3D+%2B+%24+%2C+%23', true);
      assert.equal(result, ';This / is? &test:= + $ , #');
    });
  });
});
