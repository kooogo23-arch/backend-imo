import express from 'express';
import { getProduits, getProduit, searchProduits, incrementVues, getProductsByCategory } from '../controllers/produitController';
import { addProduct } from '../controllers/fournisseurController';
import { updateStock } from '../controllers/stockController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', getProduits);
router.get('/search', searchProduits);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProduit);
router.patch('/:id/vues', incrementVues);
router.post('/', auth, addProduct);

router.patch('/:id/stock', auth, updateStock);

export default router;