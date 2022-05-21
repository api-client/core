/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Kind as ThingKind } from '../../../src/models/Thing.js';
import { Kind as HttpRequestKind, IHttpRequest } from '../../../src/models/HttpRequest.js';
import { Kind as RequestLogKind, RequestLog } from '../../../src/models/RequestLog.js';
import { SentRequest } from '../../../src/models/SentRequest.js';
import { RequestConfig } from '../../../src/models/RequestConfig.js';
import { RequestAuthorization } from '../../../src/models/RequestAuthorization.js';
import { Kind as RequestKind, Request, IRequest } from '../../../src/models/Request.js';
import { LegacyMock } from '../../../src/mocking/LegacyMock.js';
import { 
  ArcProjectKind, ArcProject, IArcProject, ArcProjectFolderKind, ArcProjectFolder, ArcProjectRequest, 
  IArcProjectRequest, IProjectParent, ArcProjectItem, ArcProjectRequestKind,
} from '../../../src/models/arc/ArcProject.js';
import { ArcLegacyProject } from '../../../src/models/legacy/models/ArcLegacyProject.js';
import { ARCSavedRequest } from '../../../src/models/legacy/request/ArcRequest.js';

describe('Models', () => {
  describe('arc', () => {
    const generator = new LegacyMock();

    describe('ArcProject', () => {
      describe('initialization', () => {
        describe('Default project initialization', () => {
          it('initializes a default project', () => {
            const result = new ArcProject();
            assert.equal(result.kind, ArcProjectKind, 'sets the kind property');
            assert.typeOf(result.definitions, 'object', 'sets the definitions property');
            assert.deepEqual(result.definitions.folders, [], 'sets the definitions.folders property');
            assert.deepEqual(result.definitions.requests, [], 'sets the definitions.requests property');
            assert.deepEqual(result.items, [], 'sets the items property');
            const { info } = result;
            assert.typeOf(info, 'object', 'sets the default info property');
            assert.equal(info.kind, ThingKind, 'sets the info.kind property');
            assert.equal(info.name, '', 'sets the info.name property');
          });
        });
  
        describe('From schema initialization', () => {
          let base: IArcProject;
          beforeEach(() => {
            base = {
              kind: ArcProjectKind,
              key: 'abc',
              definitions: {
                folders: [],
                requests: [],
              },
              items: [],
              info: {
                kind: ThingKind,
                name: '',
              },
            }
          });
  
          it('sets the info', () => {
            const init: IArcProject = { ...base, ...{ info: {
              kind: ThingKind,
              name: 'Test project',
              description: 'Project description',
              version: '1.2.3',
            }}};
            const project = new ArcProject(init);
            const { info } = project;
            assert.equal(info.kind, ThingKind, 'sets the info.kind property');
            assert.equal(info.name, 'Test project', 'sets the info.name property');
            assert.equal(info.description, 'Project description', 'sets the info.description property');
            assert.equal(info.version, '1.2.3', 'sets the info.version property');
          });
  
          it('sets the items', () => {
            const init: IArcProject = { 
              ...base, 
              ...{ 
                items: [{
                  kind: ArcProjectFolderKind,
                  key: '123456',
                }]
              },
            };
            const project = new ArcProject(init);
            const { items } = project;
            assert.typeOf(items, 'array', 'has the items')
            assert.lengthOf(items, 1, 'has a single item')
            const [item] = items;
            assert.equal(item.kind, ArcProjectFolderKind, 'sets the item.kind property');
            assert.equal(item.key, '123456', 'sets the item.key property');
          });
  
          it('sets the definitions.folders', () => {
            const init: IArcProject = { ...base, ...{ definitions: {
              folders: [{
                key: '123456',
                kind: ArcProjectFolderKind,
                created: 1234567,
                updated: 98765,
                info: {
                  kind: ThingKind,
                  name: 'test'
                },
                items: [],
              }]
            }}};
            const project = new ArcProject(init);
            const { definitions } = project;
            assert.typeOf(definitions.folders, 'array', 'has the items')
            assert.lengthOf(definitions.folders, 1, 'has a single item')
            const [item] = definitions.folders;
            assert.equal(item.kind, ArcProjectFolderKind, 'sets the item.kind property');
            assert.equal(item.key, '123456', 'sets the item.key property');
          });
  
          it('sets the definitions.requests', () => {
            const request = ArcProjectRequest.fromUrl('https://api.com', new ArcProject());
            const init: IArcProject = { ...base, ...{ definitions: {
              requests: [request.toJSON()]
            }}};
            const project = new ArcProject(init);
            const { definitions } = project;
            assert.typeOf(definitions.requests, 'array', 'has the items')
            assert.lengthOf(definitions.requests, 1, 'has a single item')
            const [item] = definitions.requests;
            assert.equal(item.key, request.key, 'sets the request instance');
          });
        });
  
        describe('From JSON string initialization', () => {
          it('restores project data from JSON string', () => {
            const orig = new ArcProject();
            orig.info.name = 'a project';
            orig.addFolder('folder');
            orig.addRequest('https://api.com');
            const str = JSON.stringify(orig);
            const result = new ArcProject(str);
  
            assert.equal(result.key, orig.key, 'restores the key');
            assert.equal(result.info.name, orig.info.name, 'restores the info object');
            assert.ok(result.findFolder('folder'), 'restores a folder');
            assert.ok(result.findRequest('https://api.com'), 'restores a request');
          });
        });
      });
      
      describe('ArcProject.fromName()', () => {
        it('creates an empty project with a name', () => {
          const project = ArcProject.fromName('Test project');
          assert.equal(project.kind, ArcProjectKind, 'sets the kind property');
          assert.deepEqual(project.definitions.folders, [], 'sets the definitions.folders property');
          assert.deepEqual(project.definitions.requests, [], 'sets the definitions.requests property');
          assert.deepEqual(project.items, [], 'sets the items property');
          const { info } = project;
          assert.typeOf(info, 'object', 'sets the default info property');
          assert.equal(info.kind, ThingKind, 'sets the info.kind property');
          assert.equal(info.name, 'Test project', 'sets the info.name property');
        });
      });

      describe('HttpProject.fromLegacy()', () => {
        it('sets the name', async () => {
          const init: ArcLegacyProject = {
            name: 'abc',
          };
          const result = await ArcProject.fromLegacyProject(init, []);
          assert.equal(result.info.name, 'abc');
        });

        it('sets the description', async () => {
          const init: ArcLegacyProject = {
            name: 'abc',
            description: 'test'
          };
          const result = await ArcProject.fromLegacyProject(init, []);
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
          const result = await ArcProject.fromLegacyProject(init, requests);
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
          const result = await ArcProject.fromLegacyProject(init, requests);
          const projectRequests = result.listRequests();
          assert.lengthOf(projectRequests, 1, 'has a single request');
          assert.equal(projectRequests[0].info.name, 'r1');
        });
      });

      describe('addFolder()', () => {
        it('returns a key of the inserted folder', () => {
          const project = new ArcProject();
          const created = project.addFolder('A folder');
          assert.typeOf(created, 'object', 'returns an object');
        });
  
        it('adds the folder to the items array', () => {
          const project = new ArcProject();
          const created = project.addFolder('A folder');
          const { items } = project;
          assert.lengthOf(items, 1, 'items has a single object');
          const [item] = items;
  
          assert.equal(item.key, created.key, 'has the key');
          assert.equal(item.kind, ArcProjectFolderKind, 'has the kind');
        });
  
        it('adds the definition', () => {
          const project = new ArcProject();
          const created = project.addFolder('A folder');
          const { definitions } = project;
          assert.lengthOf(definitions.folders, 1, 'has the definition');
          const folder = definitions.folders[0];
          
          assert.equal(folder.kind, ArcProjectFolderKind, 'has the kind');
          assert.equal(folder.key, created.key, 'has the key');
          
          const { info } = folder;
          assert.typeOf(info, 'object', 'has the info object');
          assert.equal(info.kind, ThingKind, 'has the info.kind property');
          assert.equal(info.name, 'A folder', 'has the info.name property');
  
          assert.typeOf(folder.created, 'number', 'has the created property');
          assert.typeOf(folder.updated, 'number', 'has the updated property');
          assert.equal(folder.created, folder.updated, 'the updated and created properties equal');
          
          assert.deepEqual(folder.items, [], 'has empty items');
        });
  
        it('adds multiple folders', () => {
          const project = new ArcProject();
          const created1 = project.addFolder('f1');
          const created2 = project.addFolder('f2');
          const created3 = project.addFolder('f3');
          assert.lengthOf(project.items, 3, 'has all items');
          assert.equal(project.items[0].key, created1.key, 'has item #1');
          assert.equal(project.items[1].key, created2.key, 'has item #2');
          assert.equal(project.items[2].key, created3.key, 'has item #3');
        });
  
        it('adds a folder of a folder', () => {
          const project = new ArcProject();
          const created1 = project.addFolder('f1');
          const folder = project.findFolder(created1.key);
          const created2 = folder.addFolder('inception');
          assert.lengthOf(project.items, 1, 'project has a single item');
          assert.lengthOf(project.definitions.folders, 2, 'project has a two definitions');
          
          const theFolder = project.definitions.folders[1];
          assert.equal(theFolder.key, created2.key, 'adds the sub folder definition to the project');
          assert.equal(theFolder.info.name, 'inception', 'sub-folder has the name');
        });
  
        it('ignores adding when the folder already exists', () => {
          const project = new ArcProject();
          const created1 = project.addFolder('f1');
          const created2 = project.addFolder('f1', { skipExisting: true });
          assert.deepEqual(created1, created2);
        });
  
        it('adds a folder on a specific position', () => {
          const project = new ArcProject();
          project.addFolder('f1');
          project.addFolder('f2');
          project.addFolder('f3');
          const inserted = project.addFolder('f4', { index: 1 });
          assert.equal(project.items[1].key, inserted.key);
        });
      });
  
      describe('findFolder()', () => {
        it('returns undefine when no definitions', () => {
          const project = new ArcProject();
          const result = project.findFolder('abc');
          assert.isUndefined(result);
        });
  
        it('finds the folder by the name', () => {
          const project = new ArcProject();
          const created = project.addFolder('abc');
          const result = project.findFolder('abc');
          assert.deepEqual(result, created);
        });
  
        it('finds the folder by the key', () => {
          const project = new ArcProject();
          const created = project.addFolder('abc');
          const result = project.findFolder(created.key);
          assert.deepEqual(result, created);
        });
  
        it('returns undefined for the keyOnly option', () => {
          const project = new ArcProject();
          project.addFolder('abc');
          const result = project.findFolder('abc', { keyOnly: true });
          assert.isUndefined(result);
        });
  
        it('returns a folder only', () => {
          const project = new ArcProject();
          const request = ArcProjectRequest.fromName('abc', project);
          project.addRequest(request);
          const created = project.addFolder('abc');
          const result = project.findFolder('abc');
          assert.deepEqual(result, created);
        });
      });
  
      describe('removeFolder()', () => {
        it('removes the folder from the project', () => {
          const name = 'abc';
          const project = new ArcProject();
          const created = project.addFolder(name);
          project.removeFolder(created.key);
          const result = project.findFolder(name);
          assert.isUndefined(result);
        });
  
        it('removes the folder from the project items', () => {
          const name = 'abc';
          const project = new ArcProject();
          const created = project.addFolder(name);
          assert.lengthOf(project.items, 1, 'has an item');
          project.removeFolder(created.key);
          project.findFolder(name);
          assert.deepEqual(project.items, [], 'the items is empty');
        });
  
        it('removes the folder from the definitions', () => {
          const name = 'abc';
          const project = new ArcProject();
          const created = project.addFolder(name);
          assert.lengthOf(project.definitions.folders, 1, 'has a definition');
          project.removeFolder(created.key);
          project.findFolder(name);
          assert.deepEqual(project.definitions.folders, [], 'the definitions is empty');
        });
  
        it('removes the folder from a parent folder', () => {
          const name = 'abc';
          const project = new ArcProject();
          const parent = project.addFolder('parent');
          const created = project.addFolder(name, { parent: parent.key });
          project.removeFolder(created.key);
          const result = project.findFolder(name);
          assert.isUndefined(result);
        });
  
        it('removes the folder from the parent folder items', () => {
          const name = 'abc';
          const project = new ArcProject();
          const parent = project.addFolder('parent');
          const created = project.addFolder(name, { parent: parent.key });
          assert.lengthOf(parent.items, 1, 'has an item');
          project.removeFolder(created.key);
          project.findFolder(name);
          assert.deepEqual(parent.items, [], 'the items is empty');
        });
  
        it('removes the folder from the definitions', () => {
          const name = 'abc';
          const project = new ArcProject();
          const parent = project.addFolder('parent');
          const created = project.addFolder(name, { parent: parent.key });
          assert.lengthOf(project.definitions.folders, 2, 'has 2 definitions');
          project.removeFolder(created.key);
          project.findFolder(name);
          assert.lengthOf(project.definitions.folders, 1, 'has 1 definition');
        });
  
        it('throws an error when folder is not found', () => {
          const project = new ArcProject();
          assert.throws(() => {
            project.removeFolder('hello');
          });
        });
  
        it('does not throw with the safe option', () => {
          const project = new ArcProject();
          assert.doesNotThrow(() => {
            project.removeFolder('hello', { safe: true });
          });
        });
  
        it('removes requests from the folder', () => {
          const project = new ArcProject();
          const parent = project.addFolder('f1');
          parent.addRequest('r1');
          parent.addRequest('r2');
          parent.remove();
  
          assert.deepEqual(project.items, []);
          assert.deepEqual(project.definitions.folders, []);
        });
  
        it('removes folders from the folder', () => {
          const project = new ArcProject();
          const parent = project.addFolder('f1');
          parent.addFolder('f2');
          parent.addFolder('f3');
          parent.remove();
  
          assert.deepEqual(project.items, []);
          assert.deepEqual(project.definitions.folders, []);
        });
  
        it('deeply removes folders and request from the folder', () => {
          const project = new ArcProject();
          const parent = project.addFolder('f1');
          parent.addFolder('f2');
          const f3 = parent.addFolder('f3');
          f3.addRequest('r1');
          f3.addRequest('r2');
          parent.remove();
          const otherFolder = project.addFolder('f4');
          const otherRequest = project.addRequest('r3');
  
          assert.lengthOf(project.items, 2, 'has the remaining items');
          assert.deepEqual(project.definitions.folders, [otherFolder]);
          assert.deepEqual(project.definitions.requests, [otherRequest]);
        });
      });
  
      describe('findParent()', () => {
        it('finds a parent for a root level folder', () => {
          const project = new ArcProject();
          const created = project.addFolder('test');
          const parent = project.findParent(created.key);
          assert.deepEqual(parent, project);
        });
  
        it('finds a parent for a root level request', () => {
          const project = new ArcProject();
          const request = ArcProjectRequest.fromName('request', project);
          const created = project.addRequest(request);
          const parent = project.findParent(created.key);
          assert.deepEqual(parent, project);
        });
  
        it('finds a parent for a sub-folder', () => {
          const project = new ArcProject();
          const folder = project.addFolder('parent');
          const created = project.addFolder('test', { parent: folder.key });
          const parent = project.findParent(created.key);
          assert.deepEqual(parent, folder);
        });
  
        it('finds a parent for a root level request', () => {
          const project = new ArcProject();
          const folder = project.addFolder('parent');
          const request = ArcProjectRequest.fromName('request', project);
          const created = project.addRequest(request, { parent: folder.key });
          const parent = project.findParent(created.key);
          assert.deepEqual(parent, folder);
        });
  
        it('returns undefined when not found', () => {
          const project = new ArcProject();
          const folder = project.addFolder('parent');
          project.addFolder('test', { parent: folder.key });
          const parent = project.findParent('other');
          assert.isUndefined(parent);
        });
      });
  
      describe('moveFolder()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
          const folder1 = project.addFolder('folder1');
          const folder2 = project.addFolder('folder2');
          project.addFolder('folder3', { parent: folder2.key });
          const request1 = ArcProjectRequest.fromName('request1', project);
          const request2 = ArcProjectRequest.fromName('request2', project);
          const request3 = ArcProjectRequest.fromName('request3', project);
          const request4 = ArcProjectRequest.fromName('request4', project);
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
            project.moveFolder(moved.key, { index: 5 });
          }, RangeError, 'Index out of bounds. Maximum index is 3.');
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
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
          const folder1 = project.addFolder('folder1');
          const folder2 = project.addFolder('folder2', { parent: folder1.key });
          const folder3 = project.addFolder('folder3', { parent: folder2.key });
          project.addFolder('folder4');
          const request1 = ArcProjectRequest.fromName('request1', project);
          const request2 = ArcProjectRequest.fromName('request2', project);
          const request3 = ArcProjectRequest.fromName('request3', project);
          const request4 = ArcProjectRequest.fromName('request4', project);
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
          const project = new ArcProject();
          const request = ArcProjectRequest.fromName('test', project);
          const created = project.addRequest(request);
          assert.deepEqual(created, request);
  
          assert.lengthOf(project.definitions.requests, 1, 'has one definition');
          assert.deepEqual(project.definitions.requests[0], created, 'inserts the definition into project\'s definitions');
          assert.equal(project.items[0].key, created.key, 'the project has the item');
  
          assert.equal(created.getParent().kind, ArcProjectKind, 'the request has the parent as the project');
        });
  
        it('adds the request from the schema', () => {
          const project = new ArcProject();
          const request = ArcProjectRequest.fromName('test', project);
          const schema = request.toJSON();
          const created = project.addRequest(schema);
          
          assert.deepEqual(created, request);
  
          assert.lengthOf(project.definitions.requests, 1, 'has one definition');
          assert.deepEqual(project.definitions.requests[0], created, 'inserts the definition into project\'s definitions');
          assert.equal(project.items[0].key, created.key, 'the project has the item');
          
          assert.equal(created.getParent().kind, ArcProjectKind, 'the request has the parent as the project');
        });
  
        it('adds the request to a folder', () => {
          const project = new ArcProject();
          const folder = project.addFolder('a folder');
          
          const request = ArcProjectRequest.fromName('test', project);
          const created = project.addRequest(request, { parent: folder.key });
          
          assert.lengthOf(project.definitions.requests, 1, 'has the request definition');
          assert.deepEqual(project.definitions.requests[0], created, 'inserts the definition into project\'s definitions');
          assert.lengthOf(folder.items, 1, 'the folder has a single item');
          assert.equal(folder.items[0].key, created.key, 'the folder has the item');
  
          assert.deepEqual(created.getParent(), folder, 'the request has the parent as the folder');
        });
  
        it('adds the key if missing', () => {
          const project = new ArcProject();
          const request = ArcProjectRequest.fromName('test', project);
          const schema = request.toJSON();
          delete schema.key;
          const created = project.addRequest(schema);
          
          assert.typeOf(created.key, 'string', 'has a new key');
        });
  
        it('throws when parent folder not found', () => {
          const project = new ArcProject();
          const request = ArcProjectRequest.fromName('test', project);
          
          assert.throws(() => {
            project.addRequest(request, { parent: 'unknown' });
          }, Error, 'Unable to find the parent folder unknown.');
        });
  
        it('throws when index out of bounds', () => {
          const project = new ArcProject();
          const request = ArcProjectRequest.fromName('test', project);
          
          assert.throws(() => {
            project.addRequest(request, { index: 1 });
          }, RangeError, 'Index out of bounds. Maximum index is 0.');
        });
      });
  
      describe('findRequest()', () => {
        it('returns undefined when no definitions', () => {
          const project = new ArcProject();
          const result = project.findRequest('abc');
          assert.isUndefined(result);
        });
  
        it('finds the request by the name', () => {
          const project = new ArcProject();
          const created = ArcProjectRequest.fromName('abc', project);
          project.addRequest(created);
          const result = project.findRequest('abc');
          assert.deepEqual(result, created);
        });
  
        it('finds the request by the key', () => {
          const project = new ArcProject();
          const created = ArcProjectRequest.fromName('abc', project);
          project.addRequest(created);
          const result = project.findRequest(created.key);
          assert.deepEqual(result, created);
        });
  
        it('returns undefined for the keyOnly option', () => {
          const project = new ArcProject();
          project.addRequest(ArcProjectRequest.fromName('abc', project));
          const result = project.findRequest('abc', { keyOnly: true });
          assert.isUndefined(result);
        });
  
        it('returns a request only', () => {
          const project = new ArcProject();
          project.addFolder('abc');
          const request = ArcProjectRequest.fromName('abc', project);
          project.addRequest(request);
          const result = project.findRequest('abc');
          assert.deepEqual(result, request);
        });
      });
  
      describe('removeRequest()', () => {
        it('removes the request from the project', () => {
          const name = 'abc';
          const project = new ArcProject();
          const created = ArcProjectRequest.fromName(name, project);
          project.addRequest(created);
          project.removeRequest(created.key);
          const result = project.findRequest(name);
          assert.isUndefined(result);
        });
  
        it('removes the request from the project items', () => {
          const project = new ArcProject();
          const created = ArcProjectRequest.fromName('test', project);
          project.addRequest(created);
          assert.lengthOf(project.items, 1, 'has an item');
          project.removeRequest(created.key);
          assert.deepEqual(project.items, [], 'the items is empty');
        });
  
        it('removes the request from the definitions', () => {
          const project = new ArcProject();
          const created = ArcProjectRequest.fromName('test', project);
          project.addRequest(created);
          assert.lengthOf(project.definitions.requests, 1, 'has a definition');
          project.removeRequest(created.key);
          assert.deepEqual(project.definitions.requests, [], 'the definitions is empty');
        });
  
        it('removes the request from a parent folder', () => {
          const name = 'abc';
          const project = new ArcProject();
          const parent = project.addFolder('parent');
          const created = ArcProjectRequest.fromName(name, project);
          project.addRequest(created, { parent: parent.key });
          project.removeRequest(created.key);
          const result = project.findRequest(name);
          assert.isUndefined(result);
        });
  
        it('removes the request from the parent folder items', () => {
          const name = 'abc';
          const project = new ArcProject();
          const parent = project.addFolder('parent');
          const created = ArcProjectRequest.fromName(name, project);
          project.addRequest(created, { parent: parent.key });
          assert.lengthOf(parent.items, 1, 'has an item');
          project.removeRequest(created.key);
          assert.deepEqual(parent.items, [], 'the items is empty');
        });
  
        it('removes the request from the definitions', () => {
          const name = 'abc';
          const project = new ArcProject();
          const parent = project.addFolder('parent');
          const created = ArcProjectRequest.fromName(name, project);
          project.addRequest(created, { parent: parent.key });
          assert.lengthOf(project.definitions.requests, 1, 'has 1 definition');
          project.removeRequest(created.key);
          assert.lengthOf(project.definitions.requests, 0, 'has 0 definitions');
        });
  
        it('throws an error when the request is not found', () => {
          const project = new ArcProject();
          assert.throws(() => {
            project.removeRequest('hello');
          });
        });
  
        it('does not throw with the safe option', () => {
          const project = new ArcProject();
          assert.doesNotThrow(() => {
            project.removeRequest('hello', { safe: true });
          });
        });
      });
  
      describe('moveRequest()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
          const folder1 = project.addFolder('folder1');
          const folder2 = project.addFolder('folder2');
          project.addFolder('folder3', { parent: folder2.key });
          const request1 = ArcProjectRequest.fromName('request1', project);
          const request2 = ArcProjectRequest.fromName('request2', project);
          const request3 = ArcProjectRequest.fromName('request3', project);
          const request4 = ArcProjectRequest.fromName('request4', project);
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
  
        it('throws when moving into a position that is out of bounds', () => {
          const moved = project.findRequest('request2');
          const parent = project.findFolder('folder3');
          assert.throws(() => {
            project.moveRequest(moved.key, { parent: parent.key, index: 5 });
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
          const project = new ArcProject();
          const request = generator.http.history();
          const created = await project.addLegacyRequest(request);
          assert.ok(created, 'returns the created request');
          assert.lengthOf(project.definitions.requests, 1, 'has one definition');
  
          assert.deepEqual(project.definitions.requests[0], created, 'inserts the definition into project\'s definitions');
          assert.equal(project.items[0].key, created.key, 'the project has the item');
  
          assert.equal(created.getParent().kind, ArcProjectKind, 'the request has the parent as the project');
  
          assert.equal(created.expects.url, request.url, 'has the URL');
          assert.equal(created.info.name, 'Unnamed request', 'has the default name');
        });
  
        it('adds a legacy saved request', async () => {
          const project = new ArcProject();
          const request = generator.http.saved();
          const created = await project.addLegacyRequest(request);
          assert.ok(created, 'returns the created request');
          assert.lengthOf(project.definitions.requests, 1, 'has one definition');
  
          assert.deepEqual(project.definitions.requests[0], created, 'inserts the definition into project\'s definitions');
          assert.equal(project.items[0].key, created.key, 'the project has the item');
  
          assert.equal(created.getParent().kind, ArcProjectKind, 'the request has the parent as the project');
  
          assert.equal(created.expects.url, request.url, 'has the URL');
          assert.equal(created.info.name, request.name, 'has the name');
        });
      });
  
      describe('listFolderItems()', () => {
        it('returns empty array when no items', () => {
          const project = new ArcProject();
          const result = project.listFolderItems();
          assert.deepEqual(result, []);
        });
  
        it('ignores request items', () => {
          const project = new ArcProject();
          const request = ArcProjectRequest.fromName('name', project);
          project.addRequest(request);
          const result = project.listFolderItems();
          assert.deepEqual(result, []);
        });
  
        it('returns folders', () => {
          const project = new ArcProject();
          const request = ArcProjectRequest.fromName('name', project);
          project.addRequest(request);
          const folder = project.addFolder('a folder');
          const result = project.listFolderItems();
          assert.lengthOf(result, 1, 'has a single result');
          assert.equal(result[0].key, folder.key);
        });
      });
  
      describe('listRequestItems()', () => {
        it('returns empty array when no items', () => {
          const project = new ArcProject();
          const result = project.listRequestItems();
          assert.deepEqual(result, []);
        });
  
        it('ignores folder items', () => {
          const project = new ArcProject();
          project.addFolder('a folder');
          const result = project.listRequestItems();
          assert.deepEqual(result, []);
        });
  
        it('returns requests', () => {
          const project = new ArcProject();
          const request = ArcProjectRequest.fromName('name', project);
          project.addRequest(request);
          project.addFolder('a folder');
          const result = project.listRequestItems();
          assert.lengthOf(result, 1, 'has a single result');
          assert.equal(result[0].key, request.key);
        });
      });
  
      describe('listFolders()', () => {
        it('lists folders from the project', () => {
          const project = new ArcProject();
          const f1 = project.addFolder('f1');
          const f2 = project.addFolder('f2');
          f2.addFolder('f3');
          project.addRequest(ArcProjectRequest.fromName('r1', project));
          const result = project.listFolders();
          assert.lengthOf(result, 2, 'has both folders');
          assert.equal(result[0].key, f1.key);
          assert.equal(result[1].key, f2.key);
        });
  
        it('lists folders from a folder', () => {
          const project = new ArcProject();
          project.addFolder('f1');
          const f2 = project.addFolder('f2');
          const f3 = f2.addFolder('f3');
          f2.addRequest(ArcProjectRequest.fromName('r1', project));
          const result = project.listFolders({ folder: f2.key });
          assert.lengthOf(result, 1, 'has a single folder');
          assert.equal(result[0].key, f3.key);
        });
  
        it('returns empty list when no items', () => {
          const project = new ArcProject();
          const f1 = project.addFolder('f1');
          const result = project.listFolders({ folder:  f1.key });
          assert.deepEqual(result, []);
        });
  
        it('throws when parent folder not found', () => {
          const project = new ArcProject();
          assert.throws(() => {
            project.listFolders({ folder: 'unknown' });
          }, Error, 'Unable to find the folder unknown.');
        });
      });
  
      describe('listRequests()', () => {
        it('lists requests from the project', () => {
          const project = new ArcProject();
          const folder = project.addFolder('f1');
          const request = ArcProjectRequest.fromName('r1', project);
          project.addRequest(request);
          project.addRequest(ArcProjectRequest.fromName('r2', project), { parent: folder.key });
          const result = project.listRequests();
          assert.lengthOf(result, 1, 'has a single request');
          assert.equal(result[0].key, request.key);
        });
  
        it('lists requests from a folder', () => {
          const project = new ArcProject();
          const folder = project.addFolder('f1');
          const request = ArcProjectRequest.fromName('r1', project);
          project.addRequest(ArcProjectRequest.fromName('r2', project));
          project.addRequest(request, { parent: folder.key });
          const result = project.listRequests(folder.key);
          assert.lengthOf(result, 1, 'has a single folder');
          assert.equal(result[0].key, request.key);
        });
  
        it('returns empty list when no items', () => {
          const project = new ArcProject();
          const f1 = project.addFolder('f1');
          const result = project.listRequests(f1.key);
          assert.deepEqual(result, []);
        });
  
        it('throws when parent folder not found', () => {
          const project = new ArcProject();
          assert.throws(() => {
            project.listRequests('unknown');
          }, Error, 'Unable to find the folder unknown.');
        });
      });
  
      describe('listDefinitions()', () => {
        it('returns all definitions for a project root', () => {
          const project = new ArcProject();
          const folder = project.addFolder('f1');
          const request = ArcProjectRequest.fromName('name', project);
          project.addRequest(request);
          const result = project.listDefinitions();
          assert.lengthOf(result, 2, 'has both definitions');
          assert.equal(result[0].key, folder.key, 'has the folder')
          assert.equal(result[1].key, request.key, 'has the request')
        });
  
        it('returns only the project definitions', () => {
          const project = new ArcProject();
          const folder = project.addFolder('f1');
          const request = ArcProjectRequest.fromName('name', project);
          project.addRequest(request);
  
          project.addFolder('other', { parent: folder.key });
          project.addRequest(ArcProjectRequest.fromName('other', project), { parent: folder.key });
          
          const result = project.listDefinitions();
          assert.lengthOf(result, 2, 'has both definitions');
          assert.equal(result[0].key, folder.key, 'has the folder')
          assert.equal(result[1].key, request.key, 'has the request')
        });
  
        it('returns all definitions for a folder', () => {
          const project = new ArcProject();
          const folder = project.addFolder('f1');
          const request = ArcProjectRequest.fromName('name', project);
          project.addRequest(request, { parent: folder.key });
          const sub = folder.addFolder('sub');
          sub.addFolder('sub-sub');
  
          const result = project.listDefinitions(folder.key);
          assert.lengthOf(result, 2, 'has both definitions');
          assert.equal(result[0].key, request.key, 'has the request');
          assert.equal(result[1].key, sub.key, 'has the folder');
        });
      });
  
      describe('getParent()', () => {
        it('always returns undefined', () => {
          const project = new ArcProject();
          const result = project.getParent();
          assert.isUndefined(result);
        });
      });
  
      describe('getProject()', () => {
        it('always returns the project', () => {
          const project = new ArcProject();
          const result = project.getProject();
          assert.isTrue(result === project);
        });
      });
  
      describe('clone()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = ArcProject.fromName('a project');
        });
  
        it('clones the project', () => {
          project.addRequest('https://domain.com');
          project.addFolder('test');
          const copy = project.clone();
  
          assert.equal(copy.kind, ArcProjectKind);
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
  
        it('does not update keys when configured', () => {
          const f = project.addFolder('test');
          const r = project.addRequest('https://domain.com');
          const copy = project.clone({ withoutRevalidate: true });
  
          assert.equal(copy.key, project.key);
          const [folder] = copy.listFolders();
          assert.equal(folder.key, f.key);
          const [request] = copy.listRequests();
          assert.equal(request.key, r.key);
        });
      });
  
      describe('ArcProject.clone()', () => {
        it('clones a project', () => {
          const project = ArcProject.fromName('a project');
          const copy = ArcProject.clone(project.toJSON());
          assert.equal(copy.info.name, 'a project');
        });
      });
    });

    describe('ArcProjectFolder', () => {
      describe('Initialization', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('initializes a default folder', () => {
          const result = new ArcProjectFolder(project);
          assert.equal(result.kind, ArcProjectFolderKind, 'sets the kind property');
          assert.deepEqual(result.items, [], 'sets the items property');
          assert.typeOf(result.updated, 'number', 'sets the updated property');
          assert.typeOf(result.created, 'number', 'sets the created property');
  
          const { info } = result;
          assert.typeOf(info, 'object', 'sets the default info property');
          assert.equal(info.kind, ThingKind, 'sets the info.kind property');
          assert.equal(info.name, 'New folder', 'sets the info.name property');
        });
      });
  
      describe('From schema initialization', () => {
        let project: ArcProject;
        let base: IProjectParent;
        beforeEach(() => {
          project = new ArcProject();
          base = {
            kind: ArcProjectFolderKind,
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
          const init: IProjectParent = { ...base, ...{ info: {
            kind: ThingKind,
            name: 'Test project',
            description: 'Project description',
            version: '1.2.3',
          }}};
          const result = new ArcProjectFolder(project, init);
          const { info } = result;
          assert.equal(info.kind, ThingKind, 'sets the info.kind property');
          assert.equal(info.name, 'Test project', 'sets the info.name property');
          assert.equal(info.description, 'Project description', 'sets the info.description property');
          assert.equal(info.version, '1.2.3', 'sets the info.version property');
        });
  
        it('sets the created/updated', () => {
          const result = new ArcProjectFolder(project, base);
          assert.equal(result.created, 456);
          assert.equal(result.updated, 123);
        });
  
        it('sets the passed key', () => {
          const result = new ArcProjectFolder(project, base);
          assert.equal(result.key, 'test1234');
        });
  
        it('sets a new key when the passed key is missing', () => {
          delete base.key;
          const result = new ArcProjectFolder(project, base);
          assert.typeOf(result.key, 'string');
        });
  
        it('creates the default items', () => {
          delete base.items;
          const result = new ArcProjectFolder(project, base);
          assert.deepEqual(result.items, []);
        });
  
        it('sets the stored items', () => {
          base.items = [ArcProjectItem.projectFolder(project, 'a-key')];
          const serialized = JSON.stringify(base);
          const result = new ArcProjectFolder(project, serialized);
          assert.lengthOf(result.items, 1, 'has a single item');
          assert.equal(result.items[0].key, 'a-key', 'has the serialized item');
        });
      });
  
      describe('From JSON string initialization', () => {
        it('restores project data from JSON string', () => {
          const project = new ArcProject();
          const folder = project.addFolder('a folder');
          const str = JSON.stringify(folder);
          
          const result = new ArcProjectFolder(project, str);
  
          assert.equal(result.key, folder.key, 'restores the key');
          assert.equal(result.info.name, 'a folder', 'restores the info object');
        });
      });
  
      describe('toJSON()', () => {
        let project: ArcProject;
        let base: IProjectParent;
        beforeEach(() => {
          project = new ArcProject();
          base = {
            kind: ArcProjectFolderKind,
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
          const init: IProjectParent = { ...base, ...{ info: {
            kind: ThingKind,
            name: 'Test project',
            description: 'Project description',
            version: '1.2.3',
          }}};
          const folder = new ArcProjectFolder(project, init);
          const result = folder.toJSON();
          assert.equal(result.info.kind, ThingKind, 'has the kind');
          assert.equal(result.info.name, 'Test project', 'has the name');
          assert.equal(result.info.description, 'Project description', 'has the description');
          assert.equal(result.info.version, '1.2.3', 'has the version');
        });
  
        it('serializes the key', () => {
          const init: IProjectParent = { ...base };
          const folder = new ArcProjectFolder(project, init);
          const result = folder.toJSON();
          assert.equal(result.key, init.key);
        });
  
        it('serializes the created/updated', () => {
          const init: IProjectParent = { ...base };
          const folder = new ArcProjectFolder(project, init);
          const result = folder.toJSON();
          assert.equal(result.created, init.created);
          assert.equal(result.updated, init.updated);
        });
  
        it('serializes the items', () => {
          const init: IProjectParent = { ...base, ...{ items: [ArcProjectItem.projectFolder(project, 'a-key')] } };
          const folder = new ArcProjectFolder(project, init);
          const result = folder.toJSON();
          assert.lengthOf(result.items, 1);
        });
      });
  
      describe('ArcProjectFolder.fromName()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('sets the name', () => {
          const result = ArcProjectFolder.fromName(project, 'a name');
          assert.equal(result.info.name, 'a name');
        });
  
        it('uses the default name', () => {
          const result = ArcProjectFolder.fromName(project);
          assert.equal(result.info.name, 'New folder');
        });
  
        it('generates the key', () => {
          const result = ArcProjectFolder.fromName(project, 'a name');
          assert.typeOf(result.key, 'string');
        });
  
        it('generates the created/updated', () => {
          const result = ArcProjectFolder.fromName(project, 'a name');
          assert.approximately(result.updated, Date.now(), 100);
          assert.approximately(result.created, Date.now(), 100);
        });
  
        it('adds empty items', () => {
          const result = ArcProjectFolder.fromName(project, 'a name');
          assert.deepEqual(result.items, []);
        });
  
        it('sets the kind', () => {
          const result = ArcProjectFolder.fromName(project, 'a name');
          assert.equal(result.kind, ArcProjectFolderKind);
        });
      });
  
      describe('new()', () => {
        it('restores a folder definition', () => {
          const project = new ArcProject();
          const folder = project.addFolder('a folder');
          const time = 12345;
          folder.new({
            created: time,
            updated: time,
            info: {
              kind: ThingKind,
              name: 'test',
            },
            items: [],
            key: 'abc',
            kind: ArcProjectFolderKind,
          });
          assert.equal(folder.created, time, 'updates the created');
          assert.equal(folder.updated, time, 'updates the created');
          assert.equal(folder.key, 'abc', 'updates the key');
          assert.equal(folder.info.name, 'test', 'updates the info');
        });
  
        it('restores items', () => {
          const project = new ArcProject();
          const folder = project.addFolder('a folder');
          const time = 12345;
          const def: IProjectParent = {
            created: time,
            updated: time,
            info: {
              kind: ThingKind,
              name: 'test',
            },
            items: [],
            key: 'abc',
            kind: ArcProjectFolderKind,
          };
          folder.new(def);
          assert.equal(folder.created, time, 'updates the created');
          assert.equal(folder.updated, time, 'updates the created');
          assert.equal(folder.key, 'abc', 'updates the key');
          assert.equal(folder.info.name, 'test', 'updates the info');
        });
  
        it('adds the default info object', () => {
          const project = new ArcProject();
          const folder = project.addFolder('a folder');
          const time = 12345;
          const def: IProjectParent = {
            created: time,
            updated: time,
            info: {
              kind: ThingKind,
              name: 'test',
            },
            items: [],
            key: 'abc',
            kind: ArcProjectFolderKind,
          };
          delete def.info;
          folder.new(def);
          assert.equal(folder.info.name, 'New folder');
        });
      });
  
      describe('addFolder()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
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
  
        it('adds a folder by name', () => {
          const parent = project.addFolder('parent');
          parent.addFolder('sub');
          const def = project.findFolder('sub');
          assert.equal(def.info.name, 'sub');
        });
  
        it('adds a folder by schema', () => {
          const parent = project.addFolder('parent');
          const f = new ArcProjectFolder(project);
          f.info.name = 'sub';
          parent.addFolder(f.toJSON());
          const def = project.findFolder('sub');
          assert.equal(def.info.name, 'sub');
        });
  
        it('adds a folder by an instance', () => {
          const parent = project.addFolder('parent');
          const f = new ArcProjectFolder(project);
          f.info.name = 'sub';
          parent.addFolder(f);
          const def = project.findFolder('sub');
          assert.equal(def.info.name, 'sub');
        });
      });
  
      describe('addRequest()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('calls the project\'s add request function', () => {
          const parent = project.addFolder('parent');
          const spy = sinon.spy(project, 'addRequest');
          const request = ArcProjectRequest.fromName('test', project);
          parent.addRequest(request);
          assert.isTrue(spy.calledOnce);
          assert.deepEqual(spy.args[0][0], request, 'has the request');
          assert.deepEqual(spy.args[0][1], { parent: parent.key }, 'has the options');
        });
  
        it('adds the request to the items', () => {
          const parent = project.addFolder('parent');
          const request = ArcProjectRequest.fromName('test', project);
          parent.addRequest(request);
          assert.lengthOf(parent.items, 1);
        });
  
        it('adds a request from the url', () => {
          const parent = project.addFolder('parent');
          const request = parent.addRequest('https://api.com');
          assert.equal(request.info.name, 'https://api.com');
          assert.equal(request.expects.url, 'https://api.com');
        });
      });
  
      describe('listFolderItems()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('returns empty array when no folders', () => {
          const folder = project.addFolder('parent');
          
          const request = ArcProjectRequest.fromName('test', project);
          folder.addRequest(request);
  
          const result = folder.listFolderItems();
          assert.deepEqual(result, []);
        });
  
        it('returns folder folders', () => {
          const folder = project.addFolder('parent');
          const f1 = folder.addFolder('f1');
          const f2 = folder.addFolder('f2');
          
          const request = ArcProjectRequest.fromName('test', project);
          folder.addRequest(request);
  
          const result = folder.listFolderItems();
          assert.lengthOf(result, 2, 'has 2 items');
          assert.equal(result[0].key, f1.key, 'has the first folder');
          assert.equal(result[1].key, f2.key, 'has the second folder');
        });
      });
  
      describe('listRequestItems()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('returns empty array when no requests', () => {
          const folder = project.addFolder('parent');
          folder.addFolder('f1');
  
          const result = folder.listRequestItems();
          assert.deepEqual(result, []);
        });
  
        it('returns folder requests', () => {
          const folder = project.addFolder('parent');
          const request = ArcProjectRequest.fromName('test', project);
          folder.addRequest(request);
  
          const result = folder.listRequestItems();
          assert.lengthOf(result, 1, 'has the request');
          assert.equal(result[0].key, request.key, 'has the key');
        });
      });
  
      describe('listFolders()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('calls the project\'s listFolders function', () => {
          const folder = project.addFolder('parent');
          const spy = sinon.spy(project, 'listFolders');
          folder.listFolders();
          assert.isTrue(spy.calledOnce);
          assert.equal(spy.args[0][0].folder, folder.key, 'has the only argument');
        });
  
        it('returns the list', () => {
          const folder = project.addFolder('parent');
          const child = folder.addFolder('child');
          const result = folder.listFolders();
          assert.deepEqual(result, [child]);
        });
      });
  
      describe('listRequests()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
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
  
          const request = ArcProjectRequest.fromName('test', project);
          folder.addRequest(request);
          
          const result = folder.listRequests();
          assert.deepEqual(result, [request]);
        });
      });
  
      describe('remove()', () => {
        let project: ArcProject;
        let folder: ArcProjectFolder;
  
        beforeEach(() => {
          project = new ArcProject();
          folder = project.addFolder('test');
        });
  
        it('removes the folder from the project definitions', () => {
          folder.remove();
          assert.deepEqual(project.definitions.folders, []);
        });
  
        it('removes the folder from the project items', () => {
          folder.remove();
          assert.deepEqual(project.items, []);
        });
  
        it('removes the folder from the parent folder items', () => {
          const sub = folder.addFolder('sub');
          sub.remove();
          assert.deepEqual(folder.items, []);
        });
  
        it('removes the sub-folder from the project definitions', () => {
          const sub = folder.addFolder('sub');
          assert.lengthOf(project.definitions.folders, 2, 'has 2 definitions');
          sub.remove();
          assert.lengthOf(project.definitions.folders, 1, 'has 1 definition');
        });
      });
  
      describe('getParent()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('returns the project object', () => {
          const folder = project.addFolder('test');
          const result = folder.getParent();
          assert.isTrue(result === project);
        });
  
        it('returns the folder object', () => {
          const parent = project.addFolder('test');
          const folder = parent.addFolder('test 2');
          const result = folder.getParent();
          assert.isTrue(result === parent);
        });
      });
  
      describe('getProject()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('returns the project when added to the project', () => {
          const folder = project.addFolder('test');
          const result = folder.getProject();
          assert.isTrue(result === project);
        });
  
        it('returns the project when added to a folder', () => {
          const parent = project.addFolder('test');
          const folder = parent.addFolder('test 2');
          const result = folder.getProject();
          assert.isTrue(result === project);
        });
      });
  
      describe('clone()', () => {
        let project: ArcProject;
        let folder: ArcProjectFolder;
  
        beforeEach(() => {
          project = new ArcProject();
          folder = project.addFolder('test');
        });
  
        it('updates the key by default', () => {
          const { key: oldKey } = folder;
          const copy = folder.clone();
          assert.typeOf(copy.key, 'string', 'has the key');
          assert.notEqual(copy.key, oldKey, 'has a new key');
        });
  
        it('adds the copy to the project definitions (project root)', () => {
          const copy = folder.clone();
          assert.lengthOf(project.definitions.folders, 2, 'has 2 definitions');
          assert.isTrue(project.definitions.folders.some(i => i.key === copy.key), 'has the folder definition');
        });
  
        it('adds the copy to the project definitions (folder root)', () => {
          const sub = folder.addFolder('sub');
          const copy = sub.clone();
          assert.lengthOf(project.definitions.folders, 3, 'has 3 definitions');
          assert.isTrue(project.definitions.folders.some(i => i.key === copy.key), 'has the folder definition');
        });
  
        it('adds the copy to the project items (project root)', () => {
          const copy = folder.clone();
          assert.lengthOf(project.items, 2, 'has 2 items');
          assert.isTrue(project.items.some(i => i.key === copy.key), 'has the folder item');
        });
  
        it('adds the copy to the sub-folder items', () => {
          const sub = folder.addFolder('sub');
          const copy = sub.clone();
          assert.lengthOf(project.items, 1, 'project has 1 item');
          assert.lengthOf(folder.items, 2, 'parent has 2 items');
          assert.isTrue(folder.items.some(i => i.key === copy.key), 'the folder is added to the parent');
        });
  
        it('copies requests with the folder by default', () => {
          const r = folder.addRequest('https://copy.com');
          const copy = folder.clone();
          
          assert.lengthOf(copy.items, 1, 'the copy has one request');
          assert.typeOf(copy.items[0].key, 'string', 'the request has the key');
          assert.notEqual(copy.items[0].key, r.key, 'the copied request has a different key');
        });
  
        it('adds the copied folder and request to the project definitions', () => {
          folder.addRequest('https://copy.com');
          folder.clone();
          
          assert.lengthOf(project.definitions.requests, 2, 'the project has 2 request definitions');
          assert.lengthOf(project.definitions.requests, 2, 'the project has 2 folder definitions');
          
          const [f1, f2] = project.definitions.folders;
          const [r1, r2] = project.definitions.requests;
  
          assert.notEqual(f1.key, f2.key, 'folder keys are different');
          assert.notEqual(r1.key, r2.key, 'request keys are different');
        });
  
        it('quietly ignores missing requests', () => {
          const r = folder.addRequest('https://copy.com');
          const i = project.definitions.requests.findIndex(i => i.key === r.key);
          project.definitions.requests.splice(i, 1);
          folder.clone();
          assert.lengthOf(project.definitions.folders, 2, 'the project has 2 definitions');
          const [f1, f2] = project.definitions.folders;
          assert.notEqual(f1.key, f2.key, 'folder keys are different');
        });
  
        it('copies sub-folders with the folder by default', () => {
          const sub = folder.addFolder('sub');
          const copy = folder.clone();
          
          assert.lengthOf(copy.items, 1, 'the copy has one request');
          assert.typeOf(copy.items[0].key, 'string', 'the folder has the key');
          assert.notEqual(copy.items[0].key, sub.key, 'the copied folder has a different key');
        });
  
        it('adds a sub-folder of the copied folder to the project definitions', () => {
          folder.addFolder('sub orig');
          folder.clone();
          
          assert.lengthOf(project.definitions.folders, 4, 'the project has 4 folder definitions');
          
          const [f1, f2, c1, c2] = project.definitions.folders;
          
          assert.notEqual(f1.key, c1.key, 'folder keys are different');
          assert.equal(f1.info.name, c1.info.name, 'folder 1 names match');
          assert.notEqual(f2.key, c2.key, 'request keys are different');
          assert.equal(c2.info.name, c2.info.name, 'folder 2 names match');
        });
  
        it('quietly ignores missing folders', () => {
          const sub = folder.addFolder('sub');
          const i = project.definitions.folders.findIndex(i => i.key === sub.key);
          project.definitions.folders.splice(i, 1);
          folder.clone();
          assert.lengthOf(project.definitions.folders, 2, 'the project has 2 definitions');
          const [f1, f2] = project.definitions.folders;
          assert.notEqual(f1.key, f2.key, 'folder keys are different');
        });
  
        it('copies a folder with a sub-folder with requests', () => {
          const sub = folder.addFolder('sub');
          const origRequest = sub.addRequest('http://api.com');
  
          const result = folder.clone();
  
          const projectFolders = project.listFolders();
          assert.lengthOf(projectFolders, 2, 'the project has 2 folders');
  
          assert.deepEqual(projectFolders[0], folder, 'folder #1 is set');
          assert.deepEqual(projectFolders[1], result, 'folder #2 is set');
  
          assert.lengthOf(sub.listRequests(), 1, 'original sub-folder has a single request');
          assert.deepEqual(sub.listRequests()[0], origRequest, 'original sub-folder has the original request');
  
          const topRequests = result.listRequests();
          assert.lengthOf(topRequests, 0, 'root copy folder has no requests');
  
          const folders = result.listFolders();
          assert.lengthOf(folders, 1, 'root copy folder has a folder');
  
          const [subCopy] = folders;
          const subRequests = subCopy.listRequests();
          assert.lengthOf(subRequests, 1, 'sub folder has a request');
        });
  
        it('copies a folder to a specific folder inside the same project', () => {
          const sub = folder.addFolder('sub1');
          sub.addRequest('http://api.com');
          const targetFolder = project.addFolder('sub2');
          folder.clone({ targetFolder: targetFolder.key });
  
          const subFolders = targetFolder.listFolders();
          assert.lengthOf(subFolders, 1, 'has the copied folder');
          const [copyTopLevelFolder] = subFolders;
  
          const [subLevelCopy] = copyTopLevelFolder.listFolders();
          assert.ok(subLevelCopy, 'has the copied sub-folder');
  
          const subRequests = subLevelCopy.listRequests();
          assert.lengthOf(subRequests, 1, 'has the copied request');
        });
  
        it('copies a folder to another project to the root level', () => {
          const sub = folder.addFolder('sub');
          const origRequest = sub.addRequest('http://api.com');
  
          const origSnapshot = project.toJSON();
  
          const targetProject = new ArcProject();
          folder.clone({ targetProject });
  
          assert.deepEqual(project.toJSON(), origSnapshot, 'the original project is not changed');
  
          const copiedTopFolder = targetProject.findFolder(folder.info.name);
          assert.ok(copiedTopFolder, 'target project has the top-level folder');
          assert.notEqual(copiedTopFolder.key, folder.key, 'target folder has a new key');
  
          const subFolder = copiedTopFolder.listFolders()[0];
          assert.ok(subFolder, 'target project has the sub-folder');
          assert.notEqual(subFolder.key, sub.key, 'the sub-folder has a new key');
  
          const copiedRequest = subFolder.listRequests()[0];
          assert.ok(copiedRequest, 'target project has the request');
          assert.notEqual(copiedRequest.key, origRequest.key, 'the request has a new key');
        });
  
        it('copies a folder to another project under a folder', () => {
          const sub = folder.addFolder('sub');
          sub.addRequest('http://api.com');
  
          const origSnapshot = project.toJSON();
  
          const targetProject = new ArcProject();
          const targetFolder = targetProject.addFolder('parent');
          folder.clone({ targetProject, targetFolder: targetFolder.key });
  
          assert.deepEqual(project.toJSON(), origSnapshot, 'the original project is not changed');
  
          // the target folder has 1 folder + copied 2 folders + copied 1 request
          assert.lengthOf(targetProject.definitions.folders, 3, 'has the copied folder definitions');
          assert.lengthOf(targetProject.definitions.requests, 1, 'has the copied requests definitions');
  
          const rootFolders = targetFolder.listFolders();
          assert.lengthOf(rootFolders, 1, 'the target folder has a root folder from the originating project');
  
          const [rootFolder] = rootFolders;
          const subFolders = rootFolder.listFolders();
          assert.lengthOf(subFolders, 1, 'the copied folder has a sub-folder');
  
          const [subFolder] = subFolders;
  
          const requests = subFolder.listRequests();
          assert.lengthOf(requests, 1, 'the sub-folder has a request');
        });
  
        it('throws when unable to find a parent in the same project', () => {
          const sub = folder.addFolder('sub');
          sub.addRequest('http://api.com');
          assert.throws(() => {
            folder.clone({ targetFolder: 'test' });
          });
        });
  
        it('throws when unable to find a parent in the foreign project', () => {
          const sub = folder.addFolder('sub');
          sub.addRequest('http://api.com');
  
          const targetProject = new ArcProject();
          assert.throws(() => {
            folder.clone({ targetProject, targetFolder: 'test' });
          });
        });
      });

      describe('addLegacyRequest()', () => {
        it('adds a legacy history request', async () => {
          const project = new ArcProject();
          const request = generator.http.history();
          const folder = project.addFolder('f1');
          const created = await folder.addLegacyRequest(request);
          assert.ok(created, 'returns the created request');
          assert.lengthOf(project.definitions.requests, 1, 'has one definition');
  
          assert.deepEqual(project.definitions.requests[0], created, 'inserts the definition into project\'s definitions');
          assert.equal(folder.items[0].key, created.key, 'the project has the item');
  
          assert.equal(created.getParent().kind, ArcProjectFolderKind, 'the request has the parent as the folder');
  
          assert.equal(created.expects.url, request.url, 'has the URL');
          assert.equal(created.info.name, 'Unnamed request', 'has the default name');
        });
  
        it('adds a legacy saved request', async () => {
          const project = new ArcProject();
          const request = generator.http.saved();
          const folder = project.addFolder('f1');
          const created = await folder.addLegacyRequest(request);
          assert.ok(created, 'returns the created request');
          assert.lengthOf(project.definitions.requests, 1, 'has one definition');
  
          assert.deepEqual(project.definitions.requests[0], created, 'inserts the definition into project\'s definitions');
          assert.equal(folder.items[0].key, created.key, 'the project has the item');
  
          assert.equal(created.getParent().kind, ArcProjectFolderKind, 'the request has the parent as the project');
  
          assert.equal(created.expects.url, request.url, 'has the URL');
          assert.equal(created.info.name, request.name, 'has the name');
        });
      });
    });

    describe('ArcProjectItem', () => {
      describe('ArcProjectItem.projectRequest()', () => {
        it('creates the item', () => {
          const project = ArcProject.fromName('test');
          const item = ArcProjectItem.projectRequest(project, 'r1');
          assert.equal(item.kind, ArcProjectRequestKind);
          assert.equal(item.key, 'r1');
        });
      });
  
      describe('ArcProjectItem.projectFolder()', () => {
        it('creates the item', () => {
          const project = ArcProject.fromName('test');
          const item = ArcProjectItem.projectFolder(project, 'f1');
          assert.equal(item.kind, ArcProjectFolderKind);
          assert.equal(item.key, 'f1');
        });
      });
  
      describe('ArcProjectItem.isProjectItem()', () => {
        it('returns true for a folder item', () => {
          const project = ArcProject.fromName('test');
          const item = ArcProjectItem.projectFolder(project, 'f1');
          assert.isTrue(ArcProjectItem.isProjectItem(item));
        });
  
        it('returns true for a folder item', () => {
          const project = ArcProject.fromName('test');
          const item = ArcProjectItem.projectRequest(project, 'r1');
          assert.isTrue(ArcProjectItem.isProjectItem(item));
        });
  
        it('returns false when not an item', () => {
          assert.isFalse(ArcProjectItem.isProjectItem({}));
        });
      });
  
      describe('constructor()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = ArcProject.fromName('test');
        });
  
        it('creates a default item for "http-request" type', () => {
          const item = new ArcProjectItem(project, 'http-request');
          assert.equal(item.kind, ArcProjectRequestKind);
          assert.equal(item.key, '');
        });
  
        it('creates a default item for "folder" type', () => {
          const item = new ArcProjectItem(project, 'folder');
          assert.equal(item.kind, ArcProjectFolderKind);
          assert.equal(item.key, '');
        });
  
        it('creates an instance from a schema', () => {
          const schema = ArcProjectItem.projectRequest(project, 'r1').toJSON();
          const item = new ArcProjectItem(project, schema);
          assert.equal(item.kind, ArcProjectRequestKind);
          assert.equal(item.key, 'r1');
        });
  
        it('creates an instance from a serialized schema', () => {
          const schema = JSON.stringify(ArcProjectItem.projectRequest(project, 'r1'));
          const item = new ArcProjectItem(project, schema);
          assert.equal(item.kind, ArcProjectRequestKind);
          assert.equal(item.key, 'r1');
        });
  
        it('throws when input is not defined', () => {
          assert.throws(() => {
            new ArcProjectItem(project, undefined);
          });
        });
      });
  
      describe('toJSON()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = ArcProject.fromName('test');
        });
  
        it('sets the kind', () => {
          const item = ArcProjectItem.projectRequest(project, 'r1').toJSON();
          assert.equal(item.kind, ArcProjectRequestKind);
        });
  
        it('sets the key', () => {
          const item = ArcProjectItem.projectRequest(project, 'r1').toJSON();
          assert.equal(item.key, 'r1');
        });
      });
  
      describe('getItem()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = ArcProject.fromName('test');
        });
  
        it('returns a definition of a request', () => {
          const created = project.addRequest('https://api.com');
          const definition = project.items[0].getItem();
          assert.deepEqual(definition, created);
        });
  
        it('returns a definition of a folder', () => {
          const created = project.addFolder('a folder');
          const definition = project.items[0].getItem();
          assert.deepEqual(definition, created);
        });
      });
  
      describe('getParent()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = ArcProject.fromName('test');
        });
  
        it('returns the project for a root level items', () => {
          project.addRequest('https://api.com');
          const definition = project.items[0].getParent();
          assert.isTrue(definition === project);
        });
  
        it('returns a parent folder', () => {
          const f1 = project.addFolder('f1');
          f1.addFolder('f2');
          const definition = f1.items[0].getParent();
          assert.isTrue(definition === f1);
        });
      });
    });

    describe('ArcProjectRequest', () => {
      describe('Initialization', () => {
        describe('Default project initialization', () => {
          let project: ArcProject;
          beforeEach(() => {
            project = new ArcProject();
          });
  
          it('initializes a default project request', () => {
            const result = new ArcProjectRequest(project);
            assert.equal(result.kind, ArcProjectRequestKind, 'sets the kind property');
            assert.typeOf(result.created, 'number', 'sets the created property');
            assert.equal(result.updated, result.created, 'sets the updated property');
            assert.typeOf(result.midnight, 'number', 'sets the updated property');
            assert.typeOf(result.key, 'string', 'sets the key property');
            assert.typeOf(result.info, 'object', 'sets the info property');
            assert.typeOf(result.expects, 'object', 'sets the expects property');
            assert.isUndefined(result.log, 'does not set the log property');
            assert.isUndefined(result.config, 'does not set the config property');
            assert.isUndefined(result.authorization, 'does not set the authorization property');
            assert.isUndefined(result.actions, 'does not set the actions property');
            assert.isUndefined(result.clientCertificate, 'does not set the clientCertificate property');
          });
        });
  
        describe('From schema initialization', () => {
          let project: ArcProject;
          let base: IArcProjectRequest;
          beforeEach(() => {
            project = new ArcProject();
            base = {
              kind: ArcProjectRequestKind,
              info: {
                kind: ThingKind,
                name: '',
              },
              key: '',
              expects: {
                kind: HttpRequestKind,
                method: '',
                url: '',
              }
            }
          });
  
          it('sets the kind property', () => {
            const init: IArcProjectRequest = { ...base };
            const request = new ArcProjectRequest(project, init);
            assert.equal(request.kind, ArcProjectRequestKind);
          });
  
          it('sets the key property when missing', () => {
            const init: IArcProjectRequest = { ...base };
            delete init.key;
            const request = new ArcProjectRequest(project, init);
            assert.typeOf(request.key, 'string');
            assert.isNotEmpty(request.key);
          });
  
          it('sets the key property', () => {
            const init: IArcProjectRequest = { ...base, ... { key: 'test' } };
            const request = new ArcProjectRequest(project, init);
            assert.equal(request.key, 'test');
          });
  
          it('sets the expects property when missing', () => {
            const init: IArcProjectRequest = { ...base };
            delete init.expects;
            const request = new ArcProjectRequest(project, init);
            assert.typeOf(request.expects, 'object');
            assert.equal(request.expects.method, 'GET');
            assert.equal(request.expects.url, '');
          });
  
          it('sets the expects property', () => {
            const init: IArcProjectRequest = { ...base, ... { expects: { kind: HttpRequestKind, url: 'test.com', method: 'GET' } } };
            const request = new ArcProjectRequest(project, init);
            assert.typeOf(request.expects, 'object');
            assert.equal(request.expects.method, 'GET');
            assert.equal(request.expects.url, 'test.com');
          });
  
          it('sets the info property when missing', () => {
            const init: IArcProjectRequest = { ...base };
            delete init.info;
            const request = new ArcProjectRequest(project, init);
            assert.typeOf(request.info, 'object');
            assert.equal(request.info.name, '');
          });
  
          it('sets the info property', () => {
            const init: IArcProjectRequest = { ...base, ... { info: { kind: ThingKind, name: 'A request' } } };
            const request = new ArcProjectRequest(project, init);
            assert.typeOf(request.info, 'object');
            assert.equal(request.info.name, 'A request');
          });
  
          it('sets the log property', () => {
            const sentRequest = SentRequest.fromBaseValues({
              url: 'test.com', 
              startTime: Date.now(),
            });
            const log = RequestLog.fromRequest(sentRequest.toJSON());
            const init: IArcProjectRequest = { ...base, ... { log: log.toJSON() } };
            const request = new ArcProjectRequest(project, init);
            assert.typeOf(request.log, 'object');
            assert.equal(request.log.kind, RequestLogKind);
            assert.typeOf(request.log.request, 'object');
            assert.equal(request.log.request.url, 'test.com');
          });
  
          it('sets the config property', () => {
            const config = RequestConfig.withDefaults();
            const init: IArcProjectRequest = { ...base, ... { config: config.toJSON() } };
            const request = new ArcProjectRequest(project, init);
            assert.typeOf(request.config, 'object');
            assert.isTrue(request.config.enabled);
            assert.equal(request.config.timeout, 90);
          });
  
          it('sets the authorization property', () => {
            const authorization = new RequestAuthorization();
            const init: IArcProjectRequest = { ...base, ... { authorization: [authorization.toJSON()] } };
            const request = new ArcProjectRequest(project, init);
            assert.typeOf(request.authorization, 'array');
            assert.lengthOf(request.authorization, 1);
          });
  
          it('sets the created property', () => {
            const init: IArcProjectRequest = { ...base, ...{ created: 123 } };
            const request = new ArcProjectRequest(project, init);
            assert.equal(request.created, 123);
          });
  
          it('sets the default created property', () => {
            const init: IArcProjectRequest = { ...base };
            const request = new ArcProjectRequest(project, init);
            assert.typeOf(request.created, 'number');
          });
  
          it('sets the updated property', () => {
            const init: IArcProjectRequest = { ...base, ...{ updated: 123 } };
            const request = new ArcProjectRequest(project, init);
            assert.equal(request.updated, 123);
          });
  
          it('sets the default updated property', () => {
            const init: IArcProjectRequest = { ...base };
            const request = new ArcProjectRequest(project, init);
            assert.equal(request.updated, request.created);
          });
  
          it('sets the midnight property', () => {
            const init: IArcProjectRequest = { ...base, ...{ midnight: 123 } };
            const request = new ArcProjectRequest(project, init);
            assert.equal(request.midnight, 123);
          });
  
          it('sets the default midnight property', () => {
            const now = new Date();
            const init: IArcProjectRequest = { ...base, updated: now.getTime() };
            const request = new ArcProjectRequest(project, init);
            now.setHours(0, 0, 0, 0);
            assert.equal(request.midnight, now.getTime());
          });
        });
  
        describe('From JSON string initialization', () => {
          it('restores project data from JSON string', () => {
            const project = new ArcProject();
            const request = project.addRequest('https://api.com');
            const str = JSON.stringify(request);
            
            const result = new ArcProjectRequest(project, str);
  
            assert.equal(result.key, request.key, 'restores the key');
            assert.equal(result.info.name, 'https://api.com', 'restores the info object');
            assert.equal(result.expects.url, 'https://api.com', 'restores the expects object');
          });
        });
  
        describe('ArcProjectRequest.fromUrl()', () => {
          const url = 'https://api.com';
  
          let project: ArcProject;
          beforeEach(() => {
            project = new ArcProject();
          });
  
          it('sets the request values', () => {
            const request = ArcProjectRequest.fromUrl(url, project);
            const { expects } = request;
            assert.equal(expects.url, url, 'sets the url');
            assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
            assert.equal(expects.method, 'GET', 'sets the HTTP method');
          });
  
          it('sets the info values', () => {
            const request = ArcProjectRequest.fromUrl(url, project);
            const { info } = request;
            assert.equal(info.name, url, 'sets the name');
            assert.equal(info.kind, ThingKind, 'sets the kind');
          });
  
          it('sets request meta', () => {
            const request = ArcProjectRequest.fromUrl(url, project);
            assert.typeOf(request.key, 'string', 'has the key');
            assert.equal(request.kind, ArcProjectRequestKind, 'sets the kind');
            assert.typeOf(request.created, 'number', 'sets the created');
            assert.equal(request.updated, request.created, 'sets the updated');
          });
  
          it('throws when the project ius missing', () => {
            assert.throws(() => {
              ArcProjectRequest.fromUrl(url);
            }, 'The project is required.');
          });
        });
  
        describe('ArcProjectRequest.fromName()', () => {
          const name = 'a request';
  
          let project: ArcProject;
          beforeEach(() => {
            project = new ArcProject();
          });
  
          it('sets the request values', () => {
            const request = ArcProjectRequest.fromName(name, project);
            const { expects } = request;
            assert.equal(expects.url, '', 'sets the empty url');
            assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
            assert.equal(expects.method, 'GET', 'sets the HTTP method');
          });
  
          it('sets the info values', () => {
            const request = ArcProjectRequest.fromName(name, project);
            const { info } = request;
            assert.equal(info.name, name, 'sets the name');
            assert.equal(info.kind, ThingKind, 'sets the kind');
          });
  
          it('sets request meta', () => {
            const request = ArcProjectRequest.fromName(name, project);
            assert.typeOf(request.key, 'string', 'has the key');
            assert.equal(request.kind, ArcProjectRequestKind, 'sets the kind');
            assert.typeOf(request.created, 'number', 'sets the created');
            assert.equal(request.updated, request.created, 'sets the updated');
          });
  
          it('throws when the project ius missing', () => {
            assert.throws(() => {
              ArcProjectRequest.fromName(name);
            }, 'The project is required.');
          });
        });
  
        describe('ArcProjectRequest.fromHttpRequest()', () => {
          let iRequest: IHttpRequest;
  
          let project: ArcProject;
          beforeEach(() => {
            project = new ArcProject();
            iRequest = {
              kind: HttpRequestKind,
              method: 'PUT',
              url: 'https://api.com',
              headers: 'x-test: true',
              payload: 'something',
            };
          });
  
          it('sets the request values', () => {
            const request = ArcProjectRequest.fromHttpRequest(iRequest, project);
            const { expects } = request;
            assert.equal(expects.url, iRequest.url, 'sets the empty url');
            assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
            assert.equal(expects.method, iRequest.method, 'sets the HTTP method');
            assert.equal(expects.headers, iRequest.headers, 'sets the headers');
            assert.equal(expects.payload, iRequest.payload, 'sets the payload');
          });
  
          it('sets the info values', () => {
            const request = ArcProjectRequest.fromHttpRequest(iRequest, project);
            const { info } = request;
            assert.equal(info.name, iRequest.url, 'sets the name');
            assert.equal(info.kind, ThingKind, 'sets the kind');
          });
  
          it('sets request meta', () => {
            const request = ArcProjectRequest.fromHttpRequest(iRequest, project);
            assert.typeOf(request.key, 'string', 'has the key');
            assert.equal(request.kind, ArcProjectRequestKind, 'sets the kind');
            assert.typeOf(request.created, 'number', 'sets the created');
            assert.equal(request.updated, request.created, 'sets the updated');
          });
  
          it('throws when the project ius missing', () => {
            assert.throws(() => {
              ArcProjectRequest.fromHttpRequest(iRequest);
            }, 'The project is required.');
          });
        });
  
        describe('ArcProjectRequest.fromRequest()', () => {
          let iRequest: IRequest;
  
          let project: ArcProject;
          beforeEach(() => {
            project = new ArcProject();
            const httpRequest: IHttpRequest = {
              kind: RequestKind,
              method: 'PUT',
              url: 'https://api.com',
              headers: 'x-test: true',
              payload: 'something',
            };
            const r = Request.fromHttpRequest(httpRequest);
            r.info.name = 'a name';
            iRequest = r.toJSON();
          });
  
          it('sets the request values', () => {
            const request = ArcProjectRequest.fromRequest(iRequest, project);
            const { expects } = request;
            assert.equal(expects.url, iRequest.expects.url, 'sets the empty url');
            assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
            assert.equal(expects.method, iRequest.expects.method, 'sets the HTTP method');
            assert.equal(expects.headers, iRequest.expects.headers, 'sets the headers');
            assert.equal(expects.payload, iRequest.expects.payload, 'sets the payload');
          });
  
          it('sets the info values', () => {
            const request = ArcProjectRequest.fromRequest(iRequest, project);
            const { info } = request;
            assert.equal(info.name, 'a name', 'sets the name');
            assert.equal(info.kind, ThingKind, 'sets the kind');
          });
  
          it('sets request meta', () => {
            const request = ArcProjectRequest.fromRequest(iRequest, project);
            assert.typeOf(request.key, 'string', 'has the key');
            assert.equal(request.kind, ArcProjectRequestKind, 'sets the kind');
            assert.typeOf(request.created, 'number', 'sets the created');
            assert.equal(request.updated, request.created, 'sets the updated');
          });
        });
      });
  
      describe('getParent()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('returns the project object', () => {
          const r = project.addRequest('https://api.com');
          const result = r.getParent();
          assert.isTrue(result === project);
        });
  
        it('returns the folder object', () => {
          const folder = project.addFolder('a folder');
          const r = folder.addRequest('https://api.com');
          const result = r.getParent();
          assert.isTrue(result === folder);
        });
      });
  
      describe('getProject()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('returns the project when added to the project', () => {
          const r = project.addRequest('https://api.com');
          const result = r.getProject();
          assert.isTrue(result === project);
        });
  
        it('returns the project when added to a folder', () => {
          const folder = project.addFolder('a folder');
          const r = folder.addRequest('https://api.com');
          const result = r.getProject();
          assert.isTrue(result === project);
        });
      });
  
      describe('remove()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('removes from a project root', () => {
          const r = project.addRequest('https://api.com');
          r.remove();
          assert.deepEqual(project.items, []);
          assert.deepEqual(project.definitions.requests, []);
        });
  
        it('removes from a folder', () => {
          const folder = project.addFolder('a folder');
          const r = folder.addRequest('https://api.com');
          r.remove();
          assert.deepEqual(folder.items, [], 'folder has no items');
          assert.lengthOf(project.items, 1, 'projects has a single item');
          assert.lengthOf(project.items.filter(i => i.kind === ArcProjectFolderKind), 1, 'projects has only folder items');
          assert.lengthOf(project.definitions.requests, 0, 'projects has no request definitions');
        });
      });
  
      describe('clone()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        describe('project root', () => {
          it('clones with defaults from a project root', () => {
            const r = project.addRequest('https://api.com');
            const result = r.clone();
            assert.typeOf(result.key, 'string', 'has the key');
            assert.notEqual(result.key, r.key, 'has a different key');
            assert.lengthOf(project.items, 2, 'project has a new item');
            assert.isTrue(project.items.some(i => i.key === result.key), 'the project has the new item');
            assert.lengthOf(project.definitions.requests, 2, 'project has a new definition');
            assert.isTrue(project.definitions.requests.some(i => i.key === result.key), 'the project has the new definition');
          });
  
          it('does not change the key', () => {
            const r = project.addRequest('https://api.com');
            const result = r.clone({ withoutRevalidate: true });
            assert.equal(result.key, r.key);
          });
  
          it('does not attach to the project', () => {
            const r = project.addRequest('https://api.com');
            const result = r.clone({ withoutAttach: true });
            
            assert.lengthOf(project.items, 1, 'project has no new items');
            assert.isFalse(project.items.some(i => i.key === result.key), 'the project has the new item');
            assert.lengthOf(project.definitions.requests, 1, 'project has no new definitions');
            assert.isFalse(project.definitions.requests.some(i => i.key === result.key), 'the project has no new definitions');
          });
  
          it('copies a request from one project to another', () => {
            const r = project.addRequest('https://api.com');
            const result = r.clone({ withoutAttach: true });
            const target = new ArcProject();
            target.addRequest(result);
            assert.isTrue(result.getProject() === target, 'the request has a new project');
            assert.lengthOf(target.items, 1);
            assert.lengthOf(target.definitions.requests, 1);
          });
        });
  
        describe('folder root', () => {
          let request: ArcProjectRequest;
          let folder: ArcProjectFolder;
          beforeEach(() => {
            folder = project.addFolder('a folder');
            request = folder.addRequest('https://api.com');
          });
  
          it('clones with defaults from a folder root', () => {
            const result = request.clone();
            assert.typeOf(result.key, 'string', 'has the key');
            assert.notEqual(result.key, request.key, 'has a different key');
            assert.lengthOf(project.items, 1, 'project has still a single item');
            assert.lengthOf(folder.items, 2, 'folder has a new item');
            assert.isTrue(folder.items.some(i => i.key === result.key), 'the folder has the new item');
            assert.lengthOf(project.definitions.requests, 2, 'project has a new definition');
            assert.isTrue(project.definitions.requests.some(i => i.key === result.key), 'the project has the new definition');
          });
  
          it('copies a request from one project to another', () => {
            const result = request.clone({ withoutAttach: true });
            const target = new ArcProject();
            target.addRequest(result);
            assert.isTrue(result.getProject() === target, 'the request has a new project');
            assert.lengthOf(target.items, 1);
            assert.lengthOf(target.definitions.requests, 1);
          });
        });
      });
  
      describe('ArcProjectRequest.clone()', () => {
        let project: ArcProject;
        beforeEach(() => {
          project = new ArcProject();
        });
  
        it('clones the request', () => {
          const request = project.addRequest('https://api.com');
          const result = ArcProjectRequest.clone(request.toJSON(), project);
  
          assert.typeOf(result.key, 'string', 'has the key');
          assert.notEqual(result.key, request.key, 'has a different key');
          assert.lengthOf(project.items, 2, 'project has a new item');
          assert.isTrue(project.items.some(i => i.key === result.key), 'the project has the new item');
          assert.lengthOf(project.definitions.requests, 2, 'project has a new definition');
          assert.isTrue(project.definitions.requests.some(i => i.key === result.key), 'the project has the new definition');
        });
      });
    });
  });
});
