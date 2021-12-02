import { IRunnableAction, RunnableAction } from './actions/RunnableAction';
import { RequestActions as LegacyRequestActions } from './legacy/request/ArcRequest';

export interface IRequestActions {
  /**
   * Actions to be executed before the request is sent to the transport library.
   */
  request?: IRunnableAction[];
  /**
   * Actions to be executed after the response is fully received but before it is reported back to the UI.
   */
  response?: IRunnableAction[];
}

export class RequestActions {
  /**
   * Actions to be executed before the request is sent to the transport library.
   */
  request?: RunnableAction[];
  /**
   * Actions to be executed after the response is fully received but before it is reported back to the UI.
   */
  response?: RunnableAction[];

  static fromLegacy(action: LegacyRequestActions): RequestActions {
    const { request, response } = action;
    const init: IRequestActions = {};
    if (Array.isArray(request) && request.length) {
      init.request = request.map(i => RunnableAction.fromLegacy(i).toJSON());
    }
    if (Array.isArray(response) && response.length) {
      init.response = response.map(i => RunnableAction.fromLegacy(i).toJSON());
    }
    return new RequestActions(init);
  }

  /**
   * @param input The provider definition used to restore the state.
   */
  constructor(input?: string | IRequestActions) {
    let init: IRequestActions;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {};
    }
    this.new(init);
  }

  /**
   * Creates a new provider clearing anything that is so far defined.
   * 
   * Note, this throws an error when the provider is not an ARC provider object.
   */
  new(init: IRequestActions): void {
    const { request, response } = init;
    if (request) {
      this.request = request.map(i => new RunnableAction(i));
    } else {
      this.request = undefined;
    }
    if (response) {
      this.response = response.map(i => new RunnableAction(i));
    } else {
      this.response = undefined;
    }
  }

  toJSON(): IRequestActions {
    const result: IRequestActions = {};
    if (this.request) {
      result.request = this.request.map(i => i.toJSON());
    }
    if (this.response) {
      result.response = this.response.map(i => i.toJSON());
    }
    return result;
  }
}
