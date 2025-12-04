import express from 'express';
import { logAnalytics, getNewProducts } from '../controllers/analyticsController';
import { getFilterOptions } from '../controllers/filtersController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/log', logAnalytics);
router.get('/new-products', getNewProducts);
router.get('/filters', getFilterOptions);

export default router;