import { Json2Xml } from './Json2Xml.js';
import { XmlReader } from './XmlReader.js';

/**
 * A class that converts the passed JSON value to XML and then it performs
 * search through the XPath implementation.
 */
export class JsonReader extends XmlReader {
  async getValue(path: string): Promise<unknown> {
    const body = await this.readPayloadAsString();
    if (!body) {
      return undefined;
    }
    let obj: any;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      return undefined;
    }
    const factory = new Json2Xml();
    const str = await factory.serializeJson(obj);
    const doc = await this.getDocumentWithBody(str);
    if (!doc) {
      return undefined;
    }

    // the below works well in a browser but in Node it won't process the document created from
    // a synthetic API.
    // await factory.convert(obj);
    // const doc = factory.doc as XMLDocument;

    let finalPath = path;
    if (finalPath.startsWith('/') && !finalPath.startsWith('//')) {
      finalPath = `/root${finalPath}`;
    } else if (!finalPath.startsWith('/')) {
      finalPath = `/root/${finalPath}`;
    }
    
    return this.queryDocument(finalPath, doc);
  }
}
