/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import { NodeEngine, Headers, IHttpRequest, HttpEngineOptions, HostRule } from '../../index';

describe('http-engine', () => {
  describe('Unit tests', () => {
    describe('prepareHeaders()', () => {
      let request: IHttpRequest;
      let opts: HttpEngineOptions;

      beforeEach(() => {
        request = {
          url: 'https://api.domain.com',
          method: 'GET',
          headers: '',
        };
        opts = {
          defaultHeaders: true,
        };
      });

      it('adds default user-agent', () => {
        const base = new NodeEngine(request, opts);
        const headers = new Headers();
        base.prepareHeaders(headers);
        assert.equal(headers.get('user-agent'), 'api client');
      });

      it('adds default accept', () => {
        const base = new NodeEngine(request, opts);
        const headers = new Headers();
        base.prepareHeaders(headers);
        assert.equal(headers.get('accept'), '*/*');
      });

      it('adds configured user-agent', () => {
        opts.defaultUserAgent = 'test';
        const base = new NodeEngine(request, opts);
        const headers = new Headers();
        base.prepareHeaders(headers);
        assert.equal(headers.get('user-agent'), 'test');
      });

      it('adds configured accept', () => {
        opts.defaultAccept = 'test';
        const base = new NodeEngine(request, opts);
        const headers = new Headers();
        base.prepareHeaders(headers);
        assert.equal(headers.get('accept'), 'test');
      });

      it('ignores adding headers when no config option', () => {
        opts.defaultHeaders = false;
        const base = new NodeEngine(request, opts);
        const headers = new Headers();
        base.prepareHeaders(headers);
        assert.isFalse(headers.has('user-agent'), 'user-agent is not set');
        assert.isFalse(headers.has('accept'), 'accept is not set');
      });

      it('skips when user-agent header is set', () => {
        const base = new NodeEngine(request, opts);
        const headers = new Headers({
          'user-agent': 'test',
        });
        base.prepareHeaders(headers);
        assert.equal(headers.get('user-agent'), 'test');
      });

      it('skips when accept header is set', () => {
        const base = new NodeEngine(request, opts);
        const headers = new Headers({
          accept: 'test',
        });
        base.prepareHeaders(headers);
        assert.equal(headers.get('accept'), 'test');
      });
    });

    describe('readUrl()', () => {
      const requestData: IHttpRequest = {
        method: 'GET',
        url: 'https://domain.com',
      };
    
      it('has the "uri" property set', () => {
        const request = new NodeEngine(requestData);
        assert.typeOf(request.uri, 'URL');
        assert.equal(request.uri.hostname, 'domain.com');
      });
    
      it('applies the host rules', () => {
        const rule = HostRule.fromValues('domain.com', 'other.com');
        const hosts = [rule.toJSON()];
        const request = new NodeEngine(requestData, {
          hosts,
        });
        assert.equal(request.uri.hostname, 'other.com');
      });
    });
  });
});
