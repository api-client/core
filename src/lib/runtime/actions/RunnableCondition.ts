import { IRunnableAction, RunnableAction } from '../../../models/actions/RunnableAction.js';
import { IHttpRequest } from '../../../models/HttpRequest.js';
import { IArcResponse } from '../../../models/ArcResponse.js';
import { IErrorResponse } from '../../../models/ErrorResponse.js';
import { RequestDataExtractor } from '../data-readers/RequestDataExtractor.js';
import { checkCondition } from './ConditionRunner.js';

/**
 * A class that represents ARC condition that runs actions when the condition is met.
 */
export class RunnableCondition extends RunnableAction {
  /**
   * Tests whether the condition is satisfied for request and/or response.
   *
   * @param request The ARC request object.
   * @param executed The request object representing the actual request that has been executed by the transport library.
   * @param response The ARC response object, if available.
   * @return True when the condition is satisfied.
   */
  satisfied(request: IHttpRequest, response?: IArcResponse | IErrorResponse): boolean {
    if (!this.enabled) {
      return false;
    }
    if (this.condition.alwaysPass === true) {
      return true;
    }
    const extractor = new RequestDataExtractor(request, response);
    const value = extractor.extract(this.condition);
    const op = this.condition.operator;
    if (!op || !this.condition.predictedValue) {
      return false;
    }
    return checkCondition(value, op, this.condition.predictedValue);
  }
}

/**
 * Maps runnables interface to 
 * If an item is not an instance of `ArcAction` then it creates an instance of it
 * by passing the map as an argument.
 *
 * @param value Passed list of actions.
 * @returns Mapped actions.
 */
export const mapRunnables = (value: (IRunnableAction | RunnableCondition)[]): RunnableCondition[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    if (!(item instanceof RunnableCondition)) {
      return new RunnableCondition(item as IRunnableAction);
    }
    return item;
  });
};
