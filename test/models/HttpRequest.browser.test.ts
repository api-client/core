import { assert } from '@esm-bundle/chai';
import { Kind as HttpRequestKind, HttpRequest, IHttpRequest } from '../../src/models/HttpRequest.js';
import { Property } from '../../src/models/Property.js';
import { PayloadSerializer, ISafePayload } from '../../src/lib/transformers/PayloadSerializer.js';

describe('Models', () => {
  describe('HttpRequest', () => {
    describe('Initialization', () => {
      describe('Default request initialization', () => {
        it('initializes a default project', () => {
          const result = new HttpRequest();
          assert.equal(result.kind, HttpRequestKind, 'sets the kind property');
          assert.equal(result.url, '', 'sets the url property');
          assert.equal(result.method, 'GET', 'sets the method property');
          assert.isUndefined(result.headers, 'has no headers property');
          assert.isUndefined(result.payload, 'has no payload property');
        });
      });

      describe('From schema initialization', () => {
        let base: IHttpRequest;
        beforeEach(() => {
          base = {
            kind: HttpRequestKind,
            url: '',
            method: '',
          }
        });

        it('sets the kind', () => {
          const init: IHttpRequest = { ...base };
          const request = new HttpRequest(init);
          assert.equal(request.kind, HttpRequestKind);
        });

        it('sets the url', () => {
          const init: IHttpRequest = { ...base, ...{ url: 'test.com' } };
          const request = new HttpRequest(init);
          assert.equal(request.url, 'test.com');
        });

        it('sets the method', () => {
          const init: IHttpRequest = { ...base, ...{ method: 'POST' } };
          const request = new HttpRequest(init);
          assert.equal(request.method, 'POST');
        });

        it('sets the headers', () => {
          const init: IHttpRequest = { ...base, ...{ headers: 'content-type: test' } };
          const request = new HttpRequest(init);
          assert.equal(request.headers, 'content-type: test');
        });

        it('sets the payload', () => {
          const init: IHttpRequest = { ...base, ...{ payload: 'test' } };
          const request = new HttpRequest(init);
          assert.equal(request.payload, 'test');
        });

        it('sets the values form serialized schema', () => {
          const init: IHttpRequest = {
            ...base, ...{
              url: 'test.com',
              method: 'POST',
              headers: 'content-type: test',
              payload: 'test',
            }
          };
          const request = new HttpRequest(JSON.stringify(init));
          assert.equal(request.kind, HttpRequestKind, 'has the kind');
          assert.equal(request.url, 'test.com', 'has the url');
          assert.equal(request.method, 'POST', 'has the method');
          assert.equal(request.headers, 'content-type: test', 'has the headers');
          assert.equal(request.payload, 'test', 'has the payload');
        });
      });
    });

    describe('toJSON()', () => {
      it('serializes the kind', () => {
        const request = new HttpRequest();
        const result = request.toJSON();
        assert.equal(result.kind, HttpRequestKind);
      });

      it('serializes the url', () => {
        const request = HttpRequest.fromBaseValues({ url: 'https://api.com', method: '' });
        const result = request.toJSON();
        assert.equal(result.url, 'https://api.com');
      });

      it('serializes the method', () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: 'PATCH' });
        const result = request.toJSON();
        assert.equal(result.method, 'PATCH');
      });

      it('serializes the headers', () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '', headers: 'test' });
        const result = request.toJSON();
        assert.equal(result.headers, 'test');
      });

      it('serializes the payload', () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload: 'test' });
        const result = request.toJSON();
        assert.equal(result.payload, 'test');
      });
    });

    describe('Reading the payload', () => {
      it('reads the payload as string', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload: 'test' });
        const result = await request.readPayload();
        assert.equal(result, 'test');
      });

      it('reads the Blob body', async () => {
        const data = 'data:text/plain;base64,Kioq';
        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload: { type: 'blob', data, } });
        const result = await request.readPayload();
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
        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload: { type: 'formdata', data, } });
        const result = await request.readPayload();
        const typed = result as FormData;
        assert.typeOf(typed, 'formdata');
        const param = typed.get('test-name');
        assert.equal(param, 'test-value');
      });

      it('reads the ArrayBuffer body', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test-ab');
        const payload = PayloadSerializer.stringifyArrayBuffer(view);

        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload });
        const result = await request.readPayload();
        const typed = result as ArrayBuffer;
        assert.typeOf(typed, 'ArrayBuffer');
      });

      it('returns undefined when no payload', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '' });
        const result = await request.readPayload();
        assert.isUndefined(result);
      });
    });

    describe('Writing the payload', () => {
      it('writes the payload as string', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '' });
        await request.writePayload('test');
        assert.equal(request.payload, 'test');
      });

      it('writes the payload as Blob', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '' });
        const message = new Blob(['***** ***'], { type: 'text/plain' });
        await request.writePayload(message);
        const typed = request.payload as ISafePayload;

        assert.equal(typed.type, 'blob');
        assert.typeOf(typed.data, 'array');
        assert.deepEqual(typed.data, [42, 42, 42, 42, 42, 32, 42, 42, 42]);
        assert.equal(typed.meta!.mime, 'text/plain');
      });

      it('writes the payload as File', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '' });
        const message = new File(["***** ***"], "foo.txt", { type: "text/plain" });
        await request.writePayload(message);
        const typed = request.payload as ISafePayload;

        assert.equal(typed.type, 'file');
        assert.typeOf(typed.data, 'array');
        assert.deepEqual(typed.data, [42, 42, 42, 42, 42, 32, 42, 42, 42]);
        assert.equal(typed.meta!.mime, 'text/plain');
      });

      it('writes the payload as ArrayBuffer', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '' });
        const encoder = new TextEncoder();
        const view = encoder.encode('test');
        await request.writePayload(view.buffer);
        const typed = request.payload as ISafePayload;

        assert.equal(typed.type, 'arraybuffer');
        assert.typeOf(typed.data, 'array');
      });

      it('writes the payload as FormData', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '' });
        const b = new Blob(['***'], { type: 'text/plain' });
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

      it('sets undefined when no data', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload: 'test' });
        await request.writePayload(undefined);
        assert.isUndefined(request.payload);
      });

      it('sets undefined when null data', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload: 'test' });
        await request.writePayload(null);
        assert.isUndefined(request.payload);
      });
    });

    describe('HttpRequest.isHttpRequest()', () => {
      it('returns false when no input', () => {
        const result = HttpRequest.isHttpRequest(undefined);
        assert.isFalse(result);
      });

      it('returns false when invalid type', () => {
        const instance = Property.String('abc');
        const result = HttpRequest.isHttpRequest(instance);
        assert.isFalse(result);
      });

      it('returns true when HttpRequest type', () => {
        const instance = new HttpRequest();
        const result = HttpRequest.isHttpRequest(instance);
        assert.isTrue(result);
      });
    });
  });
});
