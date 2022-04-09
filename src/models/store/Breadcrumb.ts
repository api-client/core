/**
 * A schema describing a breadcrumb for a file.
 */
export interface IBreadcrumb {
  /**
   * The key of the parent item
   */
  key: string;
  /**
   * The parent's kind
   */
  kind: string;
  /**
   * The parent's name
   */
  displayName: string;
}
