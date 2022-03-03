export interface IBackendInfo {
  /**
   * Whether the application storage support authentication.
   * When true the implementations turns into the user support mode.
   * Otherwise it is treated as installed on the localhost only.
   */
  hasAuthentication: boolean;
}

export interface IBackendCommand {
  /**
   * Optional path. When not set the path is the URL of the web socket channel.
   */
  path?: string;
  /**
   * The operation to perform
   */
  operation: 'delete' | 'patch' | 'create';
  /**
   * The command data.
   */
  value?: unknown;
}

export interface IBackendMessage {
  /**
   * The message type. Usually it is an `event`, meaning, a data change notification.
   */
  type: 'event';
  /**
   * In most cases an event has data associated with it like the created object or 
   * the patch that has been applied to the object.
   * Not set for events related to deleting an object.
   */
  data?: unknown;
}

export interface IBackendEvent extends IBackendMessage {
  /**
   * The operation that has been performed on the resource.
   * 
   * Note, `updated` is when the entire object must be revalidated in the opposite
   * to `patch` where the patch should be applied to the object.
   */
  operation: 'created' | 'updated' | 'patch' | 'deleted' | 'access-granted' | 'access-removed';
  /**
   * The kind of data that has been changed.
   */
  kind: string;
  /**
   * For update events it is the key of the updated object.
   */
  id?: string;
}

export interface IListResponse {
  /**
   * The cursor to use with the next query.
   * Not set when no more results.
   */
  cursor?: string;
  /**
   * The list of objects returned from the store.
   */
  data: unknown[];
}
