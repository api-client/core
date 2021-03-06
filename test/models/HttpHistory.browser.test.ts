import { assert } from '@esm-bundle/chai';
import { HttpHistory, IHttpHistory, createdSymbol, midnightSymbol, Kind as HttpHistoryKind } from '../../src/models/HttpHistory.js';
import { SentRequest, ISentRequest } from '../../src/models/SentRequest.js';
import { RequestLog, Kind as RequestLogKind } from '../../src/models/RequestLog.js';
import { Kind as HttpRequestKind } from '../../src/models/HttpRequest.js';

describe('Models', () => {
  describe('HttpHistory', () => {
    describe('#created', () => {
      it('sets the value', () => {
        const instance = new HttpHistory();
        instance.created = 1234;
        assert.equal(instance.created, 1234);
      });

      it('sets the current time when value is missing', () => {
        const instance = new HttpHistory();
        const now = Date.now();
        instance.created = undefined;
        assert.approximately(instance.created, now, 100);
      });
    });

    describe('#midnight', () => {
      it('sets the value', () => {
        const instance = new HttpHistory();
        instance.midnight = 1234;
        assert.equal(instance.midnight, 1234);
      });

      it('sets the default value when the value is missing', () => {
        const instance = new HttpHistory();
        instance[createdSymbol] = 1641774295483;
        instance.midnight = undefined;
        // assert.equal(instance.midnight, 1641715200000);
        assert.typeOf(instance.midnight, 'number');
      });

      it('reads the default value when not set', () => {
        const instance = new HttpHistory();
        instance[createdSymbol] = 1641774295483;
        instance[midnightSymbol] = undefined;
        // assert.equal(instance.midnight, 1641715200000);
        assert.typeOf(instance.midnight, 'number');
      });
    });

    describe('constructor()', () => {
      it('creates the default values', () => {
        const now = Date.now();
        const instance = new HttpHistory();
        assert.equal(instance.kind, HttpHistoryKind);
        assert.typeOf(instance.created, 'number');
        assert.approximately(instance.created, now, 100);
        const { log } = instance;
        assert.typeOf(log, 'object', 'sets the log');
        assert.equal(instance.user, '');
        assert.isUndefined(instance.space);
        assert.isUndefined(instance.project);
        assert.isUndefined(instance.request);
      });

      it('creates values from the schema', () => {
        const now = Date.now();
        const schema: IHttpHistory = {
          kind: HttpHistoryKind,
          created: now,
          user: 'u1',
          space: 'a1',
          project: 'p1',
          request: 'r1',
          log: {
            kind: RequestLogKind,
            request: {
              kind: HttpRequestKind,
              url: 'https://dot.com',
              headers: 'x-test: true',
              method: 'PUT',
              startTime: 0,
            }
          },
        };
        const instance = new HttpHistory(schema);

        assert.equal(instance.kind, HttpHistoryKind);
        assert.equal(instance.created, now);
        assert.equal(instance.user, 'u1');
        assert.equal(instance.space, 'a1');
        assert.equal(instance.project, 'p1');
        assert.equal(instance.project, 'p1');
        assert.equal(instance.request, 'r1');

        const { log } = instance;
        assert.typeOf(log, 'object', 'sets the log');
        assert.typeOf(log.request, 'object', 'sets the log.request');
        const request = log.request as SentRequest;
        assert.equal(request.method, 'PUT');
        assert.equal(request.url, 'https://dot.com');
      });

      it('creates values from the JSON schema string', () => {
        const now = Date.now();
        const schema: IHttpHistory = {
          kind: HttpHistoryKind,
          created: now,
          user: 'u1',
          space: 'a1',
          project: 'p1',
          request: 'r1',
          log: {
            kind: RequestLogKind,
            request: {
              kind: HttpRequestKind,
              url: 'https://dot.com',
              headers: 'x-test: true',
              method: 'PUT',
              startTime: 0,
            }
          },
        };
        const instance = new HttpHistory(JSON.stringify(schema));

        assert.equal(instance.kind, HttpHistoryKind);
        assert.equal(instance.created, now);
        assert.equal(instance.user, 'u1');
        assert.equal(instance.space, 'a1');
        assert.equal(instance.project, 'p1');
        assert.equal(instance.project, 'p1');
        assert.equal(instance.request, 'r1');

        const { log } = instance;
        assert.typeOf(log, 'object', 'sets the log');
        assert.typeOf(log.request, 'object', 'sets the log.request');
        const request = log.request as SentRequest;
        assert.equal(request.method, 'PUT');
        assert.equal(request.url, 'https://dot.com');
      });
    });

    describe('new()', () => {
      it('sets the passed log', () => {
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        schema.log.request = {
          kind: HttpRequestKind,
          url: 'https://dot.com',
          headers: 'x-test: true',
          method: 'PUT',
          startTime: 0,
        }
        instance.new(schema);

        const { log } = instance;
        assert.typeOf(log, 'object', 'sets the log');
        assert.typeOf(log.request, 'object', 'sets the log.request');
        const request = log.request as SentRequest;
        assert.equal(request.method, 'PUT');
        assert.equal(request.url, 'https://dot.com');
      });

      it('sets the default log', () => {
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        instance.new(schema);

        const { log } = instance;
        assert.typeOf(log, 'object', 'sets the log');
        assert.isUndefined(log.request, 'has no log.request');
      });

      it('sets the passed key', () => {
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        schema.key = 'a';
        instance.new(schema);

        assert.equal(instance.key, 'a');
      });

      it('sets the default key', () => {
        const instance = new HttpHistory();
        instance.key = 'test';
        const schema = instance.toJSON();
        delete schema.key;
        instance.new(schema);

        assert.isUndefined(instance.key);
      });

      it('sets the passed space', () => {
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        schema.space = 'a';
        instance.new(schema);

        assert.equal(instance.space, 'a');
      });

      it('sets the default space', () => {
        const instance = new HttpHistory();
        instance.space = 'test';
        const schema = instance.toJSON();
        delete schema.space;
        instance.new(schema);

        assert.isUndefined(instance.space);
      });

      it('sets the passed app', () => {
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        schema.app = 'a';
        instance.new(schema);

        assert.equal(instance.app, 'a');
      });

      it('sets the default app', () => {
        const instance = new HttpHistory();
        instance.app = 'test';
        const schema = instance.toJSON();
        delete schema.app;
        instance.new(schema);

        assert.isUndefined(instance.app);
      });

      it('sets the passed user', () => {
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        schema.user = 'a';
        instance.new(schema);

        assert.equal(instance.user, 'a');
      });

      it('sets the default user', () => {
        const instance = new HttpHistory();
        instance.user = 'test';
        const schema = instance.toJSON();
        delete schema.user;
        instance.new(schema);

        assert.equal(instance.user, '');
      });

      it('sets the passed project', () => {
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        schema.project = 'a';
        instance.new(schema);

        assert.equal(instance.project, 'a');
      });

      it('sets the default project', () => {
        const instance = new HttpHistory();
        instance.project = 'test';
        const schema = instance.toJSON();
        delete schema.project;
        instance.new(schema);

        assert.isUndefined(instance.project);
      });

      it('sets the passed request', () => {
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        schema.request = 'a';
        instance.new(schema);

        assert.equal(instance.request, 'a');
      });

      it('sets the default request', () => {
        const instance = new HttpHistory();
        instance.request = 'test';
        const schema = instance.toJSON();
        delete schema.request;
        instance.new(schema);

        assert.isUndefined(instance.request);
      });

      it('sets the created', () => {
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        schema.created = 1234567;
        instance.new(schema);
        assert.equal(instance.created, 1234567);
      });

      it('sets the created as current time', () => {
        const now = Date.now();
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        delete schema.created;
        instance.new(schema);
        assert.approximately(instance.created, now, 100);
      });

      it('sets the midnight', () => {
        const instance = new HttpHistory();
        const schema = instance.toJSON();
        schema.midnight = 1234567;
        instance.new(schema);
        assert.equal(instance.midnight, 1234567);
      });
    });

    describe('toJSON()', () => {
      it('sets the log', () => {
        const instance = new HttpHistory();
        instance.log = RequestLog.fromRequest({
          kind: HttpRequestKind,
          url: 'https://dot.com',
          headers: 'x-test: true',
          method: 'PUT',
          startTime: 0,
        });
        
        const result = instance.toJSON();
        const data = result.log.request as ISentRequest;

        assert.equal(data.url, 'https://dot.com');
        assert.equal(data.method, 'PUT');
        assert.equal(data.headers, 'x-test: true');
      });

      it('sets the kind', () => {
        const instance = new HttpHistory();
        const result = instance.toJSON();

        assert.equal(result.kind, HttpHistoryKind);
      });

      it('sets the created and midnight', () => {
        const now = Date.now();
        const instance = new HttpHistory();
        instance.created = now;
        instance.midnight = 1234;

        const result = instance.toJSON();

        assert.equal(result.created, now);
        assert.equal(result.midnight, 1234);
      });

      it('sets the key', () => {
        const instance = new HttpHistory();
        instance.key = 'test';
        const result = instance.toJSON();
        assert.equal(result.key, 'test');
      });

      it('does not set the key when missing', () => {
        const instance = new HttpHistory();
        const result = instance.toJSON();
        assert.isUndefined(result.key);
      });
      
      it('sets the space', () => {
        const instance = new HttpHistory();
        instance.space = 'test';
        const result = instance.toJSON();
        assert.equal(result.space, 'test');
      });

      it('does not set the space when missing', () => {
        const instance = new HttpHistory();
        const result = instance.toJSON();
        assert.isUndefined(result.space);
      });

      it('sets the app', () => {
        const instance = new HttpHistory();
        instance.app = 'test';
        const result = instance.toJSON();
        assert.equal(result.app, 'test');
      });

      it('does not set the app when missing', () => {
        const instance = new HttpHistory();
        const result = instance.toJSON();
        assert.isUndefined(result.app);
      });

      it('sets the project', () => {
        const instance = new HttpHistory();
        instance.project = 'test';
        const result = instance.toJSON();
        assert.equal(result.project, 'test');
      });

      it('does not set the project when missing', () => {
        const instance = new HttpHistory();
        const result = instance.toJSON();
        assert.isUndefined(result.project);
      });

      it('sets the user', () => {
        const instance = new HttpHistory();
        instance.user = 'test';
        const result = instance.toJSON();
        assert.equal(result.user, 'test');
      });

      it('sets the default user when missing', () => {
        const instance = new HttpHistory();
        const result = instance.toJSON();
        assert.equal(result.user, '');
      });

      it('sets the request', () => {
        const instance = new HttpHistory();
        instance.request = 'test';
        const result = instance.toJSON();
        assert.equal(result.request, 'test');
      });

      it('does not set the request when missing', () => {
        const instance = new HttpHistory();
        const result = instance.toJSON();
        assert.isUndefined(result.request);
      });
    });
  });
});
