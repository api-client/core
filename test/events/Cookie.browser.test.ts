/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EventTypes } from  '../../src/events/EventTypes.js';
import { Events } from  '../../src/events/Events.js';
import { IHttpCookie } from  '../../src/models/HttpCookie.js';
import { ContextUpdateEvent, ContextUpdateEventDetail, ContextChangeRecord } from '../../src/events/BaseEvents.js';
import { ensureUnique } from './EventsTestHelpers.js';

describe('Events', () => {
  describe('Cookie', () => {
    describe('EventTypes.Cookie', () => {
      it('has the namespace', () => {
        assert.typeOf(EventTypes.Cookie, 'object');
      });

      [
        ['listAll', 'sessioncookielistall'],
        ['listDomain', 'sessioncookielistdomain'],
        ['listUrl', 'sessioncookielisturl'],
        ['delete', 'sessioncookiedelete'],
        ['deleteUrl', 'sessioncookiedeleteurl'],
        ['update', 'sessioncookieupdate'],
        ['updateBulk', 'sessioncookieupdatebulk'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Cookie[prop], value);
        });
      });

      it('has State namespace', () => {
        assert.typeOf(EventTypes.Cookie.State, 'object');
      });

      it('has frozen State namespace', () => {
        assert.throws(() => {
          // @ts-ignore
          EventTypes.Cookie.State = { read: '' };
        });
      });

      [
        ['update', 'sessioncookiestateupdate'],
        ['delete', 'sessioncookiestatedelete'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Cookie.State[prop], value);
        });
      });

      it('has unique events for the namespace', () => {
        ensureUnique('EventTypes.Cookie', EventTypes.Cookie);
      });

      it('has unique events for State namespace', () => {
        ensureUnique('EventTypes.Cookie.State', EventTypes.Cookie.State);
      });
    });

    describe('Events.Cookie', () => {
      describe('listAll()', () => {
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.listAll, spy);
          Events.Cookie.listAll(document.body);
          window.removeEventListener(EventTypes.Cookie.listAll, spy);
          assert.isTrue(spy.calledOnce);
        });
      });

      describe('listDomain()', () => {
        const domain = 'dot.com';

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.listDomain, spy);
          Events.Cookie.listDomain(domain);
          window.removeEventListener(EventTypes.Cookie.listDomain, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the domain property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.listDomain, spy);
          Events.Cookie.listDomain(domain);
          window.removeEventListener(EventTypes.Cookie.listDomain, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.domain, domain);
        });
      });

      describe('listUrl()', () => {
        const url = 'https://dot.com/path';

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.listUrl, spy);
          Events.Cookie.listUrl(url);
          window.removeEventListener(EventTypes.Cookie.listUrl, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the url property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.listUrl, spy);
          Events.Cookie.listUrl(url);
          window.removeEventListener(EventTypes.Cookie.listUrl, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.url, url);
        });
      });

      describe('delete()', () => {
        const cookie: IHttpCookie = {
          name: 'a',
          value: 'b',
          sameSite: 'no_restriction',
        };

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.delete, spy);
          Events.Cookie.delete([cookie]);
          window.removeEventListener(EventTypes.Cookie.delete, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the cookies property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.delete, spy);
          Events.Cookie.delete([cookie]);
          window.removeEventListener(EventTypes.Cookie.delete, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.cookies, [cookie]);
        });
      });

      describe('deleteUrl()', () => {
        const url = 'https://dot.com/path';

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.deleteUrl, spy);
          Events.Cookie.deleteUrl(url);
          window.removeEventListener(EventTypes.Cookie.deleteUrl, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the url property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.deleteUrl, spy);
          Events.Cookie.deleteUrl(url);
          window.removeEventListener(EventTypes.Cookie.deleteUrl, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.url, url);
        });

        it('has the optional name property', () => {
          const name = 'test name';
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.deleteUrl, spy);
          Events.Cookie.deleteUrl(url, name);
          window.removeEventListener(EventTypes.Cookie.deleteUrl, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.name, name);
        });
      });

      describe('update()', () => {
        const cookie: IHttpCookie = {
          name: 'a',
          value: 'b',
          sameSite: 'no_restriction',
        };

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.update, spy);
          Events.Cookie.update(cookie);
          window.removeEventListener(EventTypes.Cookie.update, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the detail property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.update, spy);
          Events.Cookie.update(cookie);
          window.removeEventListener(EventTypes.Cookie.update, spy);
          const e = spy.args[0][0] as ContextUpdateEvent<IHttpCookie>;
          const detail = e.detail as ContextUpdateEventDetail<IHttpCookie>;
          assert.deepEqual(detail.item, cookie);
        });
      });

      describe('updateBulk()', () => {
        const cookie: IHttpCookie = {
          name: 'a',
          value: 'b',
          sameSite: 'no_restriction',
        };

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.updateBulk, spy);
          Events.Cookie.updateBulk([cookie]);
          window.removeEventListener(EventTypes.Cookie.updateBulk, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the cookies property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.updateBulk, spy);
          Events.Cookie.updateBulk([cookie]);
          window.removeEventListener(EventTypes.Cookie.updateBulk, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.cookies, [cookie]);
        });
      });

      describe('State.delete()', () => {
        const cookie: IHttpCookie = {
          name: 'a',
          value: 'b',
          sameSite: 'no_restriction',
        };

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.State.delete, spy);
          Events.Cookie.State.delete(cookie);
          window.removeEventListener(EventTypes.Cookie.State.delete, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the cookie property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.State.delete, spy);
          Events.Cookie.State.delete(cookie);
          window.removeEventListener(EventTypes.Cookie.State.delete, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.cookie, cookie);
        });
      });

      describe('State.update()', () => {
        const cookie: IHttpCookie = {
          name: 'a',
          value: 'b',
          sameSite: 'no_restriction',
        };

        const record: ContextChangeRecord<IHttpCookie> = {
          item: cookie,
          key: 'null',
        };

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.State.update, spy);
          Events.Cookie.State.update(record);
          window.removeEventListener(EventTypes.Cookie.State.update, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the change record', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Cookie.State.update, spy);
          Events.Cookie.State.update(record);
          window.removeEventListener(EventTypes.Cookie.State.update, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail, record);
        });
      });
    });
  });
});
