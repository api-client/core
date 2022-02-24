import { IHostRule, HostRule } from './HostRule.js';
import { IProperty, Property } from './Property.js';
import { RequestConfig as LegacyConfig } from './legacy/request/ArcRequest.js';

export const Kind = 'ARC#RequestConfig';

export interface IRequestBaseConfig {
  /**
   * Request timeout in milliseconds
   * Default no timeout.
   */
  timeout?: number;
  /**
   * When false the request object won't follow redirects.
   * @default true
   */
  followRedirects?: boolean;
  /**
   * Hosts table configuration.
   */
  hosts?: IHostRule[];
  /**
   * A limit of characters to include into the `sentHttpMessage` property
   * of the request object. 0 to disable limit. Default to 2048.
   * @default 2048
   */
  sentMessageLimit?: number;
  /**
   * When set the request adds `accept` and `user-agent` headers if missing.
   */
  defaultHeaders?: boolean;
  /**
   * Default `user-agent` header to be used with request when `defaultHeaders`
   * is set.
   *
   * @default api-client
   */
  defaultUserAgent?: string;
  /**
   * Default `accept` header to be used with request when `defaultHeaders`
   * is set.
   * @default *\/*
   */
  defaultAccept?: string;
  /**
   * The proxy URI to connect to when making the connection.
   * It should contain the host and port. Default port is 80.
   */
  proxy?: string;
  /**
   * The proxy authorization username value.
   */
  proxyUsername?: string;
  /**
   * The proxy authorization password value.
   */
  proxyPassword?: string;
  /**
   * Whether the processor should validate certificates.
   */
  validateCertificates?: boolean;
}

/**
 * ARC request `config` object.
 */
export interface IRequestConfig extends IRequestBaseConfig {
  kind: string;
  /**
   * Whether the processor should use this configuration.
   */
  enabled: boolean;
  /**
   * Does not set session (saved) cookies to this request
   */
  ignoreSessionCookies?: boolean;
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
   * Default `user-agent` header to be used with request when `defaultHeaders`
   * is set.
   *
   * @default api-client
   */
  defaultUserAgent?: string;
  /**
   * Default `accept` header to be used with request when `defaultHeaders`
   * is set.
   * @default *\/*
   */
  defaultAccept?: string;
  /**
   * A list of variables to use with the request.
   * Note, request variables override application and workspace variables.
   */
  variables?: Property[];
  /**
   * The proxy URI to connect to when making the connection.
   * It should contain the host and port. Default port is 80.
   */
  proxy?: string;
  /**
   * The proxy authorization username value.
   */
  proxyUsername?: string;
  /**
   * The proxy authorization password value.
   */
  proxyPassword?: string;
  /**
   * A limit of characters to include into the `sentHttpMessage` property
   * of the request object. 0 to disable limit. Default to 2048.
   * @default 2048
   */
  sentMessageLimit?: number;

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
    const { 
      enabled, followRedirects, ignoreSessionCookies, validateCertificates, defaultHeaders, timeout, hosts, variables,
      defaultAccept, defaultUserAgent, proxy, proxyPassword, proxyUsername, sentMessageLimit,
    } = init;
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
    if (typeof defaultAccept === 'string') {
      this.defaultAccept = defaultAccept;
    } else {
      this.defaultAccept = undefined;
    }
    if (typeof defaultUserAgent === 'string') {
      this.defaultUserAgent = defaultUserAgent;
    } else {
      this.defaultUserAgent = undefined;
    }
    if (typeof proxy === 'string') {
      this.proxy = proxy;
    } else {
      this.proxy = undefined;
    }
    if (typeof proxyUsername === 'string') {
      this.proxyUsername = proxyUsername;
    } else {
      this.proxyUsername = undefined;
    }
    if (typeof proxyPassword === 'string') {
      this.proxyPassword = proxyPassword;
    } else {
      this.proxyPassword = undefined;
    }
    if (typeof sentMessageLimit === 'number') {
      this.sentMessageLimit = sentMessageLimit;
    } else {
      this.sentMessageLimit = undefined;
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
