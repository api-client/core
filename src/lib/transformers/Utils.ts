/**
 * Converts blob data to base64 string.
 *
 * @param blob File or blob object to be translated to string
 * @return Promise resolved to a base64 string data from the file.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = (): void => {
      resolve(String(reader.result));
    };
    reader.onerror = (): void => {
      reject(new Error('Unable to convert blob to string.'));
    };
    reader.readAsDataURL(blob);
  });
}
