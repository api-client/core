/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import { FormDataNode } from '../../src/runtime/http-engine/FormData.js';
import { IMultipartBody } from '../../index.js';

describe('http-engine', () => {
  describe('PayloadSupport', () => {
    const textPart: IMultipartBody = {
      name: 'txt',
      value: 'text-value',
      enabled: true,
    };

    const blobPart: IMultipartBody = {
      name: 'blob',
      value: {
        type: 'blob',
        data: [42, 42, 42],
        meta: { mime: 'text/plain' },
      },
      enabled: true,
    };

    const filePart: IMultipartBody = {
      name: 'file',
      value: {
        type: 'file',
        data: [42, 42, 42],
        meta: { mime: 'application/json', name: 'foo.txt' },
      },
      enabled: true,
    };

    describe('getBody()', () => {
      let factory: FormDataNode;
      beforeEach(() => {
        factory = new FormDataNode();
      });

      it('generates the boundary only once', () => {
        const st = factory.boundary;
        const nd = factory.boundary;
        assert.typeOf(st, 'string');
        assert.include(st, '--------------------------');
        assert.equal(st, nd);
      });

      it('returns the body and the content type', () => {
        const result = factory.getBody([textPart]);
        assert.typeOf(result.type, 'string', 'the type is a string');
        assert.equal(result.type, `multipart/form-data; boundary=${factory.boundary}`, 'the type has the value');
        assert.ok(result.buffer, 'has the buffer');
      });

      it('adds the text part', () => {
        const result = factory.getBody([textPart]);
        const txt = result.buffer.toString('utf8');
        const lines = txt.split('\r\n');
        assert.lengthOf(lines, 5, 'has 5 lines');
        assert.equal(lines[0], `--${factory.boundary}`);
        assert.equal(lines[1], `Content-Disposition: form-data; name="txt"`);
        assert.equal(lines[2], ``);
        assert.equal(lines[3], `text-value`);
        assert.equal(lines[4], `--${factory.boundary}--`);
      });

      it('adds the blob part', () => {
        const result = factory.getBody([blobPart]);
        const txt = result.buffer.toString('utf8');
        const lines = txt.split('\r\n');
        assert.lengthOf(lines, 6, 'has 6 lines');
        assert.equal(lines[0], `--${factory.boundary}`);
        assert.equal(lines[1], `Content-Disposition: form-data; name="blob"; filename="blob"`);
        assert.equal(lines[2], `Content-Type: text/plain`);
        assert.equal(lines[3], ``);
        assert.equal(lines[4], `***`);
        assert.equal(lines[5], `--${factory.boundary}--`);
      });

      it('adds the file part', () => {
        const result = factory.getBody([filePart]);
        const txt = result.buffer.toString('utf8');
        const lines = txt.split('\r\n');
        assert.lengthOf(lines, 6, 'has 6 lines');
        assert.equal(lines[0], `--${factory.boundary}`);
        assert.equal(lines[1], `Content-Disposition: form-data; name="file"; filename="foo.txt"`);
        assert.equal(lines[2], `Content-Type: application/json`);
        assert.equal(lines[3], ``);
        assert.equal(lines[4], `***`);
        assert.equal(lines[5], `--${factory.boundary}--`);
      });

      it('adds multiple parts', () => {
        const result = factory.getBody([textPart, blobPart, filePart]);
        const txt = result.buffer.toString('utf8');
        const lines = txt.split('\r\n');

        assert.lengthOf(lines, 15, 'has 15 lines');
        assert.equal(lines[0], `--${factory.boundary}`);
        assert.equal(lines[1], `Content-Disposition: form-data; name="txt"`);
        assert.equal(lines[2], ``);
        assert.equal(lines[3], `text-value`);
        assert.equal(lines[4], `--${factory.boundary}`);
        assert.equal(lines[5], `Content-Disposition: form-data; name="blob"; filename="blob"`);
        assert.equal(lines[6], `Content-Type: text/plain`);
        assert.equal(lines[7], ``);
        assert.equal(lines[8], `***`);
        assert.equal(lines[9], `--${factory.boundary}`);
        assert.equal(lines[10], `Content-Disposition: form-data; name="file"; filename="foo.txt"`);
        assert.equal(lines[11], `Content-Type: application/json`);
        assert.equal(lines[12], ``);
        assert.equal(lines[13], `***`);
        assert.equal(lines[14], `--${factory.boundary}--`);
      });
    });
  });
});
