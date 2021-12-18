import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Events } from '../../src/events/Events.js';
import { EventTypes } from '../../src/events/EventTypes.js';

describe('Events', () => {
  describe('Models', () => {
    describe('Project', () => {
      describe('create()', () => {
        const name = 'test';

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.create, spy);
          Events.Model.Project.create(document.body, name);
          window.removeEventListener(EventTypes.Model.Project.create, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the name property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.create, spy);
          Events.Model.Project.create(document.body, name);
          window.removeEventListener(EventTypes.Model.Project.create, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.name, name);
        });
      });

      describe('read()', () => {
        const id = 'a';
        const rev = 'b';
  
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.read, spy);
          Events.Model.Project.read(document.body, id);
          window.removeEventListener(EventTypes.Model.Project.read, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the id property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.read, spy);
          Events.Model.Project.read(document.body, id);
          window.removeEventListener(EventTypes.Model.Project.read, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.id, id);
        });
    
        it('has the rev property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.read, spy);
          Events.Model.Project.read(document.body, id, rev);
          window.removeEventListener(EventTypes.Model.Project.read, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.rev, rev);
        });
      });
    });
  });
});
