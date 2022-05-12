import { AmfNamespace as ns } from "../definitions/Namespace.js";
import { ShapeBase } from './ShapeBase.js';
import { XmlDataNodeGenerator } from '../data-node/XmlDataNodeGenerator.js';
import { collectNodeProperties, formatXmlValue, getUnionMember } from '../Utils.js';
import { IAnyShape, IArrayShape, IDataExample, IDataNodeUnion, INodeShape, IPropertyShape, IScalarShape, IShapeUnion, IUnionShape } from "../definitions/Shapes.js";

interface ProcessNodeOptions {
  forceName?: string;
  indent?: number;
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
  processNode(schema: IShapeUnion, options: ProcessNodeOptions = {}): string {
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

  protected _nodeShapeObject(schema: INodeShape, options: ProcessNodeOptions={}): string {
    const { inherits } = schema;
    let { examples=[] } = schema;
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

    const label = options.forceName || shapeToXmlTagName(schema);
    const parts = [];
    const currentIndent = (options.indent || 0);
    if (this.opts.renderExamples && examples && examples.length) {
      const example = examples.find((item) => !!item.value);
      const value = this._exampleToObject(example);
      if (typeof value !== 'undefined') {
        const fillTag = new Array(currentIndent * 2 + 0).fill(' ').join('');
        const fillValue = new Array(currentIndent * 2 + 2).fill(' ').join('');
        parts.push(`${fillTag}<${label}>`);
        parts.push(formatXmlValue(fillValue, value));
        parts.push(`${fillTag}</${label}>`);
        return parts.join('\n');
      }
    }
    const attributes: string[] = [];
    const properties = this._collectProperties(schema);
    properties.forEach((property) => {
      const { range, minCount=0 } = property;
      if (minCount === 0 && !this.opts.renderOptional) {
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

  protected _scalarShapeObject(schema: IScalarShape, options: ProcessNodeOptions={}): any {
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

  protected _nilShapeObject(schema: IScalarShape, options: ProcessNodeOptions={}): any|undefined {
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
  protected _propertyShapeObject(schema: IPropertyShape, options?: ProcessNodeOptions): string|undefined {
    const { range, minCount=0 } = schema;
    if (minCount === 0 && !this.opts.renderOptional || !range) {
      return undefined;
    }
    const { types } = range;
    if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
      return this._scalarShapeObject(range as IScalarShape);
    } 
    if (types.includes(ns.aml.vocabularies.shapes.NilShape)) {
      return this._nilShapeObject(range as IScalarShape);
    }
    return this.processNode(range, options);
  }

  protected _arrayShapeObject(schema: IArrayShape, options: ProcessNodeOptions={}): string {
    const { items, xmlSerialization } = schema;
    const label = shapeToXmlTagName(schema);
    const currentIndent = (options.indent || 0);
    const rootFill = new Array(currentIndent*2).fill(' ').join('');
    const parts = [
      `${rootFill}<${label}>`
    ];
    let nodeName = label;
    const anyItems = items as IAnyShape;
    if (anyItems.xmlSerialization && anyItems.xmlSerialization.name) {
      nodeName = normalizeXmlTagName(anyItems.xmlSerialization.name);
    }
    // Note about wrapping. 
    // XML array values are not wrapped by default. This means that by default 
    // it produces a value like this:
    // <ParentArray>
    //   <arrayMemberProperty></arrayMemberProperty>
    // </ParentArray>
    // 
    // When the object is marked as wrapped then the object is rendered as follows
    // 
    // <ParentArray>
    //   <MemberObject>
    //     <arrayMemberProperty></arrayMemberProperty>
    //   <MemberObject>
    // </ParentArray>
    const isWrapped = xmlSerialization && !!xmlSerialization.wrapped;
    const defaultValue = schema.defaultValue || items && items.defaultValue;
    let itemName;
    if (isWrapped) {
      try {
        // @ts-ignore
        itemName = shapeToXmlTagName(schema.items);
      } catch (e) {
        itemName = 'UNKNOWN-NAME'
      }
    }
    let { examples=[] } = schema;
    if (Array.isArray(anyItems.examples)) {
      examples = examples.concat(anyItems.examples);
    }
    if (this.opts.renderExamples && examples && examples.length) {
      const example = examples.find((item) => !!item.value);
      const value = this._exampleToObject(example);
      if (typeof value !== 'undefined') {
        const tagFill = new Array(currentIndent * 2 + 2).fill(' ').join('');
        const valueFill = new Array(currentIndent * 2 + 4).fill(' ').join('');
        parts.push(`${tagFill}<${nodeName}>`);
        parts.push(`${valueFill}${value}`);
        parts.push(`${tagFill}</${nodeName}>`);
      }
    } else if (defaultValue) {
      const gen = new XmlDataNodeGenerator();
      const value = gen.generate(defaultValue);
      if (value) {
        const tagFill = new Array(currentIndent * 2 + 2).fill(' ').join('');
        const valueFill = new Array(currentIndent * 2 + 4).fill(' ').join('');
        parts.push(`${tagFill}<${nodeName}>`);
        parts.push(`${valueFill}${value.trim()}`);
        parts.push(`${tagFill}</${nodeName}>`);
      }
    } else if (items && items.types.includes(ns.w3.shacl.NodeShape)) {
      const typed = items as INodeShape;
      const tagFill = new Array(currentIndent * 2 + 2).fill(' ').join('');
      const valueFill = isWrapped ? new Array(currentIndent * 2 + 4).fill(' ').join('') : tagFill;
      if (isWrapped) {
        parts.push(`${tagFill}<${itemName}>`);
      }
      const properties = this._collectProperties(typed);
      properties.forEach((prop) => {
        const value = this._propertyShapeObject(prop);
        if (value) {
          parts.push(`${valueFill}${value}`);
        }
      });
      if (isWrapped) {
        parts.push(`${tagFill}</${itemName}>`);
      }
    } else {
      const opts = {
        forceName: nodeName,
        indent: currentIndent + 1,
      };
      const value = items && this.processNode(items, opts);
      if (typeof value !== 'undefined') {
        const fill = new Array(currentIndent * 2 + 2).fill(' ').join('');
        parts.push(`${fill}${value}`);
      }
    }
    
    parts.push(`${rootFill}</${label}>`);
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

  protected _unionShapeObject(schema: IUnionShape, options: ProcessNodeOptions={}): any {
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
      const example = examples.find((item) => !!item.value);
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
  protected _unionDefaultValue(schema: IShapeUnion, defaultValue: IDataNodeUnion, options: ProcessNodeOptions = {}): any|undefined {
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
    const { examples=[] } = schema;
    const label = shapeToXmlTagName(schema);
    if (this.opts.renderExamples && examples && examples.length) {
      const example = examples.find((item) => !!item.value);
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
    return '';
  }
}
