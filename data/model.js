/* eslint-disable @typescript-eslint/explicit-function-return-type */
import pkg from 'amf-client-js';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

/** @typedef {import('amf-client-js').AMFConfiguration} AMFConfiguration */
/** 
 * @typedef ApiConfiguration 
 * @property {string} type
 * @property {string=} mime
 */

const {
  RAMLConfiguration,
  OASConfiguration,
  AsyncAPIConfiguration,
  RenderOptions,
  PipelineId,
} = pkg;


/** @type {Map<string, ApiConfiguration>} */
const config = new Map();
config.set('schema-api/schema-api.raml', { type: "RAML 1.0" });
config.set('raml-date/raml-date.raml', { type: "RAML 1.0" });
config.set('recursive/recursive.raml', { type: "RAML 1.0" });
config.set('oas-types/oas-types.yaml', { type: "OAS 3.0" });
config.set('oas-date/oas-date.yaml', { type: "OAS 3.0" });
config.set('oas-unions/oas-unions.yaml', { type: "OAS 3.0" });

const srcFolder = path.join('data', 'apis');
const descFolder = path.join('data', 'models');

class ApiParser {
  /**
   * @param {Map<string, ApiConfiguration>} list 
   */
  async batch(list) {
    await mkdir(descFolder, { recursive: true });
    for (const [file, info] of list) {
      console.log('Processing API file', file);
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.run(file, info.type);
      } catch (e) {
        let message;
        if (e.message) {
          message = e.message;
        } else {
          message = e.toString();
        }
        console.error(`Unable to finish: `, message);
        process.exit(1);
      }
    }
  }

  /**
   * @param {string} file 
   * @param {string} vendor 
   * @returns {Promise<void>}
   */
  async run(file, vendor) {
    let destFile = `${file.substring(0, file.lastIndexOf('.')) }.json`;
    if (destFile.indexOf('/') !== -1) {
      destFile = destFile.substring(destFile.lastIndexOf('/'));
    }
    const location = path.join(srcFolder, file);
    const content = await this.parse(vendor, location);
    const destination = path.join(descFolder, destFile);
    await writeFile(destination, content);
  }

  /**
   * @param {string} vendor 
   * @param {string} location 
   * @returns {Promise<string>}
   */
  async parse(vendor, location) {
    const ro = new RenderOptions().withSourceMaps().withCompactUris();
    // const ro = new RenderOptions().withoutAmfJsonLdSerialization().withoutCompactUris().withoutCompactedEmission().withPrettyPrint();
    const apiConfiguration = this.getConfiguration(vendor).withRenderOptions(ro);
    const client = apiConfiguration.baseUnitClient();
    const result = await client.parse(`file://${location}`);
    const transformed = client.transform(result.baseUnit, PipelineId.Editing);
    return client.render(transformed.baseUnit, 'application/ld+json');
  }

  /**
   * @param {string} vendor 
   * @returns {AMFConfiguration}
   */
  getConfiguration(vendor) {
    switch (vendor) {
      case 'RAML 0.8': return RAMLConfiguration.RAML08();
      case 'RAML 1.0': return RAMLConfiguration.RAML10();
      case 'OAS 2.0': return OASConfiguration.OAS20();
      case 'OAS 3.0': return OASConfiguration.OAS30();
      case 'ASYNC 2.0': return AsyncAPIConfiguration.Async20();
      default: throw new Error(`Unknown vendor: ${vendor}`);
    }
  }
}

const parser = new ApiParser();
parser.batch(config);
