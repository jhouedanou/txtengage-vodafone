#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

class DeploymentTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.buildDir = path.join(this.projectRoot, '.output', 'public');
    this.envFile = path.join(this.projectRoot, '.env');
    this.packageJson = path.join(this.projectRoot, 'package.json');
  }

  async checkEnvironmentFile() {
    log.info('Vérification du fichier .env...');
    
    try {
      const envContent = await fs.readFile(this.envFile, 'utf-8');
      const requiredVars = ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD'];
      const missingVars = [];

      for (const varName of requiredVars) {
        if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your-`)) {
          missingVars.push(varName);
        }
      }

      if (missingVars.length > 0) {
        log.error(`Variables manquantes ou non configurées dans .env: ${missingVars.join(', ')}`);
        return false;
      }

      log.success('Fichier .env correctement configuré');
      return true;
    } catch (error) {
      log.error('Fichier .env introuvable. Copiez env.example vers .env');
      return false;
    }
  }

  async checkBuildDirectory() {
    log.info('Vérification du dossier de build...');
    
    try {
      const stat = await fs.stat(this.buildDir);
      if (!stat.isDirectory()) {
        log.error('Le dossier .output/public n\'est pas un dossier');
        return false;
      }

      const files = await fs.readdir(this.buildDir);
      if (files.length === 0) {
        log.warning('Le dossier .output/public est vide. Exécutez: npm run generate:production');
        return false;
      }

      // Vérifier les fichiers essentiels
      const requiredFiles = ['index.html'];
      const missingFiles = requiredFiles.filter(file => !files.includes(file));
      
      if (missingFiles.length > 0) {
        log.warning(`Fichiers manquants: ${missingFiles.join(', ')}`);
      }

      log.success(`Dossier de build trouvé avec ${files.length} fichiers`);
      return true;
    } catch (error) {
      log.error('Dossier .output/public introuvable. Exécutez: npm run generate:production');
      return false;
    }
  }

  async checkPackageJsonScripts() {
    log.info('Vérification des scripts package.json...');
    
    try {
      const packageContent = await fs.readFile(this.packageJson, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const requiredScripts = [
        'generate:production',
        'deploy:ftp',
        'deploy:git-ftp',
        'deploy:production'
      ];

      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        log.error(`Scripts manquants: ${missingScripts.join(', ')}`);
        return false;
      }

      log.success('Tous les scripts de déploiement sont présents');
      return true;
    } catch (error) {
      log.error('Erreur lors de la lecture du package.json');
      return false;
    }
  }

  async checkDependencies() {
    log.info('Vérification des dépendances...');
    
    try {
      const packageContent = await fs.readFile(this.packageJson, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const requiredDeps = ['basic-ftp'];
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
      
      if (missingDeps.length > 0) {
        log.error(`Dépendances manquantes: ${missingDeps.join(', ')}`);
        log.info('Exécutez: npm install');
        return false;
      }

      log.success('Toutes les dépendances sont présentes');
      return true;
    } catch (error) {
      log.error('Erreur lors de la vérification des dépendances');
      return false;
    }
  }

  async checkDeploymentFiles() {
    log.info('Vérification des fichiers de déploiement...');
    
    const files = [
      'scripts/deploy-ftp.js',
      '.git-ftp-config',
      '.git-ftp-ignore',
      'env.example'
    ];

    let allPresent = true;

    for (const file of files) {
      const filePath = path.join(this.projectRoot, file);
      try {
        await fs.stat(filePath);
        log.success(`${file} trouvé`);
      } catch (error) {
        log.error(`${file} manquant`);
        allPresent = false;
      }
    }

    return allPresent;
  }

  async runBuildTest() {
    log.info('Test de build en cours...');
    
    try {
      // Simuler un build test (sans exécuter réellement npm)
      const buildSize = await this.calculateBuildSize();
      
      if (buildSize > 0) {
        log.success(`Build présent (${(buildSize / 1024 / 1024).toFixed(2)} MB)`);
        return true;
      } else {
        log.warning('Build vide ou inexistant');
        return false;
      }
    } catch (error) {
      log.error('Erreur lors du test de build');
      return false;
    }
  }

  async calculateBuildSize() {
    try {
      const files = await fs.readdir(this.buildDir, { recursive: true });
      let totalSize = 0;

      for (const file of files) {
        try {
          const filePath = path.join(this.buildDir, file);
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            totalSize += stat.size;
          }
        } catch (error) {
          // Ignorer les erreurs de fichiers individuels
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  async runAllTests() {
    console.log(`
🧪 Test de Configuration de Déploiement
========================================
`);

    const tests = [
      { name: 'Fichier .env', test: () => this.checkEnvironmentFile() },
      { name: 'Dossier de build', test: () => this.checkBuildDirectory() },
      { name: 'Scripts package.json', test: () => this.checkPackageJsonScripts() },
      { name: 'Dépendances', test: () => this.checkDependencies() },
      { name: 'Fichiers de déploiement', test: () => this.checkDeploymentFiles() },
      { name: 'Test de build', test: () => this.runBuildTest() }
    ];

    const results = [];

    for (const { name, test } of tests) {
      console.log(`\n📋 ${name}:`);
      const result = await test();
      results.push({ name, passed: result });
    }

    // Résumé
    console.log(`
📊 Résumé des Tests
==================`);

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(({ name, passed }) => {
      const status = passed ? colors.green + '✅' : colors.red + '❌';
      console.log(`${status} ${name}${colors.reset}`);
    });

    console.log(`\n🎯 Score: ${passed}/${total} tests réussis`);

    if (passed === total) {
      log.success('🚀 Prêt pour le déploiement!');
      console.log(`
💡 Commandes de déploiement:
  npm run deploy:production    # Build + FTP
  npm run deploy:git-ftp       # Git-FTP
      `);
    } else {
      log.error('🔧 Configuration incomplète');
      console.log(`
💡 Actions recommandées:
  1. Copiez env.example vers .env et configurez
  2. Exécutez: npm install
  3. Testez le build: npm run generate:production
  4. Relancez ce test: node scripts/test-deploy.js
      `);
    }

    return passed === total;
  }
}

// Exécution du script
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DeploymentTester();
  tester.runAllTests().catch(console.error);
}

export default DeploymentTester; 