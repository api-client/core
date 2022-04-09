import { assert } from '@esm-bundle/chai';
import { IPermission, Permission, Kind as PermissionKind } from '../../src/models/store/Permission.js';

describe('Models', () => {
  describe('Store', () => {
    describe('Permission', () => {
      describe('constructor()', () => {
        it('creates a default Permission', () => {
          const result = new Permission();
          assert.equal(result.kind, PermissionKind);
          assert.typeOf(result.key, 'string');
          assert.isNotEmpty(result.key);
          assert.equal(result.addingUser, '');
          assert.equal(result.role, 'reader');
          assert.equal(result.type, 'user');
          assert.isUndefined(result.deleted);
          assert.isUndefined(result.deletedTime);
          assert.isUndefined(result.deletingUser);
          assert.isUndefined(result.displayName);
          assert.isUndefined(result.expirationTime);
          assert.equal(result.owner, '');
        });

        it('creates permissions from the schema', () => {
          const schema: IPermission = {
            kind: PermissionKind,
            key: '1',
            addingUser: '2',
            role: 'commenter',
            type: 'group',
            deleted: true,
            deletedTime: 123,
            deletingUser: '3',
            displayName: 'Name',
            expirationTime: 321,
            owner: '4',
          };
          const result = new Permission(schema);
          assert.equal(result.kind, PermissionKind);
          assert.equal(result.key, '1');
          assert.equal(result.addingUser, '2');
          assert.equal(result.role, 'commenter');
          assert.equal(result.type, 'group');
          assert.isTrue(result.deleted);
          assert.strictEqual(result.deletedTime, 123);
          assert.equal(result.deletingUser, '3');
          assert.equal(result.displayName, 'Name');
          assert.strictEqual(result.expirationTime, 321);
          assert.equal(result.owner, '4');
        });

        it('creates permissions from the JSON schema', () => {
          const schema: IPermission = {
            kind: PermissionKind,
            key: '1',
            addingUser: '2',
            role: 'commenter',
            type: 'group',
            deleted: true,
            deletedTime: 123,
            deletingUser: '3',
            displayName: 'Name',
            expirationTime: 321,
            owner: '4',
          };
          const result = new Permission(JSON.stringify(schema));
          assert.equal(result.kind, PermissionKind);
          assert.equal(result.key, '1');
          assert.equal(result.addingUser, '2');
          assert.equal(result.role, 'commenter');
          assert.equal(result.type, 'group');
          assert.isTrue(result.deleted);
          assert.strictEqual(result.deletedTime, 123);
          assert.equal(result.deletingUser, '3');
          assert.equal(result.displayName, 'Name');
          assert.strictEqual(result.expirationTime, 321);
          assert.equal(result.owner, '4');
        });
      });

      describe('Permission.fromUserRole()', () => {
        it('creates basic meta', () => {
          const result = Permission.fromUserRole('owner', '1', '2');
          assert.equal(result.kind, PermissionKind);
          assert.typeOf(result.key, 'string');
          assert.isNotEmpty(result.key);
          assert.isUndefined(result.deleted);
          assert.isUndefined(result.deletedTime);
          assert.isUndefined(result.deletingUser);
          assert.isUndefined(result.displayName);
          assert.isUndefined(result.expirationTime);
        });

        it('sets the type', () => {
          const result = Permission.fromUserRole('owner', '1', '2');
          assert.equal(result.type, 'user');
        });

        it('sets the role', () => {
          const result = Permission.fromUserRole('owner', '1', '2');
          assert.equal(result.role, 'owner');
        });

        it('sets the owner', () => {
          const result = Permission.fromUserRole('owner', '1', '2');
          assert.equal(result.owner, '1');
        });

        it('sets the addingUser', () => {
          const result = Permission.fromUserRole('owner', '1', '2');
          assert.equal(result.addingUser, '2');
        });
      });

      describe('Permission.fromGroupRole()', () => {
        it('creates basic meta', () => {
          const result = Permission.fromGroupRole('owner', '1', '2');
          assert.equal(result.kind, PermissionKind);
          assert.typeOf(result.key, 'string');
          assert.isNotEmpty(result.key);
          assert.isUndefined(result.deleted);
          assert.isUndefined(result.deletedTime);
          assert.isUndefined(result.deletingUser);
          assert.isUndefined(result.displayName);
          assert.isUndefined(result.expirationTime);
        });
        
        it('sets the type', () => {
          const result = Permission.fromGroupRole('owner', '1', '2');
          assert.equal(result.type, 'group');
        });

        it('sets the role', () => {
          const result = Permission.fromGroupRole('owner', '1', '2');
          assert.equal(result.role, 'owner');
        });

        it('sets the owner', () => {
          const result = Permission.fromGroupRole('owner', '1', '2');
          assert.equal(result.owner, '1');
        });

        it('sets the addingUser', () => {
          const result = Permission.fromGroupRole('owner', '1', '2');
          assert.equal(result.addingUser, '2');
        });
      });

      describe('Permission.fromAnyoneRole()', () => {
        it('creates basic meta', () => {
          const result = Permission.fromAnyoneRole('owner', '1');
          assert.equal(result.kind, PermissionKind);
          assert.typeOf(result.key, 'string');
          assert.isNotEmpty(result.key);
          assert.isUndefined(result.deleted);
          assert.isUndefined(result.deletedTime);
          assert.isUndefined(result.deletingUser);
          assert.isUndefined(result.displayName);
          assert.isUndefined(result.expirationTime);
        });
        
        it('sets the type', () => {
          const result = Permission.fromAnyoneRole('owner', '1');
          assert.equal(result.type, 'anyone');
        });

        it('sets the role', () => {
          const result = Permission.fromAnyoneRole('owner', '1');
          assert.equal(result.role, 'owner');
        });

        it('sets the addingUser', () => {
          const result = Permission.fromAnyoneRole('owner', '1');
          assert.equal(result.addingUser, '1');
        });
      });

      describe('Permission.fromValues()', () => {
        it('creates basic meta', () => {
          const result = Permission.fromValues({ addingUser: '1', role: 'commenter', type: 'anyone' });
          assert.equal(result.kind, PermissionKind);
          assert.typeOf(result.key, 'string');
          assert.isNotEmpty(result.key);
          assert.isUndefined(result.deleted);
          assert.isUndefined(result.deletedTime);
          assert.isUndefined(result.deletingUser);
          assert.isUndefined(result.displayName);
          assert.isUndefined(result.expirationTime);
        });
        
        it('sets the type', () => {
          const result = Permission.fromValues({ addingUser: '1', role: 'commenter', type: 'anyone' });
          assert.equal(result.type, 'anyone');
        });

        it('sets the role', () => {
          const result = Permission.fromValues({ addingUser: '1', role: 'commenter', type: 'anyone' });
          assert.equal(result.role, 'commenter');
        });

        it('sets the addingUser', () => {
          const result = Permission.fromValues({ addingUser: '1', role: 'commenter', type: 'anyone' });
          assert.equal(result.addingUser, '1');
        });
      });

      describe('Permission.hasRole()', () => {
        ([
          ['reader', 'reader', true],
          ['reader', 'commenter', true],
          ['reader', 'writer', true],
          ['reader', 'owner', true],
          ['commenter', 'reader', false],
          ['commenter', 'commenter', true],
          ['commenter', 'writer', true],
          ['commenter', 'owner', true],
          ['writer', 'reader', false],
          ['writer', 'commenter', false],
          ['writer', 'writer', true],
          ['writer', 'owner', true],
          ['owner', 'reader', false],
          ['owner', 'commenter', false],
          ['owner', 'writer', false],
          ['owner', 'owner', true],
          ['reader', undefined, false],
          ['reader', undefined, false],
          ['reader', undefined, false],
          ['reader', undefined, false],
        ] as any[]).forEach((info) => {
          it(`returns ${info[2]} for role ${info[1]} and minimum access ${info[0]}`, () => {
            const result = Permission.hasRole(info[0], info[1]);
            assert.strictEqual(result, info[2]);
          });
        });
      });

      describe('toJSON()', () => {
        it('serializes all required values', () => {
          const p = Permission.fromAnyoneRole('commenter', '2');
          const result = p.toJSON();
          assert.equal(result.kind, PermissionKind);
          assert.typeOf(result.key, 'string');
          assert.equal(result.role, 'commenter');
          assert.equal(result.type, 'anyone');
          assert.equal(result.addingUser, '2');
          assert.isUndefined(result.deleted);
          assert.isUndefined(result.deletedTime);
          assert.isUndefined(result.deletingUser);
          assert.isUndefined(result.displayName);
          assert.isUndefined(result.expirationTime);
        });

        it('serializes the owner', () => {
          const p = Permission.fromUserRole('commenter', '1', '2');
          const result = p.toJSON();
          assert.equal(result.owner, '1');
        });

        it('serializes the displayName', () => {
          const p = Permission.fromUserRole('commenter', '1', '2');
          p.displayName = 'test';
          const result = p.toJSON();
          assert.equal(result.displayName, 'test');
        });

        it('serializes the expirationTime', () => {
          const p = Permission.fromUserRole('commenter', '1', '2');
          p.expirationTime = 1234;
          const result = p.toJSON();
          assert.equal(result.expirationTime, 1234);
        });

        it('serializes the deleted info', () => {
          const p = Permission.fromUserRole('commenter', '1', '2');
          p.deleted = true;
          p.deletedTime = 123;
          p.deletingUser = '456';
          const result = p.toJSON();
          assert.strictEqual(result.deletedTime, 123);
          assert.strictEqual(result.deletingUser, '456');
          assert.isTrue(result.deleted);
        });
      });
    });
  });
});
