import { assert } from '@esm-bundle/chai';
import { Action, IAction, Kind as ActionKind } from '../../src/models/actions/Action.js';
import { ISetCookieAction, SetCookieAction, Kind as SetCookieActionKind } from '../../src/models/actions/runnable/SetCookieAction.js';
import { DeleteCookieAction, Kind as DeleteCookieActionKind } from '../../src/models/actions/runnable/DeleteCookieAction.js';
import { SetVariableAction, Kind as SetVariableActionKind } from '../../src/models/actions/runnable/SetVariableAction.js';
import { SetCookieConfig, SetVariableConfig, DeleteCookieConfig } from '../../src/models/legacy/actions/Actions.js';

describe('Models', () => {
  describe('Action', () => {
    describe('Action.fromLegacy()', () => {
      it('sets the kind', () => {
        const result = Action.fromLegacy({
          priority: 0,
          type: 'request'
        });
        assert.equal(result.kind, ActionKind);
      });

      it('sets the priority', () => {
        const result = Action.fromLegacy({
          priority: 0,
          type: 'request'
        });
        assert.equal(result.priority, 0);
      });

      it('sets the enabled', () => {
        const result = Action.fromLegacy({
          priority: 0,
          type: 'request',
          enabled: false,
        });
        assert.isFalse(result.enabled);
      });

      it('sets the failOnError', () => {
        const result = Action.fromLegacy({
          priority: 0,
          type: 'request',
          failOnError: false,
        });
        assert.isFalse(result.failOnError);
      });

      it('sets the sync', () => {
        const result = Action.fromLegacy({
          priority: 0,
          type: 'request',
          sync: false,
        });
        assert.isFalse(result.sync);
      });

      it('ignores the type', () => {
        const result = Action.fromLegacy({
          priority: 0,
          type: 'request'
        });
        // @ts-ignore
        assert.isUndefined(result.type);
      });

      it('sets the name', () => {
        const result = Action.fromLegacy({
          priority: 0,
          type: 'request',
          name: 'test',
        });
        assert.equal(result.name, 'test');
      });

      it('translates the set-cookie action', () => {
        const result = Action.fromLegacy({
          priority: 0,
          type: 'request',
          name: 'set-cookie',
          config: {
            name: 'test cookie',
            source: { source: 'body' },
            useRequestUrl: true,
          } as SetCookieConfig,
        });
        // detailed tests in the `SetCookieAction` class
        assert.typeOf(result.config, 'object');
        assert.equal(result.config.kind, SetCookieActionKind);
      });

      it('translates the set-variable action', () => {
        const result = Action.fromLegacy({
          priority: 0,
          type: 'request',
          name: 'set-variable',
          config: {
            name: 'test variable',
            source: { source: 'body' },
          } as SetVariableConfig,
        });
        // detailed tests in the `SetVariableAction` class
        assert.typeOf(result.config, 'object');
        assert.equal(result.config.kind, SetVariableActionKind);
      });

      it('translates the delete-cookie action', () => {
        const result = Action.fromLegacy({
          priority: 0,
          type: 'request',
          name: 'delete-cookie',
          config: {
            name: 'test',
          } as DeleteCookieConfig,
        });
        // detailed tests in the `DeleteCookieAction` class
        assert.typeOf(result.config, 'object');
        assert.equal(result.config.kind, DeleteCookieActionKind);
      });
    });

    describe('Action.defaultAction()', () => {
      it('sets the kind', () => {
        const result = Action.defaultAction();
        assert.equal(result.kind, ActionKind);
      });

      it('sets the name', () => {
        const result = Action.defaultAction();
        assert.equal(result.name, 'New action');
      });

      it('sets the failOnError', () => {
        const result = Action.defaultAction();
        assert.equal(result.failOnError, false);
      });

      it('sets the sync', () => {
        const result = Action.defaultAction();
        assert.equal(result.sync, false);
      });

      it('sets the enabled', () => {
        const result = Action.defaultAction();
        assert.equal(result.enabled, true);
      });

      it('sets the priority', () => {
        const result = Action.defaultAction();
        assert.equal(result.priority, 0);
      });
    });

    describe('constructor()', () => {
      it('creates default values', () => {
        const result = new Action();
        assert.equal(result.kind, ActionKind);
        assert.isUndefined(result.name);
        assert.isUndefined(result.enabled);
        assert.isUndefined(result.priority);
        assert.isUndefined(result.config);
        assert.isUndefined(result.sync);
        assert.isUndefined(result.failOnError);
      });

      it('creates values from the schema', () => {
        const schema: IAction = {
          priority: 0,
          name: 'set-cookie',
          enabled: true,
          failOnError: false,
          kind: ActionKind,
          sync: false,
          config: {
            kind: SetCookieActionKind,
            name: 'test cookie',
            source: { source: 'value' },
            useRequestUrl: true,
          } as ISetCookieAction,
        };
        const result = new Action(schema);
        assert.equal(result.kind, ActionKind);
        assert.equal(result.name, 'set-cookie');
        assert.equal(result.enabled, true);
        assert.equal(result.priority, 0);
        assert.typeOf(result.config, 'object');
        assert.equal(result.sync, false);
        assert.equal(result.failOnError, false);
      });

      it('creates values from the JSON schema string', () => {
        const schema: IAction = {
          priority: 0,
          name: 'set-cookie',
          enabled: true,
          failOnError: false,
          kind: ActionKind,
          sync: false,
          config: {
            kind: SetCookieActionKind,
            name: 'test cookie',
            source: { source: 'value' },
            useRequestUrl: true,
          } as ISetCookieAction,
        };
        const result = new Action(JSON.stringify(schema));
        assert.equal(result.kind, ActionKind);
        assert.equal(result.name, 'set-cookie');
        assert.equal(result.enabled, true);
        assert.equal(result.priority, 0);
        assert.typeOf(result.config, 'object');
        assert.equal(result.sync, false);
        assert.equal(result.failOnError, false);
      });
    });

    describe('toJSON()', () => {
      let action: Action;
      beforeEach(() => {
        action = new Action();
      });

      it('serializes the kind', () => {
        const result = action.toJSON();
        assert.equal(result.kind, ActionKind);
      });

      it('serializes the name', () => {
        action.name = 'test';
        const result = action.toJSON();
        assert.equal(result.name, 'test');
      });

      it('serializes the enabled', () => {
        action.enabled = false;
        const result = action.toJSON();
        assert.isFalse(result.enabled);
      });

      it('serializes the sync', () => {
        action.sync = false;
        const result = action.toJSON();
        assert.isFalse(result.sync);
      });

      it('serializes the failOnError', () => {
        action.failOnError = false;
        const result = action.toJSON();
        assert.isFalse(result.failOnError);
      });

      it('serializes the priority', () => {
        action.priority = 5;
        const result = action.toJSON();
        assert.equal(result.priority, 5);
      });

      it('serializes the config', () => {
        action.config = new SetCookieAction();
        const result = action.toJSON();
        assert.typeOf(result.config, 'object');
        const cnf = result.config as ISetCookieAction;
        assert.equal(cnf.kind, SetCookieActionKind);
      });
    });

    describe('setConfig()', () => {
      let action: Action;
      beforeEach(() => {
        action = new Action();
      });

      it('sets the delete cookie config', () => {
        const config = new DeleteCookieAction();
        action.setConfig(config.toJSON());
        assert.typeOf(action.config, 'object');
        assert.equal(action.config.kind, DeleteCookieActionKind);
      });

      it('sets the set cookie config', () => {
        const config = new SetCookieAction();
        action.setConfig(config.toJSON());
        assert.typeOf(action.config, 'object');
        assert.equal(action.config.kind, SetCookieActionKind);
      });

      it('sets the set variable config', () => {
        const config = new SetVariableAction();
        action.setConfig(config.toJSON());
        assert.typeOf(action.config, 'object');
        assert.equal(action.config.kind, SetVariableActionKind);
      });

      it('throws when unknown action', () => {
        assert.throws(() => {
          action.setConfig({});
        });
      });
    });

    describe('Action.sortActions()', () => {
      it('sorts actions by priority', () => {
        const a1 = new Action();
        const a2 = new Action();
        const a3 = new Action();
        a1.priority = 3;
        a2.priority = 0;
        a3.priority = 5;
        const actions = [a1, a2, a3];
        actions.sort(Action.sortActions);
        assert.deepEqual(actions[0], a2);
        assert.deepEqual(actions[1], a1);
        assert.deepEqual(actions[2], a3);
      });

      it('sorts actions that does not have the priority', () => {
        const a1 = new Action();
        const a2 = new Action();
        const a3 = new Action();
        const actions = [a1, a2, a3];
        actions.sort(Action.sortActions);
        assert.deepEqual(actions[0], a1);
        assert.deepEqual(actions[1], a2);
        assert.deepEqual(actions[2], a3);
      });
    });
  });
});
