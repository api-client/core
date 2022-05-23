import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Certificates } from '../../../src/mocking/lib/Certificates.js';
import { Certificate, IPemCertificate } from '../../../src/models/ClientCertificate.js';

describe('Certificates', () => {
  describe('certificate()', () => {
    let certs: Certificates;

    before(() => { certs = new Certificates(); });

    it('returns an object', () => {
      const result = certs.certificate();
      assert.typeOf(result, 'object');
    });

    [
      ['type', 'string'],
      ['cert', 'object'],
      ['key', 'string'],
      ['name', 'string'],
      ['created', 'number'],
    ].forEach(([prop, type]) => {
      it(`has the ${prop} property of a type ${type}`, () => {
        const result = certs.certificate();
        assert.typeOf(result[prop], type);
      });
    });

    it('uses passed type', () => {
      const result = certs.certificate({
        type: 'p12'
      });
      assert.equal(result.type, 'p12');
    });

    it('adds certKey on the pem certificate', () => {
      const result = certs.certificate({
        type: 'pem'
      }) as IPemCertificate;
      assert.typeOf(result.certKey, 'object');
      assert.typeOf(result.certKey.data, 'string');
      assert.isNotEmpty(result.certKey.data);
    });

    it('creates binary data on a certificate', () => {
      const result = certs.certificate({
        binary: true
      });
      const cert = new Certificate(result);
      assert.typeOf(cert.cert.data, 'Uint8Array');
    });

    it('adds passphrase to a certificate by default', () => {
      const result = certs.certificate({});
      assert.typeOf(result.cert.passphrase, 'string');
    });

    it('ignores passphrase on a certificate', () => {
      const result = certs.certificate({
        noPassphrase: true
      });
      assert.isUndefined(result.cert.passphrase);
    });
  });

  describe('certificates()', () => {
    let certs: Certificates;

    before(() => { certs = new Certificates(); });

    it('Returns an array', () => {
      const result = certs.certificates();
      assert.typeOf(result, 'array');
    });

    it('List has default number of items', () => {
      const result = certs.certificates();
      assert.lengthOf(result, 15);
    });

    it('Returns requested number of items', () => {
      const result = certs.certificates(5);
      assert.lengthOf(result, 5);
    });

    it('calls clientCertificate()', () => {
      const spy = sinon.spy(certs, 'certificate');
      certs.certificates(5);
      assert.equal(spy.callCount, 5);
    });
  });
});
