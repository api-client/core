import { assert } from '@esm-bundle/chai';
import { clearStore, InMemoryCookieJar } from '../../src/cookies/InMemoryCookieJar.js';
import { HttpCookie } from '../../src/models/HttpCookie.js';

describe('cookies', () => {
  describe('InMemoryCookieJar', () => {
    describe('setCookies() listCookies()', () => {
      const url = 'https://api.com/path?query';

      let store: InMemoryCookieJar;
      beforeEach(() => {
        store = new InMemoryCookieJar();
        clearStore();
      });

      it('stores a cookie', async () => {
        const c1 = new HttpCookie({ name: 'c1', value: 'v' });
        await store.setCookies(url, [c1]);
        const stored = await store.listCookies(url);
        assert.lengthOf(stored, 1, 'has 1 cookie');
        assert.equal(stored[0].name, 'c1');
      });

      it('stores multiple cookies', async () => {
        const c1 = new HttpCookie({ name: 'c1', value: 'v' });
        const c2 = new HttpCookie({ name: 'c2', value: 'v' });
        const c3 = new HttpCookie({ name: 'c3', value: 'v' });
        await store.setCookies(url, [c1, c2, c3]);
        const stored = await store.listCookies(url);
        assert.lengthOf(stored, 3, 'has 3 cookies');
      });

      it('overrides existing cookies', async () => {
        const c1 = new HttpCookie({ name: 'c1', value: 'v' });
        await store.setCookies(url, [c1.toJSON()]);
        c1.value = 'other';
        await store.setCookies(url, [c1.toJSON()]);

        const stored = await store.listCookies(url);
        assert.lengthOf(stored, 1, 'has 1 cookie');
        const [r1] = stored;
        assert.equal(r1.value, 'other');
      });

      it('ignores different domains', async () => {
        const c1 = new HttpCookie({ name: 'c1', value: 'v1' });
        const c2 = new HttpCookie({ name: 'c2', value: 'v2' });
        const url2 = 'https://other.com';
        await store.setCookies(url, [c1.toJSON()]);
        await store.setCookies(url2, [c2]);

        const stored1 = await store.listCookies(url);
        assert.lengthOf(stored1, 1, 'has 1 cookie for url 1');

        const stored2 = await store.listCookies(url2);
        assert.lengthOf(stored2, 1, 'has 1 cookie for url 2');
      });

      it('stores and list cookies from a domain with a port', async () => {
        const url1 = 'http://localhost:8000/v1/get';
        const c1 = new HttpCookie({ name: 'c1', value: 'v1' });
        await store.setCookies(url1, [c1]);
        const stored = await store.listCookies(url1);
        assert.lengthOf(stored, 1, 'has 1 cookie');
      });
    });

    describe('deleteCookies()', () => {
      const url1 = 'https://api.com/path?query';
      const url2 = 'https://other.com';

      let store: InMemoryCookieJar;
      beforeEach(() => {
        store = new InMemoryCookieJar();
        clearStore();
      });

      it('deletes all cookies', async () => {
        const c1 = new HttpCookie({ name: 'c1', value: 'v' });
        const c2 = new HttpCookie({ name: 'c2', value: 'v' });
        const c3 = new HttpCookie({ name: 'c3', value: 'v' });
        await store.setCookies(url1, [c1, c2, c3]);
        await store.deleteCookies(url1);
        const stored = await store.listCookies(url1);
        assert.lengthOf(stored, 0, 'has no cookies');
      });

      it('deletes cookies by name', async () => {
        const c1 = new HttpCookie({ name: 'c1', value: 'v' });
        const c2 = new HttpCookie({ name: 'c2', value: 'v' });
        const c3 = new HttpCookie({ name: 'c3', value: 'v' });
        await store.setCookies(url1, [c1, c2, c3]);
        await store.deleteCookies(url1, 'c1');
        const stored = await store.listCookies(url1);
        assert.lengthOf(stored, 2, 'has 2 cookies');
        assert.equal(stored[0].name, 'c2', 'has cookie #2');
        assert.equal(stored[1].name, 'c3', 'has cookie #3');
      });

      it('ignores different domains', async () => {
        const c1 = new HttpCookie({ name: 'c1', value: 'v1' });
        const c2 = new HttpCookie({ name: 'c1', value: 'v2' });
        await store.setCookies(url1, [c1.toJSON()]);
        await store.setCookies(url2, [c2]);

        await store.deleteCookies(url1, 'c1');

        const stored1 = await store.listCookies(url1);
        assert.lengthOf(stored1, 0, 'has 0 cookie for url 1');

        const stored2 = await store.listCookies(url2);
        assert.lengthOf(stored2, 1, 'has 1 cookie for url 2');
      });
    });
  });
});
