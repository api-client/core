import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  nodeResolve: true,
  files: ['test/**/*.browser.test.ts'],
  plugins: [esbuildPlugin({ ts: true, js: true, })],
};
