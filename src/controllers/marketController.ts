import { Request, Response } from 'express';
import Produit from '../models/Produit';
import Fournisseur from '../models/Fournisseur';

export const getMarketAnalysis = async (req: Request, res: Response) => {
  try {
    const produits = await Produit.find({ statut: 'actif' }).populate('fournisseurId');
    
    // Analyse des prix par catégorie
    const priceAnalysis = produits.reduce((acc: any, produit) => {
      const cat = produit.categorie;
      if (!acc[cat]) acc[cat] = { prices: [], count: 0 };
      acc[cat].prices.push(produit.prix);
      acc[cat].count++;
      return acc;
    }, {});

    Object.keys(priceAnalysis).forEach(cat => {
      const prices = priceAnalysis[cat].prices;
      priceAnalysis[cat].avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      priceAnalysis[cat].minPrice = Math.min(...prices);
      priceAnalysis[cat].maxPrice = Math.max(...prices);
    });

    // Top fournisseurs
    const supplierStats = produits.reduce((acc: any, produit) => {
      const supplierId = produit.fournisseurId._id.toString();
      if (!acc[supplierId]) {
        acc[supplierId] = {
          name: (produit.fournisseurId as any).nom,
          products: 0,
          totalViews: 0,
          avgRating: 0
        };
      }
      acc[supplierId].products++;
      acc[supplierId].totalViews += produit.vues;
      return acc;
    }, {});

    const topSuppliers = Object.values(supplierStats)
      .sort((a: any, b: any) => b.totalViews - a.totalViews)
      .slice(0, 5);

    res.json({
      priceAnalysis,
      topSuppliers,
      totalProducts: produits.length,
      categories: Object.keys(priceAnalysis).length
    });
  } catch (error) {
    console.warn('Database not available, using mock market analysis');
    res.json({
      priceAnalysis: {
        'Brique': { avgPrice: 52000, minPrice: 45000, maxPrice: 60000, count: 234 },
        'Ciment': { avgPrice: 78000, minPrice: 70000, maxPrice: 85000, count: 156 },
        'Acier': { avgPrice: 125000, minPrice: 110000, maxPrice: 140000, count: 89 },
        'Fer': { avgPrice: 95000, minPrice: 85000, maxPrice: 105000, count: 123 }
      },
      topSuppliers: [
        { name: 'Matériaux SA', products: 45, totalViews: 2340 },
        { name: 'Construction Plus', products: 38, totalViews: 1890 },
        { name: 'BTP Guinée', products: 32, totalViews: 1567 }
      ],
      totalProducts: 1234,
      categories: 8
    });
  }
};

export const getMarketStats = async (req: Request, res: Response) => {
  try {
    const totalProducts = await Produit.countDocuments({ statut: 'actif' });
    const totalSuppliers = await Fournisseur.countDocuments();
    const totalViews = await Produit.aggregate([
      { $group: { _id: null, total: { $sum: '$vues' } } }
    ]);
    
    const categories = await Produit.distinct('categorie');
    
    res.json({
      totalProducts,
      totalSuppliers,
      totalViews: totalViews[0]?.total || 0,
      totalCategories: categories.length
    });
  } catch (error) {
    console.warn('Database not available, using mock market stats');
    res.json({
      totalProducts: 1234,
      totalSuppliers: 567,
      totalViews: 12500,
      totalCategories: 8
    });
  }
};

export const getSupplierLocations = async (req: Request, res: Response) => {
  try {
    const fournisseurs = await Fournisseur.find();
    const locations = fournisseurs.map(f => ({
      id: f._id,
      nom: f.nom,
      adresse: f.adresse,
      // Coordonnées simulées basées sur les villes
      lat: getLatFromCity(f.adresse),
      lng: getLngFromCity(f.adresse)
    }));
    
    res.json(locations);
  } catch (error) {
    console.warn('Database not available, using mock supplier locations');
    res.json([
      { id: '1', nom: 'Matériaux Conakry', adresse: 'Conakry', lat: 9.6412, lng: -13.5784 },
      { id: '2', nom: 'BTP Kankan', adresse: 'Kankan', lat: 10.3853, lng: -9.3064 },
      { id: '3', nom: 'Construction Labé', adresse: 'Labé', lat: 11.3180, lng: -12.2830 }
    ]);
  }
};

const getLatFromCity = (adresse: string): number => {
  if (adresse.includes('Paris')) return 48.8566;
  if (adresse.includes('Lyon')) return 45.7640;
  if (adresse.includes('Marseille')) return 43.2965;
  return 46.2276; // Centre France
};

const getLngFromCity = (adresse: string): number => {
  if (adresse.includes('Paris')) return 2.3522;
  if (adresse.includes('Lyon')) return 4.8357;
  if (adresse.includes('Marseille')) return 5.3698;
  return 2.2137; // Centre France
};