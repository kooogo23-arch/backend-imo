import express from 'express';
import { getConversations, getConversationMessages, sendMessage } from '../controllers/conversationController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getConversations);
router.get('/:contactId/messages', auth, getConversationMessages);
router.post('/send', auth, sendMessage);

export default router;