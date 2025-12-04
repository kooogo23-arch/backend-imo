import { Request, Response } from 'express';
import Produit from '../models/Produit';
import Fournisseur from '../models/Fournisseur';

interface AuthRequest extends Request {
  userId?: string;
}

export const addProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { nom, description, prix, ville, categorie, imageUrl, images, videos, stock } = req.body;
    
    const produit = new Produit({
      nom,
      description,
      prix,
      ville,
      categorie,
      fournisseurId: req.userId,
      imageUrl,
      images: images || [],
      videos: videos || [],
      stock,
      statut: 'actif'
    });
    
    await produit.save();
    res.status(201).json(produit);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const produit = await Produit.findOneAndUpdate(
      { _id: id, fournisseurId: req.userId },
      updateData,
      { new: true }
    );
    
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé ou non autorisé' });
    }
    
    res.json(produit);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const produit = await Produit.findOneAndDelete({
      _id: id,
      fournisseurId: req.userId
    });
    
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé ou non autorisé' });
    }
    
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getMyProducts = async (req: AuthRequest, res: Response) => {
  try {
    const produits = await Produit.find({ fournisseurId: req.userId })
      .sort({ datePublication: -1 });
    res.json(produits);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getFournisseur = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: 'ID fournisseur invalide' });
    }
    
    // Vérifier si l'ID est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Format ID invalide' });
    }
    
    const fournisseur = await Fournisseur.findById(id);
    if (!fournisseur) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }
    res.json(fournisseur);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};