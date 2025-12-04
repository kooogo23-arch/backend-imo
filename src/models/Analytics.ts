import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  userId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  action: string;
  filters?: any;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  duration?: number;
  metadata?: any;
}

const AnalyticsSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Fournisseur' },
  productId: { type: Schema.Types.ObjectId, ref: 'Produit' },
  action: { type: String, required: true },
  filters: { type: Schema.Types.Mixed },
  sessionId: { type: String },
  userAgent: { type: String },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now },
  duration: { type: Number },
  metadata: { type: Schema.Types.Mixed }
});

export default mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);