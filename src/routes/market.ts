import express from 'express';
import { getMarketAnalysis, getSupplierLocations, getMarketStats } from '../controllers/marketController';

const router = express.Router();

router.get('/analysis', getMarketAnalysis);
router.get('/suppliers/locations', getSupplierLocations);
router.get('/stats', getMarketStats);

export default router;