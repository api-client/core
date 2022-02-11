/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

import { dataValue } from './BaseTransformer.js';
import { PostmanTransformer } from './PostmanTransformer.js';
import { 
  ArcExportObject,
  ExportArcVariable,
} from '../legacy/DataExport.js';


interface PostmanEnvironment {
  id: string;
  name: string;
  timestamp: number;
  _postman_variable_scope: string;
  _postman_exported_at: string;
  _postman_exported_using: string;
  values: PostmanEnvironmentValue[];
}

interface PostmanEnvironmentValue {
  enabled: boolean;
  key: string;
  value: string;
  type: string;
}

/**
 * Transforms environment export from postman to ARC variables.
 */
export class PostmanEnvTransformer extends PostmanTransformer {
  /**
   * Transforms the data into ARC data model.
   * @returns Promise resolved when data are transformed.
   */
  transform(): Promise<ArcExportObject> {
    const raw = this[dataValue] as PostmanEnvironment;

    const result: ArcExportObject = {
      createdAt: new Date().toISOString(),
      version: 'postman-environment',
      kind: 'ARC#Import',
      variables: this.transformVariables(raw.values, raw.name)
    };
    return Promise.resolve(result);
  }

  /**
   * Transforms the list of variables in a environment to ARC variables.
   *
   * @param vars List of Postman's variables
   * @param envName Environment name. Default to `default`.
   * @returns List of ARC variables.
   */
  transformVariables(vars: PostmanEnvironmentValue[], envName: string): ExportArcVariable[] {
    if (!vars || !vars.length) {
      return [];
    }
    envName = envName || 'default';
    return vars.map((item) => {
      const result: ExportArcVariable = {
        kind: 'ARC#VariableData',
        environment: envName,
        enabled: !!item.enabled,
        name: item.key,
        value: this.ensureVariablesSyntax(item.value),
        key: '',
      };
      result.key = this.genId(result);
      return result;
    });
  }

  /**
   * Generates an _id to store the same data.
   * @param item ARC variable model
   * @returns Variable ID
   */
  genId(item: ExportArcVariable): string {
    const env = encodeURIComponent(item.environment);
    const eVar = encodeURIComponent(item.name);
    return `postman-var-${env}-${eVar}`;
  }
}
