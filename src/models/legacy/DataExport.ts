import { ARCHistoryRequest, ARCSavedRequest, ArcBaseRequest } from './request/ArcRequest.js';
import { ArcLegacyProject, ARCProject } from './models/ArcLegacyProject.js';
import { ARCWebsocketUrlHistory, ARCUrlHistory } from './models/UrlHistory.js';
import { ARCHostRule } from './models/HostRule.js';
import { ARCVariable } from './models/Variable.js';
import { ARCAuthData } from './models/AuthData.js';
import { ARCCertificateIndex, Certificate, ARCRequestCertificate } from './models/ClientCertificate.js';
import { ARCCookie } from './models/Cookies.js';

/**
 * @deprecated
 */
export interface ExportArcHistoryRequest extends ARCHistoryRequest, ExportEntity {}
/**
 * @deprecated
 */
export interface ExportArcProjects extends ArcLegacyProject, ExportEntity {}
/**
 * @deprecated
 */
export interface ExportArcWebsocketUrl extends ARCWebsocketUrlHistory, ExportEntity {}
/**
 * @deprecated
 */
export interface ExportArcUrlHistory extends ARCUrlHistory, ExportEntity {}
/**
 * @deprecated
 */
export interface ExportArcHostRule extends ARCHostRule, ExportEntity {}
/**
 * @deprecated
 */
export interface ExportArcVariable extends ARCVariable, ExportEntity {}
/**
 * @deprecated
 */
export interface ExportArcAuthData extends ARCAuthData, ExportEntity {}
/**
 * @deprecated
 */
export interface ExportArcClientCertificateData extends ExportEntity, ARCCertificateIndex {
  cert?: Certificate | Certificate[];
  pKey?: Certificate | Certificate[];
}

/**
 * @deprecated
 */
export interface ExportEntity {
  /**
   * The object kind
   */
  kind?: string;
  /**
   * The original datastore key.
   * Note that the `_id` and `_rev` are deleted.
   */
  key: string;
}

/**
 * @deprecated
 */
export interface ExportArcSavedRequest extends ARCSavedRequest, ExportEntity {}

/**
 * @deprecated
 */
export interface ArcExportObject {
  createdAt: string;
  version: string;
  kind: string;
  loadToWorkspace?: boolean;
  /**
   * When true the export object was created with a Electron based cookie storage.
   */
  electronCookies?: boolean;
  requests?: ExportArcSavedRequest[];
  history?: ExportArcHistoryRequest[];
  projects?: ExportArcProjects[];
  websocketurlhistory?: ExportArcWebsocketUrl[];
  'websocket-url-history'?: ExportArcWebsocketUrl[];
  urlhistory?: ExportArcUrlHistory[];
  'url-history'?: ExportArcUrlHistory[];
  clientcertificates?: ExportArcClientCertificateData[];
  'client-certificates'?: ExportArcClientCertificateData[];
  cookies?: ExportArcCookie[];
  hostrules?: ExportArcHostRule[];
  'host-rules'?: ExportArcHostRule[];
  variables?: ExportArcVariable[];
  authdata?: ExportArcAuthData[];
  'auth-data'?: ExportArcAuthData[];
}

/**
 * @deprecated
 */
export interface ExportArcCookie extends ARCCookie {
  /**
   * The object kind
   */
  kind: string;
  /**
   * Datastore ID if a data store other than Electron was used.
   */
  key?: string;
}

/**
 * @deprecated
 */
export interface EncryptionOptions {
  /**
   * When set it encrypts the data before export.
   * This library does not support any particular encryption. It dispatches
   * `encryptionencode` to request for data encryption.
   */
  encrypt?: boolean;
  /**
   * Passphrase to use to encode the data.
   */
  passphrase?: string;
}

/**
 * @deprecated
 */
export interface ExportOptions extends EncryptionOptions {
  /**
   * Name of the export provider.
   * ARC supports Google Drive (`drive`) and `file` providers at the moment.
   */
  provider: string;

  /**
   * Adds flag to the export file to skip import table and storing the data
   * to the data store when opening the file.
   */
  skipImport?: boolean;

  /**
   * Sets the `kind` property of export object.
   */
  kind?: string;
}

/**
 * @deprecated
 */
export interface ExportOptionsInternal extends ExportOptions {
  /**
   * The application version used to generate the export
   */
  appVersion: string;
}

export interface ArcExportProcessedData {
  key: keyof ArcNativeDataExport;
  data: any[];
}
export interface ArcExportClientCertificateData {
  item: ARCCertificateIndex;
  data: ARCRequestCertificate;
}

export interface ArcNativeDataExport {
  authdata?: boolean | ARCAuthData[];
  clientcertificates?: boolean;
  cookies?: boolean | ARCCookie[];
  history?: boolean | ARCHistoryRequest[];
  hostrules?: boolean | ARCHostRule[];
  projects?: boolean | ARCProject[];
  requests?: boolean | (ARCSavedRequest | ArcBaseRequest | ARCHistoryRequest)[];
  variables?: boolean | ARCVariable[];
  websocketurlhistory?: boolean | ARCWebsocketUrlHistory[];
  urlhistory?: boolean | ARCUrlHistory[];
}
