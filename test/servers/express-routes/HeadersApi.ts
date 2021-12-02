import express, { Request, Response } from 'express';
import cors from 'cors';
import { BaseApi } from './BaseApi';

const router = express.Router();
export default router;

class HeadersApiRoute extends BaseApi {
  async listHeaders(req: Request, res: Response): Promise<void> {
    const { headers } = req;
    res.send({ headers });
  }
}
const api = new HeadersApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/', cors(checkCorsFn), api.listHeaders.bind(api));
