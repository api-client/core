import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EventTypes } from  '../../src/events/EventTypes.js';
import { Events } from  '../../src/events/Events.js';
import { ensureUnique } from './EventsTestHelpers.js';

describe('Events', () => {
  describe('Process', () => {
    describe('EventTypes.Process', () => {
      it('has the namespace', () => {
        assert.typeOf(EventTypes.Process, 'object');
      });
  
      [
        ['loadingStart', 'processloadingstart'],
        ['loadingStop', 'processloadingstop'],
        ['loadingError', 'processloadingerror'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Process[prop], value);
        });
      });
  
      it('has unique events for the namespace', () => {
        ensureUnique('EventTypes.Process', EventTypes.Process);
      });
    });

    describe('Events.Process', () => {
      describe('loadingstart()', () => {
        const pid = 'process-id-1';
        const message = 'test-message';
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Process.loadingStart, spy);
          Events.Process.loadingStart(pid, message);
          window.removeEventListener(EventTypes.Process.loadingStart, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the pid on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Process.loadingStart, spy);
          Events.Process.loadingStart(pid, message);
          window.removeEventListener(EventTypes.Process.loadingStart, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.pid, pid);
        });
    
        it('has the message on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Process.loadingStart, spy);
          Events.Process.loadingStart(pid, message);
          window.removeEventListener(EventTypes.Process.loadingStart, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.message, message);
        });
      });

      describe('loadingStop()', () => {
        const pid = 'process-id-1';
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Process.loadingStop, spy);
          Events.Process.loadingStop(pid);
          window.removeEventListener(EventTypes.Process.loadingStop, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the pid on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Process.loadingStop, spy);
          Events.Process.loadingStop(pid);
          window.removeEventListener(EventTypes.Process.loadingStop, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.pid, pid);
        });
      });

      describe('loadingError()', () => {
        const pid = 'process-id-1';
        const message = 'test-message';
        const error = new Error('test-message');
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Process.loadingError, spy);
          Events.Process.loadingError(pid, message);
          window.removeEventListener(EventTypes.Process.loadingError, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the pid on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Process.loadingError, spy);
          Events.Process.loadingError(pid, message);
          window.removeEventListener(EventTypes.Process.loadingError, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.pid, pid);
        });
    
        it('has the message on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Process.loadingError, spy);
          Events.Process.loadingError(pid, message);
          window.removeEventListener(EventTypes.Process.loadingError, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.message, message);
        });
    
        it('has the optional error on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Process.loadingError, spy);
          Events.Process.loadingError(pid, message, error);
          window.removeEventListener(EventTypes.Process.loadingError, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.error, error);
        });
      });
      
    });
  });
});
