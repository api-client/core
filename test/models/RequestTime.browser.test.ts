import { assert } from '@esm-bundle/chai';
import { RequestTime, IRequestTime, Kind as RequestTimeKind } from '../../src/models/RequestTime.js';

describe('Models', () => {
  describe('RequestTime', () => {
    describe('constructor()', () => {
      let schema: IRequestTime;
      beforeEach(() => {
        schema = {
          blocked: 1,
          connect: 2,
          dns: 3,
          receive: 4,
          send: 5,
          wait: 6,
          ssl: 7,
        }
      });

      it('creates default values', () => {
        const result = new RequestTime();
        assert.equal(result.kind, RequestTimeKind);
        assert.equal(result.connect, -1);
        assert.equal(result.receive, -1);
        assert.equal(result.send, -1);
        assert.equal(result.wait, -1);
        assert.equal(result.blocked, -1);
        assert.equal(result.dns, -1);
        assert.equal(result.ssl, -1);
      });

      it('creates the values from the schema', () => {
        const result = new RequestTime(schema);
        assert.equal(result.kind, RequestTimeKind);
        assert.equal(result.connect, schema.connect);
        assert.equal(result.receive, schema.receive);
        assert.equal(result.send, schema.send);
        assert.equal(result.wait, schema.wait);
        assert.equal(result.blocked, schema.blocked);
        assert.equal(result.dns, schema.dns);
        assert.equal(result.ssl, schema.ssl);
      });

      it('creates the values from the JSON schema string', () => {
        const result = new RequestTime(JSON.stringify(schema));
        assert.equal(result.kind, RequestTimeKind);
        assert.equal(result.connect, schema.connect);
        assert.equal(result.receive, schema.receive);
        assert.equal(result.send, schema.send);
        assert.equal(result.wait, schema.wait);
        assert.equal(result.blocked, schema.blocked);
        assert.equal(result.dns, schema.dns);
        assert.equal(result.ssl, schema.ssl);
      });
    });

    describe('toJSON()', () => {
      let schema: IRequestTime;
      let instance: RequestTime;
      beforeEach(() => {
        schema = {
          blocked: 1,
          connect: 2,
          dns: 3,
          receive: 4,
          send: 5,
          wait: 6,
          ssl: 7,
        };
        instance = new RequestTime(schema);
      });

      it('serializes the kind', () => {
        const result = instance.toJSON();
        assert.equal(result.kind, RequestTimeKind);
      });

      it('serializes the blocked', () => {
        const result = instance.toJSON();
        assert.equal(result.blocked, schema.blocked);
      });

      it('serializes the connect', () => {
        const result = instance.toJSON();
        assert.equal(result.connect, schema.connect);
      });

      it('serializes the dns', () => {
        const result = instance.toJSON();
        assert.equal(result.dns, schema.dns);
      });

      it('serializes the receive', () => {
        const result = instance.toJSON();
        assert.equal(result.receive, schema.receive);
      });

      it('serializes the send', () => {
        const result = instance.toJSON();
        assert.equal(result.send, schema.send);
      });

      it('serializes the wait', () => {
        const result = instance.toJSON();
        assert.equal(result.wait, schema.wait);
      });

      it('serializes the ssl', () => {
        const result = instance.toJSON();
        assert.equal(result.ssl, schema.ssl);
      });

      it('does not serialize the ssl when missing', () => {
        delete instance.ssl;
        const result = instance.toJSON();
        assert.isUndefined(result.ssl);
      });
    });

    describe('total()', () => {
      let schema: IRequestTime;
      let instance: RequestTime;
      beforeEach(() => {
        schema = {
          blocked: 1,
          connect: 2,
          dns: 3,
          receive: 4,
          send: 5,
          wait: 6,
          ssl: 7,
        };
        instance = new RequestTime(schema);
      });

      it('returns the sum of all values', () => {
        const result = instance.total();
        assert.equal(result, 28);
      });

      it('ignores the blocked', () => {
        instance.blocked = -1;
        const result = instance.total();
        assert.equal(result, 27);
      });

      it('ignores the connect', () => {
        instance.connect = -1;
        const result = instance.total();
        assert.equal(result, 26);
      });

      it('ignores the dns', () => {
        instance.dns = -1;
        const result = instance.total();
        assert.equal(result, 25);
      });

      it('ignores the receive', () => {
        instance.receive = -1;
        const result = instance.total();
        assert.equal(result, 24);
      });

      it('ignores the send', () => {
        instance.send = -1;
        const result = instance.total();
        assert.equal(result, 23);
      });

      it('ignores the wait', () => {
        instance.wait = -1;
        const result = instance.total();
        assert.equal(result, 22);
      });

      it('ignores the ssl', () => {
        instance.ssl = -1;
        const result = instance.total();
        assert.equal(result, 21);
      });
    });
  });
});
