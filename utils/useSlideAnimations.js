import { ref } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Importation des helpers d'animation existants
import {
  registerSlide20Animation,
  registerSlide21Animation,
  registerSlide22Animation,
  registerSlide23Animation,
  registerSlide59Animation,
  registerSlide73Animation,
  registerSlide128Animation,
} from './useFullpageScrollTrigger';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/**
 * Composable pour enregistrer et initialiser toutes les animations GSAP / ScrollTrigger.
 * Simplifie la réutilisation des fonctions d'animation existantes.
 *
 * @example
 * const { init } = useSlideAnimations();
 * onMounted(() => init(sectionsArray));
 */
export function useSlideAnimations () {
  // État partagé pour suivre si une animation a déjà été jouée
  const animationStates = ref({});

  /**
   * Initialise toutes les animations pour les sections transmises.
   * @param {HTMLElement[]} sections - Tableau des éléments section (.slide-section)
   * @param {Object} opts - Options additionnelles (ex. options slide128)
   */
  const init = (sections, opts = {}) => {
    if (!Array.isArray(sections) || sections.some(el => !(el instanceof HTMLElement))) {
      // eslint-disable-next-line no-console
      console.warn('[useSlideAnimations] sections array invalide.');
      return;
    }

    // Chaque registre reçoit (sections, animationStates) pour rester stateless
    registerSlide20Animation (sections, animationStates);
    registerSlide21Animation (sections, animationStates);
    registerSlide22Animation (sections, animationStates);
    registerSlide23Animation (sections, animationStates);
    registerSlide59Animation (sections, animationStates);
    registerSlide73Animation (sections, animationStates);
    registerSlide128Animation(sections, {
      ...opts.slide128,
      animationStates
    });
  };

  return { init, animationStates };
}