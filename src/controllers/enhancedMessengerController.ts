import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import EnhancedMessage from '../models/EnhancedMessage';
import Produit from '../models/Produit';
import Fournisseur from '../models/Fournisseur';
import Client from '../models/Client';
import { createNotification } from './notificationController';

interface AuthRequest extends Request {
  userId?: string;
  io?: any;
}

// Créer conversation avec message produit automatique
export const createProductConversation = async (req: AuthRequest, res: Response) => {
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

    // Récupérer les utilisateurs
    const client = await Client.findById(clientId);
    const supplier = await Fournisseur.findById(supplierId);
    
    if (!client || !supplier) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si conversation existe
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

    // Créer notification
    await createNotification(
      supplierId,
      'message',
      `${client.nom} s'intéresse à votre produit "${product.nom}"`,
      'Nouveau message produit'
    );

    // Notification temps réel
    if (req.io) {
      req.io.to(supplierId).emit('new_message', {
        conversationId: conversation._id,
        message: productMessage,
        sender: client
      });
    }

    res.status(201).json({
      conversation: {
        _id: conversation._id,
        participant: {
          _id: supplier._id,
          nom: supplier.nom,
          email: supplier.email
        },
        lastMessage: productMessage,
        unreadCount: 0
      },
      message: productMessage
    });
  } catch (error) {
    console.error('Erreur création conversation produit:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Récupérer conversations avec détails complets
export const getEnhancedConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const conversations = await Conversation.find({
      participants: userId,
      isBlocked: false
    })
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    const enhancedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participants.find(p => p.toString() !== userId);
        
        // Récupérer les détails du participant
        let participant = await Fournisseur.findById(otherParticipantId);
        if (!participant) {
          participant = await Client.findById(otherParticipantId);
        }

        // Compter les messages non lus
        const unreadCount = await EnhancedMessage.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: userId },
          'readBy.userId': { $ne: userId }
        });

        return {
          _id: conv._id,
          participant: {
            _id: participant?._id,
            nom: participant?.nom || 'Utilisateur inconnu',
            email: participant?.email,
            telephone: participant?.telephone,
            photoProfile: (participant as any)?.photoProfile
          },
          lastMessage: conv.lastMessage,
          lastActivity: conv.lastActivity,
          unreadCount,
          isOnline: false // À implémenter avec Socket.io
        };
      })
    );

    res.json(enhancedConversations);
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Récupérer messages avec pagination
export const getEnhancedMessages = async (req: AuthRequest, res: Response) => {
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
    .populate('replyTo', 'content senderId')
    .populate('productData.productId', 'nom prix imageUrl')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
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

    // Enrichir les messages avec les infos des expéditeurs
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        let sender = await Fournisseur.findById(msg.senderId);
        if (!sender) {
          sender = await Client.findById(msg.senderId);
        }

        return {
          ...msg.toObject(),
          sender: {
            _id: sender?._id,
            nom: sender?.nom || 'Utilisateur inconnu',
            photoProfile: (sender as any)?.photoProfile
          }
        };
      })
    );

    res.json(enrichedMessages.reverse());
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Envoyer message enrichi
export const sendEnhancedMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, content, type = 'text', replyTo, attachments } = req.body;
    const senderId = req.userId;

    if (!conversationId || !content || !senderId) {
      return res.status(400).json({ message: 'Données manquantes' });
    }

    // Vérifier la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(senderId as any)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    if (conversation.isBlocked) {
      return res.status(403).json({ message: 'Conversation bloquée' });
    }

    // Déterminer le type d'utilisateur
    const sender = await Fournisseur.findById(senderId) || await Client.findById(senderId);
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

    // Notification aux autres participants
    const otherParticipants = conversation.participants.filter(p => p.toString() !== senderId);
    
    for (const participantId of otherParticipants) {
      // Créer notification
      await createNotification(
        participantId.toString(),
        'message',
        `Nouveau message de ${sender?.nom}`,
        'Message reçu'
      );

      // Notification temps réel
      if (req.io) {
        req.io.to(participantId.toString()).emit('new_message', {
          conversationId,
          message: {
            ...message.toObject(),
            sender: {
              _id: sender?._id,
              nom: sender?.nom,
              photoProfile: (sender as any)?.photoProfile
            }
          }
        });
      }
    }

    res.status(201).json({
      ...message.toObject(),
      sender: {
        _id: sender?._id,
        nom: sender?.nom,
        photoProfile: (sender as any)?.photoProfile
      }
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Rechercher conversations
export const searchConversations = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    const userId = req.userId;

    if (!query) {
      return res.status(400).json({ message: 'Terme de recherche requis' });
    }

    // Rechercher dans les noms des participants
    const searchRegex = new RegExp(query as string, 'i');
    
    const fournisseurs = await Fournisseur.find({ nom: searchRegex });
    const clients = await Client.find({ nom: searchRegex });
    
    const allUsers = [...fournisseurs, ...clients];
    const userIds = allUsers.map(u => u._id);

    // Trouver les conversations avec ces utilisateurs
    const conversations = await Conversation.find({
      $and: [
        { participants: userId },
        { participants: { $in: userIds } }
      ]
    })
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    const results = conversations.map(conv => {
      const otherParticipant = allUsers.find(u => 
        conv.participants.includes(u._id) && u._id.toString() !== userId
      );

      return {
        _id: conv._id,
        participant: {
          _id: otherParticipant?._id,
          nom: otherParticipant?.nom,
          email: otherParticipant?.email
        },
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Erreur recherche conversations:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Marquer conversation comme lue
export const markConversationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

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

    res.json({ message: 'Conversation marquée comme lue' });
  } catch (error) {
    console.error('Erreur marquage lecture:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Supprimer message
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await EnhancedMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier que l'utilisateur est l'expéditeur
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    // Notification temps réel
    if (req.io) {
      req.io.to(message.conversationId.toString()).emit('message_deleted', {
        messageId,
        conversationId: message.conversationId
      });
    }

    res.json({ message: 'Message supprimé' });
  } catch (error) {
    console.error('Erreur suppression message:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Modifier message
export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    const message = await EnhancedMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Notification temps réel
    if (req.io) {
      req.io.to(message.conversationId.toString()).emit('message_edited', {
        messageId,
        content,
        editedAt: message.editedAt
      });
    }

    res.json(message);
  } catch (error) {
    console.error('Erreur modification message:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};