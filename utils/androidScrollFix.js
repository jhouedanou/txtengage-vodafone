export function useAndroidScrollFix() {
  const isAndroidChrome = () => {
    return /Android.*Chrome/.test(navigator.userAgent);
  };

  // Force le reset avec nettoyage complet pour Android
  const forceResetWithAndroidFix = (resetFunction, elements) => {
    if (!isAndroidChrome()) {
      resetFunction();
      return;
    }

    // Pour Android Chrome : reset en plusieurs étapes
    console.log('🤖 Android Chrome: Applying force reset');
    
    // Étape 1: Tuer toutes les animations en cours
    if (elements) {
      elements.forEach(el => {
        gsap.killTweensOf(el);
      });
    }
    
    // Étape 2: Forcer le repaint
    document.body.style.transform = 'translateZ(0)';
    
    // Étape 3: Reset principal
    resetFunction();
    
    // Étape 4: Reset avec délai (Android Chrome a besoin de temps)
    setTimeout(() => {
      resetFunction();
      console.log('🤖 Android Chrome: Delayed reset applied');
    }, 100);
    
    // Étape 5: Reset final avec force repaint
    setTimeout(() => {
      resetFunction();
      // Forcer le repaint en modifiant une propriété CSS
      document.body.style.transform = '';
      console.log('🤖 Android Chrome: Final reset with repaint');
    }, 200);
  };

  // ScrollTrigger spécial pour Android avec refresh forcé
  const createAndroidSafeScrollTrigger = (config) => {
    if (!isAndroidChrome()) {
      return ScrollTrigger.create(config);
    }

    // Pour Android : modifier la config pour être plus agressive
    const androidConfig = {
      ...config,
      refreshPriority: -1, // Priorité basse pour refresh en dernier
      onRefresh: () => {
        console.log('🤖 Android Chrome: ScrollTrigger refresh');
        if (config.onRefresh) config.onRefresh();
      }
    };

    const st = ScrollTrigger.create(androidConfig);
    
    // Refresh forcé après création pour Android
    setTimeout(() => {
      st.refresh();
    }, 50);
    
    return st;
  };

  // Détection de changement de viewport Android
  const setupAndroidViewportFix = (callback) => {
    if (!isAndroidChrome()) return;

    let lastHeight = window.innerHeight;
    let resizeTimeout;

    const checkAndroidResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = Math.abs(currentHeight - lastHeight);
      
      if (heightDiff > 20) { // Seuil plus bas pour Android
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          console.log('🤖 Android Chrome: Viewport change detected', {
            from: lastHeight,
            to: currentHeight,
            diff: heightDiff
          });
          
          // Force refresh et callback
          ScrollTrigger.refresh();
          if (callback) callback();
          
          lastHeight = currentHeight;
        }, 150);
      }
    };

    // Multiples événements pour Android
    window.addEventListener('resize', checkAndroidResize);
    window.addEventListener('orientationchange', checkAndroidResize);
    document.addEventListener('visibilitychange', checkAndroidResize);
    
    // Polling spécial Android (plus fréquent)
    const pollInterval = setInterval(checkAndroidResize, 300);
    
    return () => {
      window.removeEventListener('resize', checkAndroidResize);
      window.removeEventListener('orientationchange', checkAndroidResize);
      document.removeEventListener('visibilitychange', checkAndroidResize);
      clearInterval(pollInterval);
      clearTimeout(resizeTimeout);
    };
  };

  return {
    isAndroidChrome,
    forceResetWithAndroidFix,
    createAndroidSafeScrollTrigger,
    setupAndroidViewportFix
  };
}