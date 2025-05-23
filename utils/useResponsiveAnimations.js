import { ref, readonly, onMounted, onUnmounted, nextTick } from 'vue';
import { useFullpageScrollTrigger } from './useFullpageScrollTrigger.js';
import { useMobileAnimations } from './mobileAnimations.js';

// Système de commutation intelligent entre animations desktop et mobile
export function useResponsiveAnimations() {
  // Variables d'état
  const isMobile = ref(false);
  const isInitialized = ref(false);
  const currentAnimationSystem = ref(null);
  
  // Instances des systèmes d'animation
  let desktopAnimations = null;
  let mobileAnimations = null;
  
  // Seuil de largeur d'écran pour le mobile (moins de 1024px)
  const MOBILE_BREAKPOINT = 1024;
  
  // Observer pour détecter les changements de taille d'écran
  let resizeObserver = null;
  let resizeTimeout = null;

  // Fonction pour détecter si on est sur mobile
  const checkIsMobile = () => {
    return window.innerWidth < MOBILE_BREAKPOINT;
  };

  // Fonction pour nettoyer le système d'animation actuel
  const cleanupCurrentSystem = () => {
    if (currentAnimationSystem.value === 'desktop' && desktopAnimations) {
      console.log('🧹 Nettoyage des animations desktop');
      desktopAnimations.cleanup?.();
      desktopAnimations = null;
    } else if (currentAnimationSystem.value === 'mobile' && mobileAnimations) {
      console.log('🧹 Nettoyage des animations mobiles');
      mobileAnimations.cleanupMobileAnimations?.();
      mobileAnimations = null;
    }
    currentAnimationSystem.value = null;
  };

  // Fonction pour initialiser le système desktop
  const initDesktopAnimations = (sectionsElements) => {
    console.log('🖥️ Initialisation des animations desktop');
    
    cleanupCurrentSystem();
    
    desktopAnimations = useFullpageScrollTrigger();
    desktopAnimations.init(sectionsElements);
    currentAnimationSystem.value = 'desktop';
    
    return desktopAnimations;
  };

  // Fonction pour initialiser le système mobile
  const initMobileAnimations = (sectionsElements) => {
    console.log('📱 Initialisation des animations mobiles');
    
    cleanupCurrentSystem();
    
    mobileAnimations = useMobileAnimations();
    mobileAnimations.initMobileAnimations(sectionsElements);
    currentAnimationSystem.value = 'mobile';
    
    return mobileAnimations;
  };

  // Fonction principale d'initialisation
  const initResponsiveAnimations = (sectionsElements) => {
    if (!sectionsElements || sectionsElements.length === 0) {
      console.warn('⚠️ Aucune section fournie pour les animations');
      return null;
    }

    // Détecter le type d'écran actuel
    const currentIsMobile = checkIsMobile();
    isMobile.value = currentIsMobile;

    console.log(`🔄 Initialisation responsive - Mode: ${currentIsMobile ? 'Mobile' : 'Desktop'} (largeur: ${window.innerWidth}px)`);

    let activeSystem = null;

    if (currentIsMobile) {
      activeSystem = initMobileAnimations(sectionsElements);
    } else {
      activeSystem = initDesktopAnimations(sectionsElements);
    }

    isInitialized.value = true;
    return activeSystem;
  };

  // Fonction pour gérer le changement de taille d'écran
  const handleResize = () => {
    // Debounce pour éviter trop d'appels lors du redimensionnement
    clearTimeout(resizeTimeout);
    
    resizeTimeout = setTimeout(() => {
      const newIsMobile = checkIsMobile();
      
      // Si le mode a changé (mobile <-> desktop)
      if (newIsMobile !== isMobile.value) {
        console.log(`🔄 Changement de mode détecté: ${isMobile.value ? 'Mobile' : 'Desktop'} → ${newIsMobile ? 'Mobile' : 'Desktop'}`);
        
        isMobile.value = newIsMobile;
        
        // Récupérer les sections actuelles
        const sections = document.querySelectorAll('[data-section], .section, .slide');
        const sectionsArray = Array.from(sections);
        
        if (sectionsArray.length > 0) {
          // Réinitialiser avec le nouveau système
          if (newIsMobile) {
            initMobileAnimations(sectionsArray);
          } else {
            initDesktopAnimations(sectionsArray);
          }
        }
      }
    }, 250); // Délai de 250ms pour le debounce
  };

  // Configuration de l'observer de redimensionnement
  const setupResizeObserver = () => {
    // Utiliser ResizeObserver si disponible, sinon l'événement resize
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(document.body);
    } else {
      window.addEventListener('resize', handleResize);
    }
  };

  // Fonction pour obtenir le système d'animation actuel
  const getCurrentAnimationSystem = () => {
    if (currentAnimationSystem.value === 'desktop') {
      return desktopAnimations;
    } else if (currentAnimationSystem.value === 'mobile') {
      return mobileAnimations;
    }
    return null;
  };

  // Fonction pour naviguer vers une section (compatible avec les deux systèmes)
  const goToSection = (index, duration) => {
    const activeSystem = getCurrentAnimationSystem();
    
    if (activeSystem) {
      // Vérifier si le scroll est bloqué sur mobile (slide 73)
      if (currentAnimationSystem.value === 'mobile' && 
          activeSystem.animationStates?.value?.['slide-73-scroll-blocked']) {
        console.log('🚫 Navigation bloquée - Animation slide 73 en cours sur mobile');
        return; // Empêcher la navigation
      }

      if (currentAnimationSystem.value === 'desktop' && activeSystem.goToSection) {
        activeSystem.goToSection(index, duration);
      } else if (currentAnimationSystem.value === 'mobile' && activeSystem.goToMobileSection) {
        activeSystem.goToMobileSection(index, duration);
      }
    }
  };

  // Fonction pour obtenir l'index de la section actuelle
  const getCurrentSectionIndex = () => {
    const activeSystem = getCurrentAnimationSystem();
    return activeSystem?.currentSectionIndex?.value || 0;
  };

  // Fonction de nettoyage complète
  const cleanup = () => {
    console.log('🧹 Nettoyage complet du système responsive');
    
    // Nettoyer les timeouts
    clearTimeout(resizeTimeout);
    
    // Nettoyer l'observer de redimensionnement
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    } else {
      window.removeEventListener('resize', handleResize);
    }
    
    // Nettoyer le système d'animation actuel
    cleanupCurrentSystem();
    
    // Réinitialiser les états
    isInitialized.value = false;
    isMobile.value = false;
  };

  // Lifecycle hooks
  onMounted(() => {
    setupResizeObserver();
  });

  onUnmounted(() => {
    cleanup();
  });

  // API publique
  return {
    // États
    isMobile: readonly(isMobile),
    isInitialized: readonly(isInitialized),
    currentAnimationSystem: readonly(currentAnimationSystem),
    
    // Méthodes principales
    initResponsiveAnimations,
    goToSection,
    getCurrentSectionIndex,
    getCurrentAnimationSystem,
    cleanup,
    
    // Utilitaires
    checkIsMobile,
    MOBILE_BREAKPOINT
  };
}

export default useResponsiveAnimations;