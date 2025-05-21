hought Process

Voici la solution pour gérer le comportement spécifique sur slide-73 avec du code prêt à l'emploi :

Dans FullpageWrapper.vue :

javascript
CopyInsert
// États pour l'animation de la slide 73
import { ref } from 'vue'; // Adaptez selon votre setup (Options API ou Composition API)

const slide73HighlightAnimationPlayed = ref(false);
const isSlide73HighlightAnimating = ref(false);

// Dans votre initialisation de FullPage.js
new fullpage('#fullpage', {
  anchors: ['section1', 'slide-73', 'section3'], // Adaptez selon vos anchors actuels
  // ... vos autres options FullPage.js existantes
  
  onLeave: function(origin, destination, direction) {
    const fpApi = this;
    
    if (origin.anchor === 'slide-73' &&
        direction === 'down' &&
        !slide73HighlightAnimationPlayed.value &&
        !isSlide73HighlightAnimating.value) {
      
      isSlide73HighlightAnimating.value = true;
      
      // Bloquer le défilement de FullPage.js
      fpApi.setAllowScrolling(false, 'down');
      fpApi.setKeyboardScrolling(false, 'down');
      
      // Déclencher l'animation dans Slide73.vue
      window.dispatchEvent(new CustomEvent('trigger-slide73-highlights-animation'));
      
      // Attendre la fin de l'animation
      const onAnimationComplete = () => {
        slide73HighlightAnimationPlayed.value = true;
        isSlide73HighlightAnimating.value = false;
        
        // Réautoriser le scroll
        fpApi.setAllowScrolling(true);
        fpApi.setKeyboardScrolling(true);
        
        window.removeEventListener('slide73-highlights-animation-complete', onAnimationComplete);
      };
      
      window.addEventListener('slide73-highlights-animation-complete', onAnimationComplete, { once: true });
      
      return false; // Empêche la transition de FullPage.js
    }
    
    // Pour tous les autres cas, autoriser le défilement normal
    return true;
  }
});
Dans Slide73.vue :

javascript
CopyInsert
// Dans le composant (Options API)
export default {
  // ... votre code existant
  
  methods: {
    playHighlightsAnimation() {
      // Votre animation GSAP pour les "points forts"
      const tl = gsap.timeline({
        onComplete: () => {
          // Émettre un événement une fois l'animation terminée
          window.dispatchEvent(new CustomEvent('slide73-highlights-animation-complete'));
        }
      });
      
      // Exemple d'animation - à adapter selon vos besoins spécifiques
      tl.to('.point-fort', { 
        opacity: 1, 
        y: -20, 
        stagger: 0.2, 
        duration: 0.8,
        ease: "power2.out"
      });
    }
  },
  
  mounted() {
    // S'abonner à l'événement pour démarrer l'animation
    window.addEventListener('trigger-slide73-highlights-animation', this.playHighlightsAnimation);
  },
  
  beforeUnmount() { // ou beforeDestroy dans Vue 2
    // Se désabonner pour éviter les fuites de mémoire
    window.removeEventListener('trigger-slide73-highlights-animation', this.playHighlightsAnimation);
  }
}
Alternative avec la Composition API (pour Slide73.vue) :

javascript
CopyInsert
// Dans le <script setup> de Slide73.vue
import { onMounted, onBeforeUnmount } from 'vue';
import gsap from 'gsap';

function playHighlightsAnimation() {
  const tl = gsap.timeline({
    onComplete: () => {
      window.dispatchEvent(new CustomEvent('slide73-highlights-animation-complete'));
    }
  });
  
  tl.to('.point-fort', { 
    opacity: 1, 
    y: -20, 
    stagger: 0.2, 
    duration: 0.8,
    ease: "power2.out"
  });
}

onMounted(() => {
  window.addEventListener('trigger-slide73-highlights-animation', playHighlightsAnimation);
});

onBeforeUnmount(() => {
  window.removeEventListener('trigger-slide73-highlights-animation', playHighlightsAnimation);
});
Résumé du fonctionnement:

Quand l'utilisateur scroll vers le bas sur la slide-73, le callback onLeave intercepte ce scroll.
Le scroll FullPage.js est bloqué avec setAllowScrolling(false, 'down').
Un événement trigger-slide73-highlights-animation est envoyé.
Slide73.vue reçoit cet événement et lance l'animation GSAP.
Quand l'animation est terminée, Slide73.vue émet slide73-highlights-animation-complete.
FullpageWrapper.vue réactive le scroll avec setAllowScrolling(true).
Au prochain scroll, comme slide73HighlightAnimationPlayed est maintenant true, le défilement normal vers la section suivante sera autorisé.
Ce code est directement utilisable - vous devrez simplement l'adapter à vos noms de classe CSS spécifiques et à la structure exacte de votre animation GSAP.