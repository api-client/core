import { HttpCertificate, ICertificateCreateOptions } from '../../models/ClientCertificate.js';
import { ContextReadEvent, ContextListEvent, ContextListOptions, ContextListResult, ContextDeleteEvent, ContextDeleteRecord, ContextUpdateEvent, ContextChangeRecord, ContextStateUpdateEvent, ContextStateDeleteEvent } from '../BaseEvents.js';
import { ModelEventTypes } from './ModelEventTypes.js';

export class ClientCertificateEvents {
  /**
   * Dispatches an event handled by the data store to read the client certificate.
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the client certificate
   * @returns Promise resolved to a client certificate model.
   */
  static async read(target: EventTarget, id: string): Promise<HttpCertificate | undefined> {
    const e = new ContextReadEvent<HttpCertificate>(ModelEventTypes.ClientCertificate.read, id);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event to list the client certificates data.
   *
   * @param target A node on which to dispatch the event.
   * @param opts Query options.
   * @returns The list result.
   */
  static async list(target: EventTarget, opts?: ContextListOptions): Promise<ContextListResult<HttpCertificate> | undefined> {
    const e = new ContextListEvent<HttpCertificate>(ModelEventTypes.ClientCertificate.list, opts);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event handled by the data store to delete a client certificate
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the project to delete.
   * @returns Promise resolved to a new revision after delete.
   */
  static async delete(target: EventTarget, id: string): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(ModelEventTypes.ClientCertificate.delete, id, undefined);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event handled by the data store to insert a new client certificate.
   *
   * @param target A node on which to dispatch the event.
   * @param item The certificate object.
   * @returns Promise resolved to the change record
   */
  static async insert(target: EventTarget, item: ICertificateCreateOptions): Promise<ContextChangeRecord<HttpCertificate> | undefined> {
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
  static update(target: EventTarget, record: ContextChangeRecord<HttpCertificate>): void {
    const e = new ContextStateUpdateEvent<HttpCertificate>(ModelEventTypes.ClientCertificate.State.update, record);
    target.dispatchEvent(e);
  }

  /**
   * Dispatches an event after a client certificate was deleted
   *
   * @param target A node on which to dispatch the event.
   * @param record The context store delete record
   */
  static delete(target: EventTarget, record: ContextDeleteRecord): void {
    const e = new ContextStateDeleteEvent(ModelEventTypes.ClientCertificate.State.delete, record);
    target.dispatchEvent(e);
  }
}
