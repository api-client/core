import { DataReader } from './DataReader.js';

let xResult: typeof XPathResult | undefined = typeof XPathResult !== 'undefined' ? XPathResult : undefined;

/**
 * Reads the data from an XML using the xpath.
 * See https://www.w3schools.com/xml/xpath_syntax.asp.
 */
export class XmlReader extends DataReader {
  async getValue(path: string): Promise<unknown> {
    const doc = await this.getDocument();
    if (!doc) {
      return undefined;
    }
    try {
      const result = doc.evaluate(path, doc);
      switch (result.resultType) {
        case xResult!.NUMBER_TYPE: return result.numberValue;
        case xResult!.STRING_TYPE: return result.stringValue;
        case xResult!.BOOLEAN_TYPE: return result.booleanValue;
        case xResult!.UNORDERED_NODE_ITERATOR_TYPE: 
        case xResult!.ORDERED_NODE_ITERATOR_TYPE: 
          return this.processNodeResult(result);
        default:
          console.error(`Unsupported xpath result type: [${result.resultType}]`);
          return undefined;
      }
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  processNodeResult(result: XPathResult): unknown {
    const results: any[] = [];
    let next = result.iterateNext();
    while (next) {
      const value = next.textContent;
      if (value) {
        results.push(value.trim());
      }
      next = result.iterateNext();
    }
    if (!results.length) {
      return undefined;
    }
    return results.length === 1 ? results[0] : results;
  }

  async getDocument(): Promise<Document|undefined> {
    const body = await this.readPayloadAsString();
    if (!body) {
      return undefined;
    }
    if (typeof DOMParser === 'undefined') {
      return this.getNodeDocument(body);
    }
    return this.getWebDocument(body);
  }

  async getWebDocument(data: string): Promise<Document|undefined> {
    const parser = new DOMParser();
    const dom = parser.parseFromString(data, 'text/xml');
    if (dom.querySelector('parsererror')) {
      return undefined;
    }
    return dom;
  }

  async getNodeDocument(data: string): Promise<Document|undefined> {
    const { DOMParser } = await import('@xmldom/xmldom');
    const xpath = await import('xpath');
    // @ts-ignore
    xResult = xpath.default.XPathResult;
    let errored = false;
    const parser = new DOMParser({
      errorHandler: {
        error: (): void => { 
          errored = true;
        },
        fatalError: (): void => { 
          errored = true;
        }
      }
    });
    const dom = parser.parseFromString(data, 'text/xml');
    if (errored) {
      return undefined;
    }
    dom.evaluate = (expression: string, contextNode: Node): XPathResult => {
      return xpath.default.evaluate(expression, contextNode, null, 0, null);
    }
    return dom;
  }
}
