import { Router, Request, Response } from 'express';
import cors from 'cors';
import { createReadStream } from 'fs';
import { pipeline } from 'stream';
import zlib from 'zlib';
import { BaseApi } from './BaseApi.js';
import { OutgoingMessage } from 'http';

const router = Router();
export default router;

// router.use(shrinkRay());

class CompressApiRoute extends BaseApi {
  async brotli(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('json.json');
    const onError = (err: any | null): void => {
      if (err) {
        // If an error occurs, there's not much we can do because
        // the server has already sent the 200 response code and
        // some amount of data has already been sent to the client.
        // The best we can do is terminate the response immediately
        // and log the error.
        res.end();
        console.error('An error occurred:', err);
      }
    };
    res.writeHead(200, { 'Content-Encoding': 'br', 'content-type': 'application/json' });
    pipeline(createReadStream(resource), zlib.createBrotliCompress(), res as OutgoingMessage, onError);
  }

  async deflate(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('json.json');
    // const buff = await readFile(resource);
    // res.setHeader('content-type', 'application/json');
    // res.send(buff);
    const onError = (err: any | null): void => {
      if (err) {
        res.end();
        console.error('An error occurred:', err);
      }
    };
    res.writeHead(200, { 'Content-Encoding': 'deflate', 'content-type': 'application/json' });
    pipeline(createReadStream(resource), zlib.createDeflate(), res as OutgoingMessage, onError);
  }

  async gzip(req: Request, res: Response): Promise<void> {
    const resource = this.getResourcePath('json.json');
    // const buff = await readFile(resource);
    // res.setHeader('content-type', 'application/json');
    // res.send(buff);

    const onError = (err: any | null): void => {
      if (err) {
        res.end();
        console.error('An error occurred:', err);
      }
    };
    res.writeHead(200, { 'Content-Encoding': 'gzip', 'content-type': 'application/json' });
    pipeline(createReadStream(resource), zlib.createGzip(), res as OutgoingMessage, onError);
  }
}
const api = new CompressApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/brotli', cors(checkCorsFn), api.brotli.bind(api));
router.get('/deflate', cors(checkCorsFn), api.deflate.bind(api));
router.get('/gzip', cors(checkCorsFn), api.gzip.bind(api));
