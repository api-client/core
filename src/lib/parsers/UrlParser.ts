import { UrlValueParser, IUrlValueParserOptions } from './UrlValueParser.js';

/**
 * A class to parse URL string.
 */
export class UrlParser extends UrlValueParser {
  /**
   * @param value The URL value
   */
  constructor(value: string, opts?: IUrlValueParserOptions) {
    super(opts);
    this.value = value;
  }

  /**
   * Returns protocol value in format `protocol` + ':'
   *
   * @return The value of the protocol or `undefined` if the value is not set
   */
  get protocol(): string | undefined {
    return this.__data.protocol;
  }

  /**
   * Sets value of the `protocol`
   *
   * @param value Protocol value.
   */
  set protocol(value: string | undefined) {
    this.__data.protocol = value;
  }

  /**
   * It reads the authority part of the URL value. It doesn't parses it
   * to host, port and credentials parts.
   *
   * @return The value of the host or `undefined` if the value is not set
   */
  get host(): string | undefined {
    return this.__data.host;
  }

  /**
   * Sets value of the `host`
   *
   * @param value Host value.
   */
  set host(value: string | undefined) {
    this.__data.host = value;
  }

  /**
   * Returns path part of the URL.
   *
   * @returns The value of the path or `undefined` if the value not set
   */
  get path(): string | undefined {
    return this.__data.path || '/';
  }

  /**
   * Sets value of the `path`
   *
   * @param value Path value.
   */
  set path(value: string | undefined) {
    this.__data.path = value;
  }

  /**
   * Returns anchor part of the URL.
   *
   * @returns The value of the anchor or `undefined` if the value not set
   */
  get anchor(): string | undefined {
    return this.__data.anchor;
  }

  /**
   * Sets value of the `anchor`
   *
   * @param value The anchor value.
   */
  set anchor(value: string | undefined) {
    this.__data.anchor = value;
  }

  /**
   * Returns search part of the URL.
   *
   * @returns the value of the search or `undefined` if the value not set
   */
  get search(): string | undefined {
    return this.__data.search;
  }

  /**
   * Sets value of the `search`
   *
   * @param value Search value.
   */
  set search(value: string | undefined) {
    this.__data.search = value;
  }

  /**
   * The URL value. It is the same as calling `toString()`.
   *
   * @return The URL value for current configuration.
   */
  get value(): string {
    return this.toString();
  }

  /**
   * Sets value of the URL.
   * It parses the url and sets properties.
   *
   * @param value The URL value.
   */
  set value(value: string) {
    this.protocol = this._parseProtocol(value);
    this.host = this._parseHost(value);
    this.path = this._parsePath(value);
    this.anchor = this._parseAnchor(value);
    this.search = this._parseSearch(value);
  }

  /**
   * Returns an array of search params.
   *
   * @returns The list of search params. Each item contains an
   * array where the first item is the name of the parameter and the second item is the
   * value.
   */
  get searchParams(): string[][] {
    return this._parseSearchParams(this.search);
  }

  /**
   * Sets the value of `search` and `searchParams`.
   *
   * @param value Search params list.
   */
  set searchParams(value: string[][]) {
    if (!value || !value.length) {
      this.search = undefined;
      return;
    }
    this.search = value.map((item) => {
      let itemValue = item[1];
      if (!item[0] && !itemValue) {
        return '';
      }
      if (itemValue === undefined) {
        itemValue = '';
      } else if (typeof itemValue !== 'string') {
        itemValue = String(itemValue);
      }
      return `${item[0]}=${itemValue}`;
    })
    .join(this.opts.queryDelimiter);
  }

  /**
   * Returns the URL for current settings.
   *
   * @return The URL value.
   */
  toString(): string {
    let result = '';
    if (this.protocol) {
      result += this.protocol;
      result += '//';
    }
    if (this.host) {
      result += this.host;
    }
    if (this.path) {
      if (this.path === '/' && !this.host && !this.search && !this.anchor) {
        // ???
      } else {
        if (this.path[0] !== '/') {
          result += '/';
        }
        result += this.path;
      }
    } else if (this.search || this.anchor) {
        result += '/';
      }
    if (this.search) {
      const p = this.searchParams;
      this.searchParams = p;
      result += `?${this.search}`;
    }
    if (this.anchor) {
      result += `#${this.anchor}`;
    }
    return result;
  }
}
