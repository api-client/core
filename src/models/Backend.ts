/* eslint-disable import/export */
export type BackendMode = 'single-user' | 'multi-user';

export interface IBackendInfo {
  /**
   * The model the store is on.
   * 
   * The `single-user` mode is the default mode where external user authentication is not required
   * (but clients must use the auth token issued by the session endpoint).
   * 
   * In the `multi-user` model the authentication configuration is required and the user must 
   * authenticate through an external identity provider (by default Open ID Connect is supported).
   * After that the client has to create an authenticated session in the store service and use
   * the token with the API calls.
   * 
   * @default single-user
   */
  mode: BackendMode;
  /**
   * Optional, the store base path when set on the configuration.
   */
  prefix?: string;
  /**
   * The path to the authentication endpoint.
   */
  authPath: string;
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
  operation: 'created' | 'patch' | 'deleted' | 'access-granted' | 'access-removed';
  /**
   * The kind of data that has been changed.
   */
  kind: string;
  /**
   * For update events it is the key of the updated object.
   */
  id?: string;
  /**
   * When relevant, the parent of the changed object.
   */
  parent?: string;
}

export interface IListResponse<T = unknown> {
  /**
   * The cursor to use with the next query.
   * Not set when no more results.
   */
  cursor?: string;
  /**
   * The list of objects returned from the store.
   */
  data: T[];
}

export interface IListOptions {
  /**
   * Page cursor to use with the query.
   */
  cursor?: string;
  /**
   * Number of items in the result.
   * Ignored when `cursor` is set.
   * 
   * Note, when changing the number of items in the result
   * you need to start listing over again.
   */
  limit?: number;
  /**
   * Supported by some endpoints. When set it performs a query on the data store.
   */
  query?: string;
  /**
   * Only with the `query` property. Tells the system in which fields to search for the query term.
   */
  queryField?: string[];
  /**
   * General purpose type property to filer the results.
   * This is used, for example, by the history store to list history for a specific type of requests,
   */
  type?: string;
  /**
   * Whether the list should contain children of a parent.
   * This is a key of the parent.
   */
  parent?: string;
}

export interface ICursorOptions {
  /**
   * Page cursor to use with the query.
   */
  cursor?: string;
}

/**
 * Listing options for the HTTP history.
 */
export type HistoryListOptions = IHistorySpaceListOptions | IHistoryProjectListOptions | IHistoryRequestListOptions | IHistoryUserListOptions | IHistoryAppListOptions;

/**
 * Query options to list history for a user space.
 * The user has to have access to the user space to read / create / delete the history.
 */
export interface IHistorySpaceListOptions extends IListOptions {
  type: 'space';
  /**
   * The id of the space.
   */
  id: string;
  /**
   * Whether to limit the list of results to the history that belongs to the current user.
   */
  user?: boolean;
}

/**
 * Query options to list history for an HTTP project.
 * The user has to have access to the parent user space to read / create / delete the history.
 */
export interface IHistoryProjectListOptions extends IListOptions {
  type: 'project';
  /**
   * The id of the project.
   */
  id: string;
  /**
   * Whether to limit the list of results to the history that belongs to the current user.
   */
  user?: boolean;
}

/**
 * Query options to list history for a request in a project.
 * The user has to have access to the parent user space to read / create / delete the history.
 */
export interface IHistoryRequestListOptions extends IListOptions {
  type: 'request';
  /**
   * The id of the project that contains the request.
   */
  project: string;
  /**
   * The id of the request.
   */
  id: string;
  /**
   * Whether to limit the list of results to the history that belongs to the current user.
   */
  user?: boolean;
}

/**
 * Query options to list history for a user. This targets lists all user history. If you need to 
 * filter the user history use other interfaces with the `user` flag set.
 */
export interface IHistoryUserListOptions extends IListOptions {
  type: 'user';
}

/**
 * Query options to list history for a history object that was created by an application that has no concept
 * of user spaces. In this case the queries are always made against the current user.
 */
export interface IHistoryAppListOptions extends IListOptions {
  type: 'app';
  /**
   * The id of the application.
   * These queries are always made for a user.
   */
  id: string;
}
