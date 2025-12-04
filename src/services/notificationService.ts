import { createNotification } from '../controllers/notificationController';

export class NotificationService {
  static io: any = null;
  
  static setIO(socketIO: any) {
    this.io = socketIO;
  }
  
  static async notifyNewProduct(userId: string, productName: string) {
    try {
      const notification = await createNotification(
        userId,
        'nouveau_produit',
        `Nouveau produit disponible: ${productName}`,
        'Nouveau produit',
        undefined,
        'normale'
      );
      
      if (notification && this.io) {
        this.io.to(userId).emit('nouvelle_notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Erreur notification nouveau produit:', error);
    }
  }

  static async notifyLowStock(userId: string, productName: string, stock: number) {
    try {
      const notification = await createNotification(
        userId,
        'stock_bas',
        `Stock faible pour ${productName}: ${stock} unités restantes`,
        'Stock faible',
        undefined,
        'haute'
      );
      
      if (notification && this.io) {
        this.io.to(userId).emit('nouvelle_notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Erreur notification stock faible:', error);
    }
  }

  static async notifyNewMessage(userId: string, senderName: string) {
    try {
      const notification = await createNotification(
        userId,
        'message',
        `Nouveau message de ${senderName}`,
        'Nouveau message',
        '/messaging',
        'normale'
      );
      
      if (notification && this.io) {
        this.io.to(userId).emit('nouvelle_notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Erreur notification message:', error);
    }
  }

  static async notifyPriceChange(userId: string, productName: string, oldPrice: number, newPrice: number) {
    try {
      const notification = await createNotification(
        userId,
        'prix_modifie',
        `Prix modifié pour ${productName}: ${oldPrice} GNF → ${newPrice} GNF`,
        'Prix modifié',
        undefined,
        'normale'
      );
      
      if (notification && this.io) {
        this.io.to(userId).emit('nouvelle_notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Erreur notification prix:', error);
    }
  }

  static async notifyNewOrder(userId: string, orderDetails: string) {
    try {
      const notification = await createNotification(
        userId,
        'commande',
        `Nouvelle commande: ${orderDetails}`,
        'Nouvelle commande',
        '/my-products',
        'haute'
      );
      
      if (notification && this.io) {
        this.io.to(userId).emit('nouvelle_notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Erreur notification commande:', error);
    }
  }
}