import { ref, onMounted, onUnmounted } from 'vue';

export function useTabletDetection() {
  const isTablet = ref(false);
  const touchStartY = ref(0);
  const touchEndY = ref(0);
  const touchStartTime = ref(0);
  const touchEndTime = ref(0);
  const isProcessingSwipe = ref(false);
  
  // Seuils pour la détection des swipes
  const SWIPE_THRESHOLD = 50; // Distance minimale en pixels
  const SWIPE_TIME_THRESHOLD = 500; // Temps maximum en ms
  const SWIPE_COOLDOWN = 300; // Cooldown entre swipes en ms
  
  let lastSwipeTime = 0;
  let touchEventListeners = [];

  /**
   * Détection précise des tablettes incluant iPadOS 13+
   */
  const detectTablet = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    
    // Détection iPad classique
    const isIpad = /ipad/.test(userAgent) || /macintosh/.test(userAgent);
    
    // Détection iPadOS 13+ (qui se fait passer pour macOS)
    const isIpadOS = /macintosh/.test(userAgent) && maxTouchPoints > 1;
    
    // Détection tablettes Android
    const isAndroidTablet = /android/.test(userAgent) && !/mobile/.test(userAgent);
    
    // Détection autres tablettes (Surface, etc.)
    const isOtherTablet = (
      /tablet/.test(userAgent) ||
      /kindle/.test(userAgent) ||
      /silk/.test(userAgent) ||
      /playbook/.test(userAgent) ||
      (platform.includes('win') && maxTouchPoints > 1 && window.screen.width >= 768)
    );
    
    // Détection basée sur les dimensions et capacités tactiles
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const hasTouch = 'ontouchstart' in window || maxTouchPoints > 0;
    const isDimensionTablet = hasTouch && (
      (screenWidth >= 768 && screenWidth <= 1366) ||
      (screenHeight >= 768 && screenHeight <= 1366)
    );
    
    const result = isIpad || isIpadOS || isAndroidTablet || isOtherTablet || isDimensionTablet;
    
    console.log('🔍 Détection tablette:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints,
      screenWidth,
      screenHeight,
      isIpad,
      isIpadOS,
      isAndroidTablet,
      isOtherTablet,
      isDimensionTablet,
      hasTouch,
      result
    });
    
    return result;
  };

  /**
   * Configuration des événements tactiles pour tablettes
   */
  const setupTouchEvents = () => {
    if (!isTablet.value) return;
    
    console.log('📱 Configuration des événements tactiles pour tablette');
    
    const handleTouchStart = (e) => {
      if (isProcessingSwipe.value) return;
      
      touchStartY.value = e.touches[0].clientY;
      touchStartTime.value = Date.now();
    };
    
    const handleTouchMove = (e) => {
      // Empêcher le scroll natif pendant le geste
      if (Math.abs(e.touches[0].clientY - touchStartY.value) > 10) {
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = (e) => {
      if (isProcessingSwipe.value) return;
      
      touchEndY.value = e.changedTouches[0].clientY;
      touchEndTime.value = Date.now();
      
      processSwipe();
    };
    
    // Ajouter les événements avec passive: false pour pouvoir preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Stocker les références pour le nettoyage
    touchEventListeners = [
      { event: 'touchstart', handler: handleTouchStart },
      { event: 'touchmove', handler: handleTouchMove },
      { event: 'touchend', handler: handleTouchEnd }
    ];
  };

  /**
   * Traitement des swipes et conversion en événements scroll
   */
  const processSwipe = () => {
    const currentTime = Date.now();
    
    // Vérifier le cooldown
    if (currentTime - lastSwipeTime < SWIPE_COOLDOWN) {
      console.log('🚫 Swipe ignoré - cooldown actif');
      return;
    }
    
    const swipeDistance = touchStartY.value - touchEndY.value;
    const swipeTime = touchEndTime.value - touchStartTime.value;
    
    // Valider le swipe
    if (Math.abs(swipeDistance) < SWIPE_THRESHOLD || swipeTime > SWIPE_TIME_THRESHOLD) {
      return;
    }
    
    isProcessingSwipe.value = true;
    lastSwipeTime = currentTime;
    
    // Déterminer la direction
    const direction = swipeDistance > 0 ? 'up' : 'down';
    const keyCode = direction === 'up' ? 'ArrowDown' : 'ArrowUp';
    
    console.log(`👆 Swipe détecté: ${direction} (distance: ${Math.abs(swipeDistance)}px, temps: ${swipeTime}ms)`);
    
    // Simuler un événement clavier pour déclencher le système de navigation existant
    const keyboardEvent = new KeyboardEvent('keydown', {
      key: keyCode,
      bubbles: true,
      cancelable: true,
      // Ajouter une propriété custom pour identifier les événements tactiles
      detail: { source: 'tablet-swipe' }
    });
    
    // Émettre l'événement sur document
    document.dispatchEvent(keyboardEvent);
    
    // Débloquer après un délai pour éviter les swipes multiples
    setTimeout(() => {
      isProcessingSwipe.value = false;
    }, SWIPE_COOLDOWN);
  };

  /**
   * Nettoyage des événements tactiles
   */
  const cleanupTouchEvents = () => {
    touchEventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    touchEventListeners = [];
    console.log('🧹 Nettoyage des événements tactiles terminé');
  };

  /**
   * Fonction pour forcer le mode desktop sur tablettes
   */
  const shouldUseDesktopMode = () => {
    return isTablet.value || window.innerWidth > 768;
  };

  /**
   * Fonction pour obtenir la taille d'écran adaptée
   */
  const getResponsiveBreakpoint = () => {
    if (isTablet.value) {
      // Les tablettes utilisent toujours le mode desktop
      return 'desktop';
    }
    return window.innerWidth <= 768 ? 'mobile' : 'desktop';
  };

  /**
   * Initialisation
   */
  const init = () => {
    isTablet.value = detectTablet();
    
    if (isTablet.value) {
      console.log('✅ Tablette détectée - Mode desktop activé avec gestes tactiles');
      setupTouchEvents();
    } else {
      console.log('💻 Appareil non-tablette détecté');
    }
  };

  /**
   * Fonction de debug pour tester la détection
   */
  const debugInfo = () => {
    return {
      isTablet: isTablet.value,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      shouldUseDesktop: shouldUseDesktopMode(),
      responsiveBreakpoint: getResponsiveBreakpoint(),
      hasTouch: 'ontouchstart' in window,
      isProcessingSwipe: isProcessingSwipe.value,
      lastSwipeTime,
      timeSinceLastSwipe: Date.now() - lastSwipeTime
    };
  };

  // Exposer les fonctions de debug globalement
  if (typeof window !== 'undefined') {
    window.debugTabletDetection = {
      info: debugInfo,
      detectTablet,
      forceTabletMode: () => {
        isTablet.value = true;
        setupTouchEvents();
        console.log('🔧 Mode tablette forcé');
      },
      disableTabletMode: () => {
        isTablet.value = false;
        cleanupTouchEvents();
        console.log('🔧 Mode tablette désactivé');
      },
      testSwipe: (direction = 'up') => {
        touchStartY.value = direction === 'up' ? 100 : 0;
        touchEndY.value = direction === 'up' ? 0 : 100;
        touchStartTime.value = Date.now() - 100;
        touchEndTime.value = Date.now();
        processSwipe();
        console.log(`🧪 Test swipe ${direction} simulé`);
      }
    };
  }

  return {
    isTablet,
    isProcessingSwipe,
    shouldUseDesktopMode,
    getResponsiveBreakpoint,
    init,
    cleanup: cleanupTouchEvents,
    debugInfo
  };
} 