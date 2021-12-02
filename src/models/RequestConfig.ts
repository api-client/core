import { IHostRule, HostRule } from './HostRule';
import { IProperty, Property } from './Property';
import { RequestConfig as LegacyConfig } from './legacy/request/ArcRequest';

export const Kind = 'ARC#RequestConfig';

/**
 * ARC request `config` object.
 */
export interface IRequestConfig {
  kind: string;
  /**
   * Whether the processor should use this configuration.
   */
  enabled: boolean;
  /**
   * The request timeout.
   * Default no timeout.
   */
  timeout?: number;
  /**
   * Whether or not the request should follow redirects.
   */
  followRedirects?: boolean;
  /**
   * Does not set session (saved) cookies to this request
   */
  ignoreSessionCookies?: boolean;
  /**
   * Hosts table configuration.
   */
  hosts?: IHostRule[];
  /**
   * Whether the processor should validate certificates.
   */
  validateCertificates?: boolean;
  /**
   * Whether to put a "default" headers (accept and user agent)
   */
  defaultHeaders?: boolean;
  /**
   * A list of variables to use with the request.
   * Note, request variables override application and workspace variables.
   */
  variables?: IProperty[];
}

export class RequestConfig {
  kind = Kind;
  /**
   * Whether the processor should use this configuration.
   */
  enabled = false;
  /**
   * The request timeout.
   * Default no timeout.
   */
  timeout?: number;
  /**
   * Whether or not the request should follow redirects.
   */
  followRedirects?: boolean;
  /**
   * Does not set session (saved) cookies to this request
   */
  ignoreSessionCookies?: boolean;
  /**
   * Hosts table configuration.
   */
  hosts?: HostRule[];
  /**
   * Whether the processor should validate certificates.
   */
  validateCertificates?: boolean;
  /**
   * Whether to put a "default" headers (accept and user agent)
   */
  defaultHeaders?: boolean;
  /**
   * A list of variables to use with the request.
   * Note, request variables override application and workspace variables.
   */
  variables?: Property[];

  static withDefaults(): RequestConfig {
    return new RequestConfig({
      kind: Kind,
      enabled: true,
      timeout: 90,
      followRedirects: true,
      ignoreSessionCookies: false,
      validateCertificates: false,
    });
  }

  static fromLegacy(config: LegacyConfig): RequestConfig {
    const { enabled, defaultHeaders, followRedirects, ignoreSessionCookies, timeout, validateCertificates } = config;
    const init: IRequestConfig = {
      kind: Kind,
      enabled,
    };
    if (typeof defaultHeaders === 'boolean') {
      init.defaultHeaders = defaultHeaders;
    }
    if (typeof followRedirects === 'boolean') {
      init.followRedirects = followRedirects;
    }
    if (typeof ignoreSessionCookies === 'boolean') {
      init.ignoreSessionCookies = ignoreSessionCookies;
    }
    if (typeof validateCertificates === 'boolean') {
      init.validateCertificates = validateCertificates;
    }
    if (typeof timeout === 'number') {
      init.timeout = timeout;
    }
    return new RequestConfig(init);
  }

  /**
   * @param input The request configuration definition used to restore the state.
   */
  constructor(input?: string | IRequestConfig) {
    let init: IRequestConfig;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        enabled: false,
      }
    }
    this.new(init);
  }

  /**
   * Creates a new request configuration clearing anything that is so far defined.
   * 
   * Note, this throws an error when the object is not an ARC request configuration. 
   */
  new(init: IRequestConfig): void {
    const { enabled, followRedirects, ignoreSessionCookies, validateCertificates, defaultHeaders, timeout, hosts, variables } = init;
    this.kind = Kind;
    if (typeof enabled === 'boolean') {
      this.enabled = enabled;
    } else {
      this.enabled = false;
    }
    if (typeof followRedirects === 'boolean') {
      this.followRedirects = followRedirects;
    } else {
      this.followRedirects = undefined;
    }
    if (typeof ignoreSessionCookies === 'boolean') {
      this.ignoreSessionCookies = ignoreSessionCookies;
    } else {
      this.ignoreSessionCookies = undefined;
    }
    if (typeof validateCertificates === 'boolean') {
      this.validateCertificates = validateCertificates;
    } else {
      this.validateCertificates = undefined;
    }
    if (typeof defaultHeaders === 'boolean') {
      this.defaultHeaders = defaultHeaders;
    } else {
      this.defaultHeaders = undefined;
    }
    if (typeof timeout === 'number') {
      this.timeout = timeout;
    } else {
      this.timeout = undefined;
    }
    if (Array.isArray(hosts)) {
      this.hosts = hosts.map(i => new HostRule(i))
    } else {
      this.hosts = [];
    }
    if (Array.isArray(variables)) {
      this.variables = variables.map(i => new Property(i))
    } else {
      this.variables = [];
    }
  }

  toJSON(): IRequestConfig {
    const result: IRequestConfig = {
      kind: Kind,
      enabled: this.enabled,
    };
    if (typeof this.followRedirects === 'boolean') {
      result.followRedirects = this.followRedirects;
    }
    if (typeof this.ignoreSessionCookies === 'boolean') {
      result.ignoreSessionCookies = this.ignoreSessionCookies;
    }
    if (typeof this.validateCertificates === 'boolean') {
      result.validateCertificates = this.validateCertificates;
    }
    if (typeof this.defaultHeaders === 'boolean') {
      result.defaultHeaders = this.defaultHeaders;
    }
    if (typeof this.timeout === 'number') {
      result.timeout = this.timeout;
    }
    if (Array.isArray(this.hosts)) {
      result.hosts = this.hosts.map(i => i.toJSON());
    }
    if (Array.isArray(this.variables)) {
      result.variables = this.variables.map(i => i.toJSON());
    }
    return result;
  }
}
