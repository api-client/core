/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD4 Message
 * Digest Algorithm, as defined in RFC 1320.
 * Version 2.1 Copyright (C) Jerrad Pierce, Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
export class MD4 {
  static str(s: string): string {
    return MD4.binl2str(MD4.core(MD4.str2binl(s), s.length * MD4.chrsz));
  }

  static core(x: any[], len: number): number[] {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;

    for (let i = 0; i < x.length; i += 16) {
      const olda = a;
      const oldb = b;
      const oldc = c;
      const oldd = d;

      a = MD4.ff(a, b, c, d, x[i + 0], 3);
      d = MD4.ff(d, a, b, c, x[i + 1], 7);
      c = MD4.ff(c, d, a, b, x[i + 2], 11);
      b = MD4.ff(b, c, d, a, x[i + 3], 19);
      a = MD4.ff(a, b, c, d, x[i + 4], 3);
      d = MD4.ff(d, a, b, c, x[i + 5], 7);
      c = MD4.ff(c, d, a, b, x[i + 6], 11);
      b = MD4.ff(b, c, d, a, x[i + 7], 19);
      a = MD4.ff(a, b, c, d, x[i + 8], 3);
      d = MD4.ff(d, a, b, c, x[i + 9], 7);
      c = MD4.ff(c, d, a, b, x[i + 10], 11);
      b = MD4.ff(b, c, d, a, x[i + 11], 19);
      a = MD4.ff(a, b, c, d, x[i + 12], 3);
      d = MD4.ff(d, a, b, c, x[i + 13], 7);
      c = MD4.ff(c, d, a, b, x[i + 14], 11);
      b = MD4.ff(b, c, d, a, x[i + 15], 19);

      a = MD4.gg(a, b, c, d, x[i + 0], 3);
      d = MD4.gg(d, a, b, c, x[i + 4], 5);
      c = MD4.gg(c, d, a, b, x[i + 8], 9);
      b = MD4.gg(b, c, d, a, x[i + 12], 13);
      a = MD4.gg(a, b, c, d, x[i + 1], 3);
      d = MD4.gg(d, a, b, c, x[i + 5], 5);
      c = MD4.gg(c, d, a, b, x[i + 9], 9);
      b = MD4.gg(b, c, d, a, x[i + 13], 13);
      a = MD4.gg(a, b, c, d, x[i + 2], 3);
      d = MD4.gg(d, a, b, c, x[i + 6], 5);
      c = MD4.gg(c, d, a, b, x[i + 10], 9);
      b = MD4.gg(b, c, d, a, x[i + 14], 13);
      a = MD4.gg(a, b, c, d, x[i + 3], 3);
      d = MD4.gg(d, a, b, c, x[i + 7], 5);
      c = MD4.gg(c, d, a, b, x[i + 11], 9);
      b = MD4.gg(b, c, d, a, x[i + 15], 13);

      a = MD4.hh(a, b, c, d, x[i + 0], 3);
      d = MD4.hh(d, a, b, c, x[i + 8], 9);
      c = MD4.hh(c, d, a, b, x[i + 4], 11);
      b = MD4.hh(b, c, d, a, x[i + 12], 15);
      a = MD4.hh(a, b, c, d, x[i + 2], 3);
      d = MD4.hh(d, a, b, c, x[i + 10], 9);
      c = MD4.hh(c, d, a, b, x[i + 6], 11);
      b = MD4.hh(b, c, d, a, x[i + 14], 15);
      a = MD4.hh(a, b, c, d, x[i + 1], 3);
      d = MD4.hh(d, a, b, c, x[i + 9], 9);
      c = MD4.hh(c, d, a, b, x[i + 5], 11);
      b = MD4.hh(b, c, d, a, x[i + 13], 15);
      a = MD4.hh(a, b, c, d, x[i + 3], 3);
      d = MD4.hh(d, a, b, c, x[i + 11], 9);
      c = MD4.hh(c, d, a, b, x[i + 7], 11);
      b = MD4.hh(b, c, d, a, x[i + 15], 15);

      a = MD4.safeAdd(a, olda);
      b = MD4.safeAdd(b, oldb);
      c = MD4.safeAdd(c, oldc);
      d = MD4.safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }

  static cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return MD4.safeAdd(MD4.rol(MD4.safeAdd(MD4.safeAdd(a, q), MD4.safeAdd(x, t)), s), b);
  }

  static ff(a: number, b: number, c: number, d: number, x: number, s: number): number {
    return MD4.cmn((b & c) | ((~b) & d), a, 0, x, s, 0);
  }

  static gg(a: number, b: number, c: number, d: number, x: number, s: number): number {
    return MD4.cmn((b & c) | (b & d) | (c & d), a, 0, x, s, 1518500249);
  }

  static hh(a: number, b: number, c: number, d: number, x: number, s: number): number {
    return MD4.cmn(b ^ c ^ d, a, 0, x, s, 1859775393);
  }

  static safeAdd(x: number, y: number): number {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }

  static rol(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  static str2binl(str: string): number[] {
    const bin: number[] = [];
    const mask = (1 << MD4.chrsz) - 1;
    for (let i = 0; i < str.length * MD4.chrsz; i += MD4.chrsz) {
      bin[i >> 5] |= (str.charCodeAt(i / MD4.chrsz) & mask) << (i % 32);
    }
    return bin;
  }

  static binl2str(bin: number[]): string {
    let str = '';
    const mask = (1 << MD4.chrsz) - 1;
    for (let i = 0; i < bin.length * 32; i += MD4.chrsz) {
      str += String.fromCharCode((bin[i >> 5] >>> (i % 32)) & mask);
    }
    return str;
  }

  static get chrsz(): number {
    return 8;
  }
}
