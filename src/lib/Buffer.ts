/**
 * Converts base64 string to Uint8Array.
 * 
 * @returns The restored array view.
 */
export function base64ToBuffer(str: string): Uint8Array {
  const asciiString = atob(str);
  return new Uint8Array([...asciiString].map((char) => char.charCodeAt(0)));
}

/**
 * Converts incoming data to base64 string.
 * 
 * @returns Safe to store string.
 */
export function bufferToBase64(view: Buffer | Uint8Array): string {
  const str = view.reduce(
    (data, byte) => data + String.fromCharCode(byte),
    ''
  );
  return btoa(str);
}

/**
 * Reads file as ArrayBuffer
 */
export function fileToBuffer(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => { resolve(new Uint8Array(reader.result as ArrayBuffer)); };
    /* istanbul ignore next */
    reader.onerror = (): void => { reject(new Error('Unable to read file')); };
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Reads file as string
 */
export function fileToString(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => { resolve(reader.result as string); };
    /* istanbul ignore next */
    reader.onerror = (): void => { reject(new Error('Unable to read file')); };
    reader.readAsText(blob);
  });
}
