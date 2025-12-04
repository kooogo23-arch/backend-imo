import mongoose, { Schema, Document } from 'mongoose';

export interface IProduit extends Document {
  nom: string;
  description: string;
  prix: number;
  ville: string;
  categorie: string;
  fournisseurId: mongoose.Types.ObjectId;
  imageUrl: string;
  images: string[];
  videos: string[];
  vues: number;
  datePublication: Date;
  notes: number[];
  stock: number;
  statut: 'actif' | 'inactif';
}

const ProduitSchema: Schema = new Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  prix: { type: Number, required: true },
  ville: { type: String, required: true },
  categorie: { type: String, required: true },
  fournisseurId: { type: Schema.Types.ObjectId, ref: 'Fournisseur', required: true },
  imageUrl: { type: String, required: true },
  images: [{ type: String }],
  videos: [{ type: String }],
  vues: { type: Number, default: 0 },
  datePublication: { type: Date, default: Date.now },
  notes: [{ type: Number, min: 1, max: 5 }],
  stock: { type: Number, default: 0 },
  statut: { type: String, enum: ['actif', 'inactif'], default: 'actif' }
});

export default mongoose.model<IProduit>('Produit', ProduitSchema);