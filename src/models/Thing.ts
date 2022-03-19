export const Kind = 'Core#Thing';

/**
 * An interface describing a base metadata of a thing.
 */
export declare interface IThing {
  /**
   * The data kind. The application ignores the input with an unknown `kind`, unless it can be determined from the context.
   */
  kind?: typeof Kind;
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
   * Note, this throws an error when the server is not a thing.
   */
  new(init: IThing): void {
    if (!Thing.isThing(init)) {
      throw new Error(`Not a thing.`);
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
}
