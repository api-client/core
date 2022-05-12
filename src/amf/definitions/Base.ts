import { IDataNodeUnion } from "./Shapes.js";

export interface IDomainProperty {
  id: string;
  types: string[];
  customDomainProperties: ICustomDomainProperty[];
}

export interface ICustomDomainProperty {
  id: string;
  name: string;
  extension: IDataNodeUnion;
}
