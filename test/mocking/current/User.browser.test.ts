import { assert } from '@esm-bundle/chai';
import { User } from '../../../src/mocking/lib/User.js';
import { Kind as UserKind } from '../../../src/models/store/User.js';

describe('User', () => {
  describe('user()', () => {
    let user: User;

    before(() => { user = new User(); });

    it('returns an object', () => {
      const result = user.user();
      assert.typeOf(result, 'object');
    });

    [
      ['key', 'string'],
      ['name', 'string'],
      ['email', 'array'],
      ['picture', 'object'],
      ['provider', 'object'],
    ].forEach(([prop, type]) => {
      it(`has the ${prop} property of a type ${type}`, () => {
        const result = user.user();
        assert.typeOf(result[prop], type);
      });
    });

    it('has the kind', () => {
      const result = user.user();
      assert.equal(result.kind, UserKind);
    });

    it('has the email array', () => {
      const result = user.user();
      const [email] = result.email;
      assert.typeOf(email.email, 'string');
      assert.typeOf(email.verified, 'boolean');
    });

    it('does not set email when configured', () => {
      const result = user.user({ noEmail: true });
      assert.isUndefined(result.email);
    });

    it('has the picture object', () => {
      const result = user.user();
      const { url } = result.picture;
      assert.typeOf(url, 'string');
    });

    it('does not set picture when configured', () => {
      const result = user.user({ noPicture: true });
      assert.isUndefined(result.picture);
    });

    it('has the provider object', () => {
      const result = user.user();
      const { refreshToken } = result.provider as { refreshToken: string };
      assert.typeOf(refreshToken, 'string');
    });

    it('does not set provider when configured', () => {
      const result = user.user({ noProvider: true });
      assert.isUndefined(result.provider);
    });
  });
});
