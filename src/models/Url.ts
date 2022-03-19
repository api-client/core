
export interface IUrl {
  /**
   * A number of times the URL was used
   */
  cnt: number;
  /**
   * Last use timestamp.
   */
  time: number;
  /**
   * The request URL stored in the history.
   */
  url: string;
  /**
   * A timestamp of the midnight that corresponds to the `time` property.
   */
  midnight?: number;
}

/**
 * An object representing an URL stored in the data store.
 * This is an URL used to make a request.
 */
export class Url {
  /**
   * A number of times the URL was used
   */
  cnt = 0;
  /**
   * Last use timestamp.
   */
  time:number = Date.now();
  /**
   * The request URL stored in the history.
   */
  url = '';
  /**
   * A timestamp of the midnight that corresponds to the `time` property.
   */
  midnight?: number;

  /**
   * @param input The URL definition used to restore the state.
   */
  constructor(input: string|IUrl) {
    let init: IUrl;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        cnt: 0,
        time: Date.now(),
        url: '',
      };
    }
    this.new(init);
  }

  /**
   * Creates a new URL clearing anything that is so far defined.
   */
  new(init: IUrl): void {
    const { url='', cnt=0, time = Date.now(), midnight } = init;
    this.url = url;
    this.cnt = cnt;
    this.time = time;
    if (midnight) {
      this.midnight = midnight;
    } else {
      const d = new Date(this.time);
      d.setHours(0, 0, 0, 0)
      this.midnight = d.getTime();
    }
  }

  toJSON(): IUrl {
    const result: IUrl = {
      url: this.url,
      cnt: this.cnt,
      time: this.time,
      midnight: this.midnight,
    };
    return result;
  }
}
