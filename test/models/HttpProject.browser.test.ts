/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Kind as HttpProjectKind, HttpProject, IHttpProject } from '../../src/models/HttpProject.js';
import { Kind as ProjectFolderKind, ProjectFolder } from '../../src/models/ProjectFolder.js';
import { ProjectRequest, IProjectRequest } from '../../src/models/ProjectRequest.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';
import { Kind as ProviderKind } from '../../src/models/Provider.js';
import { Kind as LicenseKind } from '../../src/models/License.js';
import { Kind as EnvironmentKind, Environment } from '../../src/models/Environment.js';
import * as PatchUtils from '../../src/models/PatchUtils.js';
import { ProjectSchema } from '../../src/models/ProjectSchema.js';
import { ArcLegacyProject } from '../../src/models/legacy/models/ArcLegacyProject.js';
import { ARCSavedRequest } from '../../src/models/legacy/request/ArcRequest.js';
import { LegacyMock } from '../../src/mocking/LegacyMock.js';

describe('Models', () => {
  const generator = new LegacyMock();

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

        it('sets initEnvironments', () => {
          const result = new HttpProject(undefined, [
            {
              key: 'a',
              kind: 'ARC#Environment',
              info: {
                kind: 'ARC#Thing',
                name: 'test',
              },
              variables: [],
              server: {
                kind: 'ARC#Server',
                uri: 'https://api.com',
              }
            }
          ]);
          assert.typeOf(result.effectiveEnvironments, 'array');
          assert.lengthOf(result.effectiveEnvironments, 1);
          assert.equal(result.effectiveEnvironments[0].info.name, 'test');
        });

        it('passed in constructor environments override project environments', () => {
          const schema = new HttpProject({
            definitions: [],
            environments: [
              {
                key: 'b',
                kind: 'ARC#Environment',
                info: {
                  kind: 'ARC#Thing',
                  name: 'test b',
                },
                variables: [],
                server: {
                  kind: 'ARC#Server',
                  uri: 'https://domain.com',
                }
              }
            ],
            info: {
              kind: 'ARC#Thing',
              name: 'Project',
            },
            items: [],
            key: 'abc',
            kind: 'ARC#HttpProject',
          }).toJSON();
          const result = new HttpProject(schema, [
            {
              key: 'a',
              kind: 'ARC#Environment',
              info: {
                kind: 'ARC#Thing',
                name: 'test',
              },
              variables: [],
              server: {
                kind: 'ARC#Server',
                uri: 'https://api.com',
              }
            }
          ]);
          assert.typeOf(result.effectiveEnvironments, 'array');
          assert.lengthOf(result.effectiveEnvironments, 1);
          assert.equal(result.effectiveEnvironments[0].info.name, 'test');
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

      describe('From JSON string initialization', () => {
        it('restores project data from JSON string', () => {
          const orig = new HttpProject();
          orig.info.name = 'a project';
          orig.addFolder('folder');
          orig.addRequest('https://api.com');
          const str = JSON.stringify(orig);
          const result = new HttpProject(str);

          assert.equal(result.key, orig.key, 'restores the key');
          assert.equal(result.info.name, orig.info.name, 'restores the info object');
          assert.ok(result.findFolder('folder'), 'restores a folder');
          assert.ok(result.findRequest('https://api.com'), 'restores a request');
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

      describe('HttpProject.fromLegacy()', () => {
        it('sets the name', async () => {
          const init: ArcLegacyProject = {
            name: 'abc',
          };
          const result = await HttpProject.fromLegacy(init, []);
          assert.equal(result.info.name, 'abc');
        });

        it('sets the description', async () => {
          const init: ArcLegacyProject = {
            name: 'abc',
            description: 'test'
          };
          const result = await HttpProject.fromLegacy(init, []);
          assert.equal(result.info.description, 'test');
        });

        it('adds the requests', async () => {
          const init: ArcLegacyProject = {
            name: 'abc',
            description: 'test',
            requests: ['1'],
          };
          const requests: ARCSavedRequest[] = [
            {
              method: 'PUT',
              name: 'r1',
              url: 'https://',
              _id: '1',
            }
          ];
          const result = await HttpProject.fromLegacy(init, requests);
          const projectRequests = result.listRequests();
          assert.lengthOf(projectRequests, 1, 'has a single request');
          assert.equal(projectRequests[0].info.name, 'r1');
        });

        it('ignores missing requests', async () => {
          const init: ArcLegacyProject = {
            name: 'abc',
            description: 'test',
            requests: ['1', '2'],
          };
          const requests: ARCSavedRequest[] = [
            {
              method: 'PUT',
              name: 'r1',
              url: 'https://',
              _id: '1',
            },
            {
              method: 'DELETE',
              name: 'r3',
              url: 'https://api.com',
              _id: '3',
            }
          ];
          const result = await HttpProject.fromLegacy(init, requests);
          const projectRequests = result.listRequests();
          assert.lengthOf(projectRequests, 1, 'has a single request');
          assert.equal(projectRequests[0].info.name, 'r1');
        });
      });

      describe('HttpProject.fromInitOptions()', () => {
        it('sets the name', () => {
          const result = HttpProject.fromInitOptions({
            name: 'abc'
          });
          assert.equal(result.info.name, 'abc');
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

      it('removes requests from the folder', () => {
        const project = new HttpProject();
        const parent = project.addFolder('f1');
        parent.addRequest('r1');
        parent.addRequest('r2');
        parent.remove();

        assert.deepEqual(project.items, []);
        assert.deepEqual(project.definitions, []);
      });

      it('removes folders from the folder', () => {
        const project = new HttpProject();
        const parent = project.addFolder('f1');
        parent.addFolder('f2');
        parent.addFolder('f3');
        parent.remove();

        assert.deepEqual(project.items, []);
        assert.deepEqual(project.definitions, []);
      });

      it('deeply removes folders and request from the folder', () => {
        const project = new HttpProject();
        const parent = project.addFolder('f1');
        parent.addFolder('f2');
        const f3 = parent.addFolder('f3');
        f3.addRequest('r1');
        f3.addRequest('r2');
        parent.remove();
        const otherFolder = project.addFolder('f4');
        const otherRequest = project.addRequest('r3');

        assert.lengthOf(project.items, 2, 'has the remaining items');
        assert.deepEqual(project.definitions, [otherFolder, otherRequest]);
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

      it('adds the request from the schema', () => {
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

    describe('addLegacyRequest()', () => {
      it('adds a legacy history request', async () => {
        const project = new HttpProject();
        const request = generator.http.history();
        const created = await project.addLegacyRequest(request);
        assert.ok(created, 'returns the created request');
        assert.lengthOf(project.definitions, 1, 'has one definition');

        assert.deepEqual(project.definitions[0], created, 'inserts the definition into project\'s definitions');
        assert.equal(project.items[0].key, created.key, 'the project has the item');

        assert.equal(created.getParent().kind, HttpProjectKind, 'the request has the parent as the project');

        assert.equal(created.expects.url, request.url, 'has the URL');
        assert.equal(created.info.name, 'Unnamed request', 'has the default name');
      });

      it('adds a legacy saved request', async () => {
        const project = new HttpProject();
        const request = generator.http.saved();
        const created = await project.addLegacyRequest(request);
        assert.ok(created, 'returns the created request');
        assert.lengthOf(project.definitions, 1, 'has one definition');

        assert.deepEqual(project.definitions[0], created, 'inserts the definition into project\'s definitions');
        assert.equal(project.items[0].key, created.key, 'the project has the item');

        assert.equal(created.getParent().kind, HttpProjectKind, 'the request has the parent as the project');

        assert.equal(created.expects.url, request.url, 'has the URL');
        assert.equal(created.info.name, request.name, 'has the name');
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
        const result = project.listFolders({ folder: f2.key });
        assert.lengthOf(result, 1, 'has a single folder');
        assert.equal(result[0].key, f3.key);
      });

      it('returns empty list when no items', () => {
        const project = new HttpProject();
        const f1 = project.addFolder('f1');
        const result = project.listFolders({ folder:  f1.key });
        assert.deepEqual(result, []);
      });

      it('throws when parent folder not found', () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.listFolders({ folder: 'unknown' });
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

      it('appends a request', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromUrl('api.com', project);
        const record = project.patch('append', 'requests', request.toJSON());

        assert.equal(record.path, 'requests', 'returns the path');
        assert.typeOf(record.time, 'number', 'has the time');
        assert.equal(record.operation, 'append', 'has the operation');
        assert.isUndefined(record.oldValue, 'has no oldValue');
        assert.deepEqual(record.value, request.toJSON());
        assert.equal(record.id, project.key, 'has the id');
        assert.equal(record.kind, project.kind, 'has the kind');
      });

      it('appends a request with auto-generated key', () => {
        const project = new HttpProject();
        const request = ProjectRequest.fromUrl('api.com', project);
        const schema = request.toJSON();
        delete schema.key;
        const record = project.patch('append', 'requests', schema);

        assert.typeOf((record.value as IProjectRequest).key, 'string');
      });

      it('throws when appending a request without a value', () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.patch('append', 'requests');
        });
      });

      it('deletes a request', () => {
        const project = new HttpProject();
        const request = project.addRequest('api.com');
        const record = project.patch('delete', 'requests', request.key);

        assert.equal(record.path, 'requests', 'returns the path');
        assert.typeOf(record.time, 'number', 'has the time');
        assert.equal(record.operation, 'delete', 'has the operation');
        assert.deepEqual(record.oldValue, request.toJSON());
        assert.deepEqual(record.value, request.key);
        assert.equal(record.id, project.key, 'has the id');
        assert.equal(record.kind, project.kind, 'has the kind');
      });

      it('throws when deleting an unknown request', () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.patch('delete', 'requests', 'something');
        });
      });

      it('throws when unknown request operation', () => {
        const project = new HttpProject();
        assert.throws(() => {
          project.patch('move', 'requests');
        });
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

    describe('patchRequest()', () => {
      describe('unknown operation', () => {
        let project: HttpProject;
        beforeEach(() => {
          project = new HttpProject();
        });

        it('throws when unknown operation', () => {
          assert.throws(() => {
            project.patchRequest('set', '');
          }, 'Unsupported operation: set');
        });
      });

      describe('append', () => {
        let project: HttpProject;
        beforeEach(() => {
          project = new HttpProject();
        });

        it('throws when no value', () => {
          assert.throws(() => {
            project.patchRequest('append', undefined);
          }, 'The value for the "append" operation must be set.');
        });

        it('adds the request', () => {
          const request = ProjectRequest.fromUrl('api.com', project);
          const oldValue = project.patchRequest('append', request.toJSON());

          assert.isUndefined(oldValue, 'does not return a value');
          assert.ok(project.findRequest(request.key), 'project has the request');
        });

        it('generates the key when missing', () => {
          const request = ProjectRequest.fromUrl('api.com', project);
          const schema = request.toJSON();
          delete schema.key;
          project.patchRequest('append', schema);
          assert.typeOf(schema.key, 'string');
        });
      });

      describe('delete', () => {
        let project: HttpProject;
        let request: ProjectRequest;
        beforeEach(() => {
          project = new HttpProject();
          request = project.addRequest('https://api.com');
        });

        it('throws when request not found', () => {
          assert.throws(() => {
            project.patchRequest('delete', 'something');
          }, 'Unable to find a request identified by something.');
        });

        it('removes the request', () => {
          const oldValue = project.patchRequest('delete', request.key);

          assert.deepEqual(oldValue, request.toJSON(), 'returns the old value');
          assert.notOk(project.findRequest(request.key), 'the request is removed');
        });
      });
    });

    describe('getParent()', () => {
      it('always returns undefined', () => {
        const project = new HttpProject();
        const result = project.getParent();
        assert.isUndefined(result);
      });
    });

    describe('getProject()', () => {
      it('always returns the project', () => {
        const project = new HttpProject();
        const result = project.getProject();
        assert.isTrue(result === project);
      });
    });

    describe('attachedCallback()', () => {
      // for code coverage
      it('is called', () => {
        const project = new HttpProject();
        project.attachedCallback();
      });
    });

    describe('detachedCallback()', () => {
      // for code coverage
      it('is called', () => {
        const project = new HttpProject();
        project.detachedCallback();
      });
    });

    describe('readEnvironments()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = new HttpProject();
      });

      it('reads environments from the project without subfolders without the name', async () => {
        project.addEnvironment('a');
        project.addEnvironment('b');

        const envs = await project.readEnvironments();
        assert.lengthOf(envs, 1, 'has the project environment');
        assert.equal(envs[0].info.name, 'a', 'has the first environment');
      });

      it('reads environments from the project without subfolders with the name', async () => {
        project.addEnvironment('a');
        project.addEnvironment('b');

        const envs = await project.readEnvironments({ nameOrKey: 'b' });
        assert.lengthOf(envs, 1, 'has the project environment');
        assert.equal(envs[0].info.name, 'b', 'has the first environment');
      });

      it('reads environments to a folder', async () => {
        project.addEnvironment('a');
        const f = project.addFolder('folder');
        f.addEnvironment('b');

        const envs = await project.readEnvironments({ folderKey: f.key });
        assert.lengthOf(envs, 2, 'has all environments');
        assert.equal(envs[0].info.name, 'a', 'has the first environment');
        assert.equal(envs[1].info.name, 'b', 'has the second environment');
      });

      it('skips folders without environments', async () => {
        project.addEnvironment('a');
        const f1 = project.addFolder('folder 1');
        const f2 = f1.addFolder('folder 2');
        f2.addEnvironment('b');

        const envs = await project.readEnvironments({ folderKey: f2.key });
        assert.lengthOf(envs, 2, 'has all environments');
        assert.equal(envs[0].info.name, 'a', 'has the first environment');
        assert.equal(envs[1].info.name, 'b', 'has the second environment');
      });

      it('stops reading when "encapsulated is set"', async () => {
        project.addEnvironment('a');
        const f1 = project.addFolder('folder 1');
        const f2 = f1.addFolder('folder 2');
        f1.addEnvironment('b');
        const env = f2.addEnvironment('c');
        env.encapsulated = true;

        const envs = await project.readEnvironments({ folderKey: f2.key });
        assert.lengthOf(envs, 1, 'has a single environment');
        assert.equal(envs[0].info.name, 'c', 'has the folder environment');
      });

      it('returns empty list when unknown parent', async () => {
        project.addEnvironment('a');
        const f = project.addFolder('folder 1');
        f.addEnvironment('b');
        const envs = await project.readEnvironments({ folderKey: 'some' });
        assert.lengthOf(envs, 0);
      });
    });

    describe('clone()', () => {
      let project: HttpProject;
      beforeEach(() => {
        project = HttpProject.fromName('a project');
      });

      it('clones the project', () => {
        project.addRequest('https://domain.com');
        project.addFolder('test');
        const copy = project.clone();

        assert.equal(copy.kind, 'ARC#HttpProject');
        assert.equal(copy.info.name, 'a project');

        assert.lengthOf(copy.listFolders(), 1, 'has the folder');
        assert.lengthOf(copy.listRequests(), 1, 'has the requests');

        project.info.name = 'updated';
        assert.equal(copy.info.name, 'a project');
      });

      it('recreates the project key', () => {
        const copy = project.clone();

        assert.typeOf(copy.key, 'string');
        assert.notEqual(copy.key, project.key);
      });

      it('recreates folder keys', () => {
        const f = project.addFolder('test');
        const copy = project.clone();

        const [folder] = copy.listFolders();
        assert.typeOf(folder.key, 'string');
        assert.notEqual(folder.key, f.key);
      });

      it('recreates requests keys', () => {
        const r = project.addRequest('https://domain.com');
        const copy = project.clone();

        const [request] = copy.listRequests();
        assert.typeOf(request.key, 'string');
        assert.notEqual(request.key, r.key);
      });

      it('updates the keys in folder items', () => {
        const f = project.addFolder('f1');
        const r = f.addRequest('https://domain.com');
        r.info.name = 'r1';
        const copy = project.clone();

        const request = copy.findRequest('r1');
        const folder = copy.findFolder('f1');
        assert.ok(request, 'has copied request');
        assert.ok(folder, 'has copied folder');

        assert.lengthOf(folder.items, 1, 'folder has the item');
        assert.equal(folder.items[0].key, request.key, 'the item has the reference key');
      });

      it('updates keys for environments', () => {
        const env = project.addEnvironment('test');
        const copy = project.clone();

        assert.typeOf(copy.environments[0].key, 'string');
        assert.notEqual(copy.environments[0].key, env.key);
      });

      it('updates keys for schemas', () => {
        const schema = ProjectSchema.fromName('s1');
        project.schemas.push(schema);
        const copy = project.clone();

        assert.typeOf(copy.schemas[0].key, 'string');
        assert.notEqual(copy.schemas[0].key, schema.key);
      });

      it('does not update keys when configured', () => {
        const f = project.addFolder('test');
        const r = project.addRequest('https://domain.com');
        const env = project.addEnvironment('test');
        const schema = ProjectSchema.fromName('s1');
        project.schemas.push(schema);
        const copy = project.clone({ withoutRevalidate: true });

        assert.equal(copy.key, project.key);
        assert.equal(copy.schemas[0].key, schema.key);
        const [folder] = copy.listFolders();
        assert.equal(folder.key, f.key);
        const [request] = copy.listRequests();
        assert.equal(request.key, r.key);
        assert.equal(copy.environments[0].key, env.key);
      });
    });

    describe('HttpProject.clone()', () => {
      it('clones a project', () => {
        const project = HttpProject.fromName('a project');
        const copy = HttpProject.clone(project.toJSON());
        assert.equal(copy.info.name, 'a project');
      });
    });

    describe('toString()', () => {
      it('serializes the project', () => {
        const project = HttpProject.fromName('a project');
        const str = project.toString();
        assert.typeOf(str, 'string', 'produces a string');
        const obj = JSON.parse(str);
        assert.equal(obj.info.name, 'a project');
      });
    });

    describe('addSchema()', () => {
      it('adds an instance of the schema', () => {
        const project = new HttpProject();
        const schema = ProjectSchema.fromName('test');
        const created = project.addSchema(schema);
        assert.deepEqual(created, schema);

        assert.lengthOf(project.schemas, 1, 'has one schema');
        assert.equal(project.schemas[0].key, created.key, 'the project has the schema');
      });

      it('adds by a schema', () => {
        const project = new HttpProject();
        const schema = ProjectSchema.fromName('test');
        const created = project.addSchema(schema.toJSON());
        assert.deepEqual(created, schema);

        assert.lengthOf(project.schemas, 1, 'has one schema');
        assert.equal(project.schemas[0].key, created.key, 'the project has the schema');
      });

      it('adds by name', () => {
        const project = new HttpProject();
        const created = project.addSchema('test schema');
        assert.equal(created.name, 'test schema');

        assert.lengthOf(project.schemas, 1, 'has one schema');
        assert.equal(project.schemas[0].key, created.key, 'the project has the schema');
      });

      it('inserts schema at position', () => {
        const project = new HttpProject();
        project.addSchema('schema 1');
        project.addSchema('schema 2');
        const key = project.addSchema('schema 3', { index: 1 }).key;
        assert.equal(project.schemas[1].key, key);
      });
    });

    describe('listSchemas()', () => {
      it('returns empty array when no schemas', () => {
        const project = new HttpProject();
        delete project.schemas;
        const result = project.listSchemas();
        assert.deepEqual(result, []);
      });

      it('returns created schemas', () => {
        const project = new HttpProject();
        project.addSchema('s1');
        project.addSchema('s2');
        const result = project.listSchemas();
        assert.lengthOf(result, 2);
      });
    });

    describe('requestIterator()', () => {
      it('iterates over requests in the project', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        const r2 = project.addRequest('r2');
        const r3 = project.addRequest('r3');

        const result: ProjectRequest[] = [];

        for (const request of project.requestIterator()) {
          result.push(request);
        }

        assert.deepEqual(result, [r1, r2, r3]);
      });

      it('iterates over requests in a folder (parent option)', () => {
        const project = new HttpProject();
        const f1 = project.addFolder('f1');
        const r1 = f1.addRequest('r1');
        const r2 = f1.addRequest('r2');
        const r3 = f1.addRequest('r3');

        const result: ProjectRequest[] = [];

        for (const request of project.requestIterator({ parent: f1.key })) {
          result.push(request);
        }

        assert.deepEqual(result, [r1, r2, r3]);
      });

      it('iterates over requests in the project and a folder (recursive)', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        const f1 = project.addFolder('f1');
        const r2 = f1.addRequest('r2');
        const r3 = f1.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project.requestIterator({ recursive: true })) {
          result.push(request);
        }
        assert.deepEqual(result, [r1, r2, r3]);
      });

      it('respects the recursive order', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        const f1 = project.addFolder('f1');
        const r2 = f1.addRequest('r2');
        const r3 = project.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project.requestIterator({ recursive: true })) {
          result.push(request);
        }
        assert.deepEqual(result, [r1, r2, r3]);
      });

      it('iterates over a deep structure', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        const f1 = project.addFolder('f1');
        const f2 = f1.addFolder('f2');
        const r2 = f1.addRequest('r2');
        const r3 = f2.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project.requestIterator({ recursive: true })) {
          result.push(request);
        }
        assert.deepEqual(result, [r1, r3, r2]);
      });

      it('respects the ignore option with a request name', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        r1.info.name = 'r1name'
        const r2 = project.addRequest('r2');
        const r3 = project.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project.requestIterator({ ignore: ['r1name'] })) {
          result.push(request);
        }
        assert.deepEqual(result, [r2, r3]);
      });

      it('respects the ignore option with a request key', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        const r2 = project.addRequest('r2');
        const r3 = project.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project.requestIterator({ ignore: [r1.key] })) {
          result.push(request);
        }
        assert.deepEqual(result, [r2, r3]);
      });

      it('ignores entire folders with the key', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        const f1 = project.addFolder('f1');
        f1.addRequest('r2');
        f1.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project.requestIterator({ ignore: [f1.key], recursive: true })) {
          result.push(request);
        }
        assert.deepEqual(result, [r1]);
      });

      it('ignores entire folders with the name', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        const f1 = project.addFolder('f1');
        f1.addRequest('r2');
        f1.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project.requestIterator({ ignore: ['f1'], recursive: true })) {
          result.push(request);
        }
        assert.deepEqual(result, [r1]);
      });

      it('includes only requested items from the project root by name', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        r1.info.name = 'r1name';
        project.addRequest('r2');
        project.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project.requestIterator({ requests: ['r1name'] })) {
          result.push(request);
        }
        assert.deepEqual(result, [r1]);
      });

      it('includes only requested items from the project root by key', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        project.addRequest('r2');
        project.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project.requestIterator({ requests: [r1.key] })) {
          result.push(request);
        }
        assert.deepEqual(result, [r1]);
      });

      it('includes only requested items recursive', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        const f1 = project.addFolder('f1');
        const r2 = f1.addRequest('r2');
        project.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project.requestIterator({ requests: [r1.key, r2.key], recursive: true })) {
          result.push(request);
        }
        assert.deepEqual(result, [r1, r2]);
      });

      it('recursively iterates the project object', () => {
        const project = new HttpProject();
        const r1 = project.addRequest('r1');
        const f1 = project.addFolder('f1');
        const r2 = f1.addRequest('r2');
        const r3 = project.addRequest('r3');
        const result: ProjectRequest[] = [];
        for (const request of project) {
          result.push(request);
        }
        assert.deepEqual(result, [r1, r2, r3]);
      });
    });
  });
});
