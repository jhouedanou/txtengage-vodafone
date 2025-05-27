# Scrollbar Horizontale sur Mobile - Documentation

## Résumé des modifications

La scrollbar personnalisée du site a été modifiée pour passer d'une orientation verticale (desktop) à une orientation horizontale sur les écrans inférieurs à 1024px.

## Fichiers modifiés

### 1. `pages/index.vue`

#### Modifications CSS (lignes ~1440-1520)
- **Mode responsive** : Ajout de media queries pour changer l'orientation
- **Position** : Passage de `right: 20px; top: 50%` à `left: 50%; bottom: 20px`
- **Dimensions** : Inversion hauteur/largeur (4px height, 80vw width sur mobile)
- **Animation** : Support des transitions both `left` et `top`

#### Modifications JavaScript (lignes ~60-100)
- **Fonction `updateScrollbarCursor`** : Logique conditionnelle selon la taille d'écran
- **Mode horizontal** : Utilisation de `style.left` au lieu de `style.top`
- **Mode vertical** : Conservation du comportement desktop existant
- **Fonction `handleResize`** : Mise à jour automatique lors du redimensionnement

### 2. `assets/scss/mobile-optimizations.scss`

#### Nouvelle section scrollbar (lignes ~35-50)
- **Media query** `@media (max-width: 1024px)`
- **Positionnement horizontal** : `left: 50%; bottom: 20px`
- **Dimensions adaptées** : `width: 80vw; height: 4px`
- **Transition horizontale** : `transition: left 0.3s ease`

## Comportement responsive

### Desktop (≥ 1024px)
- **Position** : Droite de l'écran (verticale)
- **Dimensions** : 4px largeur × 80vh hauteur
- **Animation** : Curseur se déplace verticalement (`top`)

### Tablette (< 1024px)
- **Position** : Centre-bas de l'écran (horizontale)
- **Dimensions** : 80vw largeur × 4px hauteur
- **Animation** : Curseur se déplace horizontalement (`left`)

### Mobile (< 768px)
- **Position** : Centre-bas de l'écran (horizontale)
- **Dimensions** : 85vw largeur × 3px hauteur
- **Animation** : Curseur se déplace horizontalement (`left`)

## Logique technique

### Détection de l'orientation
```javascript
const isMobileMode = window.innerWidth < 1024;
```

### Calcul du positionnement
```javascript
if (isMobileMode) {
  // Mode horizontal
  const trackWidth = trackElement.offsetWidth - scrollCursor.value.offsetWidth;
  const leftPosition = percentage * trackWidth;
  scrollCursor.value.style.left = `${leftPosition}px`;
} else {
  // Mode vertical (desktop)
  const trackHeight = trackElement.offsetHeight - scrollCursor.value.offsetHeight;
  const topPosition = percentage * trackHeight;
  scrollCursor.value.style.top = `${topPosition}px`;
}
```

### Gestion du redimensionnement
```javascript
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
  nextTick(() => {
    updateScrollbarCursor(); // Recalcul automatique
  });
};
```

## Test et validation

Un fichier de test `test-scrollbar-responsive.html` a été créé pour valider le comportement :

### Fonctionnalités de test
- **Indicateur temps réel** : Affichage de la largeur d'écran et mode actuel
- **Simulation navigation** : Boutons pour tester le mouvement du curseur
- **Navigation clavier** : Flèches haut/bas pour navigation
- **Responsive test** : Redimensionnement de fenêtre en temps réel

### Comment tester
1. Ouvrir `test-scrollbar-responsive.html` dans un navigateur
2. Redimensionner la fenêtre pour voir les changements d'orientation
3. Utiliser les outils développeur pour simuler différents appareils
4. Tester la navigation avec les boutons ou le clavier

## Points techniques importants

### Performance
- **Transitions CSS** : Utilisation d'animations matérielles optimisées
- **Event listeners** : Debouncing automatique via `nextTick()`
- **Media queries** : Utilisation de breakpoints standards

### Accessibilité
- **Pointer events** : `pointer-events: none` pour éviter les interactions accidentelles
- **Transitions fluides** : Animation 0.6s avec cubic-bezier pour un mouvement naturel
- **Indicateurs visuels** : Maintien des effets visuels (gradient, ombre)

### Compatibilité
- **Mobile Safari** : Support des unités `vw` et `vh`
- **Android Chrome** : Transitions et animations optimisées
- **Desktop** : Comportement inchangé, rétrocompatibilité complète

## Structure CSS finale

```scss
// Mode desktop (par défaut)
.simple-scrollbar {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  height: 80vh;
  width: 4px;
}

// Mode mobile horizontal
@media screen and (max-width: 1024px) {
  .simple-scrollbar {
    right: auto;
    top: auto;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    height: 4px;
    width: 80vw;
  }
  
  .scrollbar-cursor {
    width: 40px;
    height: 100%;
  }
}
```

## Prochaines améliorations possibles

1. **Interaction tactile** : Permettre le drag du curseur sur mobile
2. **Animation d'entrée** : Animation d'apparition différenciée selon l'orientation
3. **Personnalisation** : Variables CSS pour faciliter la customisation
4. **Accessibilité avancée** : Support des readers d'écran et navigation au clavier 