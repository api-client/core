import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { clear } from '../../src/runtime/variables/Cache.js';
import { VariablesProcessor } from '../../src/runtime/variables/VariablesProcessor.js';
import { Property } from '../../src/models/Property.js';
import { EvalFunctions } from '../../src/runtime/variables/EvalFunctions.js';

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
        Property.String('operation', 'GET'),
      ];

      describe('Variables processing', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor();
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
          ['{"test":true}', '{"test":true}'],
          ['[{"test":true}]', '[{"test":true}]'],
          ['{operation}', 'GET'],
          ['{test {operation}}', '{test {operation}}'],
        ].forEach(([src, value]) => {
          it(`${src}`, async () => {
            const ctx = VariablesProcessor.createContextFromProperties(variables);
            const result = await instance.evaluateVariable(src, ctx);
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
            const ctx = VariablesProcessor.createContextFromProperties(variables);
            const result = await instance.evaluateVariable(src as string, ctx);
            assert.match(result, value as RegExp);
          });
        });
      });

      describe('_applyArgumentsContext()', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor();
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
          instance = new VariablesProcessor();
        });

        it('returns the same string without variables', async () => {
          const tmp = { ...obj };
          const result = await instance.evaluateVariables(tmp, {});
          assert.equal(result.var4, 'hello');
        });

        it('evaluates only listed properties', async () => {
          const tmp = { ...obj };
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariables(tmp, ctx, ['var1']);
          assert.equal(result.var1, 'value1');
          assert.equal(result.var2, '${test2}');
          assert.equal(result.var3, 'test-${test4}');
          assert.equal(result.var4, 'hello');
        });

        it('evaluates all properties', async () => {
          const tmp = { ...obj };
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariables(tmp, ctx);
          assert.equal(result.var1, 'value1');
          assert.equal(result.var2, 'value2 value1');
          assert.equal(result.var3, 'test-value4');
          assert.equal(result.var4, 'hello');
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
          instance = new VariablesProcessor();
        });

        it('returns the same string without variables', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test', ctx);
          assert.equal(result, 'test');
        });

        it('returns value for variable', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test ${test1}', ctx);
          assert.equal(result, 'test value1');
        });

        it('evaluates JSON string', async () => {
          const str = '{\n\t"v1":"${test1}",\n\t"v2": "${test2}"\n}';
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable(str, ctx);
          assert.equal(result, '{\n\t"v1":"value1",\n\t"v2": "value2 value1"\n}');
        });

        it('returns value for complex variable', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test ${test3}', ctx);
          assert.equal(result, 'test value3 value4');
        });

        it('evaluates legacy now() function', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test ${now}', ctx);
          const now = result.split(' ')[1];
          assert.isFalse(Number.isNaN(now));
        });

        it('evaluates legacy now() function with a group', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('${now:1} ${now:2} ${now:1}', ctx);
          const values = result.split(' ');
          assert.isFalse(Number.isNaN(values[0]));
          assert.equal(values[0], values[2]);
        });

        it('evaluates legacy random() function', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test ${random}', ctx);
          const value = result.split(' ')[1];
          assert.isFalse(Number.isNaN(value));
        });

        it('evaluates legacy random() function with a group', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('${random:1} ${random:2} ${random:1}', ctx);
          const values = result.split(' ');
          assert.isFalse(Number.isNaN(values[0]));
          assert.equal(values[0], values[2]);
          assert.notEqual(values[1], values[2]);
        });

        it('evaluates now()', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test now()', ctx);
          const now = result.split(' ')[1];
          assert.isFalse(Number.isNaN(now));
        });

        it('evaluates now() with a group', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('now(1) now(2) now(1)', ctx);
          const values = result.split(' ');
          assert.equal(values[0], values[2]);
        });

        it('evaluates random()', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test random()', ctx);
          const now = result.split(' ')[1];
          assert.isFalse(Number.isNaN(now));
        });

        it('evaluates random() with group', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('random(1) random(2) random(1)', ctx);
          const values = result.split(' ');
          assert.equal(values[0], values[2]);
        });

        it('evaluates Math function', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test Math.abs(-100)', ctx);
          assert.equal(result, 'test 100');
        });

        it('evaluates String function', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test String.toUpperCase(test)', ctx);
          assert.equal(result, 'test TEST');
        });

        it('evaluates encodeURIComponent()', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test encodeURIComponent(te s+t)', ctx);
          assert.equal(result, 'test te%20s%2Bt');
        });

        it('evaluates decodeURIComponent()', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test decodeURIComponent(te%20s%2Bt)', ctx);
          assert.equal(result, 'test te s+t');
        });

        it('ignores invalid input', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('test ${test', ctx);
          assert.equal(result, 'test ${test');
        });

        it('does not evaluate object', async () => {
          const input = { a: 'b' };
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable(input as any, ctx);
          assert.isTrue(input as any === result);
        });

        it('does not evaluate null', async () => {
          const input = null;
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable(input as any, ctx);
          assert.isTrue(input === result);
        });

        it('does evaluate numbers', async () => {
          const input = 2;
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable(input as any, ctx);
          assert.isTrue(result === '2');
        });

        it('does not evaluate booleans', async () => {
          const input = false;
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable(input as any, ctx);
          assert.isTrue(result === 'false');
        });

        it('preserves the double slash', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(vars);
          const result = await instance.evaluateVariable('\\\\test\\\\', ctx);
          assert.equal(result, '\\\\test\\\\');
        });
      });

      describe('_prepareValue()', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor();
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
          instance = new VariablesProcessor();
        });

        it('upgrades ${now}', () => {
          assert.equal(instance._upgradeLegacy('test ${now}'), 'test ${now()}');
        });

        it('upgrades ${now} with groups', () => {
          assert.equal(instance._upgradeLegacy('test ${now:1}'), 'test ${now(1)}');
        });

        it('upgrades ${random}', () => {
          assert.equal(instance._upgradeLegacy('test ${random}'), 'test ${random()}');
        });

        it('upgrades ${random} with groups', () => {
          assert.equal(instance._upgradeLegacy('test ${random:1}'), 'test ${random(1)}');
        });
      });

      describe('buildContext()', () => {
        let instance: VariablesProcessor;
        before(() => {
          instance = new VariablesProcessor();
        });

        it('sets variable value', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(variables);
          const context = await instance.buildContext(ctx);
          assert.equal(context.test2, 'value2 value1');
        });

        it('sets variable value defined later', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(variables);
          const context = await instance.buildContext(ctx);
          assert.equal(context.test3, 'value3 value4');
        });

        it('does not uses disabled items', async () => {
          const ctx = VariablesProcessor.createContextFromProperties(variables);
          const context = await instance.buildContext(ctx);
          assert.isUndefined(context.test5);
        });
      });

      describe('_callNamespaceFunction()', () => {
        let instance: VariablesProcessor;
        let ctx: Record<string, string>;
        before(async () => {
          instance = new VariablesProcessor();
          const vars = VariablesProcessor.createContextFromProperties(variables);
          ctx = await instance.buildContext(vars);
        });

        it('returns empty string when namespace does not exist', () => {
          const result = instance._callNamespaceFunction(ctx, 'Something', 'fn', []);
          assert.equal(result, '');
        });

        it('Calls Math function', () => {
          const result = instance._callNamespaceFunction(ctx, 'Math', 'abs', ['1']);
          assert.equal(result, 1);
        });

        it('Calls JSON function', () => {
          const result = instance._callNamespaceFunction(ctx, 'JSON', 'parse', ['{}']);
          assert.deepEqual(result as any, {});
        });

        it('Calls String function', () => {
          const result = instance._callNamespaceFunction(ctx, 'String', 'substr', [
            'test',
            '1',
          ]);
          assert.equal(result, 'est');
        });

        it('Throws when String function has no arguments', () => {
          assert.throws(() => {
            instance._callNamespaceFunction(ctx, 'String', 'substr');
          });
        });
      });

      describe('_evalFunctions()', () => {
        let instance: VariablesProcessor;
        let ctx: Record<string, string>;
        before(async () => {
          instance = new VariablesProcessor();
          const vars = VariablesProcessor.createContextFromProperties(variables);
          ctx = await instance.buildContext(vars);
        });

        it('returns empty string when no argument', () => {
          const result = instance._evalFunctions(undefined as any, ctx);
          assert.equal(result, '');
        });

        it('calls the now()', () => {
          const result = instance._evalFunctions('now()', ctx);
          assert.isFalse(Number.isNaN(result));
        });

        it('calls the random()', () => {
          const result = instance._evalFunctions('random()', ctx);
          assert.isFalse(Number.isNaN(result));
        });

        it('calls the random() with groups', () => {
          const result = instance._evalFunctions('random(1) random(2) random(1)', ctx);
          const items = result.split(' ');
          assert.equal(items[0], items[2]);
        });

        it('calls the Math function', () => {
          const result = instance._evalFunctions('test Math.abs(-110)', ctx);
          assert.equal(result, 'test 110');
        });

        it('calls the String function', () => {
          const result = instance._evalFunctions('test String.toLowerCase(TEST)', ctx);
          assert.equal(result, 'test test');
        });

        it('calls the encodeURIComponent()', () => {
          const result = instance._evalFunctions('test encodeURIComponent(te s+t)', ctx);
          assert.equal(result, 'test te%20s%2Bt');
        });

        it('calls the decodeURIComponent()', () => {
          const result = instance._evalFunctions('test decodeURIComponent(te%20s%2Bt)', ctx);
          assert.equal(result, 'test te s+t');
        });
      });

      describe('_callFn()', () => {
        let instance: VariablesProcessor;
        let ctx: Record<string, string>;
        beforeEach(async () => {
          instance = new VariablesProcessor();
          const vars = VariablesProcessor.createContextFromProperties(variables);
          ctx = await instance.buildContext(vars);
        });

        it('Throws when function do not exists', () => {
          assert.throws(() => {
            instance._callFn(ctx, 'nonExisting');
          });
        });

        it('Throws when namespace function do not exists', () => {
          assert.throws(() => {
            instance._callFn(ctx, 'Something.nonExisting');
          });
        });

        it('Calls the EvalFunctions.Now() function', () => {
          const spy = sinon.spy(EvalFunctions, 'Now');
          instance._callFn(ctx, 'now');
          (EvalFunctions.Now as any).restore();
          assert.isTrue(spy.called);
        });

        it('Calls the EvalFunctions.Random() function', () => {
          const spy = sinon.spy(EvalFunctions, 'Random');
          instance._callFn(ctx, 'random');
          (EvalFunctions.Random as any).restore();
          assert.isTrue(spy.called);
        });

        it('Calls the EvalFunctions.EncodeURIComponent() function', () => {
          const spy = sinon.spy(EvalFunctions, 'EncodeURIComponent');
          instance._callFn(ctx, 'encodeURIComponent', ['a']);
          assert.isTrue(spy.called);
          spy.restore();
        });

        it('Calls the EvalFunctions.DecodeURIComponent() function', () => {
          const spy = sinon.spy(EvalFunctions, 'DecodeURIComponent');
          instance._callFn(ctx, 'decodeURIComponent', ['a']);
          assert.isTrue(spy.called);
          spy.restore();
        });

        it('Calls the Math.xxx() function', () => {
          const spy = sinon.spy(instance, '_callNamespaceFunction');
          instance._callFn(ctx, 'Math.abs', ['1']);
          assert.isTrue(spy.called);
          assert.deepEqual(spy.args[0][0], ctx, 'context is set');
          assert.equal(spy.args[0][1], 'Math', 'namespace is set');
          assert.equal(spy.args[0][2], 'abs', 'function name is set');
          assert.deepEqual(spy.args[0][3], ['1'], 'arguments is set');
        });

        it('Calls the String.xxx() function', () => {
          const spy = sinon.spy(instance, '_callNamespaceFunction');
          instance._callFn(ctx, 'String.substr', ['test', '1']);
          assert.isTrue(spy.called);
          assert.deepEqual(spy.args[0][0], ctx, 'context is set');
          assert.equal(spy.args[0][1], 'String', 'namespace is set');
          assert.equal(spy.args[0][2], 'substr', 'function name is set');
          assert.typeOf(spy.args[0][3], 'array', 'arguments is set');
        });
      });
    });
  });
});
