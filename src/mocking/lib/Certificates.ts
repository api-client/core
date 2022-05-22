import { IDataMockInit, Lorem, Random, Types, Utils } from '@pawel-up/data-mock';
import { HttpCertificate, Certificate, ICertificateData } from '../../models/ClientCertificate.js';

export declare interface CertificateCreateInit {
  binary?: boolean;
  noPassphrase?: boolean;
  type?: 'p12' | 'pem';
}

export class Certificates {
  lorem: Lorem;
  types: Types;
  random: Random;

  constructor(init: IDataMockInit={}) {
    this.lorem = new Lorem(init);
    this.types = new Types(init.seed);
    this.random = new Random(init.seed);
  }

  /**
   * Creates a certificate definition.
   */
  certificate(opts: CertificateCreateInit = {}): HttpCertificate {
    const type = opts.type ? opts.type : this.random.pickOne(['p12', 'pem']);
    const data = this.lorem.paragraph();
    const cert = opts.binary ? Utils.strToBuffer(data) : data;
    let instance: Certificate;
    if (type === 'p12') {
      instance = Certificate.fromP12(cert, this.lorem.word());
    } else {
      instance = Certificate.fromPem(cert, '', this.lorem.word());
    }
    if (!opts.noPassphrase) {
      instance.cert.passphrase = this.lorem.word();
      if (type === 'pem') {
        const key = instance.certKey as ICertificateData;
        key.passphrase = this.lorem.word();
      }
    }
    return instance.toJSON();
  }

  /**
   * Creates a list of ClientCertificate objects that are used to create a new certificates.
   * 
   * @param size The number of certificates to generate.
   * @param opts Create options
   */
   certificates(size = 15, opts: CertificateCreateInit = {}): HttpCertificate[] {
    const result: HttpCertificate[] = [];
    for (let i = 0; i < size; i++) {
      result[result.length] = this.certificate(opts);
    }
    return result;
  }
}
