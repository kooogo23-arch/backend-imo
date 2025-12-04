import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  participantTypes: ('Client' | 'Fournisseur')[];
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  isBlocked: boolean;
  blockedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema({
  participants: [{ 
    type: Schema.Types.ObjectId, 
    required: true,
    refPath: 'participantTypes'
  }],
  participantTypes: [{
    type: String,
    enum: ['Client', 'Fournisseur'],
    required: true
  }],
  lastMessage: { 
    type: Schema.Types.ObjectId, 
    ref: 'Message' 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now 
  },
  isBlocked: { 
    type: Boolean, 
    default: false 
  },
  blockedBy: { 
    type: Schema.Types.ObjectId 
  }
}, {
  timestamps: true
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivity: -1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);