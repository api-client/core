import { assert } from 'chai';
import { HttpResponseKind, HttpResponse, IHttpResponse, PayloadSerializer, ISafePayload } from '../../index';

//
// Note, the actual unit tests are located in the `HttpResponse.browser.test.ts` file.
// This is to make sure that everything is working in the NodeJS module as well.
//

describe('Models', () => {
  describe('HttpResponse', () => {
    describe('Initialization', () => {
      describe('Default response initialization', () => {
        it('initializes a default project', () => {
          const result = new HttpResponse();
          assert.equal(result.kind, HttpResponseKind, 'sets the kind property');
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

        it('sets the values form serialized schema', () => {
          const init: IHttpResponse = { ...base, ...{
            status: 200,
            statusText: 'hello',
            headers: 'content-type: test',
            payload: 'test',
          }};
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
      it('serializes the status', () => {
        const response = HttpResponse.fromValues(200);
        const result = response.toJSON();
        assert.equal(result.status, 200);
      });
    });

    describe('Reading the payload', () => {
      it('reads the payload as string', async () => {
        const response = HttpResponse.fromValues(200);
        response.payload = 'test';
        const result = await response.readPayload();
        assert.equal(result, 'test');
      });

      it('reads the Buffer body', async () => {
        const buffer = Buffer.from('test-buffer');
        const payload = PayloadSerializer.stringifyBuffer(buffer);

        const response = HttpResponse.fromValues(200);
        response.payload = payload;
        const result = await response.readPayload();
        const typed = result as Buffer;
        assert.equal(typed.toString(), 'test-buffer');
      });
    });

    describe('Writing the payload', () => {
      it('writes the payload as string', async () => {
        const response = HttpResponse.fromValues(200);
        await response.writePayload('test');
        assert.equal(response.payload, 'test');
      });

      it('writes the payload as Buffer', async () => {
        const response = HttpResponse.fromValues(200);
        const buffer = Buffer.from('test-buffer');
        await response.writePayload(buffer);
        const typed = response.payload as ISafePayload;
        
        assert.equal(typed.type, 'buffer');
        assert.typeOf(typed.data, 'array');
      });
    });

    describe('fromLegacy()', () => {
     it('sets the payload from an Buffer', async () => {
        const buffer = Buffer.from('test');
        
        const response = await HttpResponse.fromLegacy({
          status: 200,
          payload: buffer,
        });
        assert.ok(response.payload, 'has the payload');
        const payload = response.payload as ISafePayload;
        assert.equal(payload.type, 'buffer');
        assert.deepEqual(payload.data, [ 116, 101, 115, 116 ]);
      });

      it('sets the payload from an Buffer as LegacyTransformedPayload', async () => {
        const buffer = Buffer.from('test');
        
        const response = await HttpResponse.fromLegacy({
          status: 200,
          payload: {
            type: 'Buffer',
            data: [ ...buffer ],
          },
        });
        assert.ok(response.payload, 'has the payload');
        const payload = response.payload as ISafePayload;
        assert.equal(payload.type, 'buffer');
        assert.deepEqual(payload.data, [ 116, 101, 115, 116 ]);
      });
    });
  });
});
