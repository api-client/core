/**
 * Computations related to the data like size.
 */
export class DataCalculator {
  /**
   * Computes size in the nearest units
   */
  static bytesToSize(bytes: number, decimals = 2): string {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const result = parseFloat((bytes / k**i).toFixed(dm));
    return `${result} ${sizes[i]}`;
  }

  /**
   * Calculates size of the string
   * @param str A string to compute size from.
   * @returns The size of the string.
   */
  static stringSize(str: string): number {
    if (!str || !str.length || typeof str !== 'string') {
      return 0;
    }
    let s = str.length;
    for (let i = str.length - 1; i >= 0; i--) {
      const code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) {
        s++;
      } else if (code > 0x7ff && code <= 0xffff) {
        /* istanbul ignore next */
        s += 2;
      }
      /* istanbul ignore if */
      if (code >= 0xDC00 && code <= 0xDFFF) {
        i--; // trail surrogate
      }
    }
    return s;
  }

  /**
   * @param data The size of the form data
   * @returns The size of the form data
   */
  static async formDataSize(data: FormData): Promise<number> {
    if (typeof Request === 'undefined') {
      return 0;
    }
    const request = new Request('/', {
      method: 'POST',
      body: data,
    });
    if (!request.arrayBuffer) {
      return 0;
    }
    const buffer = await request.arrayBuffer();
    return buffer.byteLength;
  }

  /**
   * Computes size of the payload.
   *
   * @param payload The payload to compute te size for 
   * @returns The size of the payload
   */
  static async payloadSize(payload: unknown): Promise<number> {
    if (!payload) {
      return 0;
    }
    if (payload instanceof ArrayBuffer) {
      return payload.byteLength;
    }
    if (typeof Buffer !== 'undefined' && payload instanceof Buffer) {
      return payload.byteLength;
    }
    if (payload instanceof Blob) {
      return payload.size;
    }
    if (payload instanceof FormData) {
      return this.formDataSize(payload);
    }
    return this.stringSize(String(payload));
  }
}
