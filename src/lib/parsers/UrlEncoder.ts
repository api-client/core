export class UrlEncoder {
  /**
   * Returns a string where all characters that are not valid for a URL
   * component have been escaped. The escaping of a character is done by
   * converting it into its UTF-8 encoding and then encoding each of the
   * resulting bytes as a %xx hexadecimal escape sequence.
   * <p>
   * Note: this method will convert any the space character into its escape
   * short form, '+' rather than %20. It should therefore only be used for
   * query-string parts.
   *
   * <p>
   * The following character sets are <em>not</em> escaped by this method:
   * <ul>
   * <li>ASCII digits or letters</li>
   * <li>ASCII punctuation characters:
   *
   * <pre>- _ . ! ~ * ' ( )</pre>
   * </li>
   * </ul>
   * </p>
   *
   * <p>
   * Notice that this method <em>does</em> encode the URL component delimiter
   * characters:<blockquote>
   *
   * <pre>
   * ; / ? : &amp; = + $ , #
   * </pre>
   *
   * </blockquote>
   * </p>
   *
   * @param str A string containing invalid URL characters
   * @param replacePlus When set it replaces `%20` with `+`.
   * @returns a string with all invalid URL characters escaped
   */
  static encodeQueryString(str: string, replacePlus?: boolean): string {
    if (!str) {
      return str;
    }
    // normalize
    let result = str.toString().replace(/\r?\n/g, "\r\n");
    // encode
    result = encodeURIComponent(result);
    if (replacePlus) {
      // replace "%20" with "+" when needed
      result = result.replace(/%20/g, "+");
    }
    return result;
  }

  /**
   * Returns a string where all URL component escape sequences have been
   * converted back to their original character representations.
   *
   * Note: this method will convert the space character escape short form, '+',
   * into a space. It should therefore only be used for query-string parts.
   *
   * @param str A string containing encoded URL component sequences
   * @param replacePlus When set it replaces `+` with `%20`.
   * @returns string with no encoded URL component encoded sequences
   */
  static decodeQueryString(str: string, replacePlus?: boolean): string {
    if (!str) {
      return str;
    }
    let result = str;
    if (replacePlus) {
      result = str.replace(/\+/g, "%20");
    }
    return decodeURIComponent(result);
  }
}
