import { Router, Request, Response } from 'express';
import cors from 'cors';
import { BaseApi } from './BaseApi.js';

const router = Router();
export default router;

class StatusCodeApiRoute extends BaseApi {
  statusCode(req: Request, res: Response): void {
    const { params } = req;
    let code = Number(params.code);
    switch (code) {
      case 200:
        res.statusCode = code;
        res.send('test');
        break;
      case 201:
        res.statusCode = code;
        res.set('location', `/code/${code}`);
        res.send('test');
        break;
      case 202:
      case 204:
        res.statusCode = code;
        res.set('location', `/code/${code}`);
        res.end();
        break;
      default:
        res.setHeader('content-type', 'text/html; charset=UTF-8');
        res.send(`<h1>IUnsupported code: ${code}</h1>`);
    }
  }
}

const api = new StatusCodeApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.all('/:code', cors(checkCorsFn), api.statusCode.bind(api));
