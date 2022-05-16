import { AmfNamespace as ns } from "./definitions/Namespace.js";
import { IAnyShape, IDataExample, IShapeUnion } from "./definitions/Shapes.js";
import { ShapeBase, IShapeRenderOptions } from "./shape/ShapeBase.js";
import { ShapeJsonSchemaGenerator } from './shape/ShapeJsonSchemaGenerator.js';
import { ShapeXmlSchemaGenerator } from './shape/ShapeXmlSchemaGenerator.js';

export interface ISchemaExample extends IDataExample {
  /**
   * The value to render as the example value.
   */
  renderValue?: string | number | boolean | null | undefined;
  label?: string;
}

/**
 * A class that processes AMF's Shape to auto-generate a schema from examples/type for a given media type.
 * This should be used when examples for the Shape are not available but the application still needs to 
 * render an example or a schema from the Shape.
 * If examples can be found directly in the shape, use the `ApiExampleGenerator` instead.
 */
export class ApiSchemaGenerator {
  opts: Readonly<IShapeRenderOptions>;

  generator?: ShapeBase;

  /**
   * 
   * @param mime The example mime type to format the generated example.
   * @param opts Optional configuration.
   */
  constructor(public mime: string, opts: IShapeRenderOptions = {}) {
    this.opts = Object.freeze({ ...opts });
    if (mime.includes('json')) {
      this.generator = new ShapeJsonSchemaGenerator(opts);
    } else if (mime.includes('xml')) {
      this.generator = new ShapeXmlSchemaGenerator(opts);
    }
  }

  /**
   * @param shape The Shape definition
   * @param mime The mime type for the value.
   * @returns Customized Example with the `renderValue` that is the generated Example value.
   */
  static asExample(shape: IShapeUnion, mime: string, opts?: IShapeRenderOptions): ISchemaExample | undefined {
    const generator = new ApiSchemaGenerator(mime, opts);
    return generator.toExample(shape);
  }

  /**
   * @param shape The Shape definition
   * @param mime The mime type for the value.
   * @returns The generated schema
   */
  static asSchema(shape: IShapeUnion, mime: string, opts?: IShapeRenderOptions): string | number | boolean | null | undefined {
    const generator = new ApiSchemaGenerator(mime, opts);
    return generator.toValue(shape);
  }

  /**
   * Generates the schema from the AMF shape.
   * 
   * @param shape The Shape definition
   */
  generate(shape: IShapeUnion): string | number | boolean | null | undefined {
    const { generator } = this;
    if (!generator) {
      return undefined;
    }
    return generator.generate(shape);
  }

  /**
   * @link {#generate()}
   * @param shape The Shape definition
   */
  toValue(shape: IShapeUnion): string | number | boolean | null | undefined {
    return this.generate(shape);
  }

  /**
   * Generates an API Example object with the value to render.
   * @param shape The Shape definition
   * @returns Customized Example with the `renderValue` that is the generated Example value.
   */
  toExample(shape: IShapeUnion): ISchemaExample | undefined {
    const renderValue = this.generate(shape);
    if (renderValue === null || renderValue === undefined) {
      return undefined;
    }
    const result: ISchemaExample = {
      id: `${shape.id}/generated`,
      strict: true,
      types: [ns.aml.vocabularies.apiContract.Example],
      mediaType: this.mime,
      renderValue,
      customDomainProperties: [],
    };
    const typed = shape as IAnyShape;
    if (Array.isArray(typed.examples) && typed.examples.length) {
      const [example] = typed.examples;
      if (example.value) {
        result.value = example.value;
      }
    }
    return result;
  }
}
