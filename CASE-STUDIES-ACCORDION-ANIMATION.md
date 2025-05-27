# Animation Accordéon pour les Case Studies - Slide 128

## 🎯 Objectif
Modifier l'animation des case studies dans la slide 128 pour qu'elle fonctionne comme un accordéon, avec des animations de hauteur au lieu de simples transitions d'opacité.

## ✅ Modifications Implémentées

### Desktop (`utils/useFullpageScrollTrigger.js`)

#### 1. Initialisation Accordéon
- **Lignes modifiées** : Initialisation des `.case-study-content`
- **Changement** : Utilisation de `height`, `padding-top`, `padding-bottom` au lieu de `autoAlpha`
- **Logique** :
  - Premier item : `height: 'auto'`, `overflow: 'visible'`, `autoAlpha: 1`
  - Autres items : `height: 0`, `overflow: 'hidden'`, `autoAlpha: 0`, `padding: 0`

#### 2. Animation Forward (scrollSlide128Forward)
```javascript
// Obtenir la hauteur naturelle du contenu suivant
gsap.set(nextContent, { height: 'auto', overflow: 'hidden', autoAlpha: 0 });
const nextHeight = nextContent.scrollHeight;
gsap.set(nextContent, { height: 0, autoAlpha: 1 });

// Animation accordéon : fermer le current, ouvrir le next
tl.to(currentContent, {
  height: 0,
  paddingTop: 0,
  paddingBottom: 0,
  duration: getTweenDuration(),
  ease: getTweenEase()
}, 0)
.to(nextContent, {
  height: nextHeight,
  paddingTop: nextContent.dataset.originalPaddingTop || '20px',
  paddingBottom: nextContent.dataset.originalPaddingBottom || '20px',
  duration: getTweenDuration(),
  ease: getTweenEase()
}, 0);
```

#### 3. Animation Backward (scrollSlide128Backward)
- **Principe identique** : Animation de hauteur avec padding
- **Direction** : Du current vers le précédent au lieu du suivant

#### 4. Reset Animation (resetSlide128Animation)
- **Réinitialisation** : Premier item ouvert, autres fermés avec `height: 0`

### Mobile (`utils/mobileAnimations.js`)

#### 1. Initialisation Mobile Accordéon
- **Adaptation** : Même logique que desktop mais optimisée pour mobile
- **Durées** : Légèrement plus lentes (0.6s) pour mobile

#### 2. Animations Forward/Reverse Mobile
```javascript
// Obtenir la hauteur pour l'animation mobile
gsap.set(nextContent, { height: 'auto', overflow: 'hidden', autoAlpha: 0 });
const nextHeight = nextContent.scrollHeight;
gsap.set(nextContent, { height: 0, autoAlpha: 1 });

// Animation accordéon mobile
tl.to(currentContent, {
  height: 0,
  paddingTop: 0,
  paddingBottom: 0,
  duration: 0.6, // Plus lent sur mobile
  ease: 'power3.easeInOut'
}, 0)
.to(nextContent, {
  height: nextHeight,
  paddingTop: nextContent.dataset.originalPaddingTop || '20px',
  paddingBottom: nextContent.dataset.originalPaddingBottom || '20px',
  duration: 0.6,
  ease: 'power3.easeInOut'
}, 0);
```

#### 3. SetToFinalState Mobile
- **Modification** : État final avec dernier item ouvert en accordéon
- **Gestion** : `height: 'auto'` pour actif, `height: 0` pour inactifs

## 🔧 Caractéristiques Techniques

### Avantages de l'Animation Accordéon
1. **Plus naturelle** : Le contenu se déploie/replie visuellement
2. **Meilleure UX** : L'utilisateur voit physiquement l'expansion/contraction
3. **Smooth** : Transitions fluides avec GSAP
4. **Responsive** : Adapté desktop et mobile

### Optimisations GSAP
- **Mesure automatique** : `scrollHeight` pour obtenir la hauteur naturelle
- **États finaux** : `height: 'auto'` après animation pour maintenir la flexibilité
- **Gestion overflow** : `hidden` pendant animation, `visible` à la fin
- **Padding animé** : Conservation de l'espacement visuel

## 🎨 Comportement Visuel

### Animation Forward
1. Le contenu actuel se contracte (`height: 0`)
2. Le padding disparaît progressivement 
3. Simultanément, le contenu suivant s'expand (`height: scrollHeight`)
4. Le padding du suivant apparaît progressivement

### Animation Backward
1. Même principe mais en sens inverse
2. Du contenu actuel vers le précédent

### États Stables
- **Item actif** : `height: auto`, `overflow: visible`, padding complet
- **Items inactifs** : `height: 0`, `overflow: hidden`, padding zéro

## 📱 Responsive
- **Desktop** : Durées standard avec `getTweenDuration()`
- **Mobile** : Durées légèrement plus longues (0.6s) pour plus de fluidité
- **Easing** : `power3.easeInOut` sur mobile, configurable sur desktop

## 🔄 Intégration
- ✅ **Scroll navigation** : Compatible avec le système de navigation par scroll
- ✅ **États persistants** : Les états sont correctement maintenus
- ✅ **Classes CSS** : Classes `.active` gérées correctement
- ✅ **Reset/Final states** : Fonctions de reset et état final adaptées

## 🎯 Résultat Final
L'animation des case studies fonctionne maintenant comme un accordéon naturel où chaque section se déploie et se replie avec des animations de hauteur fluides, offrant une meilleure expérience utilisateur que les simples transitions d'opacité. 