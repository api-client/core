import { PostmanBackupTransformer } from './PostmanBackupTransformer.js';

import { PostmanV2Transformer } from './PostmanV2Transformer.js';
import { PostmanV21Transformer } from './PostmanV21Transformer.js';
import { PostmanTransformer } from './PostmanTransformer.js';
import { HttpProject } from '../HttpProject.js';

/**
 * Transforms Postman collections (v2 and v2.1) and Postman's data export 
 * into an HTTP Project (or projects for data export).
 */
export class PostmanDataTransformer {
  transform(data: any): Promise<HttpProject|HttpProject[]> {
    const version = this.recognizeVersion(data);
    let instance: PostmanTransformer;
    switch (version) {
      case 'backup':
        instance = new PostmanBackupTransformer(data);
        break;
      case 'collection-v2':
        instance = new PostmanV2Transformer(data);
        break;
      case 'collection-v2.1':
        instance = new PostmanV21Transformer(data);
        break;
      default: return Promise.reject(new Error('Unsupported Postman version.'));
    }
    return instance.transform();
  }

  recognizeVersion(data: any): string | undefined {
    if (data.version) {
      return 'backup';
    }
    if (data.info.schema) {
      switch (data.info.schema) {
        case 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json':
          return 'collection-v2';
        case 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json':
          return 'collection-v2.1';
        default: return undefined;
      }
    }
    return undefined;
  }
}
