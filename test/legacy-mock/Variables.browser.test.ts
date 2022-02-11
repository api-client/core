import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Variables } from '../../src/mocking/legacy/Variables.js';

describe('Variables', () => {
  describe('variable()', () => {
    let variables: Variables;

    before(() => { variables = new Variables(); });

    it('returns an object', () => {
      const result = variables.variable();
      assert.typeOf(result, 'object');
    });

    [
      ['enabled', 'boolean'],
      ['value', 'string'],
      ['name', 'string'],
      ['_id', 'string'],
      ['environment', 'string']
    ].forEach((item) => {
      it(`has the ${item[0]} property of a type ${item[1]}`, () => {
        const result = variables.variable();
        assert.typeOf(result[item[0]], item[1]);
      });
    });

    it('always creates "default" environment', () => {
      const result = variables.variable({
        defaultEnv: true
      });
      assert.equal(result.environment, 'default');
    });

    it('always creates random environment', () => {
      const result = variables.variable({
        randomEnv: true
      });
      assert.notEqual(result.environment, 'default');
    });
  });

  describe('listVariables()', () => {
    let variables: Variables;

    before(() => { variables = new Variables(); });

    it('returns an array', () => {
      const result = variables.listVariables();
      assert.typeOf(result, 'array');
    });

    it('has default number of variables', () => {
      const result = variables.listVariables();
      assert.lengthOf(result, 25);
    });

    it('returns requested number of variables', () => {
      const result = variables.listVariables(5);
      assert.lengthOf(result, 5);
    });

    it('calls variable()', () => {
      const spy = sinon.spy(variables, 'variable');
      variables.listVariables(5);
      assert.equal(spy.callCount, 5);
    });
  });
});
