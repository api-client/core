import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EventTypes } from  '../../src/events/EventTypes.js';
import { Events } from  '../../src/events/Events.js';
import { ensureUnique } from './EventsTestHelpers.js';
import { IHttpRequest, HttpRequest, Kind as HttpRequestKind } from '../../src/models/HttpRequest.js';
import { Kind as HttpProjectKind } from "../../src/models/HttpProject.js";
import { AppProjectKind } from "../../src/models/AppProject.js";
import { IHttpRequestDetail } from '../../src/events/transport/TransportEvents.js';
import { IRequestProxyInit } from '../../src/proxy/RequestProxy.js';
import { ContextEventDetailWithResult } from '../../src/events/BaseEvents.js';
import { IHttpProjectProxyInit } from '../../src/proxy/HttpProjectProxy.js';
import { IAppProjectProxyInit } from '../../src/proxy/AppProjectProxy.js';

describe('Events', () => {
  describe('Transport', () => {
    describe('EventTypes.Transport.Core', () => {
      [
        ['request', 'transportcorerequest'],
        ['httpProject', 'transportcorehttpproject'],
        ['appProject', 'transportcoreappproject'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Transport.Core[prop], value);
        });
      });
  
      it('has unique events for the namespace', () => {
        ensureUnique('EventTypes.Transport.Core', EventTypes.Transport.Core);
      });
    });

    describe('EventTypes.Transport.Http', () => {
      [
        ['send', 'httptransportsend'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Transport.Http[prop], value);
        });
      });
  
      it('has unique events for the namespace', () => {
        ensureUnique('EventTypes.Transport.Http', EventTypes.Transport.Http);
      });
    });

    describe('EventTypes.Transport.Ws', () => {
      [
        ['connect', 'wstransportconnect'],
        ['disconnect', 'wstransportdisconnect'],
        ['send', 'wstransportsend'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Transport.Ws[prop], value);
        });
      });
  
      it('has unique events for the namespace', () => {
        ensureUnique('EventTypes.Transport.Ws', EventTypes.Transport.Ws);
      });
    });

    describe('Events.Transport.Core', () => {
      describe('request()', () => {
        const init: IRequestProxyInit = {
          kind: HttpRequestKind,
          request: new HttpRequest().toJSON(),
        };
    
        it('dispatches the event', async () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.request, spy);
          await Events.Transport.Core.request(init);
          window.removeEventListener(EventTypes.Transport.Core.request, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the detail object', async () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.request, spy);
          await Events.Transport.Core.request(init);
          window.removeEventListener(EventTypes.Transport.Core.request, spy);
          const e = spy.args[0][0] as CustomEvent<ContextEventDetailWithResult<IRequestProxyInit>>;
          assert.deepEqual(e.detail, { ...init, result: undefined });
        });
      });

      describe('httpProject()', () => {
        const init: IHttpProjectProxyInit = {
          kind: HttpProjectKind,
          pid: 'test-id',
          options: { parallel: true }
        };
    
        it('dispatches the event', async () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.httpProject, spy);
          await Events.Transport.Core.httpProject(init);
          window.removeEventListener(EventTypes.Transport.Core.httpProject, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the detail object', async () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.httpProject, spy);
          await Events.Transport.Core.httpProject(init);
          window.removeEventListener(EventTypes.Transport.Core.httpProject, spy);
          const e = spy.args[0][0] as CustomEvent<ContextEventDetailWithResult<IHttpProjectProxyInit>>;
          assert.deepEqual(e.detail, { ...init, result: undefined });
        });
      });

      describe('appProject()', () => {
        const init: IAppProjectProxyInit = {
          kind: AppProjectKind,
          pid: 'test-id',
          options: { parallel: true },
          appId: 'xyz',
        };

        it('dispatches the event', async () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.appProject, spy);
          await Events.Transport.Core.appProject(init);
          window.removeEventListener(EventTypes.Transport.Core.appProject, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the detail object', async () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.appProject, spy);
          await Events.Transport.Core.appProject(init);
          window.removeEventListener(EventTypes.Transport.Core.appProject, spy);
          const e = spy.args[0][0] as CustomEvent<ContextEventDetailWithResult<IAppProjectProxyInit>>;
          assert.deepEqual(e.detail, { ...init, result: undefined });
        });
      });
    });

    describe('Events.Transport.Http', () => {
      describe('send()', () => {
        const request: IHttpRequest = new HttpRequest().toJSON();
        const init: RequestInit = { method: 'POST' };
    
        it('dispatches the event', async () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Http.send, spy);
          await Events.Transport.Http.send(request);
          window.removeEventListener(EventTypes.Transport.Http.send, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the request on the detail', async () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Http.send, spy);
          await Events.Transport.Http.send(request);
          window.removeEventListener(EventTypes.Transport.Http.send, spy);
          const e = spy.args[0][0] as CustomEvent<IHttpRequestDetail>;
          assert.equal(e.detail.request, request);
        });
    
        it('has the optional init on the detail', async () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Http.send, spy);
          await Events.Transport.Http.send(request, init);
          window.removeEventListener(EventTypes.Transport.Http.send, spy);
          const e = spy.args[0][0] as CustomEvent<IHttpRequestDetail>;
          assert.deepEqual(e.detail.init, init);
        });
      });
    });
  });
});
