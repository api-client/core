import { DataMock, DataMockInit } from '@pawel-up/data-mock';
import { Request } from './lib/Request.js';
import { Response } from './lib/Response.js';

export { IRequestLogInit } from './lib/Request.js';
export { IArcResponseInit } from './lib/Response.js';

export class ProjectMock extends DataMock {
  projectRequest: Request;
  response: Response;
  
  /**
   * @param init The library init options.
   */
  constructor(init?: DataMockInit) {
    super(init);
    this.projectRequest = new Request(init);
    this.response = new Response(init);
  }
}
