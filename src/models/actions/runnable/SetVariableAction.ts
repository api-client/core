import { Runnable, IRunnable } from './Runnable.js';
import { IDataSourceConfiguration } from '../Condition.js';
import { RequestDataSourceEnum } from '../Enums.js';

export const Kind = 'ARC#SetVariableAction';

export interface ISetVariableAction extends IRunnable {
  kind?: 'ARC#SetVariableAction';
  /**
   * Name of the variable to set
   */
  name: string;
  /**
   * Source of the cookie value
   */
  source: IDataSourceConfiguration;
}

export class SetVariableAction extends Runnable {
  kind = Kind;
  /**
   * Name of the variable to set
   */
  name = '';
  /**
   * Source of the cookie value
   */
  source: IDataSourceConfiguration = { source: RequestDataSourceEnum.url, };

  constructor(input?: string | ISetVariableAction) {
    super();
    let init: ISetVariableAction;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        name: '',
        source: { source: RequestDataSourceEnum.url, },
      };
    }
    this.new(init);
  }

  new(init: ISetVariableAction): void {
    const { source={ source: RequestDataSourceEnum.url, }, name, } = init;
    this.kind = Kind;
    this.source = source;
    this.name = name;
  }

  toJSON(): ISetVariableAction {
    const result: ISetVariableAction = {
      kind: Kind,
      source: this.source,
      name: this.name,
    };
    return result;
  }

  isValid(): boolean {
    return !!this.name && !!this.source;
  }
}
