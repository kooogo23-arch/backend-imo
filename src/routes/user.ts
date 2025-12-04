import express from 'express';
import { switchRole } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/switch-role', authenticateToken, switchRole);

export default router;