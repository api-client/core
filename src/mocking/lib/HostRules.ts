import { Lorem, Types, Internet, IDataMockInit } from '@pawel-up/data-mock';
import { IHostRule } from '../../models/HostRule.js';

export class HostRules {
  types: Types;
  lorem: Lorem;
  internet: Internet;

  constructor(init: IDataMockInit = {}) {
    this.types = new Types(init.seed);
    this.lorem = new Lorem(init);
    this.internet = new Internet(init);
  }

  /**
   * Generates random host rule data object.
   */
  rule(): IHostRule {
    const result: IHostRule = {
      key: this.types.uuid(),
      from: this.internet.uri(),
      to: this.internet.uri(),
      enabled: this.types.boolean(),
      comment: this.lorem.paragraph(),
    };
    return result;
  }

  /**
   * Generates a list of host rules.
   *
   * @param size Number of items to generate. Default to 25.
   * @return List of datastore entries.
   */
  rules(size = 25): IHostRule[] {
    const result = [];
    for (let i = 0; i < size; i++) {
      result.push(this.rule());
    }
    return result;
  }
}
