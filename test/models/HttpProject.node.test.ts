import { assert } from 'chai';
import { 
  HttpProject, 
  HttpProjectKind, 
  IHttpProject,
  ThingKind,
} from '../../index';

//
// Note, the actual unit tests are located in the `HttpProject.browser.test.ts` file.
// This is to make sure that everything is working in the NodeJS module as well.
//

describe('Models', () => {
  describe('HttpProject', () => {
    describe('Initialization', () => {
      describe('Default project initialization', () => {
        it('initializes a default project', () => {
          const result = new HttpProject();
          assert.equal(result.kind, HttpProjectKind, 'sets the kind property');
        });
      });

      describe('From schema initialization', () => {
        let base: IHttpProject;
        beforeEach(() => {
          base = {
            kind: HttpProjectKind,
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
        });
      });

      describe('HttpProject.fromName()', () => {
        it('creates an empty project with a name', () => {
          const project = HttpProject.fromName('Test project');
          assert.equal(project.kind, HttpProjectKind, 'sets the kind property');
        });
      });
    });
  });
});
