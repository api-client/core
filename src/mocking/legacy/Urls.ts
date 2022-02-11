import { Internet, Types, Time } from '@pawel-up/data-mock';
import { ArcDataMockInit } from '../LegacyInterfaces.js';
import { ARCUrlHistory } from '../../models/legacy/models/UrlHistory.js';

export class Urls {
  types: Types;
  internet: Internet;
  time: Time;

  constructor(init: ArcDataMockInit={}) {
    this.types = new Types(init.seed);
    this.internet = new Internet(init);
    this.time = new Time(init);
  }

  /**
   * Generates a single ARC URL model item.
   */
  url(): ARCUrlHistory {
    const url = this.internet.uri();
    const time = this.types.datetime().getTime();
    const result: ARCUrlHistory = {
      time,
      cnt: this.types.number({ min: 100, max: 1000 }),
      _id: url,
      url,
      midnight: this.time.midnight(time),
    };
    return result;
  }

  /**
   * Generates list of ARC URL models.
   *
   * @returns List of datastore entries.
   */
  urls(size = 25): ARCUrlHistory[] {
    const result = [];
    for (let i = 0; i < size; i++) {
      result.push(this.url());
    }
    return result;
  }
}
