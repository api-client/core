import { Core as JsonCore } from '@api-client/json';
import { AmfNamespace as ns } from "../definitions/Namespace.js";
import { ShapeBase } from './ShapeBase.js';
import { XmlDataNodeGenerator } from '../data-node/XmlDataNodeGenerator.js';
import { collectNodeProperties, formatXmlValue, getUnionMember } from '../Utils.js';
import { IAnyShape, IArrayShape, IDataExample, IDataNodeUnion, INodeShape, IPropertyShape, IScalarShape, IShapeUnion, IUnionShape } from "../definitions/Shapes.js";

interface IProcessNodeOptions {
  forceName?: string;
  indent?: number;
  noWrap?: boolean;
}

interface ICollectExamplesOptions {
  nodeName?: string; 
  indent?: number;
  isWrapped?: boolean;
  tagFill?: string;
}

/**
 * Normalizes given name to a value that can be accepted by `createElement`
 * function on a document object.
 * @param name A name to process
 * @returns The normalized name
 */
export const normalizeXmlTagName = (name: string): string => name.replace(/[^a-zA-Z0-9-_.]/g, '');
const UNKNOWN_TYPE = 'unknown-type';

export function shapeToXmlTagName(shape: IAnyShape): string {
  const { name, inherits=[], xmlSerialization } = shape;
  let label: string | undefined = xmlSerialization && xmlSerialization.name ? xmlSerialization.name : name || UNKNOWN_TYPE;
  if (label === 'schema' && inherits.length) {
    const n = inherits.find(i => i.name && i.name !== 'schema');
    if (n) {
      label = n.name === 'type' ? n.displayName || n.name : n.name;
    }
  }
  return normalizeXmlTagName(String(label));
}

export class ShapeXmlSchemaGenerator extends ShapeBase {
  /**
   * Generates a XML example from the structured value.
   * 
   * @param schema The Shape definition
   */
  generate(schema: IShapeUnion): string {
    const value = this.processNode(schema);
    return value;
  }

  /**
   * Processes the Shape definition and returns a JavaScript object or array.
   */
  processNode(schema: IShapeUnion, options: IProcessNodeOptions = {}): string {
    const { types } = schema;
    if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
      return this._scalarShapeObject(schema as IScalarShape, options);
    }
    if (types.includes(ns.w3.shacl.NodeShape)) {
      return this._nodeShapeObject(schema as INodeShape, options);
    }
    if (types.includes(ns.aml.vocabularies.shapes.UnionShape)) {
      return this._unionShapeObject(schema as IUnionShape);
    }
    if (types.includes(ns.aml.vocabularies.shapes.FileShape)) {
      return this._fileShapeObject();
    }
    if (types.includes(ns.aml.vocabularies.shapes.SchemaShape)) {
      return this._schemaShapeObject();
    }
    if (types.includes(ns.aml.vocabularies.shapes.TupleShape)) {
      return this._tupleShapeObject();
    }
    if (types.includes(ns.aml.vocabularies.shapes.ArrayShape) || types.includes(ns.aml.vocabularies.shapes.MatrixShape)) {
      return this._arrayShapeObject(schema as IArrayShape, options);
    }
    return this._anyShapeObject(schema as IAnyShape);
  }

  /**
   * Serializes generated JS value according to the mime type.
   */
  serialize(value: any): string|undefined {
    return value;
  }

  /**
   * Picks the union member to render.
   */
  protected _readCurrentUnion(anyOf: IShapeUnion[]): IShapeUnion {
    const { selectedUnions } = this.opts;
    return getUnionMember(anyOf, selectedUnions);
  }

  protected _collectProperties(schema: INodeShape): IPropertyShape[] {
    const { selectedUnions } = this.opts;
    return collectNodeProperties(schema, selectedUnions);
  }

  protected _nodeShapeObject(schema: INodeShape, options: IProcessNodeOptions={}): string {
    const label = options.forceName || shapeToXmlTagName(schema);
    const parts = [];
    const currentIndent = (options.indent || 0);
    const exampleValue = this._collectExamples(schema, {
      tagFill: new Array(currentIndent * 2 + 0).fill(' ').join(''),
      indent: currentIndent + 1,
      nodeName: label,
    });
    if (exampleValue) {
      return exampleValue;
    }
    const attributes: string[] = [];
    const properties = this._collectProperties(schema);
    properties.forEach((property) => {
      const { range, minCount=0 } = property;
      if (minCount === 0 && !this.opts.renderOptional || !range) {
        return;
      }
      const anyRange = range as IAnyShape;
      if (anyRange.xmlSerialization) {
        // Adds to the parent attributes list.
        // When a non-scalar shape has `attribute` serialization this is an API spec error.
        // Ignore such situation.
        if (anyRange.xmlSerialization.attribute && anyRange.types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
          let aLabel = normalizeXmlTagName(anyRange.xmlSerialization.name ? anyRange.xmlSerialization.name : property.name || anyRange.name || UNKNOWN_TYPE);
          if (anyRange.xmlSerialization.prefix) {
            aLabel = `${anyRange.xmlSerialization.prefix}:${aLabel}`;
          }
          const value = this._scalarValue(anyRange);
          attributes.push(`${aLabel}="${value}"`);
          return;
        }
      }
      const value = this._propertyShapeObject(property, { indent: currentIndent });
      if (typeof value !== 'undefined') {
        const fill = new Array(currentIndent * 2 + 2).fill(' ').join('');
        parts.push(formatXmlValue(fill, value));
      }
    });

    let opening = `<${label}`;
    if (attributes.length) {
      opening += ' ';
      opening += attributes.join(' ');
    }
    parts.unshift(`${opening}>`);
    const fill = new Array(currentIndent*2).fill(' ').join('');
    parts.push(`${fill}</${label}>`);
    return parts.join('\n');
  }

  protected _scalarShapeObject(schema: IScalarShape, options: IProcessNodeOptions={}): any {
    const { xmlSerialization, defaultValue } = schema;
    let content;
    if (defaultValue) {
      const gen = new XmlDataNodeGenerator();
      content = gen.processNode(defaultValue);
    } else {
      content = this._scalarValue(schema);
    }
    let label = options.forceName || shapeToXmlTagName(schema);
    const attributes = [];
    const parts = [];
    if (xmlSerialization) {
      const { namespace, prefix } = xmlSerialization;
      if (namespace) {
        const attrName = prefix ? `xmlns:${prefix}` : 'xmlns';
        attributes.push(`${attrName}="${namespace}"`);
      }
      if (prefix) {
        label = `${prefix}:${label}`;
      }
    }
    let opening = `<${label}`;
    if (attributes.length) {
      opening += ' ';
      opening += attributes.join(' ');
    }
    opening += '>';
    parts.push(opening);
    parts.push(content);
    parts.push(`</${label}>`);
    
    return parts.join('');
  }

  protected _nilShapeObject(schema: IScalarShape, options: IProcessNodeOptions={}): any|undefined {
    const { xmlSerialization } = schema;
    const content = '';
    let label = options.forceName || shapeToXmlTagName(schema);
    const attributes = [];
    const parts = [];
    if (xmlSerialization) {
      const { namespace, prefix } = xmlSerialization;
      if (namespace) {
        const attrName = prefix ? `xmlns:${prefix}` : 'xmlns';
        attributes.push(`${attrName}="${namespace}"`);
      }
      if (prefix) {
        label = `${prefix}:${label}`;
      }
    }
    let opening = `<${label}`;
    if (attributes.length) {
      opening += ' ';
      opening += attributes.join(' ');
    }
    opening += '>';
    parts.push(opening);
    parts.push(content);
    parts.push(`</${label}>`);
    
    return parts.join('');
  }

  /**
   * @returns The value for the property or undefined when cannot generate the value.
   */
  protected _propertyShapeObject(schema: IPropertyShape, options: IProcessNodeOptions = {}): string|undefined {
    const { range, minCount=0 } = schema;
    if (minCount === 0 && !this.opts.renderOptional || !range) {
      return undefined;
    }
    const { types } = range;
    const name = shapeToXmlTagName(schema as IAnyShape);
    if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
      return this._scalarShapeObject(range as IScalarShape, { ...options });
    } 
    if (types.includes(ns.aml.vocabularies.shapes.NilShape)) {
      return this._nilShapeObject(range as IScalarShape, { ...options, forceName: name });
    }
    if (types.includes(ns.aml.vocabularies.shapes.RecursiveShape)) {
      return undefined;
    }
    if (types.includes(ns.w3.shacl.NodeShape)) {
      return this._nodePropertyObject(schema as IPropertyShape<INodeShape>, options);
    }
    if (types.includes(ns.aml.vocabularies.shapes.ArrayShape) || types.includes(ns.aml.vocabularies.shapes.MatrixShape)) {
      return this._nodePropertyArray(schema as IPropertyShape<IArrayShape>, options);
    }
    return this.processNode(range, { ...options, forceName: name });
  }

  protected _collectExamples(schema: IShapeUnion, opts: ICollectExamplesOptions = {}): string | undefined {
    if (!this.opts.renderExamples) {
      return undefined;
    }
    const { isWrapped, nodeName, tagFill='', indent = 0  } = opts;
    let { examples=[] } = (schema as IAnyShape);
    const { inherits } = schema;
    if (Array.isArray(inherits) && inherits.length) {
      inherits.forEach((parent) => {
        let node = parent;
        if (node.types.includes(ns.aml.vocabularies.shapes.UnionShape)) {
          const union = node as IUnionShape;
          const { anyOf=[] } = union;
          node = this._readCurrentUnion(anyOf);
        }
        const anyShape = node as IAnyShape;
        if (Array.isArray(anyShape.examples) && anyShape.examples.length) {
          examples = examples.concat(anyShape.examples);
        }
      });
    }
    
    const validExamples = examples.filter(item => !!item.structuredValue);
    if (!validExamples.length) {
      return undefined;
    }
    const parts: string[] = [];
    if (isWrapped) {
      parts.push(`${tagFill}<${nodeName}>`);
    }
    const generator = new XmlDataNodeGenerator();
    validExamples.forEach((item) => {
      const value = generator.generate(item.structuredValue!, nodeName, {
        indent: indent + 1,
      });
      if (value !== undefined) {
        parts.push(value);
      }
    });
    if (isWrapped) {
      parts.push(`${tagFill}</${nodeName}>`);
    }
    return parts.join('\n');
  }

  protected _createTabs(indent: number = 0, offset: number = 0): string {
    return new Array(indent * 2 + offset).fill(' ').join('');
  }

  protected _nodePropertyObject(schema: IPropertyShape<INodeShape>, options: IProcessNodeOptions = {}): string {
    const parts: string[] = [];
    const name = normalizeXmlTagName(String(schema.name));
    const { indent=0 } = options;
    const baseTabs = this._createTabs(indent);
    let value: string;
    const range = schema.range as INodeShape;
    const exampleValue = this._collectExamples(range, {
      tagFill: baseTabs,
      indent: indent + 1,
      nodeName: name,
    });
    const attributes: string[] = [];
    if (exampleValue) {
      value = exampleValue;
    } else {
      const propertyParts: string[] = [];
      const properties = this._collectProperties(range);
      
      properties.forEach((property) => {
        const { range, minCount=0 } = property;
        if (minCount === 0 && !this.opts.renderOptional) {
          return;
        }
        const anyRange = range as IAnyShape;
        
        if (anyRange.xmlSerialization) {
          const { prefix, attribute } = anyRange.xmlSerialization;
          if (attribute && anyRange.types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
            let aLabel = normalizeXmlTagName(anyRange.xmlSerialization.name ? anyRange.xmlSerialization.name : property.name || anyRange.name || UNKNOWN_TYPE);
            if (prefix) {
              aLabel = `${prefix}:${aLabel}`;
            }
            const value = this._scalarValue(anyRange);
            attributes.push(`${aLabel}="${value}"`);
            return;
          }
        }
        const value = this._propertyShapeObject(property, { indent });
        if (value !== undefined) {
          const fill = this._createTabs(indent, 2);
          propertyParts.push(formatXmlValue(fill, value));
        }
      });

      value = propertyParts.join('\n');
    }
    let opening = `${baseTabs}<${name}`;
    if (attributes.length) {
      opening += ' ';
      opening += attributes.join(' ');
    }
    parts.unshift(`${opening}>`);
    parts.push(value);
    parts.push(`${baseTabs}</${name}>`);
    return parts.join('\n');
  }

  protected _nodePropertyArray(schema: IPropertyShape<IArrayShape>, options: IProcessNodeOptions = {}): string {
    const range = schema.range as IArrayShape;    
    const parts: string[] = [];
    let name: string;
    if (range.xmlSerialization && range.xmlSerialization.name) {
      name = normalizeXmlTagName(range.xmlSerialization.name);
    } else {
      name = normalizeXmlTagName(String(schema.name));
    }
    const { indent=0 } = options;
    const isScalarItems = !!range.items && range.items.types.includes(ns.aml.vocabularies.shapes.ScalarShape);

    const baseTabs = this._createTabs(indent);
    if (!isScalarItems) {
      parts.push(`${baseTabs}<${name}>`);
    }

    const result = this._arrayShapeObject(range, { ...options, indent });
    parts.push(result);
    if (!isScalarItems) {
      parts.push(`${baseTabs}</${name}>`);
    }
    return parts.join('\n');
  }

  protected _arrayShapeObject(schema: IArrayShape, options: IProcessNodeOptions={}): string {
    const { items } = schema;
    const isScalarItems = !!items && items.types.includes(ns.aml.vocabularies.shapes.ScalarShape);
    // the name is either from the XML serialization info, or the parent property.
    // IT IS NOT THE `item`'s name unless its a scalar.
    let nodeName: string | undefined;

    // if (isScalarItems && schema.name) {
    //   nodeName = normalizeXmlTagName(schema.name);
    // } else if (!isScalarItems && items?.name) {
    //   nodeName = normalizeXmlTagName(items.name);
    // }

    if (!isScalarItems && items?.name) {
      nodeName = normalizeXmlTagName(items.name);
    } else if (schema.name) {
      nodeName = normalizeXmlTagName(schema.name);
    }
    // wrapping can only be defined on the array shape and it "wraps" the generated
    // content into an element that has the same name as the items
    const isWrapped = !!schema.xmlSerialization && !!schema.xmlSerialization.wrapped;
    
    const currentIndent = (options.indent || 0);
    const tagFill = new Array((currentIndent) * 2 + 0).fill(' ').join('');
    const valueFill = new Array((currentIndent) * 2 + (isWrapped ? 2 : 0)).fill(' ').join('');
    // let's start with examples
    if (this.opts.renderExamples) {
      let { examples=[] } = schema;
      const validExamples = examples.filter(item => !!item.structuredValue);
      if (validExamples.length) {
        const parts: string[] = [];
        const generator = new XmlDataNodeGenerator();

        // scalar items are always wrapped with it's own range
        if (isScalarItems && !isWrapped) {
          const [example] = validExamples;
          if (!nodeName && items?.name) {
            nodeName = normalizeXmlTagName(items.name);
          }
          const value = generator.generate(example.structuredValue!, nodeName, {
            indent: currentIndent,
          });
          if (value !== undefined) {
            parts.push(value);
          }
        } else if (isScalarItems && isWrapped) {
          const [example] = validExamples;
          const value = generator.generate(example.structuredValue!, nodeName, {
            indent: currentIndent,
          });
          parts.push(`${tagFill}<${nodeName}>`);
          if (value !== undefined) {
            parts.push(value);
          }
          parts.push(`${tagFill}</${nodeName}>`);
        } else if (isWrapped) {
          // when wrapped we wrap each example into the "name", else we render all examples under the "name".
          validExamples.forEach((item) => {
            parts.push(`${tagFill}<${nodeName}>`);
            const value = generator.generate(item.structuredValue!, /* nodeName */ undefined, {
              indent: currentIndent + 2,
            });
            if (value !== undefined) {
              parts.push(value);
            }
            parts.push(`${tagFill}</${nodeName}>`);
          });
        } else {
          validExamples.forEach((item) => {
            const value = generator.generate(item.structuredValue!, /* nodeName */ undefined, {
              indent: currentIndent,
            });
            if (value !== undefined) {
              parts.push(value);
            }
          });
        }
        return parts.join('\n');
      }
    }
    
    if (isScalarItems && schema.defaultValue) {
      const gen = new XmlDataNodeGenerator();
      const value = gen.generate(schema.defaultValue);
      if (!nodeName && items?.name) {
        nodeName = normalizeXmlTagName(items.name);
      }
      return `<${nodeName}>${value?.trim()}</${nodeName}>`;
    }
    
    if (items) {
      const parts: string[] = [];
      if (isWrapped && isScalarItems) {
        parts.push(`${tagFill}<${nodeName}>`);
      }
      const init: IProcessNodeOptions = {
        indent: currentIndent + 1,
      }
      if (nodeName) {
        init.forceName = nodeName;
      }
      const value = this.processNode(items, init);
      if (value !== undefined) {
        parts.push(`${valueFill}${value}`);
      }
      if (isWrapped && isScalarItems) {
        parts.push(`${tagFill}</${nodeName}>`);
      }
      return parts.join('\n');
    }

    return '';

    // const isScalarItems = !!items && items.types.includes(ns.aml.vocabularies.shapes.ScalarShape);
    // if (items) {
    //   if (items.types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
    //     return this._scalarItems(schema as IArrayShape<IScalarShape>, options);
    //   }
    //   if (items.types.includes(ns.w3.shacl.NodeShape)) {
    //     return this._nodeItems(schema as IArrayShape<INodeShape>, options);
    //   }
    // }
    
    // let label = shapeToXmlTagName(schema);
    // if (label === UNKNOWN_TYPE && isScalarItems) {
    //   // label = shapeToXmlTagName(items as IScalarShape);
    // }

    // const currentIndent = (options.indent || 0);
    // const rootFill = new Array(currentIndent*2).fill(' ').join('');
    // const parts = [
    //   `${rootFill}<${label}>`
    // ];
    // let nodeName = label;
    // const anyItems = items as IAnyShape;
    // if (anyItems.xmlSerialization && anyItems.xmlSerialization.name) {
    //   nodeName = normalizeXmlTagName(anyItems.xmlSerialization.name);
    // }
    // // Note about wrapping. 
    // // XML array values are not wrapped by default. This means that by default 
    // // it produces a value like this:
    // // <ParentArray>
    // //   <arrayMemberProperty></arrayMemberProperty>
    // // </ParentArray>
    // // 
    // // When the object is marked as wrapped then the object is rendered as follows
    // // 
    // // <ParentArray>
    // //   <MemberObject>
    // //     <arrayMemberProperty></arrayMemberProperty>
    // //   <MemberObject>
    // // </ParentArray>
    // const isWrapped = xmlSerialization && !!xmlSerialization.wrapped;
    // const defaultValue = schema.defaultValue || items && items.defaultValue;
    // let itemName;
    // if (isWrapped) {
    //   try {
    //     itemName = shapeToXmlTagName(items as IAnyShape);
    //   } catch (e) {
    //     itemName = 'UNKNOWN-NAME'
    //   }
    // }
    // let { examples=[] } = schema;
    // if (Array.isArray(anyItems.examples)) {
    //   examples = examples.concat(anyItems.examples);
    // }
    // if (this.opts.renderExamples && examples && examples.length) {
    //   const example = examples.find((item) => !!item.structuredValue);
    //   const value = this._exampleToObject(example);
    //   if (typeof value !== 'undefined') {
    //     const tagFill = new Array(currentIndent * 2 + 2).fill(' ').join('');
    //     const valueFill = new Array(currentIndent * 2 + 4).fill(' ').join('');
    //     parts.push(`${tagFill}<${nodeName}>`);
    //     parts.push(`${valueFill}${value}`);
    //     parts.push(`${tagFill}</${nodeName}>`);
    //   }
    // } else if (defaultValue) {
    //   const gen = new XmlDataNodeGenerator();
    //   const value = gen.generate(defaultValue);
    //   if (value) {
    //     const tagFill = new Array(currentIndent * 2 + 2).fill(' ').join('');
    //     const valueFill = new Array(currentIndent * 2 + 4).fill(' ').join('');
    //     parts.push(`${tagFill}<${nodeName}>`);
    //     parts.push(`${valueFill}${value.trim()}`);
    //     parts.push(`${tagFill}</${nodeName}>`);
    //   }
    // } else if (items && items.types.includes(ns.w3.shacl.NodeShape)) {
    //   const typed = items as INodeShape;
    //   const tagFill = new Array(currentIndent * 2 + 2).fill(' ').join('');
    //   const valueFill = isWrapped ? new Array(currentIndent * 2 + 4).fill(' ').join('') : tagFill;
    //   if (isWrapped) {
    //     parts.push(`${tagFill}<${itemName}>`);
    //   }
    //   const properties = this._collectProperties(typed);
    //   properties.forEach((prop) => {
    //     const value = this._propertyShapeObject(prop);
    //     if (value) {
    //       parts.push(`${valueFill}${value}`);
    //     }
    //   });
    //   if (isWrapped) {
    //     parts.push(`${tagFill}</${itemName}>`);
    //   }
    // } else if (items) {
    //   let name = shapeToXmlTagName(items as IAnyShape);
    //   if (name === UNKNOWN_TYPE) {
    //     name = label;
    //   }
    //   const opts = {
    //     forceName: name,
    //     indent: currentIndent + 1,
    //   };
    //   const value = items && this.processNode(items, opts);
    //   if (typeof value !== 'undefined') {
    //     const fill = new Array(currentIndent * 2 + 2).fill(' ').join('');
    //     parts.push(`${fill}${value}`);
    //   }
    // }
    
    // parts.push(`${rootFill}</${label}>`);
    // return parts.join('\n');
  }

  /**
   * Creates an example from an array shape when the items is the scalar shape.
   * Note, it assumes the previous step tested whether the `items` is scalar.
   * 
   * @param schema The array schema
   * @param options Processing options.
   */
  protected _scalarItems(schema: IArrayShape<IScalarShape>, options: IProcessNodeOptions={}): string {
    const items = schema.items as IScalarShape;
    const currentIndent = (options.indent || 0);
    const tagFill = new Array(currentIndent * 2).fill(' ').join('');

    let nodeName = '';
    if (items.xmlSerialization && items.xmlSerialization.name) {
      nodeName = normalizeXmlTagName(items.xmlSerialization.name);
    } else {
      nodeName = shapeToXmlTagName(schema.name ? schema : items);
    }

    // let's start with examples
    if (this.opts.renderExamples) {
      let { examples=[] } = schema;
      if (Array.isArray(items.examples)) {
        examples = examples.concat(items.examples);
      }
      const validExamples = examples.filter(item => !!item.structuredValue);
      if (validExamples.length) {
        const parts: string[] = [];
        const generator = new XmlDataNodeGenerator();
        validExamples.forEach((item) => {
          const value = generator.generate(item.structuredValue!, nodeName);
          if (value !== undefined) {
            parts.push(`${tagFill}${value}`);
          }
        });
        return parts.join('\n');
      }
    }
    
    // then the default value
    if (schema.defaultValue) {
      const generator = new XmlDataNodeGenerator();
      const value = generator.generate(schema.defaultValue, nodeName);
      if (value !== undefined) {
        return `${tagFill}${value}`;
      }
    }
    
    // finally we generate stuff.
    const opts: IProcessNodeOptions = {
      indent: currentIndent + 1,
      forceName: nodeName,
    };
    const value = this.processNode(items, opts);
    return `${tagFill}${value}`;
  }

  /**
   * Renders a NodeShape as an array item.
   * 
   * @param schema The array shape with item that is NodeShape.
   * @param options Rendering options.
   */
  protected _nodeItems(schema: IArrayShape<INodeShape>, options: IProcessNodeOptions={}): string {
    const items = schema.items as INodeShape;
    const currentIndent = (options.indent || 0);
    const tagFill = new Array(currentIndent * 2).fill(' ').join('');
    const isWrapped = schema.xmlSerialization && !!schema.xmlSerialization.wrapped;
    const defaultValue = schema.defaultValue || items.defaultValue;

    let nodeName = '';
    if (items.xmlSerialization && items.xmlSerialization.name) {
      nodeName = normalizeXmlTagName(items.xmlSerialization.name);
    } else {
      nodeName = shapeToXmlTagName(schema.name ? schema : items);
    }

    const valueFill = isWrapped ? new Array(currentIndent * 2 + 2).fill(' ').join('') : tagFill;
    const parts: string[] = [];
    if (isWrapped) {
      parts.push(`${tagFill}<${nodeName}>`);
    }

    let rendered = false;

    // let's start with examples
    if (this.opts.renderExamples) {
      let { examples=[] } = schema;
      if (Array.isArray(items.examples)) {
        examples = examples.concat(items.examples);
      }
      const validExamples = examples.filter(item => !!item.structuredValue);
      if (validExamples.length) {
        const parts: string[] = [];
        const generator = new XmlDataNodeGenerator();
        validExamples.forEach((item) => {
          const value = generator.generate(item.structuredValue!, nodeName);
          if (value !== undefined) {
            parts.push(`${tagFill}${value}`);
          }
        });
        rendered = true;
      }
    }

    if (!rendered && defaultValue) {
      const generator = new XmlDataNodeGenerator();
      const value = generator.generate(defaultValue, nodeName);
      if (value !== undefined) {
        parts.push(`${tagFill}${value}`);
        rendered = true;
      }
    } 
    if (!rendered) {
      const properties = this._collectProperties(items);
      properties.forEach((prop) => {
        const value = this._propertyShapeObject(prop);
        if (value) {
          parts.push(`${valueFill}${value}`);
        }
      });
    }
    if (isWrapped) {
      parts.push(`${tagFill}</${nodeName}>`);
    }
    return parts.join('\n');
  }

  /**
   * @param example The example to turn into a JS object
   */
  protected _exampleToObject(example?: IDataExample): any {
    if (example && example.structuredValue) {
      const generator = new XmlDataNodeGenerator();
      return generator.generate(example.structuredValue);
    }
    return undefined;
  }

  protected _unionShapeObject(schema: IUnionShape, options: IProcessNodeOptions={}): any {
    let { anyOf=[], examples=[] } = schema;
    if (Array.isArray(schema.inherits) && schema.inherits) {
      schema.inherits.forEach((parent) => {
        const anyParent = parent as IAnyShape;
        if (Array.isArray(anyParent.examples) && anyParent.examples.length) {
          examples = examples.concat(anyParent.examples);
        }
        const typed = parent as IUnionShape;
        if (Array.isArray(typed.anyOf) && typed.anyOf.length) {
          anyOf = anyOf.concat(typed.anyOf);
        }
      });
    }
    if (Array.isArray(anyOf) && anyOf.length) {
      if (this._isNotRequiredUnion(anyOf)) {
        // This generates schema for required values.
        // This implicitly mean that the property is not required therefore the value should 
        // not be generated.
        return undefined;
      }
      const example = examples.find((item) => !!item.structuredValue);
      const value = this._exampleToObject(example);
      if (value !== undefined) {
        const label = shapeToXmlTagName(schema);
        const currentIndent = (options.indent || 0);
        const rootFill = new Array(currentIndent*2).fill(' ').join('');
        const valueFill = new Array(currentIndent * 2 + 2).fill(' ').join('');
        const parts = [];
        parts.push(`${rootFill}<${label}>`);
        const formatted = String(value).split('\n').filter(i => !!i).map(i => `${valueFill}${i}`).join('\n');
        parts.push(`${formatted}`);
        parts.push(`${rootFill}</${label}>`);
        return parts.join('\n');
      }
      if (schema.defaultValue) {
        return this._unionDefaultValue(schema, schema.defaultValue);
      }
      const member = this._readCurrentUnion(anyOf);
      if (member) {
        return this.processNode(member, { ...options, forceName: schema.name });
      }
    }
    return undefined;
  }

  /**
   * @param schema The schema with unions
   * @param defaultValue The definition of a default value.
   */
  protected _unionDefaultValue(schema: IShapeUnion, defaultValue: IDataNodeUnion, options: IProcessNodeOptions = {}): any|undefined {
    const gen = new XmlDataNodeGenerator();
    const value = gen.generate(defaultValue);
    const anySchema = schema as IAnyShape;
    const label = shapeToXmlTagName(anySchema);
    const currentIndent = (options.indent || 0);
    const rootFill = new Array(currentIndent*2).fill(' ').join('');
    const parts = [
      `${rootFill}<${label}>`
    ];
    const valueFill = new Array(currentIndent * 2 + 2).fill(' ').join('');
    parts.push(`${valueFill}${String(value).trim()}`);
    parts.push(`${rootFill}</${label}>`);
    return parts.join('\n');
  }

  protected _fileShapeObject(): any {
    return undefined;
  }

  protected _schemaShapeObject(): any {
    return undefined;
  }

  protected _tupleShapeObject(): any {
    return undefined;
  }

   protected _anyShapeObject(schema: IAnyShape): string {
    const { and=[], xone=[], or=[] } = schema;
    if (and.length) {
      // we combine all properties together under `schema` with changed properties
      const copy = JsonCore.clone(schema) as INodeShape;
      copy.and = [];
      copy.properties = [];
      and.forEach((item) => {
        const { types } = item;
        if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
          const typed = item as IScalarShape;
          copy.properties.push(typed);
        } else if (types.includes(ns.w3.shacl.NodeShape)) {
          const typed = item as INodeShape;
          typed.properties.forEach(i => copy.properties.push(i));
        } else if (types.includes(ns.aml.vocabularies.shapes.ArrayShape) || types.includes(ns.aml.vocabularies.shapes.MatrixShape)) {
          const typed = item as IArrayShape;
          if (typed.items) {
            copy.properties.push(typed.items)
          }
        }
      });
      return this._nodeShapeObject(copy);
    }
    if (xone.length) {
      const { selectedUnions=[] } = this.opts;
      let selected = xone.find(i => selectedUnions.includes(i.id));
      if (!selected) {
        // select firs available
        selected = xone[0];
      }
      return this.processNode(selected);
    }
    if (or.length) {
      const { selectedUnions=[] } = this.opts;
      let selected = or.find(i => selectedUnions.includes(i.id));
      if (!selected) {
        // select firs available
        selected = or[0];
      }
      return this.processNode(selected);
    }
    const { examples=[] } = schema;
    const label = shapeToXmlTagName(schema);
    if (this.opts.renderExamples && examples && examples.length) {
      const example = examples.find((item) => !!item.structuredValue);
      const value = this._exampleToObject(example);
      const parts = [];
      if (typeof value !== 'undefined') {
        const valueFill = `    `;
        parts.push(`<${label}>`);
        parts.push(`${valueFill}${value}`);
        parts.push(`</${label}>`);
      }
      return parts.join('\n');
    }
    return this._scalarShapeObject(schema);
  }
}
