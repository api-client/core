import { search } from '@metrichor/jmespath';
import { DataReader } from './DataReader.js';

/**
 * Reads the value from a JSON document using the the JmesPath notation.
 * See https://jmespath.org/
 */
export class JsonReader extends DataReader {
  async getValue(path: string): Promise<unknown> {
    const body = await this.readPayloadAsString();
    if (!body) {
      return undefined;
    }
    let obj: any;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      return undefined;
    }
    return search(obj, path);
  }
}
