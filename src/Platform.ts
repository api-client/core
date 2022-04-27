/**
 * Whether the current platform has the `FormData` interface
 */
export const hasFormData: boolean = typeof FormData === 'function';
/**
 * Whether the current platform has Blob interface
 */
export const hasBlob: boolean = typeof Blob === 'function';
/**
 * Whether the current platform has the `Buffer` interface.
 */
export const hasBuffer: boolean = typeof Buffer === 'function';
