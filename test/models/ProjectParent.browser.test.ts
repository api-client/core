/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { ProjectFolder } from '../../src/models/ProjectFolder.js';
import { HttpProject } from '../../src/models/HttpProject.js';
import { Environment } from '../../src/models/Environment.js';

//
// ProjectParent is an abstract class so I picked ProjectFolder class to test it
// as it extend the ProjectParent class.
//

describe('Models', () => {
  describe('ProjectParent', () => {
    describe('#effectiveEnvironments', () => {
      it('returns the environments in the object', () => {
        const project = new HttpProject();
        const folder = new ProjectFolder(project);
        assert.deepEqual(folder.effectiveEnvironments, []);
      });
    });

    describe('addEnvironment()', () => {
      let project: HttpProject;
      let folder: ProjectFolder;
      beforeEach(() => {
        project = HttpProject.fromName('test');
        folder = new ProjectFolder(project);
      });

      it('adds environment by name', () => {
        const created = folder.addEnvironment('test');
        assert.deepEqual(folder.effectiveEnvironments, [created]);
      });

      it('adds environment from an instance', () => {
        const env = Environment.fromName('test');
        folder.addEnvironment(env);
        assert.deepEqual(folder.effectiveEnvironments, [env]);
      });

      it('adds environment from a schema', () => {
        const env = Environment.fromName('test');
        folder.addEnvironment(env.toJSON());
        assert.deepEqual(folder.effectiveEnvironments, [env]);
      });

      it('creates environment array when missing', () => {
        delete folder.environments;
        const created = folder.addEnvironment('test');
        assert.deepEqual(folder.effectiveEnvironments, [created]);
      });

      it('adds missing keys', () => {
        const env = Environment.fromName('test');
        delete env.key;
        folder.addEnvironment(env);
        assert.typeOf(folder.effectiveEnvironments[0].key, 'string');
      });
    });
  });
});
