/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import { EvalFunctions } from '../../../src/runtime/variables/EvalFunctions.js';

const cacheTarget = {};

describe('Runtime', () => {
  describe('Variables', () => {
    describe('EvalFunctions', () => {
      describe('EncodeURIComponent()', () => {
        it('throws when no argument', () => {
          assert.throws(() => {
            EvalFunctions.EncodeURIComponent(cacheTarget, undefined as any);
          });
        });

        it('encodes first argument', () => {
          const result = EvalFunctions.EncodeURIComponent(cacheTarget, ['+']);
          assert.equal(result, '%2B');
        });

        it('ignores other arguments', () => {
          const result = EvalFunctions.EncodeURIComponent(cacheTarget, ['+', '+']);
          assert.equal(result, '%2B');
        });
      });

      describe('DecodeURIComponent()', () => {
        it('throws when no argument', () => {
          assert.throws(() => {
            EvalFunctions.DecodeURIComponent(cacheTarget, undefined as any);
          });
        });

        it('decodes first argument', () => {
          const result = EvalFunctions.DecodeURIComponent(cacheTarget, ['%2B']);
          assert.equal(result, '+');
        });

        it('ignores other arguments', () => {
          const result = EvalFunctions.DecodeURIComponent(cacheTarget, ['%2B', '%2B']);
          assert.equal(result, '+');
        });
      });

      describe('Btoa()', () => {
        it('throws when no argument', () => {
          assert.throws(() => {
            EvalFunctions.Btoa(cacheTarget, undefined as any);
          });
        });

        it('encodes the first argument', () => {
          const result = EvalFunctions.Btoa(cacheTarget, ['test', 'other']);
          assert.equal(result, 'dGVzdA==');
        });
      });

      describe('Atob()', () => {
        it('throws when no argument', () => {
          assert.throws(() => {
            EvalFunctions.Atob(cacheTarget, undefined as any);
          });
        });

        it('decodes the first argument', () => {
          const result = EvalFunctions.Atob(cacheTarget, ['dGVzdA==', 'other']);
          assert.equal(result, 'test');
        });
      });
    });
  });
});
