export const Kind = 'Core#HistoryIndex';

/**
 * An object that is stored in API Client's internal store to build history navigation.
 * It does not contain all the history data. Just the ones that are presented in the UI.
 */
export interface IHistoryIndex {
  kind: typeof Kind;
  /**
   * Timestamp when the request was last updated.
   */
  updated: number;
  /**
   * A timestamp of the midnight when the request object was updated
   */
  midnight: number;
  /**
   * The request URL
   */
  url: string;
  /**
   * HTTP method name
   */
  method: string;
}

export class HistoryIndex {
  /**
   * Timestamp when the request was last updated.
   */
  updated = 0;
  /**
   * A timestamp of the midnight when the request object was updated
   */
  midnight = 0;
  /**
   * The request URL
   */
  url = '';
  /**
   * HTTP method name
   */
  method = 'GET';

  constructor(input?: string|IHistoryIndex) {
    let init: IHistoryIndex;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        updated: 0,
        midnight: 0,
        url: '',
        method: 'GET',
      };
    }
    this.new(init);
  }

  new(init: IHistoryIndex): void {
    const { updated=0, midnight=0, url='', method='GET' } = init;
    this.updated = updated;
    this.midnight = midnight;
    this.url = url;
    this.method = method;
  }

  toJSON(): IHistoryIndex {
    const result: IHistoryIndex = {
      kind: Kind,
      updated: this.updated,
      midnight: this.midnight,
      url: this.url,
      method: this.method,
    };
    return result;
  }
}
