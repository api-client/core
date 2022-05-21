import v4 from '../lib/uuid.js';

export interface IAuthorizationData {
  key: string;
  username?: string;
  password?: string;
  domain?: string;
}


/**
 * Represents an auth data stored in API Client's data store to be retrieved
 * when the response status is 401.
 * 
 * Each entry represent a Basic or NTLM authorization.
 */
export class AuthorizationData {
  key = '';
  username?: string;
  password?: string;
  domain?: string;

  /**
   * @param input The provider definition used to restore the state.
   */
  constructor(input?: string|IAuthorizationData) {
    let init: IAuthorizationData;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        key: v4(),
      };
    }
    this.new(init);
  }

  /**
   * Creates a new provider clearing anything that is so far defined.
   * 
   * Note, this throws an error when the provider is not an API Client provider object.
   */
  new(init: IAuthorizationData): void {
    const { username, password, domain, key = v4() } = init;
    this.username = username;
    this.password = password;
    this.domain = domain;
    this.key = key;
  }

  toJSON(): IAuthorizationData {
    const result:IAuthorizationData = {
      key: this.key,
    };
    if (this.username) {
      result.username = this.username;
    }
    if (this.password) {
      result.password = this.password;
    }
    if (this.domain) {
      result.domain = this.domain;
    }
    return result;
  }
}
