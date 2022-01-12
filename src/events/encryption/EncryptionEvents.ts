import { EncryptionEventTypes } from './EncryptionEventTypes.js';
import { ContextEvent } from "../BaseEvents.js";

export interface EncryptionEventDetail {
  /**
   * The data to export
   */
  data: any;
  /**
   * The passphrase to use in 2-way data encryption
   */
  passphrase: string;
  /**
   * Encryption method to use
   */
  method: string;
}

export class EncryptionEvents {
  /**
   * Dispatches an event handled by the encryption module to encrypt the data
   *
   * @param target A node on which to dispatch the event.
   * @param data The data to encrypt
   * @param passphrase The passphrase to use in 2-way data encryption
   * @param method Encryption method to use
   * @returns Promise resolved to the encryption result
   */
  static async encrypt(target: EventTarget, data: any, passphrase: string, method: string): Promise<string | undefined> {
    const config: EncryptionEventDetail = { data, passphrase, method };
    const e = new ContextEvent<EncryptionEventDetail, string>(EncryptionEventTypes.encrypt, config);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event handled by the encryption module to decrypt the data
   *
   * @param target A node on which to dispatch the event.
   * @param data The data to decrypt
   * @param passphrase The passphrase to use to decrypt the data
   * @param method Method used to encrypt the data
   * @returns Promise resolved to the decrypted result
   */
  static async decrypt(target: EventTarget, data: any, passphrase: string, method: string): Promise<string | undefined> {
    const config: EncryptionEventDetail = { data, passphrase, method };
    const e = new ContextEvent<EncryptionEventDetail, string>(EncryptionEventTypes.decrypt, config);
    target.dispatchEvent(e);
    return e.detail.result;
  }
}
