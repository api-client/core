/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { ProjectItem } from '../../src/models/ProjectItem.js';
import { HttpProject } from '../../src/models/HttpProject.js';
import { Kind as ProjectRequestKind } from '../../src/models/ProjectRequest.js';
import { Kind as ProjectFolderKind } from '../../src/models/ProjectFolder.js';

describe('Models', () => {
  describe('ProjectItem', () => {
    describe('ProjectItem.projectRequest()', () => {
      it('creates the item', () => {
        const project = HttpProject.fromName('test');
        const item = ProjectItem.projectRequest(project, 'r1');
        assert.equal(item.kind, ProjectRequestKind);
        assert.equal(item.key, 'r1');
      });
    });

    describe('ProjectItem.projectFolder()', () => {
      it('creates the item', () => {
        const project = HttpProject.fromName('test');
        const item = ProjectItem.projectFolder(project, 'f1');
        assert.equal(item.kind, ProjectFolderKind);
        assert.equal(item.key, 'f1');
      });
    });

    describe('ProjectItem.isProjectItem()', () => {
      it('returns true for a folder item', () => {
        const project = HttpProject.fromName('test');
        const item = ProjectItem.projectFolder(project, 'f1');
        assert.isTrue(ProjectItem.isProjectItem(item));
      });

      it('returns true for a folder item', () => {
        const project = HttpProject.fromName('test');
        const item = ProjectItem.projectRequest(project, 'r1');
        assert.isTrue(ProjectItem.isProjectItem(item));
      });

      it('returns false when not an item', () => {
        assert.isFalse(ProjectItem.isProjectItem({}));
      });
    });

    describe('constructor()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = HttpProject.fromName('test');
      });

      it('creates a default item for "http-request" type', () => {
        const item = new ProjectItem(project, 'http-request');
        assert.equal(item.kind, ProjectRequestKind);
        assert.equal(item.key, '');
      });

      it('creates a default item for "folder" type', () => {
        const item = new ProjectItem(project, 'folder');
        assert.equal(item.kind, ProjectFolderKind);
        assert.equal(item.key, '');
      });

      it('creates an instance from a schema', () => {
        const schema = ProjectItem.projectRequest(project, 'r1').toJSON();
        const item = new ProjectItem(project, schema);
        assert.equal(item.kind, ProjectRequestKind);
        assert.equal(item.key, 'r1');
      });

      it('creates an instance from a serialized schema', () => {
        const schema = JSON.stringify(ProjectItem.projectRequest(project, 'r1'));
        const item = new ProjectItem(project, schema);
        assert.equal(item.kind, ProjectRequestKind);
        assert.equal(item.key, 'r1');
      });

      it('throws when input is not defined', () => {
        assert.throws(() => {
          new ProjectItem(project, undefined);
        });
      });
    });

    describe('toJSON()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = HttpProject.fromName('test');
      });

      it('sets the kind', () => {
        const item = ProjectItem.projectRequest(project, 'r1').toJSON();
        assert.equal(item.kind, ProjectRequestKind);
      });

      it('sets the key', () => {
        const item = ProjectItem.projectRequest(project, 'r1').toJSON();
        assert.equal(item.key, 'r1');
      });
    });

    describe('getItem()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = HttpProject.fromName('test');
      });

      it('returns a definition of a request', () => {
        const created = project.addRequest('https://api.com');
        const definition = project.items[0].getItem();
        assert.deepEqual(definition, created);
      });

      it('returns a definition of a folder', () => {
        const created = project.addFolder('a folder');
        const definition = project.items[0].getItem();
        assert.deepEqual(definition, created);
      });
    });

    describe('getParent()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = HttpProject.fromName('test');
      });

      it('returns the project for a root level items', () => {
        project.addRequest('https://api.com');
        const definition = project.items[0].getParent();
        assert.isTrue(definition === project);
      });

      it('returns a parent folder', () => {
        const f1 = project.addFolder('f1');
        f1.addFolder('f2');
        const definition = f1.items[0].getParent();
        assert.isTrue(definition === f1);
      });
    });
  });
});
