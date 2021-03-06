import { assert } from '@esm-bundle/chai';
import { IWorkspace, Workspace, Kind as WorkspaceKind } from '../../src/models/Workspace.js';
import { DefaultOwner } from '../../src/models/store/File.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';

describe('Models', () => {
  describe('Workspace', () => {
    describe('Server.fromName()', () => {
      it('sets the kind', () => {
        const result = Workspace.fromName('name');
        assert.equal(result.kind, WorkspaceKind);
      });

      it('sets the name', () => {
        const result = Workspace.fromName('name');
        assert.equal(result.info.name, 'name');
      });

      it('sets the default owner', () => {
        const result = Workspace.fromName('name');
        assert.equal(result.owner, DefaultOwner);
      });

      it('sets the passed owner', () => {
        const result = Workspace.fromName('name', 'me');
        assert.equal(result.owner, 'me');
      });
    });

    describe('constructor()', () => {
      it('creates a default Workspace', () => {
        const result = new Workspace();
        assert.equal(result.kind, WorkspaceKind);
        assert.equal(result.owner, DefaultOwner);
        assert.typeOf(result.key, 'string');
        assert.typeOf(result.lastModified, 'object');
      });

      it('creates a Workspace from the schema values', () => {
        const schema: IWorkspace = {
          kind: WorkspaceKind,
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
        const result = new Workspace(schema);
        assert.equal(result.kind, WorkspaceKind);
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
        const schema: IWorkspace = {
          kind: WorkspaceKind,
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
        const result = new Workspace(JSON.stringify(schema));
        assert.equal(result.kind, WorkspaceKind);
        assert.equal(result.info.name, 'hello');
        assert.equal(result.owner, 'me');
        assert.equal(result.key, '123');
        assert.deepEqual(result.lastModified, schema.lastModified);
      });

      it('throws when invalid schema', () => {
        assert.throws(() => {
          new Workspace(JSON.stringify({
            name: 'a name',
          }));
        });
      });
    });

    describe('toJSON()', () => {
      let workspace: Workspace;
      beforeEach(() => {
        workspace = new Workspace();
      });

      it('serializes the kind', () => {
        const result = workspace.toJSON();
        assert.equal(result.kind, WorkspaceKind);
      });

      it('serializes the key', () => {
        const result = workspace.toJSON();
        assert.equal(result.key, workspace.key);
      });

      // the "key" test tests whether the parent toJSON() is called.
    });
  });
});
