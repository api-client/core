import { assert } from 'chai';
import { Certificate, CertificateKind, IP12Certificate, IPemCertificate, Buffer as CoreBuffer } from '../../index.js';

const { bufferToBase64 } = CoreBuffer;

describe('Models', () => {
  describe('Certificate', () => {
    describe('fromPem()', () => {
      let data = 'test-cert';
      let key = 'test-key';

      it('sets the kind', () => {
        const result = Certificate.fromPem(data, key);
        assert.equal(result.kind, CertificateKind);
      });

      it('sets the key (id)', () => {
        const result = Certificate.fromPem(data, key);
        assert.typeOf(result.key, 'string');
        assert.isNotEmpty(result.key);
      });

      it('sets the default name', () => {
        const result = Certificate.fromPem(data, key);
        assert.equal(result.name, 'New PEM certificate');
      });

      it('sets the certificate data', () => {
        const result = Certificate.fromPem(data, key);
        assert.equal(result.cert.data, data);
      });

      it('sets the certificate key', () => {
        const result = Certificate.fromPem(data, key);
        assert.equal(result.certKey!.data, key);
      });

      it('sets the type', () => {
        const result = Certificate.fromPem(data, key);
        assert.equal(result.type, 'pem');
      });

      it('sets the passed name', () => {
        const result = Certificate.fromPem(data, key, 'test');
        assert.equal(result.name, 'test');
      });

      it('sets the passed passphrase on the key', () => {
        const result = Certificate.fromPem(data, key, '', 'test-pass');
        assert.equal(result.certKey!.passphrase, 'test-pass');
      });

      it('creates a certificate from a buffer', () => {
        const contents = Buffer.from('test value');
        const result = Certificate.fromPem(contents, key, '', 'test-pass');
        assert.typeOf(result.cert.data, 'Uint8Array');
      });

      it('creates a certificate key from a buffer', () => {
        const contents = Buffer.from('test value');
        const result = Certificate.fromPem(data, contents);
        assert.typeOf(result.certKey!.data, 'Uint8Array');
      });
    });

    describe('fromP12()', () => {
      let data = 'test-cert';

      it('sets the kind', () => {
        const result = Certificate.fromP12(data);
        assert.equal(result.kind, CertificateKind);
      });

      it('sets the key (id)', () => {
        const result = Certificate.fromP12(data);
        assert.typeOf(result.key, 'string');
        assert.isNotEmpty(result.key);
      });

      it('sets the default name', () => {
        const result = Certificate.fromP12(data);
        assert.equal(result.name, 'New P12 certificate');
      });

      it('sets the certificate data', () => {
        const result = Certificate.fromP12(data);
        assert.equal(result.cert.data, data);
      });

      it('sets the type', () => {
        const result = Certificate.fromP12(data);
        assert.equal(result.type, 'p12');
      });

      it('sets the passed name', () => {
        const result = Certificate.fromP12(data, 'test');
        assert.equal(result.name, 'test');
      });

      it('sets the passed passphrase on the key', () => {
        const result = Certificate.fromP12(data, '', 'test-pass');
        assert.equal(result.cert.passphrase, 'test-pass');
      });

      it('creates a certificate from a buffer', () => {
        const contents = Buffer.from('test value');
        const result = Certificate.fromP12(contents);
        assert.typeOf(result.cert.data, 'Uint8Array');
      });
    });

    describe('constructor()', () => {
      const cert = 'test-cert';
      const key = 'test-key';

      const base: IP12Certificate = {
        cert: { data: cert },
        key: '123',
        kind: 'Core#Certificate',
        name: 'name',
        type: 'p12',
        created: 123456,
      }

      it('sets the kind', () => {
        const result = new Certificate(base);
        assert.equal(result.kind, CertificateKind);
      });

      it('sets the key (id)', () => {
        const result = new Certificate(base);
        assert.equal(result.key, '123');
      });

      it('sets the name', () => {
        const result = new Certificate(base);
        assert.equal(result.name, 'name');
      });

      it('sets the certificate data', () => {
        const result = new Certificate(base);
        assert.equal(result.cert.data, cert);
      });

      it('sets the certificate key data', () => {
        const result = new Certificate({ ...base, type: 'pem', certKey: { data: key } });
        assert.equal(result.cert.data, cert);
      });

      it('sets the type', () => {
        const result = new Certificate(base);
        assert.equal(result.type, 'p12');
      });

      it('sets the created', () => {
        const result = new Certificate(base);
        assert.equal(result.created, 123456);
      });

      it('restores stored certificate data', () => {
        const contents = Buffer.from('test value');
        const result = new Certificate({ ...base, cert: { data: bufferToBase64(contents), type: 'buffer' } });
        assert.typeOf(result.cert.data, 'Uint8Array', 'has the restored data');
        assert.isUndefined(result.cert.type, 'removes the type property');
      });

      it('restores stored certificate key', () => {
        const contents = Buffer.from('test value');
        const result = new Certificate({ ...base, type: 'pem', certKey: { data: bufferToBase64(contents), type: 'buffer' } });
        assert.typeOf(result.certKey!.data, 'Uint8Array', 'has the restored data');
        assert.isUndefined(result.certKey!.type, 'removes the type property');
      });
    });

    describe('toJSON()', () => {
      const cert = 'test-cert';
      const key = 'test-key';

      const base: IP12Certificate = {
        cert: { data: cert },
        key: '123',
        kind: 'Core#Certificate',
        name: 'name',
        type: 'p12',
        created: 123456,
      }

      it('sets the kind', () => {
        const c = new Certificate(base);
        const result = c.toJSON();
        assert.equal(result.kind, CertificateKind);
      });

      it('sets the key (id)', () => {
        const c = new Certificate(base);
        const result = c.toJSON();
        assert.equal(result.key, '123');
      });

      it('sets the name', () => {
        const c = new Certificate(base);
        const result = c.toJSON();
        assert.equal(result.name, 'name');
      });

      it('sets the type', () => {
        const c = new Certificate(base);
        const result = c.toJSON();
        assert.equal(result.type, 'p12');
      });

      it('sets the cert from string', () => {
        const c = new Certificate(base);
        const result = c.toJSON();
        assert.equal(result.cert.data, cert);
      });

      it('sets the cert from buffer', () => {
        const contents = Buffer.from('test value');
        const c = new Certificate({ ...base, cert: { data: bufferToBase64(contents), type: 'buffer' } });
        const result = c.toJSON();
        assert.equal(result.cert.data, 'dGVzdCB2YWx1ZQ==');
      });

      it('sets the cert key from string', () => {
        const c = new Certificate({ ...base, type: 'pem', certKey: { data: key } } );
        const result = c.toJSON() as IPemCertificate;
        assert.equal(result.certKey.data, key);
      });

      it('sets the cert key from buffer', async () => {
        const contents = Buffer.from('test value');
        const c = new Certificate({ ...base, type: 'pem', certKey: { data: bufferToBase64(contents), type: 'buffer' } });
        const result = c.toJSON() as IPemCertificate;
        assert.equal(result.certKey.data, 'dGVzdCB2YWx1ZQ==');
        assert.equal(result.certKey.type, 'buffer');
      });
    });
  });
});
