export const valueRequiredOperations: PatchOperation[] = ['set', 'append'];
export const patchOperations: PatchOperation[] = [...valueRequiredOperations, 'delete'];

export type PatchOperation = 'set' | 'append' | 'delete';

// text errors
export const TXT_unable_delete_value = 'Unable to delete this value.';
export const TXT_value_not_number = 'The passed value is not a number.';
export const TXT_delete_kind = 'The "kind" property cannot be changed.';
export const TXT_use_command_instead = 'Unable to modify this property. Use a corresponding command to modify this value.';
export const TXT_value_required = 'This operation requires the "value" option.';
export const TXT_unknown_path = 'The path is invalid.';
export const TXT_key_is_immutable = 'The keys are immutable.';
export const TXT_value_with_delete = 'The value cannot be set when deleting the value. Did you mean "set" operation?.';


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
