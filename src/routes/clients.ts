import express from 'express';
import { getClient } from '../controllers/clientController';

const router = express.Router();

router.get('/:id', getClient);

export default router;