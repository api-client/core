import { assert } from 'chai';
import * as Platform from '../../src/Platform.js';

describe('Platform', () => {
  it('hasFormData is false', () => {
    assert.isFalse(Platform.hasFormData);
  });

  it('hasBlob is false', () => {
    assert.isFalse(Platform.hasBlob);
  });

  it('hasBuffer is true', () => {
    assert.isTrue(Platform.hasBuffer);
  });
});
