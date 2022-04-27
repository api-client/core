import { assert } from '@esm-bundle/chai';
import * as AuthorizationUtils from '../../src/authorization/lib/Utils.js';

describe('AuthorizationUtils', () => {
  describe('Auth methods', () => {
    it('has the METHOD_BASIC', () => {
      assert.equal(AuthorizationUtils.METHOD_BASIC, 'basic');
    });

    it('has the METHOD_BEARER', () => {
      assert.equal(AuthorizationUtils.METHOD_BEARER, 'bearer');
    });

    it('has the METHOD_NTLM', () => {
      assert.equal(AuthorizationUtils.METHOD_NTLM, 'ntlm');
    });

    it('has the METHOD_DIGEST', () => {
      assert.equal(AuthorizationUtils.METHOD_DIGEST, 'digest');
    });

    it('has the METHOD_OAUTH2', () => {
      assert.equal(AuthorizationUtils.METHOD_OAUTH2, 'oauth 2');
    });

    it('has the METHOD_OIDC', () => {
      assert.equal(AuthorizationUtils.METHOD_OIDC, 'open id');
    });

    it('has the METHOD_CC', () => {
      assert.equal(AuthorizationUtils.METHOD_CC, 'client certificate');
    });

    it('has the CUSTOM_CREDENTIALS', () => {
      assert.equal(AuthorizationUtils.CUSTOM_CREDENTIALS, 'Custom credentials');
    });
  });

  describe('normalizeType()', () => {
    it('lowercase the input', () => {
      const result = AuthorizationUtils.normalizeType('TyPe');
      assert.equal(result, 'type');
    });
  });

  describe('validateRedirectUri()', () => {
    it('returns false when not a string', () => {
      const result = AuthorizationUtils.validateRedirectUri(2);
      assert.isFalse(result);
    });

    it('returns false when empty string', () => {
      const result = AuthorizationUtils.validateRedirectUri('');
      assert.isFalse(result);
    });

    it('returns false when starts with javascript:', () => {
      const result = AuthorizationUtils.validateRedirectUri('javascript:alert("a")');
      assert.isFalse(result);
    });

    it('returns true for custom URI scheme', () => {
      const result = AuthorizationUtils.validateRedirectUri('my-app://app-name');
      assert.isTrue(result);
    });

    it('returns true for http scheme', () => {
      const result = AuthorizationUtils.validateRedirectUri('http://app-name');
      assert.isTrue(result);
    });

    it('returns true for https scheme', () => {
      const result = AuthorizationUtils.validateRedirectUri('https://app-name');
      assert.isTrue(result);
    });

    it('returns true for relative URLs', () => {
      const result = AuthorizationUtils.validateRedirectUri('/api/auth/token');
      assert.isTrue(result);
    });

    it('returns true for reverse DNS with path', () => {
      const result = AuthorizationUtils.validateRedirectUri('com.example.app:redirect_uri_path');
      assert.isTrue(result);
    });

    it('returns true for reverse DNS with client id', () => {
      const result = AuthorizationUtils.validateRedirectUri('com.googleusercontent.apps.123');
      assert.isTrue(result);
    });

    it('returns true for a loopback IP address', () => {
      const result = AuthorizationUtils.validateRedirectUri('http://127.0.0.1:1234');
      assert.isTrue(result);
    });

    it('returns true for urn: namespace', () => {
      const result = AuthorizationUtils.validateRedirectUri('urn:ietf:wg:oauth:2.0:oob');
      assert.isTrue(result);
    });
  });

  describe('generateCnonce()', () => {
    it('returns a string', () => {
      const result = AuthorizationUtils.generateCnonce();
      assert.typeOf(result, 'string');
    });

    it('has only hex characters', () => {
      const result = AuthorizationUtils.generateCnonce();
      assert.match(result, /[a-f0-9]+/);
    });
  });

  describe('generateState()', () => {
    it('returns a 6-characters string', () => {
      const result = AuthorizationUtils.generateState();
      assert.typeOf(result, 'string');
      assert.lengthOf(result, 6);
    });

    it('has alphanumeric characters', () => {
      const result = AuthorizationUtils.generateState();
      assert.match(result, /[a-zA-Z0-9]+/);
    });
  });

  describe('readUrlValue()', () => {
    it('returns empty string when no arguments', () => {
      const result = AuthorizationUtils.readUrlValue();
      assert.equal(result, '');
    });

    it('returns the passed URL when no base URI', () => {
      const result = AuthorizationUtils.readUrlValue('test123');
      assert.equal(result, 'test123');
    });

    it('returns the passed URL not relative', () => {
      const result = AuthorizationUtils.readUrlValue('http://api.com');
      assert.equal(result, 'http://api.com');
    });

    it('appends the base URI', () => {
      const result = AuthorizationUtils.readUrlValue('/path', 'http://api.com');
      assert.equal(result, 'http://api.com/path');
    });

    it('ignores base last path separator', () => {
      const result = AuthorizationUtils.readUrlValue('/path', 'http://api.com/');
      assert.equal(result, 'http://api.com/path');
    });
  });
});
