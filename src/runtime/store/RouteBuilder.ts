/**
 * A helper class to make sure routes user and reported by this service are consistent.
 */
export class RouteBuilder {
  /**
   * @returns The path to the /files route.
   */
  static files(): string {
    return '/files';
  }

  /**
   * @returns The path to the /files/batch route.
   */
  static filesBatch(): string {
    return '/files/batch';
  }

  /**
   * @returns The path to the /files/[id] route.
   */
  static file(key: string): string {
    return `/files/${key}`;
  }

  /**
   * @returns The path to the /files/[id]/users route.
   */
  static fileUsers(key: string): string {
    return `/files/${key}/users`;
  }

  /**
   * @returns The path to the /file/[id]/revisions route.
   */
  static fileRevisions(file: string): string {
    return `/file/${file}/revisions`;
  }

  /**
   * @returns The path to the /backend route.
   */
  static backend(): string {
    return '/store';
  }

  static sessions(): string {
    return '/sessions'
  }

  static sessionRenew(): string {
    return '/sessions/renew'
  }

  static usersMe(): string {
    return '/users/me'
  }

  static users(): string {
    return '/users'
  }

  static user(key: string): string {
    return `/users/${key}`
  }

  static history(): string {
    return `/history`;
  }

  static historyBatchCreate(): string {
    return `/history/batch/create`;
  }

  static historyBatchDelete(): string {
    return `/history/batch/delete`;
  }

  static historyItem(key: string): string {
    return `/history/${key}`;
  }

  static shared(): string {
    return '/shared';
  }

  static app(appId: string): string {
    return `/app/${appId}`;
  }

  // GET, POST
  static appRequests(appId: string): string {
    return `${this.app(appId)}/requests`;
  }

  // GET, DELETE
  static appRequestItem(appId: string, key: string): string {
    return `${this.appRequests(appId)}/${key}`;
  }

  static appRequestsBatch(appId: string): string {
    return `${this.appRequests(appId)}/batch`;
  }

  // POST
  static appRequestsBatchCreate(appId: string): string {
    return `${this.appRequestsBatch(appId)}/create`;
  }

  // POST
  static appRequestsBatchRead(appId: string): string {
    return `${this.appRequestsBatch(appId)}/read`;
  }

  // POST
  static appRequestsBatchDelete(appId: string): string {
    return `${this.appRequestsBatch(appId)}/delete`;
  }

  // POST
  static appRequestsBatchUndelete(appId: string): string {
    return `${this.appRequestsBatch(appId)}/undelete`;
  }

  // POST, GET
  static appProjects(appId: string): string {
    return `${this.app(appId)}/projects`;
  }

  // GET, DELETE
  static appProjectItem(appId: string, key: string): string {
    return `${this.appProjects(appId)}/${key}`;
  }

  static appProjectsBatch(appId: string): string {
    return `${this.appProjects(appId)}/batch`;
  }

  // POST
  static appProjectsBatchCreate(appId: string): string {
    return `${this.appProjectsBatch(appId)}/create`;
  }

  // POST
  static appProjectsBatchRead(appId: string): string {
    return `${this.appProjectsBatch(appId)}/read`;
  }

  // POST
  static appProjectsBatchDelete(appId: string): string {
    return `${this.appProjectsBatch(appId)}/delete`;
  }

  // POST
  static appProjectsBatchUndelete(appId: string): string {
    return `${this.appProjectsBatch(appId)}/undelete`;
  }
}
