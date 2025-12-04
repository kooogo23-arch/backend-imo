import { Request, Response } from 'express';
import Produit from '../models/Produit';

// Mock data for development
const mockProduits = [
  {
    _id: '1',
    nom: 'Briques rouges premium',
    description: 'Briques de haute qualité pour construction',
    prix: 50000,
    ville: 'Conakry',
    imageUrl: 'https://via.placeholder.com/300x200/dc2626/ffffff?text=Briques',
    vues: 125,
    notes: [4, 5, 4],
    categorie: 'Brique',
    statut: 'actif',
    datePublication: new Date(),
    fournisseurId: { nom: 'Fournisseur Test', telephone: '+224 123 456 789' }
  },
  {
    _id: '2', 
    nom: 'Ciment Portland',
    description: 'Ciment de qualité supérieure',
    prix: 75000,
    ville: 'Kankan',
    imageUrl: 'https://via.placeholder.com/300x200/059669/ffffff?text=Ciment',
    vues: 89,
    notes: [5, 4, 5],
    categorie: 'Ciment',
    statut: 'actif',
    datePublication: new Date(),
    fournisseurId: { nom: 'Ciment SA', telephone: '+224 987 654 321' }
  }
];

export const getProduits = async (req: Request, res: Response) => {
  try {
    const produits = await Produit.find({ statut: 'actif' })
      .populate('fournisseurId', 'nom telephone')
      .sort({ datePublication: -1 });
    res.json(produits);
  } catch (error) {
    console.warn('Database not available, using mock data');
    res.json(mockProduits);
  }
};

export const getProduit = async (req: Request, res: Response) => {
  try {
    const produit = await Produit.findById(req.params.id)
      .populate('fournisseurId', 'nom telephone adresse');
    
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(produit);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const searchProduits = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const searchRegex = new RegExp(q as string, 'i');
    
    const produits = await Produit.find({
      statut: 'actif',
      $or: [
        { nom: searchRegex },
        { description: searchRegex },
        { ville: searchRegex }
      ]
    }).populate('fournisseurId', 'nom telephone');
    
    res.json(produits);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const incrementVues = async (req: Request, res: Response) => {
  try {
    const produit = await Produit.findByIdAndUpdate(
      req.params.id,
      { $inc: { vues: 1 } },
      { new: true }
    );
    
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json({ vues: produit.vues });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const produits = await Produit.find({ 
      categorie: category, 
      statut: 'actif' 
    })
      .populate('fournisseurId', 'nom telephone')
      .sort({ datePublication: -1 });
    
    res.json(produits);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};