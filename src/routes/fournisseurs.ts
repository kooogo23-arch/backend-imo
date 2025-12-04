import express from 'express';
import { getMyProducts, getFournisseur, updateProduct, deleteProduct } from '../controllers/fournisseurController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/my-products', auth, getMyProducts);
router.get('/:id', getFournisseur);
router.put('/products/:id', auth, updateProduct);
router.delete('/products/:id', auth, deleteProduct);

export default router;