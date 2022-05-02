import { assert } from '@esm-bundle/chai';
import { DataNamespace } from '../../src/models/data/DataNamespace.js';
import { DataFile, IDataFile, Kind as DataFileKind } from '../../src/models/data/DataFile.js';
import { DefaultOwner } from '../../src/models/store/File.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';

describe('Models', () => {
  describe('data', () => {
    describe('DataFile', () => {
      describe('DataFile.fromDataNamespace()', () => {
        it('sets the kind', () => {
          const p1 = DataNamespace.fromName('p1');
          const result = DataFile.fromDataNamespace(p1);
          assert.equal(result.kind, DataFileKind);
        });
  
        it('sets the name', () => {
          const p1 = DataNamespace.fromName('p1');
          const result = DataFile.fromDataNamespace(p1);
          assert.equal(result.info.name, 'p1');
        });
  
        it('sets the key', () => {
          const p1 = DataNamespace.fromName('p1');
          const result = DataFile.fromDataNamespace(p1);
          assert.equal(result.key, p1.key);
        });
  
        it('sets the default owner', () => {
          const p1 = DataNamespace.fromName('p1');
          const result = DataFile.fromDataNamespace(p1);
          assert.equal(result.owner, DefaultOwner);
        });

        it('sets the configured owner', () => {
          const p1 = DataNamespace.fromName('p1');
          const result = DataFile.fromDataNamespace(p1, 'other');
          assert.equal(result.owner, 'other');
        });
  
        it('respects schema instead of instance', () => {
          const p1 = DataNamespace.fromName('p1');
          const result = DataFile.fromDataNamespace(p1.toJSON());
          assert.equal(result.info.name, 'p1');
        });
      });
  
      describe('constructor()', () => {
        it('creates a default data file', () => {
          const result = new DataFile();
          assert.equal(result.kind, DataFileKind);
          assert.equal(result.owner, DefaultOwner);
          assert.typeOf(result.key, 'string');
          assert.typeOf(result.lastModified, 'object');
        });
  
        it('creates a data file from the schema values', () => {
          const schema: IDataFile = {
            kind: DataFileKind,
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
          const result = new DataFile(schema);
          assert.equal(result.kind, DataFileKind);
          assert.equal(result.info.name, 'hello');
          assert.equal(result.owner, 'me');
          assert.equal(result.key, '123');
          assert.deepEqual(result.parents, ['p1']);
          assert.deepEqual(result.permissionIds, ['pr1']);
          assert.typeOf(result.permissions, 'array');
          assert.deepEqual(result.lastModified, schema.lastModified);
          assert.deepEqual(result.labels, ['l1']);
        });
  
        it('creates a data file from the JSON schema string', () => {
          const schema: IDataFile = {
            kind: DataFileKind,
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
          const result = new DataFile(JSON.stringify(schema));
          assert.equal(result.kind, DataFileKind);
          assert.equal(result.info.name, 'hello');
          assert.equal(result.owner, 'me');
          assert.equal(result.key, '123');
          assert.deepEqual(result.lastModified, schema.lastModified);
        });
  
        it('throws when invalid schema', () => {
          assert.throws(() => {
            new DataFile(JSON.stringify({
              name: 'a name',
            }));
          });
        });
      });
  
      describe('toJSON()', () => {
        let file: DataFile;
        beforeEach(() => {
          file = new DataFile();
        });
  
        it('serializes the kind', () => {
          const result = file.toJSON();
          assert.equal(result.kind, DataFileKind);
        });
  
        it('serializes the key', () => {
          const result = file.toJSON();
          assert.equal(result.key, file.key);
        });
  
        // the "key" test tests whether the parent toJSON() is called.
      });
    });
  });
});
