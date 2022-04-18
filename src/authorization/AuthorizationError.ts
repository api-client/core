/* eslint-disable max-classes-per-file */
/**
 * An object describing an error during the authorization process.
 */
export class AuthorizationError extends Error {
  /**
   * @param message The human readable message.
   * @param code The error code
   * @param state Used state parameter
   * @param interactive Whether the request was interactive.
   */
  constructor(message: string, public code: string, public state: string, public interactive: boolean) {
    super(message);
  }
}

export class CodeError extends Error {
  /**
   * @param message The human readable message.
   * @param code The error code
   */
  constructor(message: string, public code: string) {
    super(message);
  }
}
