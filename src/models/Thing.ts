import * as PatchUtils from './PatchUtils';

export const Kind = 'ARC#Thing';

/**
 * An interface describing a base metadata of a thing.
 */
export declare interface IThing {
  /**
   * The data kind. The application ignores the input with an unknown `kind`, unless it can be determined from the context.
   */
  kind?: 'ARC#Thing';
  /**
   * The name of the thing.
   */
  name?: string;
  /**
   * The description of the thing.
   */
  description?: string;
  /**
   * The version number of the thing.
   */
  version?: string;
}

export class Thing {
  kind = Kind;
  /**
   * The name of the thing.
   */
  name?: string;
  /**
   * The description of the thing.
   */
  description?: string;
  /**
   * The version number of the thing.
   */
  version?: string;

  /**
   * Creates a basic description from a name.
   */
  static fromName(name: string): Thing {
    const thing = new Thing({
      name,
      kind: Kind,
    });
    return thing;
  }

  /**
   * @param input The thing definition used to restore the state.
   */
  constructor(input?: string | IThing) {
    let init: IThing;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
      };
    }
    this.new(init);
  }

  /**
   * Creates a new thing clearing anything that is so far defined.
   * 
   * Note, this throws an error when the server is not an ARC thing.
   */
  new(init: IThing): void {
    if (!Thing.isThing(init)) {
      throw new Error(`Not an ARC thing.`);
    }
    const { description, name, version } = init;
    this.kind = Kind;
    this.name = name;
    this.description = description;
    this.version = version;
  }

  /**
   * Checks whether the input is a definition of a server.
   */
  static isThing(input: unknown): boolean {
    const typed = input as IThing;
    if (input && typed.kind === Kind) {
      return true;
    }
    return false;
  }

  toJSON(): IThing {
    const result: IThing = {
      kind: Kind,
    };
    if (this.name) {
      result.name = this.name;
    }
    if (this.description) {
      result.description = this.description;
    }
    if (this.version) {
      result.version = this.version;
    }
    return result;
  }

  /**
   * Patches a folder.
   * @param operation The operation to perform.
   * @param path The path to the value to update.
   * @param value Optional, the value to set.
   */
  patch(operation: PatchUtils.PatchOperation, path: string, value?: unknown): void {
    if (!PatchUtils.patchOperations.includes(operation)) {
      throw new Error(`Unknown operation: ${operation}`);
    }
    if (PatchUtils.valueRequiredOperations.includes(operation) && typeof value === 'undefined') {
      throw new Error(PatchUtils.TXT_value_required);
    }

    const parts = path.split('.');
    this.validatePatch(operation, parts, value);
    const root: keyof IThing = parts[0] as keyof IThing;
    switch (operation) {
      case 'append': this.patchAppend(root); break;
      case 'delete': this.patchDelete(root); break;
      case 'set': this.patchSet(root, value); break;
    }
  }

  protected patchDelete(property: keyof IThing): void {
    switch (property) {
      case 'name':
      case 'description':
      case 'version':
        this[property] = undefined;
        break;
    }
  }

  protected patchSet(property: keyof IThing, value: unknown): void {
    switch (property) {
      case 'name':
      case 'description':
      case 'version':
        this[property] = String(value);
        break;
    }
  }

  protected patchAppend(property: keyof IThing): void {
    throw new Error(`Unable to "append" to the ${property} property. Did you mean "set"?`);
  }

  validatePatch(operation: PatchUtils.PatchOperation, path: string[], value?: unknown): void {
    if (path.length !== 1) {
      throw new Error(PatchUtils.TXT_unknown_path);
    }
    const root: keyof IThing = path[0] as keyof IThing;
    switch (root) {
      case 'name':
      case 'description':
      case 'version':
        PatchUtils.validateTextInput(operation, value);
        break;
      case 'kind':
        throw new Error(PatchUtils.TXT_delete_kind);
      default:
        throw new Error(PatchUtils.TXT_unknown_path);
    }
  }
}
