import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import EnhancedMessage from '../models/EnhancedMessage';
import Produit from '../models/Produit';
import Fournisseur from '../models/Fournisseur';
import Client from '../models/Client';

interface AuthRequest extends Request {
  userId?: string;
  io?: any;
}

// Créer ou récupérer une conversation
export const getOrCreateConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.userId;

    if (!participantId || !currentUserId) {
      return res.status(400).json({ message: 'Données manquantes' });
    }

    // Vérifier si conversation existe
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantId] }
    }).populate('lastMessage');

    if (!conversation) {
      // Déterminer les types d'utilisateurs
      const currentUser = await Fournisseur.findById(currentUserId) || await Client.findById(currentUserId);
      const participant = await Fournisseur.findById(participantId) || await Client.findById(participantId);
      
      const currentUserType = await Fournisseur.findById(currentUserId) ? 'Fournisseur' : 'Client';
      const participantType = await Fournisseur.findById(participantId) ? 'Fournisseur' : 'Client';

      conversation = new Conversation({
        participants: [currentUserId, participantId],
        participantTypes: [currentUserType, participantType],
        lastActivity: new Date()
      });
      await conversation.save();
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Envoyer un message produit automatique
export const sendProductMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, supplierId } = req.body;
    const clientId = req.userId;

    if (!productId || !supplierId || !clientId) {
      return res.status(400).json({ message: 'Données manquantes' });
    }

    // Récupérer le produit
    const product = await Produit.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Créer ou récupérer la conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [clientId, supplierId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [clientId, supplierId],
        participantTypes: ['Client', 'Fournisseur'],
        lastActivity: new Date()
      });
      await conversation.save();
    }

    // Créer le message produit
    const productMessage = new EnhancedMessage({
      conversationId: conversation._id,
      senderId: clientId,
      senderType: 'Client',
      type: 'product',
      content: `Bonjour, je suis intéressé par votre produit : ${product.nom}`,
      productData: {
        productId: product._id,
        name: product.nom,
        price: product.prix,
        image: product.imageUrl
      }
    });

    await productMessage.save();

    // Mettre à jour la conversation
    conversation.lastMessage = productMessage._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    // Notification temps réel
    if (req.io) {
      req.io.to(supplierId).emit('new_message', {
        conversationId: conversation._id,
        message: productMessage
      });
    }

    res.status(201).json({ conversation, message: productMessage });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Envoyer un message normal
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, content, type = 'text', attachments, replyTo } = req.body;
    const senderId = req.userId;

    if (!conversationId || !content || !senderId) {
      return res.status(400).json({ message: 'Données manquantes' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(senderId as any)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Vérifier si la conversation est bloquée
    if (conversation.isBlocked) {
      return res.status(403).json({ message: 'Conversation bloquée' });
    }

    // Déterminer le type d'utilisateur
    const senderType = await Fournisseur.findById(senderId) ? 'Fournisseur' : 'Client';

    const message = new EnhancedMessage({
      conversationId,
      senderId,
      senderType,
      type,
      content,
      attachments,
      replyTo
    });

    await message.save();

    // Mettre à jour la conversation
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    // Notification temps réel
    const otherParticipants = conversation.participants.filter(p => p.toString() !== senderId);
    if (req.io) {
      otherParticipants.forEach(participantId => {
        req.io.to(participantId.toString()).emit('new_message', {
          conversationId,
          message
        });
      });
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Récupérer les messages d'une conversation
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.userId;

    // Vérifier l'accès à la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId as any)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const messages = await EnhancedMessage.find({ 
      conversationId,
      isDeleted: false 
    })
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * Number(page))
    .skip((Number(page) - 1) * Number(limit));

    // Marquer les messages comme lus
    await EnhancedMessage.updateMany(
      { 
        conversationId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId }
      },
      { 
        $push: { 
          readBy: { 
            userId, 
            readAt: new Date() 
          } 
        } 
      }
    );

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Récupérer les conversations
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const conversations = await Conversation.find({
      participants: userId,
      isBlocked: false
    })
    .populate('lastMessage')
    .populate('participants', 'nom email')
    .sort({ lastActivity: -1 });

    // Formater les conversations
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p._id.toString() !== userId);
      const unreadCount = 0; // À calculer selon les messages non lus
      
      return {
        _id: conv._id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity,
        unreadCount,
        isOnline: false // À implémenter avec Socket.io
      };
    });

    res.json(formattedConversations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Bloquer/débloquer une conversation
export const toggleBlockConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId as any)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    conversation.isBlocked = !conversation.isBlocked;
    conversation.blockedBy = conversation.isBlocked ? userId as any : undefined;
    await conversation.save();

    res.json({ 
      message: conversation.isBlocked ? 'Conversation bloquée' : 'Conversation débloquée',
      isBlocked: conversation.isBlocked 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Ajouter une réaction
export const addReaction = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.userId;

    const message = await EnhancedMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier l'accès
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.includes(userId as any)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Ajouter ou modifier la réaction
    const existingReaction = message.reactions?.find(r => r.userId.toString() === userId);
    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      if (!message.reactions) message.reactions = [];
      message.reactions.push({ userId: userId as any, emoji });
    }

    await message.save();

    // Notification temps réel
    if (req.io) {
      req.io.to(message.conversationId.toString()).emit('message_reaction', {
        messageId,
        userId,
        emoji
      });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};