import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { NotificationService } from './services/notificationService';

const PORT = process.env.PORT || 5000;

// Vérifier que le port est disponible
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Middleware pour passer io aux routes
app.use((req, res, next) => {
  (req as any).io = io;
  next();
});

// Initialize notification service
NotificationService.setIO(io);

// Socket.io pour les notifications en temps réel
io.on('connection', (socket) => {
  console.log('✅ Utilisateur connecté:', socket.id);
  
  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`👤 Utilisateur ${userId} rejoint sa room`);
  });
  
  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('user_typing', {
      userId: data.userId,
      typing: true
    });
  });
  
  socket.on('stop_typing', (data) => {
    socket.to(data.conversationId).emit('user_stop_typing', {
      userId: data.userId,
      typing: false
    });
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Utilisateur déconnecté:', socket.id);
  });
  
  socket.on('error', (error) => {
    console.error('🔌 Erreur Socket:', error);
  });
});

// Gestion des erreurs de port
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} déjà utilisé. Essayez un autre port.`);
    process.exit(1);
  } else {
    console.error('❌ Erreur serveur:', error);
  }
});

server.listen(Number(PORT), () => {
  console.log('🚀 ================================');
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log('🚀 ================================');
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('💥 Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesse rejetée non gérée:', reason);
  process.exit(1);
});