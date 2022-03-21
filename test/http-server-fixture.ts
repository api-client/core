/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-named-as-default-member */

import fs from 'fs-extra';
import path from 'path';
import { ExpressServer } from './servers/ExpressServer.js';
import { getPort } from '../src/testing/getPort.js';
import * as Server from './lib-http-engine/cert-auth-server/index.js';
import * as ChunkedServer from './servers/ChunkedServer.js';
import { ProxyServer } from './servers/ProxyServer.js';
import { SetupConfig } from './helpers/interfaces.js';

const server = new ExpressServer();
const proxy = new ProxyServer();
const lockFile = path.join('test', 'express.lock');

export const mochaGlobalSetup = async (): Promise<void> => {
  await server.start();
  // SSL certificates
  const certificatesPort = await getPort();
  await Server.startServer(certificatesPort);
  // chunked responses
  const chunkedHttpPort = await getPort();
  const chunkedHttpsPort = await getPort();
  await ChunkedServer.startServer(chunkedHttpPort, chunkedHttpsPort);
  // HTTP proxy
  await proxy.start();
  // proxy.debug = true;

  const info: SetupConfig = {
    httpPort: server.httpPort as number,
    httpsPort: server.httpsPort as number,
    certificatesPort,
    chunkedHttpPort,
    chunkedHttpsPort,
    proxyHttpPort: proxy.httpPort as number,
    proxyHttpsPort: proxy.httpsPort as number,
  };

  await fs.outputJSON(lockFile, info);
};

export const mochaGlobalTeardown = async (): Promise<void> => {
  await server.stop();
  await Server.stopServer();
  await ChunkedServer.stopServer();
  await proxy.stop();
  await fs.remove(lockFile);
};
