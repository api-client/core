const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators
const regexNonASCII = /[^\0-\x7E]/; // non-ASCII chars
const maxInt = 2147483647;
const base = 36;
const tMin = 1;
const tMax = 26;
const damp = 700;
const skew = 38;
const baseMinusTMin = base - tMin;
const overflowError = 'Overflow: input needs wider integers to process';

/**
 * This is a short copy of https://github.com/mathiasbynens/punycode.js/blob/master/punycode.js
 * but written for ESM and browsers.
 * All credits to the original author: Mathias Bynens
 */
export class Punycode {
  static toASCII(input: string): string {
    let result = '';
    const parts = input.split('@');
    if (parts.length > 1) {
      result = parts[0] + '@';
      input = parts[1];
    }
    input = input.replace(regexSeparators, '\x2E');
    const labels = input.split('.');
    const encoded = labels.map((part) => {
      return regexNonASCII.test(part) ? 'xn--' + this.encode(part) : part;
    }).join('.');
    return result + encoded;
  }

  protected static encode(value: string): string {
    const output = [];
    const input = this.ucs2decode(value);
    const inputLength = input.length;
    let n = 128;
    let delta = 0;
    let bias = 72;
    for (const currentValue of input) {
      if (currentValue < 0x80) {
        output.push(String.fromCharCode(currentValue));
      }
    }
    const basicLength = output.length;
    let handledCPCount = basicLength;
    if (basicLength) {
      output.push('-');
    }
    while (handledCPCount < inputLength) {
      let m = maxInt;
      for (const currentValue of input) {
        if (currentValue >= n && currentValue < m) {
          m = currentValue;
        }
      }

      const handledCPCountPlusOne = handledCPCount + 1;
      if (m - n > Math.floor((maxInt - delta) / handledCPCountPlusOne)) {
        throw new RangeError(overflowError);
      }

      delta += (m - n) * handledCPCountPlusOne;
      n = m;

      for (const currentValue of input) {
        if (currentValue < n && ++delta > maxInt) {
          throw new RangeError(overflowError);
        }
        if (currentValue == n) {
          // Represent delta as a generalized variable-length integer.
          let q = delta;
          for (let k = base; /* no condition */; k += base) {
            const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
            if (q < t) {
              break;
            }
            const qMinusT = q - t;
            const baseMinusT = base - t;
            output.push(
              String.fromCharCode(this.digitToBasic(t + qMinusT % baseMinusT, 0))
            );
            q = Math.floor(qMinusT / baseMinusT);
          }
  
          output.push(String.fromCharCode(this.digitToBasic(q, 0)));
          bias = this.adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
          delta = 0;
          ++handledCPCount;
        }
      }
      ++delta;
      ++n;
    }
    return output.join('');
  }

  protected static digitToBasic(digit: number, flag: number): number {
    return digit + 22 + 75 * (digit < 26 ? 1 : 0) - ((flag !== 0 ? 1 : 0) << 5);
  }

  protected static adapt(delta: number, numPoints: number, firstTime: boolean): number {
    let k = 0;
    delta = firstTime ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
      delta = Math.floor(delta / baseMinusTMin);
    }
    return Math.floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
  }

  protected static ucs2decode(input: string): number[] {
    const result: number[] = [];
    let i = 0;
    const len = input.length;

    while (i < len) {
      const value = input.charCodeAt(i++);
      if (value >= 0xD800 && value <= 0xDBFF && i < len) {
        const extra = input.charCodeAt(i++);
        if ((extra & 0xFC00) == 0xDC00) {
          result.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
        } else {
          result.push(value);
          i--;
        }
      } else {
        result.push(value);
      }
    }
    return result;
  }
}
