import { Lorem, Types } from '@pawel-up/data-mock';
import { ArcDataMockInit, VariableInit } from '../LegacyInterfaces.js';
import { ARCVariable } from '../../models/legacy/models/Variable.js';

export class Variables {
  types: Types;
  lorem: Lorem;

  constructor(init: ArcDataMockInit={}) {
    this.types = new Types(init.seed);
    this.lorem = new Lorem(init);
  }

  /**
   * Generates a random variable
   */
  variable(init: VariableInit={}): ARCVariable {
    let isDefault;
    if (init.defaultEnv) {
      isDefault = true;
    } else if (init.randomEnv) {
      isDefault = false;
    } else {
      isDefault = this.types.boolean();
    }
    
    const result = /** @type ARCVariable */ ({
      enabled: this.types.boolean({ likelihood: 85 }),
      value: this.lorem.sentence({ words: 2 }),
      name: this.lorem.word(),
      _id: this.types.uuid(),
      environment: '',
    });
    if (isDefault) {
      result.environment = 'default';
    } else {
      result.environment = this.lorem.sentence({ words: 2 });
    }
    return result;
  }

  /**
   * Generates a number of variables.
   * @param size The number of variables to generate.
   */
  listVariables(size = 25, init: VariableInit={}): ARCVariable[] {
    const result = [];
    for (let i = 0; i < size; i++) {
      result.push(this.variable(init));
    }
    return result;
  }
}
