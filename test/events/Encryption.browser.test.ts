import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EventTypes } from  '../../src/events/EventTypes.js';
import { Events } from  '../../src/events/Events.js';
import { IHttpCookie } from  '../../src/models/HttpCookie.js';
import { ContextUpdateEvent, ContextUpdateEventDetail, ContextChangeRecord } from '../../src/events/BaseEvents.js';
import { ensureUnique } from './EventsTestHelpers.js';

describe('Events', () => {
  describe('Encryption', () => {
    describe('EventTypes.Encryption', () => {
      it('has the namespace', () => {
        assert.typeOf(EventTypes.Encryption, 'object');
      });
  
      [
        ['encrypt', 'encryptionencrypt'],
        ['decrypt', 'encryptiondecrypt'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Encryption[prop], value);
        });
      });
  
      it('has unique events for OAuth2 namespace', () => {
        ensureUnique('EventTypes.Encryption', EventTypes.Encryption);
      });
    });

    describe('Events.Encryption', () => {
      describe('encrypt()', () => {
        const data = 'export data';
        const passphrase = 'passphrase data';
        const method = 'aes';
    
        it('dispatches navigation event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Encryption.encrypt, spy);
          Events.Encryption.encrypt(document.body, data, passphrase, method);
          window.removeEventListener(EventTypes.Encryption.encrypt, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the data on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Encryption.encrypt, spy);
          Events.Encryption.encrypt(document.body, data, passphrase, method);
          window.removeEventListener(EventTypes.Encryption.encrypt, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.data, data);
        });
    
        it('has the passphrase on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Encryption.encrypt, spy);
          Events.Encryption.encrypt(document.body, data, passphrase, method);
          window.removeEventListener(EventTypes.Encryption.encrypt, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.passphrase, passphrase);
        });
    
        it('has the method on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Encryption.encrypt, spy);
          Events.Encryption.encrypt(document.body, data, passphrase, method);
          window.removeEventListener(EventTypes.Encryption.encrypt, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.method, method);
        });
      });
    
      describe('decrypt()', () => {
        const data = 'export data';
        const passphrase = 'passphrase data';
        const method = 'aes';
    
        it('dispatches navigation event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Encryption.decrypt, spy);
          Events.Encryption.decrypt(document.body, data, passphrase, method);
          window.removeEventListener(EventTypes.Encryption.decrypt, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the data on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Encryption.decrypt, spy);
          Events.Encryption.decrypt(document.body, data, passphrase, method);
          window.removeEventListener(EventTypes.Encryption.decrypt, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.data, data);
        });
    
        it('has the passphrase on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Encryption.decrypt, spy);
          Events.Encryption.decrypt(document.body, data, passphrase, method);
          window.removeEventListener(EventTypes.Encryption.decrypt, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.passphrase, passphrase);
        });
    
        it('has the method on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Encryption.decrypt, spy);
          Events.Encryption.decrypt(document.body, data, passphrase, method);
          window.removeEventListener(EventTypes.Encryption.decrypt, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.method, method);
        });
      });
    });
  });
});
