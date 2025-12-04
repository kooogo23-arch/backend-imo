import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import produitsRoutes from './routes/produits';
import authRoutes from './routes/auth';
import messagesRoutes from './routes/messages';
import notificationsRoutes from './routes/notifications';
import uploadRoutes from './routes/upload';
import fournisseursRoutes from './routes/fournisseurs';
import analyticsRoutes from './routes/analytics';
import dashboardRoutes from './routes/dashboard';
import marketRoutes from './routes/market';
import realTimeAnalyticsRoutes from './routes/realTimeAnalytics';
import conversationsRoutes from './routes/conversations';
import supplierRoutes from './routes/supplier';
import clientsRoutes from './routes/clients';
import messengerRoutes from './routes/messenger';

dotenv.config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/produits', produitsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/fournisseurs', fournisseursRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/analytics', realTimeAnalyticsRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/messenger', messengerRoutes);
try {
  const enhancedMessengerRoutes = require('./routes/enhancedMessenger');
  app.use('/api/messenger/enhanced', enhancedMessengerRoutes.default || enhancedMessengerRoutes);
} catch (error) {
  console.warn('Enhanced messenger routes not available:', error);
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/materiel_imo')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch((error) => console.error('❌ Erreur MongoDB:', error));

export default app;