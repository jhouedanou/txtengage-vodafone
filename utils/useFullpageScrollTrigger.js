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
  
  // Constantes d'animation - synchronisées avec refreence.js
  const SCROLLER_SELECTOR = "#master-scroll-container";
  
  // Détection mobile pour vitesses adaptées
  const isMobile = () => {
    // Vérification SSR : retourner false si window n'existe pas
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  };
  
  // Vitesses d'animation selon l'appareil (comme dans refreence.js)
  const getAnimationTiming = () => {
    // Vérification SSR : utiliser les valeurs desktop par défaut si window n'existe pas
    if (typeof window === 'undefined') {
      return {
        sectionDuration: 0.4,        // 400ms pour les sections sur desktop (valeur par défaut pour SSR)
        slideDuration: 0.8,          // 800ms pour les slides sur desktop
        tweenDuration: 0.4,          // 400ms pour les micro-animations
        sectionEase: "power3.easeInOut",
        slideEase: "power3.easeInOut",
        tweenEase: "easeInOutCubic"
      };
    }

    if (isMobile()) {
      return {
        sectionDuration: 0.45,       // 450ms pour les sections sur mobile (réduit de moitié : 0.9 → 0.45)
        slideDuration: 0.6,          // 600ms pour les slides sur mobile
        tweenDuration: 0.3,          // 300ms pour les micro-animations
        sectionEase: "easeInOutCubic",
        slideEase: "power3.easeInOut",
        tweenEase: "easeInOutCubic"
      };
    } else {
      return {
        sectionDuration: 0.4,        // 400ms pour les sections sur desktop (réduit de moitié : 0.8 → 0.4)
        slideDuration: 0.8,          // 800ms pour les slides sur desktop
        tweenDuration: 0.4,          // 400ms pour les micro-animations
        sectionEase: "power3.easeInOut",
        slideEase: "power3.easeInOut",
        tweenEase: "easeInOutCubic"
      };
    }
  };
  
  // Variables dynamiques basées sur l'appareil
  const timing = getAnimationTiming();
  const sectionDuration = timing.sectionDuration;
  const sectionEase = timing.sectionEase;
  
  // Fonctions helper pour récupérer les durées selon le contexte
  const getTweenDuration = () => getAnimationTiming().tweenDuration;
  const getSlideDuration = () => getAnimationTiming().slideDuration;
  const getTweenEase = () => getAnimationTiming().tweenEase;
  const getSlideEase = () => getAnimationTiming().slideEase;
  
  // ===========================================================================
  // SECTION DETECTION MACOS ET AGREGATION DE SCROLL
  // ===========================================================================
  
  // Détection macOS
  const isMacOS = () => {
    // Vérification SSR : retourner false si navigator n'existe pas
    if (typeof navigator === 'undefined') return false;
    return /Mac/.test(navigator.platform);
  };
  
  // Variables de suivi pour l'agrégation de scroll
  let scrollCount = 0;
  let scrollDir = null;
  let scrollEndTimer = null;
  let lastGestureTime = 0; // Nouvelle variable pour le cooldown
  let SCROLL_END_DELAY = 80; // Augmenté de 50ms à 80ms (let au lieu de const)
  let GESTURE_COOLDOWN = 200; // Cooldown de 200ms entre les gestes (let au lieu de const)
  
  // Fonction d'agrégation de scroll pour macOS
  function macScrollAggregator(e) {
    e.preventDefault(); // Empêcher le scroll natif
    
    const currentTime = Date.now();
    
    // Vérifier le cooldown - ignorer si trop proche du dernier geste
    if (currentTime - lastGestureTime < GESTURE_COOLDOWN) {
      console.log(`🚫 Geste ignoré - cooldown actif (${currentTime - lastGestureTime}ms < ${GESTURE_COOLDOWN}ms)`);
      return;
    }
    
    scrollCount++;
    const dir = e.deltaY > 0 ? 'down' : 'up';
    
    // Si changement de direction, vider le geste précédent
    if (scrollDir && dir !== scrollDir) {
      flushScrollGesture();
    }
    
    scrollDir = dir;
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(flushScrollGesture, SCROLL_END_DELAY);
  }
  
  // Fonction pour transformer le geste agrégé en événement clavier
  function flushScrollGesture() {
    if (scrollCount === 0) return;
    
    const key = scrollDir === 'down' ? 'ArrowDown' : 'ArrowUp';
    console.log(`🍎 Geste macOS agrégé: ${scrollCount} événements -> ${key}`);
    
    // Mettre à jour le timestamp du dernier geste
    lastGestureTime = Date.now();
    
    // Créer et émettre l'événement clavier sur document (pas window)
    const keyboardEvent = new KeyboardEvent('keydown', { 
      key: key,
      bubbles: true,
      cancelable: true
    });
    
    // Émettre sur document pour correspondre à notre addEventListener
    document.dispatchEvent(keyboardEvent);
    
    // Reset
    scrollCount = 0;
    scrollDir = null;
  }

  // Variables internes de gestion
  let stObserve = null;
  const keyboardListener = ref(null);
  const specificAnimationTriggers = [];
  const slideSpecificEventListeners = [];

  // ===========================================================================
  // SECTION 2: FONCTIONS UTILITAIRES
  // ===========================================================================

  const goToSection = (index, duration = sectionDuration, direction = null) => {
    if (index < 0 || index >= sections.value.length || isNavigating.value) return;

    console.log(`🚀 Navigation vers section ${index}`);
    
    // Détecter la direction si pas fournie
    if (direction === null) {
      direction = index > currentSectionIndex.value ? 'forward' : 'backward';
    }
    
    isNavigating.value = true;
    const previousIndex = currentSectionIndex.value;
    currentSectionIndex.value = index;

    const targetSection = sections.value[index];
    const hamburger = document.querySelector('.hamburger');

    // Gérer la transition spéciale slide-21 → slide-73
    if (previousIndex !== index && sections.value[previousIndex]?.id === '21' && targetSection.id === '73') {
      // Changer le hamburger en blanc avant la transition car #subint sera visible sur la slide-73
      if (hamburger) {
        hamburger.classList.remove('hamburger-red');
        hamburger.classList.add('hamburger-white');
        console.log('🍔 Hamburger passage en blanc pour la transition slide-21 → slide-73');
      }
    }

    // Gérer aussi la transition inverse slide-73 → slide-21 (navigation arrière)
    if (previousIndex !== index && sections.value[previousIndex]?.id === '73' && targetSection.id === '21') {
      // Le hamburger reste blanc car on va sur la slide-21 qui a un hamburger blanc
      if (hamburger) {
        hamburger.classList.remove('hamburger-red');
        hamburger.classList.add('hamburger-white');
        console.log('🍔 Hamburger reste blanc pour la transition slide-73 → slide-21');
      }
    }

    gsap.to(SCROLLER_SELECTOR, {
      scrollTo: { y: targetSection, autoKill: false },
      duration: duration,
      ease: sectionEase,
      onComplete: () => {
        console.log(`✅ Navigation terminée vers section ${index} (${direction})`);
        isNavigating.value = false;
        hasScrolledOnce.value = true;

        // S'assurer que le hamburger est blanc sur la slide-73 (car #subint est visible)
        if (targetSection.id === '73' && hamburger) {
          hamburger.classList.remove('hamburger-red');
          hamburger.classList.add('hamburger-white');
          console.log('🍔 Hamburger forcé en blanc à l\'arrivée sur slide-73');
        }

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
    // Bloquer si en navigation
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
      
      // Gestion spéciale pour slide-20 - inverser l'animation de #text-element-5
      if (currentSection && currentSection.id === 'slide-20') {
        if (animationStates.value['slide-20-text-element-5'] && !animationStates.value['slide-20-text-element-5-reversing']) {
          reverseSlide20TextElement5();
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
    // Bloquer si en navigation
    if (isNavigating.value) return;

    console.log(`⌨️ Événement clavier reçu: ${e.key}`);

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
        
        // Gestion spéciale pour slide-20 - inverser l'animation de #text-element-5
        if (currentSection && currentSection.id === 'slide-20') {
          if (animationStates.value['slide-20-text-element-5'] && !animationStates.value['slide-20-text-element-5-reversing']) {
            reverseSlide20TextElement5();
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
  const subintDiv = slide73Section?.querySelector('#subint'); // Nouvel élément à animer
  const hamburger = document.querySelector('.hamburger');
  
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

  // Phase 1: Faire entrer points-fort à moitié dans le champ + fade-out #subint (desktop seulement)
  tl.to(pointsFortDiv, {
    width: '50vw', // Prends la moitié de la largeur
    x: 0, // Entre à moitié dans le champ
    duration: getSlideDuration(),
    ease: getSlideEase()
  })
  .to(slidesContainerDiv, {
    //backgroundPositionX: '-20vw', // Déplace le background de -50vw
    duration: getSlideDuration(),
    ease: getSlideEase()
  }, "<"); // "<" pour démarrer en même temps
  
  // Fade-out de #subint en parallèle (desktop seulement) + changement couleur hamburger
  if (subintDiv && !isMobile()) {
    tl.to(subintDiv, {
      autoAlpha: 0,
      y: -20, // Légère translation vers le haut
      duration: getSlideDuration(),
      ease: getSlideEase(),
      onStart: () => {
        // Changer le hamburger en blanc quand #subint commence à disparaître
        if (hamburger) {
          hamburger.classList.remove('hamburger-red');
          hamburger.classList.add('hamburger-white');
          //console.log('🍔 Hamburger passage en blanc lors du fade-out de #subint');
        }
      }
    }, "<"); // "<" pour démarrer en même temps que l'animation points-fort
  }
  
  // Phase 2: Faire apparaître les li en cascade avec un délai
  if (pointsFortLis.length > 0) {
    tl.to(pointsFortLis, {
      autoAlpha: 1,
      y: 0,
      duration: getTweenDuration(),
      stagger: 0.1, // Délai entre chaque li
      ease: getTweenEase()
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
  const subintDiv = slide73Section?.querySelector('#subint'); // Nouvel élément à animer
  const hamburger = document.querySelector('.hamburger');
  
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
      duration: getTweenDuration(),
      stagger: -0.05, // Stagger inversé (dernier en premier)
      ease: getTweenEase()
    });
  }

  // Phase 2: Faire sortir points-fort et remettre background en place + fade-in #subint (desktop seulement)
  tl.to(pointsFortDiv, {
    width: '0vw',
    x: '100vw', // Sort complètement du champ
    duration: getSlideDuration(),
    ease: getSlideEase()
  }, "+=0.2")
  .to(slidesContainerDiv, {
    backgroundPositionX: '0vw', // Remet le background à sa position initiale
    duration: getSlideDuration(),
    ease: getSlideEase()
  }, "<"); // En parallèle
  
  // Fade-in de #subint en parallèle (desktop seulement) + remise couleur hamburger
  if (subintDiv && !isMobile()) {
    tl.to(subintDiv, {
      autoAlpha: 1,
      y: 0, // Remise en position normale
      duration: getSlideDuration(),
      ease: getSlideEase(),
      onStart: () => {
        // Remettre le hamburger à sa couleur rouge quand #subint commence à réapparaître
        if (hamburger) {
          hamburger.classList.remove('hamburger-white');
          hamburger.classList.add('hamburger-red');
          console.log('🍔 Hamburger retour en rouge lors du fade-in de #subint');
        }
      }
    }, "+=0.2"); // En même temps que la sortie de points-fort
  }
};

// Mise à jour du resetSlide73Animation pour réinitialiser le background seulement sur slide-21
const resetSlide73Animation = () => {
  const slide73Section = sections.value.find(s => s.id === 'slide-73');
  const slidesContainerDiv = slide73Section?.querySelector('.slides-container');
  const pointsFortDiv = slide73Section?.querySelector('.points-fort');
  const pointsFortLis = slide73Section?.querySelectorAll('.points-fort li');
  const subintDiv = slide73Section?.querySelector('#subint'); // Nouvel élément à réinitialiser
  const hamburger = document.querySelector('.hamburger');
  
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
  
  // Réinitialiser #subint à son état initial (desktop seulement)
  if (subintDiv && !isMobile()) {
    gsap.set(subintDiv, {
      autoAlpha: 1, // Visible par défaut
      y: 0 // Position normale
    });
  }
  
  // Réinitialiser le hamburger à sa couleur rouge (couleur par défaut sur slide-73)
  if (hamburger) {
    hamburger.classList.remove('hamburger-white');
    hamburger.classList.add('hamburger-red');
    console.log('🍔 Hamburger réinitialisé en rouge lors du reset slide-73');
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
        duration: sectionDuration,
        ease: sectionEase,
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
        duration: getTweenDuration(),
        stagger: 0.15, // Délai entre chaque élément
        ease: getTweenEase() // ← Correction : ajout des parenthèses pour appeler la fonction
      }, "+=0.3"); // Délai de 0.3s après turtlebeach
    }
  };

  const triggerSlide20TextElement5 = () => {
    if (animationStates.value['slide-20-text-element-5']) return;
    
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    const textElement5 = slide20Section?.querySelector('#text-element-5');
    const turtlebeach = slide20Section?.querySelector('#turtlebeach');
    const otherTextElements = slide20Section?.querySelectorAll('.text-element:not(#text-element-5)');
    
    if (textElement5) {
      isNavigating.value = true;
      
      const tl = gsap.timeline({
        onComplete: () => {
          animationStates.value['slide-20-text-element-5'] = true;
          isNavigating.value = false;
          console.log('Slide-20: #text-element-5 animation terminée');
        }
      });
      
      // Animation de #text-element-5
      tl.to(textElement5, {
        autoAlpha: 1,
        y: 0,
        duration: getTweenDuration(),
        ease: getTweenEase()
      });
      
      // Sur desktop seulement : faire disparaître les autres éléments en parallèle
      if (!isMobile()) {
        // Fade-out de #turtlebeach
        if (turtlebeach) {
          tl.to(turtlebeach, {
            autoAlpha: 0,
            scale: 0.9,
            y: -30,
            rotation: 5,
            duration: getTweenDuration(),
            ease: getTweenEase()
          }, "<"); // En parallèle avec text-element-5
        }
        
        // Fade-out des autres éléments texte
        if (otherTextElements && otherTextElements.length > 0) {
          tl.to(otherTextElements, {
            autoAlpha: 0,
            y: -50,
            duration: getTweenDuration(),
            stagger: -0.05, // Stagger inversé (dernier en premier)
            ease: getTweenEase()
          }, "<"); // En parallèle avec text-element-5
        }
      }
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
    animationStates.value['slide-20-text-element-5-reversing'] = false;
    animationStates.value['slide-20-animating'] = false;
  };

  // Nouvelle fonction pour inverser l'animation de #text-element-5
  const reverseSlide20TextElement5 = () => {
    if (!animationStates.value['slide-20-text-element-5']) return;
    
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    const textElement5 = slide20Section?.querySelector('#text-element-5');
    const turtlebeach = slide20Section?.querySelector('#turtlebeach');
    const otherTextElements = slide20Section?.querySelectorAll('.text-element:not(#text-element-5)');
    
    if (textElement5) {
      isNavigating.value = true;
      animationStates.value['slide-20-text-element-5-reversing'] = true;
      
      const tl = gsap.timeline({
        onComplete: () => {
          animationStates.value['slide-20-text-element-5'] = false;
          animationStates.value['slide-20-text-element-5-reversing'] = false;
          isNavigating.value = false;
          console.log('Slide-20: #text-element-5 animation inversée terminée');
        }
      });
      
      // Animation inverse de #text-element-5
      tl.to(textElement5, {
        autoAlpha: 0,
        y: 100,
        duration: getTweenDuration(),
        ease: getTweenEase()
      });
      
      // Sur desktop seulement : faire réapparaître les autres éléments en parallèle
      if (!isMobile()) {
        // Fade-in de #turtlebeach
        if (turtlebeach) {
          tl.to(turtlebeach, {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            rotation: 0,
            duration: getTweenDuration(),
            ease: getTweenEase()
          }, "<"); // En parallèle avec text-element-5
        }
        
        // Fade-in des autres éléments texte
        if (otherTextElements && otherTextElements.length > 0) {
          tl.to(otherTextElements, {
            autoAlpha: 1,
            y: 0,
            duration: getTweenDuration(),
            stagger: 0.05, // Stagger normal (premier en premier)
            ease: getTweenEase()
          }, "<"); // En parallèle avec text-element-5
        }
      }
    }
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
        duration: sectionDuration,
        ease: sectionEase,
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
          gsap.set(container, { autoAlpha: 1, y: '580px' });
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
        duration: getSlideDuration(),
        ease: getSlideEase(),
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

    // Animation des perdrix-slides avec style tc_digital_content
    if (currentSlide && nextSlide) {
      const currentTextContainer = currentSlide.querySelector('.text-container');
      const nextTextContainer = nextSlide.querySelector('.text-container');
      
      // Préparer le slide suivant - VISIBLE dès le départ (pas de fade)
      gsap.set(nextSlide, { autoAlpha: 1 });
      if (nextTextContainer) {
        gsap.set(nextTextContainer, { y: '100vh', autoAlpha: 1 }); // autoAlpha: 1 (pas de fade)
      }
      
      // SORTIE : Fade out + slide up légèrement
      if (currentTextContainer) {
        // Translation légère vers le haut
        tl.to(currentTextContainer, {
          y: '-50px', // Slide up légèrement (au lieu de -currentHeight)
          duration: getTweenDuration() / 2, // Vitesse normale (0.3s)
          ease: getTweenEase()
        }, 0);
        // Fade out simultané
        tl.to(currentTextContainer, {
          autoAlpha: 0,
          duration: getTweenDuration() / 2, // Vitesse normale (0.3s)
          ease: getTweenEase()
        }, 0);
      }
      
      // ENTRÉE : Slide up SANS fade (reste visible) - PLUS RAPIDE
      if (nextTextContainer) {
        // Seulement translation - PAS de fade - PLUS RAPIDE
        tl.to(nextTextContainer, {
          y: 0, // Slide vers position finale
          duration: 0.2, // Plus rapide que l'élément sortant
          ease: getTweenEase()
        }, "+=0");
        // Pas d'animation de fade - l'élément reste à autoAlpha: 1
      }
      
      // Masquer le slide actuel après l'animation
      tl.to(currentSlide, {
        autoAlpha: 1,
        duration: 0.1,
        ease: 'power3.out'
      }, getTweenDuration());
    }

    // Animation synchronisée des image-containers sans fade
    if (currentImageContainer && nextImageContainer) {
      // Préparer le container suivant
      gsap.set(nextImageContainer, { autoAlpha: 1, y: '580px' });
      
      // Animation simultanée des image-containers - l'ancienne reste visible
      tl.to(currentImageContainer, {
        y: '-580px',
        duration: getTweenDuration(),
        ease: getTweenEase()
      }, 0);
      
      tl.to(nextImageContainer, {
        y: 0,
        duration: getTweenDuration(),
        ease: getTweenEase()
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

    // Animation des perdrix-slides avec style tc_digital_content inversé
    if (currentSlide && prevSlide) {
      const currentTextContainer = currentSlide.querySelector('.text-container');
      const prevTextContainer = prevSlide.querySelector('.text-container');
      
      // Préparer le slide précédent - MASQUÉ au départ pour le fadeIn
      gsap.set(prevSlide, { autoAlpha: 1 });
      if (prevTextContainer) {
        gsap.set(prevTextContainer, { y: '-50px', autoAlpha: 0 }); // autoAlpha: 0 pour permettre le fadeIn
      }
      
      // SORTIE : Fade out + slide down légèrement - PLUS RAPIDE
      if (currentTextContainer) {
        // Translation légère vers le bas
        tl.to(currentTextContainer, {
          y: '50px', // Slide down légèrement
          duration: 0.2, // Plus rapide que l'élément entrant
          ease: getTweenEase()
        }, 0);
        // Fade out simultané
        tl.to(currentTextContainer, {
          autoAlpha: 0,
          duration: 0.2, // Plus rapide que l'élément entrant
          ease: getTweenEase()
        }, 0);
      }
      
      // ENTRÉE : Slide down AVEC fadeIn - PLUS LENT
      if (prevTextContainer) {
        // Translation - PLUS LENT
        tl.to(prevTextContainer, {
          y: 0, // Slide vers position finale
          duration: 0.2, // Plus lent que l'élément sortant
          ease: getTweenEase()
        }, "+=0");
        // FadeIn simultané
        tl.to(prevTextContainer, {
          autoAlpha: 1,
          duration: 0.2, // Même durée que la translation
          ease: getTweenEase()
        }, "+=0");
      }
      
      // Masquer le slide actuel après l'animation
      tl.to(currentSlide, {
        autoAlpha: 0,
        duration: 0.1,
        ease: 'power3.out'
      }, getTweenDuration());
    }

    // Animation synchronisée des image-containers sans fade
    if (currentImageContainer && prevImageContainer) {
      // Préparer le container précédent
      gsap.set(prevImageContainer, { autoAlpha: 1, y: '-580px' });
      
      // Animation simultanée des image-containers - l'ancienne reste visible
      tl.to(currentImageContainer, {
        y: '580px',
        duration: getTweenDuration(),
        ease: getTweenEase()
      }, 0);
      
      tl.to(prevImageContainer, {
        y: 0,
        duration: getTweenDuration(),
        ease: getTweenEase()
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
          gsap.set(container, { autoAlpha: 1, y: '580px' });
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
        duration: sectionDuration * 1.5, // Plus long pour voir le remplissage (basé sur sectionDuration)
        ease: sectionEase, // Utiliser l'easing de section
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
            gsap.set(content, { 
              display: 'block', 
              opacity: 1
            });
            item.classList.add('active');
          } else {
            // Autres items : masqués
            gsap.set(content, { 
              display: 'none', 
              opacity: 1
            });
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
        duration: sectionDuration,
        ease: sectionEase,
        onComplete: () => {
          // S'assurer que le premier case-study-content est visible
          if (firstCaseStudyContent && firstCaseStudyItem) {
            gsap.set(firstCaseStudyContent, { display: 'block' });
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
        // Switch instantané sans animation de scale
        // Masquer le contenu actuel
        gsap.set(currentContent, { display: 'none' });
        
        // Afficher le contenu suivant
        gsap.set(nextContent, { 
          display: 'block', 
          opacity: 1
        });
        
        // Gérer les classes active sur les case-study-item
        currentItem.classList.remove('active');
        nextItem.classList.add('active');
        
        // Mise à jour des indices et états
        slide128ScrollIndex++;
        animationStates.value['slide-128-current-index'] = slide128ScrollIndex;
        isScrollingSlide128 = false;
        isNavigating.value = false;
        console.log(`Défilement case-study terminé - nouvel index: ${slide128ScrollIndex}`);
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
        // Switch instantané sans animation de scale
        // Masquer le contenu actuel
        gsap.set(currentContent, { display: 'none' });
        
        // Afficher le contenu précédent
        gsap.set(prevContent, { 
          display: 'block', 
          opacity: 1
        });
        
        // Gérer les classes active sur les case-study-item
        currentItem.classList.remove('active');
        prevItem.classList.add('active');
        
        // Mise à jour des indices et états
        slide128ScrollIndex--;
        animationStates.value['slide-128-current-index'] = slide128ScrollIndex;
        isScrollingSlide128 = false;
        isNavigating.value = false;
        console.log(`Défilement case-study arrière terminé - nouvel index: ${slide128ScrollIndex}`);
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
            // Premier item : visible avec classe active
            gsap.set(content, { 
              display: 'block', 
              opacity: 1
            });
            item.classList.add('active');
          } else {
            // Autres items : masqués
            gsap.set(content, { 
              display: 'none', 
              opacity: 1
            });
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
      
      // Configuration du système d'agrégation de scroll pour macOS
      if (isMacOS()) {
        console.log('🍎 macOS détecté - Activation du système d\'agrégation de scroll');
        document.addEventListener('wheel', macScrollAggregator, { passive: false });
      } else {
        console.log('💻 Système non-macOS - Utilisation du scroll normal');
      document.addEventListener('wheel', handleWheelEvent, { passive: false });
      }

      // Navigation initiale
      goToSection(0, 0);
    }
  };

  const cleanup = () => {
    // Nettoyage du système d'agrégation macOS
    if (scrollEndTimer) {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = null;
    }
    
    // Reset des variables d'agrégation
    scrollCount = 0;
    scrollDir = null;
    lastGestureTime = 0;
    
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

    // Nettoyage des événements wheel selon le système
    if (isMacOS()) {
      document.removeEventListener('wheel', macScrollAggregator);
    } else {
    document.removeEventListener('wheel', handleWheelEvent);
    }

    gsap.killTweensOf(SCROLLER_SELECTOR);

    // Reset de tous les états
    currentSectionIndex.value = 0;
    isNavigating.value = false;
    hasScrolledOnce.value = false;
    isAnimating.value = false;
    Object.keys(animationStates.value).forEach(key => delete animationStates.value[key]);
    sections.value = [];
  };

  // Fonctions de debug
  if (typeof window !== 'undefined') {
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
      // Debug du nouveau système d'agrégation macOS
      isMacOS: isMacOS,
      scrollAggregatorInfo: () => ({
        scrollCount,
        scrollDir,
        scrollEndTimerActive: scrollEndTimer !== null,
        lastGestureTime,
        timeSinceLastGesture: Date.now() - lastGestureTime,
        cooldownActive: (Date.now() - lastGestureTime) < GESTURE_COOLDOWN,
        isMacOSActive: isMacOS()
      }),
      resetScrollAggregator: () => {
        if (scrollEndTimer) {
          clearTimeout(scrollEndTimer);
          scrollEndTimer = null;
        }
        scrollCount = 0;
        scrollDir = null;
        lastGestureTime = 0;
        console.log('🍎 Reset du système d\'agrégation de scroll macOS');
      },
      testScrollAggregation: (direction = 'down', eventCount = 5) => {
        console.log(`🧪 Test agrégation: ${eventCount} événements ${direction}`);
        for (let i = 0; i < eventCount; i++) {
          const deltaY = direction === 'down' ? 10 : -10;
          macScrollAggregator(new WheelEvent('wheel', { deltaY }));
        }
      },
      flushScrollGesture: flushScrollGesture,
      // Nouvelles fonctions de debug pour le cooldown
      setCooldown: (ms) => {
        GESTURE_COOLDOWN = ms;
        console.log(`🍎 Cooldown configuré à ${ms}ms`);
      },
      setScrollDelay: (ms) => {
        SCROLL_END_DELAY = ms;
        console.log(`🍎 Délai de fin de scroll configuré à ${ms}ms`);
      },
      forceCooldown: () => {
        lastGestureTime = Date.now();
        console.log('🍎 Cooldown forcé - prochains événements seront ignorés pendant 200ms');
      }
    };
  }

  return {
    currentSectionIndex,
    isNavigating,
    animationStates,
    init,
    goToSection,
    cleanup,
    // Retourner onUnmounted pour que le composant parent puisse l'utiliser
    setupCleanup: () => {
      onUnmounted(() => {
        cleanup();
      });
    }
  };
}

export default useFullpageScrollTrigger;