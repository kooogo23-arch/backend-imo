#!/bin/bash

echo "🚀 Démarrage du serveur de développement..."

# Vérifier si le port 5000 est libre
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 5000 déjà utilisé. Arrêt du processus..."
    kill -9 $(lsof -t -i:5000) 2>/dev/null || true
    sleep 2
fi

# Vérifier MongoDB
if ! pgrep mongod > /dev/null; then
    echo "⚠️  MongoDB n'est pas démarré. Tentative de démarrage..."
    sudo systemctl start mongod 2>/dev/null || echo "⚠️  Impossible de démarrer MongoDB automatiquement"
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Créer le dossier uploads s'il n'existe pas
mkdir -p uploads

echo "✅ Démarrage du serveur sur le port 5000..."
npm run dev