import { Request, Response } from 'express';
import Produit from '../models/Produit';

interface AuthRequest extends Request {
  userId?: string;
}

export const updateStock = async (req: AuthRequest, res: Response) => {
  try {
    const { stock } = req.body;
    const produit = await Produit.findOneAndUpdate(
      { _id: req.params.id, fournisseurId: req.userId },
      { stock },
      { new: true }
    );
    
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(produit);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};