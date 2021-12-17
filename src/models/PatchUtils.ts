export const valueRequiredOperations: PatchOperation[] = ['set', 'append', 'move'];
export const patchOperations: PatchOperation[] = [...valueRequiredOperations, 'delete'];

/** 
 * - `set` - sets or replaces a value
 * - `append` - adds a new array item
 * - `delete` - removes the path
 * - `moves` - moves the item to another place.
 */
export type PatchOperation = 'set' | 'append' | 'delete' | 'move';

// text errors
export const TXT_unable_delete_value = 'Unable to delete this value.';
export const TXT_value_not_number = 'The passed value is not a number.';
export const TXT_delete_kind = 'The "kind" property cannot be changed.';
export const TXT_use_command_instead = 'Unable to modify this property. Use a corresponding command to modify this value.';
export const TXT_value_required = 'This operation requires the "value" option.';
export const TXT_unknown_path = 'The path is invalid.';
export const TXT_key_is_immutable = 'The keys are immutable.';
export const TXT_value_with_delete = 'The value cannot be set when deleting the value. Did you mean "set" operation?.';
export const TXT_unknown_property = 'Unknown property.';


// global validators

/**
 * Validates patch operation on a date related property (as timestamp).
 * 
 * @param operation The called patch operation.
 * @param value The value to set.
 */
export function validateDateInput(operation: PatchOperation, value?: unknown): void {
  if (operation === 'delete') {
    throw new Error(TXT_unable_delete_value);
  }
  if (!value) {
    throw new Error(TXT_value_required);
  }
  const number = Number(value);
  if (Number.isNaN(number)) {
    throw new Error(TXT_value_not_number);
  }
}

/**
 * Validates patch operation on a text related property.
 * 
 * @param operation The called patch operation.
 * @param value The value to set.
 */
export function validateTextInput(operation: PatchOperation, value?: unknown): void {
  if (operation === 'delete' && typeof value !== 'undefined') {
    throw new Error(TXT_value_with_delete);
  }
  if (valueRequiredOperations.includes(operation) && typeof value === 'undefined') {
    throw new Error(TXT_value_required);
  }
}

/**
 * A unified PATCH operation for ARC data.
 * This is to be used with HTTP/WS services.
 * 
 * Use this structure to keep track of the changes in the data (the revision history).
 * Because the store services keep track of the changes are are able to reverse the history,
 * the PATCH operation should operate on scalar properties. It is possible to use complex values
 * but it makes it more complex to restore the point in history.
 */
export interface StorePatchCommand {
  /**
   * The patched object kind.
   * Note, the patch can be performed on another object, like Thing of a Project.info, but the kind is still
   * the project.
   */
  kind: string;
  /**
   * The store's API version to use.
   */
  version?: 'v1';
  /**
   * The patch command. 
   * The `delete` removes the path (the last property).
   * The `set` creates or replaces the current value.
   * The `append` is when adding a new item to an array.
   */
  operation: PatchOperation;
  /**
   * The location of the data to be altered.
   */
  path: string;
  /**
   * The value to be set on the object.
   * 
   * When the `delete` command is used, the `value` is used when removing an
   * item from an array. In this situation it holds the "key" property of the object to remove. 
   * Otherwise it is an error to set the value.
   */
  value?: unknown;
  /**
   * The id of the patched data object.
   */
  id: string;
}

/**
 * A history record received from the store after completing a patch operation.
 */
export interface StorePatchResult extends StorePatchCommand {
  /**
   * When a value already existed, this filed has the previous value.
   * 
   * For a delete operation, this can be an entire object representing a model that has been deleted.
   * This is determined by the `path`.
   */
  oldValue?: unknown;
  /**
   * The time when the change ocurred.
   */
  time: number;
  /**
   * A person who triggered the change.
   * This is the id of the user.
   * 
   * Note, this is reserved for a future use.
   */
  sourceUser?: string;
}
