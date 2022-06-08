import { assert } from '@esm-bundle/chai';
import { CookieParser } from '../../src/cookies/CookieParser.js';

describe('cookies', () => {
  describe('CookieParser', () => {
    describe('#filterCookies()', () => {
      const cookies = [
        'a=b; domain=foo.com; path=/;',
        'c=d; domain=foo.com; path=/test/path;',
        'e=f; domain=bar.com; path=/;',
        'g=h; domain=bar.com; path=/test/path;',
        'i=j; domain=sub.bar.com; path=/;',
        'k=l; domain=sub.bar.com; path=/test/path;',
        'm=n;',
      ];
  
      it('removes cookies that does not match the domain', () => {
        const str = cookies.slice(0, 4).join(' ');
        const list = CookieParser.parse('http://foo.com/', str);
        assert.lengthOf(list, 1);
        assert.equal(list[0].name, 'a');
      });
  
      it('removes cookies when path does not match (sub path)', () => {
        const str = cookies.slice(0, 2).join(' ');
        const list = CookieParser.parse('http://foo.com/', str);
        assert.lengthOf(list, 1);
        assert.equal(list[0].name, 'a');
      });
  
      it('keeps cookies for the parent path', () => {
        const str = cookies.slice(0, 2).join(' ');
        const list = CookieParser.parse('http://foo.com/test/path/', str);
        assert.lengthOf(list, 2);
      });
  
      it('removes cookies for different path', () => {
        const str = cookies.slice(0, 2).join(' ');
        const list = CookieParser.parse('http://foo.com/other/', str);
        assert.lengthOf(list, 1);
      });
  
      it('includes the trailing slash', () => {
        const str = cookies.slice(0, 2).join(' ');
        const list = CookieParser.parse('http://foo.com/other', str);
        assert.lengthOf(list, 1);
      });
  
      it('does not remove parent domain cookies', () => {
        const str = cookies.slice(0, 2).join(' ');
        // a=b; domain=foo.com; path=/; c=d; domain=foo.com; path=/test/path;
        const list = CookieParser.parse('http://sub.foo.com/', str);
        assert.lengthOf(list, 1);
        assert.equal(list[0].name, 'a');
      });
  
      it('keeps sub domain cookies', () => {
        const str = cookies.slice(4, 6).join(' ');
        const list = CookieParser.parse('http://sub.bar.com/', str);
        assert.lengthOf(list, 1);
      });
  
      it('add cookie path when missing', () => {
        const list = CookieParser.parse('http://bar.com/', cookies[6]);
        assert.equal(list[0].path, '/');
      });
  
      it('sets hostOnly if domain missing', () => {
        const list = CookieParser.parse('http://bar.com/', cookies[6]);
        assert.isTrue(list[0].hostOnly);
      });
    });

    describe('complex cookies', () => {
      it('parses several simple cookies', () => {
        const header = 'c1=v1,c2=v2,c3=v3';
        const list = CookieParser.parse('http://api.com/', header);
        assert.lengthOf(list, 3, 'has 3 cookies');
  
        const [c1, c2, c3] = list;
  
        assert.equal(c1.name, 'c1', 'c1 name');
        assert.equal(c1.value, 'v1', 'c1 value');
        assert.isUndefined(c1.expirationDate, 'c1 expirationDate');
        assert.isTrue(c1.session, 'c1 session');
        assert.isTrue(c1.hostOnly, 'c1 hostOnly');
        assert.isUndefined(c1.httpOnly, 'c1 httpOnly');
        assert.equal(c1.path, '/', 'c1 path');
        assert.equal(c1.domain, 'api.com', 'c1 domain');
        assert.isUndefined(c1.maxAge, 'c1 maxAge');
        assert.isUndefined(c1.secure, 'c1 secure');
  
        assert.equal(c2.name, 'c2', 'c2 name');
        assert.equal(c2.value, 'v2', 'c2 value');
        assert.isUndefined(c2.expirationDate, 'c2 expirationDate');
        assert.isTrue(c2.session, 'c2 session');
        assert.isTrue(c2.hostOnly, 'c2 hostOnly');
        assert.isUndefined(c2.httpOnly, 'c2 httpOnly');
        assert.equal(c2.path, '/', 'c2 path');
        assert.equal(c2.domain, 'api.com', 'c2 domain');
        assert.isUndefined(c2.maxAge, 'c2 maxAge');
        assert.isUndefined(c2.secure, 'c2 secure');
  
        assert.equal(c3.name, 'c3', 'c3 name');
        assert.equal(c3.value, 'v3', 'c3 value');
        assert.isUndefined(c3.expirationDate, 'c3 expirationDate');
        assert.isTrue(c3.session, 'c3 session');
        assert.isTrue(c3.hostOnly, 'c3 hostOnly');
        assert.isUndefined(c3.secure, 'c3 secure');
        assert.isUndefined(c3.httpOnly, 'c3 httpOnly');
        assert.equal(c3.path, '/', 'c3 path');
        assert.equal(c3.domain, 'api.com', 'c3 domain');
        assert.isUndefined(c3.maxAge, 'c3 maxAge');
      });
      
      it('parses several cookies with attributes', () => {
        const header = 'c1=v1; Path=/; HttpOnly,c2=v2; Path=/,c3=v3; Path=/abc; Secure; HostOnly; SameSite=Strict';
        const list = CookieParser.parse('http://api.com/abc/', header);
        assert.lengthOf(list, 3, 'has 3 cookies');
  
        const [c1, c2, c3] = list;
  
        assert.equal(c1.name, 'c1', 'c1 name');
        assert.equal(c1.value, 'v1', 'c1 value');
        assert.isUndefined(c1.expirationDate, 'c1 expirationDate');
        assert.isTrue(c1.session, 'c1 session');
        assert.isTrue(c1.hostOnly, 'c1 hostOnly');
        assert.isTrue(c1.httpOnly, 'c1 httpOnly');
        assert.equal(c1.path, '/', 'c1 path');
        assert.equal(c1.domain, 'api.com', 'c1 domain');
        assert.isUndefined(c1.maxAge, 'c1 maxAge');
        assert.isUndefined(c1.secure, 'c1 secure');
  
        assert.equal(c2.name, 'c2', 'c2 name');
        assert.equal(c2.value, 'v2', 'c2 value');
        assert.isUndefined(c2.expirationDate, 'c2 expirationDate');
        assert.isTrue(c2.session, 'c2 session');
        assert.isTrue(c2.hostOnly, 'c2 hostOnly');
        assert.isUndefined(c2.httpOnly, 'c2 httpOnly');
        assert.equal(c2.path, '/', 'c2 path');
        assert.equal(c2.domain, 'api.com', 'c2 domain');
        assert.isUndefined(c2.maxAge, 'c2 maxAge');
        assert.isUndefined(c2.secure, 'c2 secure');
  
        assert.equal(c3.name, 'c3', 'c3 name');
        assert.equal(c3.value, 'v3', 'c3 value');
        assert.isUndefined(c3.expirationDate, 'c3 expirationDate');
        assert.isTrue(c3.session, 'c3 session');
        assert.isTrue(c3.hostOnly, 'c3 hostOnly');
        assert.isTrue(c3.secure, 'c3 secure');
        assert.isUndefined(c3.httpOnly, 'c3 httpOnly');
        assert.equal(c3.path, '/abc', 'c3 path');
        assert.equal(c3.domain, 'api.com', 'c3 domain');
        assert.isUndefined(c3.maxAge, 'c3 maxAge');
      });
      
      it('parses several cookies with attributes and expires', () => {
        const header = 'c1=v1; Path=/; Expires=Wed, 09 Feb 2022 01:30:04 GMT; HttpOnly,c2=v2; Path=/,c3=v3; Path=/; Secure; SameSite=Strict';
        const list = CookieParser.parse('http://api.com/', header);
        assert.lengthOf(list, 3, 'has 3 cookies');
  
        const [c1, c2, c3] = list;
  
        assert.equal(c1.name, 'c1', 'c1 name');
        assert.equal(c1.value, 'v1', 'c1 value');
        assert.equal(c1.expirationDate, 1644370204000, 'c1 expirationDate');
        assert.isTrue(c2.session, 'c2 session');
        assert.isTrue(c1.hostOnly, 'c1 hostOnly');
        assert.isTrue(c1.httpOnly, 'c1 httpOnly');
        assert.equal(c1.path, '/', 'c1 path');
        assert.equal(c1.domain, 'api.com', 'c1 domain');
        assert.isUndefined(c1.maxAge, 'c1 maxAge');
        assert.isUndefined(c1.secure, 'c1 secure');
  
        assert.equal(c2.name, 'c2', 'c2 name');
        assert.equal(c2.value, 'v2', 'c2 value');
        assert.isUndefined(c2.expirationDate, 'c2 expirationDate');
        assert.isTrue(c2.session, 'c2 session');
        assert.isTrue(c2.hostOnly, 'c2 hostOnly');
        assert.isUndefined(c2.httpOnly, 'c2 httpOnly');
        assert.equal(c2.path, '/', 'c2 path');
        assert.equal(c2.domain, 'api.com', 'c2 domain');
        assert.isUndefined(c2.maxAge, 'c2 maxAge');
        assert.isUndefined(c2.secure, 'c2 secure');
  
        assert.equal(c3.name, 'c3', 'c3 name');
        assert.equal(c3.value, 'v3', 'c3 value');
        assert.isUndefined(c3.expirationDate, 'c3 expirationDate');
        assert.isTrue(c3.session, 'c3 session');
        assert.isTrue(c3.hostOnly, 'c3 hostOnly');
        assert.isTrue(c3.secure, 'c3 secure');
        assert.isUndefined(c3.httpOnly, 'c3 httpOnly');
        assert.equal(c3.path, '/', 'c3 path');
        assert.equal(c3.domain, 'api.com', 'c3 domain');
        assert.isUndefined(c3.maxAge, 'c3 maxAge');
      });
    });

    describe('#parse()', () => {
      let httpStr = 'rememberme=1; domain=foo.com;';
      httpStr += ' path=/; ssid=Hy1t5e#oj21.876aak;';

      it('parses empty string', () => {
        const cookieStr = '';
        const list = CookieParser.parse('http://foo.com/', cookieStr);
        assert.typeOf(list, 'array');
        assert.deepEqual(list, []);
      });
    
      it('parses basic Set-Cookie string', () => {
        const list = CookieParser.parse('http://foo.com/', 'cookie=value');
        assert.typeOf(list, 'array');
        assert.lengthOf(list, 1);
        assert.equal(list[0].name, 'cookie');
        assert.equal(list[0].value, 'value');
      });
    
      it('parses a Set-Cookie string', () => {
        const list = CookieParser.parse('http://foo.com/', httpStr);
        assert.lengthOf(list, 2);
      });
    
      it('should set cookie names', () => {
        const list = CookieParser.parse('http://foo.com/', httpStr);
        assert.equal(list[0].name, 'rememberme');
        assert.equal(list[1].name, 'ssid');
      });
    
      it('should set cookie values', () => {
        const list = CookieParser.parse('http://foo.com/', httpStr);
        assert.equal(list[0].value, '1');
        assert.equal(list[1].value, 'Hy1t5e#oj21.876aak');
      });
    
      it('should set domains and paths', () => {
        const list = CookieParser.parse('http://foo.com/', httpStr);
        const [c1, c2] = list;
        assert.equal(c1.domain, '.foo.com', 'c1 domain');
        assert.equal(c1.path, '/', 'c1 path');
        assert.equal(c2.domain, 'foo.com', 'c2 domain');
        assert.equal(c2.path, '/', 'c2 path');
      });
    
      it('should set expires from max-age', () => {
        const str = 'rememberme=1; domain=foo.com; path=/; max-age=100';
        const list = CookieParser.parse('http://foo.com/', str);
        const future = Date.now() + 100000;
        const [cookie] = list;
        assert.approximately(cookie.expirationDate, future, 100);
        assert.isFalse(cookie.session, 'The session flag is not set to true');
      });

      it('sets the domain and port', () => {
        const str = 'rememberme=1';
        const list = CookieParser.parse('http://localhost:1234/', str);
        const [cookie] = list;
        assert.equal(cookie.domain, 'localhost:1234');
      });
    });

    describe('#matchesDomain()', () => {
      it('matches .example.com with example.com', () => {
        const result = CookieParser.matchesDomain('.example.com', 'www.example.com');
        assert.isTrue(result);
      });

      it('matches .example.com for www.example.com', () => {
        const result = CookieParser.matchesDomain('.example.com', 'www.example.com');
        assert.isTrue(result);
      });

      it('matches .example.com for www.example.com', () => {
        const result = CookieParser.matchesDomain('.example.com', 'example.com');
        assert.isTrue(result);
      });

      it('does not match .example.com for another.com', () => {
        const result = CookieParser.matchesDomain('.example.com', 'another.com');
        assert.isFalse(result);
      });

      it('returns true when domain are the same', () => {
        assert.isTrue(CookieParser.matchesDomain('bar.com', 'bar.com'));
      });
  
      it('returns true when a dot in argument and the url is a subdomain', () => {
        assert.isTrue(CookieParser.matchesDomain('.bar.com', 'test.bar.com'));
      });
    });

    describe('matchesPath()', () => {
      const baseUrl = 'http://bar.com/';
  
      it('returns true when no argument', () => {
        const uri = new URL(baseUrl);
        assert.isTrue(CookieParser.matchesPath('', uri));
      });
  
      it('returns true when paths are the same', () => {
        const uri = new URL(baseUrl);
        assert.isTrue(CookieParser.matchesPath('/', uri));
      });
  
      it('returns true when URL has single separator', () => {
        const url = `${baseUrl}test`;
        const uri = new URL(url);
        assert.isTrue(CookieParser.matchesPath('/', uri));
      });
  
      it('returns true when URL has deep path that is a match', () => {
        const url = `${baseUrl}test/other`;
        const uri = new URL(url);
        assert.isTrue(CookieParser.matchesPath('/', uri));
      });
  
      it('returns false when argument path is different', () => {
        const url = `${baseUrl}test/other`;
        const uri = new URL(url);
        assert.isFalse(CookieParser.matchesPath('/other', uri));
      });
  
      it('returns false when argument path is higher', () => {
        const url = `${baseUrl}other`;
        const uri = new URL(url);
        assert.isFalse(CookieParser.matchesPath('/other/xyz', uri));
      });
    });

    describe('getPath()', () => {
      it('returns default value when no path after separator domain', () => {
        const result = CookieParser.getPath(new URL('https://api.com'));
        assert.equal(result, '/');
      });
  
      it('returns default value when no path after domain', () => {
        const result = CookieParser.getPath(new URL('https://api.com/'));
        assert.equal(result, '/');
      });
  
      it('returns path value', () => {
        const result = CookieParser.getPath(new URL('https://api.com/api/test/ignore'));
        assert.equal(result, '/api/test');
      });
  
      it('ignores the query string', () => {
        const result = CookieParser.getPath(new URL('https://api.com/api/?a=b'));
        assert.equal(result, '/api');
      });
  
      it('ignores the hash part of the url', () => {
        const result = CookieParser.getPath(new URL('https://api.com/api/#access_token=...'));
        assert.equal(result, '/api');
      });
    });
  });
});
