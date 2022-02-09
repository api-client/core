import { Des } from './Des.js';
import { MD4 } from './MD4.js';
import { NtlmMessage } from './NtlmMessage.js';

export interface INtlmAuthConfig {
  domain?: string;
  username: string;
  password: string;
  url: string;
}

/**
 * A base class for auth methods used in the library.
 * On the base of https://github.com/erlandranvinge/ntlm.js/blob/master/ntlm.js
 */
 export class NtlmAuth {
  domain: string;
  uid: string;
  passwd: string;
  url: string;
  lmHashedPassword?: string;
  ntHashedPassword?: string;

  constructor(opts: INtlmAuthConfig) {
    this.domain = opts.domain || '';
    this.uid = opts.username;
    this.passwd = opts.password;
    this.url = opts.url;

    this.setCredentials();
  }

  createMessage1(hostname: string): NtlmMessage {
    const msg1 = new NtlmMessage();
    msg1.addString('NTLMSSP\0');
    msg1.addByte(1);
    msg1.addString('\0\0\0');
    msg1.addShort(0xb203);
    msg1.addString('\0\0');
    msg1.addShort(this.domain.length);
    msg1.addShort(this.domain.length);
    msg1.addShort(32 + hostname.length);
    msg1.addString('\0\0');
    msg1.addShort(hostname.length);
    msg1.addShort(hostname.length);
    msg1.addShort(32);
    msg1.addString('\0\0');
    msg1.addString(hostname.toUpperCase());
    msg1.addString(this.domain.toUpperCase());
    return msg1;
  }

  getChallenge(data: string): string {
    const msg2 = new NtlmMessage(data);
    if (msg2.getString(0, 8) !== 'NTLMSSP\0') {
      throw new Error('Invalid NTLM response header.');
    }
    if (msg2.getByte(8) !== 2) {
      throw new Error('Invalid NTLM response type.');
    }
    const challenge = msg2.getString(24, 8);
    return challenge;
  }

  createMessage3(challenge: string, hostname: string): NtlmMessage {
    const lmResponse = this.buildResponse(this.lmHashedPassword as string, challenge);
    const ntResponse = this.buildResponse(this.ntHashedPassword as string, challenge);
    const username = this.uid;
    const domain = this.domain;
    const msg3 = new NtlmMessage();

    msg3.addString('NTLMSSP\0');
    msg3.addByte(3);
    msg3.addString('\0\0\0');

    msg3.addShort(24); // lmResponse
    msg3.addShort(24);
    msg3.addShort(64 + (domain.length + username.length + hostname.length) * 2);
    msg3.addString('\0\0');

    msg3.addShort(24); // ntResponse
    msg3.addShort(24);
    msg3.addShort(88 + (domain.length + username.length + hostname.length) * 2);
    msg3.addString('\0\0');

    msg3.addShort(domain.length * 2); // Domain.
    msg3.addShort(domain.length * 2);
    msg3.addShort(64);
    msg3.addString('\0\0');

    msg3.addShort(username.length * 2); // Username.
    msg3.addShort(username.length * 2);
    msg3.addShort(64 + domain.length * 2);
    msg3.addShort('\0\0');

    msg3.addShort(hostname.length * 2); // Hostname.
    msg3.addShort(hostname.length * 2);
    msg3.addShort(64 + (domain.length + username.length) * 2);
    msg3.addString('\0\0');

    msg3.addString('\0\0\0\0');
    msg3.addShort(112 + (domain.length + username.length + hostname.length) * 2);
    msg3.addString('\0\0');
    msg3.addShort(0x8201);
    msg3.addString('\0\0');

    msg3.addString(domain.toUpperCase(), true); // "Some" string are passed as UTF-16.
    msg3.addString(username, true);
    msg3.addString(hostname.toUpperCase(), true);
    msg3.addString(lmResponse);
    msg3.addString(ntResponse);

    return msg3;
  }

  createKey(str: string): string {
    const key56: number[] = [];
    while (str.length < 7) {
      str += '\0';
    }
    str = str.substr(0, 7);
    str.split('').map((c) => {
      key56.push(c.charCodeAt(0));
    });
    const key = [0, 0, 0, 0, 0, 0, 0, 0];
    key[0] = key56[0]; // Convert 56 bit key to 64 bit.
    key[1] = ((key56[0] << 7) & 0xFF) | (key56[1] >> 1);
    key[2] = ((key56[1] << 6) & 0xFF) | (key56[2] >> 2);
    key[3] = ((key56[2] << 5) & 0xFF) | (key56[3] >> 3);
    key[4] = ((key56[3] << 4) & 0xFF) | (key56[4] >> 4);
    key[5] = ((key56[4] << 3) & 0xFF) | (key56[5] >> 5);
    key[6] = ((key56[5] << 2) & 0xFF) | (key56[6] >> 6);
    key[7] = (key56[6] << 1) & 0xFF;
    for (let i = 0; i < key.length; i++) { // Fix DES key parity bits.
      let bit = 0;
      for (let k = 0; k < 7; k++) {
        const t = key[i] >> k;
        bit = (t ^ bit) & 0x1;
      }
      key[i] = (key[i] & 0xFE) | bit;
    }

    let result = '';
    key.forEach((i) => {
      result += String.fromCharCode(i);
    });
    return result;
  }

  buildResponse(key: string, text: string): string {
    while (key.length < 21) {
      key += '\0';
    }
    const key1 = this.createKey(key.substr(0, 7));
    const key2 = this.createKey(key.substr(7, 7));
    const key3 = this.createKey(key.substr(14, 7));
    return Des.des(key1, text, 1, 0) +
      Des.des(key2, text, 1, 0) +
      Des.des(key3, text, 1, 0);
  }

  // to be called by constructor
  setCredentials(): void {
    const domain = this.domain;
    const password = this.passwd;
    const magic = 'KGS!@#$%'; // Create LM password hash.
    let lmPassword = password.toUpperCase().substr(0, 14);
    while (lmPassword.length < 14) {
      lmPassword += '\0';
    }
    const key1 = this.createKey(lmPassword);
    const key2 = this.createKey(lmPassword.substr(7));
    const lmHashedPassword = Des.des(key1, magic, 1, 0) +
      Des.des(key2, magic, 1, 0);

    let ntPassword = ''; // Create NT password hash.
    for (let i = 0; i < password.length; i++) {
      ntPassword += password.charAt(i) + '\0';
    }
    const ntHashedPassword = MD4.str(ntPassword);

    this.domain = domain;
    this.lmHashedPassword = lmHashedPassword;
    this.ntHashedPassword = ntHashedPassword;
  }
}
