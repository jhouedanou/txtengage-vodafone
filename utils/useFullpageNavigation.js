import { ref, onMounted, onUnmounted } from 'vue';
import fullpage from 'fullpage.js';
import 'fullpage.js/dist/fullpage.css';

/**
 * Composable de navigation plein-écran basé sur fullpage.js.
 *  - Gère l'index de section actif (0-based)
 *  - Fournit goTo(idx) et (un)blockScroll(direction)
 *  - Expose les callbacks onLeave/onEnter pour brancher des animations
 *
 * @example
 * const { currentIndex, goTo, blockScroll } = useFullpageNavigation({
 *   onEnter(dest, dir, api) {
 *      // api.blockScroll('down');
 *   }
 * });
 */
export function useFullpageNavigation (options = {}) {
  const currentIndex = ref(0);   // Index 0-based de la section visible
  const fp           = ref(null); // Instance fullpage

  /* ------------------------------------------------------------------
   * Helpers pour (dé)bloquer le scroll.
   * direction = 'up', 'down', 'left', 'right' ou 'all'
   * ----------------------------------------------------------------*/
  const blockScroll   = (direction = 'all') => fp.value?.setAllowScrolling(false, direction);
  const unblockScroll = (direction = 'all') => fp.value?.setAllowScrolling(true , direction);

  /** Navigue vers l'index (0-based) souhaité */
  const goTo = idx => {
    if (typeof idx === 'number' && fp.value) {
      fp.value.moveTo(idx + 1); // API fullpage est 1-based
    }
  };

  /* ------------------------------------------------------------------
   * Destruction propre
   * ----------------------------------------------------------------*/
  const destroy = () => {
    if (fp.value) {
      fp.value.destroy('all');
      fp.value = null;
    }
  };

  /* ------------------------------------------------------------------
   * Initialisation – démarre après montage du composant Vue
   * ----------------------------------------------------------------*/
  onMounted(() => {
    fp.value = new fullpage('#master-scroll-container', {
      // Configuration minimale – peut être étendue via options.fullpage
      licenseKey      : 'OPEN-SOURCE-GPLV3-LICENSE',
      sectionSelector : '.slide-section',
      scrollingSpeed  : 800,
      // Merge custom options
      ...options.fullpage,
      /* --------------------------------------------------------------
       * Callbacks onLeave / afterLoad => relaient vers l'appelant
       * ------------------------------------------------------------*/
      onLeave(origin, destination, direction) {
        currentIndex.value = destination.index;
        options?.onLeave?.(origin, destination, direction, { blockScroll, unblockScroll });
      },
      afterLoad(origin, destination, direction) {
        currentIndex.value = destination.index;
        options?.onEnter?.(destination, direction, { blockScroll, unblockScroll });
      }
    });
  });

  onUnmounted(destroy);

  return { currentIndex, goTo, blockScroll, unblockScroll, destroy };
}