export type CertificateType = 'p12' | 'pem';

/**
 * Represents a single certificate object (cert/key)
 */
export interface ICertificate {
  /**
   * The certificate to use.
   * The `p12` type certificate must be a Buffer.
   */
  data: string|ArrayBuffer|Buffer|Uint8Array;
  /**
   * A passphrase to use to unlock the certificate.
   */
  passphrase?: string;
  /**
   * The original data type of the certificate. This is used by the data store
   * to move between buffers and string values stored in the store.
   * By any means, outside the internal procedure of the data store this
   * filed is always `undefined` and the `data` contains the original data format.
   */
  type?: string;
}

/**
 * Represents a complete certificate configuration required to make
 * a HTTP request.
 */
export interface IRequestCertificate {
 /**
   * Certificate type. Either `p12` or `pem`.
   */
  type: CertificateType;
  /**
   * Certificate or list of certificates to use.
   */
  cert: ICertificate|ICertificate[];
  /**
   * Key for the `pem` type certificate.
   */
  key?: ICertificate|ICertificate[];
}

/**
 * Client certificate index definition for listings. 
 */
export interface ICertificateIndex {
  /**
   * Certificate type. Either `p12` or `pem`.
   */
  type: CertificateType;
  /**
   * Custom name of the certificate.
   */
  name: string;
  /**
   * Timestamp when the certificate was inserted into the data store.
   * Required when returning a result. Auto-generated when inserting, if missing.
   */
  created?: number;
}

/**
 * A base client certificate object used in ARC to create / list objects.
 * This is not a data entity but rather something used to outside of a context of a data store.
 */
export interface IClientCertificate extends IRequestCertificate, ICertificateIndex {
}
