/**
 * Processes string value tokens.
 */
export class VariablesTokenizer {
  value: string;
  index = 0;
  /**
   * @param value The value to process
   */
  constructor(value: string) {
    this.value = value;
  }

  /**
   * @returns The next character
   */
  next(): string {
    const { index } = this;
    const char = this.value[index];
    this.index = index + 1;
    return char;
  }

  /**
   * Consumes characters until specified character is encountered.
   * @param char The search stop character
   * @returns The remaining value from the string or null.
   */
  nextUntil(char: string): string | null {
    let result = '';
    const test = true;
    while (test) {
      const ch = this.next();
      if (ch === undefined) {
        return null;
      }
      if (ch === char) {
        return result;
      }
      result += ch;
    }
    return null;
  }

  /**
   * Reads the string from current position until the end and sets the index to the end.
   * @returns The string from current position until end.
   */
  eof(): string {
    const { index, value } = this;
    const result = value.substr(index);
    this.index = value.length;
    return result;
  }
}
