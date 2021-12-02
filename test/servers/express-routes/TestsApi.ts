import express, { Request, Response } from 'express';
import cors from 'cors';
import { BaseApi } from './BaseApi';

const router = express.Router();
export default router;

interface TestItem {
  id: number;
}

/**
 * Some tests API route
 */
class TestApiRoute extends BaseApi {
  items: TestItem[] = [];

  /**
   * Inserts a new test
   */
  async createTest(req: Request, res: Response): Promise<void> {
    const { body } = req;
    await this.aTimeout(10);
    this.items.push({
      id: this.items.length,
    });
    res.send({ body });
  }

  /**
   * List tests
   */
  async listTest(req: Request, res: Response): Promise<void> {
    const { delay } = req.query;
    let delayTyped = Number(delay);
    if (Number.isNaN(delayTyped)) {
      delayTyped = 10;
    }
    await this.aTimeout(delayTyped);
    res.send({ body: this.items });
  }
}
const api = new TestApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.post('/', cors(checkCorsFn), api.createTest.bind(api));
router.get('/', cors(checkCorsFn), api.listTest.bind(api));
