import mongoose, { Schema, Document } from 'mongoose';

export interface IAbonnement extends Document {
  utilisateurId: mongoose.Types.ObjectId;
  typeAbonnement: 'basique' | 'premium';
  dateDebut: Date;
  dateFin: Date;
  statut: 'actif' | 'expire';
}

const AbonnementSchema: Schema = new Schema({
  utilisateurId: { type: Schema.Types.ObjectId, ref: 'Fournisseur', required: true },
  typeAbonnement: { type: String, enum: ['basique', 'premium'], required: true },
  dateDebut: { type: Date, default: Date.now },
  dateFin: { type: Date, required: true },
  statut: { type: String, enum: ['actif', 'expire'], default: 'actif' }
});

export default mongoose.model<IAbonnement>('Abonnement', AbonnementSchema);