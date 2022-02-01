import { Router, Request, Response } from 'express';
import cors from 'cors';
import { BaseApi } from './BaseApi.js';

const router = Router();
export default router;

class CookieApiRoute extends BaseApi {
  async randomCookies(req: Request, res: Response): Promise<void> {
    res.cookie('c1', 'v1', { expires: new Date(Date.now() + 900000), httpOnly: true });
    res.cookie('c2', 'v2');
    res.cookie('c3', 'v3', { sameSite: 'strict', secure: true });
    res.send({ ok: true });
  }
}

const api = new CookieApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/', cors(checkCorsFn), api.randomCookies.bind(api));
