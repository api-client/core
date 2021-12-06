import { Router } from 'express';
import testsRoute from './TestsApi.js';
import queryPramsRoute from './QueryParamsApi.js';
import headersRoute from './HeadersApi.js';
import getRoute from './GetApi.js';
import postRoute from './PostApi.js';
import redirectRoute from './RedirectsApi.js';
import imageRoute from './ImagesApi.js';
import responsesRoute from './ResponsesApi.js';
import compressionRoute from './CompressApi.js';
import delayRoute from './DelayRoute.js';

const router = Router();
export default router;

router.use('/tests', testsRoute);
router.use('/query-params', queryPramsRoute);
router.use('/headers', headersRoute);
router.use('/get', getRoute);
router.use('/post', postRoute);
router.use('/redirect', redirectRoute);
router.use('/image', imageRoute);
router.use('/response', responsesRoute);
router.use('/compression', compressionRoute);
router.use('/delay', delayRoute);
