import { IRequest, Request } from './Request.js';

export const Kind = 'ARC#HistoryRequest';

/**
 * A class that specializes in processing ARC history request object.
 */
export class HistoryRequest extends Request {
  kind = Kind;

  /**
   * Generates an id for a history object
   */
  generateId(): string {
    const { method='', url='' } = this.expects;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const time = d.getTime();
    const encUrl = encodeURIComponent(url);
    return `${time}/${encUrl}/${method}`;
  }

  toJSON(): IRequest {
    const result = super.toJSON();
    result.kind = Kind;
    return result;
  }
}
