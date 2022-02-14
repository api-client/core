import { assert } from '@esm-bundle/chai';
import { XmlReader } from '../../src/data/XmlReader.js';

describe('data', () => {
  describe('XmlReader', () => {
    const cities = `
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

    it('searches for the value (absolute path)', async () => {
      const reader = new XmlReader();
      await reader.writePayload(cities);

      const result = await reader.getValue('/xml/city[state=\'WA\'][2]/name');
      
      assert.equal(result, 'Bellevue');
    });

    it('searches for the value (relative path)', async () => {
      const reader = new XmlReader();
      await reader.writePayload(cities);

      const result = await reader.getValue('//xml/city[state=\'WA\'][2]/name');
      
      assert.equal(result, 'Bellevue');
    });

    it('returns undefined when invalid xml', async () => {
      const payload = '<xml><a>b</a><c>d</c></xml>';
      const reader = new XmlReader();
      await reader.writePayload(payload);
      const result = await reader.getValue('a');
      assert.isUndefined(result);
    });

    it('selects an element under root element', async () => {
      const reader = new XmlReader();
      await reader.writePayload(cities);

      const result = await reader.getValue('xml/city[1]/name');
      assert.equal(result, 'Seattle');
    });

    it('selects direct descendant of an element under root element', async () => {
      const reader = new XmlReader();
      await reader.writePayload(cities);

      const result = await reader.getValue('xml/city[1]//name');
      assert.equal(result, 'Seattle');
    });
  });
});
