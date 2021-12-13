import { assert } from 'chai';
import { JsonReader } from '../../index.js';

describe('data', () => {
  describe('JsonReader', () => {
    it('returns a value for a simple path', async () => {
      const payload = JSON.stringify({ a: 'b', c: 'd' });
      const reader = new JsonReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('a');
      assert.equal(result, 'b');
    });

    it('returns a value for a deep path', async () => {
      const payload = JSON.stringify({ a: { b: 'c' } });
      const reader = new JsonReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('a.b');
      assert.equal(result, 'c');
    });

    it('searches for the value', async () => {
      const payload = JSON.stringify([
        {"name": "Seattle", "state": "WA"},
        {"name": "New York", "state": "NY"},
        {"name": "Bellevue", "state": "WA"},
        {"name": "Olympia", "state": "WA"}
      ]);
      const reader = new JsonReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('[?state == \'WA\'].name | [1]');
      assert.equal(result, 'Bellevue');
    });
  });
});
