import { assert } from '@esm-bundle/chai';
import { DataEntity } from '../../src/models/data/DataEntity.js';
import { DataNamespace } from '../../src/models/data/DataNamespace.js';

const rfc2616Re = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), ([0-3][0-9]) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([0-9]{4}) ([01][0-9]|2[0-3])(:[0-5][0-9]){2} GMT$/;
const rfc3339Re = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/;
const dateRe = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const timeRe = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}$/;

describe('Generators', () => {
  describe('Data', () => {
    describe('DataEntityGenerator', () => {
      describe('Example generator', () => {
        describe('application/json', () => {
          describe('string', () => {
            let e1: DataEntity;
            const mime = 'application/json';
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('string', 'p1');
              const result = e1.toExample(mime);
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.typeOf(data.p1, 'string', 'has the property value');
            });
  
            it('has min length with schema', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    minLength: 10,
                  }
                }
              ];

              const result = e1.toExample(mime);
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.typeOf(data.p1, 'string', 'has the property value');
              assert.isAtLeast(data.p1.length, 10, 'has the minimum length');
            });
  
            it('has max length with schema', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    maxLength: 10,
                  }
                }
              ];

              const result = e1.toExample(mime);
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.typeOf(data.p1, 'string', 'has the property value');
              assert.isAtMost(data.p1.length, 10, 'has the maximum length');
            });
  
            it('returns an array when multiple property', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime);
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.typeOf(data.p1, 'array', 'has the array value');
              assert.lengthOf(data.p1, 1, 'has a single value');
              assert.typeOf(data.p1[0], 'string', 'has a final value correct type');
            });
  
            it('returns example value when defined on the mime type scheme', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    minLength: 1,
                    maxLength: 3,
                  }
                }
              ];
              adapted.schema = {
                examples: ['test123'],
              };
              const result = e1.toExample(mime);
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.equal(data.p1, 'test123', 'has the example value');
            });
  
            it('returns all example values with multiple property', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['test123', '123test'],
              };

              const result = e1.toExample(mime);
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.deepEqual(data.p1, ['test123', '123test'], 'has the examples value');
            });
  
            it('returns the default value when defined', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: 'test123',
              };
              
              const result = e1.toExample(mime);
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.deepEqual(data.p1, 'test123', 'has the default value');
            });
  
            it('returns the default value when multiple property', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: 'test123',
              };
              const result = e1.toExample(mime);
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.deepEqual(data.p1, ['test123'], 'has the default value');
            });
  
            it('respects both the min and max length', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    minLength: 15,
                    maxLength: 30,
                  }
                }
              ];

              const result = e1.toExample(mime);
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.typeOf(data.p1, 'string', 'has the property value');
              assert.isAtLeast(data.p1.length, 15, 'has the minimum length');
              assert.isAtMost(data.p1.length, 30, 'has the maximum length');
            });
          });

          describe('number', () => {
            let e1: DataEntity;
            const mime = 'application/json';
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example value', () => {
              e1.addTypedProperty('number', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'number', 'has the property number');
            });
  
            it('has the minimum value', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    minimum: 10,
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.isAtLeast(data.p1, 10, 'has the minimum length');
            });
  
            it('has the maximum value', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    maximum: 10,
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.isAtMost(data.p1, 10, 'has the maximum length');
            });
  
            it('respects both the min and max', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    minimum: 5,
                    maximum: 10,
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.isAtLeast(data.p1, 5, 'has the minimum length');
              assert.isAtMost(data.p1, 10, 'has the maximum length');
            });
  
            it('generates a floating-point number for a float format', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    format: 'float'
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              const rest = data.p1 % 1;
              assert.isAbove(rest, 0, 'module is above 0');
              assert.isBelow(rest, 1, 'module is below 0');
            });
  
            it('generates a floating-point number for a double format', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    format: 'double'
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              const rest = data.p1 % 1;
              assert.isAbove(rest, 0, 'module is above 0');
              assert.isBelow(rest, 1, 'module is below 0');
            });
  
            (['uint32', 'uint64', 'fixed32', 'fixed64']).forEach((format) => {
              it(`generates an unsigned number for ${format} format`, () => {
                const p1 = e1.addTypedProperty('number', 'p1');
                const adapted = p1.createAdapted();
                adapted.bindings = [
                  {
                    type: 'web',
                    schema: {
                      format,
                      minimum: -100,
                      maximum: -10,
                    }
                  }
                ];

                const result = e1.toExample(mime) as string;
                assert.typeOf(result, 'string', 'result is a string');
                const data = JSON.parse(result);
                assert.isAbove(data.p1, 0, 'module is above 0');
              });
            });
  
            it('returns an array number property when multiple property', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'array', 'has the array value');
              assert.lengthOf(data.p1, 1, 'has a single value');
              assert.typeOf(data.p1[0], 'number', 'has a final value correct type');
            });
  
            it('respects the "multipleOf" schema property', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    multipleOf: 5,
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.equal(data.p1 % 5, 0, 'has a value multipliable by 5');
            });
  
            it('returns the example value', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['1', '2', '3'],
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.equal(data.p1, 1, 'has the first example');
            });

            it('returns all examples when multiple property', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['1', '2', '3'],
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.deepEqual(data.p1, [1, 2, 3], 'has the first example');
            });

            it('returns the default value', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '123',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.deepEqual(data.p1, 123, 'has the first example');
            });
          });

          describe('integer', () => {
            let e1: DataEntity;
            const mime = 'application/json';
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example value', () => {
              e1.addTypedProperty('integer', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'number', 'has the property number');
            });
  
            it('has the minimum value', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    minimum: 10,
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.isAtLeast(data.p1, 10, 'has the minimum length');
            });
  
            it('has the maximum value', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    maximum: 10,
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.isAtMost(data.p1, 10, 'has the maximum length');
            });
  
            it('respects both the min and max', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    minimum: 5,
                    maximum: 10,
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.isAtLeast(data.p1, 5, 'has the minimum length');
              assert.isAtMost(data.p1, 10, 'has the maximum length');
            });
  
            it('generates an integer for an int32 format', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    format: 'int32'
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              const rest = data.p1 % 1;
              assert.equal(rest, 0, 'module is 0');
            });
  
            it('generates an integer for an int64 format', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    format: 'int64'
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              const rest = data.p1 % 1;
              assert.equal(rest, 0, 'module is 0');
            });
  
            it('returns an array number property when multiple property', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'array', 'has the array value');
              assert.lengthOf(data.p1, 1, 'has a single value');
              assert.typeOf(data.p1[0], 'number', 'has a final value correct type');
            });
  
            it('respects the "multipleOf" schema property', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    multipleOf: 5,
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.equal(data.p1 % 5, 0, 'has a value multipliable by 5');
            });
  
            it('returns the example value', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['1', '2', '3'],
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.equal(data.p1, 1, 'has the first example');
            });

            it('returns all examples when multiple property', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['1', '2', '3'],
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.deepEqual(data.p1, [1, 2, 3], 'has the first example');
            });

            it('returns the default value', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '123',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.deepEqual(data.p1, 123, 'has the first example');
            });
          });

          describe('date', () => {
            let e1: DataEntity;
            const mime = 'application/json';
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('date', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'string', 'has the string value');
              assert.match(data.p1, dateRe);
            });

            it('generates an example with the multiple property', () => {
              const p1 = e1.addTypedProperty('date', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'array', 'has the array value');
              assert.lengthOf(data.p1, 1, 'has a single value');
              assert.match(data.p1[0], dateRe);
            });

            it('returns the default value', () => {
              const p1 = e1.addTypedProperty('date', 'p1');
              p1.type = 'date';
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '2022-08-08',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.equal(data.p1, '2022-08-08');
            });

            it('returns the default value as array with multiple property', () => {
              const p1 = e1.addTypedProperty('date', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '2022-08-08',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.deepEqual(data.p1, ['2022-08-08']);
            });

            it('returns the example value', () => {
              const p1 = e1.addTypedProperty('date', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['2022-08-08', '2022-08-09']
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.equal(data.p1, '2022-08-08');
            });

            it('returns the default value as array with multiple property', () => {
              const p1 = e1.addTypedProperty('date', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['2022-08-08', '2022-08-09']
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.deepEqual(data.p1, ['2022-08-08', '2022-08-09']);
            });
          });

          describe('datetime', () => {
            let e1: DataEntity;
            const mime = 'application/json';
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example with default format', () => {
              e1.addTypedProperty('datetime', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'string', 'has the string value');
              assert.match(data.p1, rfc3339Re);
            });

            it('generates an example for the rfc3339 format', () => {
              const p1 = e1.addTypedProperty('datetime', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    format: 'rfc3339'
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'string', 'has the string value');
              assert.match(data.p1, rfc3339Re);
            });

            it('generates an example for rfc2616 format', () => {
              const p1 = e1.addTypedProperty('datetime', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    format: 'rfc2616'
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'string', 'has the string value');
              assert.match(data.p1, rfc2616Re);
            });

            it('returns the default value', () => {
              const p1 = e1.addTypedProperty('datetime', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '2036-01-04T19:49:30.224Z',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.equal(data.p1, '2036-01-04T19:49:30.224Z');
            });

            it('returns the default value as array with multiple property', () => {
              const p1 = e1.addTypedProperty('datetime', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '2036-01-04T19:49:30.224Z',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.deepEqual(data.p1, ['2036-01-04T19:49:30.224Z']);
            });

            it('returns the example value', () => {
              const p1 = e1.addTypedProperty('datetime', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['2036-01-04T19:49:30.224Z', '2036-01-05T19:49:30.224Z']
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.equal(data.p1, '2036-01-04T19:49:30.224Z');
            });

            it('returns the default value as array with multiple property', () => {
              const p1 = e1.addTypedProperty('datetime', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['2036-01-04T19:49:30.224Z', '2036-01-05T19:49:30.224Z']
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.deepEqual(data.p1, ['2036-01-04T19:49:30.224Z', '2036-01-05T19:49:30.224Z']);
            });
          });

          describe('time', () => {
            let e1: DataEntity;
            const mime = 'application/json';
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('time', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'string', 'has the string value');
              assert.match(data.p1, timeRe);
            });

            it('generates an example with multiple property', () => {
              const p1 = e1.addTypedProperty('time', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'array', 'has the array value');
              assert.lengthOf(data.p1, 1, 'has a single value');
              assert.match(data.p1[0], timeRe);
            });

            it('returns the default value', () => {
              const p1 = e1.addTypedProperty('time', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '2080-02-04T09:39:13',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.equal(data.p1, '2080-02-04T09:39:13');
            });

            it('returns the default value as array with multiple property', () => {
              const p1 = e1.addTypedProperty('time', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '2080-02-04T09:39:13',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.deepEqual(data.p1, ['2080-02-04T09:39:13']);
            });

            it('returns the example value', () => {
              const p1 = e1.addTypedProperty('time', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['2080-02-04T09:39:13', '2080-02-05T09:39:13']
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.equal(data.p1, '2080-02-04T09:39:13');
            });

            it('returns the default value as array with multiple property', () => {
              const p1 = e1.addTypedProperty('time', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['2080-02-04T09:39:13', '2080-02-05T09:39:13']
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.deepEqual(data.p1, ['2080-02-04T09:39:13', '2080-02-05T09:39:13']);
            });
          });

          describe('boolean', () => {
            let e1: DataEntity;
            const mime = 'application/json';
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('boolean', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'boolean', 'has the boolean value');
            });

            it('generates an example with multiple property', () => {
              const p1 = e1.addTypedProperty('boolean', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'array', 'has the array value');
              assert.lengthOf(data.p1, 1, 'has a single value');
              assert.typeOf(data.p1[0], 'boolean', 'has the final value type');
            });
          });

          describe('nil', () => {
            let e1: DataEntity;
            const mime = 'application/json';
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('nil', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'null', 'has the null value');
            });

            it('generates an example with multiple property', () => {
              const p1 = e1.addTypedProperty('nil', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'array', 'has the array value');
              assert.lengthOf(data.p1, 1, 'has a single value');
              assert.typeOf(data.p1[0], 'null', 'has the final value type');
            });
          });
        });
      });
    });
  });
});
