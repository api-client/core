import { DataReader } from './DataReader.js';

/**
 * Reads a value for a property in an `application/x-www-form-urlencoded` body.
 */
export class UrlEncodedReader extends DataReader {
  /**
   * @param path Since the `application/x-www-form-urlencoded` is a key-value pair this can be just a simple name of the property to read.
   * @returns The value of the property or undefined.
   */
  async getValue(path: string): Promise<unknown> {
    const body = await this.readPayloadAsString();
    const parsed = new URLSearchParams(body);
    const result = parsed.get(path);
    if (result === null) {
      return undefined;
    }
    return result;
  }
}
