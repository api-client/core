import * as PatchUtils from './PatchUtils.js';

export const Kind = 'ARC#License';

export interface ILicense {
  kind: 'ARC#License'
  /**
   * The URL to the license text.
   * Only `url` or `content` can be used at a time.
   */
  url?: string;
  /**
   * The name of the license.
   */
  name?: string;
  /**
   * The content of the license.
   * Only `url` or `content` can be used at a time.
   */
  content?: string;
}

export class License {
  kind = Kind;
  /**
   * The URL to the license text.
   * Only `url` or `content` can be used at a time.
   */
  url?: string;
  /**
   * The name of the license.
   */
  name?: string;
  /**
   * The content of the license.
   * Only `url` or `content` can be used at a time.
   */
  content?: string;

  static fromUrl(url: string, name?: string): License {
    return new License({
      kind: Kind,
      url,
      name,
    });
  }

  static fromContent(content: string, name?: string): License {
    return new License({
      kind: Kind,
      content,
      name,
    });
  }

  /**
   * @param input The license definition used to restore the state.
   */
  constructor(input?: string|ILicense) {
    let init: ILicense;
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
   * Creates a new license clearing anything that is so far defined.
   * 
   * Note, this throws an error when the license is not an ARC license object.
   */
  new(init: ILicense): void {
    if (!License.isLicense(init)) {
      throw new Error(`Not an ARC license.`);
    }
    const { url, content, name } = init;
    this.kind = Kind;
    this.name = name;
    this.content = content;
    this.url = url;
  }

  /**
   * Checks whether the input is a definition of a license.
   */
  static isLicense(input: unknown): boolean {
    const typed = input as ILicense;
    if (typed.kind === Kind) {
      return true;
    }
    return false;
  }

  toJSON(): ILicense {
    const result: ILicense = {
      kind: Kind,
    };
    if (this.name) {
      result.name = this.name;
    }
    if (this.url) {
      result.url = this.url;
    }
    if (this.content) {
      result.content = this.content;
    }
    return result;
  }

  /**
   * Patches the license.
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
    const root: keyof ILicense = parts[0] as keyof ILicense;
    switch (operation) {
      case 'append': this.patchAppend(root); break;
      case 'delete': this.patchDelete(root); break;
      case 'set': this.patchSet(root, value); break;
    }
  }

  protected patchDelete(property: keyof ILicense): void {
    switch (property) {
      case 'name':
      case 'url':
      case 'content':
        this[property] = undefined;
        break;
    }
  }

  protected patchSet(property: keyof ILicense, value: unknown): void {
    switch (property) {
      case 'name':
      case 'url':
      case 'content':
        this[property] = String(value);
        break;
    }
  }

  protected patchAppend(property: keyof ILicense): void {
    throw new Error(`Unable to "append" to the "${property}" property. Did you mean "set"?`);
  }

  validatePatch(operation: PatchUtils.PatchOperation, path: string[], value?: unknown): void {
    if (path.length !== 1) {
      throw new Error(PatchUtils.TXT_unknown_path);
    }
    const root: keyof ILicense = path[0] as keyof ILicense;
    switch (root) {
      case 'name':
      case 'url':
      case 'content':
        PatchUtils.validateTextInput(operation, value);
        break;
      case 'kind':
        throw new Error(PatchUtils.TXT_delete_kind);
      default:
        throw new Error(PatchUtils.TXT_unknown_path);
    }
  }
}
