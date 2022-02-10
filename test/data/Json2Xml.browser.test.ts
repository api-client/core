import { assert } from '@esm-bundle/chai';
import { Json2Xml } from '../../src/data/Json2Xml.js';

describe('data', () => {
  describe('Json2Xml', () => {
    describe('integration tests', () => {
      let converter: Json2Xml;
      beforeEach(() => {
        converter = new Json2Xml();
      });
  
      it('converts a simple JSON object', async () => {
        assert.equal(await converter.serializeJson({ a: {} }), '<root><a/></root>');
        assert.equal(await converter.serializeJson({ a: null }), '<root><a/></root>');
        assert.equal(await converter.serializeJson({ a: [] }), '<root><a/></root>');
        assert.equal(await converter.serializeJson({ a: -1 }), '<root><a>-1</a></root>');
        assert.equal(await converter.serializeJson({ a: false }), '<root><a>false</a></root>');
        assert.equal(await converter.serializeJson({ a: 'a value' }), '<root><a>a value</a></root>');
        assert.equal(await converter.serializeJson({ a: 'b' }), '<root><a>b</a></root>');
      });
  
      it('converts a simple JSON array', async () => {
        assert.equal(await converter.serializeJson([{ a: {} }]), '<root><a/></root>');
        assert.equal(await converter.serializeJson([{ a: null }]), '<root><a/></root>');
        assert.equal(await converter.serializeJson([{ a: [] }]), '<root><a/></root>');
        assert.equal(await converter.serializeJson([{ a: -1 }]), '<root><a>-1</a></root>');
        assert.equal(await converter.serializeJson([{ a: false }]), '<root><a>false</a></root>');
        assert.equal(await converter.serializeJson([{ a: 'a value' }]), '<root><a>a value</a></root>');
        assert.equal(await converter.serializeJson([{ a: 'b' }]), '<root><a>b</a></root>');
        assert.equal(await converter.serializeJson([{ a: 'b' }, { c: false }, { d: 123 }, { e: -0.7 }]), '<root><a>b</a><c>false</c><d>123</d><e>-0.7</e></root>');
      });
  
      it('converts deeply nested JSON object', async () => {
        assert.equal(await converter.serializeJson([{a: [{b: [{c: 1}, {c: 2}, {c: 3}]}]}]), '<root><a><b><c>1</c><c>2</c><c>3</c></b></a></root>');
        assert.equal(await converter.serializeJson([{a: [{b: [{c: 1}, {c: []}, {c: 3}]}]}]), '<root><a><b><c>1</c><c/><c>3</c></b></a></root>');
      });
  
      it('converts an object with an array', async () => {
        const input = {
          items: [
            {
              name: 'n1',
              value: 'v1',
            },
            {
              name: 'n2'
            }
          ],
        };
        await converter.convert(input);
        const result = await converter.serialize();
        assert.equal(result, '<root><items><name>n1</name><value>v1</value><name>n2</name></items></root>');
      });
  
      it('accepts a custom root element', async () => {
        assert.equal(await converter.serializeJson({ a: {} }, 'items'), '<items><a/></items>');
      });
  
      it('wraps a value into a cdata', async () => {
        assert.equal(await converter.serializeJson({ a: '<span>test</span>' }), '<root><a><![CDATA[<span>test</span>]]></a></root>');
      });
  
      it('uses the native implementation in a browser', () => {
        assert.isFalse(converter.syntheticApi);
      });
  
      it('throws when parsing a scalar value', async () => {
        let message: string | undefined;
        try {
          await converter.serializeJson('test');
        } catch (e) {
          const err = e as Error;
          message = err.message;
        }
        assert.equal(message, 'Invalid object. Unable to process non-object property.');
      });
    });

    describe('Unit tests', () => {
      describe('serialize()', () => {
        let converter: Json2Xml;
        beforeEach(() => {
          converter = new Json2Xml();
        });

        it('throws when no document', async () => {
          let message: string | undefined;
          try {
            await converter.serialize();
          } catch (e) {
            const err = e as Error;
            message = err.message;
          }
          assert.equal(message, 'No document created.');
        });
      });

      describe('processArray()', () => {
        let converter: Json2Xml;
        beforeEach(() => {
          converter = new Json2Xml();
        });

        it('throws when no array argument', () => {
          let message: string | undefined;
          try {
            // @ts-ignore
            converter.processArray({});
          } catch (e) {
            const err = e as Error;
            message = err.message;
          }
          assert.equal(message, 'Expected array. object given.');
        });
      });

      describe('processObject()', () => {
        let converter: Json2Xml;
        beforeEach(() => {
          converter = new Json2Xml();
        });

        it('throws when not initialized', () => {
          let message: string | undefined;
          try {
            converter.processObject({});
          } catch (e) {
            const err = e as Error;
            message = err.message;
          }
          assert.equal(message, 'Library not initialized. Call the convert() function.');
        });
      });

      describe('processScalar()', () => {
        let converter: Json2Xml;
        beforeEach(() => {
          converter = new Json2Xml();
        });

        it('throws when not initialized', () => {
          let message: string | undefined;
          try {
            converter.processScalar('test');
          } catch (e) {
            const err = e as Error;
            message = err.message;
          }
          assert.equal(message, 'Library not initialized. Call the convert() function.');
        });

        it('throws when invalid type', async () => {
          const doc = await converter.getDocument();
          converter.doc = doc;
          const rootNode = doc.createElement('root');
          doc.append(rootNode);
          converter.currentNode = rootNode;
          
          let message: string | undefined;
          try {
            converter.processScalar({});
          } catch (e) {
            const err = e as Error;
            message = err.message;
          }
          assert.equal(message, 'Invalid scalar type: object.');
        });
      });
    });
  });
});
