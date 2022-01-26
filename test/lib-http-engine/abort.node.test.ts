/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { assert } from 'chai';
import net from 'net';
import { NodeEngine, DummyLogger, HttpEngineOptions } from '../../index.js';

const logger = new DummyLogger();

describe('http-engine', () => {
  describe('Electron request', () => {
    const opts: HttpEngineOptions = {
      logger,
    };
    const port = Number(process.env.HTTP_TEST_PORT);

    describe('Aborting the request', () => {
      function setupSocket(base: NodeEngine): Promise<void> {
        return new Promise((resolve, reject) => {
          const socket = new net.Socket({
            writable: true,
          });
          socket.connect(port, 'localhost', () => {
            base.socket = socket;
            resolve();
          });
          socket.on('error', () => {
            reject(new Error('Unable to connect'));
          });
        });
      }

      it('sets aborted flag', () => {
        const base = new NodeEngine({
          method: 'GET',
          url: `http://localhost:${port}/v1/headers`,
        }, opts);
        base.abort();
        assert.isTrue(base.aborted);
      });

      it('destroys the socket', async () => {
        const base = new NodeEngine({
          method: 'GET',
          url: `http://localhost:${port}/v1/headers`,
        }, opts);
        await setupSocket(base);
        base.abort();
        assert.isUndefined(base.socket);
      });

      it('removes destroyed socket', async () => {
        const base = new NodeEngine({
          method: 'GET',
          url: `http://localhost:${port}/v1/headers`,
        }, opts);
        await setupSocket(base);
        base.socket!.pause();
        base.socket!.destroy();
        base.abort();
        assert.isUndefined(base.socket);
      });

      it('_decompress() results to undefined', async () => {
        const request = new NodeEngine({
          method: 'GET',
          url: `http://localhost:${port}/v1/headers`,
        }, opts);
        request.abort();
        const result = await request.decompress(Buffer.from('test'));
        assert.isUndefined(result);
      });

      it('_createResponse() results to undefined', async () => {
        const request = new NodeEngine({
          method: 'GET',
          url: `http://localhost:${port}/v1/headers`,
        }, opts);
        request.abort();
        const result = await request._createResponse();
        assert.isUndefined(result);
      });
    });
  });
});
