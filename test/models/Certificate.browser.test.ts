/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { Certificate, Kind as CertificateKind, IP12Certificate, IPemCertificate, ICertificateData } from '../../src/models/ClientCertificate.js';
import { fileToBuffer, bufferToBase64 } from '../../src/lib/Buffer.js';
import { ARCCertificateIndex, RequestCertificate } from '../../src/models/legacy/models/ClientCertificate.js';

describe('Models', () => {
  describe('Certificate', () => {
    describe('fromPem()', () => {
      const data = 'test-cert';
      const key = 'test-key';

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
        const keyData = result.certKey as ICertificateData;
        assert.equal(keyData.data, key);
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
        const keyData = result.certKey as ICertificateData;
        assert.equal(keyData.passphrase, 'test-pass');
      });

      it('creates a certificate from a buffer', async () => {
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
        const result = Certificate.fromPem(contents, key, '', 'test-pass');
        assert.typeOf(result.cert.data, 'Uint8Array');
      });

      it('creates a certificate key from a buffer', async () => {
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
        const result = Certificate.fromPem(data, contents);
        const keyData = result.certKey as ICertificateData;
        assert.typeOf(keyData.data, 'Uint8Array');
      });
    });

    describe('fromP12()', () => {
      const data = 'test-cert';

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

      it('creates a certificate from a buffer', async () => {
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
        const result = Certificate.fromP12(contents);
        assert.typeOf(result.cert.data, 'Uint8Array');
      });
    });

    describe('fromLegacy()', () => {
      it('creates a PEM certificate', async () => {
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
        const index: ARCCertificateIndex = {
          _id: 'a',
          _rev: 'b',
          name: 'pem-legacy',
          type: 'pem',
          created: 1234,
        };
        const cert: RequestCertificate = {
          type: 'pem',
          cert: Certificate.toStore({
            data: contents,
            type: 'buffer',
          }),
          key: Certificate.toStore({
            data: contents,
            type: 'buffer',
            passphrase: 'test-pass',
          })
        };
        const result = Certificate.fromLegacy(index, cert);
        assert.ok(result, 'returns the certificate');
        assert.equal(result.key, 'a', 'sets the key from the index _id');
        assert.equal(result.name, 'pem-legacy', 'sets the name');
        assert.equal(result.type, 'pem', 'sets the type');
        assert.typeOf(result.cert, 'object', 'sets the cert');
        assert.deepEqual(result.cert.data, contents, 'sets the contents');
        assert.isUndefined(result.cert.type, 'removes the data type');
        const key = result.certKey as ICertificateData;
        assert.typeOf(key, 'object', 'sets the key');
        assert.deepEqual(key.data, contents, 'sets the key cert data');
        assert.equal(key.passphrase, 'test-pass', 'sets the key passphrase');
      });

      it('creates a P12 certificate', async () => {
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
        const index: ARCCertificateIndex = {
          _id: 'a',
          _rev: 'b',
          name: 'p12-legacy',
          type: 'p12',
          created: 1234,
        };
        const cert: RequestCertificate = {
          type: 'p12',
          cert: Certificate.toStore({
            data: contents,
            type: 'buffer',
          }),
        };
        const result = Certificate.fromLegacy(index, cert);
        assert.ok(result, 'returns the certificate');
        assert.equal(result.key, 'a', 'sets the key from the index _id');
        assert.equal(result.name, 'p12-legacy', 'sets the name');
        assert.equal(result.type, 'p12', 'sets the type');
        assert.typeOf(result.cert, 'object', 'sets the cert');
        assert.deepEqual(result.cert.data, contents, 'sets the contents');
        assert.isUndefined(result.cert.type, 'removes the data type');
        const key = result.certKey as ICertificateData;
        assert.isUndefined(key, 'has no key');
      });

      it('throws when creating a PEM certificate without the key', async () => {
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
        const index: ARCCertificateIndex = {
          _id: 'a',
          _rev: 'b',
          name: 'pem-legacy',
          type: 'pem',
          created: 1234,
        };
        const cert: RequestCertificate = {
          type: 'pem',
          cert: Certificate.toStore({
            data: contents,
            type: 'buffer',
          }),
        };
        assert.throws(() => {
          Certificate.fromLegacy(index, cert)
        }, 'Unable to create a PEM certificate without the key.');
      });

      it('throws when creating an unknown certificate', async () => {
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
        const index: ARCCertificateIndex = {
          _id: 'a',
          _rev: 'b',
          name: 'other-legacy',
          type: 'other',
          created: 1234,
        };
        const cert: RequestCertificate = {
          type: 'other',
          cert: Certificate.toStore({
            data: contents,
            type: 'buffer',
          }),
        };
        assert.throws(() => {
          Certificate.fromLegacy(index, cert)
        }, 'Unable to create a certificate. Unknown type: other.');
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

      it('restores stored certificate data', async () => {
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
        const result = new Certificate({ ...base, cert: { data: bufferToBase64(contents), type: 'buffer' } });
        assert.typeOf(result.cert.data, 'Uint8Array', 'has the restored data');
        assert.isUndefined(result.cert.type, 'removes the type property');
      });

      it('restores stored certificate key', async () => {
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
        const result = new Certificate({ ...base, type: 'pem', certKey: { data: bufferToBase64(contents), type: 'buffer' } });
        const keyData = result.certKey as ICertificateData;
        assert.typeOf(keyData.data, 'Uint8Array', 'has the restored data');
        assert.isUndefined(keyData.type, 'removes the type property');
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

      it('sets the cert from buffer', async () => {
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
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
        const blob = new Blob(['test value'], { type: 'text/plain' });
        const contents = await fileToBuffer(blob);
        const c = new Certificate({ ...base, type: 'pem', certKey: { data: bufferToBase64(contents), type: 'buffer' } });
        const result = c.toJSON() as IPemCertificate;
        assert.equal(result.certKey.data, 'dGVzdCB2YWx1ZQ==');
        assert.equal(result.certKey.type, 'buffer');
      });
    });
  });
});
