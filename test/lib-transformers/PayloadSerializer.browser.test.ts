import { assert } from '@esm-bundle/chai';
import { IFileMeta, IMultipartBody, ISafePayload, PayloadSerializer, SupportedPayloadTypes } from '../../src/lib/transformers/PayloadSerializer.js';

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

      describe('needsSerialization()', () => {
        it('returns false when already serialized', () => {
          const value: ISafePayload = {
            type: 'blob',
            data: [42, 42, 42],
            meta: { mime: 'text/plain' },
          };
          const result = PayloadSerializer.needsSerialization(value);
          assert.isFalse(result);
        });

        it('returns true for any other type', () => {
          const result = PayloadSerializer.needsSerialization('test');
          assert.isTrue(result);
        });
      });

      describe('deserialize()', () => {
        it('reads the payload as string', async () => {
          const result = await PayloadSerializer.deserialize('test');
          assert.equal(result, 'test');
        });

        it('reads the Blob body legacy', async () => {
          const data = 'data:text/plain;base64,Kioq';
          const result = await PayloadSerializer.deserialize({ type: 'blob', data, });
          const typed = result as Blob;
          assert.typeOf(typed, 'blob');
          assert.equal(typed.type, 'text/plain');
          assert.equal(typed.size, 3);
        });

        it('reads the Blob body', async () => {
          const value: ISafePayload = {
            type: 'blob',
            data: [42, 42, 42],
            meta: { mime: 'text/plain' },
          };
          const result = await PayloadSerializer.deserialize(value);
          const typed = result as Blob;
          assert.typeOf(typed, 'blob');
          assert.equal(typed.type, 'text/plain');
          assert.equal(typed.size, 3);
        });

        it('reads the File body', async () => {
          const value: ISafePayload = {
            type: 'file',
            data: [42, 42, 42],
            meta: { mime: 'text/plain', name: 'foo.txt' },
          };
          const result = await PayloadSerializer.deserialize(value);
          const typed = result as File;
          assert.typeOf(typed, 'file');
          assert.equal(typed.type, 'text/plain');
          assert.equal(typed.name, 'foo.txt');
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
          const message = new Blob(['***** ***'], { type: 'text/plain' });
          const result = await PayloadSerializer.serialize(message) as ISafePayload;
          
          assert.equal(result.type, 'blob');
          assert.typeOf(result.data, 'array');
          assert.deepEqual(result.data, [42, 42, 42, 42, 42, 32, 42, 42, 42]);
          assert.equal(result.meta!.mime, 'text/plain');
        });

        it('writes the payload as File', async () => {
          const message = new File(["***** ***"], "foo.txt", {
            type: "text/plain",
          });
          const result = await PayloadSerializer.serialize(message) as ISafePayload;
          
          assert.equal(result.type, 'file');
          assert.typeOf(result.data, 'array');
          assert.deepEqual(result.data, [42, 42, 42, 42, 42, 32, 42, 42, 42]);
          const meta = result.meta as IFileMeta;
          assert.equal(meta.mime, 'text/plain');
          assert.equal(meta.name, 'foo.txt');
        });

        it('writes the payload as ArrayBuffer', async () => {
          const encoder = new TextEncoder();
          const view = encoder.encode('test');
          const result = await PayloadSerializer.serialize(view.buffer) as ISafePayload;

          assert.equal(result.type, 'arraybuffer');
          assert.typeOf(result.data, 'array');
        });

        it('writes the payload as FormData', async () => {
          const blob = new Blob(['***'], { type: 'text/plain' });
          const file = new File(["***** ***"], "foo.txt", { type: "application/json" });
          const fd = new FormData();
          fd.append('text', 'abcd');
          fd.append('blob', blob);
          fd.append('file', file);
          const result = await PayloadSerializer.serialize(fd) as ISafePayload;

          assert.equal(result.type, 'formdata');
          assert.typeOf(result.data, 'array');
          assert.lengthOf(result.data, 3);
          
          const [p1, p2, p3] = result.data as IMultipartBody[];

          // text part
          assert.isTrue(p1.enabled, 'part 1 is enabled');
          assert.equal(p1.name, 'text', 'part 1 has the name');
          assert.equal(p1.value, 'abcd', 'part 1 has the value');

          // blob part
          assert.isTrue(p2.enabled, 'part 2 is enabled');
          assert.equal(p2.name, 'blob', 'part 2 has the name');
          assert.typeOf(p2.value, 'object', 'part 2 has the value as ISafePayload');
          const p2Value = p2.value as ISafePayload;
          assert.equal(p2Value.type, 'blob', 'part 2 value has the type');
          assert.typeOf(p2Value.data, 'array', 'part 2 value has the value as an array');
          assert.deepEqual(p2Value.data, [42, 42, 42], 'part 2 value has the value');
          assert.deepEqual(p2Value.meta, { mime: 'text/plain' }, 'part 2 value has the meta');
          
          // file part
          assert.isTrue(p3.enabled, 'part 3 is enabled');
          assert.equal(p3.name, 'file', 'part 3 has the name');
          assert.typeOf(p3.value, 'object', 'part 3 has the value as ISafePayload');
          const p3Value = p3.value as ISafePayload;
          assert.equal(p3Value.type, 'file', 'part 3 value has the type');
          assert.typeOf(p3Value.data, 'array', 'part 3 value has the value as an array');
          assert.deepEqual(p3Value.data, [42, 42, 42, 42, 42, 32, 42, 42, 42], 'part 3 value has the value');
          assert.deepEqual(p3Value.meta, { mime: 'application/json', name: "foo.txt" }, 'part 3 value has the meta');
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
