import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import { BaseApi } from './BaseApi';

const router = express.Router();
export default router;

class ImagesApiRoute extends BaseApi {
  async jpeg(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('jpeg.jpg');
    const buff = await fs.readFile(resource);
    res.setHeader('content-type', 'image/jpeg');
    res.send(buff);
  }

  async png(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('png.png');
    const buff = await fs.readFile(resource);
    res.setHeader('content-type', 'image/png');
    res.send(buff);
  }

  async svg(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('svg.svg');
    const buff = await fs.readFile(resource);
    res.setHeader('content-type', 'image/svg+xml');
    res.send(buff);
  }

  async webp(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('webp.webp');
    const buff = await fs.readFile(resource);
    res.setHeader('content-type', 'image/webp');
    res.send(buff);
  }
}
const api = new ImagesApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/jpeg', cors(checkCorsFn), api.jpeg.bind(api));
router.get('/png', cors(checkCorsFn), api.png.bind(api));
router.get('/svg', cors(checkCorsFn), api.svg.bind(api));
router.get('/webp', cors(checkCorsFn), api.webp.bind(api));
