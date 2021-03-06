import { assert } from '@esm-bundle/chai';
import { DataEntity } from '../../../src/models/data/DataEntity.js';
import { DataModel } from '../../../src/models/data/DataModel.js';
import { DataNamespace } from '../../../src/models/data/DataNamespace.js';

const rfc2616Re = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), ([0-3][0-9]) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([0-9]{4}) ([01][0-9]|2[0-3])(:[0-5][0-9]){2} GMT$/;
const rfc3339Re = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/;
const dateRe = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const timeRe = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}$/;

describe('Generators', () => {
  describe('Data', () => {
    describe('DataEntityGenerator', () => {
      describe('Example generator', () => {
        describe('application/json', () => {
          const mime = 'application/json';

          describe('string', () => {
            let e1: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('string', 'p1');
              const result = e1.toExample(mime) as string;
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

              const result = e1.toExample(mime) as string;
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

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.typeOf(data.p1, 'string', 'has the property value');
              assert.isAtMost(data.p1.length, 10, 'has the maximum length');
            });
  
            it('returns an array when multiple property', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
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
              const result = e1.toExample(mime) as string;
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

              const result = e1.toExample(mime) as string;
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
              
              const result = e1.toExample(mime) as string;
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
              const result = e1.toExample(mime) as string;
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

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result as string);
              assert.typeOf(data.p1, 'string', 'has the property value');
              assert.isAtLeast(data.p1.length, 15, 'has the minimum length');
              assert.isAtMost(data.p1.length, 30, 'has the maximum length');
            });
          });

          describe('number', () => {
            let e1: DataEntity;
            
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
            
            // Note, this may randomly fail because the data generation library does not
            // guarantee to always generate a float (it does generate a float but with `.00` value).
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
              assert.isNotNaN(data);
              // const rest = data.p1 % 1;
              // assert.isAbove(rest, 0, 'module is above 0');
              // assert.isBelow(rest, 1, 'module is below 0');
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
              assert.isNotNaN(data.p1);
              // const rest = data.p1 % 1;
              // assert.isAbove(rest, 0, 'module is above 0');
              // assert.isBelow(rest, 1, 'module is below 0');
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

          describe('binary', () => {
            let e1: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('does not generate an example for a file', () => {
              e1.addTypedProperty('binary', 'p1');
              const result = e1.toExample(mime) as string;
              assert.equal(result, '{}');
            });

            // this could potentially generate a value
            it('does not generate an example for base64 binary format', () => {
              const p1 = e1.addTypedProperty('binary', 'p1');
              const adapted = p1.createAdapted();
              adapted.bindings = [
                {
                  type: 'web',
                  schema: {
                    format: 'binary',
                  }
                }
              ];
              const result = e1.toExample(mime) as string;
              assert.equal(result, '{}');
            });
          });

          describe('associations', () => {
            let d1: DataModel;
            let e1: DataEntity;
            let e2: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
              e2 = d1.addEntity('e2');
            });

            it('creates a property from an association', () => {
              e2.addTypedProperty('number', 'n1');
              e1.addTargetAssociation(e2.key, 'a1');

              const result = e1.toExample(mime) as string;

              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.a1, 'object', 'has the association property');
              assert.typeOf(data.a1.n1, 'number', 'has the association properties');
            });

            it('creates a deep association', () => {
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('integer', 'i1');
              e2.addTypedProperty('number', 'n1');
              e1.addTargetAssociation(e2.key, 'a1');
              e2.addTargetAssociation(e3.key, 'a2');

              const result = e1.toExample(mime) as string;

              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.a1, 'object', 'has the association property');
              assert.typeOf(data.a1.n1, 'number', 'has the association properties');
              assert.typeOf(data.a1.a2, 'object', 'has a deep association');
              assert.typeOf(data.a1.a2.i1, 'number', 'has a deep association property');
            });

            it('does not make associations to self (recursive #1)', () => {
              e1.addTargetAssociation(e1.key, 'a1');
              const result = e1.toExample(mime) as string;
              assert.equal(result, '{}');
            });

            it('does not make recursive associations (recursive #2)', () => {
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('integer', 'i1');
              e2.addTypedProperty('number', 'n1');
              e1.addTargetAssociation(e2.key, 'a1');
              e2.addTargetAssociation(e3.key, 'a2');
              e3.addTargetAssociation(e1.key, 'a3');

              const result = e1.toExample(mime) as string;
              
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.a1, 'object', 'has the association property');
              assert.typeOf(data.a1.n1, 'number', 'has the association properties');
              assert.typeOf(data.a1.a2, 'object', 'has a deep association');
              assert.typeOf(data.a1.a2.i1, 'number', 'has a deep association property');
              assert.isUndefined(data.a1.a2.a3, 'has no recursive property');
            });

            it('returns the default union result', () => {
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('integer', 'i1');
              e2.addTypedProperty('string', 's1');
              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key)

              const result = e1.toExample(mime) as string;
              
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.a1, 'object', 'has the association property');
              assert.typeOf(data.a1.s1, 'string', 'has the association properties');
            });

            it('returns the default union result with multiple', () => {
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('integer', 'i1');
              e2.addTypedProperty('string', 's1');
              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key);
              a1.multiple = true;

              const result = e1.toExample(mime) as string;
              
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.a1, 'array', 'has the association property as an array');
              const [prop] = data.a1;
              assert.typeOf(prop, 'object', 'has the item in the array');
              assert.typeOf(prop.s1, 'string', 'has the association properties');
            });

            it('returns the schema for anyOf union', () => {
              const e3 = d1.addEntity('e3');
              
              e2.addTypedProperty('string', 's1');
              e3.addTypedProperty('integer', 'i1');

              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key);

              const adapted = a1.createAdapted();
              adapted.schema = { unionType: 'anyOf' };

              const result = e1.toExample(mime) as string;
              
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.a1, 'object', 'has the association property');
              assert.typeOf(data.a1.s1, 'string', 'has the association properties');
              assert.isUndefined(data.a1.i1, 'has no other association target');
            });

            it('returns the schema for allOf union', () => {
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('integer', 'i1');
              e2.addTypedProperty('string', 's1');
              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key);
              const adapted = a1.createAdapted();
              adapted.schema = { unionType: 'allOf' };

              const result = e1.toExample(mime) as string;
              
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.a1, 'object', 'has the association property');
              assert.typeOf(data.a1.s1, 'string', 'has the association properties');
              assert.typeOf(data.a1.i1, 'number', 'has all association targets');
            });

            it('returns the schema for oneOf union', () => {
              const e3 = d1.addEntity('e3');
              
              e2.addTypedProperty('string', 's1');
              e3.addTypedProperty('integer', 'i1');

              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key);

              const adapted = a1.createAdapted();
              adapted.schema = { unionType: 'oneOf' };

              const result = e1.toExample(mime) as string;
              
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.a1, 'object', 'has the association property');
              assert.typeOf(data.a1.s1, 'string', 'has the association properties');
              assert.isUndefined(data.a1.i1, 'has no other association target');
            });

            it('returns the schema for oneOf union with selected shape', () => {
              const e3 = d1.addEntity('e3');
              
              e2.addTypedProperty('string', 's1');
              e3.addTypedProperty('integer', 'i1');

              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key);

              const adapted = a1.createAdapted();
              adapted.schema = { unionType: 'oneOf' };

              const result = e1.toExample(mime) as string;
              
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.a1, 'object', 'has the association property');
              assert.typeOf(data.a1.s1, 'string', 'has the association properties');
              assert.isUndefined(data.a1.i1, 'has no other association target');
            });
          });

          describe('parents', () => {
            let d1: DataModel;
            let e1: DataEntity;
            let e2: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
              e2 = d1.addEntity('e2');
            });

            it('inherits parent properties', () => {
              e1.addTypedProperty('number', 'p1');
              e2.parents.push(e1.key);
              const result = e2.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'number', 'has the parent property');
            });

            it('inherits parent properties and combines with own', () => {
              e1.addTypedProperty('number', 'p1');
              e2.addTypedProperty('string', 'p2');
              e2.parents.push(e1.key);

              const result = e2.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'number', 'has the parent property');
              assert.typeOf(data.p2, 'string', 'has own property');
            });

            it('inherits parent properties and combines with own association', () => {
              e1.addTypedProperty('number', 'p1');
              e2.addTypedProperty('string', 'p2');
              e2.parents.push(e1.key);
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('string', 'p3');
              e2.addTargetAssociation(e3.key, 'a1');

              const result = e2.toExample(mime) as string;

              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'number', 'has the parent property');
              assert.typeOf(data.p2, 'string', 'has own property');
              assert.typeOf(data.a1, 'object', 'has own association');
              assert.typeOf(data.a1.p3, 'string', 'has association property');
            });

            it('inherits parent properties with parent association', () => {
              e1.addTypedProperty('number', 'p1');
              e2.addTypedProperty('string', 'p2');
              e2.parents.push(e1.key);
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('string', 'p3');
              e1.addTargetAssociation(e3.key, 'a1');

              const result = e2.toExample(mime) as string;

              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'number', 'has the parent property');
              assert.typeOf(data.p2, 'string', 'has own property');
              assert.typeOf(data.a1, 'object', 'has own association');
              assert.typeOf(data.a1.p3, 'string', 'has association property');
            });

            it('shadows properties', () => {
              e1.addTypedProperty('number', 'p1');
              e2.addTypedProperty('string', 'p1');
              e2.parents.push(e1.key);
              const result = e2.toExample(mime) as string;

              assert.typeOf(result, 'string', 'result is a string');
              const data = JSON.parse(result);
              assert.typeOf(data.p1, 'string', 'overwrites parent property');
            });
          });
        });

        describe('application/xml', () => {
          const mime = 'application/xml';

          describe('string', () => {
            let e1: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('string', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              assert.isNotEmpty(inner.textContent.trim(), 'has the generated content');
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

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);

              const inner = schema.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();
              assert.isAtLeast(value.length, 10, 'has the minimum length');
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

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              const inner = schema.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();
              assert.isAtMost(value.length, 10, 'has the maximum length');
            });
  
            it('returns an array when multiple property', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              
              assert.typeOf(result, 'string', 'result is a string');

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              assert.lengthOf(schema.querySelectorAll('e1'), 1, 'has the parent');
              assert.lengthOf(schema.querySelectorAll('e1 p1'), 1, 'has only one property');
              const inner = schema.querySelector('p1');
              const value = inner.textContent.trim();
              assert.isAtMost(value.length, 10, 'has the maximum length');
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
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              assert.lengthOf(schema.querySelectorAll('e1'), 1, 'has the parent');
              assert.lengthOf(schema.querySelectorAll('e1 p1'), 1, 'has only one property');
              const inner = schema.querySelector('p1');
              const value = inner.textContent.trim();
              assert.equal(value, 'test123', 'has the example value');
            });
  
            it('returns all example values with multiple property', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['test123', '123test'],
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              const ps = schema.querySelectorAll('p1');
              assert.lengthOf(ps, 2, 'has an example');
              assert.equal(ps[0].textContent!.trim(), 'test123');
              assert.equal(ps[1].textContent!.trim(), '123test');
            });
  
            it('returns the default value when defined', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: 'testDf123',
              };
              
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);

              assert.lengthOf(schema.querySelectorAll('e1'), 1, 'has the parent');
              assert.lengthOf(schema.querySelectorAll('e1 p1'), 1, 'has only one property');
              const inner = schema.querySelector('p1');
              const value = inner.textContent.trim();
              assert.equal(value, 'testDf123', 'has the default value');
              
            });
  
            it('returns the default value when multiple property', () => {
              const p1 = e1.addTypedProperty('string', 'p1');
              p1.multiple = true;
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: 'testDf123',
              };
              const result = e1.toExample(mime) as string;
              
              assert.typeOf(result, 'string', 'result is a string');
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              assert.lengthOf(schema.querySelectorAll('e1'), 1, 'has the parent');
              assert.lengthOf(schema.querySelectorAll('e1 p1'), 1, 'has only one property');
              const inner = schema.querySelector('p1');
              const value = inner.textContent.trim();
              assert.equal(value, 'testDf123', 'has the default value');
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

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);

              assert.lengthOf(schema.querySelectorAll('e1'), 1, 'has the parent');
              assert.lengthOf(schema.querySelectorAll('e1 p1'), 1, 'has only one property');
              const inner = schema.querySelector('p1');
              const value = inner.textContent.trim();

              assert.isAtLeast(value.length, 15, 'has the minimum length');
              assert.isAtMost(value.length, 30, 'has the maximum length');
            });
          });

          describe('number', () => {
            let e1: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example value', () => {
              e1.addTypedProperty('number', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              assert.match(inner.textContent.trim(), /^\d+$/, 'has the property number');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());
              assert.isAtLeast(value, 10, 'has the minimum length');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());
              assert.isAtMost(value, 10, 'has the maximum length');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.isAtLeast(value, 5, 'has the minimum length');
              assert.isAtMost(value, 10, 'has the maximum length');
            });
            
            // Note, this may randomly fail because the data generation library does not
            // guarantee to always generate a float (it does generate a float but with `.00` value).
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());
              assert.isNotNaN(value);
              // const rest = value % 1;
              // assert.isAbove(rest, 0, 'module is above 0');
              // assert.isBelow(rest, 1, 'module is below 0');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());
              assert.isNotNaN(value);
              // const rest = value % 1;
              // assert.isAbove(rest, 0, 'module is above 0');
              // assert.isBelow(rest, 1, 'module is below 0');
            });
  
            it('returns an array number property when multiple property', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());
              assert.isNotNaN(value);
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

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());
              assert.equal(value % 5, 0, 'has a value multipliable by 5');
            });
  
            it('returns the example value', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['1', '2', '3'],
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.equal(value, 1, 'has the first example');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              
              const params = outer.querySelectorAll('p1');
              assert.lengthOf(params, 3, 'has all example values');
              assert.equal(params[0].textContent!.trim(), '1');
              assert.equal(params[1].textContent!.trim(), '2');
              assert.equal(params[2].textContent!.trim(), '3');
            });

            it('returns the default value', () => {
              const p1 = e1.addTypedProperty('number', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '123',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.equal(value, 123, 'has the first example');
            });
          });

          describe('integer', () => {
            let e1: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example value', () => {
              e1.addTypedProperty('integer', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.typeOf(value, 'number', 'has the property number');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.isAtLeast(value, 10, 'has the minimum length');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.isAtMost(value, 10, 'has the maximum length');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.isAtLeast(value, 5, 'has the minimum length');
              assert.isAtMost(value, 10, 'has the maximum length');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              const rest = value % 1;
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              const rest = value % 1;
              assert.equal(rest, 0, 'module is 0');
            });
  
            it('returns an array number property when multiple property', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.typeOf(value, 'number', 'has a final value correct type');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.equal(value % 5, 0, 'has a value multipliable by 5');
            });
  
            it('returns the example value', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['1', '2', '3'],
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.equal(value, 1, 'has the first example');
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

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              
              const params = outer.querySelectorAll('p1');
              assert.lengthOf(params, 3, 'has all example values');
              assert.equal(params[0].textContent!.trim(), '1');
              assert.equal(params[1].textContent!.trim(), '2');
              assert.equal(params[2].textContent!.trim(), '3');
            });

            it('returns the default value', () => {
              const p1 = e1.addTypedProperty('integer', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '123',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = Number(inner.textContent.trim());

              assert.deepEqual(value, 123, 'has the first example');
            });
          });

          describe('date', () => {
            let e1: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('date', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();
              
              assert.match(value, dateRe);
            });

            it('generates an example with the multiple property', () => {
              const p1 = e1.addTypedProperty('date', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.match(value, dateRe);
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();
              
              assert.equal(value, '2022-08-08');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();
              
              assert.equal(value, '2022-08-08');
            });

            it('returns the example value', () => {
              const p1 = e1.addTypedProperty('date', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['2022-08-08', '2022-08-09']
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.equal(value, '2022-08-08');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const properties = outer.querySelectorAll('p1');
              assert.lengthOf(properties, 2, 'has both examples')

              assert.equal(properties[0].textContent!.trim(), '2022-08-08');
              assert.equal(properties[1].textContent!.trim(), '2022-08-09');
            });
          });

          describe('datetime', () => {
            let e1: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example with default format', () => {
              e1.addTypedProperty('datetime', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.match(value, rfc3339Re);
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.match(value, rfc3339Re);
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.match(value, rfc2616Re);
            });

            it('returns the default value', () => {
              const p1 = e1.addTypedProperty('datetime', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '2036-01-04T19:49:30.224Z',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.equal(value, '2036-01-04T19:49:30.224Z');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.equal(value, '2036-01-04T19:49:30.224Z');
            });

            it('returns the example value', () => {
              const p1 = e1.addTypedProperty('datetime', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['2036-01-04T19:49:30.224Z', '2036-01-05T19:49:30.224Z']
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.equal(value, '2036-01-04T19:49:30.224Z');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const params = outer.querySelectorAll('p1');
              assert.lengthOf(params, 2, 'has both example values');

              assert.deepEqual(params[0].textContent.trim(), '2036-01-04T19:49:30.224Z');
              assert.deepEqual(params[1].textContent.trim(), '2036-01-05T19:49:30.224Z');
            });
          });

          describe('time', () => {
            let e1: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('time', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.match(value, timeRe);
            });

            it('generates an example with multiple property', () => {
              const p1 = e1.addTypedProperty('time', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.match(value, timeRe);
            });

            it('returns the default value', () => {
              const p1 = e1.addTypedProperty('time', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                defaultValue: '2080-02-04T09:39:13',
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.equal(value, '2080-02-04T09:39:13');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.deepEqual(value, '2080-02-04T09:39:13');
            });

            it('returns the example value', () => {
              const p1 = e1.addTypedProperty('time', 'p1');
              const adapted = p1.createAdapted();
              adapted.schema = {
                examples: ['2080-02-04T09:39:13', '2080-02-05T09:39:13']
              };
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.equal(value, '2080-02-04T09:39:13');
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
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const params = outer.querySelectorAll('p1');
              assert.lengthOf(params, 2, 'has both example values')
              
              assert.equal(params[0].textContent.trim(), '2080-02-04T09:39:13');
              assert.equal(params[1].textContent.trim(), '2080-02-05T09:39:13');
            });
          });

          describe('boolean', () => {
            let e1: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('boolean', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.match(value, /^true|false$/, 'has the boolean value');
            });

            it('generates an example with multiple property', () => {
              const p1 = e1.addTypedProperty('boolean', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.match(value, /^true|false$/, 'has the boolean value');
            });
          });

          describe('nil', () => {
            let e1: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              const d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
            });

            it('generates an example', () => {
              e1.addTypedProperty('nil', 'p1');
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.isEmpty(value);
            });

            it('generates an example with multiple property', () => {
              const p1 = e1.addTypedProperty('nil', 'p1');
              p1.multiple = true;
              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              const inner = outer.querySelector('p1');
              assert.ok(inner, 'has the inner element');
              const value = inner.textContent.trim();

              assert.isEmpty(value);
            });
          });

          describe('associations', () => {
            let d1: DataModel;
            let e1: DataEntity;
            let e2: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
              e2 = d1.addEntity('e2');
            });

            it('creates a property from an association', () => {
              e2.addTypedProperty('number', 'n1');
              e1.addTargetAssociation(e2.key, 'a1');

              const result = e1.toExample(mime) as string;

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              
              const a1Element = outer.querySelector('a1');
              assert.ok(a1Element, 'has the association as Element');
              
              const n1Element = a1Element.querySelector('n1');
              assert.ok(n1Element, 'has the target property as element');

              assert.match(n1Element.textContent.trim(), /^\d+$/, 'has the association properties');
            });

            it('creates a deep association', () => {
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('integer', 'i1');
              e2.addTypedProperty('number', 'n1');
              e1.addTargetAssociation(e2.key, 'a1');
              e2.addTargetAssociation(e3.key, 'a2');

              const result = e1.toExample(mime) as string;

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e1');
              assert.ok(outer, 'has the outer element');
              
              const a1Element = outer.querySelector('a1');
              assert.ok(a1Element, 'has the association as Element');
              
              const n1Element = a1Element.querySelector('n1');
              assert.ok(n1Element, 'has the target property as element');

              assert.match(n1Element.textContent.trim(), /^\d+$/, 'has the association properties');

              const a2Element = a1Element.querySelector('a2');
              assert.ok(a2Element, 'has the deep association as Element');

              const i1Element = a2Element.querySelector('i1');
              assert.ok(i1Element, 'has the deep target property as element');

              assert.match(i1Element.textContent.trim(), /^\d+$/, 'has the association properties');
            });

            it('does not make associations to self (recursive #1)', () => {
              e1.addTargetAssociation(e1.key, 'a1');
              const result = e1.toExample(mime) as string;
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const elements = schema.querySelectorAll('e1');
              assert.lengthOf(elements, 1)
            });

            it('does not make recursive associations (recursive #2)', () => {
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('integer', 'i1');
              e2.addTypedProperty('number', 'n1');
              e1.addTargetAssociation(e2.key, 'a1');
              e2.addTargetAssociation(e3.key, 'a2');
              e3.addTargetAssociation(e1.key, 'a3');

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);

              const a3Element = schema.querySelectorAll('a3');
              assert.lengthOf(a3Element, 0);
            });

            it('returns the default union result', () => {
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('integer', 'i1');
              e2.addTypedProperty('string', 's1');
              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key)

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);

              const s1Element = schema.querySelector('e1 a1 s1');
              assert.ok(s1Element);
            });

            // it('returns the default union result with multiple', () => {
            //   const e3 = d1.addEntity('e3');
            //   e3.addTypedProperty('integer', 'i1');
            //   e2.addTypedProperty('string', 's1');
            //   const a1 = e1.addTargetAssociation(e2.key, 'a1');
            //   a1.addTarget(e3.key);
            //   a1.multiple = true;

            //   const result = e1.toExample(mime) as string;
            //   assert.typeOf(result, 'string', 'result is a string');
              
            //   const parser = new DOMParser();
            //   const schema = parser.parseFromString(result, mime);
            //   console.log(result);

            //   const data = JSON.parse(result);
            //   assert.typeOf(data.a1, 'array', 'has the association property as an array');
            //   const [prop] = data.a1;
            //   assert.typeOf(prop, 'object', 'has the item in the array');
            //   assert.typeOf(prop.s1, 'string', 'has the association properties');
            // });

            it('returns the schema for anyOf union', () => {
              const e3 = d1.addEntity('e3');
              
              e2.addTypedProperty('string', 's1');
              e3.addTypedProperty('integer', 'i1');

              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key);

              const adapted = a1.createAdapted();
              adapted.schema = { unionType: 'anyOf' };

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);

              const s1Element = schema.querySelector('e1 a1 s1');
              assert.ok(s1Element);

              const i1Element = schema.querySelector('e1 a1 i1');
              assert.notOk(i1Element);
            });

            it.skip('returns the schema for allOf union', () => {
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('integer', 'i1');
              e2.addTypedProperty('string', 's1');
              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key);
              const adapted = a1.createAdapted();
              adapted.schema = { unionType: 'allOf' };

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              // const parser = new DOMParser();
              // const schema = parser.parseFromString(result, mime);
              // console.log(result);
              

              // assert.typeOf(data.a1, 'object', 'has the association property');
              // assert.typeOf(data.a1.s1, 'string', 'has the association properties');
              // assert.typeOf(data.a1.i1, 'number', 'has all association targets');
            });

            it.skip('returns the schema for oneOf union', () => {
              const e3 = d1.addEntity('e3');
              
              e2.addTypedProperty('string', 's1');
              e3.addTypedProperty('integer', 'i1');

              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key);

              const adapted = a1.createAdapted();
              adapted.schema = { unionType: 'oneOf' };

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              // const parser = new DOMParser();
              // const schema = parser.parseFromString(result, mime);
              // console.log(result);

              // assert.typeOf(data.a1, 'object', 'has the association property');
              // assert.typeOf(data.a1.s1, 'string', 'has the association properties');
              // assert.isUndefined(data.a1.i1, 'has no other association target');
            });

            it.skip('returns the schema for oneOf union with selected shape', () => {
              const e3 = d1.addEntity('e3');
              
              e2.addTypedProperty('string', 's1');
              e3.addTypedProperty('integer', 'i1');

              const a1 = e1.addTargetAssociation(e2.key, 'a1');
              a1.addTarget(e3.key);

              const adapted = a1.createAdapted();
              adapted.schema = { unionType: 'oneOf' };

              const result = e1.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              // const parser = new DOMParser();
              // const schema = parser.parseFromString(result, mime);
              // console.log(result);

              // assert.typeOf(data.a1, 'object', 'has the association property');
              // assert.typeOf(data.a1.s1, 'string', 'has the association properties');
              // assert.isUndefined(data.a1.i1, 'has no other association target');
            });
          });

          describe('parents', () => {
            let d1: DataModel;
            let e1: DataEntity;
            let e2: DataEntity;
            
            beforeEach(() => {
              const ns = new DataNamespace();
              d1 = ns.addDataModel('d1');
              e1 = d1.addEntity('e1');
              e2 = d1.addEntity('e2');
            });

            it('inherits parent properties', () => {
              e1.addTypedProperty('number', 'p1');
              e2.parents.push(e1.key);
              const result = e2.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e2');
              const p1Element = outer.querySelector('p1');
              
              assert.ok(p1Element, 'has the parent property');
            });

            it('inherits parent properties and combines with own', () => {
              e1.addTypedProperty('number', 'p1');
              e2.addTypedProperty('string', 'p2');
              e2.parents.push(e1.key);

              const result = e2.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');
              
              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e2');
              const p1Element = outer.querySelector('p1');
              const p2Element = outer.querySelector('p2');
              
              assert.ok(p1Element, 'has the parent property');
              assert.ok(p2Element, 'has own property');

              // assert.typeOf(data.p1, 'number', 'has the parent property');
              // assert.typeOf(data.p2, 'string', 'has own property');
            });

            it('inherits parent properties and combines with own association', () => {
              e1.addTypedProperty('number', 'p1');
              e2.addTypedProperty('string', 'p2');
              e2.parents.push(e1.key);
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('string', 'p3');
              e2.addTargetAssociation(e3.key, 'a1');

              const result = e2.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e2');
              const p1Element = outer.querySelector('p1');
              const p2Element = outer.querySelector('p2');
              const a1Element = outer.querySelector('a1');

              assert.ok(p1Element, 'has the parent property');
              assert.ok(p2Element, 'has own property');
              assert.ok(a1Element, 'has own association');
              
              const p3Element = a1Element.querySelector('p3');
              assert.ok(p3Element, 'has association property');

              // assert.typeOf(data.p1, 'number', 'has the parent property');
              // assert.typeOf(data.p2, 'string', 'has own property');
              // assert.typeOf(data.a1, 'object', 'has own association');
              // assert.typeOf(data.a1.p3, 'string', 'has association property');
            });

            it('inherits parent properties with parent association', () => {
              e1.addTypedProperty('number', 'p1');
              e2.addTypedProperty('string', 'p2');
              e2.parents.push(e1.key);
              const e3 = d1.addEntity('e3');
              e3.addTypedProperty('string', 'p3');
              e1.addTargetAssociation(e3.key, 'a1');

              const result = e2.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e2');
              const p1Element = outer.querySelector('p1');
              const p2Element = outer.querySelector('p2');
              const a1Element = outer.querySelector('a1');

              assert.ok(p1Element, 'has the parent property');
              assert.ok(p2Element, 'has own property');
              assert.ok(a1Element, 'has own association');
              
              const p3Element = a1Element.querySelector('p3');
              assert.ok(p3Element, 'has association property');

              // assert.typeOf(data.p1, 'number', 'has the parent property');
              // assert.typeOf(data.p2, 'string', 'has own property');
              // assert.typeOf(data.a1, 'object', 'has own association');
              // assert.typeOf(data.a1.p3, 'string', 'has association property');
            });

            it('shadows properties', () => {
              e1.addTypedProperty('number', 'p1');
              e2.addTypedProperty('string', 'p1');
              e2.parents.push(e1.key);
              const result = e2.toExample(mime) as string;
              assert.typeOf(result, 'string', 'result is a string');

              const parser = new DOMParser();
              const schema = parser.parseFromString(result, mime);
              
              const outer = schema.querySelector('e2');
              const p1Element = outer.querySelector('p1');
              assert.ok(p1Element, 'has the parent property');
              const value = Number(p1Element.textContent.trim());
              assert.isNaN(value);
            });
          });
        });
      });
    });
  });
});
