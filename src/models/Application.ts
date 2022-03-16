/**
 * A definition if an application.
 */
export interface IApplication {
  /**
   * The unique code identifying the application in the ecosystem.
   * For example, `api-client` application has its own code reported through this property.
   * This is not generated per instance but per application.
   */
  code: string;
  /**
   * Application display name.
   */
  name: string;
  /**
   * The current version of the application.
   */
  version: string;
}
