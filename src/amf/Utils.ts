import { UrlEncoder } from "../lib/parsers/UrlEncoder.js";
import { AmfNamespace } from "./definitions/Namespace.js";
import { INodeShape, IPropertyShape, IShapeUnion, IUnionShape } from "./definitions/Shapes.js";

/**
   * @param indent The current indent
   */
export function toXml(obj: any, indent=0): string {
  if (typeof obj !== 'object') {
    return obj;
  }
  let xml = '';
  const tabs = new Array(indent).fill('  ').join('');
  Object.keys(obj).forEach((prop) => {
    xml += Array.isArray(obj[prop]) ? '' : `${tabs}<${prop}>`;
    if (Array.isArray(obj[prop])) {
      (obj[prop] as any[]).forEach((item) => {
        xml += `<${prop}>\n`;
        xml += tabs;
        xml += toXml({ ...item }, indent + 1);
        xml += `</${prop}>\n`;
      });
    } else if (typeof obj[prop] === "object") {
      xml += `\n`;
      xml += toXml({ ...obj[prop] }, indent + 1);
    } else {
      xml += `${obj[prop]}`;
    }
    xml += Array.isArray(obj[prop]) ? '' : `</${prop}>\n`;
  });
  xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
  return xml
}

/**
 * @param fill The fill value (spaces to put in front of the value)
 * @param value The value to format
 */
export function formatXmlValue(fill: string, value: unknown): string {
  const typed = String(value);
  const parts = typed.split('\n').filter(i => !!i);
  const formatted = parts.map(i => `${fill}${i}`).join('\n');
  return formatted;
}

/**
 * @param str A key or value to encode as x-www-form-urlencoded.
 * @param replacePlus When set it replaces `%20` with `+`.
 * @deprecated Use `UrlEncoder.encodeQueryString()` instead. 
 */
export function wwwFormUrlEncode(str: string, replacePlus?: boolean): string {
  // Spec says to normalize newlines to \r\n and replace %20 spaces with +.
  // jQuery does this as well, so this is likely to be widely compatible.
  if (str === undefined) {
    return '';
  }
  return UrlEncoder.encodeQueryString(String(str), replacePlus);
}

/**
 * Processes a value that should be a number.
 */
export function parseNumberInput(value: any, defaultValue?: number): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  const n = Number(value);
  if (Number.isNaN(n)) {
    return defaultValue;
  }
  return n;
}

/**
 * Processes a value that should be a number.
 */
export function parseBooleanInput(value: any, defaultValue?: boolean): boolean | undefined {
  const type = typeof value;
  if (type === 'boolean') {
    return value;
  }
  if (type === 'string') {
    const trimmed = value.trim();
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
  }
  return defaultValue;
}

/**
 * Casts the `value` to the corresponding data type
 * @param type The w3 schema type
 */
export function readTypedValue(value: any, type?: string): string | null | number | boolean | undefined {
  if (value === undefined || value === null) {
    return value;
  }
  switch (type) {
    case AmfNamespace.aml.vocabularies.shapes.number:
    case AmfNamespace.aml.vocabularies.shapes.integer:
    case AmfNamespace.aml.vocabularies.shapes.float:
    case AmfNamespace.aml.vocabularies.shapes.long:
    case AmfNamespace.aml.vocabularies.shapes.double:
    case AmfNamespace.w3.xmlSchema.number:
    case AmfNamespace.w3.xmlSchema.integer:
    case AmfNamespace.w3.xmlSchema.float:
    case AmfNamespace.w3.xmlSchema.long:
    case AmfNamespace.w3.xmlSchema.double: return parseNumberInput(value, 0);
    case AmfNamespace.aml.vocabularies.shapes.boolean:
    case AmfNamespace.w3.xmlSchema.boolean: return parseBooleanInput(value, false);
    case AmfNamespace.aml.vocabularies.shapes.nil:
    case AmfNamespace.w3.xmlSchema.nil: 
      return null;
    default:
      return value;
  }
}

/**
 * Picks the union member to render.
 * @param anyOf The list of union members
 * @param selectedUnions Optional list of domain ids of currently selected unions. When set is returns a member that is "selected" or the first member otherwise.
 */
export function getUnionMember(anyOf: IShapeUnion[], selectedUnions: string[] = []): IShapeUnion {
  let renderedItem: IShapeUnion | undefined;
  if (Array.isArray(selectedUnions) && selectedUnions.length) {
    renderedItem = anyOf.find((item) => selectedUnions.includes(item.id));
  }
  if (!renderedItem) {
    [renderedItem] = anyOf;
  }
  return renderedItem;
}

/**
 * @param {ApiNodeShape} schema
 * @param {string[]=} [selectedUnions=[]]
 * @returns {ApiPropertyShape[]}
 */
export function collectNodeProperties(schema: INodeShape, selectedUnions?: string[]): IPropertyShape[] {
  let result: IPropertyShape[] = [];
  const { properties, inherits } = schema;
  if (properties.length) {
    result = [...properties];
  }
  if (Array.isArray(inherits) && inherits.length) {
    inherits.forEach((s) => {
      let node = s;
      if (node.types.includes(AmfNamespace.aml.vocabularies.shapes.UnionShape)) {
        const union = node as IUnionShape;
        const { anyOf=[] } = union;
        node = getUnionMember(anyOf, selectedUnions);
      }
      if (!node.types.includes(AmfNamespace.w3.shacl.NodeShape)) {
        return;
      }
      const typed = node as INodeShape;
      // const p = typed.properties;
      // if (Array.isArray(p) && p.length) {
      //   result = result.concat(p);
      // }
      const upper = collectNodeProperties(typed);
      if (upper.length) {
        result = result.concat(upper)
      }
    });
  }
  const merged: IPropertyShape[] = [];
  result.forEach((item) => {
    const existing = merged.find(i => i.name === item.name);
    if (existing) {
      // this should (?) merge properties from the two.
      return;
    }
    merged.push(item);
  });
  return merged;
}
