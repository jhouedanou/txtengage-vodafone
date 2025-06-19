#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration d'optimisation
const OPTIMIZATION_CONFIG = {
  jpeg: {
    quality: 85,
    progressive: true
  },
  png: {
    quality: '65-85',
    speed: 1
  },
  webp: {
    quality: 85,
    method: 6
  }
};

// Dossiers à optimiser
const IMAGE_DIRS = [
  'public/images',
  'public/svgs'
];

// Extensions supportées
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.svg'];

/**
 * Obtenir la taille d'un fichier en Ko
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return Math.round(stats.size / 1024);
}

/**
 * Optimiser une image JPEG
 */
function optimizeJpeg(filePath) {
  const sizeBefore = getFileSize(filePath);
  
  try {
    // Utiliser imagemagick si disponible, sinon utiliser mozjpeg
    try {
      execSync(`convert "${filePath}" -quality ${OPTIMIZATION_CONFIG.jpeg.quality} -interlace Plane "${filePath}"`, { stdio: 'pipe' });
    } catch {
      console.log(`⚠️ ImageMagick non disponible pour ${filePath}`);
      return { success: false, reason: 'ImageMagick non disponible' };
    }
    
    const sizeAfter = getFileSize(filePath);
    const savings = sizeBefore - sizeAfter;
    const percentage = Math.round((savings / sizeBefore) * 100);
    
    return {
      success: true,
      sizeBefore,
      sizeAfter,
      savings,
      percentage
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Optimiser une image PNG
 */
function optimizePng(filePath) {
  const sizeBefore = getFileSize(filePath);
  
  try {
    // Utiliser pngquant si disponible
    try {
      execSync(`pngquant --quality=${OPTIMIZATION_CONFIG.png.quality} --speed=${OPTIMIZATION_CONFIG.png.speed} --force --output "${filePath}" "${filePath}"`, { stdio: 'pipe' });
    } catch {
      console.log(`⚠️ pngquant non disponible pour ${filePath}, utilisation d'ImageMagick`);
      execSync(`convert "${filePath}" -quality 85 "${filePath}"`, { stdio: 'pipe' });
    }
    
    const sizeAfter = getFileSize(filePath);
    const savings = sizeBefore - sizeAfter;
    const percentage = Math.round((savings / sizeBefore) * 100);
    
    return {
      success: true,
      sizeBefore,
      sizeAfter,
      savings,
      percentage
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Optimiser un SVG
 */
function optimizeSvg(filePath) {
  const sizeBefore = getFileSize(filePath);
  
  try {
    // Utiliser svgo si disponible
    try {
      execSync(`npx svgo "${filePath}" -o "${filePath}"`, { stdio: 'pipe' });
    } catch {
      console.log(`⚠️ svgo non disponible pour ${filePath}`);
      return { success: false, reason: 'svgo non disponible' };
    }
    
    const sizeAfter = getFileSize(filePath);
    const savings = sizeBefore - sizeAfter;
    const percentage = Math.round((savings / sizeBefore) * 100);
    
    return {
      success: true,
      sizeBefore,
      sizeAfter,
      savings,
      percentage
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Créer une version WebP d'une image
 */
function createWebp(filePath) {
  const ext = path.extname(filePath);
  const webpPath = filePath.replace(ext, '.webp');
  
  // Ne pas créer si le WebP existe déjà
  if (fs.existsSync(webpPath)) {
    return { success: false, reason: 'WebP existe déjà' };
  }
  
  try {
    execSync(`cwebp -q ${OPTIMIZATION_CONFIG.webp.quality} -m ${OPTIMIZATION_CONFIG.webp.method} "${filePath}" -o "${webpPath}"`, { stdio: 'pipe' });
    
    const originalSize = getFileSize(filePath);
    const webpSize = getFileSize(webpPath);
    const savings = originalSize - webpSize;
    const percentage = Math.round((savings / originalSize) * 100);
    
    return {
      success: true,
      originalSize,
      webpSize,
      savings,
      percentage,
      webpPath
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Optimiser tous les fichiers dans un dossier
 */
function optimizeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`❌ Dossier non trouvé: ${dirPath}`);
    return;
  }
  
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = {
    optimized: 0,
    errors: 0,
    totalSavings: 0,
    webpCreated: 0
  };
  
  console.log(`\n📁 Optimisation du dossier: ${dirPath}`);
  
  for (const file of files) {
    if (file.isDirectory()) {
      // Récursion pour les sous-dossiers
      const subDirResults = optimizeDirectory(path.join(dirPath, file.name));
      results.optimized += subDirResults.optimized;
      results.errors += subDirResults.errors;
      results.totalSavings += subDirResults.totalSavings;
      results.webpCreated += subDirResults.webpCreated;
      continue;
    }
    
    const filePath = path.join(dirPath, file.name);
    const ext = path.extname(file.name).toLowerCase();
    
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      continue;
    }
    
    console.log(`\n🔧 Optimisation: ${file.name}`);
    
    // Optimiser selon le type
    let result;
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        result = optimizeJpeg(filePath);
        break;
      case '.png':
        result = optimizePng(filePath);
        break;
      case '.svg':
        result = optimizeSvg(filePath);
        break;
    }
    
    if (result && result.success) {
      console.log(`   ✅ ${result.sizeBefore}Ko → ${result.sizeAfter}Ko (économie: ${result.savings}Ko, ${result.percentage}%)`);
      results.optimized++;
      results.totalSavings += result.savings;
    } else if (result) {
      console.log(`   ❌ Erreur: ${result.error || result.reason}`);
      results.errors++;
    }
    
    // Créer version WebP pour JPEG et PNG
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      const webpResult = createWebp(filePath);
      if (webpResult.success) {
        console.log(`   🌐 WebP créé: ${webpResult.originalSize}Ko → ${webpResult.webpSize}Ko (économie: ${webpResult.savings}Ko, ${webpResult.percentage}%)`);
        results.webpCreated++;
      }
    }
  }
  
  return results;
}

/**
 * Fonction principale
 */
function main() {
  console.log('🚀 Démarrage de l\'optimisation des images...\n');
  
  const totalResults = {
    optimized: 0,
    errors: 0,
    totalSavings: 0,
    webpCreated: 0
  };
  
  // Optimiser chaque dossier
  for (const dir of IMAGE_DIRS) {
    const results = optimizeDirectory(dir);
    totalResults.optimized += results.optimized;
    totalResults.errors += results.errors;
    totalResults.totalSavings += results.totalSavings;
    totalResults.webpCreated += results.webpCreated;
  }
  
  // Résumé final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ DE L\'OPTIMISATION');
  console.log('='.repeat(50));
  console.log(`✅ Images optimisées: ${totalResults.optimized}`);
  console.log(`🌐 Images WebP créées: ${totalResults.webpCreated}`);
  console.log(`💾 Économies totales: ${totalResults.totalSavings}Ko`);
  console.log(`❌ Erreurs: ${totalResults.errors}`);
  
  if (totalResults.totalSavings > 0) {
    console.log(`\n🎉 Optimisation terminée ! ${Math.round(totalResults.totalSavings / 1024)}Mo économisés !`);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { main, optimizeDirectory }; 