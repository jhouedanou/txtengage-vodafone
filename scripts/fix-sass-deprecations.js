import fs from 'fs/promises';
import path from 'path';

// Chemin vers le fichier SCSS
const scssFilePath = path.resolve(process.cwd(), 'assets/scss/style.scss');

async function fixSassDeprecations() {
  console.log('Début de la correction des déprécations Sass...');
  try {
    // Lire le fichier SCSS
    let content = await fs.readFile(scssFilePath, 'utf8');
    console.log('Fichier SCSS chargé avec succès');
    
    // Sauvegarder une copie du fichier original avant modifications
    await fs.writeFile(`${scssFilePath}.bak-${Date.now()}`, content, 'utf8');
    console.log('- Sauvegarde du fichier original créée');

    // Assurer que l'import sass:color est présent
    if (!content.includes('@use "sass:color"')) {
      content = '@use "sass:color";\n\n' + content.replace('@use "sass:color";\n\n', '');
    }
    
    // Approche RADICALE: Extraction directe des déclarations CSS après les règles @media
    // et réorganisation selon l'approche recommandée
    
    // 1. Identifier le bloc CSS problématique #slide-22 (lignes 564-580 selon les erreurs)
    const mshill = /#slide-22[\s\S]*?#mshill[\s\S]*?h3[\s\S]*?}/g;
    
    // 2. Remplacer les blocs problématiques par une version corrigée
    content = content.replace(mshill, (match) => {
      // Restructurer le bloc en suivant les recommandations Sass
      return match.replace(
        /(@media[^{]+{[^}]+})\s+([^@{}]+:[^;]+;)/g,
        (_, mediaRule, declaration) => {
          return `${mediaRule}\n& {\n  ${declaration}\n}`;
        }
      );
    });
    
    // 3. Faire la même chose pour tous les autres sélecteurs similaires
    const textElement = /#slide-22[\s\S]*?text-element[\s\S]*?h3[\s\S]*?}/g;
    content = content.replace(textElement, (match) => {
      return match.replace(
        /(@media[^{]+{[^}]+})\s+([^@{}]+:[^;]+;)/g,
        (_, mediaRule, declaration) => {
          return `${mediaRule}\n& {\n  ${declaration}\n}`;
        }
      );
    });
    
    // 4. Correction générale pour tous les autres cas similaires
    content = content.replace(
      /(@media[^{]+{[^}]+})\s+([^@{}]+:[^;]+;)/g,
      (_, mediaRule, declaration) => {
        return `${mediaRule}\n& {\n  ${declaration}\n}`;
      }
    );
    
    // 5. Remplacer darken() par color.adjust()
    content = content.replace(
      /darken\(([^,]+),\s*([^)]+)\)/g,
      'color.adjust($1, $lightness: -$2)'
    );
    
    // 6. Nettoyer les blocs & { } vides ou redondants
    content = content.replace(/&\s*{\s*}\s*/g, '');
    
    // Écrire le fichier corrigé
    await fs.writeFile(scssFilePath, content, 'utf8');
    console.log('✅ Corrections appliquées avec succès!');
    
  } catch (error) {
    console.error('❌ Une erreur est survenue:', error);
  }
}

// Exécuter la fonction
fixSassDeprecations();