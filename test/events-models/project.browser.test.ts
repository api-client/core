import { assert } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Events } from '../../src/events/Events.js';
import { EventTypes } from '../../src/events/EventTypes.js';
import { ContextUpdateEvent, ContextUpdateEventDetail } from '../../src/events/BaseEvents.js';
import { HttpProject, IHttpProject, IProjectMoveOptions, IFolderCreateOptions, IRequestAddOptions } from '../../src/models/HttpProject.js';
import { ProjectFolder, IProjectFolder } from '../../src/models/ProjectFolder.js';
import { ProjectRequest, IProjectRequest } from '../../src/models/ProjectRequest.js';
import { Environment, IEnvironment } from '../../src/models/Environment.js';

describe('Events', () => {
  describe('Models', () => {
    describe('Project', () => {
      describe('create()', () => {
        const name = 'test';

        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.create, spy);
          Events.Model.Project.create(document.body, name);
          window.removeEventListener(EventTypes.Model.Project.create, spy);
          assert.isTrue(spy.calledOnce);
        });

        it('has the name property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.create, spy);
          Events.Model.Project.create(document.body, name);
          window.removeEventListener(EventTypes.Model.Project.create, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.name, name);
        });
      });

      describe('read()', () => {
        const id = 'a';
        const rev = 'b';
  
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.read, spy);
          Events.Model.Project.read(document.body, id);
          window.removeEventListener(EventTypes.Model.Project.read, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the id property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.read, spy);
          Events.Model.Project.read(document.body, id);
          window.removeEventListener(EventTypes.Model.Project.read, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.id, id);
        });
    
        it('has the rev property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.read, spy);
          Events.Model.Project.read(document.body, id, rev);
          window.removeEventListener(EventTypes.Model.Project.read, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.rev, rev);
        });
      });

      describe('update()', () => {
        it('dispatches the event', () => {
          const project = HttpProject.fromName('test');

          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.update, spy);
          Events.Model.Project.update(document.body, project.toJSON());
          window.removeEventListener(EventTypes.Model.Project.update, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the detail property', () => {
          const project = HttpProject.fromName('test');
          const iProject = project.toJSON();

          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.update, spy);
          Events.Model.Project.update(document.body, iProject);
          window.removeEventListener(EventTypes.Model.Project.update, spy);
          const e = spy.args[0][0] as ContextUpdateEvent<IHttpProject>;
          const detail = e.detail as ContextUpdateEventDetail<IHttpProject>;
          assert.deepEqual(detail.item, iProject);
        });
      });

      describe('delete()', () => {
        const id = 'a';
  
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.delete, spy);
          Events.Model.Project.delete(document.body, id);
          window.removeEventListener(EventTypes.Model.Project.delete, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the id property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.delete, spy);
          Events.Model.Project.delete(document.body, id);
          window.removeEventListener(EventTypes.Model.Project.delete, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.id, id);
        });
      });

      describe('move()', () => {
        const key = 'test';
  
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.move, spy);
          Events.Model.Project.move(document.body, 'request', key);
          window.removeEventListener(EventTypes.Model.Project.move, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the type property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.move, spy);
          Events.Model.Project.move(document.body, 'request', key);
          window.removeEventListener(EventTypes.Model.Project.move, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.type, 'request');
        });
    
        it('has the key property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.move, spy);
          Events.Model.Project.move(document.body, 'request', key);
          window.removeEventListener(EventTypes.Model.Project.move, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.equal(e.detail.key, key);
        });
    
        it('has the opts property', () => {
          const opts: IProjectMoveOptions = {
            index: 1,
          };
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.move, spy);
          Events.Model.Project.move(document.body, 'request', key, opts);
          window.removeEventListener(EventTypes.Model.Project.move, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.opts, opts);
        });
      });

      describe('clone()', () => {
        const id = 'a';
  
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.clone, spy);
          Events.Model.Project.clone(document.body, id);
          window.removeEventListener(EventTypes.Model.Project.clone, spy);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the id property', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.clone, spy);
          Events.Model.Project.clone(document.body, id);
          window.removeEventListener(EventTypes.Model.Project.clone, spy);
          const e = spy.args[0][0] as CustomEvent<any>;
          assert.deepEqual(e.detail.id, id);
        });
      });

      describe('listAll()', () => {
        it('dispatches the event', () => {
          const spy = sinon.spy();
          window.addEventListener(EventTypes.Model.Project.listAll, spy);
          Events.Model.Project.listAll(document.body);
          window.removeEventListener(EventTypes.Model.Project.listAll, spy);
          assert.isTrue(spy.calledOnce);
        });
      });

      describe('Project.Folder', () => {
        describe('create()', () => {
          const name = 'test';
          const id = 'project-id';
  
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Folder.create, spy);
            Events.Model.Project.Folder.create(document.body, id, name);
            window.removeEventListener(EventTypes.Model.Project.Folder.create, spy);
            assert.isTrue(spy.calledOnce);
          });
  
          it('has the name property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Folder.create, spy);
            Events.Model.Project.Folder.create(document.body, id, name);
            window.removeEventListener(EventTypes.Model.Project.Folder.create, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.equal(e.detail.name, name);
          });
  
          it('has the id property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Folder.create, spy);
            Events.Model.Project.Folder.create(document.body, id, name);
            window.removeEventListener(EventTypes.Model.Project.Folder.create, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.equal(e.detail.id, id);
          });
  
          it('has the opts property', () => {
            const opts: IFolderCreateOptions = {
              index: 1,
            };
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Folder.create, spy);
            Events.Model.Project.Folder.create(document.body, id, name, opts);
            window.removeEventListener(EventTypes.Model.Project.Folder.create, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.equal(e.detail.index, opts.index);
          });
        });

        describe('delete()', () => {
          const projectId = 'a';
          const key = 'b';
    
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Folder.delete, spy);
            Events.Model.Project.Folder.delete(document.body, projectId, key);
            window.removeEventListener(EventTypes.Model.Project.Folder.delete, spy);
            assert.isTrue(spy.calledOnce);
          });
      
          it('has the id property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Folder.delete, spy);
            Events.Model.Project.Folder.delete(document.body, projectId, key);
            window.removeEventListener(EventTypes.Model.Project.Folder.delete, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.deepEqual(e.detail.id, key);
          });
      
          it('has the parent property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Folder.delete, spy);
            Events.Model.Project.Folder.delete(document.body, projectId, key);
            window.removeEventListener(EventTypes.Model.Project.Folder.delete, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.deepEqual(e.detail.parent, projectId);
          });
        });

        describe('update()', () => {
          const projectId = 'a';

          it('dispatches the event', () => {
            const project = HttpProject.fromName('test');
            const folder = ProjectFolder.fromName(project, 'test');
  
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Folder.update, spy);
            Events.Model.Project.Folder.update(document.body, projectId, folder.toJSON());
            window.removeEventListener(EventTypes.Model.Project.Folder.update, spy);
            assert.isTrue(spy.calledOnce);
          });
      
          it('has the detail property', () => {
            const project = HttpProject.fromName('test');
            const folder = ProjectFolder.fromName(project, 'test');
            const iFolder = folder.toJSON();
  
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Folder.update, spy);
            Events.Model.Project.Folder.update(document.body, projectId, iFolder);
            window.removeEventListener(EventTypes.Model.Project.Folder.update, spy);
            const e = spy.args[0][0] as ContextUpdateEvent<IProjectFolder>;
            const detail = e.detail as ContextUpdateEventDetail<IProjectFolder>;
            assert.deepEqual(detail.item, iFolder, 'has the "item"');
            assert.equal(detail.parent, projectId, 'has the "parent"');
          });
        });
      });

      describe('Project.Request', () => {
        describe('create()', () => {
          const url = 'test';
          const id = 'project-id';
  
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Request.create, spy);
            Events.Model.Project.Request.create(document.body, id, url);
            window.removeEventListener(EventTypes.Model.Project.Request.create, spy);
            assert.isTrue(spy.calledOnce);
          });
  
          it('has the url property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Request.create, spy);
            Events.Model.Project.Request.create(document.body, id, url);
            window.removeEventListener(EventTypes.Model.Project.Request.create, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.equal(e.detail.url, url);
          });
  
          it('has the id property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Request.create, spy);
            Events.Model.Project.Request.create(document.body, id, url);
            window.removeEventListener(EventTypes.Model.Project.Request.create, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.equal(e.detail.id, id);
          });
  
          it('has the opts property', () => {
            const opts: IRequestAddOptions = {
              index: 1,
            };
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Request.create, spy);
            Events.Model.Project.Request.create(document.body, id, url, opts);
            window.removeEventListener(EventTypes.Model.Project.Request.create, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.equal(e.detail.index, opts.index);
          });
        });

        describe('delete()', () => {
          const projectId = 'a';
          const key = 'b';
    
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Request.delete, spy);
            Events.Model.Project.Request.delete(document.body, projectId, key);
            window.removeEventListener(EventTypes.Model.Project.Request.delete, spy);
            assert.isTrue(spy.calledOnce);
          });
      
          it('has the id property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Request.delete, spy);
            Events.Model.Project.Request.delete(document.body, projectId, key);
            window.removeEventListener(EventTypes.Model.Project.Request.delete, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.deepEqual(e.detail.id, key);
          });
      
          it('has the parent property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Request.delete, spy);
            Events.Model.Project.Request.delete(document.body, projectId, key);
            window.removeEventListener(EventTypes.Model.Project.Request.delete, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.deepEqual(e.detail.parent, projectId);
          });
        });

        describe('update()', () => {
          const projectId = 'a';

          it('dispatches the event', () => {
            const project = HttpProject.fromName('test');
            const request = ProjectRequest.fromName('test', project);
  
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Request.update, spy);
            Events.Model.Project.Request.update(document.body, projectId, request.toJSON());
            window.removeEventListener(EventTypes.Model.Project.Request.update, spy);
            assert.isTrue(spy.calledOnce);
          });
      
          it('has the detail property', () => {
            const project = HttpProject.fromName('test');
            const request = ProjectRequest.fromName('test', project);
            const iRequest = request.toJSON();
  
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Request.update, spy);
            Events.Model.Project.Request.update(document.body, projectId, iRequest);
            window.removeEventListener(EventTypes.Model.Project.Request.update, spy);
            const e = spy.args[0][0] as ContextUpdateEvent<IProjectRequest>;
            const detail = e.detail as ContextUpdateEventDetail<IProjectRequest>;
            assert.deepEqual(detail.item, iRequest, 'has the "item"');
            assert.equal(detail.parent, projectId, 'has the "parent"');
          });
        });
      });

      describe('Project.Environment', () => {
        describe('create()', () => {
          const name = 'test';
          const id = 'project-id';
  
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Environment.create, spy);
            Events.Model.Project.Environment.create(document.body, id, name);
            window.removeEventListener(EventTypes.Model.Project.Environment.create, spy);
            assert.isTrue(spy.calledOnce);
          });
  
          it('has the name property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Environment.create, spy);
            Events.Model.Project.Environment.create(document.body, id, name);
            window.removeEventListener(EventTypes.Model.Project.Environment.create, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.equal(e.detail.name, name);
          });
  
          it('has the id property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Environment.create, spy);
            Events.Model.Project.Environment.create(document.body, id, name);
            window.removeEventListener(EventTypes.Model.Project.Environment.create, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.equal(e.detail.id, id);
          });
  
          it('has the key property', () => {
            const key = 'test-key';
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Environment.create, spy);
            Events.Model.Project.Environment.create(document.body, id, name, key);
            window.removeEventListener(EventTypes.Model.Project.Environment.create, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.equal(e.detail.key, key);
          });
        });

        describe('delete()', () => {
          const projectId = 'a';
          const key = 'b';
    
          it('dispatches the event', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Environment.delete, spy);
            Events.Model.Project.Environment.delete(document.body, projectId, key);
            window.removeEventListener(EventTypes.Model.Project.Environment.delete, spy);
            assert.isTrue(spy.calledOnce);
          });
      
          it('has the id property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Environment.delete, spy);
            Events.Model.Project.Environment.delete(document.body, projectId, key);
            window.removeEventListener(EventTypes.Model.Project.Environment.delete, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.deepEqual(e.detail.id, key);
          });
      
          it('has the parent property', () => {
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Environment.delete, spy);
            Events.Model.Project.Environment.delete(document.body, projectId, key);
            window.removeEventListener(EventTypes.Model.Project.Environment.delete, spy);
            const e = spy.args[0][0] as CustomEvent<any>;
            assert.deepEqual(e.detail.parent, projectId);
          });
        });

        describe('update()', () => {
          const projectId = 'a';

          it('dispatches the event', () => {
            const env = Environment.fromName('test');
  
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Environment.update, spy);
            Events.Model.Project.Environment.update(document.body, projectId, env.toJSON());
            window.removeEventListener(EventTypes.Model.Project.Environment.update, spy);
            assert.isTrue(spy.calledOnce);
          });
      
          it('has the detail property', () => {
            const env = Environment.fromName('test');
            const iEnv = env.toJSON();
  
            const spy = sinon.spy();
            window.addEventListener(EventTypes.Model.Project.Environment.update, spy);
            Events.Model.Project.Environment.update(document.body, projectId, iEnv);
            window.removeEventListener(EventTypes.Model.Project.Environment.update, spy);
            const e = spy.args[0][0] as ContextUpdateEvent<IEnvironment>;
            const detail = e.detail as ContextUpdateEventDetail<IEnvironment>;
            assert.deepEqual(detail.item, iEnv, 'has the "item"');
            assert.equal(detail.parent, projectId, 'has the "parent"');
          });
        });
      });
    });
  });
});
