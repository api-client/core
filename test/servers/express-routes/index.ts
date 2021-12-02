import express from 'express';
import testsRoute from './TestsApi';
import queryPramsRoute from './QueryParamsApi';
import headersRoute from './HeadersApi';
import getRoute from './GetApi';
import postRoute from './PostApi';
import redirectRoute from './RedirectsApi';
import imageRoute from './ImagesApi';
import responsesRoute from './ResponsesApi';
import compressionRoute from './CompressApi';
import delayRoute from './DelayRoute';

const router = express.Router();
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
