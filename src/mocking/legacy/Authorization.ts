import { Internet, Types } from '@pawel-up/data-mock';
import { ArcDataMockInit } from '../LegacyInterfaces.js';
import { ARCAuthData } from '../../models/legacy/models/AuthData.js';

export class Authorization {
  types: Types;
  internet: Internet;

  constructor(init: ArcDataMockInit={}) {
    this.types = new Types(init.seed);
    this.internet = new Internet(init);
  }

  /**
   * Generates random Basic authorization object.
   */
  basic(): ARCAuthData {
    const result: ARCAuthData = {
      _id: `basic/${this.types.string()}`,
      username: this.internet.userName(),
      password: this.types.hash(),
    };
    return result;
  }

  /**
   * Generates basic authorization data
   *
   * @param size Number of items to generate. Default to 25.
   * @return List of datastore entries.
   */
  basicList(size = 25): ARCAuthData[] {
    const result = [];
    for (let i = 0; i < size; i++) {
      result.push(this.basic());
    }
    return result;
  }
}
