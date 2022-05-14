import { DataNodeBase } from './DataNodeBase.js';
import { IDataNode } from '../definitions/Shapes.js';
import { UrlEncoder } from "../../lib/parsers/UrlEncoder.js";

/** @typedef {import('../../helpers/api').ApiDataNode} ApiDataNode */

export class UrlEncodedDataNodeGenerator extends DataNodeBase {
  /**
   * Generates a JSON example from the structured value.
   * @param node The AMF's data node to transform into a schema.
   * @param shapeName When provided it wraps the returned value with the shape name.
   * @returns Undefined when passed non-DataNode domain element.
   */
  generate(node: IDataNode, shapeName?: string): string | undefined {
    const result = this.processNode(node);
    const isArray = Array.isArray(result);
    if (shapeName && (typeof result !== 'object' || isArray)) {
      if (isArray) {
        return result.map(v => `${shapeName}[]=${v}`).filter(v => !!v).join('&');
      }
      return `${shapeName}=${result}`;
    }
    return this.createUrlEncoded(result);
  }

  createUrlEncoded(obj: any): string {
    if (typeof obj !== 'object') {
      return String(obj);
    }
    const parts = Object.keys(obj).map((key) => {
      let value = obj[key];
      if (typeof value === 'object' && value !== null) {
        value = this.createUrlEncoded(value);
      } else if (value) {
        value = UrlEncoder.encodeQueryString(value, true);
      } else if (value === null) {
        value = 'null';
      }
      return `${key}=${value}`;
    });
    return parts.join('&');
  }
}
