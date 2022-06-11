import CustomEvent from './CustomEvent.js';
import { IQueryResponse } from '../models/store/Backend.js';

/**
 * Base event detail definition for the events that returns a `result`
 * property on the `detail` object
 */
export interface ContextEventDetailWithResult<T> {
  /**
   * This property is set by the context provider, a promise resolved when the operation finish
   * with the corresponding result.
   */
  result?: Promise<T> | undefined;
}

/**
 * A base class to use with context providers.
 */
export class ContextEvent<S extends object, R> extends CustomEvent<S & ContextEventDetailWithResult<R>> {
  /**
   * @param type The event type
   * @param detail The optional detail object. It adds object's properties to the `detail` with the `result` property.
   */
  constructor(type: string, detail: S) {
    super(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        result: undefined,
        ...detail,
      }
    });
  }
}

export interface ContextReadEventDetail {
  /**
   * The key of the state object to read.
   */
  key: string;
  /**
   * Optional parent, when needed.
   */
  parent?: string;
}

/**
 * An event to be used to read a state from a context provider.
 */
export class ContextReadEvent<T> extends ContextEvent<ContextReadEventDetail, T> {
  /**
   * @param type The type of the event
   * @param key The domain key of the object to read
   * @param parent Optional parent, when needed.
   */
  constructor(type: string, key: string, parent?: string) {
    super(type, { key, parent });
  }
}

export interface ContextReadBulkEventDetail {
  /**
   * The list of keys to read.
   */
  keys: string[];
}

/**
 * An event to be used to read a list of object from the API store.
 */
export class ContextReadBulkEvent<T> extends ContextEvent<ContextReadBulkEventDetail, T[]> {
  /**
   * @param type The type of the event
   * @param keys The list of domain keys to read. These must be of the same domain type.
   */
  constructor(type: string, keys: string[]) {
    super(type, { keys });
  }
}

/**
 * A general purpose change record.
 * Set on the `detail` object of the `CustomEvent` when a change occurs in the context store.
 */
export interface ContextChangeRecord<T> {
  /**
   * The data kind of the changed item.
   * May not be present when this is used with the old architecture.
   */
  kind?: string;
  /**
   * The key of the changed context state object.
   */
  key: string;
  /**
   * The updated context state object.
   */
  item?: T;
  /**
   * Optionally, when relevant, the key of the parent of the changed object.
   */
  parent?: string;
}

export interface ContextDeleteEventDetail {
  /**
   * The key of the domain object to remove.
   */
  key: string;
  /**
   * The key of the parent object, if applicable.
   */
  parent?: string;
}

export interface ContextDeleteBulkEventDetail {
  /**
   * The list of keys of the domain object to remove.
   */
  keys: string[];
  /**
   * The key of the parent object, if applicable.
   */
  parent?: string;
}

/**
 * An event to be used to delete a state in the context provider.
 */
export class ContextDeleteEvent extends ContextEvent<ContextDeleteEventDetail, ContextDeleteRecord> {
  /**
   * An event to be used to delete a state in the context provider.
   * @param type The type of the event to dispatch.
   * @param key The key of the object to delete
   * @param parent The key of the parent object, if applicable.
   */
  constructor(type: string, key: string, parent?: string) {
    super(type, { key, parent });
  }
}

/**
 * An event to be used to delete a number of entities in the context provider.
 */
export class ContextDeleteBulkEvent extends ContextEvent<ContextDeleteBulkEventDetail, ContextDeleteRecord[]> {
  /**
   * An event to be used to delete a number of entities in the context provider.
   * @param type The type of the event to dispatch.
   * @param keys The list of ids of the domain object to remove.
   * @param parent The key of the parent object, if applicable.
   */
  constructor(type: string, keys: string[], parent?: string) {
    super(type, { keys, parent });
  }
}

export interface ContextDeleteRecord {
  /**
   * The data kind of the deleted item.
   * May not be present when this is used with the old architecture.
   */
  kind?: string;
  /**
   * The key of the removed object.
   */
  key: string;
  /**
   * The key of the parent object, if applicable.
   */
  parent?: string;
}

/**
 * An event dispatched to the context store to restore previously deleted items.
 */
export class ContextRestoreEvent<T> extends ContextEvent<{ records: ContextDeleteRecord[] }, (ContextChangeRecord<T> | undefined)[]> {
  /**
   * An event dispatched to the context store to restore previously deleted items.
   * 
   * The result of the event is the list of `ContextChangeRecord` for the restored items.
   * 
   * @param type The type of the event.
   * @param records The records of previously deleted items.
   */
  constructor(type: string, records: ContextDeleteRecord[]) {
    super(type, { records });
  }
}

/**
 * An event dispatched when a context store object has been deleted.
 * In general a single context store uses the same event to dispatch the change record.
 * For example the `data-store` dispatches the `x` event and the change record has the 
 * `kind` property that is used to recognize the type of the data object.
 */
export class ContextStateDeleteEvent extends CustomEvent<ContextDeleteRecord> {
  /**
   * @param type The type of the event to dispatch.
   * @param record The delete record.
   */
  constructor(type: string, record: ContextDeleteRecord) {
    super(type, {
      bubbles: true,
      composed: true,
      cancelable: false,
      detail: record,
    });
  }
}

/**
 * An event dispatched when a context store object has been updated.
 */
export class ContextStateUpdateEvent<T> extends CustomEvent<ContextChangeRecord<T>> {
  /**
   * @param type The type of the event to dispatch.
   * @param record The delete record.
   */
  constructor(type: string, record: ContextChangeRecord<T>) {
    super(type, {
      bubbles: true,
      composed: true,
      cancelable: false,
      detail: record,
    });
  }
}

export interface ContextUpdateEventDetail<T> {
  /**
   * The context store object to be updated by the context provider.
   */
  item: T;
  /**
   * The key of the parent object, if applicable.
   */
  parent?: string;
}

export interface ContextUpdateBulkEventDetail<T> {
  /**
   * The list of context store objects to be updated by the context provider.
   */
  items: T[];
  /**
   * The key of the parent object, if applicable.
   */
  parent?: string;
}

/**
 * An event that is dispatched to update the entire object in the store.
 * This is equivalent to PUT operation in REST HTTP.
 * 
 * @template T The object that is being updated.
 * @template U The object that is returned by the context store after updating. By default it is the `T`.
 */
export class ContextUpdateEvent<T extends object, U = T> extends ContextEvent<ContextUpdateEventDetail<T>, ContextChangeRecord<U>> {
  /**
   * An event that is dispatched to update the entire object in the store.
   * This is equivalent to PUT operation in REST HTTP.
   * 
   * @param type The type of the event to dispatch
   * @param updateInfo The update information.
   */
  constructor(type: string, updateInfo: ContextUpdateEventDetail<T>) {
    super(type, updateInfo);
  }
}

/**
 * An event that is dispatched to update a list of objects in the store.
 * This is equivalent to PUT operation in REST HTTP.
 * 
 * If there's a parent, this event only allows to update entities in bulk for the same parent.
 * 
 * @template T The object that is being updated.
 * @template U The object that is returned by the context store after updating. By default it is the `T`.
 */
export class ContextUpdateBulkEvent<T extends object, U = T> extends ContextEvent<ContextUpdateBulkEventDetail<T>, ContextChangeRecord<U>[]> {
  /**
   * An event that is dispatched to update the entire object in the store.
   * This is equivalent to PUT operation in REST HTTP.
   * 
   * @param type The type of the event to dispatch
   * @param updateInfo The update information.
   */
  constructor(type: string, updateInfo: ContextUpdateBulkEventDetail<T>) {
    super(type, updateInfo);
  }
}

/**
 * Data store query result object.
 */
export interface ContextListResult<T> {
  /**
   * Next page token to be used with pagination.
   * It is not set when the query has not returned any results.
   */
  nextPageToken?: string;
  /**
   * The list of items in the response.
   * May be empty array when there was no more results.
   */
  items: T[];
}

/**
 * Base query options for the data store.
 */
export interface ContextListOptions {
  /**
   * The number of results per the page.
   */
  limit?: number;
  /**
   * A string that should be used with the pagination.
   */
  nextPageToken?: string;
}

export class ContextListEvent<T> extends ContextEvent<ContextListOptions, ContextListResult<T>> {
  /**
   * @param type The type of the event
   * @param opts Query options.
   */
  constructor(type: string, opts: ContextListOptions = {}) {
    super(type, opts);
  }
}

export interface IQueryDetail {
  /**
   * The query term. All values are always passed as string. Context store must parse value if it requires other types.
   */
  term: string;

  /**
   * If the context store supports it, the tags to use with the query function to limit the results.
   */
  tags?: string[];

  /**
   * General purpose type to be defined by the context store.
   * Allows to specify the type of the query to perform.
   */
  type?: string;

  /**
   * General purpose keyword to be defined by the context store.
   * The purpose is to instruct the context store to perform detailed search.
   * Usually this means longer search time but more accurate results.
   */
  detailed?: boolean;
}

/**
 * An event dispatched to the context store to perform a query operation.
 * If the context store supports the query operation, it should use the definition of `IQueryDetail` to perform the query.
 * The result is the list of objects ordered by the store from the most relevant items to the least.
 * 
 * The implementation should not assume pagination and return enough results for the user to find what they were looking for
 * or to redefine the query. Suggested limit is `50` which in many cases is equivalent of 2 pages of results.
 */
export class ContextQueryEvent<T = unknown> extends ContextEvent<IQueryDetail, IQueryResponse<T>> {
  /**
   * An event dispatched to the context store to perform a query operation.
   * If the context store supports the query operation, it should use the definition of `IQueryDetail` to perform the query.
   * The result is the list of objects ordered by the store from the most relevant items to the least.
   * 
   * The implementation should not assume pagination and return enough results for the user to find what they were looking for
   * or to redefine the query. Suggested limit is `50` which in many cases is equivalent of 2 pages of results.
   * 
   * @param type The type of the event.
   * @param opts The query options.
   */
  constructor(type: string, opts: IQueryDetail) {
    super(type, opts);
  }
}
