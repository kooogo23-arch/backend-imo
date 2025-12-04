import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount } from '../controllers/notificationController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.patch('/:id/read', auth, markAsRead);
router.patch('/mark-all-read', auth, markAllAsRead);
router.delete('/:id', auth, deleteNotification);

export default router;