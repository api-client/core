import { DataNodeBase } from './DataNodeBase.js';
import { toXml } from '../Utils.js';
import { IDataNode } from '../definitions/Shapes.js';

export interface IDataGenerateOptions {
  /**
   * A string to prefix the generated value with. This is added before the element.
   */
  indent?: number;
}

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
  generate(node: IDataNode, shapeName?: string, opts: IDataGenerateOptions = {}): string | undefined {
    const result = this.processNode(node);
    if (!result) {
      return result;
    }
    const { indent = 0 } = opts;
    const tabs = new Array(indent).fill('  ').join('');
    if (shapeName) {
      if (Array.isArray(result)) {
        return result.map(v => `${tabs}<${shapeName}>${toXml(v)}</${shapeName}>`).filter(v => !!v).join('\n');
      }
      return `${tabs}<${shapeName}>${toXml(result)}</${shapeName}>`;
    }
    return `${toXml(result, indent)}`;
  }
}
