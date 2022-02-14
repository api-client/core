import { assert } from 'chai';
import { PayloadPointer } from '../../index.js';

describe('data', () => {
  describe('PayloadPointer', () => {
    it('returns a value for a json - exact match', async () => {
      const payload = JSON.stringify({ a: 'b', c: 'd' });
      const reader = new PayloadPointer('a', payload, 'application/json');

      const result = await reader.getValue();
      assert.equal(result, 'b');
    });

    it('returns a value for an x-json', async () => {
      const payload = JSON.stringify({ a: 'b', c: 'd' });
      const reader = new PayloadPointer('a', payload, 'application/x-json');

      const result = await reader.getValue();
      assert.equal(result, 'b');
    });

    it('returns a value for an xml - exact match', async () => {
      const payload = '<xml><a>b</a><c>d</c></xml>';
      const reader = new PayloadPointer('/xml/a', payload, 'application/xml');
      const result = await reader.getValue();
      assert.equal(result, 'b');
    });

    it('returns a value for an atom-xml', async () => {
      const payload = '<xml><a>b</a><c>d</c></xml>';
      const reader = new PayloadPointer('/xml/a', payload, 'application/atom-xml');
      const result = await reader.getValue();
      assert.equal(result, 'b');
    });

    it('returns a value for an x-www-form-urlencoded', async () => {
      const payload = 'a=b&c=d';
      const reader = new PayloadPointer('a', payload, 'x-www-form-urlencoded');
      const result = await reader.getValue();
      assert.equal(result, 'b');
    });

    it('returns undefined when no mime', async () => {
      const payload = JSON.stringify({ a: 'b', c: 'd' });
      const reader = new PayloadPointer('a', payload);

      const result = await reader.getValue();
      assert.isUndefined(result);
    });

    it('returns undefined when no payload', async () => {
      const reader = new PayloadPointer('a', undefined, 'application/json');

      const result = await reader.getValue();
      assert.isUndefined(result);
    });
  });
});
