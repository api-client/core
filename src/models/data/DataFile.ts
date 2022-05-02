import v4 from "../../lib/uuid.js";
import { File, IFile, DefaultOwner } from "../store/File.js";
import { Kind as ThingKind } from '../Thing.js';
import { DataNamespace, IDataNamespace } from "./DataNamespace.js";

export const Kind = 'Core#DataFile';

export interface IDataFile extends IFile {
  kind: typeof Kind;
}

export class DataFile extends File {
  kind = Kind;

  /**
   * Creates the file definition for a DataNamespace contents.
   * 
   * @param input The data namespace instance or schema.
   * @param owner Optional owner to set.
   */
  static fromDataNamespace(input: DataNamespace | IDataNamespace, owner?: string): DataFile {
    let final: IDataNamespace;
    if (typeof (input as DataNamespace).toJSON === 'function') {
      final = (input as DataNamespace).toJSON();
    } else {
      final = input as IDataNamespace;
    }
    const init: IDataFile = {
      kind: Kind,
      key: final.key,
      info: { ...final.info },
      lastModified: { user: '', time: 0, byMe: false },
      owner: owner || DefaultOwner,
      parents: [],
      permissionIds: [],
      permissions: [],
    };
    return new DataFile(init);
  }

  constructor(input?: string | IDataFile) {
    super();
    let init: IDataFile;
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
        owner: DefaultOwner,
        parents: [],
        permissionIds: [],
        permissions: [],
        lastModified: { user: '', time: 0, byMe: false },
      };
    }
    this.new(init);
  }
  
  new(init: IDataFile): void {
    if (!DataFile.isDataFile(init)) {
      throw new Error(`Not a data file.`);
    }
    super.new(init);
    this.kind = Kind;
  }

  static isDataFile(input: unknown): boolean {
    const typed = input as IDataFile;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IDataFile {
    const result: IDataFile = {
      ...super.toJSON(),
      kind: Kind,
    };
    return result;
  }
}
