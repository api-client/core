/* eslint-disable @typescript-eslint/no-empty-interface */
import { ApiType } from './ApiTypes';
import { Entity } from './base';

/**
 * @deprecated
 */
export declare interface Environment {
  name: string;
  created?: number;
}

/**
 * @deprecated
 */
export declare interface Variable extends ApiType {
}

/**
 * @deprecated
 */
export declare interface ARCEnvironment extends Environment, Entity {
  
}

/**
 * @deprecated
 */
export declare interface ARCVariable extends Variable, Entity {
  /**
   * The name of the environment the variable is added to.
   */
  environment: string;
  /**
   * @deprecated Use `name` instead.
   */
  variable?: string;
}

/**
 * @deprecated
 */
export declare type SystemVariables = Readonly<{[key: string]: string}>;
