import { Request, Response } from 'express';
import Analytics from '../models/Analytics';

interface AuthRequest extends Request {
  userId?: string;
}

export const logAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { action, productId, filters, duration, metadata } = req.body;
    
    const analytics = new Analytics({
      userId: req.userId,
      productId,
      action,
      filters,
      userAgent: req.get('User-Agent'),
      duration,
      metadata
    });
    
    await analytics.save();
    res.status(201).json({ message: 'Analytics enregistrées' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getNewProducts = async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const produits = await require('../models/Produit').default.find({
      datePublication: { $gte: sevenDaysAgo },
      statut: 'actif'
    })
      .populate('fournisseurId', 'nom telephone')
      .sort({ datePublication: -1 })
      .limit(20);
    
    res.json(produits);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};