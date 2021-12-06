/* eslint-disable @typescript-eslint/no-explicit-any */
import { ARCHistoryRequest, ARCSavedRequest } from './request/ArcRequest.js';
import { TransformedPayload as LegacyTransformedPayload } from './request/ArcResponse.js';
import { IRequestAuthorization, Kind as AuthKind } from '../RequestAuthorization.js';
import { hasBuffer } from '../../lib/transformers/PayloadSerializer.js';

export class Normalizer {
  static normalizeRequest(request: unknown): ARCHistoryRequest | ARCSavedRequest | undefined {
    if (!request) {
      return undefined;
    }
    const typed = request as any;
    if (typed.legacyProject) {
      const saved = (request) as ARCSavedRequest;
      if (!saved.projects) {
        saved.projects = [];
      }
      saved.projects[saved.projects.length] = typed.legacyProject;
      delete typed.legacyProject;
    }
    const skipKeys = ['_id', '_rev', '_deleted'];
    Object.keys(typed).forEach((key) => {
      if (key[0] === '_' && skipKeys.indexOf(key) === -1) {
        delete typed[key];
      }
    });

    if (!typed.updated) {
      typed.updated = Date.now();
    }
    if (!typed.created) {
      typed.created = Date.now();
    }
    if (!typed.midnight) {
      const day = new Date(typed.updated);
      day.setHours(0, 0, 0, 0);
      typed.midnight = day.getTime();
    }

    if (!typed.type) {
      if (typed.name) {
        typed.type = 'saved';
      } else {
        typed.type = 'history';
      }
    } else if (typed.type === 'drive' || typed.type === 'google-drive') {
      typed.type = 'saved';
    }
    if (typed.type === 'history' && !typed._id) {
      typed._id = Normalizer.generateHistoryId(typed);
    }

    return Normalizer.normalizeAuthorization(request as ARCHistoryRequest | ARCSavedRequest);
  }

  static generateHistoryId(request: ARCHistoryRequest): string {
    const { method, url } = request;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const time = d.getTime();
    const encUrl = encodeURIComponent(url);
    return `${time}/${encUrl}/${method}`;
  }

  static normalizeAuthorization<T>(request: T): T {
    const typed = request as any;
    const { auth = {}, authType } = typed;
    if (!authType) {
      return request;
    }
    const requestAuth: IRequestAuthorization = {
      config: auth,
      enabled: true,
      type: authType,
      valid: true,
      kind: AuthKind,
    };
    const copy = { ...typed };
    copy.authorization = [requestAuth];
    delete copy.auth;
    delete copy.authType;
    return copy;
  }

  /**
   * Transforms the `TransformedPayload` object to its original data type.
   */
  static restoreTransformedPayload(body: string | ArrayBuffer | Buffer | LegacyTransformedPayload): string | Buffer | ArrayBuffer | undefined {
    if (!body) {
      return body;
    }
    if (typeof body === 'string') {
      return body;
    }
    if (hasBuffer && body instanceof Buffer) {
      return body;
    }
    if (body instanceof ArrayBuffer) {
      return body;
    }
    const typed = body as LegacyTransformedPayload;
    if (typed.type === 'ArrayBuffer' || (typed.type === 'Buffer' && !hasBuffer)) {
      const { buffer } = new Uint8Array(typed.data);
      return buffer;
    }
    if (hasBuffer && typed.type === 'Buffer') {
      return Buffer.from(typed.data);
    }
    return undefined;
  }
}
