import { IProperty, Property } from './Property';
import { IMultipartBody } from '../lib/transformers/PayloadSerializer';
import { RequestUiMeta as LegacyRequestUiMeta } from './legacy/request/ArcRequest';

export const Kind = 'ARC#RequestUiMeta';

/**
 * URL editor meta data.
 */
export interface IUrlMeta {
  /**
   * The model generated for the URL parameters.
   */
  model?: IProperty[];
  /**
   * The query params delimiter. By default it is `&`.
   */
  delimiter?: string;
}

/**
 * Headers editor meta data.
 */
export interface IHeadersMeta {
  /**
   * The model generated for the headers editor.
   */
  model?: IProperty[];
  /**
   * Whether the source editor is opened.
   */
  source?: boolean;
}

export interface IAuthMeta {
  /**
   * The index of the selected authorization method.
   */
  selected?: number;
}

export interface IActionsMeta {
  /**
   * The index of the selected arc actions view.
   */
  selected?: number;
}

export interface IResponseUiMeta {
  /**
   * The list of activated panels in the response view.
   */
  activePanels?: string[];
  /**
   * The name of the selected response panel.
   */
  selectedPanel?: string;
}

/**
 * The body editor may produce multiple view models
 * for the UI. Each editor can store it's data in here
 * to restore it after opening a request,
 */
export interface IBodyMetaModel {
  /**
   * The id of the editor. Each editor in ARC has own id.
   */
  type: string;
  /**
   * Generated view model.
   */
  viewModel: (IProperty | IMultipartBody | IRawBody)[];
}

/**
 * Body editor meta data.
 */
export interface IBodyMeta {
  /**
   * The model generated for the body editor.
   */
  model?: IBodyMetaModel[];
  /**
   * The selected editor
   */
  selected?: string;
}

export interface IRawBody {
  /**
   * The last used body value.
   */
  value: string;
  /**
   * True when the generator was used to build the value
   */
  isGenerator?: boolean;
  /**
   * The schema for the generator. Work in progress.
   */
  generatorSchema?: unknown;
}

/**
 * UI configuration for the request.
 */
export interface IRequestUiMeta {
  kind?: typeof Kind;
  /**
   * Body editor metadata.
   */
  body?: IBodyMeta;
  /**
   * URL editor metadata.
   */
  url?: IUrlMeta;
  /**
   * Headers editor metadata.
   */
  headers?: IHeadersMeta;
  /**
   * Authorization editor meta.
   */
  authorization?: IAuthMeta;
  /**
   * ARC request actions editor UI config.
   */
  actions?: IActionsMeta;
  /**
   * The currently selected editor in the request editor UI.
   */
  selectedEditor?: number;
  /**
   * Optional configuration of the response view
   */
  response?: IResponseUiMeta;
}

export class RequestUiMeta {
  kind = Kind;
  /**
   * Body editor metadata.
   */
  body?: IBodyMeta;
  /**
   * URL editor metadata.
   */
  url?: IUrlMeta;
  /**
   * Headers editor metadata.
   */
  headers?: IHeadersMeta;
  /**
   * Authorization editor meta.
   */
  authorization?: IAuthMeta;
  /**
   * ARC request actions editor UI config.
   */
  actions?: IActionsMeta;
  /**
   * The currently selected editor in the request editor UI.
   */
  selectedEditor?: number;
  /**
   * Optional configuration of the response view
   */
  response?: IResponseUiMeta;

  static fromLegacy(old: LegacyRequestUiMeta): RequestUiMeta {
    const { actions, authorization, body, headers, response, selectedEditor, url } = old;
    const init: IRequestUiMeta = {
      actions,
      authorization,
      body,
      response,
      selectedEditor,
    };
    if (url) {
      const initUrl: IUrlMeta = {};
      if (url.delimiter) {
        initUrl.delimiter = url.delimiter;
      }
      if (Array.isArray(url.model) && url.model.length) {
        initUrl.model = url.model.map(i => Property.fromApiType(i).toJSON());
      }
      init.url = initUrl;
    }
    if (headers) {
      const headersUrl: IHeadersMeta = {};
      if (typeof headers.source === 'boolean') {
        headersUrl.source = headers.source;
      }
      if (Array.isArray(headers.model) && headers.model.length) {
        headersUrl.model = headers.model.map(i => Property.fromApiType(i).toJSON());
      }
      init.url = headersUrl;
    }
    return new RequestUiMeta(init);
  }

  /**
   * @param input The project item definition used to restore the state.
   */
  constructor(input?: string | IRequestUiMeta) {
    let init: IRequestUiMeta;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {};
    }
    this.new(init);
  }

  /**
   * Creates a new object clearing anything that is so far defined.
   */
  new(init: IRequestUiMeta): void {
    this.body = init.body;
    this.url = init.url;
    this.headers = init.headers;
    this.authorization = init.authorization;
    this.actions = init.actions;
    this.selectedEditor = init.selectedEditor;
    this.response = init.response;
  }

  toJSON(): IRequestUiMeta {
    const result: IRequestUiMeta = {
      kind: Kind,
    };
    if (this.body) {
      result.body = this.body;
    }
    if (this.url) {
      result.url = this.url;
    }
    if (this.headers) {
      result.headers = this.headers;
    }
    if (this.authorization) {
      result.authorization = this.authorization;
    }
    if (this.actions) {
      result.actions = this.actions;
    }
    if (this.response) {
      result.response = this.response;
    }
    if (typeof this.selectedEditor === 'number') {
      result.selectedEditor = this.selectedEditor;
    }
    return result;
  }
}
