export interface ITestRunCommandOptions {
  includeError?: boolean;
  noCleaning?: boolean;
}

export class TestCliHelper {
  static cleanTerminalOutput(s: string): string {
    let result = s.trim();
    result = result.replace(/[^\x20-\x7E\n]/gm, '');
    // result = result.replace(/\[\d+m/gm, '');
    result = result.replace(/\[\d+[a-zA-Z]/gm, '');
    result = result.split('\n').filter(i => !!i.trim()).join('\n');
    return result;
  }

  static splitLines(table: string): string[] {
    const result: string[] = [];
    table.split('\n').forEach((line) => {
      const value = line.trim();
      if (!value) {
        return;
      }
      result.push(value);
    });
    return result;
  }

  /**
   * Executes a passed asynchronous function and captures stdout.
   * When the function fails, it cleans up output listeners and throws the error.
   * 
   * ```javascript
   * const out = grabOutput(async () => {
   *  // ...
   * });
   * console.log(out); // combined stdout and stderr.
   * ```
   * 
   * @param fn The function to execute.
   * @returns The terminal output.
   */
  static async grabOutput(fn: () => Promise<void>): Promise<string> {
    const messages: string[] = [];
    function noop(): void {
      //
    }
    const origOut = process.stdout.write;
    const origErr = process.stderr.write;
    const origClear = console.clear;
    function messageHandler(buffer: string | Buffer): boolean {
      if (typeof buffer === 'string') {
        messages.push(buffer);
      } else {
        messages.push(buffer.toString('utf8'));
      }
      return true;
    }
    function stop(): void {
      process.stdout.write = origOut;
      process.stderr.write = origErr;
      console.clear = origClear;
    }
    process.stdout.write = messageHandler;
    process.stderr.write = messageHandler;
    console.clear = noop;

    try {
      await fn();
      stop();
    } catch (e) {
      stop();
      throw e;
    }
    return messages.join('');
  }
}
