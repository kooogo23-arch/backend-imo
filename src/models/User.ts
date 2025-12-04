import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  nom: string;
  email: string;
  motDePasse: string;
  telephone?: string;
  adresse?: string;
  roles: ('client' | 'fournisseur')[];
  dateInscription: Date;
}

const userSchema = new Schema<IUser>({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  telephone: { type: String },
  adresse: { type: String },
  roles: [{ type: String, enum: ['client', 'fournisseur'], default: ['client'] }],
  dateInscription: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', userSchema);