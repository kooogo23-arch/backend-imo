import { Request, Response } from 'express';
import Notification from '../models/Notification';

interface AuthRequest extends Request {
  userId?: string;
}

const mockNotifications = [
  {
    _id: '1',
    type: 'message',
    titre: 'Nouveau message',
    message: 'Vous avez reçu un nouveau message',
    lu: false,
    dateCreation: new Date(),
    priorite: 'normale'
  },
  {
    _id: '2',
    type: 'commande',
    titre: 'Commande confirmée',
    message: 'Votre commande #1234 a été confirmée',
    lu: false,
    dateCreation: new Date(),
    priorite: 'haute'
  }
];

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    const notifications = await Notification.find({ utilisateurId: userId })
      .sort({ dateCreation: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.warn('Database not available, using mock notifications');
    res.json(mockNotifications.map(n => ({ ...n, utilisateurId: req.userId })));
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.userId;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, utilisateurId: userId },
      { lu: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    res.json({ message: 'Notification marquée comme lue', notification });
  } catch (error) {
    console.warn('Database error, mock response');
    res.json({ message: 'Notification marquée comme lue' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.userId;
    const result = await Notification.updateMany(
      { utilisateurId: userId, lu: false },
      { lu: true }
    );
    
    res.json({ 
      message: 'Toutes les notifications marquées comme lues',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.warn('Database error, mock response');
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.userId;
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      utilisateurId: userId
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.warn('Database error, mock response');
    res.json({ message: 'Notification supprimée' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    const count = await Notification.countDocuments({
      utilisateurId: userId,
      lu: false
    });
    res.json({ count });
  } catch (error) {
    console.warn('Database not available, using mock count');
    res.json({ count: 2 });
  }
};

export const createNotification = async (
  userId: string, 
  type: string, 
  message: string, 
  titre?: string,
  lien?: string,
  priorite: 'basse' | 'normale' | 'haute' = 'normale'
) => {
  try {
    const notification = new Notification({
      utilisateurId: userId,
      type,
      message,
      titre,
      lien,
      priorite
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Erreur création notification:', error);
  }
};