import { AmfNamespace as ns } from "./definitions/Namespace.js";
import { JsonDataNodeGenerator } from './data-node/JsonDataNodeGenerator.js';
import { XmlDataNodeGenerator } from './data-node/XmlDataNodeGenerator.js';
import { UrlEncodedDataNodeGenerator } from './data-node/UrlEncodedDataNodeGenerator.js';
import { formatXmlValue } from './Utils.js';
import { IArrayShape, IDataExample, IDataNode, IShapeUnion } from "./definitions/Shapes.js";

/**
 * A class that processes AMF's Example object to read the example value
 * or to generate the example for the given media type.
 */
export class ApiExampleGenerator {
  /**
   * Reads or generates an example.
   * When the `mime` is set then it tries to "guess" whether the mime type corresponds to the value.
   * If it doesn't then it generates the example from the structured value, when possible.
   * @param example The structured value of the example
   * @param mime The optional mime type of the example. When not set it won't generate example from the structured value.
   * @param shape The optional shape containing this example to use with the XML examples which needs wrapping into an element.
   * @returns The read or generated example.
   */
  read(example: IDataExample, mime?: string, shape?: IShapeUnion): string | undefined {
    const { value, structuredValue } = example;
    if (!value && !structuredValue) {
      return undefined;
    }
    if (structuredValue && !value && mime) {
      return this.fromStructuredValue(mime, structuredValue, shape);
    }
    if (!mime) {
      return value;
    }
    if (this.mimeMatches(mime, value)) {
      return value;
    }
    if (structuredValue) {
      return this.fromStructuredValue(mime, structuredValue, shape);
    }
    return undefined;
  }

  /**
   * Employs some basic heuristics to determine whether the given mime type patches the content.
   * @param mime The mime type for the value.
   * @param value The value.
   * @returns True when the value matches the mime type.
   */
  mimeMatches(mime: string, value?: string): boolean {
    const trimmed = String(value).trim();
    if (mime.includes('json')) {
      // JSON string has to start with either of these characters
      return trimmed[0] === '{' || trimmed[0] === '[';
    }
    if (mime.includes('xml')) {
      return trimmed.startsWith('<');
    }
    if (mime.includes('x-www-form-urlencoded')) {
      return trimmed.includes('=') || trimmed.includes('&');
    }
    return true;
  }

  /**
   * Generates the example for the given structured value and the media type.
   * @param mime The mime type for the value.
   * @param structuredValue The structuredValue of the example.
   * @param shape The optional shape containing this example to use with the XML examples which needs wrapping into an element.
   * @returns The generated example or null if couldn't process the data.
   */
  fromStructuredValue(mime: string, structuredValue: IDataNode, shape?: IShapeUnion): string | undefined {
    if (mime.includes('json')) {
      const generator = new JsonDataNodeGenerator();
      return generator.generate(structuredValue);
    }
    let shapeName;
    if (shape && shape.types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
      shapeName = shape.name;
    } else if (shape && shape.types.includes(ns.aml.vocabularies.shapes.ArrayShape)) {
      const typed = shape as IArrayShape;
      if (typed.items && typed.items.types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
        shapeName = typed.items.name || shape.name;
      }
    }
    if (mime.includes('xml')) {
      const generator = new XmlDataNodeGenerator();
      let value = generator.generate(structuredValue, shapeName);
      if (shape && !shapeName) {
        value = this.wrapXmlValue(value, shape);
      }
      return value;
    }
    if (mime.includes('x-www-form-urlencoded')) {
      const generator = new UrlEncodedDataNodeGenerator();
      return generator.generate(structuredValue, shapeName);
    }
    return undefined;
  }

  /**
   * Wraps the generated XML example into an element according to the `shape` properties.
   */
  wrapXmlValue(value?: string, shape?: IShapeUnion): string | undefined {
    if (!value || !shape) {
      return value;
    }
    const { name } = shape;
    const parts = [`<${name}>`];
    parts.push(formatXmlValue('  ', value.trim()));
    parts.push(`</${name}>`);
    return parts.join('\n');
  }
}
