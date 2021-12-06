import { ExpressServer } from './ExpressServer.js';

(async (): Promise<void> => {
  const srv = new ExpressServer();
  const port = await srv.startHttp();
  console.log('Running on port', port);
})();
