import { IHttpRequest } from '../../../models/HttpRequest.js';
import { ActionRunnable } from './ActionRunnable.js';
import { ISetVariableAction } from '../../../models/actions/runnable/SetVariableAction.js';
import { Events } from '../../../events/Events.js';
import { RequestDataExtractor } from '../../../data/RequestDataExtractor.js';
import { IRequestLog } from '../../../models/RequestLog.js';

export class SetVariableRunnable extends ActionRunnable {
  async request(request: IHttpRequest): Promise<void> {
    const config = this.config as ISetVariableAction;
    const value = await this.readRequestValue(request, config);
    if (typeof value === 'undefined') {
      throw new Error(`Cannot read value for the action`);
    }
    await this.setVariable(config, String(value));
  }

  async readRequestValue(request: IHttpRequest, config: ISetVariableAction): Promise<string | number | undefined> {
    const { source } = config;
    let value: string | number | undefined;
    if (source.source === 'value') {
      value = source.value;
    } else {
      const extractor = new RequestDataExtractor(request);
      value = await extractor.extract(source);
    }
    return value;
  }

  async setVariable(config: ISetVariableAction, value: string): Promise<void> {
    const { name } = config;
    Events.Environment.set(name, value, this.eventTarget);
  }

  async response(log: IRequestLog): Promise<void> {
    if (!log.request || !log.response) {
      return;
    }
    const config = this.config as ISetVariableAction;
    let value: string | number | undefined;
    const { source } = config;
    if (source.source === 'value') {
      value = source.value;
    } else {
      const extractor = new RequestDataExtractor(log.request, log.response);
      value = await extractor.extract(source);
    }
    if (typeof value === 'undefined') {
      throw new Error(`Cannot read value for the action`);
    }
    await this.setVariable(config, String(value));
  }
}
