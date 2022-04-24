import { assert } from '@esm-bundle/chai';
import { Kind as HttpResponseKind, HttpResponse, IHttpResponse } from '../../src/models/HttpResponse.js';
import { PayloadSerializer, ISafePayload } from '../../src/lib/transformers/PayloadSerializer.js';

describe('Models', () => {
  describe('HttpResponse', () => {
    describe('Initialization', () => {
      describe('Default response initialization', () => {
        it('initializes a default project', () => {
          const result = new HttpResponse();
          assert.equal(result.kind, HttpResponseKind, 'sets the kind property');
          assert.equal(result.status, 0, 'sets the status property');
          assert.isUndefined(result.statusText, 'has no statusText property');
          assert.isUndefined(result.headers, 'has no headers property');
          assert.isUndefined(result.payload, 'has no payload property');
        });
      });

      describe('From schema initialization', () => {
        let base: IHttpResponse;
        beforeEach(() => {
          base = {
            kind: HttpResponseKind,
            status: 0,
          }
        });

        it('sets the kind', () => {
          const init: IHttpResponse = { ...base };
          const response = new HttpResponse(init);
          assert.equal(response.kind, HttpResponseKind);
        });

        it('sets the status', () => {
          const init: IHttpResponse = { ...base, ...{ status: 200 } };
          const response = new HttpResponse(init);
          assert.equal(response.status, 200);
        });

        it('sets the statusText', () => {
          const init: IHttpResponse = { ...base, ...{ statusText: 'hello' } };
          const response = new HttpResponse(init);
          assert.equal(response.statusText, 'hello');
        });

        it('sets the headers', () => {
          const init: IHttpResponse = { ...base, ...{ headers: 'content-type: test' } };
          const response = new HttpResponse(init);
          assert.equal(response.headers, 'content-type: test');
        });

        it('sets the payload', () => {
          const init: IHttpResponse = { ...base, ...{ payload: 'test' } };
          const response = new HttpResponse(init);
          assert.equal(response.payload, 'test');
        });

        it('sets the values form serialized schema', () => {
          const init: IHttpResponse = {
            ...base, ...{
              status: 200,
              statusText: 'hello',
              headers: 'content-type: test',
              payload: 'test',
            }
          };
          const response = new HttpResponse(JSON.stringify(init));
          assert.equal(response.kind, HttpResponseKind, 'has the kind');
          assert.equal(response.status, 200, 'has the status');
          assert.equal(response.statusText, 'hello', 'has the statusText');
          assert.equal(response.headers, 'content-type: test', 'has the headers');
          assert.equal(response.payload, 'test', 'has the payload');
        });
      });
    });

    describe('toJSON()', () => {
      it('serializes the kind', () => {
        const response = new HttpResponse();
        const result = response.toJSON();
        assert.equal(result.kind, HttpResponseKind);
      });

      it('serializes the status', () => {
        const response = HttpResponse.fromValues(200);
        const result = response.toJSON();
        assert.equal(result.status, 200);
      });

      it('serializes the statusText', () => {
        const response = HttpResponse.fromValues(200, 'hello');
        const result = response.toJSON();
        assert.equal(result.statusText, 'hello');
      });

      it('serializes the headers', () => {
        const response = HttpResponse.fromValues(200, 'hello', 'test');
        const result = response.toJSON();
        assert.equal(result.headers, 'test');
      });
    });

    describe('Reading the payload', () => {
      it('reads the payload as string', async () => {
        const response = HttpResponse.fromValues(200);
        response.payload = 'test';
        const result = await response.readPayload();
        assert.equal(result, 'test');
      });

      it('reads the Blob body', async () => {
        const data = 'data:text/plain;base64,Kioq';
        const response = HttpResponse.fromValues(200);
        response.payload = { type: 'blob', data, };
        const result = await response.readPayload();
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
        const response = HttpResponse.fromValues(200);
        response.payload = { type: 'formdata', data, };
        const result = await response.readPayload();
        const typed = result as FormData;
        assert.typeOf(typed, 'formdata');
        const param = typed.get('test-name');
        assert.equal(param, 'test-value');
      });

      it('reads the ArrayBuffer body', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test-ab');
        const payload = PayloadSerializer.stringifyArrayBuffer(view);

        const response = HttpResponse.fromValues(200);
        response.payload = payload;
        const result = await response.readPayload();
        const typed = result as ArrayBuffer;
        assert.typeOf(typed, 'ArrayBuffer');
      });

      it('returns undefined when no payload', async () => {
        const response = HttpResponse.fromValues(200);
        const result = await response.readPayload();
        assert.isUndefined(result);
      });
    });

    describe('Writing the payload', () => {
      it('writes the payload as string', async () => {
        const response = HttpResponse.fromValues(200);
        await response.writePayload('test');
        assert.equal(response.payload, 'test');
      });

      it('writes the payload as Blob', async () => {
        const response = HttpResponse.fromValues(200);
        const message = new Blob(['***** ***'], { type: 'text/plain' });
        await response.writePayload(message);
        const typed = response.payload as ISafePayload;

        assert.equal(typed.type, 'blob');
        assert.typeOf(typed.data, 'array');
        assert.deepEqual(typed.data, [42, 42, 42, 42, 42, 32, 42, 42, 42]);
        assert.equal(typed.meta!.mime, 'text/plain');
      });

      it('writes the payload as File', async () => {
        const response = HttpResponse.fromValues(200);
        const message = new File(["***** ***"], "foo.txt", { type: "text/plain" });
        await response.writePayload(message);
        const typed = response.payload as ISafePayload;

        assert.equal(typed.type, 'file');
        assert.typeOf(typed.data, 'array');
        assert.deepEqual(typed.data, [42, 42, 42, 42, 42, 32, 42, 42, 42]);
        assert.equal(typed.meta!.mime, 'text/plain');
      });

      it('writes the payload as ArrayBuffer', async () => {
        const response = HttpResponse.fromValues(200);
        const encoder = new TextEncoder();
        const view = encoder.encode('test');
        await response.writePayload(view.buffer);
        const typed = response.payload as ISafePayload;

        assert.equal(typed.type, 'arraybuffer');
        assert.typeOf(typed.data, 'array');
      });

      it('writes the payload as FormData', async () => {
        const response = HttpResponse.fromValues(200);
        const b = new Blob(['***'], { type: 'text/plain' });
        const fd = new FormData();
        fd.append('file', b, 'file-name');
        fd.append('text', 'abcd');
        fd.append('text-part', b, 'text-part');
        await response.writePayload(fd);
        const typed = response.payload as ISafePayload;

        assert.equal(typed.type, 'formdata');
        assert.typeOf(typed.data, 'array');
        assert.lengthOf(typed.data, 3);
      });

      it('sets undefined when no data', async () => {
        const response = HttpResponse.fromValues(200);
        response.payload = 'test';
        await response.writePayload(undefined);
        assert.isUndefined(response.payload);
      });

      it('sets undefined when null data', async () => {
        const response = HttpResponse.fromValues(200);
        response.payload = 'test';
        await response.writePayload(null);
        assert.isUndefined(response.payload);
      });
    });

    describe('fromLegacy()', () => {
      it('sets the status', async () => {
        const response = await HttpResponse.fromLegacy({
          status: 200,
        });
        assert.equal(response.status, 200);
      });

      it('sets the statusText', async () => {
        const response = await HttpResponse.fromLegacy({
          status: 200,
          statusText: 'test',
        });
        assert.equal(response.statusText, 'test');
      });

      it('sets the headers', async () => {
        const response = await HttpResponse.fromLegacy({
          status: 200,
          headers: 'test',
        });
        assert.equal(response.headers, 'test');
      });

      it('sets the payload from a string', async () => {
        const response = await HttpResponse.fromLegacy({
          status: 200,
          payload: 'test',
        });
        assert.equal(response.payload, 'test');
      });

      it('sets the payload from an ArrayBuffer', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test');

        const response = await HttpResponse.fromLegacy({
          status: 200,
          payload: view.buffer,
        });
        assert.ok(response.payload, 'has the payload');
        const payload = response.payload as ISafePayload;
        assert.equal(payload.type, 'arraybuffer');
        assert.deepEqual(payload.data, [116, 101, 115, 116]);
      });

      it('sets the payload from an ArrayBuffer as LegacyTransformedPayload', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test');

        const response = await HttpResponse.fromLegacy({
          status: 200,
          payload: {
            type: 'ArrayBuffer',
            data: [...view],
          },
        });
        assert.ok(response.payload, 'has the payload');
        const payload = response.payload as ISafePayload;
        assert.equal(payload.type, 'arraybuffer');
        assert.deepEqual(payload.data, [116, 101, 115, 116]);
      });
    });
  });
});
