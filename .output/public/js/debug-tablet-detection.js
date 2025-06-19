/**
 * Script de debug pour la détection et gestion des tablettes
 * Fournit des outils pour tester et surveiller le comportement sur tablettes
 */

(function() {
  'use strict';

  console.log('🔧 Script de debug détection tablettes chargé');

  // Attendre que les systèmes soient initialisés
  const waitForSystems = () => {
    return new Promise((resolve) => {
      const check = () => {
        if (window.debugResponsiveAnimations && window.debugTabletDetection) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  waitForSystems().then(() => {
    console.log('✅ Systèmes de debug disponibles');

    // Fonction pour afficher l'état complet de la détection
    window.showTabletStatus = () => {
      const responsiveInfo = window.debugResponsiveAnimations.info();
      const tabletInfo = window.debugTabletDetection.info();

      console.group('📱 État complet de la détection tablette');
      
      console.log('🔍 Détection de base:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        hasTouch: 'ontouchstart' in window
      });

      console.log('📊 État système responsif:', responsiveInfo);
      console.log('📱 État détection tablette:', tabletInfo);

      console.log('🎯 Décisions automatiques:', {
        isTablet: responsiveInfo.isTablet,
        isMobile: responsiveInfo.isMobile,
        shouldUseDesktopAnimations: responsiveInfo.shouldUseDesktopAnimations,
        currentAnimationSystem: responsiveInfo.currentAnimationSystem,
        responsiveBreakpoint: tabletInfo.responsiveBreakpoint
      });

      console.groupEnd();
    };

    // Fonction pour tester les swipes
    window.testTabletSwipe = (direction = 'down', count = 1) => {
      console.log(`🧪 Test swipe tablette: ${direction} (${count} fois)`);
      
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          window.debugTabletDetection.testSwipe(direction === 'down' ? 'up' : 'down');
          console.log(`👆 Swipe ${i + 1}/${count} simulé`);
        }, i * 500);
      }
    };

    // Fonction pour forcer le mode tablette pour les tests
    window.forceTabletMode = () => {
      console.log('🔧 Forçage du mode tablette...');
      window.debugResponsiveAnimations.forceTabletMode();
      setTimeout(() => {
        window.showTabletStatus();
      }, 500);
    };

    // Fonction pour tester les animations sur différentes slides
    window.testTabletNavigation = () => {
      console.log('🧪 Test de navigation tablette - Slide 73');
      
      // Aller à la slide 73
      window.debugResponsiveAnimations.goToSection(1); // Assume slide 73 est index 1
      
      setTimeout(() => {
        console.log('👆 Simulation swipe pour déclencher animation slide 73');
        window.testTabletSwipe('down', 1);
        
        setTimeout(() => {
          console.log('👆 Simulation second swipe pour navigation slide suivante');
          window.testTabletSwipe('down', 1);
        }, 2000);
      }, 1000);
    };

    // Fonction pour surveiller les événements tactiles
    let touchMonitorEnabled = false;
    window.toggleTouchMonitor = () => {
      touchMonitorEnabled = !touchMonitorEnabled;
      
      if (touchMonitorEnabled) {
        console.log('🔍 Monitoring des événements tactiles activé');
        
        const monitorTouch = (e) => {
          console.log(`👆 Événement tactile: ${e.type}`, {
            clientY: e.touches?.[0]?.clientY || e.changedTouches?.[0]?.clientY,
            timestamp: Date.now(),
            touchCount: e.touches?.length || 0
          });
        };

        document.addEventListener('touchstart', monitorTouch);
        document.addEventListener('touchmove', monitorTouch);
        document.addEventListener('touchend', monitorTouch);
        
        // Stocker les listeners pour les supprimer plus tard
        window._touchMonitorListeners = [
          { event: 'touchstart', handler: monitorTouch },
          { event: 'touchmove', handler: monitorTouch },
          { event: 'touchend', handler: monitorTouch }
        ];
      } else {
        console.log('🔍 Monitoring des événements tactiles désactivé');
        
        if (window._touchMonitorListeners) {
          window._touchMonitorListeners.forEach(({ event, handler }) => {
            document.removeEventListener(event, handler);
          });
          delete window._touchMonitorListeners;
        }
      }
    };

    // Afficher les commandes disponibles
    console.group('🛠️ Commandes de debug tablettes disponibles');
    console.log('window.showTabletStatus() - Afficher l\'état complet');
    console.log('window.testTabletSwipe(direction, count) - Tester les swipes');
    console.log('window.forceTabletMode() - Forcer le mode tablette');
    console.log('window.testTabletNavigation() - Tester la navigation sur slide 73');
    console.log('window.toggleTouchMonitor() - Surveiller les événements tactiles');
    console.groupEnd();

    // Afficher l'état initial
    setTimeout(() => {
      window.showTabletStatus();
    }, 1000);

    // Surveiller les changements d'orientation
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        console.log('📱 Changement d\'orientation détecté');
        window.showTabletStatus();
      }, 500);
    });

    // Surveiller les redimensionnements
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log('📐 Redimensionnement détecté');
        window.showTabletStatus();
      }, 500);
    });
  });

})(); 