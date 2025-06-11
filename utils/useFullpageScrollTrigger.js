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
  const isMobile = () => window.innerWidth <= 768;
  
  // Vitesses d'animation selon l'appareil (comme dans refreence.js)
  const getAnimationTiming = () => {
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
  const isMacOS = () => /Mac/.test(navigator.platform);
  
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
    currentSectionIndex.value = index;

    const targetSection = sections.value[index];

    gsap.to(SCROLLER_SELECTOR, {
      scrollTo: { y: targetSection, autoKill: false },
      duration: duration,
      ease: sectionEase,
      onComplete: () => {
        console.log(`✅ Navigation terminée vers section ${index} (${direction})`);
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
  
  // Fade-out de #subint en parallèle (desktop seulement)
  if (subintDiv && !isMobile()) {
    tl.to(subintDiv, {
      autoAlpha: 0,
      y: -20, // Légère translation vers le haut
      duration: getSlideDuration(),
      ease: getSlideEase()
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
  
  // Fade-in de #subint en parallèle (desktop seulement)
  if (subintDiv && !isMobile()) {
    tl.to(subintDiv, {
      autoAlpha: 1,
      y: 0, // Remise en position normale
      duration: getSlideDuration(),
      ease: getSlideEase()
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
      // ✅ NOUVEAU : Précharger tous les SVG AVANT de modifier le DOM
      preloadAllSlide23Svgs();
      
      imageContainers.forEach((container, index) => {
        // ✅ NOUVEAU : Gérer les SVG - les supprimer du DOM sauf pour le premier
        const containerId = container.id || `image-container-${index + 1}`;
        
        if (index === 0) {
          // Premier container : visible avec SVG présents dans le DOM
          gsap.set(container, { autoAlpha: 1, y: 0 });
          // Les SVG restent dans le DOM pour le premier container
        } else {
          // Autres containers : positionnés hors du viewport, SVG supprimés du DOM
          gsap.set(container, { autoAlpha: 1, y: '580px' });
          // Supprimer les SVG du DOM (mais ils sont déjà en cache)
          removeSvgFromContainerOptimized(container, containerId);
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
            // ✅ NOUVEAU : S'assurer que les SVG du premier container sont présents dans le DOM
            // (ils devraient déjà l'être, mais on vérifie par sécurité)
            const firstContainerId = firstImageContainer.id || 'image-container-1';
            console.log(`🎯 Premier container actif: ${firstContainerId} - SVG doivent être présents`);
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
  
  // ✅ NOUVEAU : Stockage des SVG pour insertion/suppression DOM
  let slide23SvgStorage = new Map(); // Stocke les SVG supprimés avec leur container parent et position
  
  // ✅ NOUVEAU : Système de préchargement et cache SVG
  let slide23SvgCache = new Map(); // Cache permanent des SVG pour préchargement rapide
  let slide23PreloadQueue = []; // Queue des containers à précharger
  
  // ✅ NOUVEAU : Système de spinner pour le chargement SVG
  const createSvgSpinner = (container, containerId) => {
    // Vérifier si un spinner existe déjà
    const existingSpinner = container.querySelector('.svg-loading-spinner');
    if (existingSpinner) return existingSpinner;
    
    // Créer le spinner
    const spinner = document.createElement('div');
    spinner.className = 'svg-loading-spinner';
    spinner.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      border-top: 3px solid #ffffff;
      border-radius: 50%;
      animation: svg-spin 1s linear infinite;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
    `;
    
    // Ajouter l'animation CSS si pas encore présente
    if (!document.querySelector('#svg-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'svg-spinner-styles';
      style.textContent = `
        @keyframes svg-spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .svg-loading-spinner {
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Insérer le spinner dans le container
    container.style.position = 'relative'; // S'assurer que le container est relatif
    container.appendChild(spinner);
    
    console.log(`⏳ Spinner créé pour ${containerId}`);
    return spinner;
  };
  
  const removeSvgSpinner = (container, containerId) => {
    const spinner = container.querySelector('.svg-loading-spinner');
    if (spinner) {
      // Animation de fade-out avant suppression
      spinner.style.transition = 'opacity 0.3s ease-out';
      spinner.style.opacity = '0';
      
      setTimeout(() => {
        if (spinner.parentNode) {
          spinner.parentNode.removeChild(spinner);
        }
      }, 300);
      
      console.log(`✅ Spinner supprimé pour ${containerId}`);
    }
  };

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
      
      // Animation simultanée des image-containers
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
      
      // ✅ NOUVEAU : Réinsérer les SVG PLUS TÔT (à mi-parcours) pour apparition rapide
      tl.call(() => {
        const nextContainerId = nextImageContainer.id || `image-container-${perdrixScrollIndex + 2}`;
        const insertedCount = insertSvgFromCache(nextImageContainer, nextContainerId);
        if (insertedCount > 0) {
          console.log(`🚀 SVG réinsérés rapidement depuis le cache pour ${nextContainerId} - animation peut commencer`);
        }
        
        // ✅ BONUS : Supprimer les SVG du container qui part pour optimiser
        const currentContainerId = currentImageContainer.id || `image-container-${perdrixScrollIndex + 1}`;
        removeSvgFromContainerOptimized(currentImageContainer, currentContainerId);
        console.log(`🗑️ SVG supprimés du container sortant ${currentContainerId}`);
      }, [], getTweenDuration() * 0.5); // À 50% de l'animation du container
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
      
      // Animation simultanée des image-containers
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
      
      // ✅ NOUVEAU : Réinsérer les SVG PLUS TÔT (à mi-parcours) pour apparition rapide - SENS INVERSE
      tl.call(() => {
        const prevContainerId = prevImageContainer.id || `image-container-${perdrixScrollIndex}`;
        const insertedCount = insertSvgFromCache(prevImageContainer, prevContainerId);
        if (insertedCount > 0) {
          console.log(`🔄 SVG réinsérés rapidement (sens inverse) depuis le cache pour ${prevContainerId} - animation peut commencer`);
        }
        
        // ✅ BONUS : Supprimer les SVG du container qui part pour optimiser - SENS INVERSE
        const currentContainerId = currentImageContainer.id || `image-container-${perdrixScrollIndex + 1}`;
        removeSvgFromContainerOptimized(currentImageContainer, currentContainerId);
        console.log(`🗑️ SVG supprimés du container sortant ${currentContainerId} (sens inverse)`);
      }, [], getTweenDuration() * 0.5); // À 50% de l'animation du container
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
        // ✅ NOUVEAU : Gérer l'état des SVG lors du reset - utiliser le cache optimisé
        const containerId = container.id || `image-container-${index + 1}`;
        
        // ✅ NOUVEAU : Supprimer les spinners existants lors du reset
        removeSvgSpinner(container, containerId);
        
        if (index === 0) {
          // Premier container : prêt pour réinitialisation avec SVG présents dans le DOM
          gsap.set(container, { autoAlpha: 1, y: 0 });
          // S'assurer que les SVG sont présents dans le DOM (réinsérer depuis le cache)
          const existingSvgs = container.querySelectorAll('svg, object[type="image/svg+xml"]');
          if (existingSvgs.length === 0) {
            insertSvgFromCache(container, containerId);
          }
        } else {
          // Autres containers : positionnés hors du viewport, SVG supprimés du DOM
          gsap.set(container, { autoAlpha: 1, y: '580px' });
          // Supprimer les SVG du DOM s'ils y sont encore (cache conservé)
          const existingSvgs = container.querySelectorAll('svg, object[type="image/svg+xml"]');
          if (existingSvgs.length > 0) {
            removeSvgFromContainerOptimized(container, containerId);
          }
        }
      });
    }
    
    // Reset des variables
    perdrixScrollIndex = 0;
    maxPerdrixScroll = 0;
    isScrollingPerdrix = false;
    animationStates.value['slide-23-initialized'] = false;
    animationStates.value['slide-23-current-index'] = 0;
    
    // ✅ NOUVEAU : Nettoyer le stockage SVG
    slide23SvgStorage.clear();
    console.log('🧹 Stockage SVG slide-23 nettoyé');
    
    // ✅ NOUVEAU : Nettoyer le cache SVG slide-23
    if (slide23SvgCache) {
      slide23SvgCache.clear();
    }
    if (slide23PreloadQueue) {
      slide23PreloadQueue.length = 0;
    }
    
    // ✅ NOUVEAU : Nettoyer tous les spinners restants
    const allSpinners = document.querySelectorAll('.svg-loading-spinner');
    allSpinners.forEach(spinner => {
      if (spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
      }
    });
    
    // Nettoyer le style CSS des spinners
    const spinnerStyles = document.querySelector('#svg-spinner-styles');
    if (spinnerStyles) {
      spinnerStyles.remove();
    }
  };

  // Fonction pour supprimer les SVG d'un container et les stocker
  const removeSvgFromContainer = (container, containerId) => {
    const svgElements = container.querySelectorAll('svg, object[type="image/svg+xml"]');
    if (svgElements.length > 0) {
      const svgData = [];
      svgElements.forEach((svg, index) => {
        // Stocker l'élément, son parent et sa position
        const parent = svg.parentNode;
        const nextSibling = svg.nextSibling;
        svgData.push({
          element: svg.cloneNode(true), // Cloner pour préserver l'élément original
          parent: parent,
          nextSibling: nextSibling,
          index: index
        });
        // Supprimer du DOM
        svg.remove();
      });
      slide23SvgStorage.set(containerId, svgData);
      console.log(`🗑️ SVG supprimés du container ${containerId}:`, svgData.length);
    }
  };

  // Fonction pour réinsérer les SVG dans un container
  const insertSvgIntoContainer = (container, containerId) => {
    const svgData = slide23SvgStorage.get(containerId);
    if (svgData && svgData.length > 0) {
      svgData.forEach(data => {
        // Réinsérer l'élément à sa position d'origine
        if (data.nextSibling) {
          data.parent.insertBefore(data.element, data.nextSibling);
        } else {
          data.parent.appendChild(data.element);
        }
      });
      // Nettoyer le stockage
      slide23SvgStorage.delete(containerId);
      console.log(`🔄 SVG réinsérés dans le container ${containerId}:`, svgData.length);
      return svgData.length;
    }
    return 0;
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
    
    // ✅ NOUVEAU : Nettoyer le stockage SVG slide-23
    if (slide23SvgStorage) {
      slide23SvgStorage.clear();
    }
    
    // ✅ NOUVEAU : Nettoyer le cache SVG slide-23
    if (slide23SvgCache) {
      slide23SvgCache.clear();
    }
    if (slide23PreloadQueue) {
      slide23PreloadQueue.length = 0;
    }
    
    // ✅ NOUVEAU : Nettoyer tous les spinners restants
    const allSpinners = document.querySelectorAll('.svg-loading-spinner');
    allSpinners.forEach(spinner => {
      if (spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
      }
    });
    
    // Nettoyer le style CSS des spinners
    const spinnerStyles = document.querySelector('#svg-spinner-styles');
    if (spinnerStyles) {
      spinnerStyles.remove();
    }
  };

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

  // Fonction pour précharger et cacher tous les SVG de slide-23
  const preloadAllSlide23Svgs = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    if (!slide23Section) return;
    
    const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
    console.log(`🔄 Préchargement de ${imageContainers.length} containers SVG...`);
    
    imageContainers.forEach((container, index) => {
      const containerId = container.id || `image-container-${index + 1}`;
      const svgElements = container.querySelectorAll('svg, object[type="image/svg+xml"]');
      
      if (svgElements.length > 0) {
        const svgData = [];
        svgElements.forEach((svg, svgIndex) => {
          // Créer une copie complète pour le cache
          const clonedSvg = svg.cloneNode(true);
          const parent = svg.parentNode;
          const nextSibling = svg.nextSibling;
          
          svgData.push({
            element: clonedSvg,
            originalElement: svg, // Référence vers l'original
            parent: parent,
            nextSibling: nextSibling,
            index: svgIndex
          });
        });
        
        // Stocker dans le cache permanent
        slide23SvgCache.set(containerId, svgData);
        console.log(`📦 Cache créé pour ${containerId}: ${svgData.length} SVG`);
      }
    });
    
    console.log(`✅ Préchargement terminé - ${slide23SvgCache.size} containers en cache`);
  };

  // Fonction optimisée pour supprimer les SVG (utilise le cache si possible)
  const removeSvgFromContainerOptimized = (container, containerId) => {
    // Vérifier si on a déjà un cache pour ce container
    if (!slide23SvgCache.has(containerId)) {
      // Créer le cache maintenant si pas encore fait
      const svgElements = container.querySelectorAll('svg, object[type="image/svg+xml"]');
      if (svgElements.length > 0) {
        const svgData = [];
        svgElements.forEach((svg, index) => {
          const parent = svg.parentNode;
          const nextSibling = svg.nextSibling;
          svgData.push({
            element: svg.cloneNode(true),
            originalElement: svg,
            parent: parent,
            nextSibling: nextSibling,
            index: index
          });
        });
        slide23SvgCache.set(containerId, svgData);
      }
    }
    
    // Supprimer les SVG du DOM
    const svgElements = container.querySelectorAll('svg, object[type="image/svg+xml"]');
    svgElements.forEach(svg => svg.remove());
    
    console.log(`🗑️ SVG supprimés du DOM pour ${containerId} (cache conservé)`);
  };

  // Fonction optimisée pour insérer les SVG (utilise le cache)
  const insertSvgFromCache = (container, containerId) => {
    // ✅ NOUVEAU : Afficher le spinner pendant l'insertion
    const spinner = createSvgSpinner(container, containerId);
    
    const cachedData = slide23SvgCache.get(containerId);
    if (cachedData && cachedData.length > 0) {
      let insertedCount = 0;
      
      // Délai léger pour que le spinner soit visible (simulation de chargement)
      setTimeout(() => {
        cachedData.forEach(data => {
          // Créer une nouvelle copie depuis le cache
          const newSvg = data.element.cloneNode(true);
          
          // Insérer à la position d'origine
          if (data.nextSibling && data.nextSibling.parentNode === data.parent) {
            data.parent.insertBefore(newSvg, data.nextSibling);
          } else {
            data.parent.appendChild(newSvg);
          }
          insertedCount++;
        });
        
        console.log(`🚀 ${insertedCount} SVG réinsérés depuis le cache pour ${containerId}`);
        
        // ✅ NOUVEAU : Supprimer le spinner après insertion
        setTimeout(() => {
          removeSvgSpinner(container, containerId);
        }, 100); // Délai court pour voir l'animation SVG commencer
        
      }, 200); // Délai de 200ms pour voir le spinner
      
      return insertedCount;
    }
    
    console.warn(`⚠️ Pas de cache trouvé pour ${containerId}`);
    // Supprimer le spinner même si pas de cache
    setTimeout(() => {
      removeSvgSpinner(container, containerId);
    }, 500);
    
    return 0;
  };

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