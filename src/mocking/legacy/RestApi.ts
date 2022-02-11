import { Lorem, Types, Internet } from '@pawel-up/data-mock';
import { ArcDataMockInit, RestApiIndexInit } from '../LegacyInterfaces.js';
import { ARCRestApi, ARCRestApiIndex } from '../../models/legacy/models/RestApi.js';

export class RestApi {
  types: Types;
  lorem: Lorem;
  internet: Internet;

  constructor(init: ArcDataMockInit={}) {
    this.types = new Types(init.seed);
    this.lorem = new Lorem(init);
    this.internet = new Internet(init);
  }

  apiIndex(opts: RestApiIndexInit = {}): ARCRestApiIndex {
    const result: ARCRestApiIndex = {
      order: opts.order || 0,
      title: this.lorem.sentence({ words: 2 }),
      type: 'RAML 1.0',
      _id: this.internet.uri(),
      versions: [],
      latest: '',
    };
    const versionsSize = opts.versionSize ? opts.versionSize : this.types.number({ min: 1, max: 5 });
    const versions = [];
    let last = '';
    for (let i = 0; i < versionsSize; i++) {
      last = `v${i}`;
      versions[versions.length] = last;
    }
    result.versions = versions;
    result.latest = last;
    return result;
  }

  apiIndexList(size=25, opts: RestApiIndexInit = {}): ARCRestApiIndex[] {
    const result = [];
    for (let i = 0; i < size; i++) {
      result.push(this.apiIndex({ ...opts, order: i }));
    }
    return result;
  }

  apiData(index: ARCRestApiIndex): ARCRestApi[] {
    const result: ARCRestApi[] = [];
    index.versions.forEach((version) => {
      const item: ARCRestApi = {
        data: '[{}]',
        indexId: index._id || '',
        version,
        _id: `${index._id}|${version}`,
      };
      result[result.length] = item;
    });
    return result;
  }

  apiDataList(indexes: ARCRestApiIndex[]): ARCRestApi[] {
    const size = indexes.length;
    let result: ARCRestApi[] = [];
    for (let i = 0; i < size; i++) {
      const data = this.apiData(indexes[i]);
      result = result.concat(data);
    }
    return result;
  }
}
