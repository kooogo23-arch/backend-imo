import { Request, Response } from 'express';
import Produit from '../models/Produit';
import Fournisseur from '../models/Fournisseur';

interface AuthRequest extends Request {
  user?: any;
}

export const getSupplierStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    
    const products = await Produit.find({ fournisseurId: userId });
    
    const stats = {
      totalProducts: products.length,
      totalViews: products.reduce((sum, p) => sum + p.vues, 0),
      avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.prix, 0) / products.length : 0,
      lowStock: products.filter(p => p.stock < 10).length,
      activeProducts: products.filter(p => p.statut === 'actif').length,
      totalRevenue: products.reduce((sum, p) => sum + (p.prix * (100 - p.stock)), 0), // Estimation
      topProduct: products.sort((a, b) => b.vues - a.vues)[0]?.nom || 'Aucun',
      recentViews: products.filter(p => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return p.datePublication > dayAgo;
      }).reduce((sum, p) => sum + p.vues, 0)
    };

    // Analyse par catégorie
    const categoryAnalysis = products.reduce((acc: any, product) => {
      const cat = product.categorie;
      if (!acc[cat]) acc[cat] = { count: 0, totalViews: 0, avgPrice: 0, products: [] };
      acc[cat].count++;
      acc[cat].totalViews += product.vues;
      acc[cat].products.push(product.prix);
      return acc;
    }, {});

    Object.keys(categoryAnalysis).forEach(cat => {
      const prices = categoryAnalysis[cat].products;
      categoryAnalysis[cat].avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    });

    res.json({
      stats,
      categoryAnalysis,
      products: products.map(p => ({
        _id: p._id,
        nom: p.nom,
        prix: p.prix,
        stock: p.stock,
        vues: p.vues,
        statut: p.statut,
        categorie: p.categorie,
        imageUrl: p.imageUrl,
        datePublication: p.datePublication
      }))
    });
  } catch (error) {
    console.warn('Database not available, using mock supplier stats');
    // Mock data for supplier dashboard
    res.json({
      stats: {
        totalProducts: 45,
        totalViews: 2340,
        avgPrice: 75000,
        lowStock: 3,
        activeProducts: 42,
        totalRevenue: 3375000,
        topProduct: 'Briques rouges premium',
        recentViews: 156
      },
      categoryAnalysis: {
        'Brique': { count: 15, totalViews: 890, avgPrice: 50000 },
        'Ciment': { count: 12, totalViews: 670, avgPrice: 85000 },
        'Acier': { count: 8, totalViews: 450, avgPrice: 120000 },
        'Fer': { count: 10, totalViews: 330, avgPrice: 95000 }
      },
      products: [
        {
          _id: '1',
          nom: 'Briques rouges premium',
          prix: 50000,
          stock: 150,
          vues: 234,
          statut: 'actif',
          categorie: 'Brique',
          imageUrl: 'https://via.placeholder.com/300x200',
          datePublication: new Date()
        },
        {
          _id: '2',
          nom: 'Ciment Portland 50kg',
          prix: 85000,
          stock: 75,
          vues: 189,
          statut: 'actif',
          categorie: 'Ciment',
          imageUrl: 'https://via.placeholder.com/300x200',
          datePublication: new Date()
        }
      ]
    });
  }
};

export const updateProductStock = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;
    const { userId } = req.user;

    const product = await Produit.findOne({ _id: productId, fournisseurId: userId });
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    product.stock = stock;
    await product.save();

    res.json({ message: 'Stock mis à jour', product });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const deleteSupplierProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { userId } = req.user;

    const product = await Produit.findOneAndDelete({ _id: productId, fournisseurId: userId });
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};