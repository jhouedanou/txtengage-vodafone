#!/usr/bin/env node

import { Client } from 'basic-ftp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration FTP - À personnaliser selon votre serveur
const FTP_CONFIG = {
  host: process.env.FTP_HOST || 'your-server.com',
  user: process.env.FTP_USER || 'username',
  password: process.env.FTP_PASSWORD || 'password',
  port: process.env.FTP_PORT || 21,
  secure: process.env.FTP_SECURE === 'true' || false, // true pour FTPS
};

// Configuration des chemins
const PATHS = {
  // Dossier local où Nuxt génère les fichiers statiques
  local: path.resolve(__dirname, '..', '.vercel', 'output', 'static', 'txtengage'),
  // Dossier distant sur le serveur FTP
  remote: process.env.FTP_REMOTE_PATH || '/public_html/txtengage',
  // Fichiers à exclure du déploiement
  exclude: [
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    'node_modules',
    '.git',
    '.env*',
    '*.map' // Exclure les sourcemaps en production
  ]
};

class FTPDeployer {
  constructor() {
    this.client = new Client();
    this.client.ftp.verbose = true; // Pour voir les logs détaillés
  }

  async connect() {
    try {
      console.log('🔄 Connexion au serveur FTP...');
      await this.client.access(FTP_CONFIG);
      console.log('✅ Connexion FTP établie');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion FTP:', error.message);
      return false;
    }
  }

  async ensureRemoteDirectory() {
    try {
      console.log(`🔄 Création/vérification du dossier distant: ${PATHS.remote}`);
      await this.client.ensureDir(PATHS.remote);
      console.log('✅ Dossier distant prêt');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la création du dossier distant:', error.message);
      return false;
    }
  }

  shouldExcludeFile(filePath) {
    const fileName = path.basename(filePath);
    return PATHS.exclude.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
      }
      return fileName === pattern;
    });
  }

  async uploadDirectory(localDir, remoteDir) {
    try {
      const items = await fs.readdir(localDir, { withFileTypes: true });
      
      for (const item of items) {
        const localPath = path.join(localDir, item.name);
        const remotePath = `${remoteDir}/${item.name}`;

        if (this.shouldExcludeFile(localPath)) {
          console.log(`⏭️  Exclusion: ${item.name}`);
          continue;
        }

        if (item.isDirectory()) {
          console.log(`📁 Dossier: ${item.name}`);
          await this.client.ensureDir(remotePath);
          await this.uploadDirectory(localPath, remotePath);
        } else {
          console.log(`📄 Upload: ${item.name}`);
          await this.client.uploadFrom(localPath, remotePath);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error.message);
      throw error;
    }
  }

  async clearRemoteDirectory() {
    try {
      console.log('🔄 Nettoyage du dossier distant...');
      // Optionnel: nettoyer le dossier distant avant upload
      // await this.client.removeDir(PATHS.remote);
      console.log('✅ Nettoyage terminé');
    } catch (error) {
      console.log('⚠️  Le dossier distant n\'existait pas ou est déjà vide');
    }
  }

  async deploy() {
    try {
      // Vérifier que le dossier local existe
      const localExists = await fs.access(PATHS.local).then(() => true).catch(() => false);
      if (!localExists) {
        throw new Error(`Le dossier local n'existe pas: ${PATHS.local}`);
      }

      console.log('🚀 Début du déploiement FTP');
      console.log(`📂 Source: ${PATHS.local}`);
      console.log(`🌐 Destination: ${FTP_CONFIG.host}${PATHS.remote}`);

      // Connexion FTP
      if (!(await this.connect())) {
        throw new Error('Impossible de se connecter au serveur FTP');
      }

      // Préparer le dossier distant
      if (!(await this.ensureRemoteDirectory())) {
        throw new Error('Impossible de préparer le dossier distant');
      }

      // Upload des fichiers
      await this.uploadDirectory(PATHS.local, PATHS.remote);

      console.log('✅ Déploiement FTP terminé avec succès!');

    } catch (error) {
      console.error('❌ Erreur de déploiement:', error.message);
      process.exit(1);
    } finally {
      this.client.close();
    }
  }
}

// Fonction principale
async function main() {
  // Vérifier les variables d'environnement requises
  const requiredEnvVars = ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Créez un fichier .env avec les configurations FTP ou utilisez les variables d\'environnement');
    process.exit(1);
  }

  const deployer = new FTPDeployer();
  await deployer.deploy();
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default FTPDeployer; 