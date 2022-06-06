/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { HttpCookie, IHttpCookie } from '../../src/models/HttpCookie.js';
import { ARCCookie as LegacyARCCookie } from '../../src/models/legacy/models/Cookies.js';

describe('Models', () => {
  describe('HttpCookie', () => {
    describe('HttpCookie.fromLegacy()', () => {
      let schema: LegacyARCCookie;
      beforeEach(() => {
        schema = {
          name: 'a',
          value: 'b',
          domain: 'c',
          path: 'd',
        };
      });

      it('sets the name', () => {
        const result = HttpCookie.fromLegacy(schema);
        assert.equal(result.name, schema.name);
      });

      it('sets the value', () => {
        const result = HttpCookie.fromLegacy(schema);
        assert.equal(result.value, schema.value);
      });

      it('sets the value when missing', () => {
        delete schema.value;
        const result = HttpCookie.fromLegacy(schema);
        assert.equal(result.value, '');
      });

      it('sets the domain', () => {
        const result = HttpCookie.fromLegacy(schema);
        assert.equal(result.domain, schema.domain);
      });

      it('does not set the domain when missing', () => {
        delete schema.domain;
        const result = HttpCookie.fromLegacy(schema);
        assert.isUndefined(result.domain);
      });

      it('sets the path', () => {
        const result = HttpCookie.fromLegacy(schema);
        assert.equal(result.path, schema.path);
      });

      it('does not set the path when missing', () => {
        delete schema.path;
        const result = HttpCookie.fromLegacy(schema);
        assert.isUndefined(result.path);
      });

      it('sets the expirationDate', () => {
        schema.expires = 123456;
        const result = HttpCookie.fromLegacy(schema);
        assert.equal(result.expirationDate, schema.expires);
      });

      it('does not set the expirationDate when missing', () => {
        const result = HttpCookie.fromLegacy(schema);
        assert.isUndefined(result.expirationDate);
      });

      it('sets the hostOnly', () => {
        schema.hostOnly = false;
        const result = HttpCookie.fromLegacy(schema);
        assert.isFalse(result.hostOnly);
      });

      it('does not set the hostOnly when missing', () => {
        const result = HttpCookie.fromLegacy(schema);
        assert.isUndefined(result.hostOnly);
      });

      it('sets the httpOnly', () => {
        schema.httpOnly = false;
        const result = HttpCookie.fromLegacy(schema);
        assert.isFalse(result.httpOnly);
      });

      it('does not set the httpOnly when missing', () => {
        const result = HttpCookie.fromLegacy(schema);
        assert.isUndefined(result.httpOnly);
      });

      it('sets the secure', () => {
        schema.secure = false;
        const result = HttpCookie.fromLegacy(schema);
        assert.isFalse(result.secure);
      });

      it('does not set the secure when missing', () => {
        const result = HttpCookie.fromLegacy(schema);
        assert.isUndefined(result.secure);
      });

      it('sets the session', () => {
        schema.session = true;
        const result = HttpCookie.fromLegacy(schema);
        assert.isTrue(result.session);
      });

      it('set the session when not expires', () => {
        const result = HttpCookie.fromLegacy(schema);
        assert.isTrue(result.session);
      });

      it('set the session when expires', () => {
        const result = HttpCookie.fromLegacy({ ...schema, expires: 1234, });
        assert.isFalse(result.session);
      });
    });

    describe('constructor()', () => {
      const invalid = `test${String.fromCharCode(0x1f)}`;
      let schema: IHttpCookie;
      beforeEach(() => {
        schema = {
          name: 'a',
          value: 'b',
          sameSite: 'strict',
        };
      });

      it('sets the name', () => {
        const result = new HttpCookie(schema);
        assert.equal(result.name, schema.name);
      });

      it('sets the default name when missing', () => {
        delete schema.name;
        const result = new HttpCookie(schema);
        assert.equal(result.name, '');
      });

      it('sets the value', () => {
        const result = new HttpCookie(schema);
        assert.equal(result.value, schema.value);
      });

      it('sets the default value when missing', () => {
        delete schema.value;
        const result = new HttpCookie(schema);
        assert.equal(result.value, '');
      });

      it('sets the domain', () => {
        schema.domain = 'dot.com';
        const result = new HttpCookie(schema);
        assert.equal(result.domain, schema.domain);
      });

      it('does not set the domain when missing', () => {
        const result = new HttpCookie(schema);
        assert.isUndefined(result.domain);
      });

      it('sets the path', () => {
        schema.domain = '/abc';
        const result = new HttpCookie(schema);
        assert.equal(result.path, schema.path);
      });

      it('does not set the path when missing', () => {
        const result = new HttpCookie(schema);
        assert.isUndefined(result.path);
      });

      it('sets the expirationDate', () => {
        schema.expirationDate = 123456;
        const result = new HttpCookie(schema);
        assert.equal(result.expirationDate, schema.expirationDate);
      });

      it('does not set the expirationDate when missing', () => {
        const result = new HttpCookie(schema);
        assert.isUndefined(result.expirationDate);
      });

      it('sets the expirationDate from string number', () => {
        const cookie = new HttpCookie();
        cookie.expirationDate = '123456';
        assert.equal(cookie.expirationDate, 123456);
      });

      it('sets the hostOnly', () => {
        schema.hostOnly = false;
        const result = new HttpCookie(schema);
        assert.isFalse(result.hostOnly);
      });

      it('does not set the hostOnly when missing', () => {
        const result = new HttpCookie(schema);
        assert.isUndefined(result.hostOnly);
      });

      it('sets the httpOnly', () => {
        schema.httpOnly = false;
        const result = new HttpCookie(schema);
        assert.isFalse(result.httpOnly);
      });

      it('does not set the httpOnly when missing', () => {
        const result = new HttpCookie(schema);
        assert.isUndefined(result.httpOnly);
      });

      it('sets the secure', () => {
        schema.secure = false;
        const result = new HttpCookie(schema);
        assert.isFalse(result.secure);
      });

      it('does not set the secure when missing', () => {
        const result = new HttpCookie(schema);
        assert.isUndefined(result.secure);
      });

      it('sets the session', () => {
        schema.session = true;
        const result = new HttpCookie(schema);
        assert.isTrue(result.session);
      });

      it('sets the default session', () => {
        const result = new HttpCookie(schema);
        assert.isTrue(result.session);
      });

      it('creates the default values when no argument', () => {
        const result = new HttpCookie();
        assert.equal(result.name, '');
        assert.equal(result.value, '');
        assert.equal(result.sameSite, 'unspecified');
        assert.isUndefined(result.domain);
        assert.isUndefined(result.path);
        assert.isUndefined(result.expirationDate);
        assert.isUndefined(result.hostOnly);
        assert.isUndefined(result.httpOnly);
        assert.isUndefined(result.secure);
        assert.isTrue(result.session);
      });

      it('creates the cookie from the schema', () => {
        const result = new HttpCookie(JSON.stringify(schema));
        assert.equal(result.name, schema.name);
        assert.equal(result.value, schema.value);
        assert.equal(result.sameSite, schema.sameSite);
        assert.isUndefined(result.domain);
        assert.isUndefined(result.path);
        assert.isUndefined(result.expirationDate);
        assert.isUndefined(result.hostOnly);
        assert.isUndefined(result.httpOnly);
        assert.isUndefined(result.secure);
        assert.isTrue(result.session);
      });

      it('throws an error for invalid name', () => {
        assert.throws(() => {
          new HttpCookie({ name: invalid, value: '', sameSite: 'lax'});
        });
      });
  
      it('throws an error for invalid value', () => {
        assert.throws(() => {
          new HttpCookie({ name: 'test', value: invalid, sameSite: 'lax'});
        });
      });
  
      it('throws an error for invalid path', () => {
        assert.throws(() => {
          new HttpCookie({ name: 'test', value: '', sameSite: 'lax', path: invalid});
        });
      });
  
      it('throws an error for invalid domain', () => {
        assert.throws(() => {
          new HttpCookie({ name: 'test', value: '', sameSite: 'lax', domain: invalid});
        });
      });
    });

    describe('#maxAge', () => {
      it('sets the expirationDate', () => {
        const instance = new HttpCookie();
        instance.maxAge = 100;
        assert.approximately(instance.expirationDate, Date.now() + 100000, 1000);
      });

      it('sets the cookie persistent', () => {
        const instance = new HttpCookie();
        instance.maxAge = 100;
        assert.isFalse(instance.session);
      });

      it('sets lowest possible expiration date', () => {
        const instance = new HttpCookie();
        instance.maxAge = -100;
        const compare = new Date(-8640000000000000).getTime();
        assert.equal(instance.expirationDate, compare);
      });

      it('sets the expirationDate from the "max-age" property', () => {
        const instance = new HttpCookie();
        instance['max-age'] = 100;
        assert.approximately(instance.expirationDate, Date.now() + 100000, 1000);
      });

      it('ignores non-numeric values', () => {
        const instance = new HttpCookie();
        // @ts-ignore
        instance.maxAge = 'test';
        assert.isUndefined(instance.expirationDate);
      });

      it('sets the expirationDate for maxAge 0', () => {
        const instance = new HttpCookie();
        instance.maxAge = 0;
        assert.isBelow(instance.expirationDate, -1);
      });

      it('sets the expirationDate for maxAge -1', () => {
        const instance = new HttpCookie();
        instance.maxAge = -1;
        assert.isBelow(instance.expirationDate, -1);
      });

      it('sets the expirationDate for maxAge 1', () => {
        const instance = new HttpCookie();
        instance.maxAge = 1;
        assert.isAbove(instance.expirationDate, Date.now());
      });
    });

    describe('#expires', () => {
      it('sets "expirationDate" from timestamp', () => {
        const instance = new HttpCookie();
        const now = Date.now();
        instance.expires = now;
        assert.equal(instance.expirationDate, now);
      });

      it('sets expires from ISO string', () => {
        const instance = new HttpCookie();
        const now = new Date();
        const time = now.getTime();
        instance.expires = now.toISOString();
        assert.equal(instance.expirationDate, time);
      });
    });

    describe('toJSON()', () => {
      let schema: IHttpCookie;
      let instance: HttpCookie;
      beforeEach(() => {
        schema = {
          name: 'a',
          value: 'b',
          sameSite: 'strict',
        };
        instance = new HttpCookie(schema);
      });

      it('serializes the name', () => {
        const result = instance.toJSON();
        assert.equal(result.name, schema.name);
      });

      it('serializes the value', () => {
        const result = instance.toJSON();
        assert.equal(result.value, schema.value);
      });

      it('serializes the sameSite', () => {
        const result = instance.toJSON();
        assert.equal(result.sameSite, schema.sameSite);
      });

      it('serializes the domain', () => {
        instance.domain = 'dot.com';
        const result = instance.toJSON();
        assert.equal(result.domain, instance.domain);
      });

      it('serializes the expirationDate', () => {
        instance.expirationDate = 1234;
        const result = instance.toJSON();
        assert.equal(result.expirationDate, instance.expirationDate);
      });

      it('serializes the hostOnly', () => {
        instance.hostOnly = false;
        const result = instance.toJSON();
        assert.equal(result.hostOnly, instance.hostOnly);
      });

      it('serializes the httpOnly', () => {
        instance.httpOnly = false;
        const result = instance.toJSON();
        assert.equal(result.httpOnly, instance.httpOnly);
      });

      it('serializes the secure', () => {
        instance.secure = false;
        const result = instance.toJSON();
        assert.equal(result.secure, instance.secure);
      });

      it('serializes the session', () => {
        instance.session = false;
        const result = instance.toJSON();
        assert.equal(result.session, instance.session);
      });

      it('serializes the path', () => {
        instance.path = '/abc';
        const result = instance.toJSON();
        assert.equal(result.path, instance.path);
      });
    });

    describe('toString()', () => {
      let instance: HttpCookie;
      beforeEach(() => {
        instance = new HttpCookie({ name: 'test-name', value: 'test-value'});
      });
  
      it('returns cookie header string', () => {
        const result = instance.toString();
        assert.equal(result, 'test-name=test-value');
      });
    });

    describe('toHeader()', () => {
      let instance: HttpCookie;
      const base = 'test-name=test-value';

      beforeEach(() => {
        instance = new HttpCookie({ name: 'test-name', value: 'test-value'});
      });
  
      it('returns the basic cookie header string', () => {
        const result = instance.toHeader();
        assert.equal(result, base);
      });
  
      it('adds the path', () => {
        instance.path = '/api';
        const result = instance.toHeader();
        assert.equal(result, `${base}; path=/api`);
      });
  
      it('adds the domain', () => {
        instance.domain = 'api.com';
        const result = instance.toHeader();
        assert.equal(result, `${base}; domain=api.com`);
      });
  
      it('adds the httpOnly', () => {
        instance.httpOnly = true;
        const result = instance.toHeader();
        assert.equal(result, `${base}; httpOnly=true`);
      });

      it('adds the expires', () => {
        const now = new Date();
        const isoDate = now.toISOString();
        const utcDate = now.toUTCString();
        instance.expires = isoDate;

        const result = instance.toHeader();
        assert.equal(result, `${base}; expires=${utcDate}`);
      });

      it('adds the secure', () => {
        instance.secure = true;

        const result = instance.toHeader();
        assert.equal(result, `${base}; Secure`);
      });

      it('adds the SameSite=Lax', () => {
        instance.sameSite = 'lax';

        const result = instance.toHeader();
        assert.equal(result, `${base}; SameSite=Lax`);
      });

      it('adds the SameSite=None', () => {
        instance.sameSite = 'no_restriction';

        const result = instance.toHeader();
        assert.equal(result, `${base}; SameSite=None`);
      });

      it('adds the SameSite=Strict', () => {
        instance.sameSite = 'strict';

        const result = instance.toHeader();
        assert.equal(result, `${base}; SameSite=Strict; Secure`);
      });
    });
  });
});
