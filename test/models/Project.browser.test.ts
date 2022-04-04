import { assert } from '@esm-bundle/chai';
import { IProject, Project, Kind as ProjectKind } from '../../src/models/Project.js';
import { HttpProject } from '../../src/models/HttpProject.js';
import { DefaultOwner } from '../../src/models/store/File.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';

describe('Models', () => {
  describe('Project', () => {
    describe('Project.fromProject()', () => {
      it('sets the kind', () => {
        const p1 = HttpProject.fromName('p1');
        const result = Project.fromProject(p1);
        assert.equal(result.kind, ProjectKind);
      });

      it('sets the name', () => {
        const p1 = HttpProject.fromName('p1');
        const result = Project.fromProject(p1);
        assert.equal(result.info.name, 'p1');
      });

      it('sets the key', () => {
        const p1 = HttpProject.fromName('p1');
        const result = Project.fromProject(p1);
        assert.equal(result.key, p1.key);
      });

      it('sets the owner', () => {
        const p1 = HttpProject.fromName('p1');
        const result = Project.fromProject(p1);
        assert.equal(result.owner, DefaultOwner);
      });

      it('respects schema instead of instance', () => {
        const p1 = HttpProject.fromName('p1');
        const result = Project.fromProject(p1.toJSON());
        assert.equal(result.info.name, 'p1');
      });
    });

    describe('constructor()', () => {
      it('creates a default Workspace', () => {
        const result = new Project();
        assert.equal(result.kind, ProjectKind);
        assert.equal(result.owner, DefaultOwner);
        assert.typeOf(result.key, 'string');
        assert.typeOf(result.lastModified, 'object');
      });

      it('creates a Workspace from the schema values', () => {
        const schema: IProject = {
          kind: ProjectKind,
          info: {
            kind: ThingKind,
            name: 'hello',
            description: 'a desc',
          },
          owner: 'me',
          key: '123',
          parents: ['p1'],
          permissionIds: ['pr1'],
          permissions: [{
            addingUser: '123',
            key: '123',
            kind: 'Core#Permission',
            owner: '345',
            role: 'commenter',
            type: 'anyone',
          }],
          lastModified: { byMe: false, time: 0, user: 'id', name: 'test' },
          labels: ['l1'],
        };
        const result = new Project(schema);
        assert.equal(result.kind, ProjectKind);
        assert.equal(result.info.name, 'hello');
        assert.equal(result.owner, 'me');
        assert.equal(result.key, '123');
        assert.deepEqual(result.parents, ['p1']);
        assert.deepEqual(result.permissionIds, ['pr1']);
        assert.typeOf(result.permissions, 'array');
        assert.deepEqual(result.lastModified, schema.lastModified);
        assert.deepEqual(result.labels, ['l1']);
      });

      it('creates a Workspace from the JSON schema string', () => {
        const schema: IProject = {
          kind: ProjectKind,
          info: {
            kind: ThingKind,
            name: 'hello',
            description: 'a desc',
          },
          owner: 'me',
          key: '123',
          parents: ['p1'],
          permissionIds: ['pr1'],
          permissions: [{
            addingUser: '123',
            key: '123',
            kind: 'Core#Permission',
            owner: '345',
            role: 'commenter',
            type: 'anyone',
          }],
          lastModified: { byMe: false, time: 0, user: 'id', name: 'test' },
        };
        const result = new Project(JSON.stringify(schema));
        assert.equal(result.kind, ProjectKind);
        assert.equal(result.info.name, 'hello');
        assert.equal(result.owner, 'me');
        assert.equal(result.key, '123');
        assert.deepEqual(result.lastModified, schema.lastModified);
      });

      it('throws when invalid schema', () => {
        assert.throws(() => {
          new Project(JSON.stringify({
            name: 'a name',
          }));
        });
      });
    });

    describe('toJSON()', () => {
      let workspace: Project;
      beforeEach(() => {
        workspace = new Project();
      });

      it('serializes the kind', () => {
        const result = workspace.toJSON();
        assert.equal(result.kind, ProjectKind);
      });

      it('serializes the key', () => {
        const result = workspace.toJSON();
        assert.equal(result.key, workspace.key);
      });

      // the "key" test tests whether the parent toJSON() is called.
    });
  });
});
