import { HttpProject } from '../../models/HttpProject.js';
import { ProjectFolder } from '../../models/ProjectFolder.js';

export class VariablesStore {
  private static cache = new WeakMap<HttpProject | ProjectFolder, Record<string, string>>();

  static get(target: HttpProject | ProjectFolder): Record<string, string> {
    if (!this.cache.has(target)) {
      this.cache.set(target, {});
    }
    return this.cache.get(target) as Record<string, string>;
  }

  static set(target: HttpProject | ProjectFolder, variables: Record<string, string>): void {
    this.cache.set(target, variables);
  }

  static has(target: HttpProject | ProjectFolder): boolean {
    return this.cache.has(target);
  }

  static delete(target: HttpProject | ProjectFolder): void {
    this.cache.delete(target);
  }
}
