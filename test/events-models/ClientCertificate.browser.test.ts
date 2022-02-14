import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Events } from '../../src/events/Events.js';
import { EventTypes } from '../../src/events/EventTypes.js';
import { IClientCertificate } from '../../src/models/ClientCertificate.js';

describe('Events', () => {
  describe('Models', () => {
    describe('EventTypes.Model.ClientCertificate', () => {
      describe('insert()', () => {
        const item: IClientCertificate = { 
          name: 'test',
          cert: undefined,
          type: 'p12',
        };

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.insert, spy);
          Events.Model.ClientCertificate.insert(document.body, item);
          window.removeEventListener(EventTypes.Model.ClientCertificate.insert, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the item property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.insert, spy);
          Events.Model.ClientCertificate.insert(document.body, item);
          window.removeEventListener(EventTypes.Model.ClientCertificate.insert, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.item, item);
        });
      });

      describe('read()', () => {
        const id = 'test-cc-id';
        const rev = 'test-cc-rev-id';

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.read, spy);
          Events.Model.ClientCertificate.read(document.body, id);
          window.removeEventListener(EventTypes.Model.ClientCertificate.read, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the id property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.read, spy);
          Events.Model.ClientCertificate.read(document.body, id);
          window.removeEventListener(EventTypes.Model.ClientCertificate.read, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.id, id);
        });

        it('has the rev property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.read, spy);
          Events.Model.ClientCertificate.read(document.body, id, rev);
          window.removeEventListener(EventTypes.Model.ClientCertificate.read, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.rev, rev);
        });
      });

      describe('list()', () => {
        const opts = { limit: 5, nextPageToken: 'test-page-token' };

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.list, spy);
          Events.Model.ClientCertificate.list(document.body);
          window.removeEventListener(EventTypes.Model.ClientCertificate.list, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the options on the detail', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.list, spy);
          Events.Model.ClientCertificate.list(document.body, opts);
          window.removeEventListener(EventTypes.Model.ClientCertificate.list, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.include(e.detail, opts);
        });
      });

      describe('delete()', () => {
        const id = 'test-cc-id';
        const rev = 'test-cc-rev-id';

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.delete, spy);
          Events.Model.ClientCertificate.delete(document.body, id);
          window.removeEventListener(EventTypes.Model.ClientCertificate.delete, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the id property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.delete, spy);
          Events.Model.ClientCertificate.delete(document.body, id);
          window.removeEventListener(EventTypes.Model.ClientCertificate.delete, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.id, id);
        });

        it('has the rev property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.delete, spy);
          Events.Model.ClientCertificate.delete(document.body, id, rev);
          window.removeEventListener(EventTypes.Model.ClientCertificate.delete, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.rev, rev);
        });
      });

      describe('State', () => {
        describe('update()', () => {
          const record = { 
            key: 'test', 
            parent: 'other',
            item: undefined,
          };
  
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.ClientCertificate.State.update, spy);
            Events.Model.ClientCertificate.State.update(document.body, record);
            window.removeEventListener(EventTypes.Model.ClientCertificate.State.update, spy);
            assert.isTrue(spy.calledOnce);
          });
  
          it('has the record on the detail', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.ClientCertificate.State.update, spy);
            Events.Model.ClientCertificate.State.update(document.body, record);
            window.removeEventListener(EventTypes.Model.ClientCertificate.State.update, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.deepEqual(e.detail, record);
          });
        });

        describe('delete()', () => {
          const record = { id: 'test', parent: 'other' };
  
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.ClientCertificate.State.delete, spy);
            Events.Model.ClientCertificate.State.delete(document.body, record);
            window.removeEventListener(EventTypes.Model.ClientCertificate.State.delete, spy);
            assert.isTrue(spy.calledOnce);
          });
  
          it('has the record on the detail', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.ClientCertificate.State.delete, spy);
            Events.Model.ClientCertificate.State.delete(document.body, record);
            window.removeEventListener(EventTypes.Model.ClientCertificate.State.delete, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.deepEqual(e.detail, record);
          });
        });
      });
    });
  });
});
