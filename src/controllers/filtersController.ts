import { Request, Response } from 'express';
import Produit from '../models/Produit';

export const getFilterOptions = async (req: Request, res: Response) => {
  try {
    const [villes, categories, prixRange] = await Promise.all([
      Produit.distinct('ville', { statut: 'actif' }),
      Produit.distinct('categorie', { statut: 'actif' }),
      Produit.aggregate([
        { $match: { statut: 'actif' } },
        { $group: { _id: null, min: { $min: '$prix' }, max: { $max: '$prix' } } }
      ])
    ]);

    res.json({
      villes: villes.sort(),
      categories: categories.sort(),
      prixMin: prixRange[0]?.min || 0,
      prixMax: prixRange[0]?.max || 1000
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};