import express from 'express';
import { getRealTimeProductAnalysis, updateProductView } from '../controllers/realTimeAnalyticsController';

const router = express.Router();

router.get('/product/:productId', getRealTimeProductAnalysis);
router.patch('/product/:productId/view', updateProductView);

export default router;