# Configuration pour sous-dossier txtengage

## Scripts disponibles
### Développement
- npm run dev - Développement avec sous-dossier /txtengage/
- npm run dev:root - Développement à la racine /

### Build et génération
- npm run generate:subfolder - Génération pour sous-dossier txtengage

## Déploiement
1. Générer le site : npm run generate:subfolder
2. Copier le contenu de .vercel/output/static/txtengage/ vers le serveur
3. Le fichier .htaccess est automatiquement inclus
