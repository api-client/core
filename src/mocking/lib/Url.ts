import { Internet, Types, Time, IDataMockInit } from '@pawel-up/data-mock';
import { IUrl } from '../../models/Url.js';

export class Url {
  types: Types;
  internet: Internet;
  time: Time;

  constructor(init: IDataMockInit={}) {
    this.types = new Types(init.seed);
    this.internet = new Internet(init);
    this.time = new Time(init);
  }

  /**
   * Generates a single ARC URL model item.
   */
  url(): IUrl {
    const url = this.internet.uri();
    const time = this.types.datetime().getTime();
    const result: IUrl = {
      time,
      cnt: this.types.number({ min: 100, max: 1000 }),
      key: url,
      midnight: this.time.midnight(time),
    };
    return result;
  }

  /**
   * Generates list of ARC URL models.
   *
   * @returns List of datastore entries.
   */
  urls(size = 25): IUrl[] {
    const result: IUrl[] = [];
    for (let i = 0; i < size; i++) {
      result.push(this.url());
    }
    return result;
  }
}
