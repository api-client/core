import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import shrinkRay from 'shrink-ray-current';
import { BaseApi } from './BaseApi';

const router = express.Router();
export default router;

router.use(shrinkRay());

class CompressApiRoute extends BaseApi {
  async brotli(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('json.json');
    const buff = await fs.readFile(resource);
    res.setHeader('content-type', 'application/json');
    res.send(buff);
  }

  async deflate(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('json.json');
    const buff = await fs.readFile(resource);
    res.setHeader('content-type', 'application/json');
    res.send(buff);
  }

  async gzip(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('json.json');
    const buff = await fs.readFile(resource);
    res.setHeader('content-type', 'application/json');
    res.send(buff);
  }
}
const api = new CompressApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/brotli', cors(checkCorsFn), api.brotli.bind(api));
router.get('/deflate', cors(checkCorsFn), api.deflate.bind(api));
router.get('/gzip', cors(checkCorsFn), api.gzip.bind(api));
