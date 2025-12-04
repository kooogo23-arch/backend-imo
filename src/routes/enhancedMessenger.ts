import express from 'express';
import { 
  createProductConversation,
  getEnhancedConversations,
  getEnhancedMessages,
  sendEnhancedMessage,
  searchConversations,
  markConversationAsRead,
  deleteMessage,
  editMessage
} from '../controllers/enhancedMessengerController';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Conversations
router.get('/conversations', auth, getEnhancedConversations);
router.get('/conversations/search', auth, searchConversations);
router.post('/product-conversation', auth, createProductConversation);
router.patch('/conversations/:conversationId/read', auth, markConversationAsRead);

// Messages
router.get('/conversations/:conversationId/messages', auth, getEnhancedMessages);
router.post('/send', auth, sendEnhancedMessage);
router.post('/send-with-files', auth, upload.array('files', 5), sendEnhancedMessage);

// Message actions
router.patch('/messages/:messageId/edit', auth, editMessage);
router.delete('/messages/:messageId', auth, deleteMessage);

export default router;