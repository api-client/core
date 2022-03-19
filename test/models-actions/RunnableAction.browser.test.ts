import { assert } from '@esm-bundle/chai';
import { RunnableAction, IRunnableAction, Kind as RunnableActionKind } from '../../src/models/actions/RunnableAction.js';
import { Condition, Kind as ConditionKind } from '../../src/models/actions/Condition.js';
import { Action, IAction, Kind as ActionKind } from '../../src/models/actions/Action.js';

describe('Models', () => {
  describe('RunnableAction', () => {
    describe('RunnableAction.fromLegacy()', () => {
      it('creates the action with the values', () => {
        const instance = RunnableAction.fromLegacy({
          actions: [
            {
              priority: 0,
              type: 'request',
            }
          ],
          condition: {
            source: 'value',
          },
          enabled: true,
          type: 'request',
        });
        // @ts-ignore
        assert.isUndefined(instance.type, 'the type is ignored');
        assert.isTrue(instance.enabled, 'sets the enabled');
        // this is tested in details with the Condition class.
        assert.typeOf(instance.condition, 'object', 'sets the condition');
        assert.equal(instance.condition.kind, ConditionKind, 'sets the condition instance');
        // this is tested in details with the Action class.
        assert.typeOf(instance.actions, 'array', 'sets the actions');
        assert.lengthOf(instance.actions, 1, 'has the action');
        assert.equal(instance.actions[0].kind, ActionKind, 'has the action instance');
      });

      it('sets empty actions when missing', () => {
        const instance = RunnableAction.fromLegacy({
          actions: undefined,
          condition: {
            source: 'value',
          },
          enabled: true,
          type: 'request',
        });
        assert.typeOf(instance.actions, 'array', 'sets the actions');
        assert.lengthOf(instance.actions, 0, 'has no actions');
      });

      it('sets default condition when missing', () => {
        const instance = RunnableAction.fromLegacy({
          actions: [],
          condition: undefined,
          enabled: true,
          type: 'request',
        });
        assert.typeOf(instance.condition, 'object');
      });
    });

    describe('constructor()', () => {
      it('creates default values', () => {
        const result = new RunnableAction();
        assert.equal(result.kind, RunnableActionKind, 'sets the kind');
        assert.deepEqual(result.actions, [], 'sets the empty actions');
        assert.isTrue(result.enabled, 'is enabled by default');
        assert.typeOf(result.condition, 'object', 'sets the default condition');
      });

      it('creates an instance from the schema', () => {
        const schema: IRunnableAction = {
          actions: [],
          condition: {
            kind: ConditionKind,
            source: 'value',
          },
          kind: RunnableActionKind,
        };
        const result = new RunnableAction(schema);
        assert.equal(result.kind, RunnableActionKind, 'sets the kind');
        assert.deepEqual(result.actions, [], 'sets the actions');
        assert.isUndefined(result.enabled, 'respects missing "enabled"');
        assert.typeOf(result.condition, 'object', 'sets the condition');
        assert.equal(result.condition.source, 'value', 'sets the condition.value');
      });

      it('creates an instance from the JSON schema string', () => {
        const schema: IRunnableAction = {
          actions: [],
          condition: {
            kind: ConditionKind,
            source: 'value',
          },
          kind: RunnableActionKind,
        };
        const result = new RunnableAction(JSON.stringify(schema));
        assert.equal(result.kind, RunnableActionKind, 'sets the kind');
        assert.deepEqual(result.actions, [], 'sets the actions');
        assert.isUndefined(result.enabled, 'respects missing "enabled"');
        assert.typeOf(result.condition, 'object', 'sets the condition');
        assert.equal(result.condition.source, 'value', 'sets the condition.value');
      });

      it('accepts the legacy schema', () => {
        const legacy = {
          actions: [
            {
              priority: 0,
              type: 'request',
            }
          ],
          condition: {
            source: 'value',
          },
          enabled: true,
          type: 'request',
        };
        const result = new RunnableAction(legacy as unknown as IRunnableAction);
        assert.equal(result.kind, RunnableActionKind, 'sets the kind');
        assert.lengthOf(result.actions, 1, 'sets the actions');
        assert.isTrue(result.enabled, 'has the "enabled"');
        assert.typeOf(result.condition, 'object', 'sets the condition');
        assert.equal(result.condition.source, 'value', 'sets the condition.value');
      });
    });

    describe('new()', () => {
      let runnable: RunnableAction;
      beforeEach(() => {
        runnable = new RunnableAction();
      });

      it('creates a default condition', () => {
        const schema: IRunnableAction = {
          actions: [],
          condition: {
            kind: ConditionKind,
            source: 'value',
          },
          kind: RunnableActionKind,
        };
        delete schema.condition;
        runnable.new(schema);
        assert.typeOf(runnable.condition, 'object');
      });

      it('creates an empty actions array', () => {
        const schema: IRunnableAction = {
          actions: [],
          condition: {
            kind: ConditionKind,
            source: 'value',
          },
          kind: RunnableActionKind,
        };
        delete schema.actions;
        runnable.new(schema);
        assert.typeOf(runnable.actions, 'array');
        assert.lengthOf(runnable.actions, 0);
      });
    });

    describe('toJSON()', () => {
      it('serializes the kind', () => {
        const inst = new RunnableAction();
        const result = inst.toJSON();
        assert.equal(result.kind, RunnableActionKind);
      });

      it('serializes the condition', () => {
        const inst = new RunnableAction();
        const condition = new Condition();
        condition.source = 'value';
        condition.value = 'test';
        inst.condition = condition;
        const result = inst.toJSON();
        assert.deepEqual(result.condition, condition.toJSON());
      });

      it('serializes actions', () => {
        const action = new Action();
        action.name = 'an action';
        const inst = new RunnableAction();
        inst.addAction(action);
        const result = inst.toJSON();
        assert.deepEqual(result.actions, [action.toJSON()]);
      });

      it('serializes the enabled', () => {
        const inst = new RunnableAction();
        inst.enabled = false;
        const result = inst.toJSON();
        assert.isFalse(result.enabled);
      });

      it('does not serialize the enabled when missing', () => {
        const inst = new RunnableAction();
        inst.enabled = undefined;
        const result = inst.toJSON();
        assert.isUndefined(result.enabled);
      });
    });

    describe('addAction()', () => {
      let runnable: RunnableAction;
      beforeEach(() => {
        runnable = new RunnableAction();
      });
      
      it('adds an action by the schema', () => {
        const schema: IAction = {
          enabled: true,
          kind: ActionKind,
          name: 'test',
          priority: 1,
        };
        const result = runnable.addAction(schema);
        assert.deepEqual(result.toJSON(), schema);
        assert.deepEqual(runnable.actions[0].toJSON(), schema);
      });

      it('adds an action by the instance', () => {
        const schema: IAction = {
          enabled: true,
          kind: ActionKind,
          name: 'test',
          priority: 1,
        };
        const inst = new Action(schema);
        const result = runnable.addAction(inst);
        assert.deepEqual(result, inst);
        assert.deepEqual(runnable.actions[0], inst);
      });
    });
  });
});
    