import { DataMock } from '@pawel-up/data-mock';
import { Authorization } from './legacy/Authorization.js';
import { Certificates } from './legacy/Certificates.js';
import { Cookies } from './legacy/Cookies.js';
import { HostRules } from './legacy/HostRules.js';
import { Http } from './legacy/Http.js';
import { RestApi } from './legacy/RestApi.js';
import { Urls } from './legacy/Urls.js';
import { Variables } from './legacy/Variables.js';
import { ArcDataMockInit } from './LegacyInterfaces.js';

export class LegacyMock extends DataMock {
  http: Http;
  variables: Variables;
  cookies: Cookies;
  hostRules: HostRules;
  certificates: Certificates;
  urls: Urls;
  authorization: Authorization;
  restApi: RestApi;
  
  /**
   * @param init The library init options.
   */
  constructor(init?: ArcDataMockInit) {
    super(init);

    this.http = new Http(init);
    this.variables = new Variables(init);
    this.cookies = new Cookies(init);
    this.hostRules = new HostRules(init);
    this.certificates = new Certificates(init);
    this.urls = new Urls(init);
    this.authorization = new Authorization(init);
    this.restApi = new RestApi(init);
  }
}
