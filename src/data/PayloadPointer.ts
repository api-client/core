import { Payload } from '../lib/transformers/PayloadSerializer.js';
import { JsonReader } from './JsonReader.js'
import { XmlReader } from './XmlReader.js'
import { UrlEncodedReader } from './UrlEncodedReader.js'
import { DataReader } from './DataReader.js'

/**
 * A class that creates a pointer to a value in a Payload.
 */
export class PayloadPointer {
  payload?: Payload;
  mime?: string;
  path: string;

  /**
   * @param path The path to the data.
   * @param payload The Payload value. Note, without the payload the `getValue()` always returns `undefined`. This is optional for convenience.
   * @param mime The content type of the body message. Note, without the payload's mime the `getValue()` always returns `undefined`. This is optional for convenience.
   */
  constructor(path: string, payload?: Payload, mime?: string) {
    this.path = path;
    this.payload = payload;
    this.mime = mime;
  }

  /**
   * @returns the value for the `path`.
   */
  async getValue(): Promise<unknown> {
    const { path, payload, mime } = this;
    if (!mime || !path || !payload) {
      return undefined;
    }
    let reader: DataReader | undefined;
    if (mime.includes('json')) {
      reader = new JsonReader();
    } else if (mime.includes('xml')) {
      reader = new XmlReader();
    } else if (mime.includes('x-www-form-urlencoded')) {
      reader = new UrlEncodedReader();
    }
    if (!reader) {
      return undefined;
    }
    reader.payload = payload;
    return reader.getValue(path);
  }
}
