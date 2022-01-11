import { assert } from '@esm-bundle/chai';
import { Condition, ICondition, Kind as ConditionKind } from '../../src/models/actions/Condition.js';
import { ActionTypeEnum, RequestDataSourceEnum, OperatorEnum } from '../../src/models/actions/Enums.js';

describe('Models', () => {
  describe('Condition', () => {
    describe('Condition.defaultCondition()', () => {
      it('sets the kind', () => {
        const result = Condition.defaultCondition();
        assert.equal(result.kind, ConditionKind);
      });

      it('sets the default type', () => {
        const result = Condition.defaultCondition();
        assert.equal(result.type, ActionTypeEnum.response);
      });

      it('sets the passed type', () => {
        const result = Condition.defaultCondition(ActionTypeEnum.request);
        assert.equal(result.type, ActionTypeEnum.request);
      });

      it('sets the default source', () => {
        const result = Condition.defaultCondition();
        assert.equal(result.source, RequestDataSourceEnum.url);
      });

      it('sets the default operator', () => {
        const result = Condition.defaultCondition();
        assert.equal(result.operator, OperatorEnum.equal);
      });

      it('sets the default path', () => {
        const result = Condition.defaultCondition();
        assert.equal(result.path, '');
      });

      it('sets the default alwaysPass', () => {
        const result = Condition.defaultCondition();
        assert.isFalse(result.alwaysPass);
      });
    });

    describe('Condition.fromLegacy()', () => {
      it('sets the kind', () => {
        const result = Condition.fromLegacy({
          source: 'value',
        });
        assert.equal(result.kind, ConditionKind);
      });

      it('sets the source', () => {
        const result = Condition.fromLegacy({
          source: 'body',
        });
        assert.equal(result.source, 'body');
      });

      it('sets the alwaysPass', () => {
        const result = Condition.fromLegacy({
          source: 'body',
          alwaysPass: false,
        });
        assert.equal(result.alwaysPass, false);
      });

      it('sets the path', () => {
        const result = Condition.fromLegacy({
          source: 'body',
          path: 'a.b.c',
        });
        assert.equal(result.path, 'a.b.c');
      });

      it('sets the value from the "predictedValue"', () => {
        const result = Condition.fromLegacy({
          source: 'body',
          path: 'a.b.c',
          predictedValue: 'a value',
        });
        assert.equal(result.value, 'a value');
      });

      it('sets the value from the "value"', () => {
        const result = Condition.fromLegacy({
          source: 'body',
          path: 'value',
          value: 'a value',
        });
        assert.equal(result.value, 'a value');
      });

      [
        ['contains', OperatorEnum.contains],
        ['equal', OperatorEnum.equal],
        ['greater-than', OperatorEnum.greaterThan],
        ['greater-than-equal', OperatorEnum.greaterThanEqual],
        ['less-than', OperatorEnum.lessThan],
        ['less-than-equal', OperatorEnum.lessThanEqual],
        ['not-equal', OperatorEnum.notEqual],
        ['regex', OperatorEnum.regex],
      ].forEach(([srcOperator, targetOperator]) => {
        it(`sets the operator for legacy ${srcOperator}`, () => {
          const result = Condition.fromLegacy({
            source: 'body',
            operator: srcOperator as OperatorEnum,
          });
          assert.equal(result.operator, targetOperator);
        });
      });
      
      [
        ['request', ActionTypeEnum.request],
        ['response', ActionTypeEnum.response],
      ].forEach(([srcType, targetType]) => {
        it(`sets the type for legacy ${srcType}`, () => {
          const result = Condition.fromLegacy({
            source: 'body',
            type: srcType as ActionTypeEnum,
          });
          assert.equal(result.type, targetType);
        });
      });
    });

    describe('constructor()', () => {
      it('creates an empty condition', () => {
        const result = new Condition();
        assert.equal(result.kind, ConditionKind);
        assert.equal(result.source, RequestDataSourceEnum.url);
      });

      it('creates an instance from schema values', () => {
        const schema: ICondition = {
          kind: ConditionKind,
          source: RequestDataSourceEnum.headers,
          operator: OperatorEnum.lessThan,
          value: '10',
          path: 'a/b/c',
          alwaysPass: false,
          type: ActionTypeEnum.request,
        };
        const result = new Condition(schema);
        assert.equal(result.kind, ConditionKind);
        assert.equal(result.source, RequestDataSourceEnum.headers);
        assert.equal(result.operator, OperatorEnum.lessThan);
        assert.equal(result.value, '10');
        assert.equal(result.path, 'a/b/c');
        assert.equal(result.type, ActionTypeEnum.request);
        assert.isFalse(result.alwaysPass);
      });

      it('creates an instance from JSON schema string', () => {
        const schema: ICondition = {
          kind: ConditionKind,
          source: RequestDataSourceEnum.headers,
          operator: OperatorEnum.lessThan,
          value: '10',
          path: 'a/b/c',
          alwaysPass: false,
          type: ActionTypeEnum.request,
        };
        const result = new Condition(JSON.stringify(schema));
        assert.equal(result.kind, ConditionKind);
        assert.equal(result.source, RequestDataSourceEnum.headers);
        assert.equal(result.operator, OperatorEnum.lessThan);
        assert.equal(result.value, '10');
        assert.equal(result.path, 'a/b/c');
        assert.equal(result.type, ActionTypeEnum.request);
        assert.isFalse(result.alwaysPass);
      });
    });

    describe('new()', () => {
      let condition: Condition;
      let schema: ICondition;
      beforeEach(() => {
        schema = {
          kind: ConditionKind,
          source: RequestDataSourceEnum.headers,
          operator: OperatorEnum.lessThan,
          value: '10',
          path: 'a/b/c',
          alwaysPass: false,
          type: ActionTypeEnum.request,
        };
        condition = new Condition(schema);
      });

      it('overrides the source', () => {
        schema.source = RequestDataSourceEnum.method;
        condition.new(schema);
        assert.equal(condition.source, RequestDataSourceEnum.method);
      });

      it('overrides the alwaysPass', () => {
        schema.alwaysPass = true;
        condition.new(schema);
        assert.isTrue(condition.alwaysPass);
      });

      it('clears the alwaysPass', () => {
        delete schema.alwaysPass;
        condition.new(schema);
        assert.isUndefined(condition.alwaysPass);
      });

      it('overrides the operator', () => {
        schema.operator = OperatorEnum.notEqual;
        condition.new(schema);
        assert.equal(condition.operator, OperatorEnum.notEqual);
      });

      it('clears the operator', () => {
        delete schema.operator;
        condition.new(schema);
        assert.isUndefined(condition.operator);
      });

      it('overrides the path', () => {
        schema.path = 'test';
        condition.new(schema);
        assert.equal(condition.path, 'test');
      });

      it('clears the path', () => {
        delete schema.path;
        condition.new(schema);
        assert.isUndefined(condition.path);
      });

      it('overrides the type', () => {
        schema.type = ActionTypeEnum.response;
        condition.new(schema);
        assert.equal(condition.type, ActionTypeEnum.response);
      });

      it('clears the type', () => {
        delete schema.type;
        condition.new(schema);
        assert.isUndefined(condition.type);
      });

      it('overrides the value', () => {
        schema.value = 'updated';
        condition.new(schema);
        assert.equal(condition.value, 'updated');
      });

      it('clears the value', () => {
        delete schema.value;
        condition.new(schema);
        assert.isUndefined(condition.value);
      });
    });

    describe('toJSON()', () => {
      let condition: Condition;
      beforeEach(() => {
        condition = new Condition();
      });

      it('serializes the kind', () => {
        const result = condition.toJSON();
        assert.equal(result.kind, ConditionKind);
      });

      it('serializes the source', () => {
        condition.source = RequestDataSourceEnum.body;
        const result = condition.toJSON();
        assert.equal(result.source, RequestDataSourceEnum.body);
      });

      it('serializes the type', () => {
        condition.type = ActionTypeEnum.request;
        const result = condition.toJSON();
        assert.equal(result.type, ActionTypeEnum.request);
      });

      it('serializes the path', () => {
        condition.path = 'a.b.c';
        const result = condition.toJSON();
        assert.equal(result.path, 'a.b.c');
      });

      it('serializes the path', () => {
        condition.value = 'a.b.c';
        const result = condition.toJSON();
        assert.equal(result.value, 'a.b.c');
      });

      it('serializes the operator', () => {
        condition.operator = OperatorEnum.lessThanEqual;
        const result = condition.toJSON();
        assert.equal(result.operator, OperatorEnum.lessThanEqual);
      });

      it('serializes the alwaysPass', () => {
        condition.alwaysPass = false;
        const result = condition.toJSON();
        assert.isFalse(result.alwaysPass);
      });
    });
  });
});
