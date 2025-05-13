import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const SCSS_DIR = path.join(process.cwd(), 'assets/scss');
const SCSS_MAIN_FILE = path.join(SCSS_DIR, 'style.scss');
const CSS_OUTPUT_FILE = path.join(SCSS_DIR, 'style.css');
const SOURCEMAP_FILE = path.join(SCSS_DIR, 'style.css.map');

/**
 * Script pour optimiser les sourcemaps CSS/SCSS pour Google Chrome Workspace
 * 
 * Ce script effectue les opérations suivantes :
 * 1. Compile le SCSS avec Sass en générant des sourcemaps
 * 2. Corrige les chemins relatifs dans le fichier sourcemap
 * 3. Ajoute une annotation sourcemap au fichier CSS compilé
 */

function main() {
  console.log('🔨 Optimisation des sourcemaps pour Chrome Workspace...');
  
  try {
    // 1. Compiler le SCSS avec sourcemaps
    console.log('📦 Compilation du SCSS avec sourcemaps...');
    execSync(`npx sass --style=expanded --source-map "${SCSS_MAIN_FILE}:${CSS_OUTPUT_FILE}"`, { stdio: 'inherit' });
    
    // 2. Vérifier si le fichier sourcemap a été créé
    if (!fs.existsSync(SOURCEMAP_FILE)) {
      throw new Error('Le fichier sourcemap n\'a pas été généré correctement');
    }
    
    // 3. Charger et modifier le fichier sourcemap
    console.log('🔧 Optimisation du fichier sourcemap...');
    const sourcemapContent = fs.readFileSync(SOURCEMAP_FILE, 'utf8');
    const sourcemap = JSON.parse(sourcemapContent);
    
    // 4. S'assurer que les chemins sont relatifs et compatibles avec Chrome Workspace
    sourcemap.sources = sourcemap.sources.map(src => {
      // Convertir les chemins absolus en chemins relatifs à partir de la racine du projet
      if (path.isAbsolute(src)) {
        return path.relative(process.cwd(), src);
      }
      return src;
    });
    
    // 5. Écrire le sourcemap modifié
    fs.writeFileSync(SOURCEMAP_FILE, JSON.stringify(sourcemap, null, 2));
    
    // 6. S'assurer que le CSS a l'annotation sourcemap
    const cssContent = fs.readFileSync(CSS_OUTPUT_FILE, 'utf8');
    if (!cssContent.includes('/*# sourceMappingURL=')) {
      const updatedCssContent = cssContent + `\n\n/*# sourceMappingURL=${path.basename(SOURCEMAP_FILE)} */\n`;
      fs.writeFileSync(CSS_OUTPUT_FILE, updatedCssContent);
    }
    
    console.log('✅ Sourcemaps optimisés avec succès pour Chrome Workspace!');
    console.log('🌟 Vous pouvez maintenant éditer directement les fichiers SCSS dans Chrome DevTools.');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation des sourcemaps:', error);
    process.exit(1);
  }
}

main();