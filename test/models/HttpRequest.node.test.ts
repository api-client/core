import { assert } from 'chai';
import { Kind as HttpRequestKind, HttpRequest, IHttpRequest } from '../../src/models/HttpRequest';
import { PayloadSerializer, ISafePayload } from '../../src/lib/transformers/PayloadSerializer';

//
// Note, the actual unit tests are located in the `HttpRequest.browser.test.ts` file.
// This is to make sure that everything is working in the NodeJS module as well.
//

describe('Models', () => {
  describe('HttpRequest', () => {
    describe('Initialization', () => {
      describe('Default request initialization', () => {
        it('initializes a default project', () => {
          const result = new HttpRequest();
          assert.equal(result.kind, HttpRequestKind, 'sets the kind property');
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
      });
    });

    describe('toJSON()', () => {
      it('serializes the kind', () => {
        const request = new HttpRequest();
        const result = request.toJSON();
        assert.equal(result.kind, HttpRequestKind);
      });
    });

    describe('Reading the payload', () => {
      it('reads the payload as string', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload: 'test' });
        const result = await request.readPayload();
        assert.equal(result, 'test');
      });

      it('constructs Buffer for a Blob', async () => {
        const data = 'data:text/plain;base64,KioqKiogKioq';
        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload: { type: 'blob', data, } });
        const result = (await request.readPayload()) as Buffer;
        
        assert.equal(result.toString(), '***** ***');
      });

      it('returns undefined for FormData body', async () => {
        const data = [{
          isFile: false,
          name: 'test-name',
          value: 'test-value'
        }];
        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload: { type: 'formdata', data, } });
        const result = await request.readPayload();
        assert.isUndefined(result);
      });

      it('reads the ArrayBuffer body', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test-ab');
        const payload = PayloadSerializer.stringifyArrayBuffer(view);

        const request = HttpRequest.fromBaseValues({ url: '', method: '', payload });
        const result = await request.readPayload();
        const typed = result as Buffer;
        
        assert.equal(typed.toString(), 'test-ab');
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

      it('writes the payload as ArrayBuffer', async () => {
        const request = HttpRequest.fromBaseValues({ url: '', method: '' });
        const encoder = new TextEncoder();
        const view = encoder.encode('test');
        await request.writePayload(view.buffer);
        const typed = request.payload as ISafePayload;
        
        assert.equal(typed.type, 'arraybuffer');
        assert.typeOf(typed.data, 'array');
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
  });
});
