import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { BaseApi } from './BaseApi';

const router = express.Router();
export default router;

class ImagesApiRoute extends BaseApi {
  getResourcePath(name: string): string {
    return path.join('test', 'servers', 'resources', name);
  }

  async html(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('html.html');
    const buff = await fs.readFile(resource);
    res.setHeader('content-type', 'text/html; charset=UTF-8');
    res.send(buff);
  }

  async json(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('json.json');
    const buff = await fs.readFile(resource);
    res.setHeader('content-type', 'application/json');
    res.send(buff);
  }

  async xml(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('xml.xml');
    const buff = await fs.readFile(resource);
    res.setHeader('content-type', 'application/xml');
    res.send(buff);
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @return {Promise}
   */
  async bytes(req: Request, res: Response): Promise<void> {
    const { params } = req;
    let size = Number(params.size);
    if (!size || Number.isNaN(size)) {
      size = 10;
    }
    const buf = crypto.randomBytes(size);
    res.setHeader('content-type', 'application/octet-stream');
    res.send(buf);
  }
}
const api = new ImagesApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/html', cors(checkCorsFn), api.html.bind(api));
router.get('/json', cors(checkCorsFn), api.json.bind(api));
router.get('/xml', cors(checkCorsFn), api.xml.bind(api));
router.get('/bytes/:size', cors(checkCorsFn), api.bytes.bind(api));
