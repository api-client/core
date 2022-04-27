import { assert } from '@esm-bundle/chai';
import * as Platform from '../../src/Platform.js';

describe('Platform', () => {
  it('hasFormData is true', () => {
    assert.isTrue(Platform.hasFormData);
  });

  it('hasBlob is true', () => {
    assert.isTrue(Platform.hasBlob);
  });

  it('hasBuffer is false', () => {
    assert.isFalse(Platform.hasBuffer);
  });
});
