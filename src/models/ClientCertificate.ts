import { base64ToBuffer, bufferToBase64 } from '../lib/Buffer.js';
import v4 from '../lib/uuid.js';

export type CertificateType = 'p12' | 'pem';

export const Kind = 'Core#Certificate';

export type CertificateDataFormat = string | ArrayBuffer | Buffer | Uint8Array;

/**
 * Represents a single certificate object (cert/key)
 */
export interface ICertificateData {
  /**
   * The certificate to use.
   * The `p12` type certificate must be a Buffer.
   */
  data: CertificateDataFormat;
  /**
   * A passphrase to use to unlock the certificate.
   */
  passphrase?: string;
  /**
   * The original data type of the certificate. This is only used internally by the data store
   * to move between buffers and string values stored in the store.
   * Outside the internal procedure of the data store this
   * is always `undefined` and the `data` contains the original data format.
   */
  type?: 'buffer';
}

export interface ICertificate {
  kind: typeof Kind;
  /**
   * The data store key to refer.
   */
  key: string;
  /**
   * Custom name of the certificate.
   */
  name: string;
  /**
   * Timestamp when the certificate was inserted into the data store.
   * Required when returning a result. Auto-generated when inserting, if missing.
   */
  created?: number;
  /**
   * Certificate type. Either `p12` or `pem`.
   */
  type: CertificateType;
  /**
   * Certificate or list of certificates to use.
   */
  cert: ICertificateData;
}

export interface IP12Certificate extends ICertificate {
  type: 'p12';
}

/**
 * Represents a complete certificate configuration required to make
 * an HTTP request.
 */
export interface IPemCertificate extends ICertificate {
  type: 'pem';
  /**
   * The key for the `pem` type certificate.
   */
  certKey: ICertificateData;
}

export type HttpCertificate = IP12Certificate | IPemCertificate;

export interface IPemCreateOptions {
  type: 'p12';
  /**
   * The certificate contents.
   */
  cert: CertificateDataFormat; 
  /**
   * The key contents.
   */
  key: CertificateDataFormat; 
  /**
   * Optional name for the certificate.
   */
  name?: string; 
  /**
   * Optional passphrase for the key.
   */
  passphrase?: string;
}

export interface IP12CreateOptions {
  type: 'pem';
  /**
   * The certificate contents.
   */
  cert: CertificateDataFormat;
  /**
   * Optional name for the certificate.
   */
  name?: string; 
  /**
   * Optional passphrase for the certificate.
   */
  passphrase?: string;
}

export type ICertificateCreateOptions = IPemCreateOptions | IP12CreateOptions;

/**
 * A class that represents a certificate in the system
 */
export class Certificate {
  kind = Kind;
  /**
   * The data store key to refer.
   */
  key: string;
  /**
   * Custom name of the certificate.
   */
  name: string;
  /**
   * Timestamp when the certificate was inserted into the data store.
   * Required when returning a result. Auto-generated when inserting, if missing.
   */
  created?: number;
  /**
   * Certificate type. Either `p12` or `pem`.
   */
  type: CertificateType;
  /**
   * Certificate or list of certificates to use.
   */
  cert: ICertificateData;
  /**
   * The key for the `pem` type certificate.
   */
  certKey?: ICertificateData;
  
  /**
   * Creates a new certificate instance for a PEM key
   * 
   * @param pem The certificate contents
   * @param key The key contents
   * @param name The certificate name
   * @param keyPassphrase The key passphrase
   */
  static fromPem(pem: CertificateDataFormat, key: CertificateDataFormat, name = 'New PEM certificate', keyPassphrase?: string): Certificate {
    const init: IPemCertificate = {
      kind: Kind,
      cert: {
        data: pem,
      },
      certKey: {
        data: key,
      },
      key: v4(),
      name,
      type: 'pem',
    };
    if (keyPassphrase) {
      init.certKey.passphrase = keyPassphrase;
    }
    return new Certificate(init);
  }

  /**
   * Creates a new certificate instance for a P12 key
   * 
   * @param cert The certificate contents
   * @param name The certificate name
   * @param passphrase The key passphrase
   */
  static fromP12(cert: CertificateDataFormat, name = 'New P12 certificate', passphrase?: string): Certificate {
    const init: IP12Certificate = {
      kind: Kind,
      cert: {
        data: cert,
      },
      key: v4(),
      name,
      type: 'p12',
    };
    if (passphrase) {
      init.cert.passphrase = passphrase;
    }
    return new Certificate(init);
  }

  constructor(certificate: HttpCertificate) {
    const { type, cert, key=v4(), name='', created } = certificate;
    this.key = key;
    this.name = name;
    this.type = type;
    this.cert = this.fromStore(cert);
    if (typeof created === 'number') {
      this.created = created;
    }
    if (type === 'pem') {
      this.certKey = this.fromStore(certificate.certKey);
    }
  }

  /**
   * When needed it reads the certificate's original format.
   * @param data The certificate data.
   * @returns The restored certificate.
   */
  fromStore(data: ICertificateData): ICertificateData {
    if (data.type) {
      delete data.type;
      const content = data.data as string;
      data.data = base64ToBuffer(content);
    }
    return data;
  }

  /**
   * Prepares certificate object to be stored in the data store.
   * If the `data` property is not string then it assumes buffer (either
   * Node's or ArrayBuffer). In this case it converts buffer to base64 string.
   * It also adds `type` property set to `buffer` for the `fromStore()`
   * function to recognize what to do with the data.
   *
   * Note, for optimization, PEM keys should be strings as the content of the
   * certificate is already a base62 string. To spare double base64 conversion
   * use string data.
   *
   * @param data The certificate data object.
   * @throws When data is not set
   */
  toStore(data: ICertificateData): ICertificateData {
    if (!data) {
      throw new Error('Certificate data is missing.');
    }
    if (!data.data) {
      throw new Error('Certificate content not set.');
    }
    if (typeof data.data !== 'string') {
      data.type = 'buffer';
      const buff = data.data as Buffer;
      data.data = bufferToBase64(buff);
    }
    return data;
  }

  toJSON(): HttpCertificate {
    const result: IP12Certificate = {
      kind: Kind,
      key: this.key,
      cert: this.toStore(this.cert),
      name: this.name,
      type: 'p12',
    };

    if (this.type === 'pem') {
      const typed = (result as unknown) as IPemCertificate;
      typed.certKey = this.toStore(this.certKey!);
    }

    return result;
  }
}
