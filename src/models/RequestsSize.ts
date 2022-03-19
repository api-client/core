export const Kind = 'Core#ResponseSize';

export interface IRequestsSize {
  kind?: typeof Kind;
  /**
   * The size of the request in bytes
   */
  request: number;
  /**
   * The size of the response in bytes
   */
  response: number;
}

export class RequestsSize {
  kind = Kind;
  /**
   * The size of the request in bytes
   */
  request = 0;
  /**
   * The size of the response in bytes
   */
  response = 0;

  /**
   * @param input The response size definition used to restore the state.
   */
  constructor(input?: string|IRequestsSize) {
    let init: IRequestsSize;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        request: 0,
        response: 0,
      };
    }
    this.new(init);
  }

  /**
   * Creates a new response size clearing anything that is so far defined.
   */
  new(init: IRequestsSize): void {
    const { request, response } = init;
    this.kind = Kind;
    this.request = request;
    this.response = response;
  }

  toJSON(): IRequestsSize {
    const result: IRequestsSize = {
      kind: Kind,
      request: this.request,
      response: this.response,
    };
    return result;
  }
}
