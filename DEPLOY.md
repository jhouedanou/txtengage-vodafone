# Guide de Déploiement - Application Nuxt

## Scripts de Génération

L'application est configurée pour supporter deux modes de déploiement :

### 1. Déploiement à la racine
```bash
npm run generate
```
- Génère l'application pour être déployée à la racine du domaine
- URL de base : `/`
- Dossier de sortie : `.vercel/static`
- Idéal pour un domaine principal (ex: `https://monsite.com`)

### 2. Déploiement en sous-dossier
```bash
npm run generate:subfolder
```
- Génère l'application pour être déployée dans le sous-dossier `/txtengage/`
- URL de base : `/txtengage/`
- Dossier de sortie : `.vercel/static/txtengage`
- Idéal pour un sous-dossier d'un site existant (ex: `https://monsite.com/txtengage/`)

## Scripts de Déploiement Complets

### Production (racine)
```bash
npm run deploy:production
```
Équivaut à : `npm run generate` puis `npm run deploy:ftp`

### Staging/Test (sous-dossier)
```bash
npm run deploy:staging
```
Équivaut à : `npm run generate:subfolder` puis `npm run deploy:ftp`

## Configuration Technique

La configuration se base sur la variable d'environnement `NUXT_APP_BASE_URL` :
- **Racine** : `NUXT_APP_BASE_URL=/`
- **Sous-dossier** : `NUXT_APP_BASE_URL=/txtengage/`

### Gestion automatique des assets
- Les chemins des assets CSS/JS sont ajustés automatiquement
- Les images et fichiers statiques suivent la configuration de base
- Generation d'un `index.html` correct pour chaque mode

### Structure de sortie
```
.vercel/static/          # Mode racine
├── index.html
├── _nuxt/
└── ...

.vercel/static/txtengage/  # Mode sous-dossier
├── index.html
├── txtengage/_nuxt/
└── ...
```

## Exemples d'utilisation

```bash
# Développement en mode racine
npm run dev

# Développement en mode sous-dossier
npm run dev:root

# Build pour production (racine)
npm run generate

# Build pour staging (sous-dossier)
npm run generate:subfolder

# Test local de la build
npm run preview
```

## Notes importantes

1. **Variables d'environnement** : La configuration se base sur `NUXT_APP_BASE_URL`
2. **Assets** : Tous les assets (CSS, JS, images) s'adaptent automatiquement
3. **Routing** : Le routeur Vue Router est configuré pour chaque mode
4. **SEO** : Les meta tags et liens canoniques s'adaptent à l'URL de base

## Résolution des problèmes

### Les assets ne se chargent pas
- Vérifiez que la variable `NUXT_APP_BASE_URL` est correcte
- Assurez-vous que le serveur web sert les fichiers depuis le bon dossier

### Erreurs de routage
- En mode sous-dossier, assurez-vous que votre serveur web redirige correctement vers `/txtengage/`
- Vérifiez la configuration de votre hébergeur (Vercel, Netlify, etc.)

# Guide de Déploiement - Vodafone TxtEngage

Ce guide vous explique comment déployer automatiquement votre projet Nuxt.js vers le dossier `txtengage` via FTP ou git-ftp.

## 🚀 Options de Déploiement

### 1. Déploiement FTP Classique (Recommandé)

#### Installation
```bash
npm install
```

#### Configuration
1. Copiez le fichier de configuration :
```bash
cp env.example .env
```

2. Éditez `.env` avec vos informations FTP :
```env
FTP_HOST=your-server.com
FTP_USER=your-username
FTP_PASSWORD=your-password
FTP_PORT=21
FTP_REMOTE_PATH=/public_html/txtengage
```

#### Déploiement
```bash
# Build + Déploiement automatique
npm run deploy:production

# Ou étape par étape
npm run generate:production
npm run deploy:ftp
```

### 2. Déploiement git-ftp

#### Installation de git-ftp
```bash
# macOS
brew install git-ftp

# Ubuntu/Debian
sudo apt-get install git-ftp

# Ou voir: https://github.com/git-ftp/git-ftp
```

#### Configuration automatique
```bash
./scripts/setup-git-ftp.sh
```

#### Déploiement
```bash
# Première fois
git ftp init --syncroot .output/public/

# Déploiements suivants
npm run deploy:git-ftp
```

### 3. Déploiement CI/CD Automatique

#### GitHub Actions
1. Allez dans **Settings > Secrets and variables > Actions**
2. Ajoutez ces secrets :
   - `FTP_HOST`
   - `FTP_USER` 
   - `FTP_PASSWORD`
   - `FTP_REMOTE_PATH`
   - `FTP_PORT` (optionnel)
   - `FTP_SECURE` (optionnel)

3. Le déploiement se fait automatiquement sur push vers `main`/`master`

#### GitLab CI
1. Allez dans **Settings > CI/CD > Variables**
2. Ajoutez les mêmes variables que GitHub Actions
3. Le déploiement se fait automatiquement selon la configuration

## 📁 Structure des Fichiers

```
├── .output/public/          # Fichiers générés par Nuxt
├── scripts/
│   ├── deploy-ftp.js       # Script FTP personnalisé
│   └── setup-git-ftp.sh    # Configuration git-ftp
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions
├── .gitlab-ci.yml          # GitLab CI
├── .git-ftp-config         # Config git-ftp
├── .git-ftp-ignore         # Exclusions git-ftp
└── env.example             # Template configuration
```

## 🛠️ Commandes Disponibles

```bash
# Build
npm run generate:subfolder      # Build avec base URL /txtengage/
npm run generate:production     # Build optimisé pour production

# Déploiement
npm run deploy:ftp             # FTP avec script custom
npm run deploy:git-ftp         # Déploiement git-ftp
npm run deploy:production      # Build + FTP
npm run deploy:staging         # Build + FTP staging

# Nettoyage
npm run clean                  # Nettoie tous les builds
npm run clean:build           # Nettoie dist et .output
```

## 🔧 Configuration Avancée

### Exclusions de Fichiers

Modifiez `.git-ftp-ignore` ou le script `deploy-ftp.js` pour exclure des fichiers :

```
# .git-ftp-ignore
*.map
.DS_Store
*.log
node_modules/
```

### Environnements Multiples

Pour déployer vers différents environnements :

```bash
# Production
FTP_REMOTE_PATH=/public_html/txtengage npm run deploy:ftp

# Staging
FTP_REMOTE_PATH=/public_html/txtengage/staging npm run deploy:ftp
```

### FTPS (FTP Sécurisé)

Activez FTPS dans votre `.env` :
```env
FTP_SECURE=true
FTP_PORT=990
```

## 🚨 Résolution de Problèmes

### Erreur de connexion FTP
- Vérifiez host, user, password
- Testez avec un client FTP (FileZilla)
- Vérifiez les ports (21 pour FTP, 990 pour FTPS)

### Erreur de chemin distant
- Vérifiez que le dossier `txtengage` existe
- Droits d'écriture sur le serveur
- Chemin absolu depuis la racine FTP

### Build qui échoue
```bash
npm run clean
npm install
npm run generate:production
```

### git-ftp ne fonctionne pas
```bash
# Réinitialiser git-ftp
git ftp init --syncroot .output/public/

# Vérifier la config
git config --list | grep git-ftp
```

## 📋 Checklist de Déploiement

- [ ] Configuration FTP dans `.env`
- [ ] Test de build local : `npm run generate:production`
- [ ] Test de connexion FTP
- [ ] Vérification du chemin distant
- [ ] Premiers déploiement : `npm run deploy:production`
- [ ] Vérification du site en ligne
- [ ] Configuration CI/CD (optionnel)

## 🔗 Liens Utiles

- [Documentation Nuxt.js](https://nuxt.com/docs)
- [git-ftp GitHub](https://github.com/git-ftp/git-ftp)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitLab CI](https://docs.gitlab.com/ee/ci/)

## 📞 Support

En cas de problème :
1. Vérifiez ce guide
2. Consultez les logs d'erreur
3. Testez en local avec `npm run generate:production`
4. Vérifiez la connectivité FTP

---

*Mis à jour pour le projet Vodafone TxtEngage* 