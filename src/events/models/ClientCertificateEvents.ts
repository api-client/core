import { HttpCertificate, ICertificateCreateOptions } from '../../models/ClientCertificate.js';
import { ContextReadEvent, ContextListEvent, ContextListOptions, ContextListResult, ContextDeleteEvent, ContextDeleteRecord, ContextUpdateEvent, ContextChangeRecord, ContextStateUpdateEvent, ContextStateDeleteEvent } from '../BaseEvents.js';
import { ModelEventTypes } from './ModelEventTypes.js';

export class ClientCertificateEvents {
  /**
   * Dispatches an event handled by the data store to read the client certificate.
   *
   * @param key The key of the client certificate
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved to a client certificate model.
   */
  static async read(key: string, target: EventTarget = window): Promise<HttpCertificate | undefined> {
    const e = new ContextReadEvent<HttpCertificate>(ModelEventTypes.ClientCertificate.read, key);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event to list the client certificates data.
   *
   * @param opts Query options.
   * @param target A node on which to dispatch the event.
   * @returns The list result.
   */
  static async list(opts?: ContextListOptions, target: EventTarget = window): Promise<ContextListResult<HttpCertificate> | undefined> {
    const e = new ContextListEvent<HttpCertificate>(ModelEventTypes.ClientCertificate.list, opts);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event handled by the data store to delete a client certificate
   *
   * @param key The key of the project to delete.
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved to a new revision after delete.
   */
  static async delete(key: string, target: EventTarget = window): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(ModelEventTypes.ClientCertificate.delete, key, undefined);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event handled by the data store to insert a new client certificate.
   *
   * @param item The certificate object.
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved to the change record
   */
  static async insert(item: ICertificateCreateOptions, target: EventTarget = window): Promise<ContextChangeRecord<HttpCertificate> | undefined> {
    const e = new ContextUpdateEvent<ICertificateCreateOptions, HttpCertificate>(ModelEventTypes.ClientCertificate.insert, { item, });
    target.dispatchEvent(e);
    return e.detail.result;
  }

  static get State(): typeof StateEvents {
    return StateEvents;
  }
}

class StateEvents {
  /**
   * Dispatches an event after a client certificate was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record Change record
   */
  static update(record: ContextChangeRecord<HttpCertificate>, target: EventTarget = window): void {
    const e = new ContextStateUpdateEvent<HttpCertificate>(ModelEventTypes.ClientCertificate.State.update, record);
    target.dispatchEvent(e);
  }

  /**
   * Dispatches an event after a client certificate was deleted
   *
   * @param record The context store delete record
   * @param target A node on which to dispatch the event.
   */
  static delete(record: ContextDeleteRecord, target: EventTarget = window): void {
    const e = new ContextStateDeleteEvent(ModelEventTypes.ClientCertificate.State.delete, record);
    target.dispatchEvent(e);
  }
}
