const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock users database
const users = [
  {
    id: '1',
    email: 'client@test.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG.JOOdS8q', // password123
    userType: 'client',
    nom: 'Client Test'
  },
  {
    id: '2', 
    email: 'fournisseur@test.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG.JOOdS8q', // password123
    userType: 'fournisseur',
    nom: 'Fournisseur Test'
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    
    const isMatch = await bcrypt.compare(motDePasse, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    
    const token = jwt.sign(
      { userId: user.id, userType: user.userType },
      'materiel_imo_jwt_secret_2024_very_secure_key_123456789',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      userId: user.id,
      userType: user.userType,
      user: { id: user.id, nom: user.nom, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nom, email, motDePasse, userType = 'client' } = req.body;
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }
    
    const hashedPassword = await bcrypt.hash(motDePasse, 12);
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      userType,
      nom
    };
    
    users.push(newUser);
    
    const token = jwt.sign(
      { userId: newUser.id, userType },
      'materiel_imo_jwt_secret_2024_very_secure_key_123456789',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      userId: newUser.id,
      userType,
      user: { id: newUser.id, nom, email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
  console.log('📧 Comptes de test:');
  console.log('   Client: client@test.com / password123');
  console.log('   Fournisseur: fournisseur@test.com / password123');
});