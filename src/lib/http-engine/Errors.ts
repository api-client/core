/**
 * Network errors occurred during transport with a message and error code.
 */
export class NetError extends Error {
  code?: number | string;
  /**
   * @param code Optional error code.
   */
  constructor(message: string, code?: number | string) {
    super(message);
    this.code = code;
  }
}
