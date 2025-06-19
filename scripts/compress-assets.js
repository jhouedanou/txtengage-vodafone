#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

// Configuration
const COMPRESSION_CONFIG = {
  gzip: {
    level: zlib.constants.Z_BEST_COMPRESSION,
    threshold: 1024 // Seulement compresser les fichiers > 1Ko
  },
  brotli: {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0
    },
    threshold: 1024
  }
};

// Dossiers et extensions à compresser
const COMPRESS_DIRS = [
  '.vercel/static',
  '.vercel/static/_nuxt'
];

const COMPRESS_EXTENSIONS = [
  '.js', '.css', '.html', '.json', '.svg', '.txt', '.xml'
];

/**
 * Obtenir la taille d'un fichier en octets
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Formater la taille en unité lisible
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Compresser un fichier avec Gzip
 */
async function compressWithGzip(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const originalSize = fileBuffer.length;
  
  if (originalSize < COMPRESSION_CONFIG.gzip.threshold) {
    return { success: false, reason: 'Fichier trop petit' };
  }
  
  try {
    const compressed = await gzip(fileBuffer, {
      level: COMPRESSION_CONFIG.gzip.level
    });
    
    const compressedPath = filePath + '.gz';
    fs.writeFileSync(compressedPath, compressed);
    
    const compressedSize = compressed.length;
    const savings = originalSize - compressedSize;
    const percentage = Math.round((savings / originalSize) * 100);
    
    return {
      success: true,
      originalSize,
      compressedSize,
      savings,
      percentage,
      compressedPath
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Compresser un fichier avec Brotli
 */
async function compressWithBrotli(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const originalSize = fileBuffer.length;
  
  if (originalSize < COMPRESSION_CONFIG.brotli.threshold) {
    return { success: false, reason: 'Fichier trop petit' };
  }
  
  try {
    const compressed = await brotliCompress(fileBuffer, {
      params: COMPRESSION_CONFIG.brotli.params
    });
    
    const compressedPath = filePath + '.br';
    fs.writeFileSync(compressedPath, compressed);
    
    const compressedSize = compressed.length;
    const savings = originalSize - compressedSize;
    const percentage = Math.round((savings / originalSize) * 100);
    
    return {
      success: true,
      originalSize,
      compressedSize,
      savings,
      percentage,
      compressedPath
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Compresser tous les fichiers d'un dossier
 */
async function compressDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`❌ Dossier non trouvé: ${dirPath}`);
    return {
      processed: 0,
      gzipCreated: 0,
      brotliCreated: 0,
      totalSavings: 0,
      errors: 0
    };
  }
  
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = {
    processed: 0,
    gzipCreated: 0,
    brotliCreated: 0,
    totalSavings: 0,
    errors: 0
  };
  
  console.log(`\n📁 Compression du dossier: ${dirPath}`);
  
  for (const file of files) {
    if (file.isDirectory()) {
      // Récursion pour les sous-dossiers
      const subDirResults = await compressDirectory(path.join(dirPath, file.name));
      results.processed += subDirResults.processed;
      results.gzipCreated += subDirResults.gzipCreated;
      results.brotliCreated += subDirResults.brotliCreated;
      results.totalSavings += subDirResults.totalSavings;
      results.errors += subDirResults.errors;
      continue;
    }
    
    const filePath = path.join(dirPath, file.name);
    const ext = path.extname(file.name).toLowerCase();
    
    // Ignorer les fichiers déjà compressés
    if (ext === '.gz' || ext === '.br') {
      continue;
    }
    
    if (!COMPRESS_EXTENSIONS.includes(ext)) {
      continue;
    }
    
    const originalSize = getFileSize(filePath);
    console.log(`\n🔧 Compression: ${file.name} (${formatSize(originalSize)})`);
    results.processed++;
    
    // Compression Gzip
    const gzipResult = await compressWithGzip(filePath);
    if (gzipResult.success) {
      console.log(`   📦 Gzip: ${formatSize(gzipResult.originalSize)} → ${formatSize(gzipResult.compressedSize)} (économie: ${gzipResult.percentage}%)`);
      results.gzipCreated++;
      results.totalSavings += gzipResult.savings;
    } else if (gzipResult.error) {
      console.log(`   ❌ Erreur Gzip: ${gzipResult.error}`);
      results.errors++;
    }
    
    // Compression Brotli
    const brotliResult = await compressWithBrotli(filePath);
    if (brotliResult.success) {
      console.log(`   🗜️ Brotli: ${formatSize(brotliResult.originalSize)} → ${formatSize(brotliResult.compressedSize)} (économie: ${brotliResult.percentage}%)`);
      results.brotliCreated++;
      // Ne pas compter deux fois les économies
    } else if (brotliResult.error) {
      console.log(`   ❌ Erreur Brotli: ${brotliResult.error}`);
      results.errors++;
    }
  }
  
  return results;
}

/**
 * Créer un fichier .htaccess pour la compression
 */
function createHtaccess() {
  const htaccessContent = `# Compression précompilée
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Gzip
    RewriteCond %{HTTP:Accept-Encoding} gzip
    RewriteCond %{REQUEST_FILENAME}\\.gz -f
    RewriteRule ^(.*)$ $1.gz [L]
    
    # Brotli (si supporté)
    RewriteCond %{HTTP:Accept-Encoding} br
    RewriteCond %{REQUEST_FILENAME}\\.br -f
    RewriteRule ^(.*)$ $1.br [L]
</IfModule>

# Headers pour les fichiers compressés
<FilesMatch "\\.js\\.gz$">
    Header set Content-Type "application/javascript"
    Header set Content-Encoding "gzip"
</FilesMatch>

<FilesMatch "\\.css\\.gz$">
    Header set Content-Type "text/css"
    Header set Content-Encoding "gzip"
</FilesMatch>

<FilesMatch "\\.js\\.br$">
    Header set Content-Type "application/javascript"
    Header set Content-Encoding "br"
</FilesMatch>

<FilesMatch "\\.css\\.br$">
    Header set Content-Type "text/css"
    Header set Content-Encoding "br"
</FilesMatch>

# Cache headers
<FilesMatch "\\.(css|js|png|jpg|jpeg|gif|svg|webp|woff|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>`;

  const outputDirs = COMPRESS_DIRS.filter(dir => fs.existsSync(dir));
  
  for (const dir of outputDirs) {
    const htaccessPath = path.join(dir, '.htaccess');
    fs.writeFileSync(htaccessPath, htaccessContent);
    console.log(`✅ .htaccess créé: ${htaccessPath}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de la compression des assets...\n');
  
  const totalResults = {
    processed: 0,
    gzipCreated: 0,
    brotliCreated: 0,
    totalSavings: 0,
    errors: 0
  };
  
  // Compresser chaque dossier
  for (const dir of COMPRESS_DIRS) {
    const results = await compressDirectory(dir);
    totalResults.processed += results.processed;
    totalResults.gzipCreated += results.gzipCreated;
    totalResults.brotliCreated += results.brotliCreated;
    totalResults.totalSavings += results.totalSavings;
    totalResults.errors += results.errors;
  }
  
  // Créer les fichiers .htaccess
  console.log('\n📄 Création des fichiers .htaccess...');
  createHtaccess();
  
  // Résumé final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ DE LA COMPRESSION');
  console.log('='.repeat(50));
  console.log(`📁 Fichiers traités: ${totalResults.processed}`);
  console.log(`📦 Fichiers Gzip créés: ${totalResults.gzipCreated}`);
  console.log(`🗜️ Fichiers Brotli créés: ${totalResults.brotliCreated}`);
  console.log(`💾 Économies totales: ${formatSize(totalResults.totalSavings)}`);
  console.log(`❌ Erreurs: ${totalResults.errors}`);
  
  if (totalResults.totalSavings > 0) {
    console.log(`\n🎉 Compression terminée ! ${formatSize(totalResults.totalSavings)} économisés !`);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, compressDirectory }; 