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
   * @returns The path to the /files/bulk route.
   */
  static filesBulk(): string {
    return '/files/bulk';
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
}
