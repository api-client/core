import { AuthorizationSettingsUnion } from './Authorization';
import { RequestAuthorization as LegacyAuthorization } from './legacy/request/ArcRequest'

export const Kind = 'ARC#RequestAuthorization';

/**
 * Authorization configuration for the request.
 */
export interface IRequestAuthorization {
  kind: string;
  /**
   * Authorization configuration
   */
  config: AuthorizationSettingsUnion;
  /**
   * The name of the authorization
   */
  type: string;
  /**
   * Whether the authorization is enabled.
   */
  enabled: boolean;
  /**
   * Whether the authorization is reported to be valid.
   * The application should take action when the authorization is invalid but possibly allow the request.
   */
  valid: boolean;
}

export class RequestAuthorization {
  kind = Kind;
  /**
   * Authorization configuration
   */
  config?: AuthorizationSettingsUnion;
  /**
   * The name of the authorization
   */
  type?: string;
  /**
   * Whether the authorization is enabled.
   */
  enabled?: boolean;
  /**
   * Whether the authorization is reported to be valid.
   * The application should take action when the authorization is invalid but possibly allow the request.
   */
  valid?: boolean;

  static fromTypedConfig(type: string, config: AuthorizationSettingsUnion, valid=true): RequestAuthorization {
    return new RequestAuthorization({
      kind: Kind,
      config,
      enabled: true,
      type,
      valid,
    });
  }

  static fromLegacy(info: LegacyAuthorization): RequestAuthorization {
    return new RequestAuthorization({
      kind: Kind,
      config: info.config,
      enabled: true,
      type: info.type,
      valid: info.valid,
    });
  }

  /**
   * @param input The provider definition used to restore the state.
   */
  constructor(input?: string|IRequestAuthorization) {
    let init: IRequestAuthorization;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        config: {},
        enabled: false,
        type: '',
        valid: true,
      };
    }
    this.new(init);
  }

  /**
   * Creates a new provider clearing anything that is so far defined.
   * 
   * Note, this throws an error when the provider is not an ARC provider object.
   */
  new(init: IRequestAuthorization): void {
    const { config, type, enabled, valid } = init;
    this.kind = Kind;
    this.config = config;
    this.type = type;
    this.enabled = enabled;
    this.valid = valid;
  }

  toJSON(): IRequestAuthorization {
    const result:IRequestAuthorization = {
      kind: Kind,
      config: this.config || {},
      enabled: this.enabled || false,
      type: this.type || '',
      valid: this.valid || true,
    };
    return result;
  }
}
