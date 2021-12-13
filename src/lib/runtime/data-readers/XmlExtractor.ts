/* eslint-disable @typescript-eslint/no-explicit-any */
import { IActionIterator, ActionIterator } from '../../../models/actions/ActionIterator.js';
/**
 * Reads attribute value for current path.
 *
 * @param dom DOM element object
 * @param part Current part of the path.
 * @return Returned value for path or undefined if not found.
 */
const valueForAttr = (dom: Element|Document, part: string): string | undefined => {
  if (dom.nodeType !== Node.ELEMENT_NODE) {
    return undefined;
  }
  const match = part.match(/attr\((.+)\)/);
  if (!match) {
    return undefined;
  }
  const attrName = match[1];
  const target = dom as Element;
  if (!target.hasAttribute(attrName)) {
    return undefined;
  }
  const attrValue = target.getAttribute(attrName);
  return attrValue || undefined;
};

/**
 * Gets a value for the XML document for given path.
 *
 * @param dom DOM document.
 * @param path Path to search for the value.
 * @return Value for given path.
 */
function getXmlValue(dom: Element | Document | null, path: string[]): string | undefined {
  const part = path.shift();
  if (!dom) {
    return undefined;
  }
  if (!part) {
    const typed = dom as Element;
    return (typed.innerHTML || typed.textContent || '').trim();
  }
  if (part.trim().indexOf('attr(') === 0) {
    return valueForAttr(dom, part);
  }
  let nextPart: any = path[0];
  let selector = part;
  const typedPart = Number(nextPart);
  if (Number.isInteger(typedPart)) {
    nextPart = typedPart;
    nextPart++;
    selector += `:nth-child(${nextPart})`;
    path.shift();
  }
  return getXmlValue(dom.querySelector(selector), path);
}

/**
 * A helper class to extract data from an XML response.
 */
export class XmlExtractor {
  _data: string;
  _path: string[];
  _iterator?: ActionIterator;

  /**
   * @param xml XML string.
   * @param path Path to the data.
   * @param iterator Data iterator
   */
  constructor(xml: string, path: string[], iterator?: IActionIterator) {
    /**
     * JS object or array.
     */
    this._data = xml;
    this._path = path;
    if (iterator) {
      this._iterator = new ActionIterator(iterator);
    }
  }

  /**
   * Gets a value of the XML type string for given path.
   *
   * @return Value for given path.
   */
  async extract(): Promise<string | undefined> {
    if (typeof DOMParser === 'undefined') {
      return this.extractNode();
    }
    const parser = new DOMParser();
    const dom = parser.parseFromString(this._data, 'text/xml');
    if (dom.querySelector('parsererror')) {
      return undefined;
    }
    return getXmlValue(dom, this._path);
  }

  async extractNode(): Promise<string | undefined> {
    const { DOMParser } = await import('@xmldom/xmldom');
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
    const dom = parser.parseFromString(this._data, 'text/xml');
    if (errored) {
      return undefined;
    }
    return getXmlValue(dom, this._path);
  }
}
