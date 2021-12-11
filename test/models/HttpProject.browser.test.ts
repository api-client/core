/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Kind as HttpProjectKind, HttpProject, IHttpProject } from '../../src/models/HttpProject.js';
import { Kind as ProjectFolderKind, ProjectFolder } from '../../src/models/ProjectFolder.js';
import { ProjectRequest } from '../../src/models/ProjectRequest.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';
import { Kind as ProviderKind } from '../../src/models/Provider.js';
import { Kind as LicenseKind } from '../../src/models/License.js';
import { Kind as EnvironmentKind, Environment } from '../../src/models/Environment.js';
import * as PatchUtils from '../../src/models/PatchUtils.js';
// import { HttpProject, ProjectFolderKind, ProjectFolder, ThingKind, IHttpProject, HttpProjectKind } from '../../browser.js';

describe('Models', () => {
  describe('HttpProject', () => {
    describe('Initialization', () => {

      describe('Default project initialization', () => {
        it('initializes a default project', () => {
          const result = new HttpProject();
          assert.equal(result.kind, HttpProjectKind, 'sets the kind property');
          assert.deepEqual(result.definitions, [], 'sets the definitions property');
          assert.deepEqual(result.environments, [], 'sets the environments property');
          assert.deepEqual(result.items, [], 'sets the items property');
          const { info } = result;
          assert.typeOf(info, 'object', 'sets the default info property');
          assert.equal(info.kind, ThingKind, 'sets the info.kind property');
          assert.equal(info.name, '', 'sets the info.name property');
          assert.isUndefined(result.license, 'has no license property');
          assert.isUndefined(result.provider, 'has no provider property');
        });
      });

      describe('From schema initialization', () => {
        let base: IHttpProject;
        beforeEach(() => {
          base = {
            kind: HttpProjectKind,
            key: 'abc',
            definitions: [],
            environments: [],
            items: [],
            info: {
              kind: ThingKind,
              name: '',
            },
          }
        });

        it('sets the info', () => {
          const init: IHttpProject = { ...base, ...{ info: {
            kind: ThingKind,
            name: 'Test project',
            description: 'Project description',
            version: '1.2.3',
          }}};
          const project = new HttpProject(init);
          const { info } = project;
          assert.equal(info.kind, ThingKind, 'sets the info.kind property');
          assert.equal(info.name, 'Test project', 'sets the info.name property');
          assert.equal(info.description, 'Project description', 'sets the info.description property');
          assert.equal(info.version, '1.2.3', 'sets the info.version property');
        });

        it('sets the provider', () => {
          const init: IHttpProject = { ...base, ...{ provider: {
            kind: ProviderKind,
            name: 'Test Provider',
            email: 'a@b.c',
            url: 'https://test.com'
          }}};
          const project = new HttpProject(init);
          const { provider } = project;
          assert.typeOf(provider, 'object', 'has the provider')
          assert.equal(provider.kind, ProviderKind, 'sets the provider.kind property');
          assert.equal(provider.name, 'Test Provider', 'sets the provider.name property');
          assert.equal(provider.email, 'a@b.c', 'sets the provider.email property');
          assert.equal(provider.url, 'https://test.com', 'sets the provider.url property');
        });

        it('sets the license', () => {
          const init: IHttpProject = { ...base, ...{ license: {
            kind: LicenseKind,
            name: 'Test License',
            content: 'test content',
            url: 'https://test.com'
          }}};
          const project = new HttpProject(init);
          const { license } = project;
          assert.typeOf(license, 'object', 'has the license')
          assert.equal(license.kind, LicenseKind, 'sets the license.kind property');
          assert.equal(license.name, 'Test License', 'sets the license.name property');
          assert.equal(license.content, 'test content', 'sets the license.content property');
          assert.equal(license.url, 'https://test.com', 'sets the license.url property');
        });

        it('sets the environments', () => {
          const env = Environment.fromName('test environment');
          const init: IHttpProject = { ...base, ...{ environments: [env.toJSON()]}};
          const project = new HttpProject(init);
          const { environments } = project;
          assert.typeOf(environments, 'array', 'has the environments')
          assert.lengthOf(environments, 1, 'has a single environments')
          const [item] = environments;
          assert.equal(item.kind, EnvironmentKind, 'sets the item.kind property');
          assert.equal(item.info.name, env.info.name, 'sets the item.info.name property');
        });

        it('sets the items', () => {
          const init: IHttpProject = { ...base, ...{ items: [{
            kind: ProjectFolderKind,
            key: '123456',
          }]}};
          const project = new HttpProject(init);
          const { items } = project;
          assert.typeOf(items, 'array', 'has the items')
          assert.lengthOf(items, 1, 'has a single item')
          const [item] = items;
          assert.equal(item.kind, ProjectFolderKind, 'sets the item.kind property');
          assert.equal(item.key, '123456', 'sets the item.key property');
        });

        it('sets the missingDefinitions property', () => {
          const init: IHttpProject = { ...base, ...{ items: [{
            kind: ProjectFolderKind,
            key: '123456',
          }]}};
          const project = new HttpProject(init);
          const { missingDefinitions } = project;
          assert.typeOf(missingDefinitions, 'array', 'has the items')
          assert.lengthOf(missingDefinitions, 1, 'has a single item')
          const [item] = missingDefinitions;
          assert.equal(item, '123456', 'has the missing definition id');
        });

        it('sets the definitions', () => {
          const init: IHttpProject = { ...base, ...{ definitions: [{
            key: '123456',
            kind: ProjectFolderKind,
            created: 1234567,
            updated: 98765,
            info: {
              kind: ThingKind,
              name: 'test'
            },
            items: [],
          }]}};
          const project = new HttpProject(init);
          const { definitions } = project;
          assert.typeOf(definitions, 'array', 'has the items')
          assert.lengthOf(definitions, 1, 'has a single item')
          const [item] = definitions;
          assert.equal(item.kind, ProjectFolderKind, 'sets the item.kind property');
          assert.equal(item.key, '123456', 'sets the item.key property');
        });
      });

      describe('HttpProject.fromName()', () => {
        it('creates an empty project with a name', () => {
          const project = HttpProject.fromName('Test project');
          assert.equal(project.kind, HttpProjectKind, 'sets the kind property');
          assert.deepEqual(project.definitions, [], 'sets the definitions property');
          assert.deepEqual(project.environments, [], 'sets the environments property');
          assert.deepEqual(project.items, [], 'sets the items property');
          const { info } = project;
          assert.typeOf(info, 'object', 'sets the default info property');
          assert.equal(info.kind, ThingKind, 'sets the info.kind property');
          assert.equal(info.name, 'Test project', 'sets the info.name property');
          assert.isUndefined(project.license, 'has no license property');
          assert.isUndefined(project.provider, 'has no provider property');
        });
      });
    });

    describe('addFolder()', () => {
      it('returns a key of the inserted folder', () => {
        const project = new HttpProject();
        const created = project.addFolder('A folder');
        assert.typeOf(created, 'object', 'returns an object');
      });

      it('adds the folder to the items array', () => {
        const project = new HttpProject();
        const created = project.addFolder('A folder');
        const { items } = project;
        assert.lengthOf(items, 1, 'items has a single object');
        const [item] = items;

        assert.equal(item.key, created.key, 'has the key');
        assert.equal(item.kind, ProjectFolderKind, 'has the kind');
      });

      it('adds the definition', () => {
        const project = new HttpProject();
        const created = project.addFolder('A folder');
        const { definitions } = project;
        assert.lengthOf(definitions, 1, 'has the definition');
        const folder = project.definitions[0] as ProjectFolder;
        
        assert.equal(folder.kind, ProjectFolderKind, 'has the kind');
        assert.equal(folder.key, created.key, 'has the key');
        
        const { info } = folder;
        assert.typeOf(info, 'object', 'has the info object');
        assert.equal(info.kind, ThingKind, 'has the info.kind property');
        assert.equal(info.name, 'A folder', 'has the info.name property');

        assert.typeOf(folder.created, 'number', 'has the created property');
        assert.typeOf(folder.updated, 'number', 'has the updated property');
        assert.equal(folder.created, folder.updated, 'the updated and created properties equal');
        
        assert.deepEqual(folder.items, [], 'has empty items');
        assert.deepEqual(folder.environments, [], 'has empty environments');
      });

      it('adds multiple folders', () => {
        const project = new HttpProject();
        const created1 = project.addFolder('f1');
        const created2 = project.addFolder('f2');
        const created3 = project.addFolder('f3');
        assert.lengthOf(project.items, 3, 'has all items');
        assert.equal(project.items[0].key, created1.key, 'has item #1');
        assert.equal(project.items[1].key, created2.key, 'has item #2');
        assert.equal(project.items[2].key, created3.key, 'has item #3');
      });

      it('adds a folder of a folder', () => {
        const project = new HttpProject();
        const created1 = project.addFolder('f1');
        const folder = project.findFolder(created1.key);
        const created2 = folder.addFolder('inception');
        assert.lengthOf(project.items, 1, 'project has a single item');
        assert.lengthOf(project.definitions, 2, 'project has a two definitions');
        
        const theFolder = project.definitions[1] as ProjectFolder;
        assert.equal(theFolder.key, created2.key, 'adds the sub folder definition to the project');
        assert.equal(theFolder.info.name, 'inception', 'sub-folder has the name');
      });

      it('ignores adding when the folder already exists', () => {
        const project = new HttpProject();
        const created1 = project.addFolder('f1');
        const created2 = project.addFolder('f1', { skipExisting: true });
        assert.deepEqual(created1, created2);
      });

      it('adds a folder on a specific position', () => {
        const project = new HttpProject();
        project.addFolder('f1');
        project.addFolder('f2');
        project.addFolder('f3');
        const inserted = project.addFolder('f4', { index: 1 });
        assert.equal(project.items[1].key, inserted.key);
      });
    });

    describe('findFolder()', () => {
      it('returns undefine when no definitions', () => {
        const project = new HttpProject();
        const result = project.findFolder('abc');
        assert.isUndefined(result);
      });

      it('finds the folder by the name', () => {
        const project = new HttpProject();
        const created = project.addFolder('abc');
        const result = project.findFolder('abc');
        assert.deepEqual(result, created);
      });

      it('finds the folder by the key', () => {
        const project = new HttpProject();
        const created = project.addFolder('abc');
        const result = project.findFolder(created.key);
        assert.deepEqual(result, created);
      });

      it('returns undefined for the keyOnly option', () => {
        const project = new HttpProject();
        project.addFolder('abc');
        const result = project.findFolder('abc', { keyOnly: true });
        assert.isUndefined(result);
      });

      it('returns a folder only', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('abc', project);
        project.addRequest(request);
        const created = project.addFolder('abc');
        const result = project.findFolder('abc');
        assert.deepEqual(result, created);
      });
    });

    describe('removeFolder()', () => {
      it('removes the folder from the project', () => {
        const name = 'abc';
        const project = new HttpProject();
        const created = project.addFolder(name);
        project.removeFolder(created.key);
        const result = project.findFolder(name);
        assert.isUndefined(result);
      });

      it('removes the folder from the project items', () => {
        const name = 'abc';
        const project = new HttpProject();
        const created = project.addFolder(name);
        assert.lengthOf(project.items, 1, 'has an item');
        project.removeFolder(created.key);
        project.findFolder(name);
        assert.deepEqual(project.items, [], 'the items is empty');
      });

      it('removes the folder from the definitions', () => {
        const name = 'abc';
        const project = new HttpProject();
        const created = project.addFolder(name);
        assert.lengthOf(project.definitions, 1, 'has a definition');
        project.removeFolder(created.key);
        project.findFolder(name);
        assert.deepEqual(project.definitions, [], 'the definitions is empty');
      });

      it('removes the folder from a parent folder', () => {
        const name = 'abc';
        const project = new HttpProject();
        const parent = project.addFolder('parent');
        const created = project.addFolder(name, { parent: parent.key });
        project.removeFolder(created.key);
        const result = project.findFolder(name);
        assert.isUndefined(result);
      });

      it('removes the folder from the parent folder items', () => {
        const name = 'abc';
        const project = new HttpProject();
        const parent = project.addFolder('parent');
        const created = project.addFolder(name, { parent: parent.key });
        assert.lengthOf(parent.items, 1, 'has an item');
        project.removeFolder(created.key);
        project.findFolder(name);
        assert.deepEqual(parent.items, [], 'the items is empty');
      });

      it('removes the folder from the definitions', () => {
        const name = 'abc';
        const project = new HttpProject();
        const parent = project.addFolder('parent');
        const created = project.addFolder(name, { parent: parent.key });
        assert.lengthOf(project.definitions, 2, 'has 2 definitions');
        project.removeFolder(created.key);
        project.findFolder(name);
        assert.lengthOf(project.definitions, 1, 'has 1 definition');
      });

      it('throws an error when folder is not found', () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.removeFolder('hello');
        });
      });

      it('does not throw with the safe option', () => {
        const project = new HttpProject();
        assert.doesNotThrow(() => {
          project.removeFolder('hello', { safe: true });
        });
      });

      it('calls detachedCallback() on the folder', () => {
        const project = new HttpProject();
        const created = project.addFolder('test');
        const spy = sinon.spy(created, 'detachedCallback');
        project.removeFolder(created.key);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('findParent()', () => {
      it('finds a parent for a root level folder', () => {
        const project = new HttpProject();
        const created = project.addFolder('test');
        const parent = project.findParent(created.key);
        assert.deepEqual(parent, project);
      });

      it('finds a parent for a root level request', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('request', project);
        const created = project.addRequest(request);
        const parent = project.findParent(created.key);
        assert.deepEqual(parent, project);
      });

      it('finds a parent for a sub-folder', () => {
        const project = new HttpProject();
        const folder = project.addFolder('parent');
        const created = project.addFolder('test', { parent: folder.key });
        const parent = project.findParent(created.key);
        assert.deepEqual(parent, folder);
      });

      it('finds a parent for a root level request', () => {
        const project = new HttpProject();
        const folder = project.addFolder('parent');
        const request = ProjectRequest.fromName('request', project);
        const created = project.addRequest(request, { parent: folder.key });
        const parent = project.findParent(created.key);
        assert.deepEqual(parent, folder);
      });

      it('returns undefined when not found', () => {
        const project = new HttpProject();
        const folder = project.addFolder('parent');
        project.addFolder('test', { parent: folder.key });
        const parent = project.findParent('other');
        assert.isUndefined(parent);
      });
    });

    describe('moveFolder()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
        const folder1 = project.addFolder('folder1');
        const folder2 = project.addFolder('folder2');
        project.addFolder('folder3', { parent: folder2.key });
        const request1 = ProjectRequest.fromName('request1', project);
        const request2 = ProjectRequest.fromName('request2', project);
        const request3 = ProjectRequest.fromName('request3', project);
        const request4 = ProjectRequest.fromName('request4', project);
        project.addRequest(request1);
        folder1.addRequest(request2);
        folder1.addRequest(request3);
        folder1.addRequest(request4);
      });

      it('moves a folder to an index position inside the project root', () => {
        const moved = project.findFolder('folder1');
        const indexBefore = project.items.findIndex(i => i.key === moved.key);
        assert.equal(indexBefore, 0, 'the item is on position 0 initially');
        project.moveFolder(moved.key, { index: 1 });
        const index = project.items.findIndex(i => i.key === moved.key);
        assert.equal(index, 1, 'is moved to a new position');
      });

      it('moves a folder to the end inside the project root', () => {
        const moved = project.findFolder('folder1');
        const indexBefore = project.items.findIndex(i => i.key === moved.key);
        assert.equal(indexBefore, 0, 'the item is on position 0 initially');
        project.moveFolder(moved.key);
        const index = project.items.findIndex(i => i.key === moved.key);
        assert.equal(index, 2, 'is moved to the end');
      });

      it('moves a folder to another folder', () => {
        const oldParent = project.findFolder('folder2');
        const moved = project.findFolder('folder3');
        const target = project.findFolder('folder1');
        assert.isTrue(oldParent.items.some(i => i.key === moved.key), 'the old parent has the item');
        assert.isFalse(target.items.some(i => i.key === moved.key), 'the target doesn\'t have the moved item');
        project.moveFolder(moved.key, { parent: target.key });
        assert.isFalse(oldParent.items.some(i => i.key === moved.key), 'the item is removed from the old parent');
        assert.equal(target.items[target.items.length - 1].key, moved.key, 'the item is inserted at the end of the target');
      });

      it('moves a folder to another folder into a position', () => {
        const moved = project.findFolder('folder3');
        const target = project.findFolder('folder1');
        project.moveFolder(moved.key, { parent: target.key, index: 1 });
        assert.equal(target.items[1].key, moved.key, 'the item is inserted at the position');
      });

      it('moves a folder to the project root', () => {
        const moved = project.findFolder('folder3');
        project.moveFolder(moved.key);
        assert.equal(project.items[project.items.length - 1].key, moved.key);
      });

      it('moves a folder to the project root at position', () => {
        const moved = project.findFolder('folder3');
        project.moveFolder(moved.key, { index: 1 });
        assert.equal(project.items[1].key, moved.key);
      });

      it('throws when moving into a position that is out of bounds', () => {
        const moved = project.findFolder('folder3');
        assert.throws(() => {
          project.moveFolder(moved.key, { index: 3 });
        }, RangeError, 'Index out of bounds. Maximum index is 2.');
      });

      it('throws when the folder is not found', () => {
        assert.throws(() => {
          project.moveFolder('unknown');
        }, Error, 'Unable to locate the folder unknown');
      });

      it('throws when the parent is not found', () => {
        const moved = project.findFolder('folder3');
        assert.throws(() => {
          project.moveFolder(moved.key, { parent: 'unknown' });
        }, Error, 'Unable to locate the new parent folder unknown');
      });

      it('throws when moving a parent to its child', () => {
        const parent = project.findFolder('folder2');
        const child = project.findFolder('folder3');
        assert.throws(() => {
          project.moveFolder(parent.key, { parent: child.key });
        }, RangeError, 'Unable to move a folder to its child.');
      });
    });

    describe('hasChild()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
        const folder1 = project.addFolder('folder1');
        const folder2 = project.addFolder('folder2', { parent: folder1.key });
        const folder3 = project.addFolder('folder3', { parent: folder2.key });
        project.addFolder('folder4');
        const request1 = ProjectRequest.fromName('request1', project);
        const request2 = ProjectRequest.fromName('request2', project);
        const request3 = ProjectRequest.fromName('request3', project);
        const request4 = ProjectRequest.fromName('request4', project);
        project.addRequest(request1);
        folder1.addRequest(request2);
        folder1.addRequest(request3);
        folder3.addRequest(request4);
      });

      it('returns true when the project has a child request (direct)', () => {
        const request = project.findRequest('request1');
        const result = project.hasChild(request.key);
        assert.isTrue(result);
      });

      it('returns true when the project has a child request (indirect)', () => {
        const request = project.findRequest('request4');
        const result = project.hasChild(request.key);
        assert.isTrue(result);
      });

      it('returns true when the project has a child folder (direct)', () => {
        const folder = project.findFolder('folder1');
        const result = project.hasChild(folder.key);
        assert.isTrue(result);
      });

      it('returns true when the project has a child folder (indirect)', () => {
        const folder = project.findFolder('folder3');
        const result = project.hasChild(folder.key);
        assert.isTrue(result);
      });

      it('returns true when a folder has a child request (direct)', () => {
        const parent = project.findFolder('folder1');
        const request = project.findRequest('request2');
        const result = project.hasChild(request.key, parent.key);
        assert.isTrue(result);
      });

      it('returns true when a folder has a child request (indirect)', () => {
        const parent = project.findFolder('folder1');
        const request = project.findRequest('request4');
        const result = project.hasChild(request.key, parent.key);
        assert.isTrue(result);
      });

      it('returns true when a folder has a child folder (direct)', () => {
        const parent = project.findFolder('folder1');
        const folder = project.findFolder('folder2');
        const result = project.hasChild(folder.key, parent.key);
        assert.isTrue(result);
      });

      it('returns true when a folder has a child request (indirect)', () => {
        const parent = project.findFolder('folder1');
        const folder = project.findFolder('folder3');
        const result = project.hasChild(folder.key, parent.key);
        assert.isTrue(result);
      });

      it('returns false when the folder has no a folder as a child', () => {
        const parent = project.findFolder('folder1');
        const folder = project.findFolder('folder4');
        const result = project.hasChild(folder.key, parent.key);
        assert.isFalse(result);
      });

      it('returns false when the project has no folder as a child', () => {
        const result = project.hasChild('unknown');
        assert.isFalse(result);
      });

      it('returns false when a folder has no request as a child', () => {
        const parent = project.findFolder('folder1');
        const request = project.findRequest('request1');
        const result = project.hasChild(request.key, parent.key);
        assert.isFalse(result);
      });
    });

    describe('addRequest()', () => {
      it('adds an instance of the request', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('test', project);
        const created = project.addRequest(request);
        assert.deepEqual(created, request);

        assert.lengthOf(project.definitions, 1, 'has one definition');
        assert.deepEqual(project.definitions[0], created, 'inserts the definition into project\'s definitions');
        assert.equal(project.items[0].key, created.key, 'the project has the item');

        assert.equal(created.getParent().kind, HttpProjectKind, 'the request has the parent as the project');
      });

      it.only('adds the request from the schema', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('test', project);
        const schema = request.toJSON();
        const created = project.addRequest(schema);
        
        assert.deepEqual(created, request);

        assert.lengthOf(project.definitions, 1, 'has one definition');
        assert.deepEqual(project.definitions[0], created, 'inserts the definition into project\'s definitions');
        assert.equal(project.items[0].key, created.key, 'the project has the item');
        
        assert.equal(created.getParent().kind, HttpProjectKind, 'the request has the parent as the project');
      });

      it('adds the request to a folder', () => {
        const project = new HttpProject();
        const folder = project.addFolder('a folder');
        
        const request = ProjectRequest.fromName('test', project);
        const created = project.addRequest(request, { parent: folder.key });
        
        assert.lengthOf(project.definitions, 2, 'has two definitions');
        assert.deepEqual(project.definitions[1], created, 'inserts the definition into project\'s definitions');
        assert.lengthOf(folder.items, 1, 'the folder has a single item');
        assert.equal(folder.items[0].key, created.key, 'the folder has the item');

        assert.deepEqual(created.getParent(), folder, 'the request has the parent as the folder');
      });

      it('adds the key if missing', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('test', project);
        const schema = request.toJSON();
        delete schema.key;
        const created = project.addRequest(schema);
        
        assert.typeOf(created.key, 'string', 'has a new key');
      });

      it('calls the attachedCallback() on the request', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('test', project);
        const spy = sinon.spy(request, 'attachedCallback');
        project.addRequest(request);
        
        assert.isTrue(spy.calledOnce);
      });

      it('throws when parent folder not found', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('test', project);
        
        assert.throws(() => {
          project.addRequest(request, { parent: 'unknown' });
        }, Error, 'Unable to find the parent folder unknown.');
      });

      it('throws when index out of bounds', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('test', project);
        
        assert.throws(() => {
          project.addRequest(request, { index: 1 });
        }, RangeError, 'Index out of bounds. Maximum index is 0.');
      });
    });

    describe('findRequest()', () => {
      it('returns undefined when no definitions', () => {
        const project = new HttpProject();
        const result = project.findRequest('abc');
        assert.isUndefined(result);
      });

      it('finds the request by the name', () => {
        const project = new HttpProject();
        const created = ProjectRequest.fromName('abc', project);
        project.addRequest(created);
        const result = project.findRequest('abc');
        assert.deepEqual(result, created);
      });

      it('finds the request by the key', () => {
        const project = new HttpProject();
        const created = ProjectRequest.fromName('abc', project);
        project.addRequest(created);
        const result = project.findRequest(created.key);
        assert.deepEqual(result, created);
      });

      it('returns undefined for the keyOnly option', () => {
        const project = new HttpProject();
        project.addRequest(ProjectRequest.fromName('abc', project));
        const result = project.findRequest('abc', { keyOnly: true });
        assert.isUndefined(result);
      });

      it('returns a request only', () => {
        const project = new HttpProject();
        project.addFolder('abc');
        const request = ProjectRequest.fromName('abc', project);
        project.addRequest(request);
        const result = project.findRequest('abc');
        assert.deepEqual(result, request);
      });
    });

    describe('removeRequest()', () => {
      it('removes the request from the project', () => {
        const name = 'abc';
        const project = new HttpProject();
        const created = ProjectRequest.fromName(name, project);
        project.addRequest(created);
        project.removeRequest(created.key);
        const result = project.findRequest(name);
        assert.isUndefined(result);
      });

      it('removes the request from the project items', () => {
        const project = new HttpProject();
        const created = ProjectRequest.fromName('test', project);
        project.addRequest(created);
        assert.lengthOf(project.items, 1, 'has an item');
        project.removeRequest(created.key);
        assert.deepEqual(project.items, [], 'the items is empty');
      });

      it('removes the request from the definitions', () => {
        const project = new HttpProject();
        const created = ProjectRequest.fromName('test', project);
        project.addRequest(created);
        assert.lengthOf(project.definitions, 1, 'has a definition');
        project.removeRequest(created.key);
        assert.deepEqual(project.definitions, [], 'the definitions is empty');
      });

      it('removes the request from a parent folder', () => {
        const name = 'abc';
        const project = new HttpProject();
        const parent = project.addFolder('parent');
        const created = ProjectRequest.fromName(name, project);
        project.addRequest(created, { parent: parent.key });
        project.removeRequest(created.key);
        const result = project.findRequest(name);
        assert.isUndefined(result);
      });

      it('removes the request from the parent folder items', () => {
        const name = 'abc';
        const project = new HttpProject();
        const parent = project.addFolder('parent');
        const created = ProjectRequest.fromName(name, project);
        project.addRequest(created, { parent: parent.key });
        assert.lengthOf(parent.items, 1, 'has an item');
        project.removeRequest(created.key);
        assert.deepEqual(parent.items, [], 'the items is empty');
      });

      it('removes the request from the definitions', () => {
        const name = 'abc';
        const project = new HttpProject();
        const parent = project.addFolder('parent');
        const created = ProjectRequest.fromName(name, project);
        project.addRequest(created, { parent: parent.key });
        assert.lengthOf(project.definitions, 2, 'has 2 definitions');
        project.removeRequest(created.key);
        assert.lengthOf(project.definitions, 1, 'has 1 definition');
      });

      it('throws an error when the request is not found', () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.removeRequest('hello');
        });
      });

      it('does not throw with the safe option', () => {
        const project = new HttpProject();
        assert.doesNotThrow(() => {
          project.removeRequest('hello', { safe: true });
        });
      });

      it('calls detachedCallback() on the request', () => {
        const project = new HttpProject();
        const created = ProjectRequest.fromName('test', project);
        project.addRequest(created);
        const spy = sinon.spy(created, 'detachedCallback');
        project.removeRequest(created.key);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('moveRequest()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
        const folder1 = project.addFolder('folder1');
        const folder2 = project.addFolder('folder2');
        project.addFolder('folder3', { parent: folder2.key });
        const request1 = ProjectRequest.fromName('request1', project);
        const request2 = ProjectRequest.fromName('request2', project);
        const request3 = ProjectRequest.fromName('request3', project);
        const request4 = ProjectRequest.fromName('request4', project);
        project.addRequest(request1);
        folder1.addRequest(request2);
        folder1.addRequest(request3);
        folder1.addRequest(request4);
      });

      it('moves a request to the end of project root from a folder', () => {
        const oldParent = project.findFolder('folder1');
        const moved = project.findRequest('request2');
        assert.isTrue(oldParent.items.some(i => i.key === moved.key), 'the old parent has the request');
        project.moveRequest(moved.key);
        assert.isFalse(oldParent.items.some(i => i.key === moved.key), 'removes the request from the old parent');
        assert.equal(project.items[project.items.length - 1].key, moved.key, 'project has the request');
      });

      it('moves a request to the specific position of the project root from a folder', () => {
        const moved = project.findRequest('request2');
        project.moveRequest(moved.key, { index: 0 });
        assert.equal(project.items[0].key, moved.key);
      });

      it('moves a request from the project root to a folder at the end', () => {
        const moved = project.findRequest('request1');
        const parent = project.findFolder('folder2');
        project.moveRequest(moved.key, { parent: parent.key });
        assert.isFalse(project.items.some(i => i.key === moved.key), 'removes the request from the project\'s root');
        assert.equal(parent.items[parent.items.length - 1].key, moved.key, 'the parent has the request');
      });

      it('moves a request from the project root to a folder at a position', () => {
        const moved = project.findRequest('request1');
        const parent = project.findFolder('folder1');
        project.moveRequest(moved.key, { parent: parent.key, index: 1 });
        assert.isFalse(project.items.some(i => i.key === moved.key), 'removes the request from the project\'s root');
        assert.equal(parent.items[1].key, moved.key, 'the parent has the request');
      });

      it('moves a request from a folder to a folder at the end', () => {
        const moved = project.findRequest('request1');
        const oldParent = project.findFolder('folder1');
        const parent = project.findFolder('folder2');
        project.moveRequest(moved.key, { parent: parent.key });
        assert.isFalse(oldParent.items.some(i => i.key === moved.key), 'removes the request from the old parent');
        assert.equal(parent.items[parent.items.length - 1].key, moved.key, 'the parent has the request');
      });

      it('moves a request from a folder root to a folder at a position', () => {
        const moved = project.findRequest('request1');
        const parent = project.findFolder('folder2');
        project.moveRequest(moved.key, { parent: parent.key, index: 0 });
        assert.equal(parent.items[0].key, moved.key, 'the parent has the request');
      });

      it('calls the detachedCallback() on the request', () => {
        const moved = project.findRequest('request2');
        const spy = sinon.spy(moved, 'detachedCallback');
        project.moveRequest(moved.key);
        assert.isTrue(spy.calledOnce);
      });

      it('calls the attachedCallback() on the request', () => {
        const moved = project.findRequest('request2');
        const spy = sinon.spy(moved, 'attachedCallback');
        project.moveRequest(moved.key);
        assert.isTrue(spy.calledOnce);
      });

      it('throws when moving into a position that is out of bounds', () => {
        const moved = project.findRequest('request2');
        const parent = project.findFolder('folder3');
        assert.throws(() => {
          project.moveRequest(moved.key, { parent: parent.key, index: 3 });
        }, RangeError, 'Index out of bounds. Maximum index is 0.');
      });

      it('throws when the request is not found', () => {
        assert.throws(() => {
          project.moveRequest('unknown');
        }, Error, 'Unable to locate the request unknown');
      });

      it('throws when the parent is not found', () => {
        const moved = project.findRequest('request2');
        assert.throws(() => {
          project.moveRequest(moved.key, { parent: 'unknown' });
        }, Error, 'Unable to locate the new parent folder unknown');
      });
    });

    describe('listFolderItems()', () => {
      it('returns empty array when no items', () => {
        const project = new HttpProject();
        const result = project.listFolderItems();
        assert.deepEqual(result, []);
      });

      it('ignores request items', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('name', project);
        project.addRequest(request);
        const result = project.listFolderItems();
        assert.deepEqual(result, []);
      });

      it('returns folders', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('name', project);
        project.addRequest(request);
        const folder = project.addFolder('a folder');
        const result = project.listFolderItems();
        assert.lengthOf(result, 1, 'has a single result');
        assert.equal(result[0].key, folder.key);
      });
    });

    describe('listRequestItems()', () => {
      it('returns empty array when no items', () => {
        const project = new HttpProject();
        const result = project.listRequestItems();
        assert.deepEqual(result, []);
      });

      it('ignores folder items', () => {
        const project = new HttpProject();
        project.addFolder('a folder');
        const result = project.listRequestItems();
        assert.deepEqual(result, []);
      });

      it('returns requests', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromName('name', project);
        project.addRequest(request);
        project.addFolder('a folder');
        const result = project.listRequestItems();
        assert.lengthOf(result, 1, 'has a single result');
        assert.equal(result[0].key, request.key);
      });
    });

    describe('listFolders()', () => {
      it('lists folders from the project', () => {
        const project = new HttpProject();
        const f1 = project.addFolder('f1');
        const f2 = project.addFolder('f2');
        f2.addFolder('f3');
        project.addRequest(ProjectRequest.fromName('r1', project));
        const result = project.listFolders();
        assert.lengthOf(result, 2, 'has both folders');
        assert.equal(result[0].key, f1.key);
        assert.equal(result[1].key, f2.key);
      });

      it('lists folders from a folder', () => {
        const project = new HttpProject();
        project.addFolder('f1');
        const f2 = project.addFolder('f2');
        const f3 = f2.addFolder('f3');
        f2.addRequest(ProjectRequest.fromName('r1', project));
        const result = project.listFolders(f2.key);
        assert.lengthOf(result, 1, 'has a single folder');
        assert.equal(result[0].key, f3.key);
      });

      it('returns empty list when no items', () => {
        const project = new HttpProject();
        const f1 = project.addFolder('f1');
        const result = project.listFolders(f1.key);
        assert.deepEqual(result, []);
      });

      it('throws when parent folder not found', () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.listFolders('unknown');
        }, Error, 'Unable to find the folder unknown.');
      });
    });

    describe('listRequests()', () => {
      it('lists requests from the project', () => {
        const project = new HttpProject();
        const folder = project.addFolder('f1');
        const request = ProjectRequest.fromName('r1', project);
        project.addRequest(request);
        project.addRequest(ProjectRequest.fromName('r2', project), { parent: folder.key });
        const result = project.listRequests();
        assert.lengthOf(result, 1, 'has a single request');
        assert.equal(result[0].key, request.key);
      });

      it('lists requests from a folder', () => {
        const project = new HttpProject();
        const folder = project.addFolder('f1');
        const request = ProjectRequest.fromName('r1', project);
        project.addRequest(ProjectRequest.fromName('r2', project));
        project.addRequest(request, { parent: folder.key });
        const result = project.listRequests(folder.key);
        assert.lengthOf(result, 1, 'has a single folder');
        assert.equal(result[0].key, request.key);
      });

      it('returns empty list when no items', () => {
        const project = new HttpProject();
        const f1 = project.addFolder('f1');
        const result = project.listRequests(f1.key);
        assert.deepEqual(result, []);
      });

      it('throws when parent folder not found', () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.listRequests('unknown');
        }, Error, 'Unable to find the folder unknown.');
      });
    });

    describe('listDefinitions()', () => {
      it('returns all definitions for a project root', () => {
        const project = new HttpProject();
        const folder = project.addFolder('f1');
        const request = ProjectRequest.fromName('name', project);
        project.addRequest(request);
        const result = project.listDefinitions();
        assert.lengthOf(result, 2, 'has both definitions');
        assert.equal(result[0].key, folder.key, 'has the folder')
        assert.equal(result[1].key, request.key, 'has the request')
      });

      it('returns only the project definitions', () => {
        const project = new HttpProject();
        const folder = project.addFolder('f1');
        const request = ProjectRequest.fromName('name', project);
        project.addRequest(request);

        project.addFolder('other', { parent: folder.key });
        project.addRequest(ProjectRequest.fromName('other', project), { parent: folder.key });
        
        const result = project.listDefinitions();
        assert.lengthOf(result, 2, 'has both definitions');
        assert.equal(result[0].key, folder.key, 'has the folder')
        assert.equal(result[1].key, request.key, 'has the request')
      });

      it('returns all definitions for a folder', () => {
        const project = new HttpProject();
        const folder = project.addFolder('f1');
        const request = ProjectRequest.fromName('name', project);
        project.addRequest(request, { parent: folder.key });
        const sub = folder.addFolder('sub');
        sub.addFolder('sub-sub');

        const result = project.listDefinitions(folder.key);
        assert.lengthOf(result, 2, 'has both definitions');
        assert.equal(result[0].key, request.key, 'has the request');
        assert.equal(result[1].key, sub.key, 'has the folder');
      });
    });

    describe('patch()', () => {
      it('calls the Thing.patch() when manipulating the info object', () => {
        const project = new HttpProject();
        const spy = sinon.spy(project.info, 'patch');
        project.patch('set', 'info.name', 'new');
        assert.isTrue(spy.calledOnce, 'the patch was called');

        assert.equal(spy.args[0][0], 'set', 'passes the operation');
        assert.equal(spy.args[0][1], 'name', 'passes the path');
        assert.equal(spy.args[0][2], 'new', 'passes the value');

        assert.equal(project.info.name, 'new', 'updates the value');
      });

      it('calls the License.patch() when manipulating the license object', () => {
        const project = new HttpProject();
        const license = project.ensureLicense();
        const spy = sinon.spy(license, 'patch');
        project.patch('set', 'license.name', 'new');
        assert.isTrue(spy.calledOnce, 'the patch was called');

        assert.equal(spy.args[0][0], 'set', 'passes the operation');
        assert.equal(spy.args[0][1], 'name', 'passes the path');
        assert.equal(spy.args[0][2], 'new', 'passes the value');

        assert.equal(project.license.name, 'new', 'updates the value');
      });

      it('calls the Provider.patch() when manipulating the provider object', () => {
        const project = new HttpProject();
        const provider = project.ensureProvider();
        const spy = sinon.spy(provider, 'patch');
        project.patch('set', 'provider.name', 'new');
        assert.isTrue(spy.calledOnce, 'the patch was called');

        assert.equal(spy.args[0][0], 'set', 'passes the operation');
        assert.equal(spy.args[0][1], 'name', 'passes the path');
        assert.equal(spy.args[0][2], 'new', 'passes the value');

        assert.equal(project.provider.name, 'new', 'updates the value');
      });

      it('creates the license when doesn\'t exists', () => {
        const project = new HttpProject();
        project.patch('set', 'license.name', 'new');

        assert.equal(project.license.name, 'new', 'updates the value');
      });

      it('creates the provider when doesn\'t exists', () => {
        const project = new HttpProject();
        project.patch('set', 'provider.name', 'new');

        assert.equal(project.provider.name, 'new', 'updates the value');
      });

      it('throws when unknown operation', () => {
        const project = new HttpProject();
        assert.throws(() => {
          // @ts-ignore
          project.patch('unknown', 'provider.name', 'new');
        }, Error, 'Unknown operation: unknown.');
      });

      it('throws when not providing a value when required', () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.patch('set', 'provider.name');
        }, Error, 'This operation requires the "value" option.');
      });

      [
        'items',
        'environments',
        'definitions',
      ].forEach((property) => {
        it(`throws when accessing ${property}`, () => {
          const project = new HttpProject();
          assert.throws(() => {
            project.patch('set', `${property}.name`, 'a');
          }, Error, PatchUtils.TXT_use_command_instead);
        });
      });

      it(`throws when accessing the kind`, () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.patch('set', `kind`, 'a');
        }, Error, PatchUtils.TXT_delete_kind);
      });

      it(`throws when accessing an unknown property`, () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.patch('set', `some`, 'a');
        }, Error, PatchUtils.TXT_unknown_path);
      });
    });
  });
});
