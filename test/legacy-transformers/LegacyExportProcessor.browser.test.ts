/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { ExportArcHistoryRequest, ExportArcWebsocketUrl, ExportArcUrlHistory, ExportArcVariable, ExportArcAuthData, ExportArcHostRule, ARCVariable, ARCProject, ARCSavedRequest, LegacyExportProcessor, LegacyMock } from '../../legacy.js';

describe('LegacyExportProcessor', () => {
  const generator = new LegacyMock();

  function mockRev(data: any[]): any[] {
    return data.map((item) => {
      // @ts-ignore
      item._rev = generator.types.string();
      return item;
    });
  }

  describe('prepareRequestsList()', () => {
    let data: ARCSavedRequest[];
    let instance: LegacyExportProcessor;
    beforeEach(async () => {
      instance = new LegacyExportProcessor(false);
      const projects = generator.http.listProjects(20);
      const insert = generator.http.savedData(20, 20, { projects }).requests;
      data = mockRev(insert);
    });

    it('returns an array', () => {
      const result = instance.prepareRequestsList(data);
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      const result = instance.prepareRequestsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('key is set', () => {
      const result = instance.prepareRequestsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        assert.typeOf(result[i].key, 'string');
      }
    });

    it('removes the legacyProject', () => {
      // @ts-ignore
      data[0].legacyProject = 'abc';
      delete data[0].projects;
      const result = instance.prepareRequestsList(data);
      // @ts-ignore
      assert.isUndefined(result[0].legacyProject);
    });

    it('creates projects from a legacyProject', () => {
      // @ts-ignore
      data[0].legacyProject = 'abc';
      delete data[0].projects;
      const result = instance.prepareRequestsList(data);
      assert.typeOf(result[0].projects, 'array');
      assert.equal(result[0].projects[0], 'abc');
    });

    it('adds to projects from the legacyProject', () => {
      data[0].projects = ['test'];
      // @ts-ignore
      data[0].legacyProject = 'abc';
      const result = instance.prepareRequestsList(data);
      // @ts-ignore
      assert.isUndefined(result[0].legacyProject);
      assert.lengthOf(result[0].projects, 2);
    });

    it('kind property is set', () => {
      const result = instance.prepareRequestsList(data);
      assert.equal(result[0].kind, 'ARC#HttpRequest');
    });
  });

  describe('prepareProjectsList()', () => {
    let data: ARCProject[];
    let instance: LegacyExportProcessor;

    beforeEach(() => {
      instance = new LegacyExportProcessor(false);
      data = generator.http.listProjects(5);
      data = mockRev(data);
    });

    it('Result is an array', () => {
      const result = instance.prepareProjectsList(data);
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      const result = instance.prepareProjectsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        // @ts-ignore
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        // @ts-ignore
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('key is set', () => {
      const ids = data.map((item) => item._id);
      const result = instance.prepareProjectsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i].key !== ids[i]) {
          throw new Error('Key is not set');
        }
      }
    });

    it('kind property is set', () => {
      const result = instance.prepareProjectsList(data);
      assert.equal(result[0].kind, 'ARC#ProjectData');
    });
  });

  describe('prepareHistoryDataList()', () => {
    let result: ExportArcHistoryRequest[];

    beforeEach(async () => {
      const instance = new LegacyExportProcessor(false);
      let data = generator.http.listHistory();
      data = mockRev(data);
      result = instance.prepareHistoryDataList(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#HttpRequest');
    });
  });

  describe('prepareWsUrlHistoryData()', () => {
    let result: ExportArcWebsocketUrl[];

    beforeEach(async () => {
      const instance = new LegacyExportProcessor(false);
      let data = generator.urls.urls();
      data = mockRev(data);
      result = instance.prepareWsUrlHistoryData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#WebsocketHistoryData');
    });
  });

  describe('prepareUrlHistoryData()', () => {
    let result: ExportArcUrlHistory[];

    beforeEach(async () => {
      const instance = new LegacyExportProcessor(false);
      let data = generator.urls.urls();
      data = mockRev(data);
      result = instance.prepareUrlHistoryData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#UrlHistoryData');
    });
  });

  describe('prepareVariablesData()', () => {
    let result: ExportArcVariable[];
    let removed: ARCVariable;
    beforeEach(async () => {
      const instance = new LegacyExportProcessor(false);
      let data = generator.variables.listVariables();
      data = mockRev(data);
      // @ts-ignore
      data[1].environment = false;
      removed = data[1];
      result = instance.prepareVariablesData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#Variable');
    });

    it('ignores items that have no environment', () => {
      const item = result.find((v) => v.key === removed._id);
      assert.notOk(item);
    });
  });

  describe('prepareAuthData()', () => {
    let result: ExportArcAuthData[];

    beforeEach(async () => {
      const instance = new LegacyExportProcessor(false);
      let data = generator.authorization.basicList();
      data = mockRev(data);
      result = instance.prepareAuthData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#AuthData');
    });
  });

  describe('prepareCookieData()', () => {
    let result: any[];

    beforeEach(async () => {
      const instance = new LegacyExportProcessor(false);
      let data = generator.cookies.cookies();
      data = mockRev(data);
      result = instance.prepareCookieData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#Cookie');
    });
  });

  describe('prepareCookieData() with electron cookies', () => {
    let result: any[];

    beforeEach(async () => {
      const instance = new LegacyExportProcessor(true);
      let data = generator.cookies.cookies();
      data = mockRev(data);
      result = instance.prepareCookieData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('does not set key', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        assert.isUndefined(result[i].key);
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#Cookie');
    });
  });

  describe('prepareHostRulesData()', () => {
    let result: ExportArcHostRule[];

    beforeEach(async () => {
      const instance = new LegacyExportProcessor(false);
      let data = generator.hostRules.rules();
      data = mockRev(data);
      result = instance.prepareHostRulesData(data);
    });

    it('Result is an array', () => {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', () => {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', () => {
      assert.equal(result[0].kind, 'ARC#HostRule');
    });
  });

  describe('createExportObject()', () => {
    let instance: LegacyExportProcessor;

    beforeEach(() => {
      instance = new LegacyExportProcessor(true);
    });

    it('returns an object', () => {
      const result = instance.createExportObject([], { appVersion: '123', provider: 'xyz' });
      assert.typeOf(result, 'object');
    });

    it('has export time', () => {
      const result = instance.createExportObject([], { appVersion: '123', provider: 'xyz' });
      assert.typeOf(result.createdAt, 'string');
    });

    it('has application version', () => {
      const result = instance.createExportObject([], {
        appVersion: '1.2.3',
        provider: 'xyz',
      });
      assert.equal(result.version, '1.2.3');
    });

    it('has export kind', () => {
      const result = instance.createExportObject([], {
        appVersion: '123',
        kind: 'ARC#test',
        provider: 'xyz',
      });
      assert.equal(result.kind, 'ARC#test');
    });

    it('has loadToWorkspace property', () => {
      const result = instance.createExportObject([], {
        appVersion: '123',
        skipImport: true,
        provider: 'xyz',
      });
      assert.isTrue(result.loadToWorkspace);
    });
  });

  describe('prepareItem()', () => {
    describe('cookies', () => {
      let data: any[];
      let instance: LegacyExportProcessor;
      beforeEach(async () => {
        instance = new LegacyExportProcessor(false);
        const cookies = generator.cookies.cookies();
        data = mockRev(cookies);
      });

      it('prepares cookie data', () => {
        const result = instance.prepareItem('cookies', data);
        assert.equal(result[0].kind, 'ARC#Cookie');
      });
    });

    describe('clientcertificates', () => {
      let data: any[];
      let instance: LegacyExportProcessor;
      beforeEach(async () => {
        instance = new LegacyExportProcessor(false);
        let certs = generator.certificates.clientCertificates(2);
        certs = mockRev(certs);
        data = [];
        certs.forEach((obj) => {
          const item = obj;
          const certificate = /** @type Certificate */ (item.cert);
          const keyCertificate = /** @type Certificate */ (item.key);
          const dataDoc = {
            cert: generator.certificates.toStore(certificate),
          };
          delete item.cert;
          if (item.key) {
            // @ts-ignore
            dataDoc.key = generator.certificates.toStore(keyCertificate);
            delete item.key;
          }
          // @ts-ignore
          item._id = `index-id-${Date.now()}`;
          // @ts-ignore
          dataDoc._id = `data-id-${Date.now()}`;
          // @ts-ignore
          item.dataKey = `data-${Date.now()}`;
          data.push({ item, data: dataDoc });
        });
      });

      it('prepares client certificates data', () => {
        const result = instance.prepareItem('clientcertificates', data);
        assert.equal(result[0].kind, 'ARC#ClientCertificate');
      });
    });

    describe('default', () => {
      let instance: LegacyExportProcessor;
      beforeEach(async () => {
        instance = new LegacyExportProcessor(false);
      });

      it('returns undefined', () => {
        // @ts-ignore
        const result = instance.prepareItem('unknown', []);
        assert.isUndefined(result);
      });
    });
  });
});
