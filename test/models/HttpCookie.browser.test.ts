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
        schema.session = false;
        const result = HttpCookie.fromLegacy(schema);
        assert.isFalse(result.session);
      });

      it('does not set the session when missing', () => {
        const result = HttpCookie.fromLegacy(schema);
        assert.isUndefined(result.session);
      });
    });

    describe('constructor()', () => {
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
        schema.session = false;
        const result = new HttpCookie(schema);
        assert.isFalse(result.session);
      });

      it('does not set the session when missing', () => {
        const result = new HttpCookie(schema);
        assert.isUndefined(result.session);
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
        assert.isUndefined(result.session);
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
        assert.isUndefined(result.session);
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
  });
});
