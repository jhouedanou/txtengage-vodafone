# 🚀 Guide Déploiement Vercel - Branche macOS Fix

## 🎯 **Options de Déploiement**

### **Option 1: Sous-domaine Personnalisé (Recommandé)**
```bash
# 1. Connecter le projet à Vercel
vercel --prod

# 2. Ajouter un domaine personnalisé
vercel domains add macos-fix.txtengage.com

# 3. Assigner le domaine à la branche
vercel domains assign macos-fix.txtengage.com --branch=fixDoubleScrollOnMAc
```

**Résultat** : `https://macos-fix.txtengage.com`

### **Option 2: URL Preview Automatique**
```bash
# Déployer la branche actuelle
vercel --target=preview

# URL générée automatiquement
# Format: txtengage-vodafone-git-fixdoublescrollonmac-username.vercel.app
```

### **Option 3: Custom Environment**
```bash
# Créer un environnement custom "macos-testing"
vercel env add ENVIRONMENT_NAME macos-testing

# Déployer vers cet environnement
vercel deploy --target=macos-testing
```

## ⚙️ **Configuration Vercel**

### **1. Variables d'Environnement**
```bash
# Ajouter les variables pour la branche
vercel env add NUXT_APP_BASE_URL preview
# Valeur: /txtengage/

vercel env add NODE_ENV preview  
# Valeur: production
```

### **2. Build Settings**
```json
{
  "buildCommand": "npm run generate:subfolder",
  "outputDirectory": ".output/public",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

## 🔧 **Étapes de Déploiement**

### **Méthode A: Via Dashboard Vercel**
1. **Connecter le Repo**
   - Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
   - "Add New Project" → Importer depuis GitHub
   - Sélectionner `txtengage-vodafone`

2. **Configurer la Branche**
   - Settings → Git → Production Branch
   - Changer de `main` vers `fixDoubleScrollOnMAc`
   - Ou garder `main` et utiliser Preview pour la branche

3. **Ajouter Domaine**
   - Settings → Domains → Add Domain
   - Entrer: `macos-fix.txtengage.com`
   - Configurer DNS selon instructions Vercel

### **Méthode B: Via CLI**
```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Lier le projet
vercel link

# 4. Déployer la branche
git checkout fixDoubleScrollOnMAc
vercel --prod

# 5. Configurer domaine (optionnel)
vercel domains add macos-fix.txtengage.com
```

## 🌐 **URLs Résultantes**

| Méthode | URL | Type |
|---------|-----|------|
| **Sous-domaine** | `macos-fix.txtengage.com` | Permanent |
| **Preview Auto** | `txtengage-vodafone-git-fixdoublescrollonmac-user.vercel.app` | Temporaire |
| **Custom Env** | `txtengage-vodafone-macos-testing.vercel.app` | Permanent |

## 📱 **Test de la Configuration**

### **1. Vérifier le Build**
```bash
# Local test
npm run generate:subfolder
npm run preview

# Vérifier que ça fonctionne sur http://localhost:3000/txtengage/
```

### **2. Test Post-Déploiement**
```javascript
// Dans la console du site déployé
debugDesktopAnimations.isMacOSDesktop()
debugDesktopAnimations.testDebouncing(100)
```

## 🎯 **Recommandation Finale**

**Pour cette branche de test** : Utiliser **Option 2 (Preview Auto)**
- ✅ Rapide à configurer
- ✅ URL automatique
- ✅ Parfait pour les tests
- ✅ Pas besoin de domaine custom

**Commande simple** :
```bash
vercel --target=preview
```

**URL générée** : `txtengage-vodafone-git-fixdoublescrollonmac-[username].vercel.app`

## 🔄 **Workflow Recommandé**

1. **Push la branche** → URL preview automatique
2. **Tester sur macOS** → Valider le fix
3. **Merger vers main** → Déploiement production
4. **Nettoyer** → Supprimer la branche de test 