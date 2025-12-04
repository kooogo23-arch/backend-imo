import { Request, Response } from 'express';
import Message from '../models/Message';
import Notification from '../models/Notification';

interface AuthRequest extends Request {
  userId?: string;
}

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { destinataireId, contenu } = req.body;
    
    const message = new Message({
      expediteurId: req.userId,
      destinataireId,
      contenu
    });
    
    await message.save();
    
    // Créer notification
    const notification = new Notification({
      utilisateurId: destinataireId,
      type: 'message',
      message: `Nouveau message reçu`
    });
    
    await notification.save();
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const messages = await Message.find({
      $or: [
        { expediteurId: req.userId },
        { destinataireId: req.userId }
      ]
    }).populate('expediteurId', 'nom email')
      .populate('destinataireId', 'nom email');
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { lu: true });
    res.json({ message: 'Message marqué comme lu' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};