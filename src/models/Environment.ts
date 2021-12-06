import { Property, IProperty } from './Property.js';
import { Server, IServer } from './Server.js';
import { IThing, Thing, Kind as ThingKind } from './Thing.js';
import v4 from '../lib/uuid.js';
import { ARCVariable } from './legacy/models/Variable.js';

/**
 * A project environment definition.
 */
export interface IEnvironment {
  kind: 'ARC#Environment';
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
}

export const Kind = 'ARC#Environment';

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
   * Creates a new Environment object from a name.
   * @param project The top-most project.
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
  constructor(input: string|IEnvironment) {
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
   * Note, this throws an error when the environment is not an ARC environment. 
   */
  new(init: IEnvironment): void {
    if (!Environment.isEnvironment(init)) {
      throw new Error(`Not an ARC environment.`);
    }
    const { key=v4(), variables, info, server, encapsulated=false } = init;
    this.kind = Kind;
    this.key = key;
    this.encapsulated = encapsulated;
    if (Array.isArray(variables)) {
      this.variables = variables.map(i => new Property(i))
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
    if (!input || !Array.isArray(typed.variables) || typed.kind !== Kind) {
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
    return result;
  }

  /**
   * Adds a new variable to the list of variables.
   * It makes sure the variables property is initialized.
   */
  addVariable(variable: IProperty): void {
    if (!Array.isArray(this.variables)) {
      this.variables = [];
    }
    this.variables.push(new Property(variable));
  }

  /**
   * Reads the server configuration.
   * @param force When set then it creates a server instance when missing.
   */
  getServer(force?: boolean): Server|undefined {
    if (!this.server || !force) {
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
}
