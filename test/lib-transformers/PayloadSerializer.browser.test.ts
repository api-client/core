import { assert } from '@esm-bundle/chai';
import { ISafePayload, PayloadSerializer, SupportedPayloadTypes } from '../../src/lib/transformers/PayloadSerializer.js';

describe('lib', () => {
  describe('transformers', () => {
    describe('PayloadSerializer', () => {
      describe('isSafePayload()', () => {
        const trueTests: any[] = [
          undefined,
          null,
          'test',
        ];
        SupportedPayloadTypes.forEach((type) => trueTests.push({ type }));

        trueTests.forEach((value) => {
          const label = !!value && typeof value === 'object' ? `serialized type ${value.type}` : typeof value;

          it(label, () => {
            const result = PayloadSerializer.isSafePayload(value);
            assert.isTrue(result);
          });
        });

        it('returns false for a Blob', () => {
          const b = new Blob(['test']);
          const result = PayloadSerializer.isSafePayload(b);
          assert.isFalse(result);
        });

        it('returns false for a FormData', () => {
          const fd = new FormData();
          const result = PayloadSerializer.isSafePayload(fd);
          assert.isFalse(result);
        });

        it('returns false for a ArrayBuffer', () => {
          const ab = new ArrayBuffer(1);
          const result = PayloadSerializer.isSafePayload(ab);
          assert.isFalse(result);
        });
      });

      describe('deserialize()', () => {
        it('reads the payload as string', async () => {
          const result = await PayloadSerializer.deserialize('test');
          assert.equal(result, 'test');
        });
  
        it('reads the Blob body', async () => {
          const data = 'data:text/plain;base64,Kioq';
          const result = await PayloadSerializer.deserialize({ type: 'blob', data, });
          const typed = result as Blob;
          assert.typeOf(typed, 'blob');
          assert.equal(typed.type, 'text/plain');
          assert.equal(typed.size, 3);
        });
  
        it('reads the FormData body', async () => {
          const data = [{
            isFile: false,
            name: 'test-name',
            value: 'test-value'
          }];
          const result = await PayloadSerializer.deserialize({ type: 'formdata', data, });
          const typed = result as FormData;
          assert.typeOf(typed, 'formdata');
          const param = typed.get('test-name');
          assert.equal(param, 'test-value');
        });
  
        it('reads the ArrayBuffer body', async () => {
          const encoder = new TextEncoder();
          const view = encoder.encode('test-ab');
          const payload = PayloadSerializer.stringifyArrayBuffer(view);
          const result = await PayloadSerializer.deserialize(payload);
          const typed = result as ArrayBuffer;
          assert.typeOf(typed, 'ArrayBuffer');
        });
  
        it('returns undefined when no payload', async () => {
          const result = await PayloadSerializer.deserialize(undefined);
          assert.isUndefined(result);
        });
  
        it('returns undefined when payload is a null', async () => {
          const result = await PayloadSerializer.deserialize(null);
          assert.isUndefined(result);
        });
      });

      describe('serialize()', () => {
        it('writes the payload as string', async () => {
          const result = await PayloadSerializer.serialize('test');
          assert.equal(result, 'test');
        });
  
        it('writes the payload as Blob', async () => {
          const message = new Blob(['***** ***'], {type: 'text/plain'});
          const result = await PayloadSerializer.serialize(message) as ISafePayload;
          
          assert.equal(result.type, 'blob');
          assert.equal(result.data, 'data:text/plain;base64,KioqKiogKioq');
        });
  
        it('writes the payload as ArrayBuffer', async () => {
          const encoder = new TextEncoder();
          const view = encoder.encode('test');
          const result = await PayloadSerializer.serialize(view.buffer) as ISafePayload;
          
          assert.equal(result.type, 'arraybuffer');
          assert.typeOf(result.data, 'array');
        });
  
        it('writes the payload as FormData', async () => {
          const b = new Blob(['***'], {type: 'text/plain'});
          const fd = new FormData();
          fd.append('file', b, 'file-name');
          fd.append('text', 'abcd');
          fd.append('text-part', b, 'text-part');
          const result = await PayloadSerializer.serialize(fd) as ISafePayload;
          
          assert.equal(result.type, 'formdata');
          assert.typeOf(result.data, 'array');
          assert.lengthOf(result.data, 3);
        });
  
        it('sets undefined when no data', async () => {
          const result = await PayloadSerializer.serialize(undefined);
          assert.isUndefined(result);
        });
  
        it('sets undefined when null data', async () => {
          const result = await PayloadSerializer.serialize(null);
          assert.isUndefined(result);
        });
      });
    });
  });
});
