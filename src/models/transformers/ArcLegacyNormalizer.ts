/* eslint-disable class-methods-use-this */
import { isArcFile, prepareImportObject, } from './ImportUtils.js';
import { ArcLegacyTransformer } from './ArcLegacyTransformer.js';
import { ArcDexieTransformer } from './ArcDexieTransformer.js';
import { ArcPouchTransformer } from './ArcPouchTransformer.js';
import { ArcExportObject } from '../legacy/DataExport.js';

/**
 * Normalizes all legacy ARC export objects to the `ArcExportObject`.
 * This is also a legacy format. Use the `LegacyDataExportToApiProject` class
 * to transform it to `HttpProject`(s).
 */
export class ArcLegacyNormalizer {
  /**
   * Transforms any previous ARC export file to the current export object.
   *
   * Note, the data has to be decrypted before running this function.
   *
   * @param data Data from the import file.
   * @returns Normalized data import object.
   */
  async normalize(data: any): Promise<ArcExportObject> {
    const processed = prepareImportObject(data);
    if (isArcFile(processed)) {
      return this.normalizeArcData(processed);
    }
    throw new Error('File not recognized');
  }

  /**
   * Normalizes any previous and current ARC file export data to common model.
   *
   * @param data Imported data.
   * @return A promise resolved to ARC data export object.
   */
  async normalizeArcData(data: any): Promise<ArcExportObject> {
    switch (data.kind) {
      case 'ARC#SavedHistoryDataExport':
      case 'ARC#AllDataExport':
      case 'ARC#SavedDataExport':
      case 'ARC#SavedExport':
      case 'ARC#HistoryDataExport':
      case 'ARC#HistoryExport':
      case 'ARC#Project':
      case 'ARC#SessionCookies':
      case 'ARC#HostRules':
      case 'ARC#ProjectExport':
        return this.normalizeArcPouchSystem(data);
      case 'ARC#requestsDataExport':
        return this.normalizeArcDexieSystem(data);
      default:
        return this.normalizeArcLegacyData(data);
    }
  }

  /**
   * Normalizes export data from the GWT system.
   * @param data Parsed data
   * @returns Normalized import object
   */
  normalizeArcLegacyData(data: any): Promise<ArcExportObject> {
    const transformer = new ArcLegacyTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes export data from Dexie powered data store.
   * @param data Parsed data
   * @returns Normalized import object
   */
  normalizeArcDexieSystem(data: any): Promise<ArcExportObject> {
    const transformer = new ArcDexieTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes ARC's data exported in PouchDB system
   * @param data Parsed data
   * @returns Normalized import object
   */
  normalizeArcPouchSystem(data: any): Promise<ArcExportObject> {
    const transformer = new ArcPouchTransformer(data);
    return transformer.transform();
  }
}
