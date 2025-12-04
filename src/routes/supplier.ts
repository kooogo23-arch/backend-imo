import express from 'express';
import { getSupplierStats, updateProductStock, deleteSupplierProduct } from '../controllers/supplierController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/stats', auth, getSupplierStats);
router.patch('/products/:productId/stock', auth, updateProductStock);
router.delete('/products/:productId', auth, deleteSupplierProduct);

export default router;