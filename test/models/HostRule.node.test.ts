import { assert } from 'chai';
import { HostRuleKind, HostRule, IHostRule } from '../../index.js';

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

        it('generates the key', () => {
          const result = new HostRule();
          assert.typeOf(result.key, 'string', 'sets the key property');
          assert.isNotEmpty(result.key, 'the key has a value');
        });
      });

      describe('From schema initialization', () => {
        let base: IHostRule;
        beforeEach(() => {
          base = {
            kind: HostRuleKind,
            from: '',
            to: '',
            key: '',
          }
        });

        it('sets the from property', () => {
          const init: IHostRule = { ...base, ...{ from: 'test' }};
          const rule = new HostRule(init);
          assert.equal(rule.from, 'test');
        });

        it('sets the to property', () => {
          const init: IHostRule = { ...base, ...{ to: 'test' }};
          const rule = new HostRule(init);
          assert.equal(rule.to, 'test');
        });

        it('sets the key property', () => {
          const init: IHostRule = { ...base, ...{ key: 'test' }};
          const rule = new HostRule(init);
          assert.equal(rule.key, 'test');
        });
      });

      describe('fromValues()', () => {
        it('creates a rule with required values', () => {
          const rule = HostRule.fromValues('a', 'b');
          assert.equal(rule.from, 'a');
        });

        it('generates a key', () => {
          const result = HostRule.fromValues('a', 'b');
          assert.typeOf(result.key, 'string', 'sets the key property');
          assert.isNotEmpty(result.key, 'the key has a value');
        });
      });
    });

    describe('toJSON()', () => {
      it('serializes the from value', () => {
        const rule = HostRule.fromValues('a', 'b');
        const result = rule.toJSON();
        assert.equal(result.from, 'a');
        assert.equal(result.to, 'b');
        assert.equal(result.kind, HostRuleKind);
        assert.equal(result.key, rule.key, 'sets the key property');
      });
    });
  });
});
