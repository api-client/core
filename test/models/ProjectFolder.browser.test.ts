/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { HttpProject } from '../../src/models/HttpProject.js';
import { Kind as ProjectFolderKind, ProjectFolder, DefaultFolderName, IProjectFolder } from '../../src/models/ProjectFolder.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';
import { ProjectItem } from '../../src/models/ProjectItem.js';
import { Environment } from '../../src/models/Environment.js';
import { ProjectRequest } from '../../src/models/ProjectRequest.js';
import * as PatchUtils from '../../src/models/PatchUtils.js';

describe('Models', () => {
  describe('ProjectFolder', () => {
    describe('Initialization', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('initializes a default folder', () => {
        const result = new ProjectFolder(project);
        assert.equal(result.kind, ProjectFolderKind, 'sets the kind property');
        assert.deepEqual(result.items, [], 'sets the items property');
        assert.deepEqual(result.environments, [], 'sets the environments property');
        assert.typeOf(result.updated, 'number', 'sets the updated property');
        assert.typeOf(result.created, 'number', 'sets the created property');

        const { info } = result;
        assert.typeOf(info, 'object', 'sets the default info property');
        assert.equal(info.kind, ThingKind, 'sets the info.kind property');
        assert.equal(info.name, DefaultFolderName, 'sets the info.name property');
      });
    });

    describe('From schema initialization', () => {
      let project: HttpProject;
      let base: IProjectFolder;
      beforeEach(() => {
        project = new HttpProject();
        base = {
          kind: ProjectFolderKind,
          environments: [],
          items: [],
          updated: 123,
          created: 456,
          key: 'test1234',
          info: {
            kind: ThingKind,
            name: '',
          },
        }
      });

      it('sets the info', () => {
        const init: IProjectFolder = { ...base, ...{ info: {
          kind: ThingKind,
          name: 'Test project',
          description: 'Project description',
          version: '1.2.3',
        }}};
        const result = new ProjectFolder(project, init);
        const { info } = result;
        assert.equal(info.kind, ThingKind, 'sets the info.kind property');
        assert.equal(info.name, 'Test project', 'sets the info.name property');
        assert.equal(info.description, 'Project description', 'sets the info.description property');
        assert.equal(info.version, '1.2.3', 'sets the info.version property');
      });

      it('sets the created/updated', () => {
        const result = new ProjectFolder(project, base);
        assert.equal(result.created, 456);
        assert.equal(result.updated, 123);
      });

      it('sets the passed key', () => {
        const result = new ProjectFolder(project, base);
        assert.equal(result.key, 'test1234');
      });

      it('sets a new key when the passed key is missing', () => {
        delete base.key;
        const result = new ProjectFolder(project, base);
        assert.typeOf(result.key, 'string');
      });

      it('creates the default items', () => {
        delete base.items;
        const result = new ProjectFolder(project, base);
        assert.deepEqual(result.items, []);
      });

      it('sets the stored items', () => {
        base.items = [ProjectItem.projectFolder(project, 'a-key')];
        const serialized = JSON.stringify(base);
        const result = new ProjectFolder(project, serialized);
        assert.lengthOf(result.items, 1, 'has a single item');
        assert.equal(result.items[0].key, 'a-key', 'has the serialized item');
      });

      it('creates the default environments', () => {
        delete base.environments;
        const result = new ProjectFolder(project, base);
        assert.deepEqual(result.environments, []);
      });

      it('sets the stored items', () => {
        const env = Environment.fromName('a-key');
        base.environments = [env.toJSON()];
        const serialized = JSON.stringify(base);
        const result = new ProjectFolder(project, serialized);
        assert.lengthOf(result.environments, 1, 'has a single item');
        assert.equal(result.environments[0].key, env.key, 'has the serialized item');
      });
    });

    describe('toJSON()', () => {
      let project: HttpProject;
      let base: IProjectFolder;
      beforeEach(() => {
        project = new HttpProject();
        base = {
          kind: ProjectFolderKind,
          environments: [],
          items: [],
          updated: 123,
          created: 456,
          key: 'test1234',
          info: {
            kind: ThingKind,
            name: '',
          },
        }
      });
  
      it('serializes the info object', () => {
        const init: IProjectFolder = { ...base, ...{ info: {
          kind: ThingKind,
          name: 'Test project',
          description: 'Project description',
          version: '1.2.3',
        }}};
        const folder = new ProjectFolder(project, init);
        const result = folder.toJSON();
        assert.equal(result.info.kind, ThingKind, 'has the kind');
        assert.equal(result.info.name, 'Test project', 'has the name');
        assert.equal(result.info.description, 'Project description', 'has the description');
        assert.equal(result.info.version, '1.2.3', 'has the version');
      });

      it('serializes the key', () => {
        const init: IProjectFolder = { ...base };
        const folder = new ProjectFolder(project, init);
        const result = folder.toJSON();
        assert.equal(result.key, init.key);
      });

      it('serializes the created/updated', () => {
        const init: IProjectFolder = { ...base };
        const folder = new ProjectFolder(project, init);
        const result = folder.toJSON();
        assert.equal(result.created, init.created);
        assert.equal(result.updated, init.updated);
      });

      it('serializes the items', () => {
        const init: IProjectFolder = { ...base, ...{ items: [ProjectItem.projectFolder(project, 'a-key')] } };
        const folder = new ProjectFolder(project, init);
        const result = folder.toJSON();
        assert.lengthOf(result.items, 1);
      });

      it('serializes the environments', () => {
        const env = Environment.fromName('a-key');
        const init: IProjectFolder = { ...base, ...{ environments: [env.toJSON()] } };
        const folder = new ProjectFolder(project, init);
        const result = folder.toJSON();
        assert.lengthOf(result.environments, 1);
      });
    });

    describe('fromName()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('sets the name', () => {
        const result = ProjectFolder.fromName(project, 'a name');
        assert.equal(result.info.name, 'a name');
      });

      it('generates the key', () => {
        const result = ProjectFolder.fromName(project, 'a name');
        assert.typeOf(result.key, 'string');
      });

      it('generates the created/updated', () => {
        const result = ProjectFolder.fromName(project, 'a name');
        assert.approximately(result.updated, Date.now(), 2);
        assert.approximately(result.created, Date.now(), 2);
      });

      it('adds empty items', () => {
        const result = ProjectFolder.fromName(project, 'a name');
        assert.deepEqual(result.items, []);
      });

      it('adds empty environments', () => {
        const result = ProjectFolder.fromName(project, 'a name');
        assert.deepEqual(result.environments, []);
      });

      it('sets the kind', () => {
        const result = ProjectFolder.fromName(project, 'a name');
        assert.equal(result.kind, ProjectFolderKind);
      });
    });

    describe('addFolder()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('calls the project\'s add folder function', () => {
        const parent = project.addFolder('parent');
        const spy = sinon.spy(project, 'addFolder');
        parent.addFolder('a folder');
        assert.isTrue(spy.calledOnce);
        assert.equal(spy.args[0][0], 'a folder', 'has the name');
        assert.deepEqual(spy.args[0][1], { parent: parent.key }, 'has the options');
      });

      it('adds the folder to the items', () => {
        const parent = project.addFolder('parent');
        parent.addFolder('sub');
        assert.lengthOf(parent.items, 1);
      });
    });

    describe('addRequest()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('calls the project\'s add request function', () => {
        const parent = project.addFolder('parent');
        const spy = sinon.spy(project, 'addRequest');
        const request = ProjectRequest.fromName('test', project);
        parent.addRequest(request);
        assert.isTrue(spy.calledOnce);
        assert.deepEqual(spy.args[0][0], request, 'has the request');
        assert.deepEqual(spy.args[0][1], { parent: parent.key }, 'has the options');
      });

      it('adds the request to the items', () => {
        const parent = project.addFolder('parent');
        const request = ProjectRequest.fromName('test', project);
        parent.addRequest(request);
        assert.lengthOf(parent.items, 1);
      });
    });

    describe('listFolderItems()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('returns empty array when no folders', () => {
        const folder = project.addFolder('parent');
        
        const request = ProjectRequest.fromName('test', project);
        folder.addRequest(request);

        const result = folder.listFolderItems();
        assert.deepEqual(result, []);
      });

      it('returns folder folders', () => {
        const folder = project.addFolder('parent');
        const f1 = folder.addFolder('f1');
        const f2 = folder.addFolder('f2');
        
        const request = ProjectRequest.fromName('test', project);
        folder.addRequest(request);

        const result = folder.listFolderItems();
        assert.lengthOf(result, 2, 'has 2 items');
        assert.equal(result[0].key, f1.key, 'has the first folder');
        assert.equal(result[1].key, f2.key, 'has the second folder');
      });
    });

    describe('listRequestItems()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('returns empty array when no requests', () => {
        const folder = project.addFolder('parent');
        folder.addFolder('f1');

        const result = folder.listRequestItems();
        assert.deepEqual(result, []);
      });

      it('returns folder requests', () => {
        const folder = project.addFolder('parent');
        const request = ProjectRequest.fromName('test', project);
        folder.addRequest(request);

        const result = folder.listRequestItems();
        assert.lengthOf(result, 1, 'has the request');
        assert.equal(result[0].key, request.key, 'has the key');
      });
    });

    describe('listFolders()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('calls the project\'s listFolders function', () => {
        const folder = project.addFolder('parent');
        const spy = sinon.spy(project, 'listFolders');
        folder.listFolders();
        assert.isTrue(spy.calledOnce);
        assert.equal(spy.args[0][0], folder.key, 'has the only argument');
      });

      it('returns the list', () => {
        const folder = project.addFolder('parent');
        const child = folder.addFolder('child');
        const result = folder.listFolders();
        assert.deepEqual(result, [child]);
      });
    });

    describe('listRequests()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('calls the project\'s listRequests function', () => {
        const folder = project.addFolder('parent');
        const spy = sinon.spy(project, 'listRequests');
        folder.listRequests();
        assert.isTrue(spy.calledOnce);
        assert.equal(spy.args[0][0], folder.key, 'has the only argument');
      });

      it('returns the list', () => {
        const folder = project.addFolder('parent');

        const request = ProjectRequest.fromName('test', project);
        folder.addRequest(request);
        
        const result = folder.listRequests();
        assert.deepEqual(result, [request]);
      });
    });

    describe('patch()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('calls the Thing.patch() when manipulating the info object', () => {
        const folder = new ProjectFolder(project);
        const spy = sinon.spy(folder.info, 'patch');
        folder.patch('set', 'info.name', 'new');
        assert.isTrue(spy.calledOnce, 'the patch was called');
  
        assert.equal(spy.args[0][0], 'set', 'passes the operation');
        assert.equal(spy.args[0][1], 'name', 'passes the path');
        assert.equal(spy.args[0][2], 'new', 'passes the value');
  
        assert.equal(folder.info.name, 'new', 'updates the value');
      });

      it('throws when unknown operation', () => {
        const folder = new ProjectFolder(project);
        assert.throws(() => {
          // @ts-ignore
          folder.patch('unknown', 'provider.name', 'new');
        }, Error, 'Unknown operation: unknown.');
      });

      it('throws when not providing a value when required', () => {
        const folder = new ProjectFolder(project);
        assert.throws(() => {
          folder.patch('set', 'provider.name');
        }, Error, 'This operation requires the "value" option.');
      });

      [
        'items',
        'environments',
      ].forEach((property) => {
        it(`throws when accessing ${property}`, () => {
          const folder = new ProjectFolder(project);
          assert.throws(() => {
            folder.patch('set', `${property}.name`, 'a');
          }, Error, PatchUtils.TXT_use_command_instead);
        });
      });

      it(`throws when accessing the kind`, () => {
        const folder = new ProjectFolder(project);
        assert.throws(() => {
          folder.patch('set', `kind`, 'a');
        }, Error, PatchUtils.TXT_delete_kind);
      });

      it(`throws when accessing the key`, () => {
        const folder = new ProjectFolder(project);
        assert.throws(() => {
          folder.patch('set', `key`, 'a');
        }, Error, PatchUtils.TXT_key_is_immutable);
      });

      it(`throws when accessing an unknown property`, () => {
        const folder = new ProjectFolder(project);
        assert.throws(() => {
          folder.patch('set', `some`, 'a');
        }, Error, PatchUtils.TXT_unknown_path);
      });

      [
        'created',
        'updated',
      ].forEach((property) => {
        it(`throws when setting invalid value for ${property}`, () => {
          const folder = new ProjectFolder(project);
          assert.throws(() => {
            folder.patch('set', property, 'test');
          }, Error, PatchUtils.TXT_value_not_number);
        });

        it(`sets the value for ${property}`, () => {
          const folder = new ProjectFolder(project);
          folder.patch('set', property, 123456789);
          assert.equal(folder[property], 123456789);
        });

        it(`throws when trying to append to ${property}`, () => {
          const folder = new ProjectFolder(project);
          assert.throws(() => {
            folder.patch('append', property, 1234);
          }, Error, `Unable to "append" to the "${property}" property. Did you mean "set"?`);
        });

        it(`throws when trying to delete the ${property}`, () => {
          const folder = new ProjectFolder(project);
          assert.throws(() => {
            folder.patch('delete', property);
          }, Error, PatchUtils.TXT_unable_delete_value);
        });
      });
    });
  });
});
