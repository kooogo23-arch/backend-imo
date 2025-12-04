import mongoose, { Schema, Document } from 'mongoose';

export interface IEnhancedMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: 'Client' | 'Fournisseur';
  type: 'text' | 'image' | 'file' | 'product' | 'system';
  content: string;
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: number;
  }[];
  productData?: {
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    image: string;
  };
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  reactions?: {
    userId: mongoose.Types.ObjectId;
    emoji: string;
  }[];
  replyTo?: mongoose.Types.ObjectId;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EnhancedMessageSchema: Schema = new Schema({
  conversationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true 
  },
  senderId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    refPath: 'senderType'
  },
  senderType: { 
    type: String, 
    enum: ['Client', 'Fournisseur'], 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['text', 'image', 'file', 'product', 'system'], 
    default: 'text' 
  },
  content: { 
    type: String, 
    required: true 
  },
  attachments: [{
    type: { type: String, enum: ['image', 'file'] },
    url: String,
    name: String,
    size: Number
  }],
  productData: {
    productId: { type: Schema.Types.ObjectId, ref: 'Produit' },
    name: String,
    price: Number,
    image: String
  },
  readBy: [{
    userId: Schema.Types.ObjectId,
    readAt: { type: Date, default: Date.now }
  }],
  reactions: [{
    userId: Schema.Types.ObjectId,
    emoji: String
  }],
  replyTo: { 
    type: Schema.Types.ObjectId, 
    ref: 'EnhancedMessage' 
  },
  isEdited: { 
    type: Boolean, 
    default: false 
  },
  editedAt: Date,
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  deletedAt: Date
}, {
  timestamps: true
});

EnhancedMessageSchema.index({ conversationId: 1, createdAt: -1 });
EnhancedMessageSchema.index({ senderId: 1 });

export default mongoose.model<IEnhancedMessage>('EnhancedMessage', EnhancedMessageSchema);