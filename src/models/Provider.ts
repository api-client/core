import * as PatchUtils from './PatchUtils';

/**
 * An interface describing a provider of a thing.
 */
export declare interface IProvider {
  /**
   * The data kind. The application ignores the input with an unknown `kind`, unless it can be determined from the context.
   */
  kind: 'ARC#Provider';
  /**
   * The URL to the provider
   */
  url?: string;
  /**
   * The name to the provider
   */
  name?: string;
  /**
   * The email to the provider
   */
  email?: string;
}

export const Kind = 'ARC#Provider';

export class Provider {
  kind = Kind;
  /**
   * The URL to the provider
   */
  url?: string;
  /**
   * The name to the provider
   */
  name?: string;
  /**
   * The email to the provider
   */
  email?: string;
  /**
   * @param input The provider definition used to restore the state.
   */
  constructor(input?: string|IProvider) {
    let init: IProvider;
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
   * Creates a new provider clearing anything that is so far defined.
   * 
   * Note, this throws an error when the provider is not an ARC provider object.
   */
  new(init: IProvider): void {
    if (!Provider.isProvider(init)) {
      throw new Error(`Not an ARC provider.`);
    }
    const { url, email, name } = init;
    this.kind = Kind;
    this.name = name;
    this.email = email;
    this.url = url;
  }

  /**
   * Checks whether the input is a definition of a provider.
   */
  static isProvider(input: unknown): boolean {
    const typed = input as IProvider;
    if (input && typed.kind === Kind) {
      return true;
    }
    return false;
  }

  toJSON(): IProvider {
    const result:IProvider = {
      kind: Kind,
    };
    if (this.url) {
      result.url = this.url;
    }
    if (this.email) {
      result.email = this.email;
    }
    if (this.name) {
      result.name = this.name;
    }
    return result;
  }

  /**
   * Patches the Provider.
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
    const root: keyof IProvider = parts[0] as keyof IProvider;
    switch (operation) {
      case 'append': this.patchAppend(root); break;
      case 'delete': this.patchDelete(root); break;
      case 'set': this.patchSet(root, value); break;
    }
  }

  protected patchDelete(property: keyof IProvider): void {
    switch (property) {
      case 'name':
      case 'url':
      case 'email':
        this[property] = undefined;
        break;
    }
  }

  protected patchSet(property: keyof IProvider, value: unknown): void {
    switch (property) {
      case 'name':
      case 'url':
      case 'email':
        this[property] = String(value);
        break;
    }
  }

  protected patchAppend(property: keyof IProvider): void {
    throw new Error(`Unable to "append" to the ${property} property. Did you mean "set"?`);
  }

  validatePatch(operation: PatchUtils.PatchOperation, path: string[], value?: unknown): void {
    if (path.length !== 1) {
      throw new Error(PatchUtils.TXT_unknown_path);
    }
    const root: keyof IProvider = path[0] as keyof IProvider;
    switch (root) {
      case 'name':
      case 'url':
      case 'email':
        PatchUtils.validateTextInput(operation, value);
        break;
      case 'kind':
        throw new Error(PatchUtils.TXT_delete_kind);
      default:
        throw new Error(PatchUtils.TXT_unknown_path);
    }
  }
}
