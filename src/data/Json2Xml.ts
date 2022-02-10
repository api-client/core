/**
 * Normalizes given name to a value that can be accepted by `createElement`
 * function on a document object.
 * @param name A name to process
 * @returns Normalized name
 */
export const normalizeXmlTagName = (name: string): string => name.replace(/[^a-zA-Z0-9-_.]/g, '');

/**
 * Converts a JSON value to an XML.
 * 
 * To convert a JSON to XML call the `convert()` function. This creates the `doc` property with the XML document.
 * To transform the document into an XML string, use the `serialize()` function.
 * 
 * This library work in both browser and NodeJS (via the `@xmldom/xmldom` library.)
 */
export class Json2Xml {
  /**
   * Whether it uses native or synthetic API.
   */
  syntheticApi: boolean;
  /**
   * Created document
   */
  doc?: XMLDocument;
  /**
   * The current node that is being processed.
   */
  currentNode?: Element;

  constructor() {
    this.syntheticApi = typeof DOMParser === 'undefined';
  }

  /**
   * Converts a JavaScript object to an XML document.
   * This creates the `doc` property with the JSON translated to the XML document.
   * Use the `serialize()` to convert it to string.
   * 
   * @param data A JavaScript object to convert
   * @param root The name of the root node. Defaults to "root"
   */
  async convert(data: any, root='root'): Promise<void> {
    const doc = await this.getDocument();
    this.doc = doc;
    const rootNode = doc.createElement(root);
    doc.appendChild(rootNode);
    this.currentNode = rootNode;

    if (Array.isArray(data)) {
      this.processArray(data);
    } else if (typeof data === 'object') {
      this.processObject(data);
    } else {
      throw new Error('Invalid object. Unable to process non-object property.');
    }
  }

  /**
   * Converts the current document to a string.
   * @returns The converted document.
   */
  async serialize(): Promise<string> {
    const { doc } = this;
    if (!doc) {
      throw new Error(`No document created.`);
    }
    const serializer = await this.getSerializer();
    return serializer.serializeToString(doc);
  }

  /**
   * A helper function to convert and serialize a JSON to XML.
   * 
   * @param data The JSON data to serialize
   * @param root The name of the root node. Defaults to "root"
   * @returns The serialized to XML value.
   */
  async serializeJson(data: any, root='root'): Promise<string> {
    await this.convert(data, root);
    return this.serialize();
  }

  /**
   * Depending on the environment it creates the XML document implementation.
   * 
   * @returns The XML document to use
   */
  async getDocument(): Promise<XMLDocument> {
    let doc: XMLDocument;
    if (this.syntheticApi) {
      const { DOMImplementation } = await import('@xmldom/xmldom');
      doc = new DOMImplementation().createDocument(null, null, null);
    } else {
      doc = document.implementation.createDocument(null, null, null);
    }
    return doc;
  }

  /**
   * Depending on the environment it creates the XML serializer implementation.
   * 
   * @returns The XML serializer to use
   */
  async getSerializer(): Promise<XMLSerializer> {
    if (this.syntheticApi) {
      const { XMLSerializer } = await import('@xmldom/xmldom');
      return new XMLSerializer;
    }
    return new XMLSerializer();
  }

  /**
   * Processes a property which type is not yet detected
   * @param input The input to process.
   */
  processAny(input: any): void {
    const type = typeof input;
    if (Array.isArray(input)) {
      this.processArray(input);
    } else if (type === 'object' && input !== null) {
      this.processObject(input);
    } else {
      this.processScalar(input);
    }
  }

  /**
   * Processes an array.
   * @param input The array to process.
   */
  processArray(input: any[]): void {
    if (!Array.isArray(input)) {
      throw new Error(`Expected array. ${typeof input} given.`);
    }
    input.forEach((item) => this.processAny(item));
  }

  /**
   * Appends object properties to the current node.
   * @param input The object to process.
   */
  processObject(input: any): void {
    const { currentNode, doc } = this;
    if (!currentNode || !doc) {
      throw new Error(`Library not initialized. Call the convert() function.`);
    }
    Object.keys(input).forEach((key) => {
      const val = input[key];
      const elementName = normalizeXmlTagName(key);
      const element = doc.createElement(elementName);
      currentNode.appendChild(element);
      this.currentNode = element;
      this.processAny(val);
    });
    this.currentNode = currentNode;
  }

  /**
   * Adds the value to the current node.
   * @param input the scalar to add
   */
  processScalar(input: any): void {
    const { currentNode, doc } = this;
    if (!currentNode || !doc) {
      throw new Error(`Library not initialized. Call the convert() function.`);
    }
    if (input === undefined || input === null) {
      // nothing to add. silently quit.
      return;
    }
    let value: any = '';
    let valid = false;
    if (!valid && ['boolean', 'string', 'number', 'bigint'].includes(typeof input)) {
      valid = true;
      value = input;
    }
    if (!valid) {
      throw new Error(`Invalid scalar type: ${typeof input}.`);
    }
    const typedValue = String(value);
    if (typedValue.includes('<') || typedValue.includes('>')) {
      const cdata = doc.createCDATASection(typedValue);
      currentNode.appendChild(cdata);
    } else {
      const node = doc.createTextNode(typedValue);
      currentNode.appendChild(node);
    }
  }
}
