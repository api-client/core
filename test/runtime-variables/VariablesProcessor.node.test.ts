/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import sinon from 'sinon';
import { clear } from '../../src/lib/runtime/variables/Cache.js';
import { VariablesProcessor, Property } from '../../index.js';
import { EvalFunctions } from '../../src/lib/runtime/variables/EvalFunctions.js';

describe('Runtime', () => {
  describe('Variables', () => {
    describe('VariablesProcessor', () => {
      const variables: Property[] = [
        Property.String('test1', 'value1'),
        Property.String('test2', 'value2 ${test1}'),
        Property.String('test3', 'value3 {test4}'),
        Property.String('test4', 'value4'),
        Property.String('test5', 'value5', false),
        Property.String('host', 'api'),
        Property.String('path', 'path'),
        Property.String('b46', 'other'),
      ];

      describe('Variables processing', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor(variables);
        });

        afterEach(() => {
          clear(instance);
        });

        [
          ['Test 1: ${test1}', 'Test 1: value1'],
          ['Test 2: {test1}', 'Test 2: value1'],
          ['Test 3: ${test2}', 'Test 3: value2 value1'],
          ['Test 4: {test2}', 'Test 4: value2 value1'],
          ['Test 5: ${test3}', 'Test 5: value3 value4'],
          ['Test 6: {test3}', 'Test 6: value3 value4'],
          ['Test 7: ${test5}', 'Test 7: undefined'],
          ['Test 8: {test5}', 'Test 8: undefined'],
          ['${String.toLowerCase(TEST)}', 'test'],
          ['{String.toLowerCase(TEST)}', 'test'],
          ['${Math.abs(-110)}', '110'],
          ['{Math.abs(-110)}', '110'],
          ['${encodeURIComponent(te s+t)}', 'te%20s%2Bt'],
          ['{encodeURIComponent(te s+t)}', 'te%20s%2Bt'],
          ['${decodeURIComponent(te%20s%2Bt)}', 'te s+t'],
          ['{decodeURIComponent(te%20s%2Bt)}', 'te s+t'],
          ['{btoa(test)}', 'dGVzdA=='],
          ['{atob(dGVzdA==)}', 'test'],
          [
            '{\n\t"v1":"${test1}",\n\t"v2": "${test2}"\n}',
            '{\n\t"v1":"value1",\n\t"v2": "value2 value1"\n}',
          ],
          [
            '{"v1":"${test1}","v2": "${test2}"}',
            '{"v1":"value1","v2": "value2 value1"}',
          ],
          [
            '{\n\t"v1":"{test1}",\n\t"v2": "{test2}"\n}',
            '{\n\t"v1":"value1",\n\t"v2": "value2 value1"\n}',
          ],
          [
            '{"v1":"{test1}","v2": "{test2}"}',
            '{"v1":"value1","v2": "value2 value1"}',
          ],
          ['https://{host}.domain.com', 'https://api.domain.com'],
          ['https://api.domain.com/a/{path}/b', 'https://api.domain.com/a/path/b'],
          [JSON.stringify({data: { complex: true }}, null, 2), '{\n  "data": {\n    "complex": true\n  }\n}'],
        ].forEach(([src, value]) => {
          it(`${src}`, async () => {
            const result = await instance.evaluateVariable(src);
            assert.equal(result, value);
          });
        });

        [
          ['JS syntax: ${now}', /JS syntax: \d+/],
          ['API syntax: {now}', /API syntax: \d+/],
          ['JS syntax: ${random()}', /JS syntax: \d+/],
          ['API syntax: {random()}', /API syntax: \d+/],
        ].forEach(([src, value]) => {
          it(`${src}`, async () => {
            const result = await instance.evaluateVariable(src as string);
            assert.match(result, value as RegExp);
          });
        });
      });

      describe('_applyArgumentsContext()', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor(variables);
        });

        it('returns the same string if not a variable', () => {
          const result = instance._applyArgumentsContext('test', {});
          assert.equal(result, 'test');
        });

        it('replaces value with context value (JS syntax)', () => {
          const result = instance._applyArgumentsContext('${test}', {
            test: 'other',
          });
          assert.equal(result, 'other');
        });

        it('replaces value with context value (API syntax)', () => {
          const result = instance._applyArgumentsContext('{test}', {
            test: 'other',
          });
          assert.equal(result, 'other');
        });

        it('returns expression value if no key in context (JS syntax)', () => {
          const result = instance._applyArgumentsContext('${test}', {});
          assert.equal(result, '${test}');
        });

        it('returns expression value if no key in context (API syntax)', () => {
          const result = instance._applyArgumentsContext('{test}', {});
          assert.equal(result, '{test}');
        });
      });

      describe('evaluateVariables()', () => {
        const vars: Property[] = [
          Property.String('test1', 'value1'),
          Property.String('test2', 'value2 ${test1}'),
          Property.String('test3', 'value3 ${test4}'),
          Property.String('test4', 'value4'),
          Property.String('test5', 'value5', false),
        ];
        const obj = {
          var1: '${test1}',
          var2: '${test2}',
          var3: 'test-${test4}',
          var4: 'hello',
        };
        
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor(vars);
        });

        it('returns the same string without variables', async () => {
          const tmp = { ...obj };
          const result = await instance.evaluateVariables(tmp, {
            names: ['var4'],
          });
          assert.equal(result.var4, 'hello');
        });

        it('evaluates only listed properties', async () => {
          const tmp = { ...obj };
          const result = await instance.evaluateVariables(tmp, {
            names: ['var1'],
          });
          assert.equal(result.var1, 'value1');
          assert.equal(result.var2, '${test2}');
          assert.equal(result.var3, 'test-${test4}');
          assert.equal(result.var4, 'hello');
        });

        it('evaluates all properties', async () => {
          const tmp = { ...obj };
          const result = await instance.evaluateVariables(tmp);
          assert.equal(result.var1, 'value1');
          assert.equal(result.var2, 'value2 value1');
          assert.equal(result.var3, 'test-value4');
          assert.equal(result.var4, 'hello');
        });

        it('uses the "override" property', async () => {
          const tmp = { ...obj };
          const result = await instance.evaluateVariables(tmp, {
            override: {
              test1: 'override-1',
              test2: 'override-2',
            },
          });
          assert.equal(result.var1, 'override-1');
          assert.equal(result.var2, 'override-2');
        });

        it('uses the "context" property', async () => {
          const tmp = { ...obj };
          const result = await instance.evaluateVariables(tmp, {
            context: {
              test1: 'context-1',
            },
          });
          assert.equal(result.var1, 'context-1');
          assert.equal(result.var2, 'undefined');
        });
      });

      describe('evaluateVariable()', () => {
        const vars: Property[] = [
          Property.String('test1', 'value1'),
          Property.String('test2', 'value2 ${test1}'),
          Property.String('test3', 'value3 ${test4}'),
          Property.String('test4', 'value4'),
          Property.String('test5', 'value5', false),
        ];
        
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor(vars);
        });

        it('returns the same string without variables', async () => {
          const result = await instance.evaluateVariable('test');
          assert.equal(result, 'test');
        });

        it('returns value for variable', async () => {
          const result = await instance.evaluateVariable('test ${test1}');
          assert.equal(result, 'test value1');
        });

        it('evaluates JSON string', async () => {
          const str = '{\n\t"v1":"${test1}",\n\t"v2": "${test2}"\n}';
          const result = await instance.evaluateVariable(str);
          assert.equal(result, '{\n\t"v1":"value1",\n\t"v2": "value2 value1"\n}');
        });

        it('Should return value for complex variable', async () => {
          const result = await instance.evaluateVariable('test ${test3}');
          assert.equal(result, 'test value3 value4');
        });

        it('uses "override" from options', async () => {
          const result = await instance.evaluateVariable('test ${test3}', {
            override: { test3: 'value3' },
          });
          assert.equal(result, 'test value3');
        });

        it('Should evaluate legacy now function', async () => {
          const result = await instance.evaluateVariable('test ${now}');
          const now = result.split(' ')[1];
          assert.isFalse(Number.isNaN(now));
        });

        it('Should evaluate legacy now function with group', async () => {
          const result = await instance.evaluateVariable('${now:1} ${now:2} ${now:1}');
          const values = result.split(' ');
          assert.isFalse(Number.isNaN(values[0]));
          assert.equal(values[0], values[2]);
        });

        it('Should evaluate legacy random function', async () => {
          const result = await instance.evaluateVariable('test ${random}');
          const value = result.split(' ')[1];
          assert.isFalse(Number.isNaN(value));
        });

        it('Should evaluate legacy random function with group', async () => {
          const result = await instance
            .evaluateVariable('${random:1} ${random:2} ${random:1}');
          const values = result.split(' ');
          assert.isFalse(Number.isNaN(values[0]));
          assert.equal(values[0], values[2]);
          assert.notEqual(values[1], values[2]);
        });

        it('Should evaluate now()', async () => {
          const result = await instance.evaluateVariable('test now()');
          const now = result.split(' ')[1];
          assert.isFalse(Number.isNaN(now));
        });

        it('Should evaluate now() with group', async () => {
          const result = await instance.evaluateVariable('now(1) now(2) now(1)');
          const values = result.split(' ');
          assert.equal(values[0], values[2]);
        });

        it('Should evaluate random()', async () => {
          const result = await instance.evaluateVariable('test random()');
          const now = result.split(' ')[1];
          assert.isFalse(Number.isNaN(now));
        });

        it('Should evaluate random() with group', async () => {
          const result = await instance
            .evaluateVariable('random(1) random(2) random(1)');
          const values = result.split(' ');
          assert.equal(values[0], values[2]);
        });

        it('Should evaluate Math function', async () => {
          const result = await instance.evaluateVariable('test Math.abs(-100)');
          assert.equal(result, 'test 100');
        });

        it('Should evaluate String function', async () => {
          const result = await instance
            .evaluateVariable('test String.toUpperCase(test)');
          assert.equal(result, 'test TEST');
        });

        it('Should evaluate encodeURIComponent()', async () => {
          const result = await instance
            .evaluateVariable('test encodeURIComponent(te s+t)');
          assert.equal(result, 'test te%20s%2Bt');
        });

        it('evaluates decodeURIComponent()', async () => {
          const result = await instance
            .evaluateVariable('test decodeURIComponent(te%20s%2Bt)');
          assert.equal(result, 'test te s+t');
        });

        it('ignores invalid input', async () => {
          const result = await instance.evaluateVariable('test ${test');
          assert.equal(result, 'test ${test');
        });

        it('does not evaluate object', async () => {
          const input = { a: 'b' };
          const result = await instance.evaluateVariable(input as any);
          assert.isTrue(input as any === result);
        });

        it('does not evaluate null', async () => {
          const input = null;
          const result = await instance.evaluateVariable(input as any);
          assert.isTrue(input === result);
        });

        it('does evaluate numbers', async () => {
          const input = 2;
          const result = await instance.evaluateVariable(input as any);
          assert.isTrue(result === '2');
        });

        it('does not evaluate booleans', async () => {
          const input = false;
          const result = await instance.evaluateVariable(input as any);
          assert.isTrue(result === 'false');
        });

        it('Double slash is preserved', async () => {
          const result = await instance.evaluateVariable('\\\\test\\\\');
          assert.equal(result, '\\\\test\\\\');
        });
      });

      describe('_prepareValue()', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor(variables);
        });

        it('Prepares simple string', () => {
          assert.equal(instance._prepareValue('test'), 'test');
        });

        it('Prepares string with variable', () => {
          assert.equal(instance._prepareValue('test ${val}'), "'test ' + val + ''");
        });

        it('does not throw error for bad syntax', () => {
          instance._prepareValue('test ${val');
        });

        it('Prepares string with complex structure', () => {
          const result = instance._prepareValue('test ${val} test ${val} test ${val}');
          const compare = "'test ' + val + ' test ' + val + ' test ' + val + ''";
          assert.equal(result, compare);
        });

        it('prepares API literal syntax', () => {
          const result = instance._prepareValue('test {val} test {val} test {val}');
          const compare = "'test ' + val + ' test ' + val + ' test ' + val + ''";
          assert.equal(result, compare);
        });
      });

      describe('_upgradeLegacy()', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor(variables);
        });

        it('Upgrades ${now}', () => {
          assert.equal(instance._upgradeLegacy('test ${now}'), 'test ${now()}');
        });

        it('Upgrades ${now} with groups', () => {
          assert.equal(instance._upgradeLegacy('test ${now:1}'), 'test ${now(1)}');
        });

        it('Upgrades ${random}', () => {
          assert.equal(instance._upgradeLegacy('test ${random}'), 'test ${random()}');
        });

        it('Upgrades ${random} with groups', () => {
          assert.equal(instance._upgradeLegacy('test ${random:1}'), 'test ${random(1)}');
        });
      });

      describe('buildContext()', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor(variables);
        });

        it('sets variable value', async () => {
          const context = await instance.buildContext();
          assert.equal(context.test2, 'value2 value1');
        });

        it('sets variable value defined later', async () => {
          const context = await instance.buildContext();
          assert.equal(context.test3, 'value3 value4');
        });

        it('does not uses disabled items', async () => {
          const context = await instance.buildContext();
          assert.isUndefined(context.test5);
        });

        it('Override context values', async () => {
          const opts = {
            test1: 'ov1',
            test2: 'ov2',
          };
          const context = await instance.buildContext(opts);
          assert.equal(context.test1, 'ov1');
          assert.equal(context.test2, 'ov2');
          assert.equal(context.test3, 'value3 value4');
        });

        it('Adds new context values', async () => {
          const opts = {
            test1: 'ov1',
            test2: 'ov2',
            newVar: 'new',
          };
          const context = await instance.buildContext(opts);
          assert.equal(context.test1, 'ov1');
          assert.equal(context.test2, 'ov2');
          assert.equal(context.newVar, 'new');
        });
      });

      describe('_callNamespaceFunction() =>', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor(variables);
        });

        it('Returns empty string when namespace does not exist', () => {
          const result = instance._callNamespaceFunction('Something', 'fn', []);
          assert.equal(result, '');
        });

        it('Calls Math function', () => {
          const result = instance._callNamespaceFunction('Math', 'abs', ['1']);
          assert.equal(result, 1);
        });

        it('Calls JSON function', () => {
          const result = instance._callNamespaceFunction('JSON', 'parse', ['{}']);
          assert.deepEqual(result as any, {});
        });

        it('Calls String function', () => {
          const result = instance._callNamespaceFunction('String', 'substr', [
            'test',
            '1',
          ]);
          assert.equal(result, 'est');
        });

        it('Throws when String function has no arguments', () => {
          assert.throws(() => {
            instance._callNamespaceFunction('String', 'substr');
          });
        });
      });

      describe('_evalFunctions()', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor(variables);
        });

        it('Returns empty string when no argument', () => {
          const result = instance._evalFunctions(undefined as any);
          assert.equal(result, '');
        });

        it('Should call now()', () => {
          const result = instance._evalFunctions('now()');
          assert.isFalse(Number.isNaN(result));
        });

        it('Should call random()', () => {
          const result = instance._evalFunctions('random()');
          assert.isFalse(Number.isNaN(result));
        });

        it('random() with groups', () => {
          const result = instance._evalFunctions('random(1) random(2) random(1)');
          const items = result.split(' ');
          assert.equal(items[0], items[2]);
        });

        it('Calls Math function', () => {
          const result = instance._evalFunctions('test Math.abs(-110)');
          assert.equal(result, 'test 110');
        });

        it('Calls String function', () => {
          const result = instance._evalFunctions('test String.toLowerCase(TEST)');
          assert.equal(result, 'test test');
        });

        it('Calls encodeURIComponent()', () => {
          const result = instance._evalFunctions('test encodeURIComponent(te s+t)');
          assert.equal(result, 'test te%20s%2Bt');
        });

        it('Calls decodeURIComponent()', () => {
          const result = instance._evalFunctions(
            'test decodeURIComponent(te%20s%2Bt)'
          );
          assert.equal(result, 'test te s+t');
        });
      });

      describe('_callFn()', () => {
        let instance: VariablesProcessor;
        beforeEach(() => {
          instance = new VariablesProcessor(variables);
        });

        it('Throws when function do not exists', () => {
          assert.throws(() => {
            instance._callFn('nonExisting');
          });
        });

        it('Throws when namespace function do not exists', () => {
          assert.throws(() => {
            instance._callFn('Something.nonExisting');
          });
        });

        it('Calls the EvalFunctions.Now() function', () => {
          const spy = sinon.spy(EvalFunctions, 'Now');
          instance._callFn('now');
          (EvalFunctions.Now as any).restore();
          assert.isTrue(spy.called);
        });

        it('Calls the EvalFunctions.Random() function', () => {
          const spy = sinon.spy(EvalFunctions, 'Random');
          instance._callFn('random');
          (EvalFunctions.Random as any).restore();
          assert.isTrue(spy.called);
        });

        it('Calls the EvalFunctions.EncodeURIComponent() function', () => {
          const spy = sinon.spy(EvalFunctions, 'EncodeURIComponent');
          instance._callFn('encodeURIComponent', ['a']);
          assert.isTrue(spy.called);
          spy.restore();
        });

        it('Calls the EvalFunctions.DecodeURIComponent() function', () => {
          const spy = sinon.spy(EvalFunctions, 'DecodeURIComponent');
          instance._callFn('decodeURIComponent', ['a']);
          assert.isTrue(spy.called);
          spy.restore();
        });

        it('Calls the Math.xxx() function', () => {
          const spy = sinon.spy(instance, '_callNamespaceFunction');
          instance._callFn('Math.abs', ['1']);
          assert.isTrue(spy.called);
          assert.equal(spy.args[0][0], 'Math', 'namespace is set');
          assert.equal(spy.args[0][1], 'abs', 'function name is set');
          assert.deepEqual(spy.args[0][2], ['1'], 'arguments is set');
        });

        it('Calls the String.xxx() function', () => {
          const spy = sinon.spy(instance, '_callNamespaceFunction');
          instance._callFn('String.substr', ['test', '1']);
          assert.isTrue(spy.called);
          assert.equal(spy.args[0][0], 'String', 'namespace is set');
          assert.equal(spy.args[0][1], 'substr', 'function name is set');
          assert.typeOf(spy.args[0][2], 'array', 'arguments is set');
        });
      });
    });
  });
});
