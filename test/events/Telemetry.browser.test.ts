import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EventTypes } from  '../../src/events/EventTypes.js';
import { Events } from  '../../src/events/Events.js';
import { ensureUnique } from './EventsTestHelpers.js';

describe('Events', () => {
  describe('Telemetry', () => {
    describe('EventTypes.Telemetry', () => {
      it('has the namespace', () => {
        assert.typeOf(EventTypes.Telemetry, 'object');
      });
  
      [
        ['view', 'telemetryscreenview'],
        ['event', 'telemetryevent'],
        ['exception', 'telemetryexception'],
        ['social', 'telemetrysocial'],
        ['timing', 'telemetrytiming'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Telemetry[prop], value);
        });
      });
  
      it('has unique events for the namespace', () => {
        ensureUnique('EventTypes.Telemetry', EventTypes.Telemetry);
      });
    });

    describe('Events.Telemetry', () => {
      describe('view()', () => {
        const screenName = 'test-screen';
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.view, spy);
          Events.Telemetry.view(screenName);
          window.removeEventListener(EventTypes.Telemetry.view, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('the event has screen name on the detail', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.view, spy);
          Events.Telemetry.view(screenName);
          window.removeEventListener(EventTypes.Telemetry.view, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.screenName, screenName);
        });
    
        it('the event has the custom configuration', () => {
          const spy = sinon.spy();
          const custom = {
            customMetrics: [{ index: 1, value: 1 }],
            customDimensions: [{ index: 1, value: 'test' }],
          };
          window.addEventListener(EventTypes.Telemetry.view, spy);
          Events.Telemetry.view(screenName, document.body, custom);
          window.removeEventListener(EventTypes.Telemetry.view, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.customMetrics, custom.customMetrics, 'has customMetrics');
          assert.deepEqual(e.detail.customDimensions, custom.customDimensions, 'has customDimensions');
        });
      });

      describe('event()', () => {
        const init = { 
          category: 'e-cat',
          action: 'e-act',
          label: 'e-label',
          value: 1,
        };
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.event, spy);
          Events.Telemetry.event(init);
          window.removeEventListener(EventTypes.Telemetry.event, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('the event has the detail object', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.event, spy);
          Events.Telemetry.event(init);
          window.removeEventListener(EventTypes.Telemetry.event, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail, init);
        });
      });

      describe('exception()', () => {
        const description = 'event-exception';
        const fatal = true;
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.exception, spy);
          Events.Telemetry.exception(description);
          window.removeEventListener(EventTypes.Telemetry.exception, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('the event has the description', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.exception, spy);
          Events.Telemetry.exception(description);
          window.removeEventListener(EventTypes.Telemetry.exception, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.description, description);
        });

        it('the event has the fatal', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.exception, spy);
          Events.Telemetry.exception(description, fatal);
          window.removeEventListener(EventTypes.Telemetry.exception, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.fatal, fatal);
        });

        it('the event has custom configuration', () => {
          const spy = sinon.spy();
          const custom = {
            customMetrics: [{ index: 1, value: 1 }],
            customDimensions: [{ index: 1, value: 'test' }],
          };
          window.addEventListener(EventTypes.Telemetry.exception, spy);
          Events.Telemetry.exception(description, fatal, document.body, custom);
          window.removeEventListener(EventTypes.Telemetry.exception, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.customMetrics, custom.customMetrics, 'has customMetrics');
          assert.deepEqual(e.detail.customDimensions, custom.customDimensions, 'has customDimensions');
        });
      });

      describe('social()', () => {
        const init = { 
          network: 'e-network',
          action: 'e-action',
          target: 'e-target',
        };
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.social, spy);
          Events.Telemetry.social(init.network, init.action, init.target);
          window.removeEventListener(EventTypes.Telemetry.social, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('the event has the detail object', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.social, spy);
          Events.Telemetry.social(init.network, init.action, init.target);
          window.removeEventListener(EventTypes.Telemetry.social, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail, init);
        });

        it('the event has custom configuration', () => {
          const spy = sinon.spy();
          const custom = {
            customMetrics: [{ index: 1, value: 1 }],
            customDimensions: [{ index: 1, value: 'test' }],
          };
          window.addEventListener(EventTypes.Telemetry.social, spy);
          Events.Telemetry.social(init.network, init.action, init.target, document.body, custom);
          window.removeEventListener(EventTypes.Telemetry.social, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.customMetrics, custom.customMetrics, 'has customMetrics');
          assert.deepEqual(e.detail.customDimensions, custom.customDimensions, 'has customDimensions');
        });
      });

      describe('timing()', () => {
        const init = { 
          category: 'e-category',
          variable: 'e-variable',
          value: 100,
          label: 'e-label',
        };
    
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.timing, spy);
          Events.Telemetry.timing(init.category, init.variable, init.value, init.label);
          window.removeEventListener(EventTypes.Telemetry.timing, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('the event has the detail object', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.timing, spy);
          Events.Telemetry.timing(init.category, init.variable, init.value, init.label);
          window.removeEventListener(EventTypes.Telemetry.timing, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail, init);
        });

        it('the event has custom configuration', () => {
          const spy = sinon.spy();
          const custom = {
            customMetrics: [{ index: 1, value: 1 }],
            customDimensions: [{ index: 1, value: 'test' }],
          };
          window.addEventListener(EventTypes.Telemetry.timing, spy);
          Events.Telemetry.timing(init.category, init.variable, init.value, init.label, document.body, custom);
          window.removeEventListener(EventTypes.Telemetry.timing, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.customMetrics, custom.customMetrics, 'has customMetrics');
          assert.deepEqual(e.detail.customDimensions, custom.customDimensions, 'has customDimensions');
        });
      });

      describe('State', () => {
        it('set()', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Telemetry.State.set, spy);
          Events.Telemetry.State.set(document.body);
          window.removeEventListener(EventTypes.Telemetry.State.set, spy);
          assert.isTrue(spy.calledOnce);
        });
      });
    });
  });
});
