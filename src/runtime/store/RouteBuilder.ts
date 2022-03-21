/**
 * A helper class to make sure routes user and reported by this service are consistent.
 */
export class RouteBuilder {
  /**
   * @returns The path to the /spaces route.
   */
  static spaces(): string {
    return '/spaces';
  }

  /**
   * @returns The path to the /spaces/[id] route.
   */
  static space(key: string): string {
    return `/spaces/${key}`;
  }

  /**
   * @returns The path to the /spaces/[id]/users route.
   */
  static spaceUsers(key: string): string {
    return `/spaces/${key}/users`;
  }

  /**
   * @returns The path to the /spaces/[id]/projects route.
   */
  static spaceProjects(key: string): string {
    return `/spaces/${key}/projects`;
  }

  /**
   * @returns The path to the /spaces/[id]/projects/[id] route.
   */
  static spaceProject(space: string, project: string): string {
    return `/spaces/${space}/projects/${project}`;
  }

  /**
   * @returns The path to the /spaces/[id]/projects/[id]/revisions route.
   */
  static projectRevisions(space: string, project: string): string {
    return `/spaces/${space}/projects/${project}/revisions`;
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
}
