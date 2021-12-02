/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { Kind as HostRuleKind, HostRule, IHostRule } from '../../src/models/HostRule';

describe('Models', () => {
  describe('HostRule', () => {
    describe('Initialization', () => {
      describe('Default project initialization', () => {
        it('initializes a default rule', () => {
          const result = new HostRule();
          assert.equal(result.kind, HostRuleKind, 'sets the kind property');
          assert.equal(result.from, '', 'sets the from property');
          assert.equal(result.to, '', 'sets the to property');
          assert.isUndefined(result.enabled, 'does not set the enabled property');
          assert.isUndefined(result.comment, 'does not set the comment property');
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

        it('sets the to property', () => {
          const init: IHostRule = { ...base, ...{ to: 'test' }};
          const rule = new HostRule(init);
          assert.equal(rule.to, 'test');
        });

        it('sets the comment property', () => {
          const init: IHostRule = { ...base, ...{ comment: 'test' }};
          const rule = new HostRule(JSON.stringify(init));
          assert.equal(rule.comment, 'test');
        });

        it('sets the enabled property', () => {
          const init: IHostRule = { ...base, ...{ enabled: false }};
          const rule = new HostRule(JSON.stringify(init));
          assert.isFalse(rule.enabled);
        });
      });

      describe('fromValues()', () => {
        it('creates a rule with required values', () => {
          const rule = HostRule.fromValues('a', 'b');
          assert.equal(rule.from, 'a');
          assert.equal(rule.to, 'b');
          assert.equal(rule.kind, HostRuleKind);
          assert.isTrue(rule.enabled);
        });
      });
    });

    describe('toJSON()', () => {
      it('serializes the from value', () => {
        const rule = HostRule.fromValues('a', 'b');
        const result = rule.toJSON();
        assert.equal(result.from, 'a');
      });

      it('serializes the to value', () => {
        const rule = HostRule.fromValues('a', 'b');
        const result = rule.toJSON();
        assert.equal(result.to, 'b');
      });

      it('serializes the kind value', () => {
        const rule = HostRule.fromValues('a', 'b');
        const result = rule.toJSON();
        assert.equal(result.kind, HostRuleKind);
      });

      it('serializes the enabled value', () => {
        const rule = HostRule.fromValues('a', 'b');
        const result = rule.toJSON();
        assert.isTrue(result.enabled);
      });

      it('serializes the comment value', () => {
        const rule = HostRule.fromValues('a', 'b');
        rule.comment = 'test';
        const result = rule.toJSON();
        assert.equal(result.comment, 'test');
      });
    });

    describe('applyHosts()', () => {
      const url = 'https://api.host.domain.com/path?query=param';
      it('Returns the URL if there is no rules', () => {
        assert.equal(HostRule.applyHosts(url, undefined), url);
      });
  
      it('Returns the URL if rules is empty', () => {
        assert.equal(HostRule.applyHosts(url, []), url);
      });
  
      it('Alters the URL by all rules', () => {
        const rules: HostRule[] = [
          HostRule.fromValues('https:', 'ftp:'),
          HostRule.fromValues('/api\\.', '/0.'),
          HostRule.fromValues('\\.host\\.', '.'),
          HostRule.fromValues('/path', '/api'),
          HostRule.fromValues('query=param', 'a=b'),
        ];
        const result = HostRule.applyHosts(url, rules);
        assert.equal(result, 'ftp://0.domain.com/api?a=b');
      });
    });

    describe('createRuleRe()', () => {
      it('Creates a regular expression', () => {
        const result = HostRule.createRuleRe('test');
        assert.typeOf(result, 'RegExp');
      });
  
      it('Expression is based on the input', () => {
        const input = 'test-input';
        const result = HostRule.createRuleRe(input);
        assert.equal(result.source, input);
      });
  
      it('Replaces asterisk with regular expression group input', () => {
        const result = HostRule.createRuleRe('test*input');
        assert.equal(result.source, 'test(.*)input');
      });
  
      it('Replaces asterisks globally', () => {
        const result = HostRule.createRuleRe('test*input*');
        assert.equal(result.source, 'test(.*)input(.*)');
      });
    });

    describe('evaluateRule()', () => {
      it('Returns undefined when rule is not defined', () => {
        const url = 'test';
        assert.isUndefined(HostRule.evaluateRule(url, undefined));
        assert.isUndefined(HostRule.evaluateRule(url, HostRule.fromValues(undefined, undefined)));
        assert.isUndefined(HostRule.evaluateRule(url, HostRule.fromValues('from', undefined)));
        assert.isUndefined(HostRule.evaluateRule(url, HostRule.fromValues(undefined, 'to')));
      });
  
      it('Returns undefined if the rule does not match', () => {
        const url = 'abc';
        const rule = HostRule.fromValues('xyz', 'test');
        assert.isUndefined(HostRule.evaluateRule(url, rule));
      });
  
      it('Alters the url', () => {
        const url = 'abc';
        const rule = HostRule.fromValues('a', 'test');
        const result = HostRule.evaluateRule(url, rule);
        assert.equal(result, 'testbc');
      });
  
      it('Alters the url globally', () => {
        const url = 'abca';
        const rule = HostRule.fromValues('a', 'test');
        const result = HostRule.evaluateRule(url, rule);
        assert.equal(result, 'testbctest');
      });
  
      it('Includes asterisk', () => {
        const url = 'abca';
        const rule = HostRule.fromValues('abc*', 'test');
        const result = HostRule.evaluateRule(url, rule);
        assert.equal(result, 'test');
      });
  
      [
        ['https://api.domain.com/api', 'https://test.domain.com/api', HostRule.fromValues('api.domain.com', 'test.domain.com')],
        ['https://api.domain.com/api', 'https://test.domain.com/api', HostRule.fromValues('api.*.com', 'test.domain.com')],
        ['https://a123.domain.com/api', 'https://test.domain.com/api', HostRule.fromValues('a(\\d+)', 'test')],
        ['https://a123.domain.com/api', 'https://secured/api', HostRule.fromValues('https://*/', 'https://secured/')],
        ['https://var.domain.com/var', 'https://abc.domain.com/abc', HostRule.fromValues('var', 'abc')],
      ].forEach((item, index) => {
        it(`Evaluates test #${index}`, () => {
          const result = HostRule.evaluateRule(String(item[0]), item[2] as HostRule);
          assert.equal(result, item[1]);
        });
      });
    });
  });
});
