import { assert } from '@esm-bundle/chai';
import { ResponseDataSourceEnum } from '../../src/models/actions/Enums.js';
import { SetVariableAction, ISetVariableAction, Kind as SetVariableActionKind } from '../../src/models/actions/runnable/SetVariableAction.js';

describe('Models', () => {
  describe('SetVariableAction', () => {
    describe('SetVariableAction.fromLegacy()', () => {
      it('sets the kind', () => {
        const result = SetVariableAction.fromLegacy({
          name: 'a',
          source: { source: 'body' }
        });
        assert.equal(result.kind, SetVariableActionKind);
      });

      it('sets the name', () => {
        const result = SetVariableAction.fromLegacy({
          name: 'a',
          source: { source: 'body' }
        });
        assert.equal(result.name, 'a');
      });

      it('sets the source', () => {
        const result = SetVariableAction.fromLegacy({
          name: 'a',
          source: { source: 'body' }
        });
        assert.typeOf(result.source, 'object');
        assert.equal(result.source.source, 'body');
      });
    });

    describe('constructor()', () => {
      it('creates default values', () => {
        const result = new SetVariableAction;
        assert.equal(result.kind, SetVariableActionKind);
      });

      it('creates an instance from the schema', () => {
        const schema: ISetVariableAction = {
          kind: SetVariableActionKind,
          name: 'a name',
          source: { source: ResponseDataSourceEnum.status },
        };
        const result = new SetVariableAction(schema);
        assert.equal(result.kind, SetVariableActionKind);
        assert.equal(result.name, 'a name');
        assert.typeOf(result.source, 'object');
        assert.equal(result.source.source, ResponseDataSourceEnum.status);
      });

      it('creates an instance from the JSON schema string', () => {
        const schema: ISetVariableAction = {
          kind: SetVariableActionKind,
          name: 'a name',
          source: { source: ResponseDataSourceEnum.status },
        };
        const result = new SetVariableAction(JSON.stringify(schema));
        assert.equal(result.kind, SetVariableActionKind);
        assert.equal(result.name, 'a name');
        assert.typeOf(result.source, 'object');
        assert.equal(result.source.source, ResponseDataSourceEnum.status);
      });
    });

    describe('new()', () => {
      let schema: ISetVariableAction;
      let action: SetVariableAction;
      beforeEach(() => {
        schema = {
          kind: SetVariableActionKind,
          name: 'a test',
          source: { source: ResponseDataSourceEnum.status },
        };
        action = new SetVariableAction(schema);
      });

      it('sets the source', () => {
        schema.source = { source: ResponseDataSourceEnum.headers },
        action.new(schema);
        assert.equal(action.source.source, ResponseDataSourceEnum.headers);
      });

      it('sets the name', () => {
        schema.name = 'other';
        action.new(schema);
        assert.equal(action.name, 'other');
      });
    });

    describe('toJSON()', () => {
      let action: SetVariableAction;
      beforeEach(() => {
        action = new SetVariableAction({
          kind: SetVariableActionKind,
          source: { source: ResponseDataSourceEnum.status },
          name: 'a name'
        });
      });

      it('sets the kind', () => {
        const result = action.toJSON();
        assert.equal(result.kind, SetVariableActionKind);
      });

      it('sets the source', () => {
        const result = action.toJSON();
        assert.equal(result.source.source, ResponseDataSourceEnum.status);
      });

      it('sets the name', () => {
        action.name = 'a test';
        const result = action.toJSON();
        assert.equal(result.name, 'a test');
      });
    });

    describe('isValid()', () => {
      it('returns false when no name', () => {
        const action = new SetVariableAction({
          kind: SetVariableActionKind,
          source: { source: ResponseDataSourceEnum.status },
          name: ''
        });
        assert.isFalse(action.isValid());
      });

      it('returns false when no source', () => {
        const action = new SetVariableAction({
          kind: SetVariableActionKind,
          source: undefined,
          name: 'test'
        });
        delete action.source;
        assert.isFalse(action.isValid());
      });

      it('returns true when a valid action', () => {
        const action = new SetVariableAction({
          kind: SetVariableActionKind,
          source: { source: ResponseDataSourceEnum.status },
          name: 'test'
        });
        assert.isTrue(action.isValid());
      });
    });
  });
});
