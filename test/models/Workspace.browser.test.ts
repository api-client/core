import { assert } from '@esm-bundle/chai';
import { IWorkspace, IUserWorkspace, Workspace, Kind as WorkspaceKind, DefaultOwner } from '../../src/models/Workspace.js';
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
        assert.deepEqual(result.projects, []);
        assert.deepEqual(result.users, []);
        assert.typeOf(result.key, 'string');
        assert.isUndefined(result.access);
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
          projects: ['1', '2'],
          key: '123',
          users: ['3', '4'],
        };
        const result = new Workspace(schema);
        assert.equal(result.kind, WorkspaceKind);
        assert.equal(result.info.name, 'hello');
        assert.equal(result.owner, 'me');
        assert.equal(result.key, '123');
        assert.deepEqual(result.projects, ['1', '2']);
        assert.deepEqual(result.users, ['3', '4']);
        assert.isUndefined(result.access);
      });

      it('creates a Workspace from the user schema values', () => {
        const schema: IUserWorkspace = {
          kind: WorkspaceKind,
          info: {
            kind: ThingKind,
            name: 'hello',
            description: 'a desc',
          },
          owner: 'me',
          projects: ['1', '2'],
          key: '123',
          users: ['3', '4'],
          access: 'owner',
        };
        const result = new Workspace(schema);
        assert.equal(result.access, 'owner');
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
          projects: ['1', '2'],
          key: '123',
          users: ['3', '4'],
        };
        const result = new Workspace(JSON.stringify(schema));
        assert.equal(result.kind, WorkspaceKind);
        assert.equal(result.info.name, 'hello');
        assert.equal(result.owner, 'me');
        assert.equal(result.key, '123');
        assert.deepEqual(result.projects, ['1', '2']);
        assert.deepEqual(result.users, ['3', '4']);
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

      it('serializes empty projects', () => {
        const result = workspace.toJSON();
        assert.deepEqual(result.projects, []);
      });

      it('serializes set projects', () => {
        workspace.projects = ['1'];
        const result = workspace.toJSON();
        assert.deepEqual(result.projects, ['1']);
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

      it('does not serialize the users', () => {
        const result = workspace.toJSON();
        assert.isUndefined(result.users);
      });

      it('serializes set users', () => {
        workspace.users = ['1'];
        const result = workspace.toJSON();
        assert.deepEqual(result.users, ['1']);
      });

      it('does not serialize the access', () => {
        workspace.access = 'comment';
        const result = workspace.toJSON();
        // @ts-ignore
        assert.isUndefined(result.access);
      });
    });
  });
});
