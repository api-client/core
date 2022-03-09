interface IErrorOptions {
  cause?: Error;
}

export interface ISerializedError {
  message: string;
  stack?: string;
}

/**
 * An error that serializes!
 * It is a copy of the normal definition of an error but allows 
 * to serialize the value via the toJSON() function and restore previous values 
 * with the `new()` function.
 */
export class SerializableError {
  message: string;
  private stackValue?: string;
  get stack(): string | undefined {
    return this.stackValue;
  }

  constructor();
  constructor(error: Error);
  constructor(message: string);
  constructor(message: string, options: IErrorOptions);

  constructor(message?: string | Error, options: IErrorOptions = {}) {
    if (typeof message === 'string') {
      this.message = message;
    } else if (message) {
      this.message = message.message;
      this.stackValue = message.stack;
    } else {
      this.message = '';
    }
    if (options.cause && options.cause.stack) {
      this.stackValue = options.cause.stack;
    }
  }

  new(values: ISerializedError): void {
    if (values.message) {
      this.message = values.message;
    }
    if (values.stack) {
      this.stackValue = values.stack;
    }
  }

  toJSON(): ISerializedError {
    const { message, stackValue: stack } = this;
    const result: ISerializedError = {
      message,
    };
    if (stack) {
      result.stack = stack;
    }
    return result;
  }

  toString(): string {
    return this.message;
  }
}
