import { assert } from 'chai';
import { PayloadSerializer, ISafePayload } from '../../../index.js';

describe('lib', () => {
  describe('transformers', () => {
    describe('PayloadSerializer', () => {
      describe('deserialize()', () => {
        it('reads the payload as string', async () => {
          const result = await PayloadSerializer.deserialize('test');
          assert.equal(result, 'test');
        });

        it('reads the Blob body legacy', async () => {
          const data = 'data:text/plain;base64,Kioq';
          const result = await PayloadSerializer.deserialize({ type: 'blob', data, });
          const typed = result as Buffer;
          assert.ok(typed, 'has the buffer');
          assert.equal(typed.byteLength, 3);
          assert.equal(typed.toString(), '***');
        });

        it('reads the Blob body', async () => {
          const value: ISafePayload = {
            type: 'blob',
            data: [42, 42, 42],
            meta: { mime: 'text/plain' },
          };
          const result = await PayloadSerializer.deserialize(value);
          const typed = result as Buffer;
          assert.ok(typed, 'has the buffer');
          assert.equal(typed.byteLength, 3);
          assert.equal(typed.toString(), '***');
        });

        it('reads the File body', async () => {
          const value: ISafePayload = {
            type: 'file',
            data: [42, 42, 42],
            meta: { mime: 'text/plain', name: 'foo.txt' },
          };
          const result = await PayloadSerializer.deserialize(value);
          const typed = result as Buffer;
          assert.ok(typed, 'has the buffer');
          assert.equal(typed.byteLength, 3);
          assert.equal(typed.toString(), '***');
        });

        it('returns undefined for the FormData', async () => {
          const data = [{
            isFile: false,
            name: 'test-name',
            value: 'test-value'
          }];
          const result = await PayloadSerializer.deserialize({ type: 'formdata', data, });
          assert.isUndefined(result);
        });

        it('reads the ArrayBuffer body', async () => {
          const encoder = new TextEncoder();
          const view = encoder.encode('test-ab');
          const payload = PayloadSerializer.stringifyArrayBuffer(view);
          const result = await PayloadSerializer.deserialize(payload);
          const typed = result as Buffer;
          assert.ok(typed, 'has the buffer');
          assert.equal(typed.toString(), 'test-ab');
        });

        it('returns undefined when no payload', async () => {
          const result = await PayloadSerializer.deserialize(undefined);
          assert.isUndefined(result);
        });

        it('returns undefined when payload is a null', async () => {
          // @ts-ignore
          const result = await PayloadSerializer.deserialize(null);
          assert.isUndefined(result);
        });
      });
    });
  });
});
