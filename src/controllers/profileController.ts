import { Request, Response } from 'express';
import User from '../models/User';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const user = await User.findById(userId).select('-motDePasse');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        adresse: user.adresse,
        roles: user.roles,
        dateInscription: user.dateInscription
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { nom, telephone, adresse } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { nom, telephone, adresse },
      { new: true }
    ).select('-motDePasse');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};