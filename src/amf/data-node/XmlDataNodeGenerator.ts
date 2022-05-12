import { DataNodeBase } from './DataNodeBase.js';
import { toXml } from '../Utils.js';
import { IDataNode } from '../definitions/Shapes.js';
/**
 * A class that processes AMF's `structuredValue` into an XML example.
 */
export class XmlDataNodeGenerator extends DataNodeBase {
  /**
   * Generates a JSON example from the structured value.
   * 
   * @param node The AMF's data node to transform into a schema.
   * @param shapeName When provided it wraps the returned value with the shape name.
   * @returns Undefined when passed non-DataNode domain element.
   */
  generate(node: IDataNode, shapeName?: string): string | undefined {
    const result = this.processNode(node);
    if (!result) {
      return result;
    }
    if (shapeName) {
      if (Array.isArray(result)) {
        return result.map(v => `<${shapeName}>${v}</${shapeName}>`).filter(v => !!v).join('\n');
      }
      return `<${shapeName}>${result}</${shapeName}>`;
    }
    return toXml(result);
  }
}
