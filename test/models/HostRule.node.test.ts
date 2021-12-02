import { assert } from 'chai';
import { HostRuleKind, HostRule, IHostRule } from '../../index';

//
// Note, the actual unit tests are located in the `HostRule.browser.test.ts` file.
// This is to make sure that everything is working in the NodeJS module as well.
//

describe('Models', () => {
  describe('HostRule', () => {
    describe('Initialization', () => {
      describe('Default project initialization', () => {
        it('initializes a default rule', () => {
          const result = new HostRule();
          assert.equal(result.kind, HostRuleKind, 'sets the kind property');
        });
      });

      describe('From schema initialization', () => {
        let base: IHostRule;
        beforeEach(() => {
          base = {
            kind: HostRuleKind,
            from: '',
            to: '',
          }
        });

        it('sets the from property', () => {
          const init: IHostRule = { ...base, ...{ from: 'test' }};
          const rule = new HostRule(init);
          assert.equal(rule.from, 'test');
        });
      });

      describe('fromValues()', () => {
        it('creates a rule with required values', () => {
          const rule = HostRule.fromValues('a', 'b');
          assert.equal(rule.from, 'a');
        });
      });
    });

    describe('toJSON()', () => {
      it('serializes the from value', () => {
        const rule = HostRule.fromValues('a', 'b');
        const result = rule.toJSON();
        assert.equal(result.from, 'a');
      });
    });
  });
});
