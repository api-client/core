import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EventTypes } from  '../../src/events/EventTypes.js';
import { Events } from  '../../src/events/Events.js';
import { ensureUnique } from './EventsTestHelpers.js';
import { IHttpRequest, HttpRequest } from '../../src/models/HttpRequest.js';
import { IAppProjectRequestDetail, ICoreRequestDetail, IHttpProjectRequestDetail, IHttpRequestDetail } from '../../src/events/transport/TransportEvents.js';
import { IRequestAuthorization } from '../../src/models/RequestAuthorization.js';
import { IRequestBaseConfig } from '../../src/models/RequestConfig.js';
import { IProjectRunnerOptions } from '../../src/runtime/node/InteropInterfaces.js';

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
        const request: IHttpRequest = new HttpRequest().toJSON();
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.request, spy);
          Events.Transport.Core.request(request);
          window.removeEventListener(EventTypes.Transport.Core.request, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the request on the detail', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.request, spy);
          Events.Transport.Core.request(request);
          window.removeEventListener(EventTypes.Transport.Core.request, spy);
          const e = spy.args[0][0] as CustomEvent<ICoreRequestDetail>;
          assert.equal(e.detail.request, request);
        });
    
        it('has the optional authorization on the detail', () => {
          const auth: IRequestAuthorization[] = [{
            kind: 'Core#RequestAuthorization',
            enabled: true,
            type: 'basic',
            valid: false,
            config: {}
          }];
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.request, spy);
          Events.Transport.Core.request(request, auth);
          window.removeEventListener(EventTypes.Transport.Core.request, spy);
          const e = spy.args[0][0] as CustomEvent<ICoreRequestDetail>;
          assert.equal(e.detail.authorization, auth);
        });
    
        it('has the optional config on the detail', () => {
          const config: IRequestBaseConfig = {
            timeout: 100,
          };
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.request, spy);
          Events.Transport.Core.request(request, undefined, config);
          window.removeEventListener(EventTypes.Transport.Core.request, spy);
          const e = spy.args[0][0] as CustomEvent<ICoreRequestDetail>;
          assert.equal(e.detail.config, config);
        });
      });

      describe('httpProject()', () => {
        const project = 'test-id';
        const options: IProjectRunnerOptions = { parallel: true };
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.httpProject, spy);
          Events.Transport.Core.httpProject(project, options);
          window.removeEventListener(EventTypes.Transport.Core.httpProject, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the project on the detail', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.httpProject, spy);
          Events.Transport.Core.httpProject(project, options);
          window.removeEventListener(EventTypes.Transport.Core.httpProject, spy);
          const e = spy.args[0][0] as CustomEvent<IHttpProjectRequestDetail>;
          assert.equal(e.detail.project, project);
        });
    
        it('has the opts on the detail', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.httpProject, spy);
          Events.Transport.Core.httpProject(project, options);
          window.removeEventListener(EventTypes.Transport.Core.httpProject, spy);
          const e = spy.args[0][0] as CustomEvent<IHttpProjectRequestDetail>;
          assert.equal(e.detail.opts, options);
        });
      });

      describe('appProject()', () => {
        const project = 'test-id';
        const options: IProjectRunnerOptions = { parallel: true };
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.appProject, spy);
          Events.Transport.Core.appProject(project, options);
          window.removeEventListener(EventTypes.Transport.Core.appProject, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the project on the detail', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.appProject, spy);
          Events.Transport.Core.appProject(project, options);
          window.removeEventListener(EventTypes.Transport.Core.appProject, spy);
          const e = spy.args[0][0] as CustomEvent<IAppProjectRequestDetail>;
          assert.equal(e.detail.project, project);
        });
    
        it('has the opts on the detail', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Core.appProject, spy);
          Events.Transport.Core.appProject(project, options);
          window.removeEventListener(EventTypes.Transport.Core.appProject, spy);
          const e = spy.args[0][0] as CustomEvent<IAppProjectRequestDetail>;
          assert.equal(e.detail.opts, options);
        });
      });
    });

    describe('Events.Transport.Http', () => {
      describe('send()', () => {
        const request: IHttpRequest = new HttpRequest().toJSON();
        const init: RequestInit = { method: 'POST' };
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Http.send, spy);
          Events.Transport.Http.send(request);
          window.removeEventListener(EventTypes.Transport.Http.send, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the request on the detail', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Http.send, spy);
          Events.Transport.Http.send(request);
          window.removeEventListener(EventTypes.Transport.Http.send, spy);
          const e = spy.args[0][0] as CustomEvent<ICoreRequestDetail>;
          assert.equal(e.detail.request, request);
        });
    
        it('has the optional init on the detail', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Transport.Http.send, spy);
          Events.Transport.Http.send(request, init);
          window.removeEventListener(EventTypes.Transport.Http.send, spy);
          const e = spy.args[0][0] as CustomEvent<IHttpRequestDetail>;
          assert.deepEqual(e.detail.init, init);
        });
      });
    });
  });
});
