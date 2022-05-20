/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EventTypes } from  '../../src/events/EventTypes.js';
import { Events } from  '../../src/events/Events.js';
import { ensureUnique } from './EventsTestHelpers.js';

describe('Events', () => {
  describe('Amf', () => {
    describe('EventTypes.Amf', () => {
      it('has the namespace', () => {
        assert.typeOf(EventTypes.Amf, 'object');
      });

      it('has frozen namespace', () => {
        assert.throws(() => {
          // @ts-ignore
          EventTypes.Amf = { read: '' };
        });
      });

      [
        ['processApiLink', 'amfprocessapilink'],
        ['processBuffer', 'amfprocessbuffer'],
        ['processApiFile', 'amfprocessapifile'],
        ['selectApiMainFile', 'amfselectapimainfile'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.Amf[prop], value);
        });
      });
  
      it('has unique events on the namespace', () => {
        ensureUnique('EventTypes.Amf', EventTypes.Amf);
      });
    });

    describe('processApiLink()', () => {
      const url = 'https://api.com'; 
      const mainFile = 'api.raml'; 
      const md5 = '123qwe'; 
      const packaging = 'zip';

      it('dispatches the event', async () => {
        const spy = sinon.spy();
        window.addEventListener(EventTypes.Amf.processApiLink, spy);
        await Events.Amf.processApiLink(url);
        assert.isTrue(spy.calledOnce);
      });

      it('sets the arguments on the detail object', async () => {
        const spy = sinon.spy();
        window.addEventListener(EventTypes.Amf.processApiLink, spy);
        await Events.Amf.processApiLink(url, mainFile, md5, packaging);
        window.removeEventListener(EventTypes.Amf.processApiLink, spy);
        const { detail } = spy.args[0][0];
        assert.equal(detail.url, url, 'url is set');
        assert.equal(detail.mainFile, mainFile, 'mainFile is set');
        assert.equal(detail.md5, md5, 'md5 is set');
        assert.equal(detail.packaging, packaging, 'packaging is set');
      });

      it('returns the result', async () => {
        const parseResult = { model: '', type: { type: 'RAML 1.0' } };
        function handler(e: CustomEvent): void {
          window.removeEventListener(EventTypes.Amf.processApiLink, handler as EventListener);
          e.preventDefault();
          e.detail.result = Promise.resolve(parseResult);
        }
        window.addEventListener(EventTypes.Amf.processApiLink, handler as EventListener);
        const result = await Events.Amf.processApiLink(url);
        assert.equal(result, parseResult);
      });
    });

    describe('processBuffer()', () => {
      const buffer = ({} as unknown) as Buffer;
      const opts = {}; 
      
      it('dispatches the event', async () => {
        const spy = sinon.spy();
        window.addEventListener(EventTypes.Amf.processBuffer, spy);
        await Events.Amf.processBuffer(buffer);
        window.removeEventListener(EventTypes.Amf.processBuffer, spy);
        assert.isTrue(spy.calledOnce);
      });

      it('sets the arguments on the detail object', async () => {
        const spy = sinon.spy();
        window.addEventListener(EventTypes.Amf.processBuffer, spy);
        await Events.Amf.processBuffer(buffer, opts);
        window.removeEventListener(EventTypes.Amf.processBuffer, spy);
        const { detail } = spy.args[0][0];
        assert.deepEqual(detail.buffer, buffer, 'buffer is set');
        assert.deepEqual(detail.opts, opts, 'opts is set');
      });

      it('returns the result', async () => {
        const parseResult = { model: '', type: { type: 'RAML 1.0' } };
        function handler(e: CustomEvent): void {
          window.removeEventListener(EventTypes.Amf.processBuffer, handler as EventListener);
          e.preventDefault();
          e.detail.result = Promise.resolve(parseResult);
        }
        window.addEventListener(EventTypes.Amf.processBuffer, handler as EventListener);
        const result = await Events.Amf.processBuffer(buffer);
        assert.equal(result, parseResult);
      });
    });

    describe('processApiFile()', () => {
      const file = new File([], 'test.txt');
      
      it('dispatches the event', async () => {
        const spy = sinon.spy();
        window.addEventListener(EventTypes.Amf.processApiFile, spy);
        await Events.Amf.processApiFile( file);
        window.removeEventListener(EventTypes.Amf.processApiFile, spy);
        assert.isTrue(spy.calledOnce);
      });

      it('sets the arguments on the detail object', async () => {
        const spy = sinon.spy();
        window.addEventListener(EventTypes.Amf.processApiFile, spy);
        await Events.Amf.processApiFile(file);
        window.removeEventListener(EventTypes.Amf.processApiFile, spy);
        const { detail } = spy.args[0][0];
        assert.deepEqual(detail.file, file, 'file is set');
      });

      it('returns the result', async () => {
        const parseResult = { model: '', type: { type: 'RAML 1.0' } };
        function handler(e: CustomEvent): void {
          window.removeEventListener(EventTypes.Amf.processApiFile, handler as EventListener);
          e.preventDefault();
          e.detail.result = Promise.resolve(parseResult);
        }
        window.addEventListener(EventTypes.Amf.processApiFile, handler as EventListener);
        const result = await Events.Amf.processApiFile(file);
        assert.equal(result, parseResult);
      });
    });

    describe('selectApiMainFile()', () => {
      const candidates = ['test'];
      
      it('dispatches the event', async () => {
        const spy = sinon.spy();
        window.addEventListener(EventTypes.Amf.selectApiMainFile, spy);
        await Events.Amf.selectApiMainFile(candidates);
        window.removeEventListener(EventTypes.Amf.selectApiMainFile, spy);
        assert.isTrue(spy.calledOnce);
      });

      it('sets the arguments on the detail object', async () => {
        const spy = sinon.spy();
        window.addEventListener(EventTypes.Amf.selectApiMainFile, spy);
        await Events.Amf.selectApiMainFile(candidates);
        window.removeEventListener(EventTypes.Amf.selectApiMainFile, spy);
        const { detail } = spy.args[0][0];
        assert.deepEqual(detail.candidates, candidates, 'candidates is set');
      });

      it('returns the result', async () => {
        const selected = 'test';
        function handler(e: CustomEvent): void {
          window.removeEventListener(EventTypes.Amf.selectApiMainFile, handler as EventListener);
          e.preventDefault();
          e.detail.result = Promise.resolve(selected);
        }
        window.addEventListener(EventTypes.Amf.selectApiMainFile, handler as EventListener);
        const result = await Events.Amf.selectApiMainFile(candidates);
        assert.equal(result, selected);
      });
    });
  });
});
