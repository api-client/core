import { DataPropertyType } from "browser.js";
import { AmfNamespace } from "./definitions/Namespace.js";

export const ScalarTypes = [
  AmfNamespace.aml.vocabularies.shapes.ScalarShape,
  AmfNamespace.aml.vocabularies.shapes.AnyShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const ArrayTypes = [
  AmfNamespace.aml.vocabularies.shapes.ArrayShape,
  AmfNamespace.aml.vocabularies.shapes.AnyShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const NodeTypes = [
  AmfNamespace.w3.shacl.NodeShape,
  AmfNamespace.aml.vocabularies.shapes.AnyShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const PropertyTypes = [
  AmfNamespace.w3.shacl.PropertyShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const NilTypes = [
  AmfNamespace.aml.vocabularies.shapes.NilShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const UnionTypes = [
  AmfNamespace.aml.vocabularies.shapes.UnionShape,
  AmfNamespace.aml.vocabularies.shapes.AnyShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const FileTypes = [
  AmfNamespace.aml.vocabularies.shapes.FileShape,
  AmfNamespace.aml.vocabularies.shapes.AnyShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const AnyTypes = [
  AmfNamespace.aml.vocabularies.shapes.AnyShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const SchemaTypes = [
  AmfNamespace.aml.vocabularies.shapes.SchemaShape,
  AmfNamespace.aml.vocabularies.shapes.AnyShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const TupleTypes = [
  AmfNamespace.aml.vocabularies.shapes.TupleShape,
  AmfNamespace.aml.vocabularies.shapes.ArrayShape,
  AmfNamespace.aml.vocabularies.shapes.AnyShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const RecursiveTypes = [
  AmfNamespace.aml.vocabularies.shapes.RecursiveShape,
  AmfNamespace.w3.shacl.Shape,
  AmfNamespace.aml.vocabularies.shapes.Shape,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const XmlSerializationTypes = [
  AmfNamespace.aml.vocabularies.shapes.XMLSerializer,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];

export const ScalarNodeTypes = [
  AmfNamespace.aml.vocabularies.data.Scalar,
  AmfNamespace.aml.vocabularies.data.Node,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const ArrayNodeTypes = [
  AmfNamespace.aml.vocabularies.data.Array,
  AmfNamespace.w3.rdfSchema.Seq,
  AmfNamespace.aml.vocabularies.data.Node,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const ObjectNodeTypes = [
  AmfNamespace.aml.vocabularies.data.Object,
  AmfNamespace.aml.vocabularies.data.Node,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];
export const ExampleTypes = [
  AmfNamespace.aml.vocabularies.apiContract.Example,
  AmfNamespace.aml.vocabularies.document.DomainElement,
];

/**
 * Translates the DataProperty type to an AMF data type.
 * @param type The property data type
 * @returns AMF shape dataType
 */
export function modelTypeToAmfDataType(type: DataPropertyType): string {
  switch (type) {
    case 'boolean': return AmfNamespace.aml.vocabularies.shapes.boolean;
    case 'nil': return AmfNamespace.aml.vocabularies.shapes.nil;
    case 'date': return AmfNamespace.w3.xmlSchema.date;
    case 'datetime': return AmfNamespace.w3.xmlSchema.dateTime;
    case 'time': return AmfNamespace.aml.vocabularies.shapes.dateTimeOnly;
    case 'number': return AmfNamespace.w3.xmlSchema.number;
    case 'integer': return AmfNamespace.w3.xmlSchema.integer;
    case 'any': return AmfNamespace.aml.vocabularies.shapes.AnyShape;
    default: return AmfNamespace.w3.xmlSchema.string;
  }
}
