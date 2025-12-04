import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  nom: string;
  email: string;
  motDePasse: string;
  telephone: string;
  adresse: string;
  photoProfile?: string;
  userType: 'client';
  dateInscription: Date;
}

const ClientSchema: Schema = new Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  telephone: { type: String, required: true },
  adresse: { type: String, required: true },
  photoProfile: { type: String },
  userType: { type: String, default: 'client' },
  dateInscription: { type: Date, default: Date.now }
});

export default mongoose.model<IClient>('Client', ClientSchema);