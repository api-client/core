import { AmfNamespace as ns } from "../definitions/Namespace.js";
import { IArrayNode, IDataNode, IObjectNode, IScalarNode } from "../definitions/Shapes.js";
import { readTypedValue } from '../Utils.js';

/**
 * Base class for all schema generators based on AMF's DataNode which includes AMF's examples.
 */
export class DataNodeBase {
  /**
   * @param node The AMF data node to turn into a schema.
   * @returns Undefined when passed non-DataNode domain element.
   */
  processNode(node: IDataNode): any | undefined {
    const { types } = node;
    if (types.includes(ns.aml.vocabularies.data.Scalar)) {
      return this.processScalarNode(node as IScalarNode);
    }
    if (types.includes(ns.aml.vocabularies.data.Array)) {
      return this.processArrayNode(node as IArrayNode);
    }
    if (types.includes(ns.aml.vocabularies.data.Object)) {
      return this.processObjectNode(node as IObjectNode);
    }
    return undefined;
  }

  /**
   * @param scalar The scalar node to process.
   * @returns The scalar value.
   */
  processScalarNode(scalar: IScalarNode): any {
    return readTypedValue(scalar.value, scalar.dataType);
  }

  /**
   * @param array The array node to process.
   * @returns Array value.
   */
  processArrayNode(array: IArrayNode): any[] {
    const container: any[] = [];
    array.members.forEach((member) => {
      const result = this.processNode(member);
      if (result !== undefined) {
        container.push(result);
      }
    });
    return container;
  }

  /**
   * @param object The object node to process.
   * @returns Object value.
   */
  processObjectNode(object: IObjectNode): any {
    const container: any = {};
    const { properties } = object;
    Object.keys(properties).forEach((key) => {
      const definition = properties[key];
      const result = this.processNode(definition);
      if (typeof result !== 'undefined') {
        const name = this.normalizePropertyName(key);
        container[name] = result;
      }
    });
    return container;
  }

  /**
   * Normalizes a property name. It decodes URL encoded values.
   * @param name The property name to normalize
   */
  normalizePropertyName(name: string): string {
    let result = name;
    try {
      result = decodeURIComponent(result)
    } catch (e) {
      // ...
    }
    return result;
  }
}
