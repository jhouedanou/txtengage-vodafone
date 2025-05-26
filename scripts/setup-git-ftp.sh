#!/bin/bash

# Script de configuration git-ftp pour le projet Vodafone
# Usage: ./scripts/setup-git-ftp.sh

echo "🔧 Configuration de git-ftp pour le déploiement vers txtengage"

# Vérifier si git-ftp est installé
if ! command -v git-ftp &> /dev/null; then
    echo "❌ git-ftp n'est pas installé"
    echo "💡 Installation sur macOS: brew install git-ftp"
    echo "💡 Installation sur Ubuntu: apt-get install git-ftp"
    echo "💡 Installation générale: https://github.com/git-ftp/git-ftp"
    exit 1
fi

# Demander les informations FTP si pas déjà configurées
if [ ! -f .env ]; then
    echo "📝 Configuration des paramètres FTP..."
    
    read -p "Hôte FTP: " FTP_HOST
    read -p "Utilisateur FTP: " FTP_USER
    read -s -p "Mot de passe FTP: " FTP_PASSWORD
    echo
    read -p "Port FTP (défaut: 21): " FTP_PORT
    FTP_PORT=${FTP_PORT:-21}
    read -p "Chemin distant (défaut: /public_html/txtengage): " FTP_REMOTE_PATH
    FTP_REMOTE_PATH=${FTP_REMOTE_PATH:-/public_html/txtengage}
    
    # Créer le fichier .env
    cat > .env << EOF
FTP_HOST=$FTP_HOST
FTP_USER=$FTP_USER
FTP_PASSWORD=$FTP_PASSWORD
FTP_PORT=$FTP_PORT
FTP_REMOTE_PATH=$FTP_REMOTE_PATH
FTP_SECURE=false
EOF
    
    echo "✅ Fichier .env créé"
fi

# Charger les variables d'environnement
source .env

# Configuration git-ftp
echo "🔧 Configuration git-ftp..."

git config git-ftp.url "ftp://$FTP_HOST"
git config git-ftp.user "$FTP_USER"
git config git-ftp.password "$FTP_PASSWORD"
git config git-ftp.remote-root "$FTP_REMOTE_PATH"

echo "✅ Configuration git-ftp terminée"

# Initialisation git-ftp (première fois)
read -p "🤔 Voulez-vous initialiser git-ftp maintenant? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Génération des fichiers..."
    npm run generate:production
    
    echo "🚀 Initialisation git-ftp..."
    git ftp init --syncroot .output/public/
    
    echo "✅ Initialisation terminée!"
    echo "💡 Pour les prochains déploiements, utilisez: npm run deploy:git-ftp"
else
    echo "💡 Pour initialiser plus tard: git ftp init --syncroot .output/public/"
    echo "💡 Pour déployer: npm run deploy:git-ftp"
fi

echo "
🎉 Configuration terminée!

Commandes disponibles:
  npm run generate:production  # Génère les fichiers
  npm run deploy:git-ftp      # Déploie avec git-ftp
  npm run deploy:ftp          # Déploie avec script FTP custom
  npm run deploy:production   # Génère + déploie FTP
" 