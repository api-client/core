import { assert } from '@esm-bundle/chai';
import { SerializablePayload } from '../../src/models/SerializablePayload.js';
import { PayloadSerializer, ISafePayload } from '../../src/lib/transformers/PayloadSerializer.js';

describe('Models', () => {
  describe('SerializablePayload', () => {
    describe('writePayload()', () => {
      it('writes the payload as string', async () => {
        const request = new SerializablePayload();
        await request.writePayload('test');
        assert.equal(request.payload, 'test');
      });

      it('writes the payload as Blob', async () => {
        const request = new SerializablePayload();
        const message = new Blob(['***** ***'], {type: 'text/plain'});
        await request.writePayload(message);
        const typed = request.payload as ISafePayload;
        
        assert.equal(typed.type, 'blob');
        assert.equal(typed.data, 'data:text/plain;base64,KioqKiogKioq');
      });

      it('writes the payload as ArrayBuffer', async () => {
        const request = new SerializablePayload();
        const encoder = new TextEncoder();
        const view = encoder.encode('test');
        await request.writePayload(view.buffer);
        const typed = request.payload as ISafePayload;
        
        assert.equal(typed.type, 'arraybuffer');
        assert.typeOf(typed.data, 'array');
      });

      it('writes the payload as FormData', async () => {
        const request = new SerializablePayload();
        const b = new Blob(['***'], {type: 'text/plain'});
        const fd = new FormData();
        fd.append('file', b, 'file-name');
        fd.append('text', 'abcd');
        fd.append('text-part', b, 'text-part');
        await request.writePayload(fd);
        const typed = request.payload as ISafePayload;
        
        assert.equal(typed.type, 'formdata');
        assert.typeOf(typed.data, 'array');
        assert.lengthOf(typed.data, 3);
      });
    });

    describe('readPayload()', () => {
      it('reads the payload as string', async () => {
        const instance = new SerializablePayload();
        instance.payload = 'test';
        const result = await instance.readPayload();
        assert.equal(result, 'test');
      });

      it('reads the Blob body', async () => {
        const data = 'data:text/plain;base64,Kioq';
        const instance = new SerializablePayload();
        instance.payload = { type: 'blob', data, };
        const result = await instance.readPayload();
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
        const instance = new SerializablePayload();
        instance.payload = { type: 'formdata', data, };
        const result = await instance.readPayload();
        const typed = result as FormData;
        assert.typeOf(typed, 'formdata');
        const param = typed.get('test-name');
        assert.equal(param, 'test-value');
      });

      it('reads the ArrayBuffer body', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test-ab');
        const payload = PayloadSerializer.stringifyArrayBuffer(view);

        const instance = new SerializablePayload();
        instance.payload = payload;

        const result = await instance.readPayload();
        const typed = result as ArrayBuffer;
        assert.typeOf(typed, 'ArrayBuffer');
      });

      it('returns undefined when no payload', async () => {
        const instance = new SerializablePayload();
        const result = await instance.readPayload();
        assert.isUndefined(result);
      });
    });

    describe('readPayloadAsString()', () => {
      it('returns undefined when no payload', async () => {
        const instance = new SerializablePayload();
        const result = await instance.readPayloadAsString();
        assert.isUndefined(result);
      });

      it('reads the string payload', async () => {
        const instance = new SerializablePayload();
        instance.payload = 'test';
        const result = await instance.readPayloadAsString();
        assert.equal(result, 'test');
      });

      it('reads the string typed payload', async () => {
        const instance = new SerializablePayload();
        instance.payload = {
          type: 'string',
          data: 'test',
        };
        const result = await instance.readPayloadAsString();
        assert.equal(result, 'test');
      });

      it('returns undefined for blob source', async () => {
        const data = 'data:text/plain;base64,Kioq';
        const instance = new SerializablePayload();
        instance.payload = { type: 'blob', data, };
        const result = await instance.readPayloadAsString();
        assert.isUndefined(result);
      });

      it('returns undefined for FormData source', async () => {
        const data = [{
          isFile: false,
          name: 'test-name',
          value: 'test-value'
        }];
        const instance = new SerializablePayload();
        instance.payload = { type: 'formdata', data, };
        const result = await instance.readPayloadAsString();
        assert.isUndefined(result);
      });

      it('returns the value for an ArrayBuffer source', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test-ab');
        const payload = PayloadSerializer.stringifyArrayBuffer(view);

        const instance = new SerializablePayload();
        instance.payload = payload;

        const result = await instance.readPayloadAsString();
        assert.equal(result, 'test-ab');
      });
    });
  });
});
