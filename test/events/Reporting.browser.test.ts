import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EventTypes } from  '../../src/events/EventTypes.js';
import { Events } from  '../../src/events/Events.js';
import { ensureUnique } from './EventsTestHelpers.js';

describe('Events', () => {
  describe('Reporting', () => {
    describe('EventTypes.Reporting', () => {
      it('has the namespace', () => {
        assert.typeOf(EventTypes.Reporting, 'object');
      });
  
      [
        ['error', 'reporterror'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Reporting[prop], value);
        });
      });
  
      it('has unique events for the namespace', () => {
        ensureUnique('EventTypes.Reporting', EventTypes.Reporting);
      });
    });

    describe('Events.Reporting', () => {
      describe('error()', () => {
        const err = new Error();
        const desc = 'test error';
        const cmp = 'test component';
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Reporting.error, spy);
          Events.Reporting.error(desc);
          window.removeEventListener(EventTypes.Reporting.error, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the description on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Reporting.error, spy);
          Events.Reporting.error(desc);
          window.removeEventListener(EventTypes.Reporting.error, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.description, desc);
        });
    
        it('has the error on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Reporting.error, spy);
          Events.Reporting.error(desc, err);
          window.removeEventListener(EventTypes.Reporting.error, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.error, err);
        });
    
        it('has the component on the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Reporting.error, spy);
          Events.Reporting.error(desc, err, cmp);
          window.removeEventListener(EventTypes.Reporting.error, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.component, cmp);
        });
      });
    });
  });
});
