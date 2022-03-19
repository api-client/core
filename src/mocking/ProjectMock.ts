import { DataMock, DataMockInit } from '@pawel-up/data-mock';
import { Request } from './lib/Request.js';
import { Response } from './lib/Response.js';
import { User } from './lib/User.js';
import { History } from './lib/History.js';

export { IRequestLogInit } from './lib/Request.js';
export { IResponseInit } from './lib/Response.js';
export { ISpaceUserInit, IUserInit } from './lib/User.js';
export { IHttpHistoryInit, IHttpHistoryListInit } from './lib/History.js';

export class ProjectMock extends DataMock {
  projectRequest: Request;
  response: Response;
  user: User;
  history: History;
  
  /**
   * @param init The library init options.
   */
  constructor(init?: DataMockInit) {
    super(init);
    this.projectRequest = new Request(init);
    this.response = new Response(init);
    this.user = new User(init);
    this.history = new History(init);
  }
}
