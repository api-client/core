export const Kind = 'ARC#HttpProjectListItem';
/**
 * The HTTP Project definition to be used in lists.
 */
export interface IHttpProjectListItem {
  /**
   * The data store key of the project.
   */
  key: string;
  /**
   * Project's name
   */
  name: string;
  /**
   * Whether the project is one of the favourites.
   * May be used by an UI to add projects to favourites.
   */
  favourite?: boolean;
  /**
   * The timestamp when the project was last updated.
   */
  updated: number;
}
