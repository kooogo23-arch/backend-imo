#!/bin/bash

echo "🚀 Démarrage du backend Matériel IMO..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Aller dans le dossier backend
cd "$(dirname "$0")"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f ".env" ]; then
    echo "⚙️ Création du fichier .env..."
    cp .env.example .env
    echo "✅ Fichier .env créé. Veuillez le configurer avec vos variables."
fi

# Démarrer le serveur
echo "🔥 Démarrage du serveur..."
npm run dev