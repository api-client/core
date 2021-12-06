import { Router, Request, Response } from 'express';
import cors from 'cors';
import { BaseApi } from './BaseApi.js';

const router = Router();
export default router;

class QueryParamsApiRoute extends BaseApi {
  async listParams(req: Request, res: Response): Promise<void> {
    const { query } = req;
    res.send({ params: { query } });
  }
}
const api = new QueryParamsApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/', cors(checkCorsFn), api.listParams.bind(api));
