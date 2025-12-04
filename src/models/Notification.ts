import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  utilisateurId: mongoose.Types.ObjectId;
  type: 'nouveau_produit' | 'message' | 'reponse' | 'commande' | 'stock_bas' | 'prix_modifie';
  message: string;
  titre?: string;
  lien?: string;
  dateCreation: Date;
  lu: boolean;
  priorite: 'basse' | 'normale' | 'haute';
}

const NotificationSchema: Schema = new Schema({
  utilisateurId: { type: Schema.Types.ObjectId, ref: 'Fournisseur', required: true },
  type: { 
    type: String, 
    enum: ['nouveau_produit', 'message', 'reponse', 'commande', 'stock_bas', 'prix_modifie'], 
    required: true 
  },
  message: { type: String, required: true },
  titre: { type: String },
  lien: { type: String },
  dateCreation: { type: Date, default: Date.now },
  lu: { type: Boolean, default: false },
  priorite: { type: String, enum: ['basse', 'normale', 'haute'], default: 'normale' }
});

export default mongoose.model<INotification>('Notification', NotificationSchema);