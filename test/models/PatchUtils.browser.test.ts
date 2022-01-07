/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import * as PatchUtils from '../../src/models/PatchUtils.js';

describe('Models', () => {
  describe('PatchUtils', () => {
    describe('validateDateInput()', () => {
      it('throws for the delete operation', () => {
        assert.throws(() => {
          PatchUtils.validateDateInput('delete', 12345679);
        }, Error, PatchUtils.TXT_unable_delete_value);
      });

      it('throws when no value', () => {
        assert.throws(() => {
          PatchUtils.validateDateInput('set');
        }, Error, PatchUtils.TXT_value_required);
      });

      it('throws when value is not a number', () => {
        assert.throws(() => {
          PatchUtils.validateDateInput('set', 'test');
        }, Error, PatchUtils.TXT_value_not_number);
      });

      it('passes the validation with a number', () => {
        assert.doesNotThrow(() => {
          PatchUtils.validateDateInput('set', 123);
        });
      });
    });

    describe('validateTextInput()', () => {
      it('throws for the delete operation with a value', () => {
        assert.throws(() => {
          PatchUtils.validateTextInput('delete', 'test');
        }, Error, PatchUtils.TXT_value_with_delete);
      });

      it('throws when no value', () => {
        assert.throws(() => {
          PatchUtils.validateTextInput('set');
        }, Error, PatchUtils.TXT_value_required);
      });

      it('passes the validation with a number', () => {
        assert.doesNotThrow(() => {
          PatchUtils.validateTextInput('set', '123');
        });
      });
    });
  });
});
