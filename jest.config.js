/** @typedef {import('@jest/types').Config.InitialOptions} Config */

export default /** @type Config */ ({
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 10000,
  maxConcurrency: 1,
  // @todo: without this line the HTTP server can cause problem initializing as there's a race condition to 
  // run the ExpressServer for each test.
  maxWorkers: 1,
  testMatch: ['**/?(*.)+(node.test).ts'],
  // testMatch: ['**/proxy.node.test.ts'],
});
