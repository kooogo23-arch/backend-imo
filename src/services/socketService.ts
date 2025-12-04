import { Server } from 'socket.io';
import Notification from '../models/Notification';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Utilisateur connecté:', socket.id);
    
    socket.on('join_room', (userId) => {
      socket.join(userId);
      console.log(`Utilisateur ${userId} rejoint sa room`);
    });
    
    socket.on('send_message', async (data) => {
      const { destinataireId, message } = data;
      io.to(destinataireId).emit('new_message', message);
    });
    
    socket.on('disconnect', () => {
      console.log('Utilisateur déconnecté:', socket.id);
    });
  });
};

export const sendNotification = async (io: Server, userId: string, type: string, message: string) => {
  const notification = new Notification({
    utilisateurId: userId,
    type,
    message
  });
  
  await notification.save();
  
  io.to(userId).emit('notification', {
    type,
    message,
    dateCreation: notification.dateCreation
  });
};