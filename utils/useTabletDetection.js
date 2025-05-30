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
    
    // CORRECTION: Détection plus précise des téléphones pour les exclure
    const isMobilePhone = (
      // iPhones (tous les modèles)
      /iphone/.test(userAgent) ||
      // Android phones (avec le mot-clé "mobile")
      (/android/.test(userAgent) && /mobile/.test(userAgent)) ||
      // Modèles spécifiques de téléphones Android (sans "mobile" dans l'UA)
      /sm-g\d{3}/.test(userAgent) || // Samsung Galaxy (SM-G981B, etc.)
      /sm-a\d{3}/.test(userAgent) || // Samsung Galaxy A series
      /sm-n\d{3}/.test(userAgent) || // Samsung Galaxy Note series
      /pixel \d/.test(userAgent) ||   // Google Pixel
      /oneplus/.test(userAgent) ||    // OnePlus
      /huawei/.test(userAgent) ||     // Huawei phones
      /xiaomi/.test(userAgent) ||     // Xiaomi phones
      /redmi/.test(userAgent) ||      // Redmi phones
      /oppo/.test(userAgent) ||       // Oppo phones
      /vivo/.test(userAgent) ||       // Vivo phones
      // Dimensions typiques de téléphones (largeur <= 480px OU ratio > 1.8)
      (window.screen.width <= 480) ||
      (window.screen.height / window.screen.width > 1.8)
    );
    
    // Si c'est détecté comme un téléphone, ce n'est PAS une tablette
    if (isMobilePhone) {
      console.log('📱 Téléphone détecté - utilisation des animations mobiles');
      return false;
    }
    
    // Détection tablettes Android (APRÈS avoir exclu les téléphones)
    const isAndroidTablet = /android/.test(userAgent) && !/mobile/.test(userAgent) && !isMobilePhone;
    
    // Détection autres tablettes (Surface, etc.)
    const isOtherTablet = (
      /tablet/.test(userAgent) ||
      /kindle/.test(userAgent) ||
      /silk/.test(userAgent) ||
      /playbook/.test(userAgent) ||
      (platform.includes('win') && maxTouchPoints > 1 && window.screen.width >= 768)
    );
    
    // CORRECTION: Détection basée sur les dimensions - PLUS RESTRICTIVE
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const hasTouch = 'ontouchstart' in window || maxTouchPoints > 0;
    
    // Pour être une tablette basée sur les dimensions :
    // 1. Doit avoir le tactile
    // 2. Largeur minimale 768px ET maximale 1366px
    // 3. Ratio aspect <= 1.6 (pas de téléphones longs)
    // 4. Ne doit pas être détecté comme téléphone
    const aspectRatio = Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight);
    const isDimensionTablet = hasTouch && 
      !isMobilePhone && 
      screenWidth >= 768 && 
      screenWidth <= 1366 && 
      aspectRatio <= 1.6;
    
    const result = isIpad || isIpadOS || isAndroidTablet || isOtherTablet || isDimensionTablet;
    
    console.log('🔍 Détection tablette CORRIGÉE:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints,
      screenWidth,
      screenHeight,
      aspectRatio: aspectRatio.toFixed(2),
      isMobilePhone,
      isIpad,
      isIpadOS,
      isAndroidTablet,
      isOtherTablet,
      isDimensionTablet,
      hasTouch,
      result: result ? 'TABLETTE' : 'MOBILE/DESKTOP'
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
   * Fonction pour forcer le mode desktop sur tablettes UNIQUEMENT
   */
  const shouldUseDesktopMode = () => {
    // CORRECTION: Utiliser SEULEMENT la détection de tablette
    // Ne plus se baser sur window.innerWidth qui classe les téléphones comme desktop
    return isTablet.value;
  };

  /**
   * Fonction pour obtenir la taille d'écran adaptée
   */
  const getResponsiveBreakpoint = () => {
    if (isTablet.value) {
      // Les tablettes utilisent toujours le mode desktop
      return 'desktop';
    }
    
    // CORRECTION: Utiliser une logique plus précise pour mobile vs desktop
    // Vérifier d'abord si c'est un téléphone (qui doit toujours être mobile)
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobilePhone = (
      /iphone/.test(userAgent) ||
      (/android/.test(userAgent) && /mobile/.test(userAgent)) ||
      /sm-g\d{3}/.test(userAgent) || // Samsung Galaxy
      /sm-a\d{3}/.test(userAgent) || // Samsung Galaxy A series
      /sm-n\d{3}/.test(userAgent) || // Samsung Galaxy Note series
      /pixel \d/.test(userAgent) ||   // Google Pixel
      window.screen.width <= 480 ||
      (window.screen.height / window.screen.width > 1.8)
    );
    
    // Si c'est un téléphone, toujours mobile
    if (isMobilePhone) {
      return 'mobile';
    }
    
    // Pour les vrais ordinateurs/desktop, utiliser 1024px comme seuil
    return window.innerWidth <= 1024 ? 'mobile' : 'desktop';
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
      },
      // NOUVELLE FONCTION: Test de la détection corrigée
      testCorrectedDetection: () => {
        console.group('🧪 TEST DÉTECTION CORRIGÉE');
        
        const userAgent = navigator.userAgent;
        const result = detectTablet();
        
        console.log('📱 User Agent:', userAgent);
        console.log('📏 Dimensions écran:', window.screen.width + 'x' + window.screen.height);
        console.log('📐 Ratio aspect:', (Math.max(window.screen.width, window.screen.height) / Math.min(window.screen.width, window.screen.height)).toFixed(2));
        console.log('🎯 Détection finale:', result ? 'TABLETTE' : 'MOBILE/DESKTOP');
        console.log('🚀 Animation system:', result ? 'DESKTOP' : 'MOBILE');
        
        // Tests spécifiques
        if (/iphone/.test(userAgent.toLowerCase())) {
          console.log('📱 iPhone détecté:', !result ? '✅ CORRECT (mobile)' : '❌ ERREUR (tablette)');
        }
        if (/android.*mobile/.test(userAgent.toLowerCase())) {
          console.log('📱 Android phone détecté:', !result ? '✅ CORRECT (mobile)' : '❌ ERREUR (tablette)');
        }
        if (/sm-g\d{3}/.test(userAgent.toLowerCase())) {
          console.log('📱 Samsung Galaxy détecté:', !result ? '✅ CORRECT (mobile)' : '❌ ERREUR (tablette)');
        }
        
        console.groupEnd();
        return result;
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