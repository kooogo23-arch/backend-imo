import { Request, Response } from 'express';
import User from '../models/User';

export const switchRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const userId = (req as any).user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    if (!user.roles.includes(role)) {
      user.roles.push(role);
      await user.save();
    }
    
    res.json({ 
      message: 'Rôle ajouté avec succès',
      roles: user.roles 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};