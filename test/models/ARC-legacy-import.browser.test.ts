import { assert } from '@esm-bundle/chai';
import { DataTestHelper } from '../legacy-transformers/DataTestHelper.js';
import { ArcLegacyNormalizer } from '../../src/models/transformers/ArcLegacyNormalizer.js';
import { LegacyDataExportToApiProject } from '../../src/models/transformers/LegacyDataExportToApiProject.js';
import { HttpProject } from '../../src/models/HttpProject.js';
import { ProjectRequest, Kind as ProjectRequestKind } from '../../src/models/ProjectRequest.js';
import { LegacyMock } from '../../src/mocking/LegacyMock.js';
import { LegacyExportProcessor } from '../../src/models/transformers/LegacyExportProcessor.js';
import { ARCProject } from '../../src/models/legacy/models/ArcLegacyProject.js';
import { ARCVariable } from '../../src/models/legacy/models/Variable.js';
import { ARCSavedRequest } from '../../src/models/legacy/request/ArcRequest.js';

describe('Models', () => {
  describe('ARC legacy import', () => {
    const generator = new LegacyMock();

    describe('Importing exported ARC 17 file', () => {
      let projects: HttpProject[];
      before(async () => {
        const response = await DataTestHelper.getFile('arc-pouchdb.json');
        const jsonData = JSON.parse(response);
        const normalizer = new ArcLegacyNormalizer();
        const normalized = await normalizer.normalize(jsonData);
        const factory = new LegacyDataExportToApiProject();
        projects = await factory.readProjects(normalized);
      });

      it('creates a list of projects', () => {
        assert.typeOf(projects, 'array');
        assert.lengthOf(projects, 1);
      });

      it('the project has requests and corresponding items', () => {
        const { definitions, items } = projects[0];
        assert.lengthOf(items, 1);
        assert.lengthOf(definitions.requests, 1);
        const [item] = items;
        const [def] = definitions.requests;
        
        assert.equal(item.kind, ProjectRequestKind);
        assert.equal(item.key, def.key);
        
        assert.typeOf(def.key, 'string');
        assert.equal(def.kind, ProjectRequestKind);
        const request = (def  as ProjectRequest);
        assert.typeOf(request.expects, 'object');
        assert.typeOf(request.info, 'object');
        assert.typeOf(request.log, 'object');
      });
    });

    describe('Importing projects', () => {
      let result: HttpProject[];
      let generatedProjects: ARCProject[];
      let generatedRequests: ARCSavedRequest[];
      let multiProjectRequest: ARCSavedRequest;
      let multiRequestProject: ARCProject;
      let generatedVariables: ARCVariable[];

      before(async () => {
        const generated = generator.http.savedData(20, 3, { forceProject: true });
        generatedProjects = generated.projects;
        generatedRequests = generated.requests;
        multiProjectRequest = generatedRequests[0];
        multiRequestProject = generatedProjects.find(i => !i.requests!.includes(multiProjectRequest._id));
        multiRequestProject.requests.push(multiProjectRequest._id);
        multiProjectRequest.projects.push(multiRequestProject._id);

        generatedVariables = generator.variables.listVariables(3, { randomEnv: true });
        
        const exportProcessor = new LegacyExportProcessor(false);
        const data = exportProcessor.createExportObject([
          {
            key: 'projects',
            data: generatedProjects,
          },
          {
            key: 'requests',
            data: generatedRequests,
          },
          {
            key: 'variables',
            data: generatedVariables,
          }
        ], {
          appVersion: '1',
          provider: 'test'
        });
        
        const factory = new LegacyDataExportToApiProject();
        result = await factory.readProjects(data);
      });

      it('has all projects data', () => {
        assert.lengthOf(result, 3);
      });

      it('uses the same project keys', () => {
        const [project] = result;
        const [generatedProject] = generatedProjects;
        
        assert.equal(project.key, generatedProject._id);
      });

      it('uses the same request keys', () => {
        const [project] = result;
        const [generatedProject] = generatedProjects;
        const [request] = project.items;
        const [generatedRequestId] = generatedProject.requests;
        
        assert.equal(request.key, generatedRequestId);
      });

      it('copies a request to multiple projects', () => {
        const { projects, _id } = multiProjectRequest;
        assert.isAbove(projects.length, 1);
        const [pid1, pid2] = projects;

        const p1 = result.find(p => p.key = pid1);
        const p2 = result.find(p => p.key = pid2);

        // check request exists in project 1
        assert.ok(p1);
        const r1 = p1.definitions.requests.find(i => i.key === _id);
        assert.ok(r1);

        // check request exists in project 2
        assert.ok(p2);
        const r2 = p2.definitions.requests.find(i => i.key === _id);
        assert.ok(r2);
      });

      it('adds environments to the generated projects', () => {
        const [project] = result;
        const { environments: envIds, definitions } = project.toJSON();
        const { environments } = definitions;
        
        assert.lengthOf(envIds, 3, 'has all environment ids');
        assert.lengthOf(environments, 3, 'has all environment definitions');
        const [env] = environments;
        const [variable] = generatedVariables;
        assert.equal(env.info.name, variable.environment, 'sets the environment name');

        assert.lengthOf(env.variables, 1, 'has the variable on the environment');
        assert.equal(env.variables[0].name, variable.name, 'the variable has copied values');
      });
    });
  });
});
