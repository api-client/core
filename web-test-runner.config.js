/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/extensions */
import { esbuildPlugin } from '@web/dev-server-esbuild';
import { OAuth2Server } from 'oauth2-mock-server';
import getPort, {portNumbers} from 'get-port';
import { CodeServerMock } from './test/servers/oauth2mock/ServerMock.js';

/** @typedef {import('@web/test-runner').TestRunnerConfig} TestRunnerConfig */

const oauth2server = new OAuth2Server();
let oauth2env;

export default /** @type TestRunnerConfig */ ({
  nodeResolve: true,
  files: [
    'test/**/*.browser.test.ts',
    // 'test/oauth2/*.browser.test.ts'
  ],

  testFramework: {
    config: {
      timeout: 5000,
    }
  },

  plugins: [
    esbuildPlugin({ ts: true, js: true, }),

    {
      name: 'mock-api',
      serve(context) {
        if (context.path === '/test/env.js') {
          const data = {
            oauth2: oauth2env,
          };
          return `export default ${JSON.stringify(data)}`;
        }
        if (context.path === '/oauth2/auth-code') {
          return CodeServerMock.authRequest(context.request);
        }
        if (context.path === '/oauth2/token') {
          return CodeServerMock.tokenRequest(context);
        }
        if (context.path === '/oauth2/auth-code-custom') {
          return CodeServerMock.authRequestCustom(context.request);
        }
        if (context.path === '/oauth2/token-custom') {
          return CodeServerMock.tokenRequestCustom(context);
        }
        if (context.path === '/oauth2/password') {
          return CodeServerMock.tokenPassword(context);
        }
        if (context.path === '/oauth2/client-credentials') {
          return CodeServerMock.tokenClientCredentials(context);
        }
        if (context.path === '/oauth2/client-credentials-header') {
          return CodeServerMock.tokenClientCredentialsHeader(context);
        }
        if (context.path === '/oauth2/custom-grant') {
          return CodeServerMock.tokenCustomGrant(context);
        }
        if (context.path === '/empty-response') {
          return '';
        }
        return undefined;
      },
    },

    {
      name: 'servers',
      async serverStart() {
        const port = await getPort({ port: portNumbers(8000, 8100) });
        await oauth2server.issuer.keys.generate('RS256');
        await oauth2server.start(port, 'localhost');
        oauth2env = {
          port,
          issuer: oauth2server.issuer.url,
        };
      },

      async serverStop() {
        await oauth2server.stop();
      },
    },
  ],

  middleware: [
    function implicitAuth(context, next) {
      if (context.path === '/oauth2/auth-implicit') {
        return CodeServerMock.authRequestImplicit(context);
      }
      if (context.path === '/oauth2/auth-implicit-custom') {
        return CodeServerMock.authRequestImplicitCustom(context);
      }
      if (context.path === '/oauth2/auth-implicit-invalid-state') {
        return CodeServerMock.authRequestImplicitStateError(context);
      }
      return next();
    }
  ],
});
