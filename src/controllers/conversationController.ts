import { Request, Response } from 'express';
import Fournisseur from '../models/Fournisseur';
import Client from '../models/Client';
import Message from '../models/Message';
import Notification from '../models/Notification';

interface AuthRequest extends Request {
  userId?: string;
}

const mockConversations = [
  {
    contactId: '1',
    contactName: 'Fournisseur Test',
    contactType: 'Fournisseur',
    lastMessage: {
      contenu: 'Bonjour, avez-vous des briques disponibles?',
      dateEnvoi: new Date(),
      lu: false
    },
    unreadCount: 2
  },
  {
    contactId: '2',
    contactName: 'Client Premium',
    contactType: 'Client',
    lastMessage: {
      contenu: 'Merci pour votre réponse rapide',
      dateEnvoi: new Date(),
      lu: true
    },
    unreadCount: 0
  }
];

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    // Utiliser aggregation pour récupérer le dernier message par contact
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { expediteurId: userId },
            { destinataireId: userId }
          ]
        }
      },
      {
        $addFields: {
          contactId: {
            $cond: {
              if: { $eq: ["$expediteurId", userId] },
              then: "$destinataireId",
              else: "$expediteurId"
            }
          },
          contactType: {
            $cond: {
              if: { $eq: ["$expediteurId", userId] },
              then: "$destinataireType",
              else: "$expediteurType"
            }
          }
        }
      },
      {
        $sort: { dateEnvoi: -1 }
      },
      {
        $group: {
          _id: "$contactId",
          contactType: { $first: "$contactType" },
          dernierMessage: {
            $first: {
              contenu: "$contenu",
              dateEnvoi: "$dateEnvoi",
              lu: "$lu"
            }
          },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$destinataireId", userId] }, { $eq: ["$lu", false] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Récupérer les informations des contacts
    const contactIds = conversations.map(conv => conv._id);
    const fournisseurs = await Fournisseur.find({ _id: { $in: contactIds } });
    const clients = await Client.find({ _id: { $in: contactIds } });
    
    const allContacts = [...fournisseurs, ...clients];
    
    const contacts = conversations.map(conv => {
      const contact = allContacts.find(c => c._id.toString() === conv._id.toString());
      return {
        contactId: conv._id,
        contactName: contact?.nom || 'Utilisateur inconnu',
        contactType: conv.contactType,
        lastMessage: conv.dernierMessage,
        unreadCount: conv.unreadCount
      };
    });

    res.json(contacts);
  } catch (error) {
    console.warn('Database not available, using mock conversations');
    res.json(mockConversations);
  }
};

export const getConversationMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;
    const userId = req.userId;

    const messages = await Message.find({
      $or: [
        { expediteurId: userId, destinataireId: contactId },
        { expediteurId: contactId, destinataireId: userId }
      ]
    }).sort({ dateEnvoi: 1 });

    // Marquer les messages comme lus
    await Message.updateMany(
      { expediteurId: contactId, destinataireId: userId, lu: false },
      { lu: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { destinataireId, contenu } = req.body;
    const expediteurId = req.userId;

    if (!destinataireId || !contenu || !expediteurId) {
      return res.status(400).json({ message: 'Données manquantes' });
    }

    // Déterminer les types d'expéditeur et destinataire
    const expediteur = await Fournisseur.findById(expediteurId) || await Client.findById(expediteurId);
    const destinataire = await Fournisseur.findById(destinataireId) || await Client.findById(destinataireId);
    
    if (!expediteur || !destinataire) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const expediteurType = await Fournisseur.findById(expediteurId) ? 'Fournisseur' : 'Client';
    const destinataireType = await Fournisseur.findById(destinataireId) ? 'Fournisseur' : 'Client';

    const message = new Message({
      expediteurId,
      destinataireId,
      expediteurType,
      destinataireType,
      contenu,
      dateEnvoi: new Date(),
      lu: false
    });

    await message.save();

    // Créer une notification pour le destinataire
    const notification = new Notification({
      utilisateurId: destinataireId,
      type: 'message',
      message: `Nouveau message de ${expediteur.nom}`,
      dateCreation: new Date(),
      lu: false
    });
    await notification.save();

    // Envoyer notification Socket.io si disponible
    const io = (req as any).io;
    if (io) {
      io.to(destinataireId).emit('new_message', {
        messageId: message._id,
        expediteurNom: expediteur.nom,
        contenu: message.contenu
      });
      io.to(destinataireId).emit('notification', {
        type: 'message',
        message: `Nouveau message de ${expediteur.nom}`,
        dateCreation: notification.dateCreation
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur inconnue' });
  }
};