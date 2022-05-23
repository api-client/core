import { assert } from '@esm-bundle/chai';
import { LegacyMock } from '../../../legacy.js';

describe('LegacyMock', () => {
  describe('constructor()', () => {
    let mock: LegacyMock;

    before(() => { mock = new LegacyMock(); });

    [
      'http', 'variables', 'cookies', 'hostRules',
      'certificates', 'urls', 'authorization', 'restApi',
    ].forEach((prop) => {
      it(`creates the ${prop} property`, () => {
        assert.ok(mock[prop]);
      });
    });
  });
});
