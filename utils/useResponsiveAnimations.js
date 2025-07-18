import { ref, computed, onUnmounted } from 'vue';
import { useTabletDetection } from './useTabletDetection.js';
import { useFullpageScrollTrigger } from './useFullpageScrollTrigger.js';
import useMobileAnimations from './mobileAnimations.js';

// Système de commutation intelligent entre animations desktop/mobile/tablette
export function useResponsiveAnimations() {
  // Initialisation des systèmes
  const tabletDetection = useTabletDetection();
  const desktopAnimations = useFullpageScrollTrigger();
  const mobileAnimations = useMobileAnimations();
  
  // États globaux
  const isInitialized = ref(false);
  const currentAnimationSystem = ref(null);
  const sections = ref([]);
  
  // Computed properties
  const isMobile = computed(() => {
    return !tabletDetection.shouldUseDesktopMode();
  });
  
  const isTablet = computed(() => {
    return tabletDetection.isTablet.value;
  });
  
  const shouldUseDesktopAnimations = computed(() => {
    return tabletDetection.shouldUseDesktopMode();
  });

  /**
   * Initialisation du système responsif
   */
  const initResponsiveAnimations = (sectionsElements, options = {}) => {
    if (isInitialized.value) {
      console.warn('⚠️ Système responsif déjà initialisé');
      return;
    }

    console.log('🚀 Initialisation du système d\'animations responsif');
    
    // Validation des sections
    if (!Array.isArray(sectionsElements) || sectionsElements.length === 0) {
      console.error('❌ Erreur: sections manquantes ou invalides');
      return;
    }

    sections.value = sectionsElements;

    // Initialiser la détection de tablettes
    tabletDetection.init();

    // Déterminer et initialiser le système d'animations approprié
    if (shouldUseDesktopAnimations.value) {
      console.log('🖥️ Initialisation du système desktop/tablette');
      currentAnimationSystem.value = 'desktop';
      
      // Initialiser le système desktop avec toutes les sections
      desktopAnimations.init(sectionsElements);
      
      // Configuration spéciale pour les tablettes
      if (isTablet.value) {
        setupTabletSpecificBehavior();
      }
    } else {
      console.log('📱 Initialisation du système mobile');
      currentAnimationSystem.value = 'mobile';
      
      // Pour mobile, on utilise le scroll natif avec des adaptations légères
      setupMobileBehavior();
    }

    isInitialized.value = true;
    console.log(`✅ Système responsif initialisé (${currentAnimationSystem.value})`);
  };

  /**
   * Configuration spécifique pour les tablettes
   */
  const setupTabletSpecificBehavior = () => {
    // Vérification SSR : ne pas configurer si document n'existe pas
    if (typeof document === 'undefined') {
      console.log('📱 SSR détecté - configuration tablette différée');
      return;
    }

    console.log('📱 Configuration du comportement spécifique aux tablettes');
    
    // Écouter les événements de swipe convertis en événements clavier
    const handleTabletKeyboardEvent = (e) => {
      // Vérifier si l'événement vient d'un swipe tablette
      if (e.detail && e.detail.source === 'tablet-swipe') {
        console.log(`📱 Événement clavier provenant d'un swipe tablette: ${e.key}`);
        
        // Ajouter une logique spécifique si nécessaire
        // Par exemple, des animations différentes pour les tablettes
      }
    };

    document.addEventListener('keydown', handleTabletKeyboardEvent);

    // Désactiver le scroll natif pour éviter les conflits
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    console.log('✅ Comportement tablette configuré');
  };

  /**
   * Configuration pour mobile
   */
  const setupMobileBehavior = () => {
    console.log('📱 Configuration du comportement mobile avec animations complètes');
    
    // Vérification SSR : ne pas manipuler document si non disponible
    if (typeof document !== 'undefined') {
      // Réactiver le scroll natif pour le conteneur principal
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    // IMPORTANT: Initialiser les vraies animations mobiles avec toutes les fonctionnalités
    if (sections.value && sections.value.length > 0) {
      console.log('🚀 Initialisation des animations mobiles avancées');
      mobileAnimations.initMobileAnimations(sections.value);
    } else {
      console.warn('⚠️ Pas de sections disponibles pour les animations mobiles');
    }
  };

  /**
   * Navigation vers une section
   */
  const goToSection = (index, duration = null) => {
    if (!isInitialized.value) {
      console.warn('⚠️ Système non initialisé');
      return;
    }

    if (index < 0 || index >= sections.value.length) {
      console.warn(`⚠️ Index de section invalide: ${index}`);
      return;
    }

    console.log(`🎯 Navigation vers la section ${index} (système: ${currentAnimationSystem.value})`);

    if (currentAnimationSystem.value === 'desktop') {
      // Utiliser le système desktop/tablette
      desktopAnimations.goToSection(index, duration);
    } else {
      // CORRECTION: Utiliser le système d'animations mobiles complet
      console.log(`📱 Navigation mobile vers section ${index} avec animations`);
      mobileAnimations.goToMobileSection(index, duration || 0.8);
    }
  };

  /**
   * Obtenir l'index de la section actuelle
   */
  const getCurrentSectionIndex = () => {
    if (!isInitialized.value) return 0;
    
    if (currentAnimationSystem.value === 'desktop') {
      return desktopAnimations.currentSectionIndex.value;
    } else {
      // CORRECTION: Utiliser l'index du système d'animations mobiles
      return mobileAnimations.currentSectionIndex.value;
    }
  };

  /**
   * Vérifier si on navigue actuellement
   */
  const isNavigating = computed(() => {
    if (currentAnimationSystem.value === 'desktop') {
      return desktopAnimations.isNavigating.value || tabletDetection.isProcessingSwipe.value;
    } else {
      // CORRECTION: Utiliser l'état de navigation du système mobile
      return mobileAnimations.isNavigating.value;
    }
  });

  /**
   * Obtenir les états d'animation
   */
  const getAnimationStates = () => {
    if (currentAnimationSystem.value === 'desktop') {
      return desktopAnimations.animationStates.value;
    } else {
      // CORRECTION: Utiliser les états d'animation du système mobile
      return mobileAnimations.animationStates.value;
    }
  };

  /**
   * Basculer entre les systèmes d'animations
   */
  const switchAnimationSystem = (forceSystem = null) => {
    if (!isInitialized.value) return;

    const newSystem = forceSystem || (shouldUseDesktopAnimations.value ? 'desktop' : 'mobile');
    
    if (newSystem === currentAnimationSystem.value) {
      console.log(`ℹ️ Système déjà en mode ${newSystem}`);
      return;
    }

    console.log(`🔄 Basculement du système: ${currentAnimationSystem.value} → ${newSystem}`);

    // Nettoyer l'ancien système
    cleanup();

    // Initialiser le nouveau système
    currentAnimationSystem.value = newSystem;
    
    if (newSystem === 'desktop') {
      desktopAnimations.init(sections.value);
      if (isTablet.value) {
        setupTabletSpecificBehavior();
      }
    } else {
      // CORRECTION: Initialiser le système mobile complet
      setupMobileBehavior();
    }

    console.log(`✅ Basculement terminé vers ${newSystem}`);
  };

  /**
   * Gestion du redimensionnement
   */
  const handleResize = () => {
    // Re-détecter le type d'appareil
    const wasTablet = tabletDetection.isTablet.value;
    tabletDetection.init();
    
    // Si le type d'appareil a changé, basculer le système
    if (wasTablet !== tabletDetection.isTablet.value) {
      console.log('🔄 Changement de type d\'appareil détecté');
      switchAnimationSystem();
    }
  };

  // ===========================================================================
  // SYSTÈME DE LECTURE VIDÉO AUTOMATIQUE - INTÉGRATION RESPONSIVE
  // ===========================================================================

  /**
   * Initialise le système de lecture vidéo automatique pour la slide 23
   * Compatible avec les systèmes desktop et mobile
   */
  const initializeSlide23VideoSystem = () => {
    console.log('🎬 [Responsive] Initialisation du système vidéo slide-23');
    
    if (currentAnimationSystem.value === 'desktop') {
      // Utiliser le système desktop intégré
      if (desktopAnimations && typeof window !== 'undefined' && window.debugDesktopAnimations?.slide23VideoSystem) {
        window.debugDesktopAnimations.slide23VideoSystem.init();
      }
    } else {
      // Pour mobile, implémenter une version simplifiée
      console.log('📱 [Mobile] Initialisation du système vidéo slide-23');
      initializeMobileVideoSystem();
    }
  };

  /**
   * Version mobile du système de lecture vidéo automatique
   */
  const initializeMobileVideoSystem = () => {
    // Vérification SSR
    if (typeof document === 'undefined') return;
    
    const slide23Section = document.getElementById('slide-23');
    if (!slide23Section) {
      console.warn('⚠️ [Mobile] Slide-23 non trouvée');
      return;
    }
    
    const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
    console.log(`📊 [Mobile] ${imageContainers.length} image-containers trouvés`);
    
    // Créer un observer simple pour mobile
    const mobileVideoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const container = entry.target;
        const video = container.querySelector('video');
        
        if (entry.isIntersecting && video) {
          // Démarrer la vidéo
          video.autoplay = true;
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          
          video.play().catch(error => {
            console.warn(`⚠️ [Mobile] Erreur lecture vidéo ${container.id}:`, error);
          });
        } else if (video && !video.paused) {
          // Arrêter la vidéo
          video.pause();
          video.currentTime = 0;
        }
      });
    }, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    });
    
    // Observer tous les containers
    imageContainers.forEach(container => {
      if (container.id) {
        mobileVideoObserver.observe(container);
      }
    });
    
    // Stocker l'observer pour le nettoyage
    if (!window.mobileVideoObservers) {
      window.mobileVideoObservers = [];
    }
    window.mobileVideoObservers.push(mobileVideoObserver);
  };

  /**
   * Arrête toutes les vidéos de la slide 23
   */
  const stopAllSlide23Videos = () => {
    console.log('🛑 [Responsive] Arrêt de toutes les vidéos slide-23');
    
    if (currentAnimationSystem.value === 'desktop') {
      // Utiliser le système desktop
      if (typeof window !== 'undefined' && window.debugDesktopAnimations?.slide23VideoSystem) {
        window.debugDesktopAnimations.slide23VideoSystem.stopAll();
      }
    } else {
      // Version mobile
      if (typeof document !== 'undefined') {
        const slide23Section = document.getElementById('slide-23');
        if (slide23Section) {
          const videos = slide23Section.querySelectorAll('video');
          videos.forEach(video => {
            if (!video.paused) {
              video.pause();
              video.currentTime = 0;
            }
          });
        }
      }
    }
  };

  /**
   * Nettoie le système vidéo
   */
  const cleanupSlide23VideoSystem = () => {
    console.log('🧹 [Responsive] Nettoyage du système vidéo slide-23');
    
    if (currentAnimationSystem.value === 'desktop') {
      // Utiliser le système desktop
      if (typeof window !== 'undefined' && window.debugDesktopAnimations?.slide23VideoSystem) {
        window.debugDesktopAnimations.slide23VideoSystem.cleanup();
      }
    } else {
      // Nettoyage mobile
      if (typeof window !== 'undefined' && window.mobileVideoObservers) {
        window.mobileVideoObservers.forEach(observer => observer.disconnect());
        window.mobileVideoObservers = [];
      }
    }
    
    // Arrêter toutes les vidéos
    stopAllSlide23Videos();
  };

  /**
   * Obtient le statut du système vidéo
   */
  const getSlide23VideoSystemStatus = () => {
    if (currentAnimationSystem.value === 'desktop') {
      if (typeof window !== 'undefined' && window.debugDesktopAnimations?.slide23VideoSystem) {
        return {
          system: 'desktop',
          observerStatus: window.debugDesktopAnimations.slide23VideoSystem.getObserverStatus(),
          activeVideos: window.debugDesktopAnimations.slide23VideoSystem.getActiveVideos()
        };
      }
    } else {
      return {
        system: 'mobile',
        observerStatus: typeof window !== 'undefined' && window.mobileVideoObservers?.length > 0 ? 'active' : 'inactive',
        activeVideos: []
      };
    }
    
    return {
      system: currentAnimationSystem.value || 'none',
      observerStatus: 'inactive',
      activeVideos: []
    };
  };

  /**
   * Nettoyage
   */
  const cleanup = () => {
    // Nettoyer le système vidéo avant le nettoyage général
    cleanupSlide23VideoSystem();
    
    if (currentAnimationSystem.value === 'desktop') {
      desktopAnimations.cleanup();
    } else if (currentAnimationSystem.value === 'mobile') {
      // CORRECTION: Nettoyer aussi les animations mobiles
      mobileAnimations.cleanupMobileAnimations();
    }
    
    tabletDetection.cleanup();
    
    // Vérification SSR : ne pas manipuler document si non disponible
    if (typeof document !== 'undefined') {
      // Restaurer le scroll natif
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    isInitialized.value = false;
    currentAnimationSystem.value = null;
    sections.value = [];
    
    console.log('🧹 Nettoyage du système responsif terminé');
  };

  /**
   * Fonctions de debug spécifiques au système responsif
   */
  const debugInfo = () => {
    return {
      isInitialized: isInitialized.value,
      currentAnimationSystem: currentAnimationSystem.value,
      isMobile: isMobile.value,
      isTablet: isTablet.value,
      shouldUseDesktopAnimations: shouldUseDesktopAnimations.value,
      sectionsCount: sections.value.length,
      currentSectionIndex: getCurrentSectionIndex(),
      isNavigating: isNavigating.value,
      animationStates: getAnimationStates(),
      tabletDetection: tabletDetection.debugInfo(),
      desktopAnimations: currentAnimationSystem.value === 'desktop' ? {
        currentSectionIndex: desktopAnimations.currentSectionIndex.value,
        isNavigating: desktopAnimations.isNavigating.value,
        animationStates: desktopAnimations.animationStates.value
      } : null,
      // Informations sur le système vidéo
      videoSystem: getSlide23VideoSystemStatus()
    };
  };

  // Exposer les fonctions de debug globalement
  if (typeof window !== 'undefined') {
    window.debugResponsiveAnimations = {
      info: debugInfo,
      switchToDesktop: () => switchAnimationSystem('desktop'),
      switchToMobile: () => switchAnimationSystem('mobile'),
      getCurrentSection: getCurrentSectionIndex,
      goToSection,
      forceTabletMode: () => {
        tabletDetection.forceTabletMode();
        switchAnimationSystem('desktop');
      },
      cleanup,
      // Système vidéo slide-23
      slide23VideoSystem: {
        init: initializeSlide23VideoSystem,
        cleanup: cleanupSlide23VideoSystem,
        stopAll: stopAllSlide23Videos,
        getStatus: getSlide23VideoSystemStatus
      },
      // Proxy vers les fonctions de debug des sous-systèmes (avec vérifications)
      get tablet() {
        return typeof window !== 'undefined' && window.debugTabletDetection ? window.debugTabletDetection : null;
      },
      get desktop() {
        return typeof window !== 'undefined' && window.debugDesktopAnimations ? window.debugDesktopAnimations : null;
      }
    };
  }

  // Écouter les changements de taille d'écran
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
  }

  // Cleanup automatique au unmount
  onUnmounted(() => {
    cleanup();
    // Nettoyer aussi les event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    }
  });

  // API publique
  return {
    // États
    isMobile,
    isTablet,
    isInitialized,
    currentAnimationSystem,
    isNavigating,

    // Fonctions principales
    initResponsiveAnimations,
    goToSection,
    getCurrentSectionIndex,
    getAnimationStates,

    // Fonctions de contrôle
    switchAnimationSystem,
    handleResize,
    cleanup,
    debugInfo,

    // Système vidéo slide-23
    slide23VideoSystem: {
      init: initializeSlide23VideoSystem,
      cleanup: cleanupSlide23VideoSystem,
      stopAll: stopAllSlide23Videos,
      getStatus: getSlide23VideoSystemStatus
    }
  };
}

export default useResponsiveAnimations;