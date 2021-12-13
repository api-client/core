import { assert } from 'chai';
import { UrlEncodedReader } from '../../index.js';

describe('data', () => {
  describe('UrlEncodedReader', () => {
    it('returns a value for a simple path', async () => {
      const payload = 'a=b&c=d';
      const reader = new UrlEncodedReader();
      await reader.writePayload(payload);
      const result = await reader.getValue('a');
      assert.equal(result, 'b');
    });
  });
});
