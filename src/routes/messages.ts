import express from 'express';
import { sendMessage, getMessages, markAsRead } from '../controllers/messageController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/', auth, sendMessage);
router.get('/', auth, getMessages);
router.patch('/:id/read', auth, markAsRead);

export default router;