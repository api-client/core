import { search } from '@metrichor/jmespath';
import { DataReader } from './DataReader.js';

/**
 * Reads the value from a JSON document using the the JmesPath notation.
 * See https://jmespath.org/
 * 
 * Note, after consideration this implementation is not used with ARC projects to extract 
 * request data. Instead, we use `JsonReader` that converts the JSON to XML so the same 
 * XPath can be used for both JSON and XML.
 */
export class JmesparthReader extends DataReader {
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
