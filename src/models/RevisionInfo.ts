export const Kind = 'Core#Revision';

/**
 * The definition of a patch revision.
 * The revision is created with the `json8-patch` library.
 */
export interface IRevisionInfo {
  /**
   * The datastore key for this patch object.
   */
  id: string;
  /**
   * The key of the object which this patch was applied to.
   */
  key: string;
  /**
   * The kind of the object.
   */
  kind: string;
  /**
   * The timestamp when the patch was created.
   */
  created: number;
  /**
   * A flag determining that the revision is inactive.
   * This may happen when a previous revision has been restored. This revision is then
   * detached from the latest revision tree. It can be user to move forward in the history though.
   * 
   * Implementations! Revisions should be removed from the storage when a new revision has been created
   * that has diverged from the tree.
   */
  deleted?: boolean;
  /**
   * The `json8-patch` revisions object used to restore the previous state.
   */
  patch: any[];
}
