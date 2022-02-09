import { assert } from '@esm-bundle/chai';
import { Cookies } from '../../src/lib/cookies/Cookies.js';

describe('Cookies', () => {
  let httpStr = 'rememberme=1; domain=foo.com;';
  httpStr += ' path=/; ssid=Hy1t5e#oj21.876aak;';
  const baseUrl = 'http://bar.com/';

  describe('constructor()', () => {
    it('sets default cookie value', () => {
      const instance = new Cookies(undefined, baseUrl);
      assert.lengthOf(instance.cookies, 0);
    });

    it('sets cookie http string', () => {
      const instance = new Cookies(httpStr, baseUrl);
      assert.lengthOf(instance.cookies, 2);
    });

    it('sets url', () => {
      const instance = new Cookies(httpStr, baseUrl);
      assert.equal(instance.url, baseUrl);
    });
  });

  describe('get()', () => {
    let instance: Cookies;
    beforeEach(() => {
      instance = new Cookies(httpStr, baseUrl);
    });

    it('returns a cookie by name', () => {
      const c1 = instance.get('rememberme');
      assert.equal(c1.value, '1');
      const c2 = instance.get('ssid');
      assert.equal(c2.value, 'Hy1t5e#oj21.876aak');
    });

    it('returns undefined when no cookie', () => {
      const c1 = instance.get('not-exists');
      assert.notOk(c1);
    });
  });

  describe('set()', () => {
    let instance: Cookies;
    beforeEach(() => {
      instance = new Cookies(httpStr, baseUrl);
    });

    it('adds a new cookie', () => {
      instance.set('x-new', 'value');
      assert.lengthOf(instance.cookies, 3);
    });

    it('updates existing cookie', () => {
      instance.set('rememberme', '0');
      assert.lengthOf(instance.cookies, 2);
      assert.equal(instance.cookies[1].value, '0');
    });
  });

  describe('toString()', () => {
    let instance: Cookies;
    beforeEach(() => {
      instance = new Cookies(httpStr, baseUrl);
    });

    it('returns a string', () => {
      const result = instance.toString();
      assert.typeOf(result, 'string');
    });

    it('has full server header ', () => {
      const result = instance.toString();
      assert.include(
        result,
        'rememberme=1; expires=Sat, 13 Sep 275760 00:00:00 GMT; path=/; domain=foo.com;',
        'has complex cookie'
      );
      assert.include(
        result,
        'ssid=Hy1t5e#oj21.876aak; expires=',
        'has simple cookie'
      );
    });

    it('has client header ', () => {
      const result = instance.toString(true);
      assert.include(result, 'rememberme=1; ssid=Hy1t5e#oj21.876aak');
    });
  });

  describe('filter()', () => {
    const cookies = [
      'a=b; domain=foo.com; path=/;',
      'c=d; domain=foo.com; path=/test/path;',
      'e=f; domain=bar.com; path=/;',
      'g=h; domain=bar.com; path=/test/path;',
      'i=j; domain=sub.bar.com; path=/;',
      'k=l; domain=sub.bar.com; path=/test/path;',
      'm=n;',
    ];

    it('returns empty array when no URL', () => {
      const str = cookies.slice(0, 4).join(' ');
      const instance = new Cookies(str);
      const result = instance.filter();
      assert.deepEqual(result, []);
    });

    it('removes cookies that does not match the domain', () => {
      const str = cookies.slice(0, 4).join(' ');
      const instance = new Cookies(str, 'http://foo.com/');
      instance.filter();
      assert.lengthOf(instance.cookies, 1);
      assert.equal(instance.cookies[0].name, 'a');
    });

    it('returns removed cookies', () => {
      const str = cookies.slice(0, 4).join(' ');
      const instance = new Cookies(str, 'http://foo.com/');
      const result = instance.filter();
      assert.lengthOf(result, 3);
      assert.equal(result[0].name, 'c');
      assert.equal(result[1].name, 'e');
      assert.equal(result[2].name, 'g');
    });

    it('removes cookies when path does not match (sub path)', () => {
      const str = cookies.slice(0, 2).join(' ');
      const instance = new Cookies(str, 'http://foo.com/');
      const result = instance.filter();
      assert.lengthOf(result, 1);
      assert.equal(result[0].name, 'c');
    });

    it('keeps cookies for the parent path', () => {
      const str = cookies.slice(0, 2).join(' ');
      const instance = new Cookies(str, 'http://foo.com/test/path/');
      const result = instance.filter();
      assert.lengthOf(result, 0);
      assert.lengthOf(instance.cookies, 2);
    });

    it('removes cookies for different path', () => {
      const str = cookies.slice(0, 2).join(' ');
      const instance = new Cookies(str, 'http://foo.com/other/');
      const result = instance.filter();
      assert.lengthOf(result, 1);
      assert.lengthOf(instance.cookies, 1);
      assert.equal(result[0].name, 'c');
    });

    it('includes the trailing slash', () => {
      const str = cookies.slice(0, 2).join(' ');
      const instance = new Cookies(str, 'http://foo.com/other');
      const result = instance.filter();
      assert.lengthOf(result, 1);
      assert.lengthOf(instance.cookies, 1);
      assert.equal(result[0].name, 'c');
    });

    it('removes parent domain cookies', () => {
      const str = cookies.slice(0, 2).join(' ');
      const instance = new Cookies(str, 'http://sub.foo.com/');
      const result = instance.filter();
      assert.lengthOf(result, 2);
      assert.lengthOf(instance.cookies, 0);
    });

    it('keeps sub domain cookies', () => {
      const str = cookies.slice(4, 6).join(' ');
      const instance = new Cookies(str, 'http://sub.bar.com/');
      const result = instance.filter();
      assert.lengthOf(result, 1);
      assert.equal(result[0].name, 'k');
      assert.lengthOf(instance.cookies, 1);
    });

    it('add cookie path if missing', () => {
      const instance = new Cookies(cookies[6], 'http://bar.com/');
      instance.cookies[0].path = '';
      const result = instance.filter();
      assert.lengthOf(result, 0);
      assert.equal(instance.cookies[0].path, '/');
    });

    it('add cookie domain if missing', () => {
      const instance = new Cookies(cookies[6], 'http://bar.com/');
      instance.cookies[0].domain = '';
      const result = instance.filter();
      assert.lengthOf(result, 0);
      assert.equal(instance.cookies[0].domain, 'bar.com');
    });

    it('sets hostOnly if domain missing', () => {
      const instance = new Cookies(cookies[6], 'http://bar.com/');
      instance.cookies[0].domain = '';
      instance.cookies[0].hostOnly = false;
      const result = instance.filter();
      assert.lengthOf(result, 0);
      assert.isTrue(instance.cookies[0].hostOnly);
    });
  });

  describe('complex cookies', () => {
    it('parses several simple cookies', () => {
      const header = 'c1=v1,c2=v2,c3=v3';
      const parser = new Cookies(header);
      assert.lengthOf(parser.cookies, 3, 'has 3 cookies');

      const [c1, c2, c3] = parser.cookies;

      assert.equal(c1.name, 'c1', 'c1 name');
      assert.equal(c1.value, 'v1', 'c1 value');
      assert.typeOf(c1.created, 'number', 'c1 created');
      assert.typeOf(c1.lastAccess, 'number', 'c1 lastAccess');
      assert.typeOf(c1.expires, 'number', 'c1 expires');
      assert.isFalse(c1.persistent, 'c1 persistent');
      assert.isFalse(c1.hostOnly, 'c1 hostOnly');
      assert.isUndefined(c1.httpOnly, 'c1 httpOnly');
      assert.isUndefined(c1.path, 'c1 path');
      assert.isUndefined(c1.domain, 'c1 domain');
      assert.isUndefined(c1.maxAge, 'c1 maxAge');
      assert.isUndefined(c1.secure, 'c1 secure');

      assert.equal(c2.name, 'c2', 'c2 name');
      assert.equal(c2.value, 'v2', 'c2 value');
      assert.typeOf(c2.created, 'number', 'c2 created');
      assert.typeOf(c2.lastAccess, 'number', 'c2 lastAccess');
      assert.typeOf(c2.expires, 'number', 'c2 expires');
      assert.isFalse(c2.persistent, 'c2 persistent');
      assert.isFalse(c2.hostOnly, 'c2 hostOnly');
      assert.isUndefined(c2.httpOnly, 'c2 httpOnly');
      assert.isUndefined(c2.path, 'c2 path');
      assert.isUndefined(c2.domain, 'c2 domain');
      assert.isUndefined(c2.maxAge, 'c2 maxAge');
      assert.isUndefined(c2.secure, 'c2 secure');

      assert.equal(c3.name, 'c3', 'c3 name');
      assert.equal(c3.value, 'v3', 'c3 value');
      assert.typeOf(c3.created, 'number', 'c3 created');
      assert.typeOf(c3.lastAccess, 'number', 'c3 lastAccess');
      assert.typeOf(c3.expires, 'number', 'c3 expires');
      assert.isFalse(c3.persistent, 'c3 persistent');
      assert.isFalse(c3.hostOnly, 'c3 hostOnly');
      assert.isUndefined(c3.secure, 'c3 secure');
      assert.isUndefined(c3.httpOnly, 'c3 httpOnly');
      assert.isUndefined(c3.path, 'c3 path');
      assert.isUndefined(c3.domain, 'c3 domain');
      assert.isUndefined(c3.maxAge, 'c3 maxAge');
    });
    
    it('parses several cookies with attributes', () => {
      const header = 'c1=v1; Path=/; HttpOnly,c2=v2; Path=/,c3=v3; Path=/abc; Secure; HostOnly; SameSite=Strict';
      const parser = new Cookies(header);
      assert.lengthOf(parser.cookies, 3, 'has 3 cookies');

      const [c1, c2, c3] = parser.cookies;

      assert.equal(c1.name, 'c1', 'c1 name');
      assert.equal(c1.value, 'v1', 'c1 value');
      assert.typeOf(c1.created, 'number', 'c1 created');
      assert.typeOf(c1.lastAccess, 'number', 'c1 lastAccess');
      assert.typeOf(c1.expires, 'number', 'c1 expires');
      assert.isFalse(c1.persistent, 'c1 persistent');
      assert.isFalse(c1.hostOnly, 'c1 hostOnly');
      assert.isTrue(c1.httpOnly, 'c1 httpOnly');
      assert.equal(c1.path, '/', 'c1 path');
      assert.isUndefined(c1.domain, 'c1 domain');
      assert.isUndefined(c1.maxAge, 'c1 maxAge');
      assert.isUndefined(c1.secure, 'c1 secure');

      assert.equal(c2.name, 'c2', 'c2 name');
      assert.equal(c2.value, 'v2', 'c2 value');
      assert.typeOf(c2.created, 'number', 'c2 created');
      assert.typeOf(c2.lastAccess, 'number', 'c2 lastAccess');
      assert.typeOf(c2.expires, 'number', 'c2 expires');
      assert.isFalse(c2.persistent, 'c2 persistent');
      assert.isFalse(c2.hostOnly, 'c2 hostOnly');
      assert.isUndefined(c2.httpOnly, 'c2 httpOnly');
      assert.equal(c2.path, '/', 'c2 path');
      assert.isUndefined(c2.domain, 'c2 domain');
      assert.isUndefined(c2.maxAge, 'c2 maxAge');
      assert.isUndefined(c2.secure, 'c2 secure');

      assert.equal(c3.name, 'c3', 'c3 name');
      assert.equal(c3.value, 'v3', 'c3 value');
      assert.typeOf(c3.created, 'number', 'c3 created');
      assert.typeOf(c3.lastAccess, 'number', 'c3 lastAccess');
      assert.typeOf(c3.expires, 'number', 'c3 expires');
      assert.isFalse(c3.persistent, 'c3 persistent');
      assert.isTrue(c3.hostOnly, 'c3 hostOnly');
      assert.isTrue(c3.secure, 'c3 secure');
      assert.isUndefined(c3.httpOnly, 'c3 httpOnly');
      assert.equal(c3.path, '/abc', 'c3 path');
      assert.isUndefined(c3.domain, 'c3 domain');
      assert.isUndefined(c3.maxAge, 'c3 maxAge');
    });
    
    it('parses several cookies with attributes and expires', () => {
      const header = 'c1=v1; Path=/; Expires=Wed, 09 Feb 2022 01:30:04 GMT; HttpOnly,c2=v2; Path=/,c3=v3; Path=/; Secure; SameSite=Strict';
      const parser = new Cookies(header);
      assert.lengthOf(parser.cookies, 3, 'has 3 cookies');

      const [c1, c2, c3] = parser.cookies;

      assert.equal(c1.name, 'c1', 'c1 name');
      assert.equal(c1.value, 'v1', 'c1 value');
      assert.typeOf(c1.created, 'number', 'c1 created');
      assert.typeOf(c1.lastAccess, 'number', 'c1 lastAccess');
      assert.equal(c1.expires, 1644370204000, 'c1 expires');
      assert.isTrue(c1.persistent, 'c1 persistent');
      assert.isFalse(c1.hostOnly, 'c1 hostOnly');
      assert.isTrue(c1.httpOnly, 'c1 httpOnly');
      assert.equal(c1.path, '/', 'c1 path');
      assert.isUndefined(c1.domain, 'c1 domain');
      assert.isUndefined(c1.maxAge, 'c1 maxAge');
      assert.isUndefined(c1.secure, 'c1 secure');

      assert.equal(c2.name, 'c2', 'c2 name');
      assert.equal(c2.value, 'v2', 'c2 value');
      assert.typeOf(c2.created, 'number', 'c2 created');
      assert.typeOf(c2.lastAccess, 'number', 'c2 lastAccess');
      assert.typeOf(c2.expires, 'number', 'c2 expires');
      assert.isFalse(c2.persistent, 'c2 persistent');
      assert.isFalse(c2.hostOnly, 'c2 hostOnly');
      assert.isUndefined(c2.httpOnly, 'c2 httpOnly');
      assert.equal(c2.path, '/', 'c2 path');
      assert.isUndefined(c2.domain, 'c2 domain');
      assert.isUndefined(c2.maxAge, 'c2 maxAge');
      assert.isUndefined(c2.secure, 'c2 secure');

      assert.equal(c3.name, 'c3', 'c3 name');
      assert.equal(c3.value, 'v3', 'c3 value');
      assert.typeOf(c3.created, 'number', 'c3 created');
      assert.typeOf(c3.lastAccess, 'number', 'c3 lastAccess');
      assert.typeOf(c3.expires, 'number', 'c3 expires');
      assert.isFalse(c3.persistent, 'c3 persistent');
      assert.isFalse(c3.hostOnly, 'c3 hostOnly');
      assert.isTrue(c3.secure, 'c3 secure');
      assert.isUndefined(c3.httpOnly, 'c3 httpOnly');
      assert.equal(c3.path, '/', 'c3 path');
      assert.isUndefined(c3.domain, 'c3 domain');
      assert.isUndefined(c3.maxAge, 'c3 maxAge');
    });
  });
});
