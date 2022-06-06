import { assert } from '@esm-bundle/chai';
import { JsonReader } from '../../src/data/JsonReader.js';

describe('data', () => {
  describe('JsonReader', () => {
    it('returns a value for a simple path', async () => {
      const payload = JSON.stringify({ a: 'b', c: 'd' });
      const reader = new JsonReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('/a/text()');
      assert.equal(result, 'b');
    });

    it('returns a value for a deep path', async () => {
      const payload = JSON.stringify({ a: { b: 'c' } });
      const reader = new JsonReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('/a/b');
      assert.equal(result, 'c');
    });

    it('searches for the value (absolute path)', async () => {
      const payload = JSON.stringify([
        { "city": {"name": "Seattle", "state": "WA"}},
        { "city": {"name": "New York", "state": "NY"}},
        { "city": {"name": "Bellevue", "state": "WA"}},
        { "city": {"name": "Olympia", "state": "WA"}},
      ]);
      const reader = new JsonReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('/city[state=\'WA\'][2]/name');
      assert.equal(result, 'Bellevue');
    });

    it('searches for the value (relative path)', async () => {
      const payload = JSON.stringify([
        { "city": {"name": "Seattle", "state": "WA"}},
        { "city": {"name": "New York", "state": "NY"}},
        { "city": {"name": "Bellevue", "state": "WA"}},
        { "city": {"name": "Olympia", "state": "WA"}},
      ]);
      const reader = new JsonReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('//city[state=\'WA\'][2]/name');
      assert.equal(result, 'Bellevue');
    });

    it('selects an element under root element', async () => {
      const payload = JSON.stringify({
        xml: [
          { "city": {"name": "Seattle", "state": "WA"}},
          { "city": {"name": "New York", "state": "NY"}},
          { "city": {"name": "Bellevue", "state": "WA"}},
          { "city": {"name": "Olympia", "state": "WA"}},
        ]
      });
      const reader = new JsonReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('xml/city[1]/name');
      assert.equal(result, 'Seattle');
    });

    it('selects direct descendant of an element under root element', async () => {
      const payload = JSON.stringify({
        xml: [
          { "city": {"name": "Seattle", "state": "WA"}},
          { "city": {"name": "New York", "state": "NY"}},
          { "city": {"name": "Bellevue", "state": "WA"}},
          { "city": {"name": "Olympia", "state": "WA"}},
        ]
      });
      const reader = new JsonReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('xml/city[1]//name');
      assert.equal(result, 'Seattle');
    });

    it('it selects non-variable-name property', async () => {
      const payload = JSON.stringify({
        headers: {
          'x-test': true,
        }
      });
      const reader = new JsonReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('headers/x-test');
      assert.equal(result, 'true');
    });
  });
});
