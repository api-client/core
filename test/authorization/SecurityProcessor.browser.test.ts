import { assert } from '@esm-bundle/chai';
import { SecurityProcessor } from '../../src/authorization/lib/SecurityProcessor.js';
import { IOidcTokenInfo } from '../../src/models/Authorization.js';
import { HttpRequest, IHttpRequest } from '../../src/models/HttpRequest.js';

describe('authorization', () => {
  describe('SecurityProcessor', () => {
    describe('applyBasicAuth()', () => {
      let request: IHttpRequest;
      beforeEach(() => {
        const obj = new HttpRequest();
        request = obj.toJSON();
      });

      it('adds the authorization header to the request', () => {
        SecurityProcessor.applyBasicAuth(request, {
          username: 'a',
          password: 'b',
        });
        assert.equal(request.headers, 'authorization: Basic YTpi');
      });

      it('does nothing when no username', () => {
        SecurityProcessor.applyBasicAuth(request, {
          password: 'b',
        });
        assert.isUndefined(request.headers);
      });

      it('sets the empty password', () => {
        SecurityProcessor.applyBasicAuth(request, {
          username: 'a',
        });
        assert.equal(request.headers, 'authorization: Basic YTo=');
      });
    });

    describe('applyOAuth2()', () => {
      let request: IHttpRequest;
      beforeEach(() => {
        const obj = new HttpRequest();
        obj.url = 'https://api.com';
        request = obj.toJSON();
      });

      it('adds the default header', () => {
        SecurityProcessor.applyOAuth2(request, {
          accessToken: 'test123'
        });
        assert.equal(request.headers, 'authorization: Bearer test123');
      });

      it('respects the tokenType configuration for header delivery', () => {
        SecurityProcessor.applyOAuth2(request, {
          accessToken: 'test123',
          tokenType: 'Other',
        });
        assert.equal(request.headers, 'authorization: Other test123');
      });

      it('respects the deliveryName configuration for header delivery', () => {
        SecurityProcessor.applyOAuth2(request, {
          accessToken: 'test123',
          deliveryName: 'x-auth',
        });
        assert.equal(request.headers, 'x-auth: Bearer test123');
      });

      it('adds the default query parameter', () => {
        SecurityProcessor.applyOAuth2(request, {
          accessToken: 'test123',
          deliveryMethod: 'query',
        });
        assert.equal(request.url, 'https://api.com?authorization=Bearer+test123');
      });

      it('respects the tokenType configuration for query parameter delivery', () => {
        SecurityProcessor.applyOAuth2(request, {
          accessToken: 'test123',
          tokenType: 'Other',
          deliveryMethod: 'query',
        });
        assert.equal(request.url, 'https://api.com?authorization=Other+test123');
      });

      it('respects the deliveryName configuration for query parameter delivery', () => {
        SecurityProcessor.applyOAuth2(request, {
          accessToken: 'test123',
          deliveryName: 'auth',
          deliveryMethod: 'query',
        });
        assert.equal(request.url, 'https://api.com?auth=Bearer+test123');
      });

      it('does nothing when no access token', () => {
        SecurityProcessor.applyOAuth2(request, {
          deliveryName: 'auth',
          deliveryMethod: 'query',
        });
        assert.equal(request.url, 'https://api.com');
      });
    });

    describe('applyOpenId()', () => {
      let request: IHttpRequest;
      beforeEach(() => {
        const obj = new HttpRequest();
        request = obj.toJSON();
      });

      it('adds the default header', () => {
        SecurityProcessor.applyOpenId(request, {
          accessToken: 'test123'
        });
        assert.equal(request.headers, 'authorization: Bearer test123');
      });

      it('adds the tokenInUse', () => {
        SecurityProcessor.applyOpenId(request, {
          tokenInUse: 0,
          tokens: [
            {
              responseType: 'code',
              state: '123',
              time: 123,
              accessToken: 'test456'
            }
          ] as IOidcTokenInfo[],
        });
        assert.equal(request.headers, 'authorization: Bearer test456');
      });

      it('does nothing when invalid tokenInUse', () => {
        SecurityProcessor.applyOpenId(request, {
          tokenInUse: 2,
          tokens: [
            {
              responseType: 'code',
              state: '123',
              time: 123,
              accessToken: 'test456'
            }
          ] as IOidcTokenInfo[],
        });
        assert.isUndefined(request.headers);
      });

      it('does nothing when no tokens', () => {
        SecurityProcessor.applyOpenId(request, {
          tokenInUse: 2,
        });
        assert.isUndefined(request.headers);
      });
    });

    describe('applyBearer()', () => {
      let request: IHttpRequest;
      beforeEach(() => {
        const obj = new HttpRequest();
        request = obj.toJSON();
      });

      it('adds the authorization header', () => {
        SecurityProcessor.applyBearer(request, {
          token: '123',
        });
        assert.equal(request.headers, 'authorization: Bearer 123');
      });

      it('does nothing when no token', () => {
        SecurityProcessor.applyBearer(request, {
          token: undefined,
        });
        assert.isUndefined(request.headers);
      });

    });
  });
});
