import mongoose, { Schema, Document } from 'mongoose';

export interface IFournisseur extends Document {
  nom: string;
  email: string;
  motDePasse: string;
  telephone: string;
  adresse: string;
  logo?: string;
  photoProfile?: string;
  userType: 'fournisseur';
  dateInscription: Date;
}

const FournisseurSchema: Schema = new Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  telephone: { type: String, required: true },
  adresse: { type: String, required: true },
  logo: { type: String },
  photoProfile: { type: String },
  userType: { type: String, default: 'fournisseur' },
  dateInscription: { type: Date, default: Date.now }
});

export default mongoose.model<IFournisseur>('Fournisseur', FournisseurSchema);