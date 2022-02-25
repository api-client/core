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
    describe('getEnvironments()', () => {
      it('returns the environments in the object', () => {
        const project = new HttpProject();
        const folder = new ProjectFolder(project);
        const envs = folder.getEnvironments();
        assert.deepEqual(envs, []);
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
        const envs = folder.getEnvironments();
        assert.deepEqual(envs, [created]);
      });

      it('adds environment from an instance', () => {
        const env = Environment.fromName('test');
        folder.addEnvironment(env);
        const envs = folder.getEnvironments();
        assert.deepEqual(envs, [env]);
      });

      it('adds environment from a schema', () => {
        const env = Environment.fromName('test');
        folder.addEnvironment(env.toJSON());
        const envs = folder.getEnvironments();
        assert.deepEqual(envs, [env]);
      });

      it('creates environment array when missing', () => {
        delete folder.environments;
        const created = folder.addEnvironment('test');
        const envs = folder.getEnvironments();
        assert.deepEqual(envs, [created]);
      });

      it('adds missing keys', () => {
        const env = Environment.fromName('test');
        delete env.key;
        folder.addEnvironment(env);
        const envs = folder.getEnvironments();
        assert.typeOf(envs[0].key, 'string');
      });

      it('adds the environment to the definitions when adding to the project', () => {
        const e1 = project.addEnvironment('e1');
        assert.deepEqual(project.definitions.environments, [e1]);
      });

      it('adds the environment key when adding to the project', () => {
        const e1 = project.addEnvironment('e1');
        assert.deepEqual(project.environments, [e1.key]);
      });

      it('adds the environment to the definitions when adding to a folder', () => {
        const e1 = folder.addEnvironment('e1');
        assert.deepEqual(project.definitions.environments, [e1]);
      });

      it('adds the environment key when adding to a folder', () => {
        const e1 = folder.addEnvironment('e1');
        assert.deepEqual(project.environments, []);
        assert.deepEqual(folder.environments, [e1.key]);
      });
    });
  });
});
