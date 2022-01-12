import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EventTypes } from  '../../src/events/EventTypes.js';
import { Events } from  '../../src/events/Events.js';
import { IHttpCookie } from  '../../src/models/HttpCookie.js';
import { ContextUpdateEvent, ContextUpdateEventDetail, ContextChangeRecord } from '../../src/events/BaseEvents.js';
import { ensureUnique } from './EventsTestHelpers.js';

describe('Events', () => {
  describe('Authorization', () => {
    describe('EventTypes.Authorization', () => {
      it('has the namespace', () => {
        assert.typeOf(EventTypes.Authorization, 'object');
      });
  
      it('has OAuth2 namespace', () => {
        assert.typeOf(EventTypes.Authorization.OAuth2, 'object');
      });
  
      it('has frozen OAuth2 namespace', () => {
        assert.throws(() => {
          // @ts-ignore
          EventTypes.Authorization.OAuth2 = { read: '' };
        });
      });

      [
        ['authorize', 'oauth2authorize'],
        ['removeToken', 'oauth2removetoken'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Authorization.OAuth2[prop], value);
        });
      });
  
      it('has unique events for OAuth2 namespace', () => {
        ensureUnique('EventTypes.Authorization.OAuth2', EventTypes.Authorization.OAuth2);
      });

      it('has frozen Oidc namespace', () => {
        assert.throws(() => {
          // @ts-ignore
          EventTypes.Authorization.Oidc = { read: '' };
        });
      });
  
      [
        ['authorize', 'oidcauthorize'],
        ['removeTokens', 'oidcremovetokens'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Authorization.Oidc[prop], value);
        });
      });
  
      it('has unique events for Oidc namespace', () => {
        ensureUnique('EventTypes.Authorization.Oidc', EventTypes.Authorization.Oidc);
      });
    });

    describe('Events.Authorization', () => {
      describe('OAuth2', () => {
        describe('authorize()', () => {
          const config = { responseType: 'implicit' };
    
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Authorization.OAuth2.authorize, spy);
            Events.Authorization.OAuth2.authorize(document.body, config);
            window.removeEventListener(EventTypes.Authorization.OAuth2.authorize, spy);
            assert.isTrue(spy.calledOnce);
          });
    
          it('has the configuration on the detail', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Authorization.OAuth2.authorize, spy);
            Events.Authorization.OAuth2.authorize(document.body, config);
            window.removeEventListener(EventTypes.Authorization.OAuth2.authorize, spy);
            const e = spy.args[0][0];
            
            const cnf = e.detail;
            delete cnf.result;
            
            assert.deepEqual(cnf, config);
          });
        });
    
        describe('removeToken()', () => {
          const config = { clientId: 'id', authorizationUri: 'test' };
    
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Authorization.OAuth2.removeToken, spy);
            Events.Authorization.OAuth2.removeToken(document.body, config);
            window.removeEventListener(EventTypes.Authorization.OAuth2.removeToken, spy);
            assert.isTrue(spy.calledOnce);
          });
    
          it('has the configuration on the detail', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Authorization.OAuth2.removeToken, spy);
            Events.Authorization.OAuth2.removeToken(document.body, config);
            window.removeEventListener(EventTypes.Authorization.OAuth2.removeToken, spy);
            const e = spy.args[0][0];
            const cnf = e.detail;
            delete cnf.result;
            assert.deepEqual(cnf, config);
          });
        });
      });

      describe('Oidc', () => {
        describe('authorize()', () => {
          const config = { responseType: 'implicit' };
    
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Authorization.Oidc.authorize, spy);
            Events.Authorization.Oidc.authorize(document.body, config);
            window.removeEventListener(EventTypes.Authorization.Oidc.authorize, spy);
            assert.isTrue(spy.calledOnce);
          });
    
          it('has the configuration on the detail', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Authorization.Oidc.authorize, spy);
            Events.Authorization.Oidc.authorize(document.body, config);
            window.removeEventListener(EventTypes.Authorization.Oidc.authorize, spy);
            const e = spy.args[0][0];
            
            const cnf = e.detail;
            delete cnf.result;
            
            assert.deepEqual(cnf, config);
          });
        });
    
        describe('removeToken()', () => {
          const config = { clientId: 'id', authorizationUri: 'test' };
    
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Authorization.Oidc.removeTokens, spy);
            Events.Authorization.Oidc.removeToken(document.body, config);
            window.removeEventListener(EventTypes.Authorization.Oidc.removeTokens, spy);
            assert.isTrue(spy.calledOnce);
          });
    
          it('has the configuration on the detail', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Authorization.Oidc.removeTokens, spy);
            Events.Authorization.Oidc.removeToken(document.body, config);
            window.removeEventListener(EventTypes.Authorization.Oidc.removeTokens, spy);
            const e = spy.args[0][0];
            const cnf = e.detail;
            delete cnf.result;
            assert.deepEqual(cnf, config);
          });
        });
      });
    });
  });
});
