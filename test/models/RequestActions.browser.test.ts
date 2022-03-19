import { assert } from '@esm-bundle/chai';
import { RequestActions, IRequestActions } from '../../src/models/RequestActions.js';
import { RunnableAction, IRunnableAction, Kind as RunnableActionKind } from '../../src/models/actions/RunnableAction.js';
import { Kind as ConditionKind } from '../../src/models/actions/Condition.js';

describe('Models', () => {
  describe('RequestActions', () => {
    describe('RequestActions.fromLegacy()', () => {
      // 
      // The `RunnableAction` has a detailed tests for `fromLegacy()`.
      // 

      it('sets the result actions array', () => {
        const result = RequestActions.fromLegacy({
          request: [
            {
              condition: {
                source: 'body',
                alwaysPass: true,
                path: 'a.b.c',
                type: 'request',
              },
              actions: [
                {
                  priority: 0,
                  type: 'request',
                  name: 'set-cookie',
                  config: {
                    
                  },
                }
              ],
              enabled: true,
              type: 'request',
            }
          ],
        });

        assert.typeOf(result.request, 'array');
        assert.lengthOf(result.request, 1);
        assert.isUndefined(result.response);
      });

      it('sets the responses actions array', () => {
        const result = RequestActions.fromLegacy({
          response: [
            {
              condition: {
                source: 'body',
                alwaysPass: true,
                path: 'a.b.c',
                type: 'response',
              },
              actions: [
                {
                  priority: 0,
                  type: 'response',
                  name: 'set-cookie',
                  config: {
                    
                  },
                }
              ],
              enabled: true,
              type: 'response',
            }
          ],
        });

        assert.typeOf(result.response, 'array');
        assert.lengthOf(result.response, 1);
        assert.isUndefined(result.request);
      });
    });

    describe('RequestActions.isLegacy()', () => {
      it('returns false when no request and response', () => {
        const result = RequestActions.isLegacy({});
        assert.isFalse(result);
      });

      it('returns true when request actions have no kind property', () => {
        const result = RequestActions.isLegacy({
          request: [
            {
              condition: {
                source: 'body',
                alwaysPass: true,
                path: 'a.b.c',
                type: 'response',
              },
              actions: [
                {
                  priority: 0,
                  type: 'response',
                  name: 'set-cookie',
                  config: {
                    
                  },
                }
              ],
              enabled: true,
              type: 'response',
            }
          ],
        });
        assert.isTrue(result);
      });

      it('returns true when response actions have no kind property', () => {
        const result = RequestActions.isLegacy({
          response: [
            {
              condition: {
                source: 'body',
                alwaysPass: true,
                path: 'a.b.c',
                type: 'response',
              },
              actions: [
                {
                  priority: 0,
                  type: 'response',
                  name: 'set-cookie',
                  config: {
                    
                  },
                }
              ],
              enabled: true,
              type: 'response',
            }
          ],
        });
        assert.isTrue(result);
      });

      it('returns true when request has kind property', () => {
        const schema: IRequestActions = {
          request: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
            }
          ],
        };
        const result = RequestActions.isLegacy(schema);
        assert.isFalse(result);
      });

      it('returns true when response has kind property', () => {
        const schema: IRequestActions = {
          response: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
            }
          ],
        };
        const result = RequestActions.isLegacy(schema);
        assert.isFalse(result);
      });
    });

    describe('constructor()', () => {
      it('creates a default instance', () => {
        const result = new RequestActions();
        assert.isUndefined(result.request);
        assert.isUndefined(result.response);
      });

      it('creates an instance from the schema', () => {
        const result = new RequestActions({
          request: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
              enabled: true,
            }
          ],
          response: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
              enabled: true,
            }
          ],
        });
        assert.typeOf(result.request, 'array');
        assert.typeOf(result.response, 'array');
        assert.lengthOf(result.request, 1);
        assert.lengthOf(result.response, 1);
      });

      it('creates an instance from the JSON schema string', () => {
        const str = JSON.stringify({
          request: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
              enabled: true,
            }
          ],
          response: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
              enabled: true,
            }
          ],
        });
        const result = new RequestActions(str);
        assert.typeOf(result.request, 'array');
        assert.typeOf(result.response, 'array');
        assert.lengthOf(result.request, 1);
        assert.lengthOf(result.response, 1);
      });
    });

    describe('new()', () => {
      it('sets the requests array', () => {
        const schema: IRequestActions = {
          request: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
              enabled: true,
            }
          ],
        };
        const result = new RequestActions(schema);
        assert.typeOf(result.request, 'array');
        assert.lengthOf(result.request, 1);
      });

      it('clears the request actions when not defined', () => {
        const schema: IRequestActions = {
          request: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
              enabled: true,
            }
          ],
        };
        const result = new RequestActions(schema);
        delete schema.request;
        result.new(schema);

        assert.isUndefined(result.request);
      });

      it('sets the responses array', () => {
        const schema: IRequestActions = {
          response: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
              enabled: true,
            }
          ],
        };
        const result = new RequestActions(schema);
        assert.typeOf(result.response, 'array');
        assert.lengthOf(result.response, 1);
      });

      it('clears the response actions when not defined', () => {
        const schema: IRequestActions = {
          response: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
              enabled: true,
            }
          ],
        };
        const result = new RequestActions(schema);
        delete schema.response;
        result.new(schema);

        assert.isUndefined(result.response);
      });
    });

    describe('toJSON()', () => {
      it('does not serialize values that are not set', () => {
        const instance = new RequestActions();
        const result = instance.toJSON();
        assert.deepEqual(result, {});
      });

      it('serializes the request actions', () => {
        const schema: IRequestActions = {
          request: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
              enabled: true,
            }
          ],
        };
        const instance = new RequestActions(schema);
        const result = instance.toJSON();
        assert.typeOf(result.request, 'array');
        assert.lengthOf(result.request, 1);
      });

      it('serializes the response actions', () => {
        const schema: IRequestActions = {
          response: [
            {
              kind: RunnableActionKind,
              actions: [],
              condition: {
                kind: ConditionKind,
                source: 'value',
              },
              enabled: true,
            }
          ],
        };
        const instance = new RequestActions(schema);
        const result = instance.toJSON();
        assert.typeOf(result.response, 'array');
        assert.lengthOf(result.response, 1);
      });
    });

    describe('addRequestAction', () => {
      let actions: RequestActions;
      beforeEach(() => {
        actions = new RequestActions();
      });

      it('adds a request action from the schema', () => {
        const schema: IRunnableAction = {
          kind: RunnableActionKind,
          actions: [],
          condition: {
            kind: ConditionKind,
            source: 'value',
          }
        };
        actions.addRequestAction(schema);
        assert.typeOf(actions.request, 'array');
        assert.lengthOf(actions.request, 1);
      });

      it('adds a request action from the instances', () => {
        const inst = new RunnableAction();
        actions.addRequestAction(inst);
        assert.typeOf(actions.request, 'array');
        assert.lengthOf(actions.request, 1);
      });

      it('returns the created runnable', () => {
        const inst = new RunnableAction();
        const result = actions.addRequestAction(inst);
        assert.deepEqual(actions.request[0], result);
      });

      it('adds the runnable to the list', () => {
        actions.addRequestAction(new RunnableAction());
        actions.addRequestAction(new RunnableAction());
        assert.lengthOf(actions.request, 2);
      });
    });

    describe('addResponseAction', () => {
      let actions: RequestActions;
      beforeEach(() => {
        actions = new RequestActions();
      });

      it('adds a request action from the schema', () => {
        const schema: IRunnableAction = {
          kind: RunnableActionKind,
          actions: [],
          condition: {
            kind: ConditionKind,
            source: 'value',
          }
        };
        actions.addResponseAction(schema);
        assert.typeOf(actions.response, 'array');
        assert.lengthOf(actions.response, 1);
      });

      it('adds a response action from the instances', () => {
        const inst = new RunnableAction();
        actions.addResponseAction(inst);
        assert.typeOf(actions.response, 'array');
        assert.lengthOf(actions.response, 1);
      });

      it('returns the created runnable', () => {
        const inst = new RunnableAction();
        const result = actions.addResponseAction(inst);
        assert.deepEqual(actions.response[0], result);
      });

      it('adds the runnable to the list', () => {
        actions.addResponseAction(new RunnableAction());
        actions.addResponseAction(new RunnableAction());
        assert.lengthOf(actions.response, 2);
      });
    });
  });
});
