import express from 'express';
import { getDashboardData, getRecommendations, getMarketStats, getRecentActivity } from '../controllers/dashboardController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/data', auth, getDashboardData);
router.get('/recommendations', auth, getRecommendations);
router.get('/market-stats', getMarketStats);
router.get('/activity', auth, getRecentActivity);

export default router;