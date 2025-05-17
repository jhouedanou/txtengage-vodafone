import { ref, onUnmounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function useFullpageScrollTrigger() {
  // --- Refs et Variables d'état ---
  const sections = ref([]);
  const currentSectionIndex = ref(0);
  const isNavigating = ref(false);
  const hasScrolledOnce = ref(false); // True après la première interaction utilisateur
  const animationStates = ref({}); // Stocke l'état des animations spécifiques (ex: 'slide-73': true si terminée)

  // --- Constantes ---
  const SCROLLER_SELECTOR = "#master-scroll-container";

  // --- Variables Internes ---
  let stObserve = null; // Instance de ScrollTrigger.observe
  const keyboardListener = ref(null); // Référence au gestionnaire d'événements clavier
  const specificAnimationTriggers = []; // Pour stocker les instances de ScrollTrigger spécifiques à des slides

  // --- Gestion des Animations Spécifiques (ex: Slide 73) ---

  /**
   * Gère la première interaction utilisateur pour déclencher des animations initiales si nécessaire.
   * Actuellement utilisé pour l'animation de la slide-73 si elle est la première affichée.
   */
  const handleFirstInteraction = () => {
    if (hasScrolledOnce.value) return;
    hasScrolledOnce.value = true;

    const slide73Index = sections.value.findIndex(s => s.id === 'slide-73');
    if (slide73Index === 0 && currentSectionIndex.value === 0) {
      const slide73Section = sections.value.find(s => s.id === 'slide-73');
      // Déclencher seulement si l'animation n'est pas déjà terminée ou en cours par ScrollTrigger
      if (slide73Section && animationStates.value['slide-73'] !== true && animationStates.value['slide-73'] !== 'pending_st') {
        const pointsFortDiv = slide73Section.querySelector('.points-fort');
        const slidesContainerDiv = slide73Section.querySelector('.slides-container');

        animationStates.value['slide-73'] = false; // Marquer comme initiée par interaction

        if (pointsFortDiv) {
          gsap.to(pointsFortDiv, {
            x: 0,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
              if (animationStates.value['slide-73'] === false) { // S'assurer que ST n'a pas pris le dessus
                animationStates.value['slide-73'] = true;
              }
            }
          });
        }

        if (slidesContainerDiv) {
          gsap.to(slidesContainerDiv, {
            backgroundSize: '100%',
            backgroundPositionX: '-25vw',
            duration: 0.5,
            ease: 'power2.out',
          });
        }
        // Il est important de rafraîchir ScrollTrigger si des dimensions ou positions changent dynamiquement
        // avant que ScrollTrigger n'ait eu la chance de les recalculer.
        // Cependant, si l'animation ne change pas les dimensions/offsets de manière significative
        // pour les autres triggers, cela peut ne pas être toujours nécessaire ici.
        // ScrollTrigger.refresh(); // Peut être nécessaire dans certains cas.
      }
    }
  };

  /**
   * Configure les animations spécifiques pour la slide-73 via ScrollTrigger.
   */
  const registerSlide73Animation = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (!slide73Section) {
      // console.warn('ScrollTrigger Composable: Section slide-73 non trouvée pour l\'animation.');
      return;
    }
    const pointsFortDiv = slide73Section.querySelector('.points-fort');
    const slidesContainerDiv = slide73Section.querySelector('.slides-container');

    if (pointsFortDiv) {
      gsap.set(pointsFortDiv, { x: '100vw', autoAlpha: 1 });
    }
    if (slidesContainerDiv) {
      gsap.set(slidesContainerDiv, { backgroundSize: '100%', backgroundPositionX: '0vw' });
    }
    
    animationStates.value['slide-73'] = false; // Initialement, l'animation n'est pas terminée/déclenchée

    const st = ScrollTrigger.create({
      trigger: slide73Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%', // Ajuster selon le besoin
      // markers: true, // Pour débogage
      onEnter: (self) => {
        const slide73Index = sections.value.findIndex(s => s.id === 'slide-73');
        // Si c'est la première slide et qu'il n'y a pas eu d'interaction, on attend handleFirstInteraction
        if (slide73Index === 0 && currentSectionIndex.value === 0 && !hasScrolledOnce.value) {
          return;
        }

        // Déclencher si pas déjà fait par handleFirstInteraction ou un onEnter précédent
        if (!self.userData || !self.userData.triggeredST) {
          if (animationStates.value['slide-73'] === true) { // Déjà complétée par handleFirstInteraction
             if(self.userData) self.userData.triggeredST = true;
            return;
          }
          
          if(self.userData) self.userData.triggeredST = true;
          else self.userData = { triggeredST: true };
          
          animationStates.value['slide-73'] = 'pending_st'; // ST prend le relais

          if (pointsFortDiv) {
            gsap.to(pointsFortDiv, {
              x: 0,
              duration: 0.8,
              ease: 'power2.out',
              onComplete: () => {
                if (animationStates.value['slide-73'] === 'pending_st') {
                  animationStates.value['slide-73'] = true;
                }
              }
            });
          }

        if (slidesContainerDiv) {
          gsap.to(slidesContainerDiv, {
            backgroundSize: '100%',
            backgroundPositionX: '-25vw',
            duration: 0.5,
            ease: 'power2.out',
          });
        }
          // self.disable(); // Optionnel: désactiver après la première exécution
        }
      },
      onLeave: (self) => {
        // Optionnel: réinitialiser pour rejouer l'animation à chaque entrée
        // if (self.userData) self.userData.triggeredST = false;
        // gsap.set(pointsFortDiv, { x: '-100%', autoAlpha: 1 });
        // gsap.set(slidesContainerDiv, { backgroundSize: '200%', backgroundPositionX: '0vw' });
        // animationStates.value['slide-73'] = false;
      },
      onEnterBack: (self) => {
        // Similaire à onLeave si on veut rejouer l'animation en revenant par le haut
        // if (self.userData) self.userData.triggeredST = false;
      }
    });
    specificAnimationTriggers.push(st);
  };

  // --- Logique de Navigation ---

  /**
   * Navigue vers une section spécifique.
   * @param {number} index - L'index de la section cible.
   * @param {number} [duration=1] - La durée de l'animation de défilement.
   */
  const goToSection = (index, duration = 1) => {
    if (index < 0 || index >= sections.value.length || (isNavigating.value && duration !== 0)) {
      return;
    }
    if (index === currentSectionIndex.value && duration !== 0) {
      return;
    }

    const currentSectionElement = sections.value[currentSectionIndex.value];
    // Blocage si on est sur slide-73 et que son animation n'est pas complétée
    if (currentSectionElement && currentSectionElement.id === 'slide-73' && animationStates.value['slide-73'] !== true) {
      return;
    }

    isNavigating.value = true;
    gsap.to(SCROLLER_SELECTOR, {
      scrollTo: { y: sections.value[index], autoKill: false },
      duration: duration,
      ease: 'power2.inOut',
      onStart: () => {
        currentSectionIndex.value = index;
      },
      onComplete: () => {
        isNavigating.value = false;
      },
      onInterrupt: () => {
        isNavigating.value = false;
      }
    });
  };

  // --- Configuration des Observateurs et Gestionnaires d'Événements ---

  /**
   * Configure les observateurs de défilement (molette, tactile) et les écouteurs de clavier.
   */
  const setupFullpageObserver = () => {
    if (sections.value.length === 0) return;

    stObserve = ScrollTrigger.observe({
      target: SCROLLER_SELECTOR,
      type: "wheel,touch",
      debounce: false, // Ajuster si un délai est nécessaire
      onUp: () => {
        handleFirstInteraction();
        if (isNavigating.value) return;
        goToSection(currentSectionIndex.value - 1);
      },
      onDown: () => {
        handleFirstInteraction();
        if (isNavigating.value) return;
        const currentSectionElement = sections.value[currentSectionIndex.value];
        if (currentSectionElement && currentSectionElement.id === 'slide-73' && animationStates.value['slide-73'] !== true) {
          return; // Bloquer le défilement vers le bas si l'animation de la slide 73 n'est pas terminée
        }
        goToSection(currentSectionIndex.value + 1);
      },
    });

    keyboardListener.value = (e) => {
      handleFirstInteraction();
      if (isNavigating.value) return;

      let newIndex = currentSectionIndex.value;
      const currentSectionElement = sections.value[currentSectionIndex.value];

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (currentSectionElement && currentSectionElement.id === 'slide-73' && animationStates.value['slide-73'] !== true) {
          return; // Bloquer si animation slide 73 non terminée
        }
        newIndex++;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        newIndex--;
      }

      if (newIndex !== currentSectionIndex.value) {
        goToSection(newIndex);
      }
    };
    window.addEventListener('keydown', keyboardListener.value);
  };

  // --- Initialisation et Nettoyage ---

  /**
   * Initialise le composable avec les éléments de section.
   * @param {HTMLElement[]} sectionsElements - Un tableau d'éléments DOM représentant les sections.
   */
  const init = (sectionsElements) => {
    // S'assurer que sectionsElements est un tableau d'éléments DOM valides
    if (!Array.isArray(sectionsElements) || sectionsElements.some(el => !(el instanceof HTMLElement))) {
      // console.warn("ScrollTrigger Composable: 'sectionsElements' doit être un tableau d'éléments HTML.");
      return;
    }
    sections.value = sectionsElements; // Stocker les éléments DOM directement

    if (sections.value.length > 0) {
      nextTick(() => { // Attendre que le DOM soit potentiellement mis à jour par Vue
        registerSlide73Animation();
        setupFullpageObserver();
        goToSection(0, 0); // Aller à la première section sans animation
        ScrollTrigger.refresh(); // Rafraîchir après la configuration initiale
      });
    }
  };

  /**
   * Nettoie les instances de ScrollTrigger, les écouteurs d'événements et les tweens GSAP.
   */
  const cleanup = () => {
    if (stObserve) {
      stObserve.kill();
      stObserve = null;
    }
    if (keyboardListener.value) {
      window.removeEventListener('keydown', keyboardListener.value);
      keyboardListener.value = null;
    }
    specificAnimationTriggers.forEach(st => st.kill());
    specificAnimationTriggers.length = 0;
    gsap.killTweensOf(SCROLLER_SELECTOR);

    // Réinitialisation de l'état
    currentSectionIndex.value = 0;
    isNavigating.value = false;
    hasScrolledOnce.value = false;
    Object.keys(animationStates.value).forEach(key => delete animationStates.value[key]);
    sections.value = [];
  };

  onUnmounted(cleanup);

  return {
    currentSectionIndex,
    isNavigating,
    init,
    goToSection,
    // cleanup n'est généralement pas exposé car géré par onUnmounted
  };
}