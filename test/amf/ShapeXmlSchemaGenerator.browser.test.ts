import { assert } from '@esm-bundle/chai';
import { normalizeXmlTagName } from '../../src/amf/shape/ShapeXmlSchemaGenerator.js';

describe('ShapeXmlSchemaGenerator', () => {
  describe('normalizeXmlTagName()', () => {
    it('removes prohibited characters', () => {
      const name = 'a & b = c?';
      const result = normalizeXmlTagName(name);
      assert.equal(result, 'abc');
    });

    it('keeps hyphen characters', () => {
      const name = 'a-&-b =-c?';
      const result = normalizeXmlTagName(name);
      assert.equal(result, 'a--b-c');
    });

    it('keeps underscore characters', () => {
      const name = 'a_&_b =_c?';
      const result = normalizeXmlTagName(name);
      assert.equal(result, 'a__b_c');
    });

    it('keeps dot characters', () => {
      const name = 'a.&.b =.c?';
      const result = normalizeXmlTagName(name);
      assert.equal(result, 'a..b.c');
    });
  });
});
