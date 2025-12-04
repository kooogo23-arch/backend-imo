import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  expediteurId: mongoose.Types.ObjectId;
  destinataireId: mongoose.Types.ObjectId;
  expediteurType: 'Fournisseur' | 'Client';
  destinataireType: 'Fournisseur' | 'Client';
  contenu: string;
  dateEnvoi: Date;
  lu: boolean;
}

const MessageSchema: Schema = new Schema({
  expediteurId: { type: Schema.Types.ObjectId, required: true, refPath: 'expediteurType' },
  destinataireId: { type: Schema.Types.ObjectId, required: true, refPath: 'destinataireType' },
  expediteurType: { type: String, required: true, enum: ['Fournisseur', 'Client'] },
  destinataireType: { type: String, required: true, enum: ['Fournisseur', 'Client'] },
  contenu: { type: String, required: true },
  dateEnvoi: { type: Date, default: Date.now },
  lu: { type: Boolean, default: false }
});

export default mongoose.model<IMessage>('Message', MessageSchema);