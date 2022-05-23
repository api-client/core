import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { ContextDeleteEvent, ContextDeleteEventDetail, ContextListEvent, ContextReadEvent } from '../../src/events/BaseEvents.js';
import { Events } from '../../src/events/Events.js';
import { EventTypes } from '../../src/events/EventTypes.js';
import { ICertificateCreateOptions, ICertificate } from '../../src/models/ClientCertificate.js';

describe('Events', () => {
  describe('Models', () => {
    describe('EventTypes.Model.ClientCertificate', () => {
      describe('insert()', () => {
        const item: ICertificateCreateOptions = { 
          name: 'test',
          cert: undefined,
          type: 'p12',
          key: 'test',
        };

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.insert, spy);
          Events.Model.ClientCertificate.insert(item);
          window.removeEventListener(EventTypes.Model.ClientCertificate.insert, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the item property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.insert, spy);
          Events.Model.ClientCertificate.insert(item);
          window.removeEventListener(EventTypes.Model.ClientCertificate.insert, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.item, item);
        });
      });

      describe('read()', () => {
        const key = 'test-cc-id';

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.read, spy);
          Events.Model.ClientCertificate.read(key);
          window.removeEventListener(EventTypes.Model.ClientCertificate.read, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the key property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.read, spy);
          Events.Model.ClientCertificate.read(key);
          window.removeEventListener(EventTypes.Model.ClientCertificate.read, spy);
          const e = spy.args[0][0] as ContextReadEvent<ICertificate>;
          assert.deepEqual(e.detail.key, key);
        });
      });

      describe('list()', () => {
        const opts = { limit: 5, nextPageToken: 'test-page-token' };

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.list, spy);
          Events.Model.ClientCertificate.list();
          window.removeEventListener(EventTypes.Model.ClientCertificate.list, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the options on the detail', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.list, spy);
          Events.Model.ClientCertificate.list(opts);
          window.removeEventListener(EventTypes.Model.ClientCertificate.list, spy);
          const e = spy.args[0][0] as ContextListEvent<ICertificate>;
          assert.include(e.detail, opts);
        });
      });

      describe('delete()', () => {
        const key = 'test-cc-id';

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.delete, spy);
          Events.Model.ClientCertificate.delete(key);
          window.removeEventListener(EventTypes.Model.ClientCertificate.delete, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the key property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.ClientCertificate.delete, spy);
          Events.Model.ClientCertificate.delete(key);
          window.removeEventListener(EventTypes.Model.ClientCertificate.delete, spy);
          const e = spy.args[0][0] as ContextReadEvent<ICertificate>;
          assert.equal(e.detail.key, key);
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
            Events.Model.ClientCertificate.State.update(record);
            window.removeEventListener(EventTypes.Model.ClientCertificate.State.update, spy);
            assert.isTrue(spy.calledOnce);
          });
  
          it('has the record on the detail', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.ClientCertificate.State.update, spy);
            Events.Model.ClientCertificate.State.update(record);
            window.removeEventListener(EventTypes.Model.ClientCertificate.State.update, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.deepEqual(e.detail, record);
          });
        });

        describe('delete()', () => {
          const record: ContextDeleteEventDetail = { key: 'test', parent: 'other' };
  
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.ClientCertificate.State.delete, spy);
            Events.Model.ClientCertificate.State.delete(record);
            window.removeEventListener(EventTypes.Model.ClientCertificate.State.delete, spy);
            assert.isTrue(spy.calledOnce);
          });
  
          it('has the record on the detail', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.ClientCertificate.State.delete, spy);
            Events.Model.ClientCertificate.State.delete(record);
            window.removeEventListener(EventTypes.Model.ClientCertificate.State.delete, spy);
            const e = spy.args[0][0] as ContextDeleteEvent;
            assert.deepEqual(e.detail, record);
          });
        });
      });
    });
  });
});
