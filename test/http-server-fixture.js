/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ExpressServer } from './servers/ExpressServer.js';

const server = new ExpressServer();

export const mochaGlobalSetup = async () => {
  await server.start();
  process.env.HTTP_TEST_PORT = server.httpPort;
  process.env.HTTPS_TEST_PORT = server.httpsPort;
};

export const mochaGlobalTeardown = async () => {
  await server.stop();
};
