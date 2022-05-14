import v4 from '../../lib/uuid.js';
import { ArrayNodeTypes, ObjectNodeTypes, ScalarNodeTypes } from '../AmfTypes.js';
import { ICustomDomainProperty } from '../definitions/Base.js';
import { AmfNamespace } from '../definitions/Namespace.js';
import { IArrayNode, IDataNode, IDataNodeUnion, IObjectNode, IScalarNode } from '../definitions/Shapes.js';

export type IDataNodeInit = 'scalar' | 'object' | 'array';

/**
 * A class that manipulates the AMF's DataNode node.
 */
export class AmfDataNode {
  id = v4();

  /**
   * AMF domain types.
   * This is set in the constructor
   */
  types: string[];

  /**
   * The name of this data node.
   */
  name?: string;

  /**
   * Set when the object node type
   */
  properties?: { [key: string]: AmfDataNode };

  /**
   * Scalar type value. Always a string.
   */
  value?: string;

  /** 
   * Scalar type value data type.
   */
  dataType?: string;

  /**
   * Set when the type is array.
   */
  members?: AmfDataNode[];

  customDomainProperties: ICustomDomainProperty[] = [];

  static scalar(value: string, type: string): AmfDataNode {
    const result = new AmfDataNode('scalar');
    result.value = value;
    result.dataType = type;
    return result;
  }

  constructor(init: IDataNodeUnion | IDataNodeInit) {
    if (typeof init === 'string') {
      if (init === 'scalar') {
        this.types = ScalarNodeTypes;
      } else if (init === 'array') {
        this.types = ArrayNodeTypes;
      } else if (init === 'object') {
        this.types = ObjectNodeTypes;
      } else {
        throw new Error(`Invalid data node init option: ${init}`);
      }
      return;
    }
    if (!init) {
      throw new Error(`Expected an initialization option.`);
    }
    const union = init as IDataNodeUnion;
    const { id, types, customDomainProperties } = union;
    this.id = id;
    this.types = types;
    this.customDomainProperties = customDomainProperties;
    if (types.includes(AmfNamespace.aml.vocabularies.data.Scalar)) {
      const typed = union as IScalarNode;
      this.value = typed.value;
      this.dataType = typed.dataType;
    } else if (types.includes(AmfNamespace.aml.vocabularies.data.Object)) {
      const typed = union as IObjectNode;
      this.properties = {};
      Object.keys(typed.properties).forEach((key) => {
        const instance = new AmfDataNode(typed.properties[key]);
        this.properties![key] = instance;
      });
    } else if (types.includes(AmfNamespace.aml.vocabularies.data.Array)) {
      const typed = union as IArrayNode;
      this.members = [];
      if (Array.isArray(typed.members)) {
        typed.members.forEach((member) => {
          const instance = new AmfDataNode(member);
          this.members!.push(instance);
        });
      }
    }
  }

  toJSON(): IDataNodeUnion {
    const { id, customDomainProperties, types, name } = this;
    const result: IDataNode = {
      id,
      types,
      customDomainProperties,
    };
    if (name) {
      result.name = name;
    }

    if (types.includes(AmfNamespace.aml.vocabularies.data.Scalar)) {
      const typed = result as IScalarNode;
      typed.dataType = this.dataType;
      typed.value = this.value;
    } else if (types.includes(AmfNamespace.aml.vocabularies.data.Object)) {
      const typed = result as IObjectNode;
      typed.properties = {};
      if (this.properties) {
        Object.keys(this.properties).forEach((key) => {
          typed.properties[key] = this.properties![key].toJSON();
        });
      }
    } else if (types.includes(AmfNamespace.aml.vocabularies.data.Array)) {
      const typed = result as IArrayNode;
      typed.members = [];
      if (this.members) {
        this.members.forEach((member) => {
          typed.members.push(member.toJSON());
        });
      }
    }
    return result;
  }

  /**
   * Adds a member to the list of members.
   * It throws when this is not an array node.
   * 
   * @param init The member to add.
   */
  addMember(init: AmfDataNode): void {
    if (!this.types.includes(AmfNamespace.aml.vocabularies.data.Array)) {
      throw new Error(`Not an ArrayNode.`);
    }
    if (!this.members) {
      this.members = [];
    }
    this.members.push(init);
  }

  /**
   * Removes a member from the list of members.
   * It throws when this is not an array node.
   * 
   * @param id The domain id of the member to remove.
   */
  removeMember(id: string): void {
    if (!this.types.includes(AmfNamespace.aml.vocabularies.data.Array)) {
      throw new Error(`Not an ArrayNode.`);
    }
    if (!this.members) {
      return;
    }
    const index = this.members.findIndex(i => i.id === id);
    if (index >= 0) {
      this.members.splice(index, 1);
    }
  }

  /**
   * Adds a property to the ObjectNode.
   * It throws when this is not an object node.
   * 
   * @param name The name of the property.
   * @param value The instance of the DataNode to set.
   */
  addProperty(name: string, value: AmfDataNode): void {
    if (!this.types.includes(AmfNamespace.aml.vocabularies.data.Object)) {
      throw new Error(`Not an ObjectNode.`);
    }
    if (!this.properties) {
      this.properties = {};
    }
    this.properties[name] = value;
  }

  /**
   * Deletes a property by name.
   * 
   * @param name The name of the property to delete.
   */
  removeProperty(name: string): void {
    if (!this.types.includes(AmfNamespace.aml.vocabularies.data.Object)) {
      throw new Error(`Not an ObjectNode.`);
    }
    if (!this.properties) {
      return;
    }
    delete this.properties[name];
  }
}
