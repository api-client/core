import { assert } from '@esm-bundle/chai';
import { XmlReader } from '../../src/data/XmlReader.js';

describe('data', () => {
  describe('XmlReader', () => {
    it('returns a value for a simple path', async () => {
      const payload = '<xml><a>b</a><c>d</c></xml>';
      const reader = new XmlReader();
      await reader.writePayload(payload);
      const result = await reader.getValue('/xml/a/text()');
      assert.equal(result, 'b');
    });

    it('returns a value for a deep path', async () => {
      const payload = '<xml><a><b>c</b></a></xml>';
      const reader = new XmlReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('/xml/a/b');
      assert.equal(result, 'c');
    });

    it('searches for the value', async () => {
      const payload = `
      <xml>
        <city>
          <name>Seattle</name>
          <state>WA</state>
        </city>
        <city>
          <name>New York</name>
          <state>NY</state>
        </city>
        <city>
          <name>Bellevue</name>
          <state>WA</state>
        </city>
        <city>
          <name>Olympia</name>
          <state>WA</state>
        </city>
      </xml>
      `;
      const reader = new XmlReader();
      await reader.writePayload(payload);

      const result = await reader.getValue('/xml/city[state=\'WA\'][2]/name');
      
      assert.equal(result, 'Bellevue');
    });

    it('returns undefined when invalid path', async () => {
      const payload = '<xml><a>b</a><c>d</c></xml>';
      const reader = new XmlReader();
      await reader.writePayload(payload);
      const result = await reader.getValue('a');
      assert.isUndefined(result);
    });
  });
});
