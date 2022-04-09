import { IModification } from './Modification.js';

export const Kind = 'Core#Revision';

/**
 * The definition of a patch revision.
 * The revision is created with the `@api-client/json` library.
 */
export interface IRevision {
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
   * The `@api-client/json` revisions object used to restore the previous state.
   */
  patch: any[];
  /**
   * The modification record for this revision.
   */
  modification: IModification;
}
