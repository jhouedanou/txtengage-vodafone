#!/usr/bin/env node

/**
 * Script pour télécharger automatiquement tous les SVG externes
 * Utilisation: node scripts/download-external-svgs.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const url = require('url');

// Configuration
const PUBLIC_SVGS_DIR = path.join(__dirname, '..', 'public', 'svgs');
const PAGES_DIR = path.join(__dirname, '..', 'pages');

// Créer le dossier svgs s'il n'existe pas
if (!fs.existsSync(PUBLIC_SVGS_DIR)) {
  fs.mkdirSync(PUBLIC_SVGS_DIR, { recursive: true });
  console.log('📁 Dossier /public/svgs/ créé');
}

// Fonction pour télécharger un fichier
function downloadFile(fileUrl, filename) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(fileUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const filePath = path.join(PUBLIC_SVGS_DIR, filename);
    
    console.log(`📥 Téléchargement: ${filename}...`);
    
    protocol.get(fileUrl, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ ${filename} téléchargé avec succès`);
          resolve(filePath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Supprimer le fichier partiellement téléchargé
          reject(err);
        });
      } else {
        reject(new Error(`Erreur HTTP: ${response.statusCode} pour ${fileUrl}`));
      }
    }).on('error', reject);
  });
}

// Fonction pour extraire les URLs de SVG externes depuis le code
function extractExternalSvgUrls() {
  const svgUrls = new Set();
  
  // Lire tous les fichiers .vue dans pages/
  function scanDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.vue') || file.endsWith('.js') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Rechercher les URLs externes dans le contenu
        const patterns = [
          // Pattern pour les URLs directes
          /https?:\/\/[^\s"']+\.svg/g,
          // Pattern pour data attributes
          /:data="[^"]*https?:\/\/[^"]*\.svg[^"]*"/g,
          // Pattern pour src attributes
          /src="[^"]*https?:\/\/[^"]*\.svg[^"]*"/g
        ];
        
        patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Extraire l'URL proprement
              const urlMatch = match.match(/(https?:\/\/[^\s"']+\.svg)/);
              if (urlMatch) {
                svgUrls.add(urlMatch[1]);
              }
            });
          }
        });
      }
    });
  }
  
  scanDirectory(PAGES_DIR);
  
  // Aussi scanner les composants et utils
  const additionalDirs = [
    path.join(__dirname, '..', 'components'),
    path.join(__dirname, '..', 'utils'),
    path.join(__dirname, '..', 'stores')
  ];
  
  additionalDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      scanDirectory(dir);
    }
  });
  
  return Array.from(svgUrls);
}

// Fonction principale
async function main() {
  console.log('🔍 Recherche des SVG externes...');
  
  const externalSvgUrls = extractExternalSvgUrls();
  
  if (externalSvgUrls.length === 0) {
    console.log('✅ Aucun SVG externe trouvé dans le code');
    return;
  }
  
  console.log(`📊 ${externalSvgUrls.length} SVG externe(s) trouvé(s):`);
  externalSvgUrls.forEach(url => console.log(`  - ${url}`));
  
  console.log('\n📥 Début des téléchargements...');
  
  const downloadPromises = externalSvgUrls.map(async (svgUrl) => {
    try {
      const filename = path.basename(url.parse(svgUrl).pathname);
      const localPath = path.join(PUBLIC_SVGS_DIR, filename);
      
      // Vérifier si le fichier existe déjà
      if (fs.existsSync(localPath)) {
        console.log(`⏭️  ${filename} existe déjà, ignoré`);
        return { url: svgUrl, filename, status: 'EXISTS' };
      }
      
      await downloadFile(svgUrl, filename);
      return { url: svgUrl, filename, status: 'DOWNLOADED' };
    } catch (error) {
      console.error(`❌ Erreur téléchargement ${svgUrl}:`, error.message);
      return { url: svgUrl, filename: path.basename(url.parse(svgUrl).pathname), status: 'ERROR', error: error.message };
    }
  });
  
  const results = await Promise.all(downloadPromises);
  
  console.log('\n📊 RÉSUMÉ:');
  const downloaded = results.filter(r => r.status === 'DOWNLOADED');
  const existing = results.filter(r => r.status === 'EXISTS');
  const errors = results.filter(r => r.status === 'ERROR');
  
  console.log(`✅ Téléchargés: ${downloaded.length}`);
  console.log(`⏭️  Déjà existants: ${existing.length}`);
  console.log(`❌ Erreurs: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERREURS:');
    errors.forEach(error => {
      console.log(`  - ${error.filename}: ${error.error}`);
    });
  }
  
  // Générer un script de remplacement pour le code
  if (downloaded.length > 0 || existing.length > 0) {
    const allSuccessful = [...downloaded, ...existing];
    
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Remplacer les URLs externes par les chemins locaux dans votre code:');
    
    allSuccessful.forEach(item => {
      const localPath = `/svgs/${item.filename}`;
      console.log(`   ${item.url} → ${localPath}`);
    });
    
    console.log('\n2. Ou utiliser la fonction handleExternalSvg() qui détectera automatiquement les versions locales');
    
    // Créer un fichier de mapping
    const mapping = {};
    allSuccessful.forEach(item => {
      mapping[item.url] = `/svgs/${item.filename}`;
    });
    
    const mappingFile = path.join(__dirname, '..', 'svg-mapping.json');
    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
    console.log(`\n📄 Mapping créé: ${mappingFile}`);
  }
  
  console.log('\n🎉 Terminé !');
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { downloadFile, extractExternalSvgUrls }; 