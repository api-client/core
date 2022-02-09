/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-named-as-default-member */

import fs from 'fs-extra';
import path from 'path';
import { ExpressServer } from './servers/ExpressServer.js';
import getPort from './helpers/getPort.js';
import * as Server from './lib-http-engine/cert-auth-server/index.js';
import * as ChunkedServer from './servers/ChunkedServer.js';
import { ProxyServer } from './servers/ProxyServer.js';

const server = new ExpressServer();
const proxy = new ProxyServer();
const lockFile = path.join('test', 'express.lock');

export const mochaGlobalSetup = async () => {
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

  await fs.outputJSON(lockFile, {
    httpPort: server.httpPort,
    httpsPort: server.httpsPort,
    certificatesPort,
    chunkedHttpPort,
    chunkedHttpsPort,
    proxyHttpPort: proxy.httpPort,
    proxyHttpsPort: proxy.httpsPort,
  });
};

export const mochaGlobalTeardown = async () => {
  await server.stop();
  await Server.stopServer();
  await ChunkedServer.stopServer();
  await proxy.stop();
  await fs.remove(lockFile);
};
