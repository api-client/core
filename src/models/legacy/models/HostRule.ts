import { Entity } from './base.js';

/**
 * ARC host rule definition.
 * @deprecated
 */
export declare interface HostRule {
  /**
   * The from rule (may contain asterisks)
   */
  from: string;
  /**
   * replacement value
   */
  to: string;
  /**
   * if false the rule is ignored
   */
  enabled?: boolean;
  /**
   * optional rule description
   */
  comment?: string;
}

/**
 * @deprecated
 */
export declare interface ARCHostRule extends HostRule, Entity {
  /**
   * The timestamp when the rule was updated the last time.
   * This value is created by the model. Not accepted when creating the entity.
   */
  updated?: number;
}
