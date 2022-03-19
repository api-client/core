export interface IAuthorizationData {
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
      init = {};
    }
    this.new(init);
  }

  /**
   * Creates a new provider clearing anything that is so far defined.
   * 
   * Note, this throws an error when the provider is not an API Client provider object.
   */
  new(init: IAuthorizationData): void {
    const { username, password, domain } = init;
    this.username = username;
    this.password = password;
    this.domain = domain;
  }

  toJSON(): IAuthorizationData {
    const result:IAuthorizationData = {
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
