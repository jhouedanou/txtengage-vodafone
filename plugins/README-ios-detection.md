# iOS Detection Plugin

Ce plugin Nuxt détecte automatiquement les appareils iOS et ajoute des attributs de données et des classes CSS pour faciliter le ciblage spécifique iOS.

## Installation

Le plugin est automatiquement chargé par Nuxt. Aucune configuration supplémentaire n'est nécessaire.

## Fonctionnalités

### Détection automatique
- ✅ iPhone, iPad, iPod
- ✅ Version iOS 
- ✅ Safari iOS
- ✅ Orientation (portrait/landscape)
- ✅ Dimensions d'écran
- ✅ Ratio de pixels

### Attributs ajoutés au `<html>`

#### Attributs de données
```html
<!-- Détection iOS de base -->
<html data-ios="true|false">

<!-- Type d'appareil -->
<html data-ios-device="iphone|ipad|ipod">

<!-- Version iOS -->
<html data-ios-version="17.2.1" data-ios-major="17">

<!-- Safari iOS -->
<html data-ios-safari="true">

<!-- Orientation -->
<html data-orientation="portrait|landscape">

<!-- Mobile général -->
<html data-mobile="true|false">

<!-- Informations d'écran -->
<html data-screen-width="375" data-screen-height="812" data-pixel-ratio="3">
```

#### Classes CSS
```html
<!-- Classes iOS -->
<html class="is-ios">           <!-- Sur iOS -->
<html class="is-not-ios">       <!-- Pas sur iOS -->
<html class="is-iphone">        <!-- iPhone spécifiquement -->
<html class="is-ipad">          <!-- iPad spécifiquement -->
<html class="is-ios-safari">    <!-- Safari iOS -->

<!-- Classes orientation -->
<html class="is-portrait">      <!-- Mode portrait -->
<html class="is-landscape">     <!-- Mode paysage -->

<!-- Classes mobile/desktop -->
<html class="is-mobile">        <!-- Appareil mobile -->
<html class="is-desktop">       <!-- Appareil desktop -->
```

## Exemples d'utilisation CSS

### Ciblage de base
```css
/* Tous les appareils iOS */
html.is-ios {
  -webkit-overflow-scrolling: touch;
}

/* Seulement les iPhones */
html.is-iphone .header {
  padding-top: env(safe-area-inset-top);
}

/* Seulement les iPads */
html.is-ipad .sidebar {
  width: 300px;
}

/* Safari iOS spécifiquement */
html.is-ios-safari .viewport {
  height: -webkit-fill-available;
}
```

### Ciblage par version iOS
```css
/* iOS 17 et plus */
html[data-ios-major="17"] {
  /* Nouvelles fonctionnalités iOS 17 */
}

/* Version iOS spécifique */
html[data-ios-version="16.5.1"] {
  /* Correctifs pour cette version */
}
```

### Ciblage par orientation
```css
/* iPhone en mode portrait */
html.is-iphone.is-portrait .nav {
  height: 60px;
}

/* iPad en mode paysage */
html.is-ipad.is-landscape .content {
  flex-direction: row;
}
```

### Ciblage par taille d'écran
```css
/* iPhone 12/13/14 standard */
html[data-screen-width="375"] .element {
  font-size: 16px;
}

/* iPhone Pro Max */
html[data-screen-width="414"] .element {
  font-size: 18px;
}

/* iPad */
html[data-screen-width="1024"] .element {
  font-size: 20px;
}
```

## Cas d'usage courants

### Gestion des Safe Areas iOS
```css
html.is-ios {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Correction du viewport Safari
```css
html.is-ios-safari .full-height {
  height: 100vh;
  height: -webkit-fill-available;
}
```

### Désactiver les effets hover sur iOS
```css
html.is-ios .button:hover {
  background-color: initial;
}
```

### Optimisations de performance iOS
```css
html.is-ios .animated-element {
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
}
```

## Logs de débogage

Le plugin affiche les informations de détection dans la console :
```javascript
// Console output example
iOS Detection Plugin: {
  isiOS: true,
  isiPhone: true,
  isiPad: false,
  isiPod: false,
  isiOSSafari: true,
  isProbablyiPad: false,
  iOSVersion: "17.2.1",
  screenWidth: 375,
  screenHeight: 812,
  devicePixelRatio: 3
}
```

## Notes importantes

- Le plugin s'exécute uniquement côté client (`.client.ts`)
- Les attributs sont ajoutés après le chargement du DOM
- L'orientation est mise à jour automatiquement lors des rotations
- Compatible avec les nouvelles détections d'iPad (iOS 13+)

## Fichier d'exemples CSS

Voir `assets/css/ios-targeting.css` pour des exemples complets et des bonnes pratiques. 