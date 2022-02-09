export class NtlmMessage {
  data:number[] = [];

  constructor(data?: string) {
    if (!data) {
      return;
    }
    if (data.indexOf('NTLM ') === 0) {
      data = data.substr(5);
    }
    atob(data).split('').map((c) => {
      this.data.push(c.charCodeAt(0));
    });
  }

  addByte(b: number): void {
    this.data.push(b);
  }

  addShort(s: number | string): void {
    const typed = s as number;
    this.data.push(typed & 0xFF);
    this.data.push((typed >> 8) & 0xFF);
  }

  addString(str: string, utf16?: boolean): void {
    if (utf16) {
      // Fake UTF16 by padding each character in string.
      str = str.split('').map(function(c) {
        return (c + '\0');
      }).join('');
    }
    for (let i = 0; i < str.length; i++) {
      this.data.push(str.charCodeAt(i));
    }
  }

  getString(offset: number, length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      if (offset + i >= this.data.length) {
        return '';
      }
      result += String.fromCharCode(this.data[offset + i]);
    }
    return result;
  }

  getByte(offset: number): number {
    return this.data[offset];
  }

  toBase64(): string {
    const str = String.fromCharCode.apply(null, this.data);
    return Buffer.from(str).toString('base64').replace(/.{76}(?=.)/g, '$&');
  }
}
