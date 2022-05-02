import { assert } from '@esm-bundle/chai';
import { DefaultOwner, IFile, File } from '../../src/models/store/File.js';
import { IUser } from '../../src/models/store/User.js';
import { Project } from '../../src/models/Project.js';
import { Workspace } from '../../src/models/Workspace.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';

describe('Models', () => {
  describe('Store', () => {
    describe('File', () => {
      describe('constructor()', () => {
        it('creates a default File', () => {
          const result = new File();
          assert.equal(result.kind, '');
          assert.equal(result.owner, DefaultOwner);
          assert.equal(result.key, '');
          assert.deepEqual(result.info.toJSON(), { kind: ThingKind, name: '' });
          assert.deepEqual(result.parents, []);
          assert.deepEqual(result.permissionIds, []);
          assert.isFalse(result.deleted, 'deleted');
          assert.isUndefined(result.deletedInfo);
          assert.isUndefined(result.labels);
          assert.isUndefined(result.iconColor);
          assert.deepEqual(result.lastModified, { user: '', time: 0, byMe: false });
        });
      });

      describe('new()', () => {
        let file: File;
        let base: IFile;

        beforeEach(() => {
          file = new File();
          base = {
            kind: 'test-kind',
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
            lastModified: { byMe: false, time: 1, user: 'u1', name: 'mod-test' },
            labels: ['l1'],
            deleted: true,
            deletedInfo: { byMe: false, time: 2, user: 'u2', name: 'delete-test' },
            iconColor: '#c00',
          };
        });

        it('sets the key', () => {
          file.new({ ...base });
          assert.equal(file.key, '123');
        });

        it('sets a new key when missing', () => {
          const iFile = { ...base };
          Reflect.deleteProperty(iFile, 'key');
          file.new(iFile);
          assert.typeOf(file.key, 'string');
        });

        it('sets the kind', () => {
          file.new({ ...base });
          assert.equal(file.kind, 'test-kind');
        });

        it('sets the info', () => {
          file.new({ ...base });
          assert.deepEqual(file.info.toJSON(), base.info);
        });

        it('sets a new info when missing', () => {
          const iFile = { ...base };
          Reflect.deleteProperty(iFile, 'info');
          file.new(iFile);
          assert.typeOf(file.info, 'object');
          assert.equal(file.info.name, '');
        });

        it('sets the parents', () => {
          file.new({ ...base });
          assert.deepEqual(file.parents, ['p1']);
        });

        it('sets default parents when missing', () => {
          const iFile = { ...base };
          Reflect.deleteProperty(iFile, 'parents');
          file.new(iFile);
          assert.deepEqual(file.parents, []);
        });

        it('sets the permissionIds', () => {
          file.new({ ...base });
          assert.deepEqual(file.permissionIds, ['pr1']);
        });

        it('sets default permissionIds when missing', () => {
          const iFile = { ...base };
          Reflect.deleteProperty(iFile, 'permissionIds');
          file.new(iFile);
          assert.deepEqual(file.permissionIds, []);
        });

        it('sets the owner', () => {
          file.new({ ...base });
          assert.equal(file.owner, 'me');
        });

        it('sets default owner when missing', () => {
          const iFile = { ...base };
          Reflect.deleteProperty(iFile, 'owner');
          file.new(iFile);
          assert.equal(file.owner, DefaultOwner);
        });

        it('sets the lastModified', () => {
          file.new({ ...base });
          assert.deepEqual(file.lastModified, base.lastModified);
        });

        it('sets a default lastModified when missing', () => {
          const iFile = { ...base };
          Reflect.deleteProperty(iFile, 'lastModified');
          file.new(iFile);
          assert.typeOf(file.lastModified, 'object');
          assert.equal(file.lastModified.time, 0);
        });

        it('sets the permissions', () => {
          file.new({ ...base });
          assert.deepEqual(file.permissions, base.permissions);
        });

        it('sets a default permissions when missing', () => {
          const iFile = { ...base };
          Reflect.deleteProperty(iFile, 'permissions');
          file.new(iFile);
          assert.deepEqual(file.permissions, []);
        });

        it('sets the deleted', () => {
          file.new({ ...base });
          assert.equal(file.deleted, base.deleted);
        });

        it('clears deleted when missing', () => {
          const iFile = { ...base };
          file.new(iFile);
          Reflect.deleteProperty(iFile, 'deleted');
          file.new(iFile);
          assert.isFalse(file.deleted);
        });

        it('sets the deletedInfo with deleted', () => {
          file.new({ ...base });
          assert.deepEqual(file.deletedInfo, base.deletedInfo);
        });

        it('clears deletedInfo when not deleted', () => {
          const iFile = { ...base };
          file.new(iFile);
          Reflect.deleteProperty(iFile, 'deleted');
          file.new(iFile);
          assert.isUndefined(file.deletedInfo);
        });

        it('sets the labels', () => {
          file.new({ ...base });
          assert.deepEqual(file.labels, base.labels);
        });

        it('clears labels when not set', () => {
          const iFile = { ...base };
          file.new(iFile);
          Reflect.deleteProperty(iFile, 'labels');
          file.new(iFile);
          assert.isUndefined(file.labels);
        });

        it('sets the iconColor', () => {
          file.new({ ...base });
          assert.equal(file.iconColor, base.iconColor);
        });

        it('clears iconColor when not set', () => {
          const iFile = { ...base };
          file.new(iFile);
          Reflect.deleteProperty(iFile, 'iconColor');
          file.new(iFile);
          assert.isUndefined(file.iconColor);
        });
      });

      describe('toJSON()', () => {
        let file: File;
        let base: IFile;

        beforeEach(() => {
          file = new File();
          base = {
            kind: 'test-kind',
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
            lastModified: { byMe: false, time: 1, user: 'u1', name: 'mod-test' },
          };
          file.new({ ...base });
        });

        it('sets the key', () => {
          const result = file.toJSON();
          assert.equal(result.key, base.key);
        });

        it('sets the kind', () => {
          const result = file.toJSON();
          assert.equal(result.kind, base.kind);
        });

        it('sets the owner', () => {
          const result = file.toJSON();
          assert.equal(result.owner, base.owner);
        });

        it('sets the info', () => {
          const result = file.toJSON();
          assert.deepEqual(result.info, base.info);
        });

        it('sets the parents', () => {
          const result = file.toJSON();
          assert.deepEqual(result.parents, base.parents);
        });

        it('sets the permissionIds', () => {
          const result = file.toJSON();
          assert.deepEqual(result.permissionIds, base.permissionIds);
        });

        it('sets the lastModified', () => {
          const result = file.toJSON();
          assert.deepEqual(result.lastModified, base.lastModified);
        });

        it('sets the deleted and deletedInfo', () => {
          const iFile = { ...base };
          iFile.deleted = true;
          iFile.deletedInfo = { byMe: false, time: 2, user: 'u2', name: 'delete-test' };
          file.new({ ...iFile });
          const result = file.toJSON();
          assert.isTrue(result.deleted);
          assert.deepEqual(result.deletedInfo, iFile.deletedInfo);
        });

        it('does not set the deleted and deletedInfo by default', () => {
          const result = file.toJSON();
          assert.isUndefined(result.deleted);
          assert.isUndefined(result.deletedInfo);
        });

        it('sets the labels', () => {
          const iFile = { ...base };
          iFile.labels = ['l1'];
          file.new({ ...iFile });
          const result = file.toJSON();
          assert.deepEqual(result.labels, iFile.labels);
        });

        it('does not set the labels by default', () => {
          const result = file.toJSON();
          assert.isUndefined(result.labels);
        });

        it('sets the iconColor', () => {
          const iFile = { ...base };
          iFile.iconColor = '#c00';
          file.new({ ...iFile });
          const result = file.toJSON();
          assert.deepEqual(result.iconColor, '#c00');
        });

        it('does not set the iconColor by default', () => {
          const result = file.toJSON();
          assert.isUndefined(result.iconColor);
        });
      });

      describe('setLastModified()', () => {
        const user: IUser = {
          key: '123',
          kind: 'Core#User',
          name: 'a1',
        };
        
        it('sets the time', () => {
          const file = new File();
          file.setLastModified(user);
          assert.isAbove(file.lastModified.time, 0);
        });

        it('sets the user', () => {
          const file = new File();
          file.setLastModified(user);
          assert.equal(file.lastModified.user, user.key);
        });

        it('sets the name', () => {
          const file = new File();
          file.setLastModified(user);
          assert.equal(file.lastModified.name, user.name);
        });

        it('sets the byMe', () => {
          const file = new File();
          file.setLastModified(user);
          assert.isFalse(file.lastModified.byMe);
        });

        it('throws when no argument', () => {
          const file = new File();
          assert.throws(() => {
            // @ts-ignore
            file.setLastModified(undefined);
          });
        });

        it('throws when invalid user', () => {
          const file = new File();
          assert.throws(() => {
            // @ts-ignore
            file.setLastModified({});
          });
        });
      });

      describe('setDeleted()', () => {
        const user: IUser = {
          key: '123',
          kind: 'Core#User',
          name: 'a1',
        };
        
        it('sets the time', () => {
          const file = new File();
          file.setDeleted(user);
          assert.isAbove(file.deletedInfo.time, 0);
        });

        it('sets the user', () => {
          const file = new File();
          file.setDeleted(user);
          assert.equal(file.deletedInfo.user, user.key);
        });

        it('sets the name', () => {
          const file = new File();
          file.setDeleted(user);
          assert.equal(file.deletedInfo.name, user.name);
        });

        it('sets the byMe', () => {
          const file = new File();
          file.setDeleted(user);
          assert.isFalse(file.deletedInfo.byMe);
        });

        it('sets the deleted', () => {
          const file = new File();
          file.setDeleted(user);
          assert.isTrue(file.deleted);
        });

        it('throws when no argument', () => {
          const file = new File();
          assert.throws(() => {
            // @ts-ignore
            file.setDeleted(undefined);
          }, 'The user is required.');
        });

        it('throws when invalid user', () => {
          const file = new File();
          assert.throws(() => {
            // @ts-ignore
            file.setDeleted({});
          }, 'Invalid value for the user when setting "deletedInfo".');
        });
      });

      describe('addLabel()', () => {
        const label = 'test-label';

        it('creates the labels array', () => {
          const file = new File();
          file.addLabel(label);
          assert.typeOf(file.labels, 'array');
        });

        it('adds the label to the array', () => {
          const file = new File();
          file.addLabel(label);
          assert.deepEqual(file.labels, [label]);
        });

        it('ignores duplicates', () => {
          const file = new File();
          file.addLabel(label);
          file.addLabel(label);
          assert.deepEqual(file.labels, [label]);
        });

        it('throws when invalid argument', () => {
          const file = new File();
          assert.throws(() => {
            // @ts-ignore
            file.addLabel();
          });
        });

        it('throws when empty string', () => {
          const file = new File();
          assert.throws(() => {
            file.addLabel('');
          });
        });

        it('throws when empty string after trimming', () => {
          const file = new File();
          assert.throws(() => {
            file.addLabel('    ');
          });
        });
      });

      describe('File.createFileCapabilities()', () => {
        describe('Project file', () => {
          ([
            ['canEdit', 'reader', false], 
            ['canEdit', 'commenter', false], 
            ['canEdit', 'writer', true], 
            ['canEdit', 'owner', true],

            ['canComment', 'reader', false], 
            ['canComment', 'commenter', true], 
            ['canComment', 'writer', true], 
            ['canComment', 'owner', true],

            ['canShare', 'reader', false], 
            ['canShare', 'commenter', false], 
            ['canShare', 'writer', true], 
            ['canShare', 'owner', true],

            ['canCopy', 'reader', false], 
            ['canCopy', 'commenter', false], 
            ['canCopy', 'writer', false], 
            ['canCopy', 'owner', false],

            ['canReadRevisions', 'reader', true], 
            ['canReadRevisions', 'commenter', true], 
            ['canReadRevisions', 'writer', true], 
            ['canReadRevisions', 'owner', true],

            ['canAddChildren', 'reader', false], 
            ['canAddChildren', 'commenter', false], 
            ['canAddChildren', 'writer', false], 
            ['canAddChildren', 'owner', false],

            ['canDelete', 'reader', false], 
            ['canDelete', 'commenter', false], 
            ['canDelete', 'writer', false], 
            ['canDelete', 'owner', true],

            ['canListChildren', 'reader', false], 
            ['canListChildren', 'commenter', false], 
            ['canListChildren', 'writer', false], 
            ['canListChildren', 'owner', false],

            ['canRename', 'reader', false], 
            ['canRename', 'commenter', false], 
            ['canRename', 'writer', true], 
            ['canRename', 'owner', true],

            ['canTrash', 'reader', false], 
            ['canTrash', 'commenter', false], 
            ['canTrash', 'writer', false], 
            ['canTrash', 'owner', true],

            ['canUntrash', 'reader', false], 
            ['canUntrash', 'commenter', false], 
            ['canUntrash', 'writer', false], 
            ['canUntrash', 'owner', true],

            ['canReadMedia', 'reader', true], 
            ['canReadMedia', 'commenter', true], 
            ['canReadMedia', 'writer', true], 
            ['canReadMedia', 'owner', true],

          ] as any[]).forEach((info) => {
            it(`sets ${info[0]} for role ${info[1]}`, () => {
              const file = new Project();
              const result = File.createFileCapabilities(file, info[1]);
              assert.strictEqual(result[info[0]], info[2]);
            });
          });
        });

        describe('Workspace file', () => {
          ([
            ['canEdit', 'reader', false], 
            ['canEdit', 'commenter', false], 
            ['canEdit', 'writer', true], 
            ['canEdit', 'owner', true],

            ['canComment', 'reader', false], 
            ['canComment', 'commenter', true], 
            ['canComment', 'writer', true], 
            ['canComment', 'owner', true],

            ['canShare', 'reader', false], 
            ['canShare', 'commenter', false], 
            ['canShare', 'writer', true], 
            ['canShare', 'owner', true],

            ['canCopy', 'reader', false], 
            ['canCopy', 'commenter', false], 
            ['canCopy', 'writer', false], 
            ['canCopy', 'owner', false],

            ['canReadRevisions', 'reader', true], 
            ['canReadRevisions', 'commenter', true], 
            ['canReadRevisions', 'writer', true], 
            ['canReadRevisions', 'owner', true],

            ['canAddChildren', 'reader', false], 
            ['canAddChildren', 'commenter', false], 
            ['canAddChildren', 'writer', true], 
            ['canAddChildren', 'owner', true],

            ['canDelete', 'reader', false], 
            ['canDelete', 'commenter', false], 
            ['canDelete', 'writer', false], 
            ['canDelete', 'owner', true],

            ['canListChildren', 'reader', true], 
            ['canListChildren', 'commenter', true], 
            ['canListChildren', 'writer', true], 
            ['canListChildren', 'owner', true],

            ['canRename', 'reader', false], 
            ['canRename', 'commenter', false], 
            ['canRename', 'writer', true], 
            ['canRename', 'owner', true],

            ['canTrash', 'reader', false], 
            ['canTrash', 'commenter', false], 
            ['canTrash', 'writer', false], 
            ['canTrash', 'owner', true],

            ['canUntrash', 'reader', false], 
            ['canUntrash', 'commenter', false], 
            ['canUntrash', 'writer', false], 
            ['canUntrash', 'owner', true],

            ['canReadMedia', 'reader', false], 
            ['canReadMedia', 'commenter', false], 
            ['canReadMedia', 'writer', false], 
            ['canReadMedia', 'owner', false],

          ] as any[]).forEach((info) => {
            it(`sets ${info[0]} for role ${info[1]}`, () => {
              const file = new Workspace();
              const result = File.createFileCapabilities(file, info[1]);
              assert.strictEqual(result[info[0]], info[2]);
            });
          });
        });
      });

      describe('File.updateByMeMeta()', () => {
        it('sets deletedInfo.byMe for the same user', () => {
          const schema = Workspace.fromName('s1').toJSON();
          schema.deletedInfo = {
            byMe: false,
            time: 1,
            name: 'a',
            user: 'b',
          };
          File.updateByMeMeta(schema, 'b');
          assert.isTrue(schema.deletedInfo!.byMe);
        });

        it('sets deletedInfo.byMe for the different user', () => {
          const schema = Workspace.fromName('s1').toJSON();
          schema.deletedInfo = {
            byMe: false,
            time: 1,
            name: 'a',
            user: 'c',
          };
          File.updateByMeMeta(schema, 'b');
          assert.isFalse(schema.deletedInfo!.byMe);
        });

        it('sets lastModified.byMe for the same user', () => {
          const schema = Workspace.fromName('s1').toJSON();
          schema.lastModified = {
            byMe: false,
            time: 1,
            name: 'a',
            user: 'b',
          };
          File.updateByMeMeta(schema, 'b');
          assert.isTrue(schema.lastModified!.byMe);
        });

        it('sets lastModified.byMe for the different user', () => {
          const schema = Workspace.fromName('s1').toJSON();
          schema.lastModified = {
            byMe: false,
            time: 1,
            name: 'a',
            user: 'c',
          };
          File.updateByMeMeta(schema, 'b');
          assert.isFalse(schema.lastModified!.byMe);
        });
      });

      describe('File.setLastModified()', () => {
        const user: IUser = {
          key: '123',
          kind: 'Core#User',
          name: 'a1',
        };
        
        it('sets the time', () => {
          const file = new File().toJSON();
          File.setLastModified(file, user);
          assert.isAbove(file.lastModified.time, 0);
        });

        it('sets the user', () => {
          const file = new File().toJSON();
          File.setLastModified(file, user);
          assert.equal(file.lastModified.user, user.key);
        });

        it('sets the name', () => {
          const file = new File().toJSON();
          File.setLastModified(file, user);
          assert.equal(file.lastModified.name, user.name);
        });

        it('sets the byMe', () => {
          const file = new File().toJSON();
          File.setLastModified(file, user);
          assert.isFalse(file.lastModified.byMe);
        });

        it('throws when no file argument', () => {
          assert.throws(() => {
            // @ts-ignore
            File.setLastModified(undefined, user);
          }, 'The file is required.');
        });

        it('throws when no user argument', () => {
          const file = new File().toJSON();
          assert.throws(() => {
            // @ts-ignore
            File.setLastModified(file, undefined);
          }, 'The user is required.');
        });

        it('throws when invalid user', () => {
          const file = new File().toJSON();
          assert.throws(() => {
            // @ts-ignore
            File.setLastModified(file, {});
          }, 'Invalid value for the user when setting "lastModified".');
        });
      });

      describe('File.setDeleted()', () => {
        const user: IUser = {
          key: '123',
          kind: 'Core#User',
          name: 'a1',
        };
        
        it('sets the time', () => {
          const file = new File().toJSON();
          File.setDeleted(file, user);
          assert.isAbove(file.deletedInfo.time, 0);
        });

        it('sets the user', () => {
          const file = new File().toJSON();
          File.setDeleted(file, user);
          assert.equal(file.deletedInfo.user, user.key);
        });

        it('sets the name', () => {
          const file = new File().toJSON();
          File.setDeleted(file, user);
          assert.equal(file.deletedInfo.name, user.name);
        });

        it('sets the byMe', () => {
          const file = new File().toJSON();
          File.setDeleted(file, user);
          assert.isFalse(file.deletedInfo.byMe);
        });

        it('sets the deleted', () => {
          const file = new File().toJSON();
          File.setDeleted(file, user);
          assert.isTrue(file.deleted);
        });

        it('throws when no file argument', () => {
          assert.throws(() => {
            // @ts-ignore
            File.setDeleted(undefined, user);
          }, 'The file is required.');
        });

        it('throws when no user argument', () => {
          const file = new File().toJSON();
          assert.throws(() => {
            // @ts-ignore
            File.setDeleted(file, undefined);
          }, 'The user is required.');
        });

        it('throws when invalid user', () => {
          const file = new File().toJSON();
          assert.throws(() => {
            // @ts-ignore
            File.setDeleted(file, {});
          }, 'Invalid value for the user when setting "deletedInfo".');
        });
      });
    });
  });
});
