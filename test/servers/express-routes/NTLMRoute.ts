import { Router, Request, Response } from 'express';
import cors from 'cors';
import ntlm from 'express-ntlm';
import { BaseApi } from './BaseApi.js';

const router = Router();
export default router;

// https://github.com/einfallstoll/express-ntlm
router.use(ntlm({
  debug: function() {
      // const args = Array.prototype.slice.apply(arguments);
      // console.log.apply(null, args);
  },
  domain: 'TEST-DOMAIN',
}));

class NTLMRoute extends BaseApi {
  async resource(req: Request, res: Response): Promise<void> {
    console.log('[SERVER] Handling the NTLM request');
    
    res.setHeader('content-type', 'application/json');
    res.send({ authenticated: true });
  }
}
const api = new NTLMRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/resource', cors(checkCorsFn), api.resource.bind(api));
