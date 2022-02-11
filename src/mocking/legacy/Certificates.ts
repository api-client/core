import { Lorem, Random, Types, Utils } from '@pawel-up/data-mock';
import { ArcDataMockInit } from '../LegacyInterfaces.js';
import { Certificate, CertificateIndex, ClientCertificate } from '../../models/legacy/models/ClientCertificate.js';
import { ExportArcClientCertificateData } from '../../models/legacy/DataExport.js';

export declare interface CertificateCreateInit {
  binary?: boolean;
  noPassphrase?: boolean;
  noKey?: boolean;
  noCreated?: boolean;
  type?: 'p12' | 'pem';
}

export class Certificates {
  lorem: Lorem;
  types: Types;
  random: Random;

  constructor(init: ArcDataMockInit={}) {
    this.lorem = new Lorem(init);
    this.types = new Types(init.seed);
    this.random = new Random(init.seed);
  }

  /**
   * Creates a certificate definition.
   */
  certificate(opts: CertificateCreateInit = {}): Certificate {
    const data = this.lorem.paragraph();
    const result: Certificate = {
      data,
    };
    if (opts.binary) {
      result.data = Utils.strToBuffer(data);
    }
    if (!opts.noPassphrase) {
      result.passphrase = this.lorem.word();
    }
    return result;
  }

  /**
   * Generates a Client Certificate index object.
   * @param opts Create options
   */
  certificateIndex(opts: CertificateCreateInit = {}): CertificateIndex {
    const type = opts.type ? opts.type : this.random.pickOne(['p12', 'pem']);
    const result: CertificateIndex = {
      type,
      name: this.lorem.word(),
    };
    if (!opts.noCreated) {
      result.created = this.types.datetime().getTime();
    }
    return result;
  }

  /**
   * @param opts Create options
   */
  requestCertificate(opts: CertificateCreateInit = {}): ClientCertificate {
    const type = opts.type ? opts.type : this.random.pickOne(['p12', 'pem']);
    const cert = this.certificate(opts);
    const name = this.lorem.word();
    const result: ClientCertificate = {
      type,
      name,
      cert,
    };
    if (!opts.noKey) {
      result.key = this.certificate(opts);
    }
    return result;
  }

  /**
   * Creates a ClientCertificate object that is used to create a new certificate.
   * @param opts Create options
   */
  clientCertificate(opts: CertificateCreateInit = {}): ClientCertificate {
    const index = this.certificateIndex(opts);
    const data = this.requestCertificate(opts) as any;
    const result: ClientCertificate = {
      ...index,
      cert: data.cert,
    };
    if (data.key) {
      result.key = data.key;
    }
    return result;
  }

  /**
   * Creates a list of ClientCertificate objects that are used to create a new certificates.
   * 
   * @param size The number of certificates to generate.
   * @param opts Create options
   */
  clientCertificates(size = 15, opts: CertificateCreateInit = {}): ClientCertificate[] {
    const result = [];
    for (let i = 0; i < size; i++) {
      result[result.length] = this.clientCertificate(opts);
    }
    return result;
  }

  /**
   * Creates a ClientCertificate transformed to the export object.
   */
  exportClientCertificate(opts: CertificateCreateInit = {}): ExportArcClientCertificateData {
    const item = (this.clientCertificate(opts)) as any;
    if (item.key) {
      item.pKey = item.key;
    }
    item.key = this.types.uuid();
    item.kind = 'ARC#ClientCertificate';
    return item;
  }

  /**
   * Creates a list of ClientCertificates transformed for the export object.
   */
  exportClientCertificates(size = 15, opts: CertificateCreateInit = {}): ExportArcClientCertificateData[] {
    const result: ExportArcClientCertificateData[] = [];
    for (let i = 0; i < size; i++) {
      result[result.length] = this.exportClientCertificate(opts);
    }
    return result;
  }

  /**
   * @param cert Certificate definition. See class description.
   */
  toStore(cert: Certificate|Certificate[]): Certificate|Certificate[] {
    if (Array.isArray(cert)) {
      return (cert.map(info => this.toStore(info))) as Certificate[];
    }
    if (typeof cert.data === 'string') {
      return cert;
    }
    const data = Utils.bufferToBase64(cert.data);
    const copy = { ...cert, type: 'buffer', data };
    return copy;
  }
}
