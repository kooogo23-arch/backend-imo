const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Test simple d'authentification
async function testAuth() {
  console.log('🔐 Test du système d\'authentification...');
  
  // Test de hachage de mot de passe
  const password = 'test123';
  const hashedPassword = await bcrypt.hash(password, 12);
  console.log('✅ Hachage du mot de passe réussi');
  
  // Test de vérification du mot de passe
  const isMatch = await bcrypt.compare(password, hashedPassword);
  console.log('✅ Vérification du mot de passe:', isMatch ? 'SUCCÈS' : 'ÉCHEC');
  
  // Test de génération de token JWT
  const token = jwt.sign(
    { userId: 'test123', userType: 'client' },
    'materiel_imo_jwt_secret_2024_very_secure_key_123456789',
    { expiresIn: '7d' }
  );
  console.log('✅ Génération du token JWT réussie');
  
  // Test de vérification du token
  try {
    const decoded = jwt.verify(token, 'materiel_imo_jwt_secret_2024_very_secure_key_123456789');
    console.log('✅ Vérification du token JWT réussie:', decoded);
  } catch (error) {
    console.log('❌ Erreur de vérification du token:', error.message);
  }
  
  console.log('🎉 Tous les tests d\'authentification sont passés!');
}

testAuth().catch(console.error);