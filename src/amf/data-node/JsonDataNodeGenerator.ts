import { IDataNode } from '../definitions/Shapes.js';
import { DataNodeBase } from './DataNodeBase.js';

/** @typedef {import('../../helpers/api').ApiDataNode} ApiDataNode */

/**
 * A class that processes AMF's `structuredValue` into a JSON example.
 */
export class JsonDataNodeGenerator extends DataNodeBase {
  /**
   * Generates a JSON schema from the AMF's DataNode.
   * 
   * @param node The AMF's data node to transform into a schema.
   * @returns Undefined when passed non-DataNode domain element.
   */
  generate(node: IDataNode): string | undefined {
    const result = this.processNode(node);
    if (!result) {
      return result;
    }
    if (typeof result === 'string') {
      return result;
    }
    return JSON.stringify(result, null, 2);
  }
}
