import { Request, Response } from 'express';
import Produit from '../models/Produit';
import Fournisseur from '../models/Fournisseur';
import Client from '../models/Client';

interface AuthRequest extends Request {
  user?: any;
}

export const getRealTimeProductAnalysis = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await Produit.findById(productId).populate('fournisseurId');
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Analyse concurrentielle en temps réel
    const competitors = await Produit.find({
      categorie: product.categorie,
      _id: { $ne: productId },
      statut: 'actif'
    }).sort({ vues: -1 }).limit(5);

    const categoryProducts = await Produit.find({ 
      categorie: product.categorie,
      statut: 'actif' 
    });

    // Statistiques temps réel
    const realTimeStats = {
      // Position concurrentielle
      marketPosition: {
        rank: categoryProducts.sort((a, b) => b.vues - a.vues).findIndex(p => p._id.toString() === productId) + 1,
        totalInCategory: categoryProducts.length,
        percentile: Math.round((1 - (categoryProducts.sort((a, b) => b.vues - a.vues).findIndex(p => p._id.toString() === productId) / categoryProducts.length)) * 100)
      },

      // Analyse des prix
      priceAnalysis: {
        currentPrice: product.prix,
        categoryAvg: categoryProducts.reduce((sum, p) => sum + p.prix, 0) / categoryProducts.length,
        categoryMin: Math.min(...categoryProducts.map(p => p.prix)),
        categoryMax: Math.max(...categoryProducts.map(p => p.prix)),
        priceAdvantage: product.prix < (categoryProducts.reduce((sum, p) => sum + p.prix, 0) / categoryProducts.length) ? 'competitive' : 'premium'
      },

      // Tendances de vues (simulation temps réel)
      viewTrends: {
        last24h: Math.floor(product.vues * 0.1),
        last7days: Math.floor(product.vues * 0.3),
        growthRate: Math.random() * 20 - 10, // -10% à +10%
        peakHours: ['14:00-16:00', '20:00-22:00']
      },

      // Analyse de la demande
      demandAnalysis: {
        stockLevel: product.stock,
        demandIntensity: product.vues > 100 ? 'high' : product.vues > 50 ? 'medium' : 'low',
        stockAlert: product.stock < 10 ? 'low' : product.stock < 50 ? 'medium' : 'good',
        estimatedDaysLeft: Math.floor(product.stock / (product.vues * 0.01 + 1))
      },

      // Performance fournisseur
      supplierPerformance: {
        totalProducts: await Produit.countDocuments({ fournisseurId: product.fournisseurId }),
        avgRating: 4.2 + Math.random() * 0.6, // Simulation
        responseTime: '2h',
        reliability: 95 + Math.floor(Math.random() * 5)
      }
    };

    res.json({
      product: {
        _id: product._id,
        nom: product.nom,
        prix: product.prix,
        categorie: product.categorie,
        vues: product.vues,
        stock: product.stock
      },
      competitors: competitors.map(c => ({
        _id: c._id,
        nom: c.nom,
        prix: c.prix,
        vues: c.vues,
        stock: c.stock
      })),
      realTimeStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const updateProductView = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await Produit.findByIdAndUpdate(
      productId,
      { $inc: { vues: 1 } },
      { new: true }
    );
    
    res.json({ vues: product?.vues });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};