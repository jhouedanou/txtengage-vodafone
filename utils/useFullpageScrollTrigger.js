import { ref, onUnmounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function useFullpageScrollTrigger() {
  // ===========================================================================
  // SECTION 1: CONFIGURATION ET VARIABLES GÉNÉRALES
  // ===========================================================================
  
  // Références et états globaux
  const sections = ref([]);
  const currentSectionIndex = ref(0);
  const isNavigating = ref(false);
  const hasScrolledOnce = ref(false);
  const animationStates = ref({});
  const isAnimating = ref(false);
  
  // Constantes
  const SCROLLER_SELECTOR = "#master-scroll-container";
  const sectionDuration = 1.2;
  const sectionEase = "power2.inOut";
  
  // AJOUTER CES VARIABLES MANQUANTES
  // NOUVELLES CONSTANTES AJOUTÉES
const tweenDuration = 0.4;
const tweenEase = "power3.easeInOut";
const slideEase = "power3.easeInOut";
const slideDuration = 0.7;

  // ===========================================================================
  // SECTION DETECTION MACOS ET GESTION TRACKPAD/MAGIC MOUSE
  // ===========================================================================
  
  // Détection des appareils macOS desktop (excluant mobile)
  const isMacOSDesktop = () => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // Vérifier si c'est macOS
    const isMac = /Mac|Macintosh|MacIntel|MacPPC|Mac68K/.test(platform) || 
                  /macOS/.test(userAgent);
    
    // Exclure les appareils mobiles iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    // Vérifier si c'est un ordinateur (pas mobile)
    const isDesktop = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));
    
    return isMac && !isIOS && isDesktop;
  };
  
  // Variables pour la gestion du debouncing sur macOS
  let lastScrollTime = 0;
  let scrollTimeoutId = null;
  let pendingScrollDirection = null;
  let isProcessingScroll = false;
  
  // Configuration du debouncing pour macOS
  const MACOS_SCROLL_DEBOUNCE_DELAY = 120; // Optimisé : 120ms pour animations (était 150ms)
  const MACOS_SCROLL_DEBOUNCE_DELAY_INTERNAL = 80; // Augmenté : 80ms pour défilement interne slides 23/128 (était 60ms)
  const MACOS_SCROLL_THRESHOLD = 30;       // Optimisé : 30ms pour détection double (était 50ms)
  
  // Fonction de debouncing spéciale pour macOS
  const debouncedMacOSScroll = (deltaY) => {
    const currentTime = Date.now();
    const timeSinceLastScroll = currentTime - lastScrollTime;
    
    // Si un scroll est déjà en cours de traitement, ignorer
    if (isProcessingScroll) {
      console.log('🚫 Scroll ignoré - traitement en cours');
      return;
    }
    
    // Déterminer la direction du scroll
    const direction = deltaY > 0 ? 'down' : 'up';
    
    // Vérifier si on doit appliquer le debouncing selon le contexte
    const debounceType = shouldApplyDebouncing(deltaY);
    
    if (debounceType !== false) {
      // Si le scroll est dans la même direction et trop rapide, l'ignorer
      if (pendingScrollDirection === direction && timeSinceLastScroll < MACOS_SCROLL_THRESHOLD) {
        console.log('🚫 Scroll double détecté et ignoré', { direction, timeSinceLastScroll, debounceType });
        return;
      }
      
      // Mettre à jour les variables de suivi
      lastScrollTime = currentTime;
      pendingScrollDirection = direction;
      
      // Effacer le timeout précédent
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }
      
      // Choisir le délai selon le type de debouncing
      const delay = debounceType === 'internal' ? MACOS_SCROLL_DEBOUNCE_DELAY_INTERNAL : MACOS_SCROLL_DEBOUNCE_DELAY;
      
      // Programmer l'exécution du scroll avec le délai approprié
      scrollTimeoutId = setTimeout(() => {
        if (!isProcessingScroll) {
          isProcessingScroll = true;
          console.log('✅ Exécution du scroll macOS avec debouncing', { 
            direction, 
            deltaY, 
            debounceType, 
            delay: delay + 'ms' 
          });
          
          // Exécuter le scroll avec la direction originale
          executeScrollAction(deltaY);
          
          // Réinitialiser après un délai
          setTimeout(() => {
            isProcessingScroll = false;
            pendingScrollDirection = null;
          }, 100);
        }
      }, delay);
    } else {
      // Navigation normale sans debouncing
      console.log('✅ Navigation normale macOS (sans debouncing)', { direction, deltaY });
      executeScrollAction(deltaY);
    }
  };
  
  // Fonction pour déterminer si on doit appliquer le debouncing
  const shouldApplyDebouncing = (deltaY) => {
    const currentSection = sections.value[currentSectionIndex.value];
    if (!currentSection) return false;
    
    const direction = deltaY > 0 ? 'down' : 'up';
    
    // Cas où on doit appliquer le debouncing (animations internes)
    if (direction === 'down') {
      // Slide-73 : animation points-fort pas encore déclenchée (DEBOUNCING RÉDUIT)
      if (currentSection.id === 'slide-73' && !animationStates.value['slide-73-complete']) {
        return 'internal';
      }
      
      // Slide-20 : animation text-element-5 pas encore déclenchée
      if (currentSection.id === 'slide-20') {
        if (!animationStates.value['slide-20-main-complete'] || 
            !animationStates.value['slide-20-text-element-5']) {
          return 'normal';
        }
      }
      
      // Slide-23 : défilement interne des perdrix (DEBOUNCING RÉDUIT)
      if (currentSection.id === 'slide-23' && animationStates.value['slide-23-initialized']) {
        return 'internal';
      }
      
      // Slide-128 : défilement interne des case-study (DEBOUNCING RÉDUIT)
      if (currentSection.id === 'slide-128' && animationStates.value['slide-128-initialized']) {
        return 'internal';
      }
    } else {
      // Direction up
      // Slide-73 : animation reverse (DEBOUNCING RÉDUIT)
      if (currentSection.id === 'slide-73' && 
          animationStates.value['slide-73-complete'] && 
          !animationStates.value['slide-73-reversing']) {
        return 'internal';
      }
      
      // Slide-23 : défilement interne des perdrix vers l'arrière (DEBOUNCING RÉDUIT)
      if (currentSection.id === 'slide-23' && animationStates.value['slide-23-initialized']) {
        return 'internal';
      }
      
      // Slide-128 : défilement interne des case-study vers l'arrière (DEBOUNCING RÉDUIT)
      if (currentSection.id === 'slide-128' && animationStates.value['slide-128-initialized']) {
        return 'internal';
      }
    }
    
    // Dans tous les autres cas : navigation normale sans debouncing
    return false;
  };
  
  // Fonction pour exécuter l'action de scroll
  const executeScrollAction = (deltaY) => {
    if (isNavigating.value) return;

    const currentSection = sections.value[currentSectionIndex.value];
    
    if (deltaY > 0) {
      // Scroll vers le bas
      console.log('📱 Scroll vers le bas');
      
      // Gestion spéciale pour slide-73
      if (currentSection && currentSection.id === 'slide-73') {
        if (!animationStates.value['slide-73-complete']) {
          triggerSlide73Animation();
          return;
        }
      }
      
      // Gestion spéciale pour slide-20 (#text-element-5)
      if (currentSection && currentSection.id === 'slide-20') {
        // Si l'animation principale n'est pas terminée, bloquer complètement
        if (!animationStates.value['slide-20-main-complete']) {
          return;
        }
        // Si l'animation principale est terminée mais text-element-5 pas encore affiché
        if (!animationStates.value['slide-20-text-element-5']) {
          triggerSlide20TextElement5();
          return;
        }
        // Si tout est terminé, permettre la navigation normale (continuer après ce if)
      }
      
      // Gestion spéciale pour slide-23 (défilement des perdrix)
      if (currentSection && currentSection.id === 'slide-23') {
        if (animationStates.value['slide-23-initialized']) {
          const canScrollForward = scrollPerdrixForward();
          if (canScrollForward === false) {
            // Toutes les slides perdrix sont terminées, passer à la slide suivante
            if (currentSectionIndex.value < sections.value.length - 1) {
              goToSection(currentSectionIndex.value + 1);
            }
          }
          return;
        }
      }
      
      // Gestion spéciale pour slide-128
      if (currentSection && currentSection.id === 'slide-128') {
        if (animationStates.value['slide-128-initialized']) {
          const canScrollForward = scrollSlide128Forward();
          if (canScrollForward === false) {
            // Tous les case-study-content sont terminés, passer à la slide suivante
            if (currentSectionIndex.value < sections.value.length - 1) {
              goToSection(currentSectionIndex.value + 1);
            }
          }
          return;
        }
      }
      
      // Navigation normale vers la slide suivante
      if (currentSectionIndex.value < sections.value.length - 1) {
        goToSection(currentSectionIndex.value + 1);
      }
      
    } else {
      // Scroll vers le haut
      console.log('📱 Scroll vers le haut');
      
      // Gestion spéciale pour slide-73 - inverser l'animation
      if (currentSection && currentSection.id === 'slide-73') {
        if (animationStates.value['slide-73-complete'] && !animationStates.value['slide-73-reversing']) {
          reverseSlide73Animation();
          return;
        }
      }
      
      // Gestion spéciale pour slide-23 (défilement des perdrix)
      if (currentSection && currentSection.id === 'slide-23') {
        if (animationStates.value['slide-23-initialized']) {
          // Si on est au début des perdrix-slides, permettre la navigation vers la slide précédente
          if (perdrixScrollIndex <= 0) {
            if (currentSectionIndex.value > 0) {
              goToSection(currentSectionIndex.value - 1);
            }
            return;
          }
          // Sinon, continuer le défilement des perdrix vers l'arrière
          scrollPerdrixBackward();
          return;
        }
      }
      
      // Gestion spéciale pour slide-128
      if (currentSection && currentSection.id === 'slide-128') {
        if (animationStates.value['slide-128-initialized']) {
          // Si on est au début des case-study-content, permettre la navigation vers la slide précédente
          if (slide128ScrollIndex <= 0) {
            if (currentSectionIndex.value > 0) {
              goToSection(currentSectionIndex.value - 1);
            }
            return;
          }
          // Sinon, continuer le défilement des case-study-content vers l'arrière
          scrollSlide128Backward();
          return;
        }
      }
      
      // Navigation normale vers la slide précédente
      if (currentSectionIndex.value > 0) {
        goToSection(currentSectionIndex.value - 1);
      }
    }
  };

  // Variables internes de gestion
  let stObserve = null;
  const keyboardListener = ref(null);
  const specificAnimationTriggers = [];
  const slideSpecificEventListeners = [];

  // ===========================================================================
  // SECTION 2: FONCTIONS UTILITAIRES
  // ===========================================================================

  const goToSection = (index, duration = sectionDuration) => {
    if (index < 0 || index >= sections.value.length || isNavigating.value) return;

    console.log(`🚀 Navigation vers section ${index}`);
    isNavigating.value = true;
    currentSectionIndex.value = index;

    const targetSection = sections.value[index];

    gsap.to(SCROLLER_SELECTOR, {
      scrollTo: { y: targetSection, autoKill: false },
      duration: duration,
      ease: sectionEase,
      onComplete: () => {
        console.log(`✅ Navigation terminée vers section ${index}`);
        isNavigating.value = false;
        hasScrolledOnce.value = true;

        // Déclencher les animations automatiques à l'arrivée sur certaines slides
        if (targetSection.id === 'slide-20') {
          // Ne pas déclencher ici car c'est géré par ScrollTrigger
        } else if (targetSection.id === 'slide-21') {
          triggerSlide21Animation();
        } else if (targetSection.id === 'slide-22') {
          triggerSlide22Animation();
        } else if (targetSection.id === 'slide-23') {
          triggerSlide23Animation();
        } else if (targetSection.id === 'slide-128') {
          triggerSlide128Animation();
        }
      }
    });
  };

  // ===========================================================================
  // SECTION 3: GESTION DES ÉVÉNEMENTS DE NAVIGATION
  // ===========================================================================

  const handleWheelEvent = (e) => {
    // Détecter si on est sur macOS desktop
    if (isMacOSDesktop()) {
      console.log('🍎 Détection macOS - utilisation du debouncing');
      e.preventDefault();
      debouncedMacOSScroll(e.deltaY);
      return;
    }
    
    // Comportement normal pour les autres systèmes
    if (isNavigating.value) return;

    const currentSection = sections.value[currentSectionIndex.value];
    
    if (e.deltaY > 0) {
      // Scroll vers le bas
      
      // Gestion spéciale pour slide-73
      if (currentSection && currentSection.id === 'slide-73') {
        if (!animationStates.value['slide-73-complete']) {
          triggerSlide73Animation();
          return;
        }
      }
      
      // Gestion spéciale pour slide-20 (#text-element-5)
      if (currentSection && currentSection.id === 'slide-20') {
        // Si l'animation principale n'est pas terminée, bloquer complètement
        if (!animationStates.value['slide-20-main-complete']) {
          return;
        }
        // Si l'animation principale est terminée mais text-element-5 pas encore affiché
        if (!animationStates.value['slide-20-text-element-5']) {
          triggerSlide20TextElement5();
          return;
        }
        // Si tout est terminé, permettre la navigation normale (continuer après ce if)
      }
      
      // Gestion spéciale pour slide-23 (défilement des perdrix)
      if (currentSection && currentSection.id === 'slide-23') {
        if (animationStates.value['slide-23-initialized']) {
          const canScrollForward = scrollPerdrixForward();
          if (canScrollForward === false) {
            // Toutes les slides perdrix sont terminées, passer à la slide suivante
            if (currentSectionIndex.value < sections.value.length - 1) {
              goToSection(currentSectionIndex.value + 1);
            }
          }
          return;
        }
      }
      
      // Gestion spéciale pour slide-128
      if (currentSection && currentSection.id === 'slide-128') {
        if (animationStates.value['slide-128-initialized']) {
          const canScrollForward = scrollSlide128Forward();
          if (canScrollForward === false) {
            // Tous les case-study-content sont terminés, passer à la slide suivante
            if (currentSectionIndex.value < sections.value.length - 1) {
              goToSection(currentSectionIndex.value + 1);
            }
          }
          return;
        }
      }
      
      // Navigation normale vers la slide suivante
      if (currentSectionIndex.value < sections.value.length - 1) {
        goToSection(currentSectionIndex.value + 1);
      }
      
    } else {
      // Scroll vers le haut
      
      // Gestion spéciale pour slide-73 - inverser l'animation
      if (currentSection && currentSection.id === 'slide-73') {
        if (animationStates.value['slide-73-complete'] && !animationStates.value['slide-73-reversing']) {
          reverseSlide73Animation();
          return;
        }
      }
      
      // Gestion spéciale pour slide-23 (défilement des perdrix)
      if (currentSection && currentSection.id === 'slide-23') {
        if (animationStates.value['slide-23-initialized']) {
          // Si on est au début des perdrix-slides, permettre la navigation vers la slide précédente
          if (perdrixScrollIndex <= 0) {
            if (currentSectionIndex.value > 0) {
              goToSection(currentSectionIndex.value - 1);
            }
            return;
          }
          // Sinon, continuer le défilement des perdrix vers l'arrière
          scrollPerdrixBackward();
          return;
        }
      }
      
      // Gestion spéciale pour slide-128
      if (currentSection && currentSection.id === 'slide-128') {
        if (animationStates.value['slide-128-initialized']) {
          // Si on est au début des case-study-content, permettre la navigation vers la slide précédente
          if (slide128ScrollIndex <= 0) {
            if (currentSectionIndex.value > 0) {
              goToSection(currentSectionIndex.value - 1);
            }
            return;
          }
          // Sinon, continuer le défilement des case-study-content vers l'arrière
          scrollSlide128Backward();
          return;
        }
      }
      
      // Navigation normale vers la slide précédente
      if (currentSectionIndex.value > 0) {
        goToSection(currentSectionIndex.value - 1);
      }
    }
  };

  const handleKeyboardNavigation = (e) => {
    if (isNavigating.value) return;

    const currentSection = sections.value[currentSectionIndex.value];

    switch(e.key) {
      case 'ArrowDown':
      case 'PageDown':
      case ' ': // Espace
        e.preventDefault();
        
        // Gestion spéciale pour slide-73
        if (currentSection && currentSection.id === 'slide-73') {
          if (!animationStates.value['slide-73-complete']) {
            triggerSlide73Animation();
            return;
          }
        }
        
        // Gestion spéciale pour slide-20 (#text-element-5)
        if (currentSection && currentSection.id === 'slide-20') {
          // Si l'animation principale n'est pas terminée, bloquer complètement
          if (!animationStates.value['slide-20-main-complete']) {
            return;
          }
          // Si l'animation principale est terminée mais text-element-5 pas encore affiché
          if (!animationStates.value['slide-20-text-element-5']) {
            triggerSlide20TextElement5();
            return;
          }
          // Si tout est terminé, permettre la navigation normale (continuer après ce if)
        }
        
        // Gestion spéciale pour slide-23 (défilement des perdrix)
        if (currentSection && currentSection.id === 'slide-23') {
          if (animationStates.value['slide-23-initialized']) {
            const canScrollForward = scrollPerdrixForward();
            if (canScrollForward === false) {
              // Toutes les slides perdrix sont terminées, passer à la slide suivante
              if (currentSectionIndex.value < sections.value.length - 1) {
                goToSection(currentSectionIndex.value + 1);
              }
            }
            return;
          }
        }
        
        // Gestion spéciale pour slide-128
        if (currentSection && currentSection.id === 'slide-128') {
          if (animationStates.value['slide-128-initialized']) {
            const canScrollForward = scrollSlide128Forward();
            if (canScrollForward === false) {
              // Tous les case-study-content sont terminés, passer à la slide suivante
              if (currentSectionIndex.value < sections.value.length - 1) {
                goToSection(currentSectionIndex.value + 1);
              }
            }
            return;
          }
        }
        
        // Navigation normale vers la slide suivante
        if (currentSectionIndex.value < sections.value.length - 1) {
          goToSection(currentSectionIndex.value + 1);
        }
        break;
        
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        
        // Gestion spéciale pour slide-73 - inverser l'animation
        if (currentSection && currentSection.id === 'slide-73') {
          if (animationStates.value['slide-73-complete'] && !animationStates.value['slide-73-reversing']) {
            reverseSlide73Animation();
            return;
          }
        }
        
        // Gestion spéciale pour slide-23 (défilement des perdrix)
        if (currentSection && currentSection.id === 'slide-23') {
          if (animationStates.value['slide-23-initialized']) {
            // Si on est au début des perdrix-slides, permettre la navigation vers la slide précédente
            if (perdrixScrollIndex <= 0) {
              if (currentSectionIndex.value > 0) {
                goToSection(currentSectionIndex.value - 1);
              }
              return;
            }
            // Sinon, continuer le défilement des perdrix vers l'arrière
            scrollPerdrixBackward();
            return;
          }
        }
        
        // Gestion spéciale pour slide-128
        if (currentSection && currentSection.id === 'slide-128') {
          if (animationStates.value['slide-128-initialized']) {
            // Si on est au début des case-study-content, permettre la navigation vers la slide précédente
            if (slide128ScrollIndex <= 0) {
              if (currentSectionIndex.value > 0) {
                goToSection(currentSectionIndex.value - 1);
              }
              return;
            }
            // Sinon, continuer le défilement des case-study-content vers l'arrière
            scrollSlide128Backward();
            return;
          }
        }
        
        // Navigation normale vers la slide précédente
        if (currentSectionIndex.value > 0) {
          goToSection(currentSectionIndex.value - 1);
        }
        break;
        
      case 'Home':
        e.preventDefault();
        goToSection(0);
        break;
        
      case 'End':
        e.preventDefault();
        goToSection(sections.value.length - 1);
        break;
    }
  };

  // ===========================================================================
  // SECTION 4: ANIMATIONS SPÉCIFIQUES AUX SLIDES
  // ===========================================================================

// SLIDE-73 : Animation complète des points forts avec fade des li
const registerSlide73Animation = () => {
  const slide73Section = sections.value.find(s => s.id === 'slide-73');
  if (!slide73Section) return;

  const slidesContainerDiv = slide73Section.querySelector('.slides-container');
  const pointsFortDiv = slide73Section.querySelector('.points-fort');
  const pointsFortLis = slide73Section.querySelectorAll('.points-fort li');

  if (slidesContainerDiv && pointsFortDiv) {
    // État initial
    gsap.set(slidesContainerDiv, {
      opacity: 1,
      visibility: 'inherit',
      height: '100vh',
      width: '100vw',
      backgroundSize:'cover',
      backgroundPositionX: '0vw', // Position initiale explicite
      backgroundRepeat: 'no-repeat',
    });
    
    gsap.set(pointsFortDiv, {
      opacity: 1,
      visibility: 'inherit',
      height: '100vh',
      width: '0vw',
      x: '100vw' // Commence complètement hors du champ à droite
    });

    // Cacher initialement tous les li
    if (pointsFortLis.length > 0) {
      gsap.set(pointsFortLis, {
        autoAlpha: 0,
        y: 30
      });
    }
  }

  const st = ScrollTrigger.create({
    trigger: slide73Section,
    scroller: SCROLLER_SELECTOR,
    start: 'top center+=10%',
    onEnter: () => {
      // Pas d'animation automatique, attendre le scroll
    },
    onLeave: () => {
      // Conserver l'état final quand on descend
    },
    onEnterBack: () => {
      // Conserver l'état actuel et permettre le contrôle par scroll
      // Ne pas réinitialiser automatiquement
      console.log('Slide-73: Retour du bas, état conservé pour contrôle scroll');
    },
    onLeaveBack: () => {
      // Réinitialiser seulement quand on quitte vers le haut
      resetSlide73Animation();
    }
  });

  specificAnimationTriggers.push(st);
};

const triggerSlide73Animation = () => {
  if (animationStates.value['slide-73-complete']) return;
  
  const slide73Section = sections.value.find(s => s.id === 'slide-73');
  const slidesContainerDiv = slide73Section?.querySelector('.slides-container');
  const pointsFortDiv = slide73Section?.querySelector('.points-fort');
  const pointsFortLis = slide73Section?.querySelectorAll('.points-fort li');
  
  if (!slidesContainerDiv || !pointsFortDiv) return;

  animationStates.value['slide-73-animating'] = true;
  isNavigating.value = true;

  const tl = gsap.timeline({
    onComplete: () => {
      animationStates.value['slide-73-complete'] = true;
      animationStates.value['slide-73-animating'] = false;
      isNavigating.value = false;
      console.log('Slide-73: Animation terminée');
    }
  });

  // Phase 1: Faire entrer points-fort à moitié dans le champ
  tl.to(pointsFortDiv, {
    width: '50vw', // Prends la moitié de la largeur
    x: 0, // Entre à moitié dans le champ
    duration: 0.5,
    ease: 'power3.easeInOut'
  })
  .to(slidesContainerDiv, {
    backgroundPositionX: '-20vw', // Déplace le background de -50vw
    duration: 0.5,
    ease: 'power3.easeInOut'
  }, "<"); // "<" pour démarrer en même temps
  // Phase 2: Faire apparaître les li en cascade avec un délai
  if (pointsFortLis.length > 0) {
    tl.to(pointsFortLis, {
      autoAlpha: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.1, // Délai entre chaque li
      ease: 'power2.out'
    }, "+=0.3"); // Délai de 0.3s après l'entrée du container
  }
};

// Nouvelle fonction pour inverser l'animation slide-73
const reverseSlide73Animation = () => {
  if (!animationStates.value['slide-73-complete']) return;
  
  const slide73Section = sections.value.find(s => s.id === 'slide-73');
  const slidesContainerDiv = slide73Section?.querySelector('.slides-container');
  const pointsFortDiv = slide73Section?.querySelector('.points-fort');
  const pointsFortLis = slide73Section?.querySelectorAll('.points-fort li');
  
  if (!slidesContainerDiv || !pointsFortDiv) return;

  animationStates.value['slide-73-reversing'] = true;
  isNavigating.value = true;

  const tl = gsap.timeline({
    onComplete: () => {
      animationStates.value['slide-73-complete'] = false;
      animationStates.value['slide-73-reversing'] = false;
      isNavigating.value = false;
      console.log('Slide-73: Animation inversée terminée');
    }
  });

  // Phase 1: Masquer les li d'abord
  if (pointsFortLis.length > 0) {
    tl.to(pointsFortLis, {
      autoAlpha: 0,
      y: 30,
      duration: 0.3,
      stagger: -0.05, // Stagger inversé (dernier en premier)
      ease: 'power2.in'
    });
  }

  // Phase 2: Faire sortir points-fort et remettre background en place
  tl.to(pointsFortDiv, {
    width: '0vw',
    x: '100vw', // Sort complètement du champ
    duration: 0.5,
    ease: 'power3.easeInOut'
  }, "+=0.2")
  .to(slidesContainerDiv, {
    backgroundPositionX: '0vw', // Remet le background à sa position initiale
    duration: 0.5,
    ease: 'power3.easeInOut'
  }, "<"); // En parallèle
};

// Mise à jour du resetSlide73Animation pour réinitialiser le background seulement sur slide-21
const resetSlide73Animation = () => {
  const slide73Section = sections.value.find(s => s.id === 'slide-73');
  const slidesContainerDiv = slide73Section?.querySelector('.slides-container');
  const pointsFortDiv = slide73Section?.querySelector('.points-fort');
  const pointsFortLis = slide73Section?.querySelectorAll('.points-fort li');
  
  if (slidesContainerDiv && pointsFortDiv) {
    // Ne plus réinitialiser le background - conserver la position -20vw
    
    // Remettre points-fort hors du champ (toujours)
    gsap.set(pointsFortDiv, {
      width: '0vw',
      x: '100vw'
    });

    // Cacher à nouveau tous les li (toujours)
    if (pointsFortLis.length > 0) {
      gsap.set(pointsFortLis, {
        autoAlpha: 0,
        y: 30
      });
    }
  }
  
  animationStates.value['slide-73-complete'] = false;
  animationStates.value['slide-73-animating'] = false;
  animationStates.value['slide-73-reversing'] = false;
};

  // SLIDE-21 : Faire apparaître le texte une fois la slide visible
  const triggerSlide21Animation = () => {
    if (animationStates.value['slide-21-complete']) return;
    
    const slide21Section = sections.value.find(s => s.id === 'slide-21');
    const thoiathoing = slide21Section?.querySelector('#thoiathoing');
    
    if (thoiathoing) {
      isNavigating.value = true;
      gsap.to(thoiathoing, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          animationStates.value['slide-21-complete'] = true;
          isNavigating.value = false;
        }
      });
    }
  };

  // SLIDE-20 : Animation de #turtlebeach puis éléments apparaissent les uns après les autres
  const registerSlide20Animation = () => {
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    if (!slide20Section) return;

    const turtlebeach = slide20Section.querySelector('#turtlebeach');
    const textElements = slide20Section.querySelectorAll('.text-element:not(#text-element-5)');
    const textElement5 = slide20Section.querySelector('#text-element-5');

    // État initial avec les paramètres de référence
    if (turtlebeach) {
      gsap.set(turtlebeach, { 
        autoAlpha: 0, 
        scale: 0.8,
        y: 50,
        rotation: -5
      });
    }

    if (textElements.length > 0) {
      gsap.set(textElements, { 
        autoAlpha: 0, 
        y: 100
      });
    }
    if (textElement5) {
      gsap.set(textElement5, { 
        autoAlpha: 0, 
        y: 100
      });
    }

    const st = ScrollTrigger.create({
      trigger: slide20Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        // Bloquer immédiatement la navigation dès l'entrée
        isNavigating.value = true;
        // Déclencher l'animation automatique d'entrée
        triggerSlide20Animation();
      },
      onEnterBack: () => {
        // Bloquer immédiatement la navigation
        isNavigating.value = true;
        // Réinitialiser complètement quand on revient du bas
        resetSlide20Animation();
        // Puis relancer l'animation après un délai
        setTimeout(() => {
          triggerSlide20Animation();
        }, 100);
      },
      onLeaveBack: () => {
        // Réinitialiser quand on quitte vers le haut
        resetSlide20Animation();
      },
      onLeave: () => {
        // Réinitialiser aussi quand on quitte vers le bas pour éviter les conflits
        resetSlide20Animation();
      }
    });

    specificAnimationTriggers.push(st);
  };

  const triggerSlide20Animation = () => {
    if (animationStates.value['slide-20-main-complete']) return;
    
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    const turtlebeach = slide20Section?.querySelector('#turtlebeach');
    const textElements = slide20Section?.querySelectorAll('.text-element:not(#text-element-5)');
    
    if (!turtlebeach) {
      // Si pas d'élément trouvé, débloquer la navigation
      isNavigating.value = false;
      return;
    }

    // S'assurer que la navigation est bloquée (pourrait déjà l'être depuis ScrollTrigger)
    animationStates.value['slide-20-animating'] = true;
    isNavigating.value = true;

    const tl = gsap.timeline({
      onComplete: () => {
        animationStates.value['slide-20-main-complete'] = true;
        animationStates.value['slide-20-animating'] = false;
        isNavigating.value = false;
        console.log('Slide-20: Animation principale terminée');
      }
    });

    // Phase 1: Animation de #turtlebeach en premier
    tl.to(turtlebeach, {
      autoAlpha: 1,
      scale: 1,
      y: 0,
      rotation: 0,
      duration: 0.8,
      ease: 'back.out(1.7)'
    });

    // Phase 2: Animation des éléments texte après turtlebeach
    if (textElements && textElements.length > 0) {
      tl.to(textElements, {
        autoAlpha: 1,
        y: 0,
        duration: tweenDuration,
        stagger: 0.15, // Délai entre chaque élément
        ease: tweenEase
      }, "+=0.3"); // Délai de 0.3s après turtlebeach
    }
  };

  const triggerSlide20TextElement5 = () => {
    if (animationStates.value['slide-20-text-element-5']) return;
    
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    const textElement5 = slide20Section?.querySelector('#text-element-5');
    
    if (textElement5) {
      isNavigating.value = true;
      gsap.to(textElement5, {
        autoAlpha: 1,
        y: 0,
        duration: tweenDuration, // ← Maintenant définie
        ease: tweenEase, // ← Maintenant définie
        onComplete: () => {
          animationStates.value['slide-20-text-element-5'] = true;
          isNavigating.value = false;
        }
      });
    }
  };

  const resetSlide20Animation = () => {
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    const turtlebeach = slide20Section?.querySelector('#turtlebeach');
    const textElements = slide20Section?.querySelectorAll('.text-element');
    
    // Réinitialiser #turtlebeach
    if (turtlebeach) {
      gsap.set(turtlebeach, { 
        autoAlpha: 0, 
        scale: 0.8,
        y: 50,
        rotation: -5
      });
    }

    // Réinitialiser tous les éléments texte
    if (textElements) {
      gsap.set(textElements, { 
        autoAlpha: 0, 
        y: 100
      });
    }
    
    // Reset des états
    animationStates.value['slide-20-main-complete'] = false;
    animationStates.value['slide-20-text-element-5'] = false;
    animationStates.value['slide-20-animating'] = false;
  };

  // SLIDE-22 : Faire apparaître le texte une fois la slide visible
  const triggerSlide22Animation = () => {
    if (animationStates.value['slide-22-complete']) return;
    
    const slide22Section = sections.value.find(s => s.id === 'slide-22');
    const textContent = slide22Section?.querySelector('.text-element, .content');
    
    if (textContent) {
      isNavigating.value = true;
      gsap.to(textContent, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          animationStates.value['slide-22-complete'] = true;
          isNavigating.value = false;
        }
      });
    }
  };

  // SLIDE-23 : Afficher #perdrix-slide-1 et gérer le défilement avec synchronisation des image-containers
  const registerSlide23Animation = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    if (!slide23Section) return;

    // Chercher les éléments essentiels
    const perdrixContainer = slide23Section.querySelector('#perdrix-container, #bygone-bip');
    const perdrixSlides = slide23Section.querySelectorAll('.perdrix-slide');
    const firstPerdrixSlide = slide23Section.querySelector('#perdrix-slide-1');
    // Nouvelle structure : les image-containers sont maintenant dans .bdrs
    const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');

    console.log('Slide-23 Register Advanced:', {
      slide23Section: !!slide23Section,
      perdrixContainer: !!perdrixContainer,
      perdrixSlidesCount: perdrixSlides.length,
      firstPerdrixSlide: !!firstPerdrixSlide,
      imageContainersCount: imageContainers.length,
      bdrsContainer: !!slide23Section.querySelector('.bdrs')
    });

    // État initial - masquer le conteneur et préparer les slides
    if (perdrixContainer) {
      gsap.set(perdrixContainer, { autoAlpha: 1 });
    }
    
    // Initialiser tous les perdrix-slides - masqués sauf le premier
    if (perdrixSlides.length > 0) {
      perdrixSlides.forEach((slide, index) => {
        const textContainer = slide.querySelector('.text-container');
        
        if (index === 0) {
          // Premier slide : visible
          gsap.set(slide, { autoAlpha: 1 });
          if (textContainer) gsap.set(textContainer, { y: 0 });
        } else {
          // Autres slides : masqués et positionnés
          gsap.set(slide, { autoAlpha: 0 });
          if (textContainer) gsap.set(textContainer, { y: '100vh', autoAlpha: 0 });
        }
      });
    }

    // Initialiser tous les image-containers - masqués sauf le premier
    if (imageContainers.length > 0) {
      imageContainers.forEach((container, index) => {
        if (index === 0) {
          // Premier container : visible
          gsap.set(container, { autoAlpha: 1, y: 0 });
        } else {
          // Autres containers : positionnés hors du viewport mais visibles
          gsap.set(container, { autoAlpha: 1, y: '504px' });
        }
      });
    }

    const st = ScrollTrigger.create({
      trigger: slide23Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        triggerSlide23Animation();
      },
      onEnterBack: () => {
        triggerSlide23Animation();
      },
      onLeave: () => {
        // Maintenir l'état en quittant
      },
      onLeaveBack: () => {
        resetSlide23Animation();
      }
    });

    specificAnimationTriggers.push(st);
  };

  const triggerSlide23Animation = () => {
    if (animationStates.value['slide-23-initialized']) return;
    
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    const perdrixContainer = slide23Section?.querySelector('#perdrix-container, #bygone-bip');
    const firstPerdrixSlide = slide23Section?.querySelector('#perdrix-slide-1');
    // Nouvelle structure : premier image-container dans .bdrs
    const firstImageContainer = slide23Section?.querySelector('.bdrs .image-container:first-child');
    
    console.log('Démarrage animation slide-23 avancée');
    
    if (perdrixContainer) {
      // Afficher le conteneur et le premier case-study-content
      gsap.to(perdrixContainer, {
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          // S'assurer que le premier case-study-content est visible
          if (firstPerdrixSlide) {
            gsap.set(firstPerdrixSlide, { autoAlpha: 1 });
          }
          if (firstImageContainer) {
            gsap.set(firstImageContainer, { autoAlpha: 1, y: 0 });
          }
          
          animationStates.value['slide-23-initialized'] = true;
          animationStates.value['slide-23-current-index'] = 0;
          console.log('Slide-23 initialisée - Premier slide et première image affichés');
        }
      });
    } else {
      console.error('Slide-23: Container not found');
      animationStates.value['slide-23-initialized'] = true;
    }
  };

  // Variables pour le défilement perdrix
  let perdrixScrollIndex = 0;
  let maxPerdrixScroll = 0; // Sera calculé dynamiquement
  let isScrollingPerdrix = false;

  const initializePerdrixScrollLimits = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    const perdrixSlides = slide23Section?.querySelectorAll('.perdrix-slide');
    // Nouvelle structure : image-containers dans .bdrs
    const imageContainers = slide23Section?.querySelectorAll('.bdrs .image-container');
    // Prendre le maximum entre perdrix slides et image containers
    const perdrixCount = perdrixSlides ? perdrixSlides.length : 0;
    const imageCount = imageContainers ? imageContainers.length : 0;
    maxPerdrixScroll = Math.max(perdrixCount, imageCount) - 1;
    console.log(`Perdrix scroll limites: max = ${maxPerdrixScroll} (perdrix: ${perdrixCount}, images: ${imageCount})`);
  };

  const scrollPerdrixForward = () => {
    if (isScrollingPerdrix) return;
    
    // Initialiser les limites si pas encore fait
    if (maxPerdrixScroll === 0) {
      initializePerdrixScrollLimits();
    }
    
    // Si on a atteint la fin, permettre la navigation vers la slide suivante
    if (perdrixScrollIndex >= maxPerdrixScroll) {
      console.log('Fin des slides perdrix atteinte, navigation vers slide suivante');
      isNavigating.value = false; // Débloquer la navigation
      return false; // Indiquer qu'on peut passer à la slide suivante
    }
    
    isScrollingPerdrix = true;
    isNavigating.value = true;
    
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    const currentSlide = slide23Section?.querySelector(`#perdrix-slide-${perdrixScrollIndex + 1}`);
    const nextSlide = slide23Section?.querySelector(`#perdrix-slide-${perdrixScrollIndex + 2}`);
    // Nouvelle structure : image-containers dans .bdrs
    const currentImageContainer = slide23Section?.querySelector(`.bdrs #image-container-${perdrixScrollIndex + 1}`);
    const nextImageContainer = slide23Section?.querySelector(`.bdrs #image-container-${perdrixScrollIndex + 2}`);
    
    console.log(`Défilement perdrix avant: ${perdrixScrollIndex} -> ${perdrixScrollIndex + 1}`);
    
    const tl = gsap.timeline({
      onComplete: () => {
        perdrixScrollIndex++;
        animationStates.value['slide-23-current-index'] = perdrixScrollIndex;
        isScrollingPerdrix = false;
        isNavigating.value = false;
        console.log(`Défilement terminé - nouvel index: ${perdrixScrollIndex}`);
      }
    });

    // Animation des perdrix-slides sans fade
    if (currentSlide && nextSlide) {
      const currentTextContainer = currentSlide.querySelector('.text-container');
      const nextTextContainer = nextSlide.querySelector('.text-container');
      
      // Préparer le slide suivant
      gsap.set(nextSlide, { autoAlpha: 1 });
      if (nextTextContainer) {
        gsap.set(nextTextContainer, { y: '100vh', autoAlpha: 0 });
      }
      
      // Animation simultanée des text-containers
      if (currentTextContainer) {
        tl.to(currentTextContainer, {
          y: '-100vh',
          autoAlpha: 1,
          duration: 0.4,
          ease: 'power3.easeInOut'
        }, 0);
      }
      
      if (nextTextContainer) {
        tl.to(nextTextContainer, {
          y: 0,
          autoAlpha: 1,
          duration: 0.4,
          ease: 'power3.easeInOut'
        }, 0);
      }
      
      // Masquer le slide actuel après l'animation
      tl.to(currentSlide, {
        autoAlpha: 1,
        duration: 0.1,
        ease: 'power3.out'
      }, 0.4);
    }

    // Animation synchronisée des image-containers sans fade
    if (currentImageContainer && nextImageContainer) {
      // Préparer le container suivant
      gsap.set(nextImageContainer, { autoAlpha: 1, y: '504px' });
      
      // Animation simultanée des image-containers - l'ancienne reste visible
      tl.to(currentImageContainer, {
        y: '-504px',
        duration: 0.4,
        ease: 'power3.easeInOut'
      }, 0);
      
      tl.to(nextImageContainer, {
        y: 0,
        duration: 0.4,
        ease: 'power3.easeInOut'
      }, 0);
    }

    return true; // Indiquer que l'animation a été lancée
  };

  const scrollPerdrixBackward = () => {
    if (isScrollingPerdrix || perdrixScrollIndex <= 0) return;
    
    isScrollingPerdrix = true;
    isNavigating.value = true;
    
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    const currentSlide = slide23Section?.querySelector(`#perdrix-slide-${perdrixScrollIndex + 1}`);
    const prevSlide = slide23Section?.querySelector(`#perdrix-slide-${perdrixScrollIndex}`);
    // Nouvelle structure : image-containers dans .bdrs
    const currentImageContainer = slide23Section?.querySelector(`.bdrs #image-container-${perdrixScrollIndex + 1}`);
    const prevImageContainer = slide23Section?.querySelector(`.bdrs #image-container-${perdrixScrollIndex}`);
    
    console.log(`Défilement perdrix arrière: ${perdrixScrollIndex} -> ${perdrixScrollIndex - 1}`);
    
    const tl = gsap.timeline({
      onComplete: () => {
        perdrixScrollIndex--;
        animationStates.value['slide-23-current-index'] = perdrixScrollIndex;
        isScrollingPerdrix = false;
        isNavigating.value = false;
        console.log(`Défilement arrière terminé - nouvel index: ${perdrixScrollIndex}`);
      }
    });

    // Animation des perdrix-slides sans fade
    if (currentSlide && prevSlide) {
      const currentTextContainer = currentSlide.querySelector('.text-container');
      const prevTextContainer = prevSlide.querySelector('.text-container');
      
      // Préparer le slide précédent
      gsap.set(prevSlide, { autoAlpha: 1 });
      if (prevTextContainer) {
        gsap.set(prevTextContainer, { y: '-100vh', autoAlpha: 0 });
      }
      
      // Animation simultanée des text-containers
      if (currentTextContainer) {
        tl.to(currentTextContainer, {
          y: '100vh',
          autoAlpha: 1,
          duration: 0.4,
          ease: 'power3.easeInOut'
        }, 0);
      }
      
      if (prevTextContainer) {
        tl.to(prevTextContainer, {
          y: 0,
          autoAlpha: 1,
          duration: 0.4,
          ease: 'power3.easeInOut'
        }, 0);
      }
      
      // Masquer le slide actuel après l'animation
      tl.to(currentSlide, {
        autoAlpha: 0,
        duration: 0.1,
        ease: 'power3.out'
      }, 0.4);
    }

    // Animation synchronisée des image-containers sans fade
    if (currentImageContainer && prevImageContainer) {
      // Préparer le container précédent
      gsap.set(prevImageContainer, { autoAlpha: 1, y: '-504px' });
      
      // Animation simultanée des image-containers - l'ancienne reste visible
      tl.to(currentImageContainer, {
        y: '504px',
        duration: 0.4,
        ease: 'power3.easeInOut'
      }, 0);
      
      tl.to(prevImageContainer, {
        y: 0,
        duration: 0.4,
        ease: 'power3.easeInOut'
      }, 0);
    }
  };

  const resetSlide23Animation = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    const perdrixContainer = slide23Section?.querySelector('#perdrix-container, #bygone-bip');
    const perdrixSlides = slide23Section?.querySelectorAll('.perdrix-slide');
    // Nouvelle structure : image-containers dans .bdrs
    const imageContainers = slide23Section?.querySelectorAll('.bdrs .image-container');
    
    console.log('Reset slide-23 animation');
    
    if (perdrixContainer) {
      gsap.set(perdrixContainer, { autoAlpha: 0 });
    }
    
    if (perdrixSlides) {
      perdrixSlides.forEach((slide, index) => {
        const textContainer = slide.querySelector('.text-container');
        
        if (index === 0) {
          // Premier slide : prêt pour réinitialisation
          gsap.set(slide, { autoAlpha: 1 });
          if (textContainer) gsap.set(textContainer, { y: 0 });
        } else {
          // Autres slides : masqués
          gsap.set(slide, { autoAlpha: 0 });
          if (textContainer) gsap.set(textContainer, { y: '100vh', autoAlpha: 0 });
        }
      });
    }

    // Réinitialiser les image-containers
    if (imageContainers) {
      imageContainers.forEach((container, index) => {
        if (index === 0) {
          // Premier container : prêt pour réinitialisation
          gsap.set(container, { autoAlpha: 1, y: 0 });
        } else {
          // Autres containers : positionnés hors du viewport mais visibles
          gsap.set(container, { autoAlpha: 1, y: '504px' });
        }
      });
    }
    
    // Reset des variables
    perdrixScrollIndex = 0;
    maxPerdrixScroll = 0;
    isScrollingPerdrix = false;
    animationStates.value['slide-23-initialized'] = false;
    animationStates.value['slide-23-current-index'] = 0;
  };

  // SLIDE-59 : Afficher #llass avec effet de remplissage et gestion de navigation
  const registerSlide59Animation = () => {
    const slide59Section = sections.value.find(s => s.id === 'slide-59');
    if (!slide59Section) return;

    const llassDiv = slide59Section.querySelector('#llass');
    const leleDiv = slide59Section.querySelector('#lele');

    // État initial
    if (llassDiv) {
      gsap.set(llassDiv, { 
        autoAlpha: 1, // Visible mais masqué par clip-path
        clipPath: 'inset(0 0 0 100%)', // Masqué complètement depuis la gauche
        transformOrigin: 'center left'
      });
    }
    if (leleDiv) {
      gsap.set(leleDiv, { 
        autoAlpha: 1
      });
    }

    const st = ScrollTrigger.create({
      trigger: slide59Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        // Animation automatique à l'entrée - ne pas bloquer la navigation
        triggerSlide59Animation();
      },
      onEnterBack: () => {
        // Réinitialiser et rejouer l'animation
        resetSlide59Animation();
        setTimeout(() => {
          triggerSlide59Animation();
        }, 100);
      },
      onLeaveBack: () => {
        // Réinitialiser quand on quitte vers le haut
        resetSlide59Animation();
      },
      onLeave: () => {
        // Maintenir l'état quand on descend
      }
    });

    specificAnimationTriggers.push(st);
  };

  const triggerSlide59Animation = () => {
    if (animationStates.value['slide-59-lass-shown']) return;
    
    const slide59Section = sections.value.find(s => s.id === 'slide-59');
    const llassDiv = slide59Section?.querySelector('#llass');
    
    if (llassDiv) {
      // Ne pas bloquer la navigation - l'animation se joue en arrière-plan
      // isNavigating.value = true; // SUPPRIMÉ - ne plus bloquer la navigation
      
      // Animation avec effet de remplissage des barres rouges de gauche à droite
      gsap.to(llassDiv, {
        clipPath: 'inset(0 0 0 0%)', // Révèle complètement l'image de gauche à droite
        duration: 1.5, // Plus long pour voir le remplissage
        ease: "power2.out", // Effet fluide pour le remplissage
        onComplete: () => {
          animationStates.value['slide-59-lass-shown'] = true;
          // isNavigating.value = false; // SUPPRIMÉ - la navigation n'était pas bloquée
          console.log('Slide-59: Animation de remplissage #llass (gauche→droite) terminée');
        }
      });
    }
  };

  const resetSlide59Animation = () => {
    const slide59Section = sections.value.find(s => s.id === 'slide-59');
    const llassDiv = slide59Section?.querySelector('#llass');
    const leleDiv = slide59Section?.querySelector('#lele');
    
    if (llassDiv) {
      gsap.set(llassDiv, { 
        autoAlpha: 1, // Visible mais masqué par clip-path
        clipPath: 'inset(0 0 0 100%)', // Masqué complètement depuis la gauche
        transformOrigin: 'center left'
      });
    }
    if (leleDiv) {
      gsap.set(leleDiv, { autoAlpha: 1 });
    }
    
    animationStates.value['slide-59-lass-shown'] = false;
    console.log('Slide-59: Animation reset');
  };

  // SLIDE-128 : Afficher #killerwu et gérer le cycle des case-study-content
  const registerSlide128Animation = () => {
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    if (!slide128Section) return;

    const killerwuDiv = slide128Section.querySelector('#killerwu');
    const caseStudyContents = slide128Section.querySelectorAll('.case-study-content');
    const caseStudyItems = slide128Section.querySelectorAll('.case-study-item');

    console.log('Slide-128 Register:', {
      slide128Section: !!slide128Section,
      killerwuDiv: !!killerwuDiv,
      caseStudyContentsCount: caseStudyContents.length,
      caseStudyItemsCount: caseStudyItems.length
    });

    // État initial
    if (killerwuDiv) {
      gsap.set(killerwuDiv, { autoAlpha: 0 });
    }
    
    // Initialiser tous les case-study-item et leurs case-study-content - masqués sauf le premier
    if (caseStudyItems.length > 0) {
      caseStudyItems.forEach((item, index) => {
        const content = item.querySelector('.case-study-content');
        if (content) {
          if (index === 0) {
            // Premier item : visible avec classe active
            gsap.set(content, { autoAlpha: 1, y: 0, display: 'block' });
            item.classList.add('active');
          } else {
            // Autres items : masqués et positionnés
            gsap.set(content, { autoAlpha: 0, y: '50px', display: 'none' });
            item.classList.remove('active');
          }
        }
      });
    }

    const st = ScrollTrigger.create({
      trigger: slide128Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        triggerSlide128Animation();
      },
      onEnterBack: () => {
        triggerSlide128Animation();
      },
      onLeave: () => {
        // Maintenir l'état en quittant
      },
      onLeaveBack: () => {
        resetSlide128Animation();
      }
    });

    specificAnimationTriggers.push(st);
  };

  const triggerSlide128Animation = () => {
    if (animationStates.value['slide-128-initialized']) return;
    
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    const killerwuDiv = slide128Section?.querySelector('#killerwu');
    const firstCaseStudyItem = slide128Section?.querySelector('.case-study-item:first-child');
    const firstCaseStudyContent = firstCaseStudyItem?.querySelector('.case-study-content');
    
    console.log('Démarrage animation slide-128 avec cycle des case-study-content');
    
    if (killerwuDiv) {
      // Afficher le conteneur et le premier case-study-content
      gsap.to(killerwuDiv, {
        autoAlpha: 1,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          // S'assurer que le premier case-study-content est visible
          if (firstCaseStudyContent && firstCaseStudyItem) {
            gsap.set(firstCaseStudyContent, { autoAlpha: 1, y: 0, display: 'block' });
            firstCaseStudyItem.classList.add('active');
          }
          
          animationStates.value['slide-128-initialized'] = true;
          animationStates.value['slide-128-current-index'] = 0;
          console.log('Slide-128 initialisée - Premier case-study-content affiché');
        }
      });
    } else {
      console.error('Slide-128: #killerwu not found');
      animationStates.value['slide-128-initialized'] = true;
    }
  };

  // Variables pour le défilement des case studies
  let slide128ScrollIndex = 0;
  let maxSlide128Scroll = 0; // Sera calculé dynamiquement
  let isScrollingSlide128 = false;

  const initializeSlide128ScrollLimits = () => {
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    const caseStudyItems = slide128Section?.querySelectorAll('.case-study-item');
    maxSlide128Scroll = caseStudyItems ? caseStudyItems.length - 1 : 0;
    console.log(`Slide-128 scroll limites: max = ${maxSlide128Scroll} (${caseStudyItems ? caseStudyItems.length : 0} items)`);
  };

  const scrollSlide128Forward = () => {
    if (isScrollingSlide128) return;
    
    // Initialiser les limites si pas encore fait
    if (maxSlide128Scroll === 0) {
      initializeSlide128ScrollLimits();
    }
    
    // Si on a atteint la fin, permettre la navigation vers la slide suivante
    if (slide128ScrollIndex >= maxSlide128Scroll) {
      console.log('Fin des case-study-content atteinte, navigation vers slide suivante');
      isNavigating.value = false; // Débloquer la navigation
      return false; // Indiquer qu'on peut passer à la slide suivante
    }
    
    isScrollingSlide128 = true;
    isNavigating.value = true;
    
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    const allItems = slide128Section?.querySelectorAll('.case-study-item');
    
    console.log(`Défilement case-study avant: ${slide128ScrollIndex} -> ${slide128ScrollIndex + 1}`);
    console.log(`Total items trouvés: ${allItems?.length}`);
    
    if (allItems && allItems.length > slide128ScrollIndex + 1) {
      const currentItem = allItems[slide128ScrollIndex];
      const nextItem = allItems[slide128ScrollIndex + 1];
      const currentContent = currentItem?.querySelector('.case-study-content');
      const nextContent = nextItem?.querySelector('.case-study-content');
      
      console.log('Current item:', currentItem);
      console.log('Next item:', nextItem);
      console.log('Current content:', currentContent);
      console.log('Next content:', nextContent);
      
      if (currentContent && nextContent) {
        const tl = gsap.timeline({
          onComplete: () => {
            slide128ScrollIndex++;
            animationStates.value['slide-128-current-index'] = slide128ScrollIndex;
            isScrollingSlide128 = false;
            isNavigating.value = false;
            console.log(`Défilement case-study terminé - nouvel index: ${slide128ScrollIndex}`);
          }
        });
        
        // Préparer le content suivant : l'afficher avant l'animation
        gsap.set(nextContent, { autoAlpha: 0, y: '50px', display: 'block' });
        
        // Animation simultanée des case-study-content
        tl.to(currentContent, {
          autoAlpha: 0,
          y: '-50px',
          duration: 0.4,
          ease: 'power3.easeInOut'
        }, 0)
        .to(nextContent, {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: 'power3.easeInOut'
        }, 0)
        // Masquer le currentContent après l'animation
        .set(currentContent, { display: 'none' }, 0.4);
        
        // Gérer les classes active sur les case-study-item
        currentItem.classList.remove('active');
        nextItem.classList.add('active');
      }
    }

    return true; // Indiquer que l'animation a été lancée
  };

  const scrollSlide128Backward = () => {
    if (isScrollingSlide128 || slide128ScrollIndex <= 0) return;
    
    isScrollingSlide128 = true;
    isNavigating.value = true;
    
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    const allItems = slide128Section?.querySelectorAll('.case-study-item');
    
    console.log(`Défilement case-study arrière: ${slide128ScrollIndex} -> ${slide128ScrollIndex - 1}`);
    
    if (allItems && allItems.length > 0) {
      const currentItem = allItems[slide128ScrollIndex];
      const prevItem = allItems[slide128ScrollIndex - 1];
      const currentContent = currentItem?.querySelector('.case-study-content');
      const prevContent = prevItem?.querySelector('.case-study-content');
      
      if (currentContent && prevContent) {
        const tl = gsap.timeline({
          onComplete: () => {
            slide128ScrollIndex--;
            animationStates.value['slide-128-current-index'] = slide128ScrollIndex;
            isScrollingSlide128 = false;
            isNavigating.value = false;
            console.log(`Défilement case-study arrière terminé - nouvel index: ${slide128ScrollIndex}`);
          }
        });
        
        // Préparer le content précédent : l'afficher avant l'animation
        gsap.set(prevContent, { autoAlpha: 0, y: '-50px', display: 'block' });
        
        // Animation simultanée des case-study-content
        tl.to(currentContent, {
          autoAlpha: 0,
          y: '50px',
          duration: 0.4,
          ease: 'power3.easeInOut'
        }, 0)
        .to(prevContent, {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: 'power3.easeInOut'
        }, 0)
        // Masquer le currentContent après l'animation
        .set(currentContent, { display: 'none' }, 0.4);
        
        // Gérer les classes active sur les case-study-item
        currentItem.classList.remove('active');
        prevItem.classList.add('active');
      }
    }
  };

  const resetSlide128Animation = () => {
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    const killerwuDiv = slide128Section?.querySelector('#killerwu');
    const caseStudyItems = slide128Section?.querySelectorAll('.case-study-item');
    
    console.log('Reset slide-128 animation');
    
    if (killerwuDiv) {
      gsap.set(killerwuDiv, { autoAlpha: 0 });
    }
    
    if (caseStudyItems) {
      caseStudyItems.forEach((item, index) => {
        const content = item.querySelector('.case-study-content');
        if (content) {
          if (index === 0) {
            // Premier item : prêt pour réinitialisation
            gsap.set(content, { autoAlpha: 1, y: 0, display: 'block' });
            item.classList.add('active');
          } else {
            // Autres items : masqués
            gsap.set(content, { autoAlpha: 0, y: '50px', display: 'none' });
            item.classList.remove('active');
          }
        }
      });
    }
    
    // Reset des variables
    slide128ScrollIndex = 0;
    maxSlide128Scroll = 0;
    isScrollingSlide128 = false;
    animationStates.value['slide-128-initialized'] = false;
    animationStates.value['slide-128-current-index'] = 0;
  };

  // ===========================================================================
  // SECTION 5: INITIALISATION ET NETTOYAGE
  // ===========================================================================

  const init = (sectionsElements) => {
    if (!Array.isArray(sectionsElements) || sectionsElements.some(el => !(el instanceof HTMLElement))) {
      console.error('❌ Erreur: sectionsElements doit être un tableau d\'éléments HTML');
      return;
    }

    sections.value = sectionsElements;

    if (sections.value.length > 0) {
      // Configuration des ScrollTriggers pour l'observation
      stObserve = ScrollTrigger.create({
        trigger: sections.value[0],
        start: "top center",
        end: "bottom center",
        scroller: SCROLLER_SELECTOR,
        onUpdate: (self) => {
          const progress = self.progress;
          const totalSections = sections.value.length;
          const newIndex = Math.min(Math.floor(progress * totalSections), totalSections - 1);
          
          if (newIndex !== currentSectionIndex.value && !isNavigating.value) {
            currentSectionIndex.value = newIndex;
          }
        }
      });

      // Enregistrement des animations spécifiques
      registerSlide73Animation();
      registerSlide20Animation();
      registerSlide23Animation();
      registerSlide59Animation();
      registerSlide128Animation();

      // Configuration des événements de navigation
      keyboardListener.value = (e) => handleKeyboardNavigation(e);
      document.addEventListener('keydown', keyboardListener.value);
      document.addEventListener('wheel', handleWheelEvent, { passive: false });

      // Navigation initiale
      goToSection(0, 0);
    }
  };

  const cleanup = () => {
    // Nettoyage des timeouts macOS
    if (scrollTimeoutId) {
      clearTimeout(scrollTimeoutId);
      scrollTimeoutId = null;
    }
    
    // Reset des variables de debouncing macOS
    lastScrollTime = 0;
    pendingScrollDirection = null;
    isProcessingScroll = false;
    
    if (stObserve) {
      stObserve.kill();
      stObserve = null;
    }

    specificAnimationTriggers.forEach(st => st.kill());
    specificAnimationTriggers.length = 0;

    slideSpecificEventListeners.forEach(listener => {
      listener.element.removeEventListener(listener.event, listener.handler);
    });
    slideSpecificEventListeners.length = 0;

    if (keyboardListener.value) {
      document.removeEventListener('keydown', keyboardListener.value);
      keyboardListener.value = null;
    }

    document.removeEventListener('wheel', handleWheelEvent);

    gsap.killTweensOf(SCROLLER_SELECTOR);

    // Reset de tous les états
    currentSectionIndex.value = 0;
    isNavigating.value = false;
    hasScrolledOnce.value = false;
    isAnimating.value = false;
    Object.keys(animationStates.value).forEach(key => delete animationStates.value[key]);
    sections.value = [];
  };

  onUnmounted(() => {
    cleanup();
  });

  // Fonctions de debug
  window.debugDesktopAnimations = {
    states: animationStates,
    resetSlide73: resetSlide73Animation,
    reverseSlide73: reverseSlide73Animation,
    resetSlide20: resetSlide20Animation,
    resetSlide23: resetSlide23Animation,
    resetSlide59: resetSlide59Animation,
    resetSlide128: resetSlide128Animation,
    triggerSlide73: triggerSlide73Animation,
    triggerSlide128: triggerSlide128Animation,
    scrollSlide128Forward: scrollSlide128Forward,
    scrollSlide128Backward: scrollSlide128Backward,
    currentSection: () => sections.value[currentSectionIndex.value]?.id,
    slide128Index: () => slide128ScrollIndex,
    // Debug macOS
    isMacOSDesktop: isMacOSDesktop,
    macOSScrollInfo: () => ({
      lastScrollTime,
      pendingScrollDirection,
      isProcessingScroll,
      scrollTimeoutActive: scrollTimeoutId !== null
    }),
    resetMacOSScroll: () => {
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
        scrollTimeoutId = null;
      }
      lastScrollTime = 0;
      pendingScrollDirection = null;
      isProcessingScroll = false;
      console.log('🍎 Reset du système de scroll macOS');
    },
    // Debug nouveau système de debouncing sélectif
    testDebouncing: (deltaY) => {
      const debounceType = shouldApplyDebouncing(deltaY);
      const currentSection = sections.value[currentSectionIndex.value];
      const delay = debounceType === 'internal' ? MACOS_SCROLL_DEBOUNCE_DELAY_INTERNAL : 
                   debounceType === 'normal' ? MACOS_SCROLL_DEBOUNCE_DELAY : 0;
      
      console.log('🧪 Test debouncing:', {
        currentSlide: currentSection?.id,
        deltaY,
        direction: deltaY > 0 ? 'down' : 'up',
        debounceType,
        delay: delay + 'ms',
        animationStates: animationStates.value
      });
      return { debounceType, delay };
    },
    shouldApplyDebouncing: shouldApplyDebouncing,
    // Debug des constantes de debouncing
    debounceDelays: () => ({
      normal: MACOS_SCROLL_DEBOUNCE_DELAY + 'ms',
      internal: MACOS_SCROLL_DEBOUNCE_DELAY_INTERNAL + 'ms',
      threshold: MACOS_SCROLL_THRESHOLD + 'ms'
    })
  };

  return {
    currentSectionIndex,
    isNavigating,
    animationStates,
    init,
    goToSection,
    cleanup
  };
}

export default useFullpageScrollTrigger;