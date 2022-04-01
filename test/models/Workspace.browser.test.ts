import { assert } from '@esm-bundle/chai';
import { IWorkspace, Workspace, Kind as WorkspaceKind } from '../../src/models/Workspace.js';
import { DefaultOwner } from '../../src/models/store/File.js';
import { Kind as ThingKind, Thing } from '../../src/models/Thing.js';

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
        };
        const result = new Workspace(schema);
        assert.equal(result.kind, WorkspaceKind);
        assert.equal(result.info.name, 'hello');
        assert.equal(result.owner, 'me');
        assert.equal(result.key, '123');
        assert.deepEqual(result.parents, ['p1']);
        assert.deepEqual(result.permissionIds, ['pr1']);
        assert.typeOf(result.permissions, 'array');
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
        };
        const result = new Workspace(JSON.stringify(schema));
        assert.equal(result.kind, WorkspaceKind);
        assert.equal(result.info.name, 'hello');
        assert.equal(result.owner, 'me');
        assert.equal(result.key, '123');
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

      it('serializes the info object', () => {
        workspace.info = Thing.fromName('test name'); 
        const result = workspace.toJSON();
        assert.equal(result.info.name, 'test name');
      });

      it('serializes the default owner', () => {
        const result = workspace.toJSON();
        assert.equal(result.owner, DefaultOwner);
      });

      it('serializes set owner', () => {
        workspace.owner = 'abc';
        const result = workspace.toJSON();
        assert.equal(result.owner, 'abc');
      });

      it('serializes the parents', () => {
        workspace.parents = ['p1'];
        const result = workspace.toJSON();
        assert.deepEqual(result.parents, ['p1']);
      });

      it('serializes the parents', () => {
        workspace.permissionIds = ['p1'];
        const result = workspace.toJSON();
        assert.deepEqual(result.permissionIds, ['p1']);
      });

      it('serializes the deleted', () => {
        workspace.deleted = true;
        const result = workspace.toJSON();
        assert.isTrue(result.deleted);
      });

      it('serializes the deletedTime', () => {
        workspace.deleted = true;
        workspace.deletedTime = 123456789;
        const result = workspace.toJSON();
        assert.equal(result.deletedTime, 123456789);
      });

      it('serializes the deletingUser', () => {
        workspace.deleted = true;
        workspace.deletingUser = '123456789';
        const result = workspace.toJSON();
        assert.equal(result.deletingUser, '123456789');
      });
    });
  });
});
