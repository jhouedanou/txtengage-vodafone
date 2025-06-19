# Fonctionnalités Slides Actives et Hamburger Rouge

## Résumé des modifications

Ce document explique les nouvelles fonctionnalités ajoutées pour gérer les classes actives sur les slides et la couleur du hamburger.

## Fonctionnalités implémentées

### 1. Classe `active` sur les sections

- **Objectif** : Ajouter automatiquement la classe `active` à la div `.slide-section` actuellement visible
- **Implémentation** : 
  - Modification de la fonction `setupSectionScrolling()` dans `pages/index.vue`
  - Utilisation des événements ScrollTrigger (`onEnter`, `onEnterBack`, `onLeave`, `onLeaveBack`)
  - Gestion automatique de l'ajout/suppression de la classe `active`

### 2. Hamburger rouge sur slides spécifiques

- **Objectif** : Si `#slide-59` ou `#slide-128` ont la classe `.active`, alors ajouter la classe `hamburger-red` au `.hamburger`
- **Slides concernées** : 59, 128 (SLIDE-73 EXCLUE car nécessite hamburger blanc pour visibilité du #subint)
- **Implémentation** :
  - Logique JavaScript dans `setupSectionScrolling()` (événements `onEnter` et `onEnterBack`)
  - Watcher sur `activeSlideId` pour les changements dynamiques
  - Initialisation correcte au chargement de la page
  - Styles CSS spécifiques pour les trois slides

### 3. Styles CSS associés

- **Classes CSS** : `hamburger-red` et `hamburger-white`
- **Sélecteurs spécifiques** : `.slide-section#slide-59.active`, `.slide-section#slide-128.active` (slide-73 exclue)
- **Effets visuels** : Box-shadow, hover effects, transitions

## Fichiers modifiés

### `pages/index.vue`
- Fonction `setupSectionScrolling()` : gestion des classes actives et hamburger
- Section `onMounted` : initialisation du hamburger
- Watcher `activeSlideId` : changements dynamiques

### `assets/scss/style.scss`
- Styles pour `.slide-section.active`
- Styles pour `.hamburger.hamburger-red` et `.hamburger.hamburger-white`
- Sélecteurs spécifiques pour les slides 59, 73 et 128

## Fonctionnement

1. **Au scroll** : ScrollTrigger détecte l'entrée/sortie des sections
2. **Gestion des classes** : 
   - Suppression de `active` de toutes les sections
   - Ajout de `active` à la section visible
3. **Hamburger dynamique** :
   - Si slide 59, 73 ou 128 → hamburger rouge
   - Sinon → hamburger blanc
4. **Logs de debug** : Console.log pour suivre les changements

## Debug

- Script de debug disponible : `/public/js/debug-slides.js`
- Logs console : `🍔 Hamburger rouge sur slide-XX` ou `🍔 Hamburger blanc sur slide-XX`
- Vérification manuelle : inspection des classes `active`, `hamburger-red`, `hamburger-white`

## Tests

Pour tester les fonctionnalités :

1. Naviguer vers les slides 59, 128 → hamburger doit être rouge (slide-73 → hamburger blanc)
2. Naviguer vers d'autres slides → hamburger doit être blanc
3. Vérifier les classes dans l'inspecteur DevTools
4. Contrôler les logs dans la console

## Performance

- Utilisation de `nextTick()` pour les mises à jour DOM
- Classes `will-change` pour optimiser les animations
- Gestion efficace des événements ScrollTrigger

## Notes techniques

- Compatible desktop et mobile
- Transitions CSS fluides (0.3s ease)
- Gestion des conflits de classes automatique
- Fallbacks pour les navigateurs anciens

## Troubleshooting

Si le hamburger ne change pas de couleur :
1. Vérifier que le slide-59 existe dans le DOM
2. Contrôler que la classe `active` est bien ajoutée
3. Utiliser `window.debugSlides.checkCurrentState()` pour diagnostiquer

Si les classes `active` ne s'ajoutent pas :
1. Vérifier que ScrollTrigger est initialisé
2. Contrôler la console pour les erreurs
3. S'assurer que les sections ont bien l'attribut `data-slide-id` 