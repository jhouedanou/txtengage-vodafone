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
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const hasTouch = 'ontouchstart' in window || maxTouchPoints > 0;
    
    // ÉTAPE 1: Détecter et exclure les téléphones en priorité
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
      (screenWidth <= 480) ||
      (screenHeight / screenWidth > 1.8)
    );
    
    // Si c'est détecté comme un téléphone, ce n'est PAS une tablette
    if (isMobilePhone) {
      console.log('📱 Téléphone détecté - utilisation des animations mobiles');
      return false;
    }
    
    // ÉTAPE 2: Détecter et exclure les vrais ordinateurs desktop/laptop
    const isTrueDesktop = (
      // macOS desktop/laptop (sans tactile)
      (/macintosh/.test(userAgent) && maxTouchPoints === 0) ||
      // Windows desktop/laptop (sans tactile ou avec un écran très grand)
      (platform.includes('win') && (maxTouchPoints === 0 || screenWidth > 1366)) ||
      // Linux desktop/laptop (généralement sans tactile)
      (/linux/.test(userAgent) && maxTouchPoints === 0) ||
      // Autres plateformes desktop (FreeBSD, etc.)
      (/freebsd|netbsd|openbsd/.test(platform)) ||
      // Écrans très larges (desktop monitors)
      (screenWidth > 1920) ||
      // Détection par le ratio d'aspect des écrans desktop (généralement 16:9, 16:10, 21:9)
      (!hasTouch && screenWidth >= 1024)
    );
    
    // Si c'est un vrai desktop/laptop, ce n'est PAS une tablette mais utilise quand même le mode desktop
    if (isTrueDesktop) {
      console.log('🖥️ Desktop/laptop détecté - utilisation des animations desktop');
      return false;
    }
    
    // ÉTAPE 3: Détecter les vraies tablettes
    // iPad classique
    const isIpad = /ipad/.test(userAgent);
    
    // iPadOS 13+ (qui se fait passer pour macOS MAIS avec tactile)
    const isIpadOS = /macintosh/.test(userAgent) && maxTouchPoints > 1;
    
    // Tablettes Android (APRÈS avoir exclu les téléphones et desktops)
    const isAndroidTablet = /android/.test(userAgent) && !/mobile/.test(userAgent);
    
    // Tablettes Windows (Surface, etc.) - avec tactile et taille d'écran appropriée
    const isWindowsTablet = platform.includes('win') && 
      maxTouchPoints > 1 && 
      screenWidth >= 768 && 
      screenWidth <= 1366;
    
    // Autres tablettes (Kindle, PlayBook, etc.)
    const isOtherTablet = (
      /tablet/.test(userAgent) ||
      /kindle/.test(userAgent) ||
      /silk/.test(userAgent) ||
      /playbook/.test(userAgent)
    );
    
    // ÉTAPE 4: Détection basée sur les dimensions (dernier recours)
    // Pour être une tablette basée sur les dimensions :
    // 1. Doit avoir le tactile
    // 2. Largeur entre 768px et 1366px
    // 3. Ratio aspect <= 1.6 (pas de téléphones longs)
    // 4. Ne doit pas être un téléphone ou desktop
    const aspectRatio = Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight);
    const isDimensionTablet = hasTouch && 
      screenWidth >= 768 && 
      screenWidth <= 1366 && 
      aspectRatio <= 1.6;
    
    const result = isIpad || isIpadOS || isAndroidTablet || isWindowsTablet || isOtherTablet || isDimensionTablet;
    
    console.log('🔍 Détection tablette ULTRA-PRÉCISE:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints,
      screenWidth,
      screenHeight,
      aspectRatio: aspectRatio.toFixed(2),
      hasTouch,
      // Étape 1
      isMobilePhone,
      // Étape 2  
      isTrueDesktop,
      macOSDesktop: /macintosh/.test(userAgent) && maxTouchPoints === 0,
      windowsDesktop: platform.includes('win') && (maxTouchPoints === 0 || screenWidth > 1366),
      linuxDesktop: /linux/.test(userAgent) && maxTouchPoints === 0,
      // Étape 3
      isIpad,
      isIpadOS,
      isAndroidTablet,
      isWindowsTablet,
      isOtherTablet,
      isDimensionTablet,
      // Résultat final
      result: result ? 'TABLETTE' : 'DESKTOP/MOBILE',
      systemToUse: result ? 'DESKTOP_ANIMATIONS' : (isTrueDesktop ? 'DESKTOP_ANIMATIONS' : 'MOBILE_ANIMATIONS')
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
   * Fonction pour déterminer si on doit utiliser le mode desktop
   * Retourne true pour les tablettes ET les vrais desktops
   */
  const shouldUseDesktopMode = () => {
    // Si c'est une tablette, toujours desktop
    if (isTablet.value) {
      return true;
    }
    
    // LOGIQUE IDENTIQUE À detectTablet() pour la détection des vrais desktops
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const hasTouch = 'ontouchstart' in window || maxTouchPoints > 0;
    
    // Détecter les téléphones pour les forcer en mode mobile
    const isMobilePhone = (
      /iphone/.test(userAgent) ||
      (/android/.test(userAgent) && /mobile/.test(userAgent)) ||
      /sm-g\d{3}/.test(userAgent) || // Samsung Galaxy
      /sm-a\d{3}/.test(userAgent) || // Samsung Galaxy A series
      /sm-n\d{3}/.test(userAgent) || // Samsung Galaxy Note series
      /pixel \d/.test(userAgent) ||   // Google Pixel
      /oneplus/.test(userAgent) ||    // OnePlus
      /huawei/.test(userAgent) ||     // Huawei phones
      /xiaomi/.test(userAgent) ||     // Xiaomi phones
      /redmi/.test(userAgent) ||      // Redmi phones
      /oppo/.test(userAgent) ||       // Oppo phones
      /vivo/.test(userAgent) ||       // Vivo phones
      (screenWidth <= 480) ||
      (screenHeight / screenWidth > 1.8)
    );
    
    // Si c'est un téléphone, mode mobile
    if (isMobilePhone) {
      console.log('📱 Téléphone détecté - Mode mobile forcé');
      return false;
    }
    
    // Détecter les vrais ordinateurs desktop/laptop
    const isTrueDesktop = (
      // macOS desktop/laptop (sans tactile)
      (/macintosh/.test(userAgent) && maxTouchPoints === 0) ||
      // Windows desktop/laptop (sans tactile ou avec un écran très grand)
      (platform.includes('win') && (maxTouchPoints === 0 || screenWidth > 1366)) ||
      // Linux desktop/laptop (généralement sans tactile)
      (/linux/.test(userAgent) && maxTouchPoints === 0) ||
      // Autres plateformes desktop (FreeBSD, etc.)
      (/freebsd|netbsd|openbsd/.test(platform)) ||
      // Écrans très larges (desktop monitors)
      (screenWidth > 1920) ||
      // Détection par le ratio d'aspect des écrans desktop (généralement 16:9, 16:10, 21:9)
      (!hasTouch && screenWidth >= 1024)
    );
    
    // Si c'est un vrai desktop/laptop, mode desktop
    if (isTrueDesktop) {
      console.log('🖥️ Desktop/laptop détecté - Mode desktop activé');
      return true;
    }
    
    // Pour tous les autres appareils (cas edge), utiliser une logique conservative
    console.log('❓ Appareil non classifié - Mode desktop par défaut');
    return true;
  };

  /**
   * Fonction pour obtenir la taille d'écran adaptée
   */
  const getResponsiveBreakpoint = () => {
    if (isTablet.value) {
      // Les tablettes utilisent toujours le mode desktop
      return 'desktop';
    }
    
    // LOGIQUE COHÉRENTE avec shouldUseDesktopMode()
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const hasTouch = 'ontouchstart' in window || maxTouchPoints > 0;
    
    // Détecter les téléphones pour les classer comme mobile
    const isMobilePhone = (
      /iphone/.test(userAgent) ||
      (/android/.test(userAgent) && /mobile/.test(userAgent)) ||
      /sm-g\d{3}/.test(userAgent) || // Samsung Galaxy
      /sm-a\d{3}/.test(userAgent) || // Samsung Galaxy A series
      /sm-n\d{3}/.test(userAgent) || // Samsung Galaxy Note series
      /pixel \d/.test(userAgent) ||   // Google Pixel
      (screenWidth <= 480) ||
      (screenHeight / screenWidth > 1.8)
    );
    
    // Si c'est un téléphone, toujours mobile
    if (isMobilePhone) {
      return 'mobile';
    }
    
    // Détecter les vrais ordinateurs desktop/laptop
    const isTrueDesktop = (
      // macOS desktop/laptop (sans tactile)
      (/macintosh/.test(userAgent) && maxTouchPoints === 0) ||
      // Windows desktop/laptop (sans tactile ou avec un écran très grand)
      (platform.includes('win') && (maxTouchPoints === 0 || screenWidth > 1366)) ||
      // Linux desktop/laptop (généralement sans tactile)
      (/linux/.test(userAgent) && maxTouchPoints === 0) ||
      // Autres plateformes desktop
      (/freebsd|netbsd|openbsd/.test(platform)) ||
      // Écrans très larges
      (screenWidth > 1920) ||
      // Écrans desktop sans tactile
      (!hasTouch && screenWidth >= 1024)
    );
    
    // Si c'est un vrai desktop/laptop, toujours desktop
    if (isTrueDesktop) {
      return 'desktop';
    }
    
    // Pour tous les autres appareils (cas edge), desktop par défaut
    return 'desktop';
  };

  /**
   * Initialisation
   */
  const init = () => {
    isTablet.value = detectTablet();
    
    console.log('🔍 RAPPORT COMPLET DE DÉTECTION:');
    console.log('   📱 Tablette détectée:', isTablet.value);
    console.log('   🖥️ Utiliser mode desktop:', shouldUseDesktopMode());
    console.log('   📊 Breakpoint responsif:', getResponsiveBreakpoint());
    console.log('   🌐 User Agent:', navigator.userAgent);
    console.log('   📏 Dimensions:', window.screen.width + 'x' + window.screen.height);
    console.log('   🎯 Système d\'animation à utiliser:', shouldUseDesktopMode() ? 'DESKTOP' : 'MOBILE');
    
    if (isTablet.value) {
      console.log('✅ Tablette détectée - Mode desktop activé avec gestes tactiles');
      setupTouchEvents();
    } else if (shouldUseDesktopMode()) {
      console.log('🖥️ Desktop/laptop détecté - Mode desktop activé');
    } else {
      console.log('📱 Téléphone détecté - Mode mobile activé');
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
        const shouldUseDesktop = shouldUseDesktopMode();
        
        console.log('📱 User Agent:', userAgent);
        console.log('📏 Dimensions écran:', window.screen.width + 'x' + window.screen.height);
        console.log('🎯 Ratio aspect:', (Math.max(window.screen.width, window.screen.height) / Math.min(window.screen.width, window.screen.height)).toFixed(2));
        console.log('👆 Points tactiles:', navigator.maxTouchPoints);
        console.log('🖱️ Plateforme:', navigator.platform);
        
        console.log('🎯 Détection tablette:', result ? 'TABLETTE' : 'NON-TABLETTE');
        console.log('🖥️ Mode desktop:', shouldUseDesktop ? 'OUI' : 'NON');
        console.log('🚀 Système animation:', shouldUseDesktop ? 'DESKTOP' : 'MOBILE');
        
        // Tests spécifiques par plateforme
        if (/iphone/.test(userAgent.toLowerCase())) {
          console.log('📱 iPhone détecté:', !result && !shouldUseDesktop ? '✅ CORRECT (mobile)' : '❌ ERREUR');
        }
        if (/android.*mobile/.test(userAgent.toLowerCase())) {
          console.log('📱 Android phone détecté:', !result && !shouldUseDesktop ? '✅ CORRECT (mobile)' : '❌ ERREUR');
        }
        if (/macintosh/.test(userAgent.toLowerCase()) && navigator.maxTouchPoints === 0) {
          console.log('🖥️ macOS desktop détecté:', !result && shouldUseDesktop ? '✅ CORRECT (desktop)' : '❌ ERREUR');
        }
        if (/macintosh/.test(userAgent.toLowerCase()) && navigator.maxTouchPoints > 1) {
          console.log('📱 iPadOS détecté:', result && shouldUseDesktop ? '✅ CORRECT (tablette→desktop)' : '❌ ERREUR');
        }
        if (navigator.platform?.toLowerCase().includes('win') && navigator.maxTouchPoints === 0) {
          console.log('🖥️ Windows desktop détecté:', !result && shouldUseDesktop ? '✅ CORRECT (desktop)' : '❌ ERREUR');
        }
        if (navigator.platform?.toLowerCase().includes('win') && navigator.maxTouchPoints > 1) {
          console.log('📱 Windows tablette détecté:', result && shouldUseDesktop ? '✅ CORRECT (tablette→desktop)' : '❌ ERREUR');
        }
        if (/linux/.test(userAgent.toLowerCase()) && navigator.maxTouchPoints === 0) {
          console.log('🐧 Linux desktop détecté:', !result && shouldUseDesktop ? '✅ CORRECT (desktop)' : '❌ ERREUR');
        }
        
        console.groupEnd();
        return { isTablet: result, shouldUseDesktop, animationSystem: shouldUseDesktop ? 'DESKTOP' : 'MOBILE' };
      },
      
      // NOUVELLE FONCTION: Test simulation d'appareils
      simulateDevice: (deviceType) => {
        console.group(`🎭 SIMULATION APPAREIL: ${deviceType.toUpperCase()}`);
        
        let mockUserAgent, mockPlatform, mockMaxTouchPoints, mockScreenWidth, mockScreenHeight;
        
        switch(deviceType.toLowerCase()) {
          case 'macos':
            mockUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            mockPlatform = 'MacIntel';
            mockMaxTouchPoints = 0;
            mockScreenWidth = 1920;
            mockScreenHeight = 1080;
            break;
          case 'windows':
            mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            mockPlatform = 'Win32';
            mockMaxTouchPoints = 0;
            mockScreenWidth = 1920;
            mockScreenHeight = 1080;
            break;
          case 'ipad':
            mockUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
            mockPlatform = 'MacIntel';
            mockMaxTouchPoints = 5;
            mockScreenWidth = 1024;
            mockScreenHeight = 768;
            break;
          case 'surface':
            mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Touch) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            mockPlatform = 'Win32';
            mockMaxTouchPoints = 10;
            mockScreenWidth = 1368;
            mockScreenHeight = 912;
            break;
          case 'iphone':
            mockUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1';
            mockPlatform = 'iPhone';
            mockMaxTouchPoints = 5;
            mockScreenWidth = 390;
            mockScreenHeight = 844;
            break;
          default:
            console.error('Type d\'appareil non supporté');
            console.groupEnd();
            return;
        }
        
        // Sauvegarder les valeurs originales
        const originalUserAgent = navigator.userAgent;
        const originalPlatform = navigator.platform;
        const originalMaxTouchPoints = navigator.maxTouchPoints;
        const originalScreenWidth = window.screen.width;
        const originalScreenHeight = window.screen.height;
        
        // Simuler les valeurs
        Object.defineProperty(navigator, 'userAgent', { value: mockUserAgent, configurable: true });
        Object.defineProperty(navigator, 'platform', { value: mockPlatform, configurable: true });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: mockMaxTouchPoints, configurable: true });
        Object.defineProperty(window.screen, 'width', { value: mockScreenWidth, configurable: true });
        Object.defineProperty(window.screen, 'height', { value: mockScreenHeight, configurable: true });
        
        // Exécuter le test
        const result = detectTablet();
        const shouldUseDesktop = shouldUseDesktopMode();
        
        console.log('📱 User Agent simulé:', mockUserAgent);
        console.log('🖱️ Plateforme simulée:', mockPlatform);
        console.log('👆 Points tactiles simulés:', mockMaxTouchPoints);
        console.log('📏 Dimensions simulées:', mockScreenWidth + 'x' + mockScreenHeight);
        
        console.log('🎯 Résultat tablette:', result ? 'TABLETTE' : 'NON-TABLETTE');
        console.log('🖥️ Mode desktop:', shouldUseDesktop ? 'OUI' : 'NON');
        console.log('🚀 Système animation:', shouldUseDesktop ? 'DESKTOP' : 'MOBILE');
        
        // Restaurer les valeurs originales
        Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
        Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: originalMaxTouchPoints, configurable: true });
        Object.defineProperty(window.screen, 'width', { value: originalScreenWidth, configurable: true });
        Object.defineProperty(window.screen, 'height', { value: originalScreenHeight, configurable: true });
        
        console.groupEnd();
        return { deviceType, isTablet: result, shouldUseDesktop, animationSystem: shouldUseDesktop ? 'DESKTOP' : 'MOBILE' };
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