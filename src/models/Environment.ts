import { Property, IProperty } from './Property.js';
import { Server, IServer } from './Server.js';
import { IThing, Thing, Kind as ThingKind } from './Thing.js';
import v4 from '../lib/uuid.js';
import { ARCVariable } from './legacy/models/Variable.js';

export interface IEnvironmentCloneOptions {
  /**
   * By default it revalidates (re-creates) keys in the environment.
   * Set this to true to not make any changes to the keys.
   */
  withoutRevalidate?: boolean;
}

/**
 * A project environment definition.
 */
export interface IEnvironment {
  kind: typeof Kind;
  /**
   * The identifier of the environment.
   */
  key: string;
  /**
   * The environment's meta info.
   */
  info: IThing;
  /**
   * The server's definition for the environment.
   * When a server is defined for the environment then all request that have no 
   * absolute URL will inherit this server configuration.
   */
  server?: IServer;
  /**
   * The variables added to this project.
   * It overrides application defined variables.
   */
  variables: IProperty[];
  /**
   * When set this configuration does not allow to be extended by the parent object's environment configuration.
   * By default an environment can be extended by the parent object's values.
   */
  encapsulated?: boolean;
  /**
   * The security to be applied to all requests that are going to this environment.
   */
  security?: unknown;
}

export const Kind = 'Core#Environment';

/**
 * An environment is applied to a project or a folder.
 * It consists of a list of variables and a server configuration.
 * This allows to apply the runtime configuration just by changing the environment.
 */
export class Environment {
  kind = Kind;
  key = '';
  /**
   * The name of the environment.
   */
  info: Thing = new Thing({ kind: ThingKind });
  /**
   * The variables added to this project.
   * It overrides application defined variables.
   */
  variables: Property[] = [];
  /**
   * The server's definition for the environment.
   * When a server is defined for the environment then all request that have no 
   * absolute URL will inherit this server configuration.
   */
  server?: Server;
  /**
   * When set this configuration does not allow to be extended by the parent object's environment configuration.
   * By default an environment can be extended by the parent object's values.
   * 
   * When encapsulation is disabled you can, for example, skip server definition and only overwrite variables. 
   */
  encapsulated = false;
  /**
   * The security to be applied to all requests that are going to this server.
   */
  security?: unknown;
  
  /**
   * Creates a new Environment object from a name.
   * 
   * @param name The name to set.
   */
  static fromName(name: string): Environment {
    const key = v4();
    const info = new Thing({ kind: ThingKind, name });
    const definition = new Environment({
      key,
      kind: Kind,
      info: info.toJSON(),
      variables: [],
    });
    return definition;
  }

  static fromLegacyVariables(name: string, variables: ARCVariable[]): Environment {
    const key = v4();
    const info = new Thing({ kind: ThingKind, name });
    const definition = new Environment({
      key,
      kind: Kind,
      info: info.toJSON(),
      variables: [],
    });
    variables.forEach((i) => {
      const name = i.variable || i.name;
      const property = Property.fromApiType(i);
      property.name = name;
      definition.variables.push(property);
    });
    return definition;
  }

  /**
   * @param input The environment definition used to restore the state.
   */
  constructor(input?: string|IEnvironment) {
    let init: IEnvironment;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        key: v4(),
        info: {
          kind: ThingKind,
          name: '',
        },
        variables: [],
      };
    }
    this.new(init);
  }

  /**
   * Creates a new environment clearing anything that is so far defined.
   * 
   * Note, this throws an error when the environment is not an environment. 
   */
  new(init: IEnvironment): void {
    if (!Environment.isEnvironment(init)) {
      throw new Error(`Not an environment.`);
    }
    const { key=v4(), variables, info, server, encapsulated=false, security } = init;
    this.kind = Kind;
    this.key = key;
    this.encapsulated = encapsulated;
    this.security = security;
    if (Array.isArray(variables)) {
      this.variables = variables.map(i => new Property(i))
    } else {
      this.variables = [];
    }
    if (server) {
      this.server = new Server(server);
    } else {
      this.server = undefined;
    }
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = new Thing({ kind: ThingKind, name: '' });
    }
  }

  /**
   * Checks whether the input is a definition of a environment.
   */
  static isEnvironment(input: unknown): boolean {
    const typed = input as IEnvironment;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IEnvironment {
    const { variables=[], encapsulated=false, server } = this;
    const result: IEnvironment = {
      kind: Kind,
      key: this.key,
      info: this.info.toJSON(),
      variables: variables.map((v) => v.toJSON()),
      encapsulated,
    };
    if (server) {
      result.server = server.toJSON();
    }
    if (this.security) {
      result.security = this.security;
    }
    return result;
  }

  addVariable(name: string, value: unknown): Property;
  addVariable(variable: IProperty): Property;

  /**
   * Adds a new variable to the list of variables.
   * It makes sure the variables property is initialized.
   */
  addVariable(variableOrName: IProperty|string, value?: unknown): Property {
    if (!Array.isArray(this.variables)) {
      this.variables = [];
    }
    let prop: Property;
    if (typeof variableOrName === 'string') {
      prop = Property.fromType(variableOrName, value);
    } else {
      prop = new Property(variableOrName);
    }
    this.variables.push(prop);
    return prop;
  }

  /**
   * Reads the server configuration.
   * @param force When set then it creates a server instance when missing.
   */
  getServer(force?: boolean): Server|undefined {
    if (!this.server && !force) {
      return undefined;
    }
    
    if (!this.server) {
      this.server = new Server();
    }
    return this.server;
  }

  /**
   * Adds a new server definition.
   * @param uri The base URI to create the server from
   */
  addServer(uri: string): Server;

  /**
   * Adds a new server definition.
   * @param info The server definition.
   */
  addServer(info: IServer): Server;

  /**
   * Adds a new server definition.
   * @param uriOrInfo Either URI to create the server from or the definition of the server.
   */
  addServer(uriOrInfo: string | IServer): Server {
    let srv: Server;
    if (typeof uriOrInfo === 'string') {
      srv = Server.fromUri(uriOrInfo);
    } else {
      srv = new Server(uriOrInfo);
    }
    this.server = srv;
    return srv;
  }

  /**
   * Makes a copy of this environment
   * @param opts Cloning options.
   */
  clone(opts: IEnvironmentCloneOptions = {}): Environment {
    const copy = new Environment(this.toJSON());
    if (!opts.withoutRevalidate) {
      copy.key = v4();
    }
    return copy;
  }
}
