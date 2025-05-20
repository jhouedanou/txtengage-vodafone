# Template vue pour Wordpress - Txt Engage Vodafone

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Guide du système d'animation

Le projet utilise GSAP avec ScrollTrigger pour gérer les animations et la navigation entre les sections. Le fichier principal qui gère ces fonctionnalités est `utils/useFullpageScrollTrigger.js`.

### Structure du composable useFullpageScrollTrigger

Le fichier est organisé en sections distinctes pour faciliter la maintenance :

```
1. CONFIGURATION ET VARIABLES GÉNÉRALES
2. INITIALISATION ET NETTOYAGE
3. MÉCANISMES GLOBAUX DE NAVIGATION
4. ANIMATION DE LA SLIDE 20 (TURTLE BEACH)
5. ANIMATION DE LA SLIDE 21
6. ANIMATION DE LA SLIDE 22
7. ANIMATION DE LA SLIDE 23 (PERDRIX)
8. ANIMATION DE LA SLIDE 73 (POINTS FORTS)
9. ANIMATION DE LA SLIDE 59
10. ANIMATION DE LA SLIDE 128 (CASE STUDY)
11. NAVIGATION ENTRE SLIDES
12. SYSTÈME D'OBSERVATION DU SCROLL
```

### Comment modifier les animations existantes

#### Modifier l'animation d'une slide existante

1. Localisez la section correspondante dans `useFullpageScrollTrigger.js` (ex: `SECTION 4: ANIMATION DE LA SLIDE 20`)
2. Modifiez la fonction `registerSlideXXAnimation()` correspondante
3. Les animations utilisent GSAP et fonctionnent typiquement avec :
   - `gsap.to()` / `gsap.from()` / `gsap.fromTo()` pour les animations
   - `ScrollTrigger.create()` pour les déclencheurs basés sur le scroll
   - `animationStates.value['slide-XX']` pour suivre l'état des animations

#### Ajouter une nouvelle animation de slide

1. Créez une nouvelle fonction `registerSlideXXXAnimation()` en vous basant sur une existante
2. Ajoutez votre fonction dans la section `init()` pour qu'elle soit activée au démarrage :

```javascript
if (sections.value.length > 0) {
  // Enregistrement des animations pour chaque slide
  registerSlide20Animation();
  registerSlide21Animation();
  // Ajoutez votre nouvelle fonction ici
  registerSlideXXXAnimation();
  // ...
}
```

3. Exposez la fonction dans le retour du composable pour qu'elle soit accessible de l'extérieur :

```javascript
return {
  currentSectionIndex,
  isNavigating,
  init,
  goToSection,
  // Ajouter votre fonction ici
  registerSlideXXXAnimation,
  // ...
};
```

### Types d'animations courantes

#### Animation initiale à l'arrivée sur une slide

Exemple adapté de la slide-20 :

```javascript
const playSlideInitialAnimation = (sectionElement) => {
  // Éléments à animer
  const mainElement = sectionElement.querySelector('#main-element');
  const textElements = sectionElement.querySelectorAll('.text-element');
  
  // Initialisation (état de départ)
  gsap.set(mainElement, { scale: 0, autoAlpha: 1 });
  gsap.set(textElements, { y: 50, autoAlpha: 0 });
  
  // Timeline d'animation
  const tl = gsap.timeline({
    onComplete: () => {
      // Marquer l'animation comme terminée
      animationStates.value['slide-XX-initialAnimPlayed'] = true;
    }
  });
  
  // Séquence d'animations
  tl.to(mainElement, { scale: 1, duration: 0.8, ease: 'power2.out' })
    .to(textElements, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.1 }, '-=0.3');
};
```

#### Animation séquentielle contrôlée par le scroll

Exemple adapté de la slide-59 :

```javascript
// Dans registerSlideXXAnimation
slide.addEventListener('custom-scroll', (e) => {
  const direction = e.detail.direction;
  
  if (direction === 'down') {
    if (animationStates.value['slide-XX'] < maxSteps) {
      animationStates.value['slide-XX']++;
      playNextStep(animationStates.value['slide-XX']);
    } else {
      goToSection(currentSectionIndex.value + 1);
    }
  } else if (direction === 'up') {
    if (animationStates.value['slide-XX'] > 0) {
      animationStates.value['slide-XX']--;
      playPrevStep(animationStates.value['slide-XX']);
    } else {
      goToSection(currentSectionIndex.value - 1);
    }
  }
});

// Dans setupFullpageObserver (onDown/onUp)
if (currentSection && currentSection.id === 'slide-XX') {
  const event = new CustomEvent('custom-scroll', { detail: { direction: 'down' } });
  currentSection.dispatchEvent(event);
  return;
}
```

### Déboguer les animations

Pour faciliter le débogage :

1. Vous pouvez activer les marqueurs de ScrollTrigger :
```javascript
ScrollTrigger.create({
  trigger: element,
  markers: true, // Affiche des indicateurs visuels
  // ...
});
```

2. Pour voir l'état actuel des animations :
```javascript
console.table(animationStates.value);
```

N'oubliez pas de supprimer tous les `console.log` avant la mise en production.