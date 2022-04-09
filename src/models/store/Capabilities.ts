/**
 * Capabilities the current user has on this file.
 * This is populated by the store each time the user requests 
 * a file.
 */
export interface ICapabilities {
  /**
   * Whether the user can edit the current file.
   * The permission to edit can be inherited from a containing space so not visible
   * in the file's permissions.
   */
  canEdit: boolean;
  /**
   * Whether the user can comment on the current file.
   * The permission to edit can be inherited from a containing space so not visible
   * in the file's permissions.
   */
  canComment: boolean;
  /**
   * Whether the user can share the current file.
   * The permission to edit can be inherited from a containing space so not visible
   * in the file's permissions.
   */
  canShare: boolean;
  /**
   * Whether the user can make a copy of the file.
   * 
   * Note, this is reserved for future use an currently not supported by the store.
   * 
   * The permission to edit can be inherited from a containing space so not visible
   * in the file's permissions.
   */
  canCopy?: boolean;
  /**
   * Whether the user can read revisions of the file.
   * 
   * Note, this is reserved for future use an currently not supported by the store.
   * 
   * The permission to edit can be inherited from a containing space so not visible
   * in the file's permissions.
   */
  canReadRevisions?: boolean;
  /**
   * Whether the user can add children to the file.
   * This can be `true` only for user spaces.
   */
  canAddChildren: boolean;
  /**
   * Whether the user can permanently delete the file.
   * 
   * The permission to edit can be inherited from a containing space so not visible
   * in the file's permissions.
   */
  canDelete: boolean;
  /**
   * Only set for user spaces. Otherwise it is always `false`.
   * Whether the user can list children of the user space.
   */
  canListChildren: boolean;
  /**
   * Whether the user can rename the file.
   */
  canRename: boolean;
  /**
   * Whether the user can move the file to trash.
   */
  canTrash: boolean;
  /**
   * Whether the user can move the file back from trash.
   */
  canUntrash: boolean;
  /**
   * Whether the user can read media for the file.
   * This is always `false` for a user space which has no media.
   */
  canReadMedia: boolean;
}
