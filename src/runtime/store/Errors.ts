import { SerializableError, ISerializedError } from '../../models/SerializableError.js';

export interface IApiError {
  /**
   * Indicates the response is an error.
   */
  error: boolean;
  /**
   * The same as the status code but returned with the body.
   */
  code: number;
  /**
   * The human-readable error message
   */
  message: string;
  /**
   * The detailed message about the error, if any.
   */
  detail?: string;
}

export class ApiError {
  get name(): string {
    return 'ApiError';
  }

  code: number;
  message: string;
  detail?: string;

  constructor(message: string, code: number);
  constructor(init: IApiError);

  constructor(messageOrInit: string | IApiError, code?: number) {
    if (typeof messageOrInit === 'string') {
      if (typeof code === 'number') {
        this.code = code;
      } else {
        this.code = 0;
      }
      this.message = messageOrInit;
    } else {
      this.message = messageOrInit.message;
      this.code = messageOrInit.code;
      if (messageOrInit.detail) {
        this.detail = messageOrInit.detail;
      }
    }
  }

  toJSON(): IApiError {
    const { message, code, detail } = this;
    const result: IApiError = {
      error: true,
      message,
      code,
    };
    if (detail) {
      result.detail = detail;
    }
    return result;
  }

  toString(): string {
    return this.message;
  }
}

export interface ISdkError extends ISerializedError {
  /**
   * The raw response from the server.
   */
  response?: string;
  /**
   * Optional detailed message returned by the server.
   */
  detail?: string;
}

export class SdkError extends SerializableError {
  /**
   * The raw response from the server.
   */
  response?: string;
  /**
   * Optional detailed message returned by the server.
   */
  detail?: string;

  toJSON(): ISdkError {
    const result = super.toJSON();
    if (this.response) {
      result.response = this.response;
    }
    if (this.detail) {
      result.detail = this.detail;
    }
    return result;
  }
}
