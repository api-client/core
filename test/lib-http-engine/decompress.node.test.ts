/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import zlib from 'zlib';
import { NodeEngine, Headers, ArcResponse, IHttpRequest } from '../../index.js';

describe('http-engine', () => {
  describe('Decompression', () => {
    function createDeflate(str?: string): Buffer {
      return zlib.deflateSync(Buffer.from(str || 'deflate-string'));
    }

    function createGzip(str?: string): Buffer {
      return zlib.gzipSync(Buffer.from(str || 'gzip-string'));
    }

    function createBrotli(str?: string): Buffer {
      return zlib.brotliCompressSync(Buffer.from(str || 'brotli-string'));
    }

    const requestData: IHttpRequest = {
      method: 'GET',
      url: 'https://domain.com',
    };

    describe('_inflate()', () => {
      it('resolves to a Buffer', async () => {
        const request = new NodeEngine(requestData);
        const result = await request.inflate(createDeflate());
        assert.equal(result.length, 14);
      });

      it('Buffer has original data', async () => {
        const request = new NodeEngine(requestData);
        const result = await request.inflate(createDeflate());
        assert.equal(result.toString(), 'deflate-string');
      });
    });

    describe('_gunzip()', () => {
      it('Promise resolves to buffer', async () => {
        const request = new NodeEngine(requestData);
        const result = await request.gunzip(createGzip());
        assert.equal(result.length, 11);
      });

      it('Buffer has original data', async () => {
        const request = new NodeEngine(requestData);
        const result = await request.gunzip(createGzip());
        assert.equal(result.toString(), 'gzip-string');
      });
    });

    describe('_brotli()', () => {
      it('Promise resolves to buffer', async () => {
        const request = new NodeEngine(requestData);
        const result = await request.brotli(createBrotli());
        assert.equal(result.length, 13);
      });

      it('Buffer has original data', async () => {
        const request = new NodeEngine(requestData);
        const result = await request.brotli(createBrotli());
        assert.equal(result.toString(), 'brotli-string');
      });
    });

    describe('_decompress()', () => {
      it('returns undefined when no data', async () => {
        const request = new NodeEngine(requestData);
        const result = await request.decompress(undefined);
        assert.isUndefined(result);
      });

      it('returns undefined when aborted', async () => {
        const request = new NodeEngine(requestData);
        request.aborted = true;
        const result = await request.decompress(Buffer.from('test'));
        assert.isUndefined(result);
      });

      it('returns the same buffer when no content-encoding header', async () => {
        const b = Buffer.from('test');
        const request = new NodeEngine(requestData);
        request.currentHeaders = new Headers();
        request.currentResponse = ArcResponse.fromValues(200);
        const result = await request.decompress(b) as Buffer;
        assert.equal(result.compare(b), 0);
      });

      it('decompresses deflate', async () => {
        const b = createDeflate();
        const request = new NodeEngine(requestData);
        request.currentResponse = ArcResponse.fromValues(200, '', 'content-encoding: deflate');
        request.currentHeaders = new Headers('content-encoding: deflate');
        const result = await request.decompress(b) as Buffer;
        assert.equal(result.toString(), 'deflate-string');
      });

      it('decompresses gzip', async () => {
        const b = createGzip();
        const request = new NodeEngine(requestData);
        request.currentResponse = ArcResponse.fromValues(200, '', 'content-encoding: gzip');
        request.currentHeaders = new Headers('content-encoding: gzip');
        const result = await request.decompress(b) as Buffer;
        assert.equal(result.toString(), 'gzip-string');
      });

      it('decompresses brotli', async () => {
        const b = createBrotli();
        const request = new NodeEngine(requestData);
        request.currentResponse = ArcResponse.fromValues(200, '', 'content-encoding: br');
        request.currentHeaders = new Headers('content-encoding: br');
        const result = await request.decompress(b) as Buffer;
        assert.equal(result.toString(), 'brotli-string');
      });
    });
  });
});
