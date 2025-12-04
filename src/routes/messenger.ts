import express from 'express';
import { 
  getOrCreateConversation,
  sendProductMessage,
  sendMessage,
  getMessages,
  getConversations,
  toggleBlockConversation,
  addReaction
} from '../controllers/messengerController';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Conversations
router.get('/conversations', auth, getConversations);
router.post('/conversations', auth, getOrCreateConversation);
router.patch('/conversations/:conversationId/block', auth, toggleBlockConversation);

// Messages
router.get('/conversations/:conversationId/messages', auth, getMessages);
router.post('/send', auth, sendMessage);
router.post('/product-message', auth, sendProductMessage);

// Attachments
router.post('/send-with-files', auth, upload.array('files', 5), sendMessage);

// Reactions
router.post('/messages/:messageId/reaction', auth, addReaction);

export default router;