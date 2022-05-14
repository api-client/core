// @ts-ignore
import { AmfModelExpander } from 'amf-json-ld-lib';
import { AmfMixin } from '../../src/amf/AmfMixin.js';
import { AmfSerializer } from '../../src/amf/AmfSerializer.js';
import { AmfNamespace as ns } from '../../src/amf/definitions/Namespace.js';
import { AmfDocument, CreativeWork, EndPoint, Operation, Parameter, Payload, Request, Response, SecurityRequirement, SecurityScheme, Server, Shape, WebApi } from '../../src/amf/definitions/Amf.js';
import { ApiDocumentation, ApiEndPoint, ApiOperation, ApiParameter, ApiPayload, ApiRequest, ApiResponse, ApiSecurityScheme, ApiServer } from '../../src/amf/definitions/Api.js';
import { IShapeUnion } from '../../src/amf/definitions/Shapes.js';

export interface EndpointOperation {
  endpoint: EndPoint;
  operation: Operation;
}

export interface GraphLoadOptions {
  noExpand?: boolean;
}

export class AmfLoader extends AmfMixin(Object) {
  /**
   * Reads AMF graph model as string
   */
  async getGraph(fileName: string = 'demo-api', opts: GraphLoadOptions={}): Promise<AmfDocument> {
    const file = `${fileName}.json`;
    const url = `${window.location.protocol}//${window.location.host}/data/models/${file}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Unable to download API data model');
    }
    let result = await  response.json();
    if (Array.isArray(result)) {
      [result] = result;
    }
    if (opts.noExpand) {
      return result;
    }
    let amf = this.getExpandedModel(result);
    if (Array.isArray(amf)) {
      [amf] = amf;
    }
    return amf;
  }

  getExpandedModel(model: any): AmfDocument {
    let amf = model;
    if (!AmfModelExpander.isInExpandedForm(amf)) {
      amf = this._expand(amf);
    }
    return amf;
  }

  lookupEndpoint(model: AmfDocument, path: string): EndPoint {
    const amf = this.getExpandedModel(model);
    this.amf = amf;
    const webApi = this._computeApi(amf);
    if (!webApi) {
      throw new Error('This AMF model does not contain API definition.');
    }
    const endpoints = webApi[this._getAmfKey(ns.aml.vocabularies.apiContract.endpoint)];
    if (!Array.isArray(endpoints) || !endpoints.length) {
      throw new Error('This API does not contain endpoints.');
    }
    const pathKey = ns.aml.vocabularies.apiContract.path;
    const ep = endpoints.find(i => this._getValue(i, pathKey) === path);
    if (!ep) {
      throw new Error(`An endpoint with path ${path} does not exist in this API.`);
    }
    return ep;
  }

  getEndpoint(model: AmfDocument, path: string): ApiEndPoint {
    const amf = this.getExpandedModel(model);
    const op = this.lookupEndpoint(amf, path);
    if (!op) {
      throw new Error(`Unknown endpoint for path ${path}`);
    }
    const serializer = new AmfSerializer(amf);
    return serializer.endPoint(op);
  }

  lookupOperation(model: AmfDocument, endpoint: string, operation: string): Operation {
    const amf = this.getExpandedModel(model);
    const endPoint = this.lookupEndpoint(amf, endpoint);
    const opKey = this._getAmfKey(ns.aml.vocabularies.apiContract.supportedOperation);
    const ops = this._ensureArray(endPoint[opKey]) as Operation[];
    return ops.find((item) => this._getValue(item, ns.aml.vocabularies.apiContract.method) === operation);
  }

  getOperation(model: AmfDocument, endpoint: string, operation: string): ApiOperation {
    const amf = this.getExpandedModel(model);
    const op = this.lookupOperation(amf, endpoint, operation);
    if (!op) {
      throw new Error(`Unknown operation for path ${endpoint} and method ${operation}`);
    }
    const serializer = new AmfSerializer(amf);
    return serializer.operation(op);
  }

  lookupEndpointOperation(model: AmfDocument, path: string, operation: string): EndpointOperation {
    const endpoint = this.lookupEndpoint(model, path);
    const opKey = this._getAmfKey(ns.aml.vocabularies.apiContract.supportedOperation);
    const ops = this._ensureArray(endpoint[opKey]) as Operation[];
    const op = ops.find((item) => this._getValue(item, ns.aml.vocabularies.apiContract.method) === operation);
    return {
      endpoint, 
      operation: op,
    };
  }

  lookupExpects(model: AmfDocument, path: string, operation: string): Request {
    const op = this.lookupOperation(model, path, operation);
    if (!op) {
      throw new Error(`Unknown operation for path ${path} and method ${operation}`);
    }
    let expects = op[this._getAmfKey(ns.aml.vocabularies.apiContract.expects)];
    if (!expects) {
      throw new Error(`Operation has no "expects" value.`);
    }
    if (Array.isArray(expects)) {
      [expects] = expects;
    }
    return expects;
  }

  lookupPayloads(model: AmfDocument, endpoint: string, operation: string): Payload[] {
    const expects = this.lookupExpects(model, endpoint, operation);
    let payloads = expects[this._getAmfKey(ns.aml.vocabularies.apiContract.payload)] as Payload[];
    if (payloads && !Array.isArray(payloads)) {
      payloads = [payloads];
    }
    return payloads;
  }

  getPayloads(model: AmfDocument, endpoint: string, operation: string): ApiPayload[] {
    const amf = this.getExpandedModel(model);

    const payloads = this.lookupPayloads(amf, endpoint, operation);
    if (!payloads) {
      throw new Error(`No payloads for path ${endpoint} and operation ${operation}`);
    }
    const serializer = new AmfSerializer(amf);
    return payloads.map(i => serializer.payload(i));
  }

  lookupSecurity(model: AmfDocument, name: string): SecurityScheme {
    const amf = this.getExpandedModel(model);

    this.amf = amf;
    const declares = this._computeDeclares(amf) || [];
    let security = declares.find((item) => {
      if (Array.isArray(item)) {
        [item] = item;
      }
      if (this._getValue(item, ns.aml.vocabularies.core.displayName) === name) {
        return true;
      }
      if (this._getValue(item, ns.aml.vocabularies.core.name) === name) {
        return true;
      }
      return this._getValue(item, ns.aml.vocabularies.security.name) === name;
    });
    if (Array.isArray(security)) {
      [security] = security;
    }
    if (!security) {
      const references = this._computeReferences(amf) || [];
      for (let i = 0, len = references.length; i < len; i++) {
        if (!this._hasType(references[i], ns.aml.vocabularies.document.Module)) {
          continue;
        }
        security = this.lookupSecurity(references[i], name);
        if (security) {
          break;
        }
      }
    }
    return security;
  }

  getSecurity(model: AmfDocument, name: string): ApiSecurityScheme {
    const amf = this.getExpandedModel(model);
    const security = this.lookupSecurity(amf, name);
    if (!security) {
      throw new Error(`No security named ${name}`);
    }
    const serializer = new AmfSerializer(amf);
    return serializer.securityScheme(security);
  }

  lookupShape(model: AmfDocument, name: string): Shape {
    const amf = this.getExpandedModel(model);
    this.amf = amf;
    const declares = (this._computeDeclares(amf) || []);
    let shape = declares.find((item) => {
      if (Array.isArray(item)) {
        [item] = item;
      }
      return this._getValue(item, ns.w3.shacl.name) === name;
    });
    if (Array.isArray(shape)) {
      [shape] = shape;
    }
    if (!shape) {
      const references = this._computeReferences(amf) || [];
      for (let i = 0, len = references.length; i < len; i++) {
        if (!this._hasType(references[i], ns.aml.vocabularies.document.Module)) {
          continue;
        }
        shape = this.lookupShape(references[i], name);
        if (shape) {
          break;
        }
      }
    }
    return shape;
  }

  getShape(model: AmfDocument, name: string): IShapeUnion {
    const amf = this.getExpandedModel(model);
    const shape = this.lookupShape(amf, name);
    if (!shape) {
      throw new Error(`No API shape named ${name}`);
    }
    const serializer = new AmfSerializer(amf);
    return serializer.unknownShape(shape);
  }

  lookupDocumentation(model: AmfDocument, name: string): CreativeWork {
    const amf = this.getExpandedModel(model);
    this.amf = amf;
    const webApi = this._computeApi(amf);
    const key = this._getAmfKey(ns.aml.vocabularies.core.documentation);
    const docs = this._ensureArray(webApi[key]) as CreativeWork[];
    return docs.find((item) => {
      if (Array.isArray(item)) {
        [item] = item;
      }
      return this._getValue(item, ns.aml.vocabularies.core.title) === name;
    });
  }

  getDocumentation(model: AmfDocument, name: string): ApiDocumentation {
    const amf = this.getExpandedModel(model);
    const shape = this.lookupDocumentation(amf, name);
    if (!shape) {
      throw new Error(`No documentation named ${name}`);
    }
    const serializer = new AmfSerializer(amf);
    return serializer.documentation(shape);
  }

  lookupEncodes(model: AmfDocument): WebApi {
    const amf = this.getExpandedModel(model);
    this.amf = amf;
    const key = this._getAmfKey(ns.aml.vocabularies.document.encodes);
    let result = amf[key];
    if (Array.isArray(result)) {
      [result] = result;
    }
    return result;
  }

  lookupResponses(model: AmfDocument, endpoint: string, operation: string): Response[] {
    const method = this.lookupOperation(model, endpoint, operation);
    return method[this._getAmfKey(ns.aml.vocabularies.apiContract.returns)];
  }

  getResponses(model: AmfDocument, endpoint: string, operation: string): ApiResponse[] {
    const amf = this.getExpandedModel(model);    
    const responses = this.lookupResponses(amf, endpoint, operation);
    const serializer = new AmfSerializer(amf);
    return responses.map(i => serializer.response(i));
  }

  lookupResponse(model: AmfDocument, path: string, operation: string, code: string): Response {
    const responses = this.lookupResponses(model, path, operation);
    if (!Array.isArray(responses) || !responses.length) {
      throw new Error(`No responses for path ${path} and operation ${operation}`);
    }
    const response = responses.find((item) => {
      if (this._getValue(item, ns.aml.vocabularies.apiContract.statusCode) === String(code)) {
        return true;
      }
      return false;
    });
    if (!response) {
      throw new Error(`No responses the status code ${code}`);
    }
    return response;
  }

  /**
   * @param code The response's status code
   */
  getResponse(model: AmfDocument, endpoint: string, operation: string, code: string): ApiResponse {
    const amf = this.getExpandedModel(model);
    const response = this.lookupResponse(amf, endpoint, operation, code);
    const serializer = new AmfSerializer(amf);
    return serializer.response(response);
  }

  lookupRequest(model: AmfDocument, endpoint: string, operation: string): Request {
    const method = this.lookupOperation(model, endpoint, operation);
    let requests = method[this._getAmfKey(ns.aml.vocabularies.apiContract.expects)];
    if (Array.isArray(requests)) {
      [requests] = requests;
    }
    if (!requests) {
      throw new Error(`No request found in operation ${operation} and path ${endpoint}`);
    }
    return requests;
  }

  getRequest(model: AmfDocument, endpoint: string, operation: string): ApiRequest {
    const amf = this.getExpandedModel(model);
    const request = this.lookupRequest(amf, endpoint, operation);
    if (!request) {
      throw new Error(`No request found in operation ${operation} and path ${endpoint}`);
    }
    const serializer = new AmfSerializer(amf);
    return serializer.request(request);
  }

  /**
   * @param path The endpoint path
   * @param operation The operation path
   * @param code The response's status code
   */
  lookupResponsePayloads(model: AmfDocument, path: string, operation: string, code: string): Payload[] {
    const response = this.lookupResponse(model, path, operation, code);
    const pKey = this._getAmfKey(ns.aml.vocabularies.apiContract.payload);
    const payloads = response[pKey];
    return this._ensureArray(payloads) as Payload[];
  }

  /**
   * @param path The endpoint path
   * @param operation The operation path
   * @param code The response's status code
   */
  getResponsePayloads(model: AmfDocument, path: string, operation: string, code: string): ApiPayload[] {
    const amf = this.getExpandedModel(model);
    const payloads = this.lookupResponsePayloads(amf, path, operation, code);
    const serializer = new AmfSerializer(amf);
    return payloads.map(p => serializer.payload(p));
  }

  lookupServers(model: AmfDocument): Server[] {
    const amf = this.getExpandedModel(model);
    this.amf = amf;
    const webApi = this._computeApi(amf);
    const key = this._getAmfKey(ns.aml.vocabularies.apiContract.server);
    let result = webApi[key];
    if (result && !Array.isArray(result)) {
      result = [result];
    }
    return result;
  }

  getServers(model: AmfDocument): ApiServer[] {
    const amf = this.getExpandedModel(model);
    const servers = this.lookupServers(amf);
    if (servers) {
      const serializer = new AmfSerializer(amf);
      return servers.map(s => serializer.server(s));
    }
    return undefined;
  }

  lookupReturns(model: AmfDocument, path: string, operation: string): Response[] {
    const op = this.lookupOperation(model, path, operation);
    if (!op) {
      throw new Error(`Unknown operation for path ${path} and method ${operation}`);
    }
    let returns = op[this._getAmfKey(ns.aml.vocabularies.apiContract.returns)];
    if (!returns) {
      throw new Error(`Operation has no "returns" value.`);
    }
    if (!Array.isArray(returns)) {
      returns = [returns];
    }
    return returns;
  }

  /**
   * Lookups a shape object from the declares array
   */
  lookupDeclaredShape(model: AmfDocument, name: string): Shape {
    this.amf = model;
    const items = this._computeDeclares(model);
    return items.find((item) => {
      const typed = item as Shape;
      const objectName = this._getValue(typed, ns.w3.shacl.name);
      return objectName === name;
    });
  }

  lookupOperationSecurity(model: AmfDocument, path: string, operation: string): SecurityRequirement[] {
    const op = this.lookupOperation(model, path, operation);
    if (!op) {
      throw new Error(`Unknown operation for path ${path} and method ${operation}`);
    }
    let security = op[this._getAmfKey(ns.aml.vocabularies.security.security)];
    if (!security) {
      throw new Error(`Operation has no "security" value.`);
    }
    if (!Array.isArray(security)) {
      security = [security];
    }
    return security;
  }

  lookupRequestPayloads(model: AmfDocument, path: string, operation: string): Payload[] {
    const request = this.lookupExpects(model, path, operation);
    const payload = request[this._getAmfKey(ns.aml.vocabularies.apiContract.payload)];
    if (!payload || !payload.length) {
      throw new Error(`Operation ${operation} of endpoint ${payload} has no request payload.`);
    }
    return payload;
  }

  lookupRequestPayload(model: AmfDocument, path: string, operation: string, mime: string): Payload {
    const payloads = this.lookupRequestPayloads(model, path, operation);
    const payload = payloads.find(i => this._getValue(i, ns.aml.vocabularies.core.mediaType) === mime);
    if (!payload) {
      throw new Error(`Operation ${operation} of endpoint ${payload} has no request payload for ${mime}.`);
    }
    return payload;
  }

  /**
   * Reads a request parameter from an operation for: URI, query params, headers, and cookies.
   * 
   * @param endpoint The endpoint path
   * @param operation The operation path
   * @param param The param name
   */
  getParameter(model: AmfDocument, endpoint: string, operation: string, param: string): ApiParameter {
    const amf = this.getExpandedModel(model);
    const expects = this.lookupExpects(amf, endpoint, operation);
    if (!expects) {
      throw new Error(`The operation ${operation} of endpoint ${endpoint} has no request.`);
    }
    const serializer = new AmfSerializer(amf);
    const request = serializer.request(expects);
    if (!request) {
      throw new Error(`The operation ${operation} of endpoint ${endpoint} has no request.`);
    }
    let pool: ApiParameter[] = [];
    if (Array.isArray(request.uriParameters)) {
      pool = pool.concat(request.uriParameters);
    }
    if (Array.isArray(request.cookieParameters)) {
      pool = pool.concat(request.cookieParameters);
    }
    if (Array.isArray(request.queryParameters)) {
      pool = pool.concat(request.queryParameters);
    }
    if (Array.isArray(request.headers)) {
      pool = pool.concat(request.headers);
    }
    const result = pool.find(i => i.name === param);
    if (!result) {
      throw new Error(`Parameter ${param} not found.`);
    }
    return result;
  }

  readHeaders(source: Request|Response): Parameter[]|undefined {
    const key = this._getAmfKey(ns.aml.vocabularies.apiContract.header);
    let values = source[key];
    if (values && !Array.isArray(values)) {
      values = [values];
    }
    return values;
  }

  /**
   * Computes a list of query parameters
   */
  readQueryParameters(source: Request): Parameter[]|undefined {
    const key = this._getAmfKey(ns.aml.vocabularies.apiContract.parameter);
    let values = source[key];
    if (values && !Array.isArray(values)) {
      values = [values];
    }
    return values;
  }
}
