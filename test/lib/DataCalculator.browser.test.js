import { assert } from '@esm-bundle/chai';
import { DataCalculator } from '../../src/lib/calculators/DataCalculator.js';

describe('lib/DataSize', () => {
  describe('DataCalculator.bytesToSize()', () => {
    it('returns value for 0', () => {
      const result = DataCalculator.bytesToSize(0);
      assert.equal(result, '0 Bytes');
    });

    it('returns value in bytes', () => {
      const result = DataCalculator.bytesToSize(10);
      assert.equal(result, '10 Bytes');
    });

    it('returns value in kilobytes', () => {
      const result = DataCalculator.bytesToSize(10240);
      assert.equal(result, '10 KB');
    });

    it('returns value in megabytes', () => {
      const result = DataCalculator.bytesToSize(10*1024*1024);
      assert.equal(result, '10 MB');
    });

    it('returns value in gigabytes', () => {
      const result = DataCalculator.bytesToSize(10*1024*1024*1024);
      assert.equal(result, '10 GB');
    });

    it('returns value in terabytes', () => {
      const result = DataCalculator.bytesToSize(10*1024*1024*1024*1024);
      assert.equal(result, '10 TB');
    });

    it('returns value in petabytes', () => {
      const result = DataCalculator.bytesToSize(10*1024*1024*1024*1024*1024);
      assert.equal(result, '10 PB');
    });

    it('returns value in exabyte', () => {
      const result = DataCalculator.bytesToSize(10*1024*1024*1024*1024*1024*1024);
      assert.equal(result, '10 EB');
    });

    it('returns value in zettabyte', () => {
      const result = DataCalculator.bytesToSize(10*1024*1024*1024*1024*1024*1024*1024);
      assert.equal(result, '10 ZB');
    });
  });
  
  describe('DataCalculator.payloadSize()', () => {
    it('returns 0 for empty argument', async () => {
      const result = await DataCalculator.payloadSize(undefined);
      assert.equal(result, 0);
    });

    it('returns size of an ArrayBuffer', async () => {
      const buffer = new ArrayBuffer(8);
      const result = await DataCalculator.payloadSize(buffer);
      assert.equal(result, 8);
    });

    it('returns size of a blob', async () => {
      const blob = new Blob(['test']);
      const result = await DataCalculator.payloadSize(blob);
      assert.equal(result, 4);
    });

    it('returns size of a string', async () => {
      const blob = 'test';
      const result = await DataCalculator.payloadSize(blob);
      assert.equal(result, 4);
    });

    // this stopped working with WebKit. It was working before.
    it.skip('returns size of a FormData', async () => {
      const form = new FormData();
      const blob = new Blob(['test']);
      form.append('text', 'value');
      form.append('file', blob);
      const result = await DataCalculator.payloadSize(form);
      // todo (pawel): Gecko and Webkit reports 343 bytes while Chromium says it's 292
      // This needs checking what is actually happens.
      assert.isAbove(result, 200);
      // assert.equal(result, 292);
    });
  });

  describe('DataCalculator.stringSize()', () => {
    it('returns 0 for empty argument', () => {
      const result = DataCalculator.stringSize(undefined);
      assert.equal(result, 0);
    });

    it('returns 0 for non string argument', () => {
      const blob = new Blob(['test']);
      // @ts-ignore
      const result = DataCalculator.stringSize(blob);
      assert.equal(result, 0);
    });

    it('returns size of a string', () => {
      const blob = 'test';
      const result = DataCalculator.stringSize(blob);
      assert.equal(result, 4);
    });

    it('returns size of a string with non-latin', () => {
      const blob = 'ł';
      const result = DataCalculator.stringSize(blob);
      assert.equal(result, 2);
    });
  });
});
