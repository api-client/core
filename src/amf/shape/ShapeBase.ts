import { Time } from '@pawel-up/data-mock';
import { AmfNamespace as ns } from "../definitions/Namespace.js";
import { ApiSchemaValues } from '../ApiSchemaValues.js';
import { JsonDataNodeGenerator } from '../data-node/JsonDataNodeGenerator.js';
import { IAnyShape, IArrayShape, IDataExample, IFileShape, INodeShape, IPropertyShape, IScalarNode, IScalarShape, ISchemaShape, IShapeUnion, ITupleShape, IUnionShape } from '../definitions/Shapes.js';

export interface IShapeRenderOptions {
  /**
   * All selected unions in the current view.
   * When the processor encounter an union it checks this array
   * to pick the selected union.
   * When the selected union cannot be determined it picks the first union.
   */
  selectedUnions?: string[];
  /**
   * Whether to include optional fields into the schema.
   * @default false
   */
  renderOptional?: boolean;
  /**
   * When set it uses the data mocking library to generate the values
   * when examples and default are not set.
   */
  renderMocked?: boolean;
  /**
   * The library **always** uses default values in the schema.
   * When a default value is not set by default it inserts an empty value for 
   * the given data type ('', false, null, random date). When this is set
   * it includes examples in the generated value.
   */
  renderExamples?: boolean;
}

/**
 * A base class for generators that generates a schema from AMF's shape definition.
 */
export abstract class ShapeBase {
  opts: Readonly<IShapeRenderOptions>;
  time = new Time();

  constructor(opts: IShapeRenderOptions = {}) {
    this.opts = Object.freeze({ ...opts });
  }

  protected _scalarValue(schema: IScalarShape): string | number | boolean {
    const { defaultValue, examples, values, inherits, dataType } = schema;
    // check examples
    if (this.opts.renderExamples && examples && examples.length) {
      const example = examples.find((item) => !!item.structuredValue);
      const value = this._exampleToObject(example);
      if (typeof value !== 'undefined') {
        return ApiSchemaValues.readTypedValue(value, dataType);
      }
    }
    
    // check the default value
    if (defaultValue) {
      const gen = new JsonDataNodeGenerator();
      const processed = gen.processNode(defaultValue);
      // return ApiSchemaValues.readTypedValue(processed, dataType);
      return processed;
    }
    // check enum values
    if (values && values.length) {
      const typed = values[0] as IScalarNode;
      if (typed.value !== undefined) {
        return ApiSchemaValues.readTypedValue(typed.value, dataType);
      }
    }
    // check parents
    if (Array.isArray(inherits) && inherits.length) {
      for (let i = 0, len = inherits.length; i < len; i += 1) {
        const result = this._scalarValue(inherits[i] as IScalarShape);
        if (result !== undefined) {
          return result;
        }
      }
    }
    if (this.opts.renderMocked) {
      return ApiSchemaValues.generateMockedValue(schema);
    }
    // return this[dataTypeToExample](dataType, format);
    // create a default value.
    return ApiSchemaValues.generateDefaultValue(schema);
  }

  /**
   * Checks whether the union represents a scalar + nil which is equivalent 
   * to having scalar that is not required.
   * 
   * See more about nil values in RAML:
   * https://github.com/raml-org/raml-spec/blob/master/versions/raml-10/raml-10.md#nil-type
   * 
   * @param union The list of unions in the shape
   */
  protected _isNotRequiredUnion(union: IShapeUnion[]): boolean {
    let scalars = 0;
    let hasNil = false;
    union.forEach((i) => {
      if (i.types.includes(ns.aml.vocabularies.shapes.NilShape)) {
        hasNil = true;
      } else if (i.types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
        const scalar = i as IScalarShape;
        if (scalar.dataType === ns.w3.xmlSchema.nil) {
          hasNil = true;
        } else {
          scalars += 1;
        }
      } else if (i.types.includes(ns.aml.vocabularies.shapes.FileShape)) {
        scalars += 1;
      }
    });
    if (!hasNil) {
      return false;
    }
    // size of union minus the nil union
    if (scalars === union.length - 1) {
      return true;
    }
    return false;
  }

  /**
   * Generates a schema from AMF's shape.
   * @param schema The Shape definition
   * @returns The generated example
   */
  abstract generate(schema: IShapeUnion): string | number | boolean | null | undefined;

  /**
   * Serializes generated values into the final mime type related form.
   * 
   * @returns The generated example
   */
  abstract serialize(value: any): string | undefined;

  /**
   * @abstract
   * @param {ApiExample} example The example to turn into a JS object
   * @returns {any}
   */
  protected abstract _exampleToObject(example?: IDataExample): any;

  protected abstract _scalarShapeObject(schema: IScalarShape): any;

  protected abstract _nilShapeObject(schema: IScalarShape): any;

  protected abstract _nodeShapeObject(schema: INodeShape): any;

  protected abstract _unionShapeObject(schema: IUnionShape): any;

  protected abstract _fileShapeObject(schema?: IFileShape): any;

  protected abstract _schemaShapeObject(schema?: ISchemaShape): any;

  protected abstract _arrayShapeObject(schema: IArrayShape): any;

  protected abstract _tupleShapeObject(schema?: ITupleShape): any;

  protected abstract _anyShapeObject(schema: IAnyShape): any;

  protected abstract _propertyShapeObject(schema: IPropertyShape): any;
}
