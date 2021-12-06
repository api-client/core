/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from 'chai';
import { NodeEngine, ErrorResponse, NetError } from '../../index.js';

describe('http-engine', () => {
  describe('NodeEngine', () => {
    describe('Certificates validation', () => {
      [
        ['expired', 'https://expired.badssl.com', 'CERT_HAS_EXPIRED'],
        ['wrong host', 'https://wrong.host.badssl.com/', 'ERR_TLS_CERT_ALTNAME_INVALID'],
        ['self signed', 'https://self-signed.badssl.com/', 'DEPTH_ZERO_SELF_SIGNED_CERT'],
        ['untrusted root', 'https://untrusted-root.badssl.com/', 'SELF_SIGNED_CERT_IN_CHAIN'],
    
    
        // ['revoked', 'https://revoked.badssl.com/'],
        // ['pinned', 'https://pinning-test.badssl.com/']
      ].forEach((item) => {
        const [name, url, code] = item;
        it(`reads certificate: ${name}`, async () => {
          const request = new NodeEngine({
            url,
            method: 'GET',
          }, {
            validateCertificates: false,
          });
          const log = await request.send();
          if (!log.response) {
            assert.fail('has not response');
            return;
          }
          assert.isAbove(log.response.status, 199);
          assert.isBelow(log.response.status, 300);
        });
    
        it(`rejects ${name} cert with validation enabled`, async () => {
          const request = new NodeEngine({
            url,
            method: 'GET',
          }, {
            validateCertificates: true,
          });
          const log = await request.send();
          const { response } = log;
          assert.ok(response, 'has the response');
          assert.isTrue(ErrorResponse.isErrorResponse(response), 'is the errored response');
          const errored = response as ErrorResponse;
          const error = errored.error as NetError;
          assert.equal(error.code, code, 'has the error code');
        });
      });
    });
  });
});
