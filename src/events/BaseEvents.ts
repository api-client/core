import CustomEvent from './CustomEvent.js';

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
export class ContextEvent<S extends object, R> extends CustomEvent<ContextEventDetailWithResult<R>> {
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
   * The id of the state object to read.
   */
  id: string;
  /**
   * Optional revision of the state, when supported by the context provider.
   */
  rev?: string;
}

/**
 * An event to be used to read a state from a context provider.
 */
export class ContextReadEvent<T> extends ContextEvent<ContextReadEventDetail, T> {
  /**
   * @param type The type of the event
   * @param id The domain id of the object to read
   * @param rev Optional revision of the state, when supported by the context provider.
   */
  constructor(type: string, id: string, rev?: string) {
    super(type, { id, rev });
  }
}

export interface ContextReadBulkEventDetail {
  /**
   * The list of ids to read.
   */
  ids: string[];
}

/**
 * An event to be used to read a list of object from the API store.
 */
export class ContextReadBulkEvent<T> extends ContextEvent<ContextReadBulkEventDetail, T> {
  /**
   * @param type The type of the event
   * @param ids The list of domain ids to read. These must be of the same domain type.
   */
  constructor(type: string, ids: string[]) {
    super(type, { ids });
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
   * The ID of the changed context state object.
   */
  key: string;
  /**
   * The revision of the updated context state object.
   * It is not set when old revision is unavailable (new entity is created) or when the context provider does not support this value.
   */
  oldRev?: string;
  /**
   * New revision of updated state object. May not be set when the context provider does not support this value.
   */
  rev?: string;
  /**
   * The updated context state object.
   */
  item?: T;
  /**
   * Optionally, when relevant, the id of the parent of the changed object.
   */
  parent?: string;
}

export interface ContextDeleteEventDetail {
  /**
   * The id of the domain object to remove.
   */
  id: string;
  /**
   * The id of the parent object, if applicable.
   */
  parent?: string;
  /**
   * The revision to delete, when applicable.
   */
  rev?: string;
}

/**
 * An event to be used to delete a state in the context provider.
 */
export class ContextDeleteEvent extends ContextEvent<ContextDeleteEventDetail, ContextDeleteRecord> {
  /**
   * @param type The type of the event to dispatch.
   * @param id The id of the object to delete
   * @param parent The id of the parent object, if applicable.
   */
  constructor(type: string, id: string, parent?: string, rev?: string) {
    super(type, { id, parent, rev });
  }
}

export interface ContextDeleteRecord {
  /**
   * The data kind of the deleted item.
   * May not be present when this is used with the old architecture.
   */
  kind?: string;
  /**
   * The id of the removed object.
   */
  id: string;
  /**
   * The id of the parent object, if applicable.
   */
  parent?: string;
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
   * The id of the parent object, if applicable.
   */
  parent?: string;
}

/**
 * An event that is dispatched to update the entire object in the store.
 * This is equivalent to PUT operation in REST HTTP.
 * 
 * @template T The object that is being updated.
 */
export class ContextUpdateEvent<T extends object> extends ContextEvent<ContextUpdateEventDetail<T>, ContextChangeRecord<T>> {
  constructor(type: string, updateInfo: ContextUpdateEventDetail<T>) {
    super(type, updateInfo);
  }
}
