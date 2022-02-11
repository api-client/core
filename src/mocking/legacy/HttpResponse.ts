import { HttpResponse as Base, headersValue, payloadValue, typesValue, loremValue } from '@pawel-up/data-mock/src/lib/http/HttpResponse.js';
import { Har, DataMockLocale } from '@pawel-up/data-mock';
import { ArcDataMockInit, HttpResponseArcInit, HttpResponseRedirectInit } from '../LegacyInterfaces.js';
import { ResponseRedirect, Response, ErrorResponse } from '../../models/legacy/request/ArcResponse.js';

export class HttpResponse extends Base {
  har: Har;

  /**
   * @param init The library init options.
   */
  constructor(init: ArcDataMockInit={}) {
    super(init);
    this.har = new Har(init);
  }

  seed(value?: number): void {
    super.seed(value);
    this.har.seed(value);
  }

  /**
   * @param locale The locale to set. When nothing is passed then it uses the default locale.
   */
  locale(locale?: DataMockLocale): void {
    super.locale(locale);
    this.har.locale(locale);
  }

  /**
   * @returns Generated redirect response.
   */
  redirectResponse(init: HttpResponseRedirectInit={}): ResponseRedirect {
    const ct = init.body ? this[headersValue].contentType() : undefined;
    let headers = this[headersValue].headers('response', { mime: ct });
    const url = this[headersValue].link();
    headers += `\nlocation: ${url}`;
    const { code, status } = this.redirectStatus(init);
    const body = init.body ? this[payloadValue].payload(ct) : undefined;
    const startTime = this[typesValue].datetime().getTime();
    const duration = this[typesValue].number({ min: 10, max: 4000 });
    const result: ResponseRedirect = {
      url: '',
      response: {
        status: code,
        statusText: status,
        headers,
      },
      startTime,
      endTime: startTime + duration,
    };
    if (body) {
      result.response.payload = body;
    }
    if (init.timings) {
      result.timings = this.har.timing(init);
    }
    return result;
  }

  arcResponse(init: HttpResponseArcInit = {}): Response {
    const ct = init.noBody ? undefined : this[headersValue].contentType();
    const body = init.noBody ? undefined : this[payloadValue].payload(ct);
    const headers = this[headersValue].headers('response', { mime: ct });
    const statusGroup = init.statusGroup ? init.statusGroup : this[typesValue].number({ min: 2, max: 5 });
    const sCode = this[typesValue].number({ min: 0, max: 99 }).toString();
    const code = Number(`${statusGroup}${sCode.padStart(2, '0')}`);
    const status = this[loremValue].word();
    const length = this[typesValue].number({ min: 10, max: 4000 });
    const result: Response = {
      status: code,
      statusText: status,
      headers,
      loadingTime: length,
    };
    if (init.timings) {
      result.timings = this.har.timing(init);
    }
    if (!init.noBody) {
      result.payload = body;
    }
    if (!init.noSize) {
      const hSize = headers.length;
      const bSize = body ? body.length : 0;
      result.size = {
        request: this[typesValue].number({ min: 10 }),
        response: hSize + bSize,
      };
    }
    if (init.redirects) {
      const size = this[typesValue].number({ min: 1, max: 4 });
      const cnf = { timings: init.timings, body: true };
      result.redirects = new Array(size).fill(0).map(() => this.redirectResponse(cnf));
    }
    return result;
  }

  arcErrorResponse(): ErrorResponse {
    const error = new Error(this[loremValue].paragraph());
    const result: ErrorResponse = {
      status: 0,
      error,
    };
    return result;
  }
}
