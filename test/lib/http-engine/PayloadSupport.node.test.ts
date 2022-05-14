/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import { PayloadSupport } from '../../../src/runtime/http-engine/PayloadSupport.js';
import { Headers, ISafePayload } from '../../../index.js';

describe('http-engine', () => {
  describe('PayloadSupport', () => {
    describe('normalizeString()', () => {
      it('returns the same string', () => {
        const result = PayloadSupport.normalizeString('test');
        assert.strictEqual(result, 'test');
      });

      it('adds CRLF for a single \\n character', () => {
        const result = PayloadSupport.normalizeString('te\nst');
        assert.strictEqual(result, 'te\r\nst');
      });

      it('adds CRLF for a single \\r character', () => {
        const result = PayloadSupport.normalizeString('te\rst');
        assert.strictEqual(result, 'te\r\nst');
      });

      it('ignores existing \\r\\n characters', () => {
        const result = PayloadSupport.normalizeString('te\r\nst');
        assert.strictEqual(result, 'te\r\nst');
      });
    });

    describe('payloadToBuffer()', () => {
      const filePayload: ISafePayload = {
        type: 'file',
        data: [42, 42, 42],
        meta: { mime: 'text/plain', name: 'foo.txt' },
      };

      const blobPayload: ISafePayload = {
        type: 'blob',
        data: [42, 42, 42],
        meta: { mime: 'text/plain' },
      };

      const bufferPayload: ISafePayload = {
        type: 'buffer',
        data: [42, 42, 42],
      };

      const arrayBufferPayload: ISafePayload = {
        type: 'arraybuffer',
        data: [42, 42, 42],
      };

      const formDataPayload: ISafePayload = {
        type: 'formdata',
        data: [
          {
            name: 'txt',
            value: 'text-value',
            enabled: true,
          }
        ],
      };

      let headers: Headers;
      beforeEach(() => {
        headers = new Headers();
      });

      it('returns undefined when no payload', () => {
        const result = PayloadSupport.payloadToBuffer(headers);
        assert.isUndefined(result);
        assert.notOk(headers.get('content-type'), 'does not add content-type');
      });

      it('returns Buffer from a string', () => {
        const result = PayloadSupport.payloadToBuffer(headers, 'test');
        assert.ok(result, 'has the result');
        assert.equal(result!.toString('utf-8'), 'test', 'has the contents');
        assert.notOk(headers.get('content-type'), 'does not add content-type');
      });

      it('returns Buffer from a File', () => {
        const result = PayloadSupport.payloadToBuffer(headers, filePayload);
        assert.ok(result, 'has the result');
        assert.equal(result!.toString('utf-8'), '***', 'has the contents');
      });

      it('adds the File content type', () => {
        PayloadSupport.payloadToBuffer(headers, filePayload);
        const mime = headers.get('content-type');
        assert.equal(mime, 'text/plain');
      });

      it('returns Buffer from a Blob', () => {
        const result = PayloadSupport.payloadToBuffer(headers, blobPayload);
        assert.ok(result, 'has the result');
        assert.equal(result!.toString('utf-8'), '***', 'has the contents');
      });

      it('adds the Blob content type', () => {
        PayloadSupport.payloadToBuffer(headers, blobPayload);
        const mime = headers.get('content-type');
        assert.equal(mime, 'text/plain');
      });

      it('returns Buffer from a Buffer', () => {
        const result = PayloadSupport.payloadToBuffer(headers, bufferPayload);
        assert.ok(result, 'has the result');
        assert.equal(result!.toString('utf-8'), '***', 'has the contents');
        assert.notOk(headers.get('content-type'), 'does not add content-type');
      });

      it('returns Buffer from an ArrayBuffer', () => {
        const result = PayloadSupport.payloadToBuffer(headers, arrayBufferPayload);
        assert.ok(result, 'has the result');
        assert.equal(result!.toString('utf-8'), '***', 'has the contents');
        assert.notOk(headers.get('content-type'), 'does not add content-type');
      });

      it('returns Buffer from a FormData', () => {
        const result = PayloadSupport.payloadToBuffer(headers, formDataPayload);
        assert.ok(result, 'has the result');
      });

      it('adds the FormData content type', () => {
        PayloadSupport.payloadToBuffer(headers, formDataPayload);
        const mime = headers.get('content-type');
        assert.include(mime, 'multipart/form-data; boundary=');
      });
    });
  });
});
