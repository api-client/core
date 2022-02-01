/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-named-as-default-member */

import fs from 'fs-extra';
import path from 'path';
import { ExpressServer } from './servers/ExpressServer.js';

const server = new ExpressServer();
const lockFile = path.join('test', 'express.lock');

export const mochaGlobalSetup = async () => {
  await server.start();
  process.env.HTTP_TEST_PORT = server.httpPort;
  process.env.HTTPS_TEST_PORT = server.httpsPort;
  await fs.outputJSON(lockFile, {
    httpPort: server.httpPort,
    httpsPort: server.httpsPort,
  });
};

export const mochaGlobalTeardown = async () => {
  await server.stop();
  await fs.remove(lockFile);
};
