import { Request, Response } from 'express';
import Produit from '../models/Produit';
import Fournisseur from '../models/Fournisseur';
import Message from '../models/Message';

interface AuthRequest extends Request {
  userId?: string;
}

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    // Get user favorites, orders, etc.
    const favoriteCount = 12; // Mock data - implement favorites model
    const orderCount = 3; // Mock data - implement orders model
    
    // Get recent searches from user activity
    const recentSearches = ['Ciment Portland', 'Brique rouge', 'Acier inox'];
    
    res.json({
      navigation: {
        favorites: favoriteCount,
        orders: orderCount
      },
      recentSearches,
      alerts: [
        { type: 'price', message: 'Prix en hausse', detail: 'Ciment +5% cette semaine', color: 'yellow' },
        { type: 'supplier', message: 'Nouveau fournisseur', detail: '3 nouveaux à Paris', color: 'green' }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    // Get recommended products based on user activity
    const recommendations = await Produit.find({ statut: 'actif' })
      .sort({ vues: -1 })
      .limit(3)
      .select('nom prix imageUrl');
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getMarketStats = async (req: Request, res: Response) => {
  try {
    const totalProducts = await Produit.countDocuments({ statut: 'actif' });
    const activeSuppliers = await Fournisseur.countDocuments();
    const avgPrice = await Produit.aggregate([
      { $match: { statut: 'actif', categorie: 'ciment' } },
      { $group: { _id: null, avgPrice: { $avg: '$prix' } } }
    ]);
    
    const newProductsThisWeek = await Produit.countDocuments({
      datePublication: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      stats: [
        { label: 'Prix moyen ciment', value: `${Math.round(avgPrice[0]?.avgPrice || 52)}€`, trend: '+3%' },
        { label: 'Nouveaux produits', value: newProductsThisWeek.toString(), trend: '+12%' },
        { label: 'Fournisseurs actifs', value: activeSuppliers.toString(), trend: '+5%' }
      ],
      topSuppliers: await Fournisseur.find()
        .limit(3)
        .select('nom')
        .then(suppliers => suppliers.map(s => ({
          name: s.nom,
          rating: (4.5 + Math.random() * 0.5).toFixed(1),
          orders: Math.floor(100 + Math.random() * 100)
        })))
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    // Mock recent activity - implement activity tracking model
    const activities = [
      { action: 'Vu', product: 'Ciment Portland', time: '2h' },
      { action: 'Ajouté', product: 'Brique creuse', time: '4h' },
      { action: 'Contacté', product: 'Fournisseur BâtiPro', time: '1j' }
    ];
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};