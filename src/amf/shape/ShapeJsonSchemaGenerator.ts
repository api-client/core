import { AmfNamespace as ns } from "../definitions/Namespace.js";
import { ShapeBase } from './ShapeBase.js';
import { JsonDataNodeGenerator } from '../data-node/JsonDataNodeGenerator.js';
import { IAnyShape, IArrayShape, IDataExample, IDataNodeUnion, INodeShape, IPropertyShape, IScalarShape, IShapeUnion, ITupleShape, IUnionShape } from "../definitions/Shapes.js";

export class ShapeJsonSchemaGenerator extends ShapeBase {
  /**
   * Generates a schema from AMF's shape.
   * 
   * @param schema The Shape definition
   */
  generate(schema: IShapeUnion): string | number | boolean | null | undefined {
    const result = this.toObject(schema);
    if (result !== null && typeof result === 'object') {
      return this.serialize(result);
    }
    return result;
  }

  /**
   * Processes the Shape definition and returns a JavaScript object or array.
   */
  toObject(schema: IShapeUnion): any {
    const { types } = schema;
    if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
      return this._scalarShapeObject(schema as IScalarShape);
    }
    if (types.includes(ns.w3.shacl.NodeShape)) {
      return this._nodeShapeObject(schema as INodeShape);
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
      return this._tupleShapeObject(schema as ITupleShape);
    }
    if (types.includes(ns.aml.vocabularies.shapes.ArrayShape) || types.includes(ns.aml.vocabularies.shapes.MatrixShape)) {
      return this._arrayShapeObject(schema as IArrayShape);
    }
    return this._anyShapeObject(schema as IAnyShape);
  }

  /**
   * Serializes generated JS value according to the mime type.
   */
  serialize(value: any): string {
    return JSON.stringify(value, null, 2);
  }

  protected _scalarShapeObject(schema: IScalarShape): any|undefined {
    return this._scalarValue(schema);
  }

  protected _nilShapeObject(): any|undefined {
    return undefined;
  }

  protected _nodeShapeObject(schema: INodeShape): any {
    const { inherits } = schema;
    let { examples=[] } = schema;
    if (Array.isArray(inherits) && inherits.length) {
      inherits.forEach((parent) => {
        const anyParent = parent as IAnyShape;
        if (Array.isArray(anyParent.examples) && anyParent.examples.length) {
          examples = examples.concat(anyParent.examples);
        }
      });
    }
    if (this.opts.renderExamples && examples.length) {
      const example = examples.find((item) => !!item.structuredValue);
      const value = this._exampleToObject(example);
      if (value !== undefined) {
        return value;
      }
    }
    let result: any = {};
    const { properties } = schema;
    if (Array.isArray(inherits) && inherits.length) {
      inherits.forEach(((s) => {
        const part = this.toObject(s);
        if (typeof part === 'object') {
          result = { ...result, ...part };
        }
      }));
    }
    properties.forEach((property) => {
      const { name } = property;
      const value = this._propertyShapeObject(property);
      if (typeof value !== 'undefined' && name) {
        result[name] = value;
      }
    });
    return result;
  }

  protected _unionShapeObject(schema: IUnionShape): any {
    if (schema.and && schema.and.length) {
      return this._allOfUnion(schema);
    }
    if (schema.xone && schema.xone.length) {
      return this._oneOfUnion(schema);
    }
    // the default
    return this._anyOfUnion(schema);
  }

  protected _anyOfUnion(schema: IUnionShape): any {
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
    const { opts } = this;
    if (this._isNotRequiredUnion(anyOf)) {
      // This generates schema for required values.
      // This implicitly mean that the property is not required therefore the value should 
      // not be generated.
      return undefined;
    }
    if (this.opts.renderExamples) {
      const example = examples.find((item) => !!item.structuredValue);
      const value = this._exampleToObject(example);
      if (value !== undefined) {
        return value;
      }
    }
    if (schema.defaultValue) {
      return this._unionDefaultValue(anyOf, schema.defaultValue);
    }
    const { selectedUnions } = opts;
    let renderedItem: IShapeUnion | undefined;
    if (selectedUnions && selectedUnions.length) {
      renderedItem = anyOf.find((item) => selectedUnions.includes(item.id));
    } else {
      [renderedItem] = anyOf;
    }
    if (renderedItem) {
      return this.toObject(renderedItem);
    }
    return undefined;
  }

  protected _oneOfUnion(schema: IUnionShape): any {
    let { xone=[], examples=[] } = schema;
    if (Array.isArray(schema.inherits) && schema.inherits) {
      schema.inherits.forEach((parent) => {
        const anyParent = parent as IAnyShape;
        if (Array.isArray(anyParent.examples) && anyParent.examples.length) {
          examples = examples.concat(anyParent.examples);
        }
      });
    }
    const { opts } = this;
    if (this.opts.renderExamples) {
      const example = examples.find((item) => !!item.structuredValue);
      const value = this._exampleToObject(example);
      if (value !== undefined) {
        return value;
      }
    }
    if (schema.defaultValue) {
      return this._unionDefaultValue(xone, schema.defaultValue);
    }
    const { selectedUnions } = opts;
    let renderedItem: IShapeUnion | undefined;
    if (selectedUnions && selectedUnions.length) {
      renderedItem = xone.find((item) => selectedUnions.includes(item.id));
    } else {
      [renderedItem] = xone;
    }
    if (renderedItem) {
      return this.toObject(renderedItem);
    }
    return undefined;
  }

  /**
   * Combines all properties from both all shapes in the union
   */
  protected _allOfUnion(schema: IUnionShape): any {
    let { examples=[], and=[] } = schema;
    if (Array.isArray(schema.inherits) && schema.inherits) {
      schema.inherits.forEach((parent) => {
        const anyParent = parent as IAnyShape;
        if (Array.isArray(anyParent.examples) && anyParent.examples.length) {
          examples = examples.concat(anyParent.examples);
        }
      });
    }
    if (this.opts.renderExamples) {
      const example = examples.find((item) => !!item.structuredValue);
      const value = this._exampleToObject(example);
      if (value !== undefined) {
        return value;
      }
    }
    let result: any = {};
    and.forEach((item) => {
      const props = this.toObject(item);
      if (typeof props === 'object') {
        result = { ...result, ...props };
      }
    });
    return result;
  }

  /**
   * @param union The list of unions in the shape
   * @param defaultValue The definition of a default value.
   */
  protected _unionDefaultValue(union: IShapeUnion[], defaultValue: IDataNodeUnion): any | undefined {
    const gen = new JsonDataNodeGenerator();
    const result = gen.generate(defaultValue);
    let hasNumber = false;
    let hasBoolean = false;
    let hasNil = false;
    union.forEach((i) => {
      if (i.types.includes(ns.aml.vocabularies.shapes.NilShape)) {
        hasNil = true;
      }
      if (!i.types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
        return;
      }
      const scalar = i as IScalarShape;
      if (!hasBoolean) {
        hasBoolean = scalar.dataType === ns.w3.xmlSchema.boolean;
      }
      if (!hasNumber) {
        hasNumber = [
          ns.w3.xmlSchema.number,
          ns.w3.xmlSchema.long,
          ns.w3.xmlSchema.integer,
          ns.w3.xmlSchema.float,
          ns.w3.xmlSchema.double,
          ns.aml.vocabularies.shapes.number,
          ns.aml.vocabularies.shapes.long,
          ns.aml.vocabularies.shapes.integer,
          ns.aml.vocabularies.shapes.float,
          ns.aml.vocabularies.shapes.double,
        ].includes(scalar.dataType!);
      }
      if (!hasNil) {
        hasNil = scalar.dataType === ns.w3.xmlSchema.nil;
      }
    });
    if (hasNumber) {
      const parsed = Number(result);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    if (hasBoolean) {
      if (result === 'true') {
        return true;
      }
      if (result === 'false') {
        return false;
      }
    }
    if (hasNil && (result === 'null' || result === 'nil')) {
      return null;
    }
    return result;
  }

  protected _arrayShapeObject(schema: IArrayShape): any[] {
    const { items } = schema;
    const defaultValue = schema.defaultValue || items && items.defaultValue;
    
    let { examples=[] } = schema;
    const anyItems = items as IAnyShape;
    if (Array.isArray(anyItems.examples)) {
      examples = examples.concat(anyItems.examples);
    }
    if (this.opts.renderExamples && examples && examples.length) {
      const example = examples.find((item) => !!item.structuredValue);
      const value = this._exampleToObject(example);
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value !== 'undefined') {
        return [value];
      }
    } 
    if (defaultValue) {
      const gen = new JsonDataNodeGenerator();
      const arr = gen.processNode(defaultValue);
      if (Array.isArray(arr)) {
        return arr;
      } else if (arr) {
        return [arr];
      }
    }
    if (items) {
      const value = this.toObject(items);
      if (typeof value !== 'undefined') {
        return [value];
      }
    }
    return [];
  }

  protected _tupleShapeObject(schema: ITupleShape): any {
    const { items, examples } = schema;
    if (this.opts.renderExamples && examples && examples.length) {
      const example = examples.find((item) => !!item.structuredValue);
      const value = this._exampleToObject(example);
      if (typeof value !== 'undefined') {
        return [value];
      }
    } 
    if (schema.defaultValue) {
      const gen = new JsonDataNodeGenerator();
      const arr = gen.processNode(schema.defaultValue);
      if (Array.isArray(arr)) {
        return arr;
      }
    }
    if (items.length) {
      const result: any[] = [];
      items.forEach((i) => {
        const value = this.toObject(i);
        if (typeof value !== 'undefined') {
          result.push(value);
        }
      });
      return result;
    }
    return [];
  }

  protected _anyShapeObject(schema: IAnyShape): any {
    const { and=[], xone=[], or=[] } = schema;
    if (and.length) {
      let result: any = {};
      and.forEach((item) => {
        const props = this.toObject(item);
        if (typeof props === 'object') {
          result = { ...result, ...props };
        }
      });
      return result;
    }
    if (xone.length) {
      const { selectedUnions=[] } = this.opts;
      let selected = xone.find(i => selectedUnions.includes(i.id));
      if (!selected) {
        // select firs available
        selected = xone[0];
      }
      return this.toObject(selected);
    }
    if (or.length) {
      const { selectedUnions=[] } = this.opts;
      let selected = or.find(i => selectedUnions.includes(i.id));
      if (!selected) {
        // select firs available
        selected = or[0];
      }
      return this.toObject(selected);
    }
    return this._scalarShapeObject(schema);
  }

  /**
   * @returns The value for the property or undefined when cannot generate the value.
   */
  protected _propertyShapeObject(schema: IPropertyShape): any | undefined {
    const { minCount=0 } = schema;
    if (minCount === 0 && !this.opts.renderOptional) {
      return undefined;
    }
    const { range } = schema;
    if (!range) {
      return undefined;
    }
    const { types } = range;
    if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
      // const defaultValue = schema.defaultValue || range.defaultValue;
      // if (!this.opts.renderExamples && defaultValue) {
      //   const gen = new JsonDataNodeGenerator();
      //   const value = gen.generate(defaultValue);
      //   if (value) {
      //     return ApiSchemaValues.readTypedValue(value, /** @type IScalarShape */ (range).dataType);
      //   }
      // }
      const anyRange = range as IAnyShape;
      return this._scalarShapeObject(anyRange);
    }
    return this.toObject(range);
  }

  /**
   * @param example The example to turn into a JS object
   */
  protected _exampleToObject(example?: IDataExample): any {
    if (example && example.structuredValue) {
      const jsonGenerator = new JsonDataNodeGenerator();
      return jsonGenerator.processNode(example.structuredValue);
    }
    return undefined;
  }

  protected _fileShapeObject(): any {
    return undefined
  }
  
  protected _schemaShapeObject(): any {
    return undefined;
  }
}
