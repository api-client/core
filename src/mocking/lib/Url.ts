import { IDataMockInit, Internet, Types } from "@pawel-up/data-mock";
import { IUrl } from "../../models/Url.js";

/**
 * Mocks the URL data.
 */
export class Url {
  types: Types;
  internet: Internet;
  
  constructor(init: IDataMockInit={}) {
    this.types = new Types(init.seed);
    this.internet = new Internet(init);
  }

  url(): IUrl {
    const date = this.types.datetime();
    const result: IUrl = {
      url: this.internet.uri(),
      cnt: this.types.number({ min: 0 }),
      time: date.getTime(),
    };
    date.setHours(0, 0, 0, 0);
    result.midnight = date.getTime();
    return result;
  }

  urls(size=25): IUrl[] {
    const result: IUrl[] = [];
    for (let i = 0; i < size; i++) {
      result.push(this.url());
    }
    return result;
  }
}
