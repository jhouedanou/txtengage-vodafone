import { ref, onUnmounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Configuration pour écrans mobiles (moins de 1024px)
export function useMobileAnimations() {
  // Variables d'état mobiles
  const sections = ref([]);
  const currentSectionIndex = ref(0);
  const isNavigating = ref(false);
  const animationStates = ref({});
  const isAnimating = ref(false);
  
  const SCROLLER_SELECTOR = "#master-scroll-container";
  let mobileScrollTriggers = [];
  let mobileEventListeners = [];

  // ===========================================================================
  // ANIMATIONS MOBILES SIMPLIFIÉES
  // ===========================================================================

  // Animation spéciale pour la slide 73 sur mobile - swipe up/down avec slide animation
  const registerMobileSlide73Animation = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (!slide73Section) {
      return;
    }

    const pointsFortDiv = slide73Section.querySelector('.points-fort');
    const slidesContainerDiv = slide73Section.querySelector('.slides-container');
    // ESSAYER LES DEUX SÉLECTEURS : .slide-73-point ET .points-fort li
    const pointsElements = Array.from(slide73Section.querySelectorAll('.slide-73-point'));
    const pointsLiElements = Array.from(slide73Section.querySelectorAll('.points-fort li'));
    
    // Utiliser les éléments qui existent réellement
    const actualPointsElements = pointsElements.length > 0 ? pointsElements : pointsLiElements;

    if (!pointsFortDiv) {
      return;
    }

    // Fonction pour réinitialiser les éléments à l'état initial
    const resetToInitialState = () => {
      // Points-fort commence en bas (hors écran)
      gsap.set(pointsFortDiv, { 
        autoAlpha: 1, 
        top: '100vh', // Utiliser top au lieu de y
        height: '80vh',
        position: 'absolute',
        width: '100%',
        left: 0,
        zIndex: 10
      });
      
      // Cacher tous les éléments de points
      actualPointsElements.forEach(point => {
        gsap.set(point, { autoAlpha: 0, y: 30 });
      });
      
      // GARDER LE BACKGROUND FIXE
      if (slidesContainerDiv) {
        gsap.set(slidesContainerDiv, { 
          backgroundSize: 'cover', 
          backgroundPositionY: '0vw',
          transform: 'none'
        });
      }
      
      // Réinitialiser les états
      animationStates.value['slide-73-mobile'] = 'hidden';
      animationStates.value['slide-73-animation-playing'] = false;
      animationStates.value['slide-73-animation-complete'] = false;
      animationStates.value['slide-73-points-shown'] = false;
    };

    // === TOUJOURS COMMENCER À L'ÉTAT INITIAL ===
    resetToInitialState();

    // Fonction pour l'animation vers le haut (swipe up)
    const triggerSlide73AnimationUp = () => {
      // Marquer l'animation comme en cours pour bloquer la navigation
      animationStates.value['slide-73-animation-playing'] = true;
      animationStates.value['slide-73-mobile'] = 'animating';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          // MARQUER L'ANIMATION COMME TERMINÉE
          animationStates.value['slide-73-mobile'] = 'complete';
          animationStates.value['slide-73-animation-playing'] = false;
          animationStates.value['slide-73-animation-complete'] = true;
          animationStates.value['slide-73-points-shown'] = true;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
        }
      });

      // 1. Faire glisser points-fort vers le haut avec top
      tl.to(pointsFortDiv, {
        top: '20vh', // Utiliser top au lieu de y
        duration: 0.8,
        ease: 'power3.easeOut'
      });

      // 2. Faire apparaître les points un par un
      if (actualPointsElements.length > 0) {
        tl.to(actualPointsElements, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out'
        }, "-=0.3");
      }
    };

    // Fonction pour l'animation vers le bas (swipe down - inverse)
    const triggerSlide73AnimationDown = () => {
      // Marquer l'animation comme en cours pour bloquer la navigation
      animationStates.value['slide-73-animation-playing'] = true;
      animationStates.value['slide-73-mobile'] = 'reversing';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          // MARQUER L'ANIMATION COMME TERMINÉE (retour à l'état initial)
          animationStates.value['slide-73-mobile'] = 'hidden';
          animationStates.value['slide-73-animation-playing'] = false;
          animationStates.value['slide-73-animation-complete'] = false;
          animationStates.value['slide-73-points-shown'] = false;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
        }
      });

      // 1. Faire disparaître les points d'abord
      if (actualPointsElements.length > 0) {
        tl.to(actualPointsElements, {
          autoAlpha: 0,
          y: 30,
          duration: 0.3,
          stagger: -0.05,
          ease: 'power2.in'
        });
      }

      // 2. Faire glisser points-fort vers le bas avec top
      tl.to(pointsFortDiv, {
        top: '100vh', // Utiliser top au lieu de y
        duration: 0.7,
        ease: 'power3.easeIn'
      }, "-=0.1");
    };

    // ScrollTrigger simplifié
    const st = ScrollTrigger.create({
      trigger: slide73Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => {
        // Toujours à l'état initial quand on entre
      },
      onLeave: () => {
        // TOUJOURS réinitialiser quand on quitte
        resetToInitialState();
      },
      onEnterBack: () => {
        // TOUJOURS réinitialiser quand on revient
        resetToInitialState();
      },
      onLeaveBack: () => {
        // TOUJOURS réinitialiser quand on quitte vers le haut
        resetToInitialState();
      }
    });

    mobileScrollTriggers.push(st);
    slide73Section._triggerAnimationUp = triggerSlide73AnimationUp;
    slide73Section._triggerAnimationDown = triggerSlide73AnimationDown;
    slide73Section._resetToInitialState = resetToInitialState;
    
    // AJOUTER DES VARIABLES DE DEBUG
    slide73Section._debugInfo = {
      pointsFortDiv: !!pointsFortDiv,
      slidesContainer: !!slidesContainerDiv,
      pointsElements: actualPointsElements.length,
      animationStates: animationStates
    };
  };

  // Animation spéciale pour la slide 21 sur mobile - déclenchée par swipe bas->haut avec blocage
  const registerMobileSlide21Animation = () => {
    const slide21Section = sections.value.find(s => s.id === 'slide-21');
    if (!slide21Section) return;

    const mshillDiv = slide21Section.querySelector('#mshill');
    const doctornekDiv = slide21Section.querySelector('#doctornek');
    
    if (!mshillDiv || !doctornekDiv) {
      return;
    }

    // Fonction pour réinitialiser les éléments à l'état initial
    const resetToInitialState = () => {
      // Cacher #doctornek
      gsap.set(doctornekDiv, { autoAlpha: 0, y: 50, scale: 1 });
      // Cacher #mshill avec l'état initial inspiré de useFullpageScrollTrigger
      gsap.set(mshillDiv, { autoAlpha: 0, y: 50 }); // Même style que thoiathoing
    
      // Réinitialiser les états
      animationStates.value['slide-21-mobile'] = 'hidden';
      animationStates.value['slide-21-animation-playing'] = false;
      animationStates.value['slide-21-animation-complete'] = false;
      animationStates.value['slide-21-mshill-shown'] = false;
    };

    // === ÉTAT INITIAL ===
    resetToInitialState();

    // Fonction pour déclencher l'animation de #doctornek (au swipe)
    const triggerSlide21Animation = () => {
      // Marquer l'animation comme en cours pour bloquer la navigation
      animationStates.value['slide-21-animation-playing'] = true;
      animationStates.value['slide-21-mobile'] = 'animating';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          // MARQUER L'ANIMATION COMME TERMINÉE
          animationStates.value['slide-21-mobile'] = 'complete';
          animationStates.value['slide-21-animation-playing'] = false;
          animationStates.value['slide-21-animation-complete'] = true;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
        }
      });

      // Faire apparaître #doctornek avec animation
      tl.to(doctornekDiv, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out'
      });
    };

    // Fonction pour faire apparaître #mshill - INSPIRÉE DE useFullpageScrollTrigger
    const showMshill = () => {
      if (animationStates.value['slide-21-mshill-shown']) return;
      
      animationStates.value['slide-21-mshill-shown'] = true;
      
      // Animation inspirée de slide-21 dans useFullpageScrollTrigger (thoiathoing)
      gsap.to(mshillDiv, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8, // Même durée que thoiathoing
        ease: "power2.out" // Même easing que thoiathoing
      });
    };

    // ScrollTrigger pour détecter quand la slide 21 est visible et déclencher l'animation
    const st = ScrollTrigger.create({
      trigger: slide21Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%', // Même timing que useFullpageScrollTrigger
      end: 'bottom top',
      onEnter: () => {
        // Animation automatique de #mshill à l'entrée, comme dans useFullpageScrollTrigger
        // où l'animation se déclenche automatiquement dans goToSection
        if (!animationStates.value['slide-21-mshill-shown']) {
          showMshill();
        }
      },
      onLeave: () => {
        // TOUJOURS réinitialiser quand on quitte
        resetToInitialState();
      },
      onEnterBack: () => {
        // TOUJOURS réinitialiser quand on revient
        resetToInitialState();
        // Petit délai pour que le reset soit effectif, puis rejouer l'animation
        setTimeout(() => {
          showMshill();
        }, 50);
      },
      onLeaveBack: () => {
        // TOUJOURS réinitialiser quand on quitte vers le haut
        resetToInitialState();
      }
    });

    mobileScrollTriggers.push(st);
    slide21Section._triggerAnimation = triggerSlide21Animation;
    slide21Section._resetToInitialState = resetToInitialState;
    slide21Section._showMshill = showMshill;
  };

  // Animation simplifiée pour la slide 20 (Turtle Beach)
  const registerMobileSlide20Animation = () => {
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    if (!slide20Section) return;
    
    const turtleBeach = slide20Section.querySelector('#turtlebeach');
    const mzuH2Elements = slide20Section.querySelectorAll('#mzu h2');
    const textElements = [
      slide20Section.querySelector('#text-element-3'),
      slide20Section.querySelector('#text-element-0'),
      slide20Section.querySelector('#text-element-4'),
      slide20Section.querySelector('#text-element-2'),
      slide20Section.querySelector('#text-element-1'),
      slide20Section.querySelector('#text-element-5')
    ].filter(el => el);
    
    // États initiaux simplifiés pour mobile
    if (turtleBeach) gsap.set(turtleBeach, { scale: 0.8, autoAlpha: 1 });
    if (mzuH2Elements) gsap.set(mzuH2Elements, { autoAlpha: 0, y: 15 });
    textElements.forEach(el => gsap.set(el, { autoAlpha: 0, y: 15 }));
    
    animationStates.value['slide-20-mobile-animated'] = false;

    const st = ScrollTrigger.create({
      trigger: slide20Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        if (animationStates.value['slide-20-mobile-animated']) return;

        // Animation séquentielle simplifiée pour mobile
        const tl = gsap.timeline({
          onComplete: () => {
            animationStates.value['slide-20-mobile-animated'] = true;
          }
        });
        
        if (turtleBeach) {
          tl.to(turtleBeach, {
            scale: 1,
            duration: 0.5,
            ease: "power2.out"
          });
        }
        
        if (mzuH2Elements && mzuH2Elements.length) {
          tl.to(mzuH2Elements, {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.05, // Stagger réduit sur mobile
            ease: "power2.out"
          }, "-=0.2");
        }
        
        // Tous les éléments texte en une fois sur mobile
        tl.to(textElements, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: "power2.out"
        }, "-=0.2");
      }
    });
    mobileScrollTriggers.push(st);
  };

  // Animation simplifiée pour la slide 23 (Perdrix) - Pas de slider complexe sur mobile
  const registerMobileSlide23Animation = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    if (!slide23Section) return;

    const joceDiv = slide23Section.querySelector('#joce');
    const perdrixSlides = Array.from(slide23Section.querySelectorAll('.perdrix-slide'));

    if (!joceDiv || perdrixSlides.length === 0) return;

    // Sur mobile, afficher toutes les slides perdrix en séquence simple
    gsap.set(joceDiv, { autoAlpha: 0 });
    perdrixSlides.forEach(slide => {
      gsap.set(slide, { autoAlpha: 0, y: 20 });
    });

    const st = ScrollTrigger.create({
      trigger: slide23Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        // Animation séquentielle simple pour mobile
        const tl = gsap.timeline();
        
        tl.to(joceDiv, {
          autoAlpha: 1,
          duration: 0.5,
          ease: 'power2.out'
        })
        .to(perdrixSlides, {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1, // Affichage rapide en séquence
          ease: 'power2.out'
        }, "-=0.2");
      }
    });
    mobileScrollTriggers.push(st);
  };

  // Animation simplifiée pour la slide 128 (Case Study)
  const registerMobileSlide128Animation = () => {
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    if (!slide128Section) return;

    const killerwuDiv = slide128Section.querySelector('#killerwu');
    const caseStudyItems = Array.from(slide128Section.querySelectorAll('.case-study-item'));

    if (!killerwuDiv) return;

    gsap.set(killerwuDiv, { autoAlpha: 0, y: 30 });
    caseStudyItems.forEach(item => {
      gsap.set(item, { autoAlpha: 0, y: 15 });
    });

    const st = ScrollTrigger.create({
      trigger: slide128Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        // Animation simple pour mobile - tout d'un coup
        const tl = gsap.timeline();
        
        tl.to(killerwuDiv, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out'
        })
        .to(caseStudyItems, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out'
        }, "-=0.3");
      }
    });
    mobileScrollTriggers.push(st);
  };

  // Animation simplifiée pour la slide 59
  const registerMobileSlide59Animation = () => {
    const slide59Section = sections.value.find(s => s.id === 'slide-59');
    if (!slide59Section) return;

    const killerJuniorDiv = slide59Section.querySelector('#killerjunior');
    const llassImg = slide59Section.querySelector('#llass');

    if (!killerJuniorDiv) return;

    gsap.set(killerJuniorDiv, { autoAlpha: 0, y: 30 });
    if (llassImg) {
      gsap.set(llassImg, { 
        autoAlpha: 0,
        scale: 0.9
      });
    }

    const st = ScrollTrigger.create({
      trigger: slide59Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        const tl = gsap.timeline();
        
        tl.to(killerJuniorDiv, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out'
        });
        
        if (llassImg) {
          tl.to(llassImg, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power2.out'
          }, "-=0.3");
        }
      }
    });
    mobileScrollTriggers.push(st);
  };

  // Navigation simplifiée pour mobile avec vérification du blocage fullpage
  const goToMobileSection = (index, duration = 0.8) => {
    if (index < 0 || index >= sections.value.length || isNavigating.value) {
      return;
    }
    
    if (index === currentSectionIndex.value && duration !== 0) {
      return;
    }

    isNavigating.value = true;
    
    gsap.to(SCROLLER_SELECTOR, {
      scrollTo: { y: sections.value[index], autoKill: false },
      duration: duration,
      ease: 'power2.inOut',
      onStart: () => {
        currentSectionIndex.value = index;
      },
      onComplete: () => {
        isNavigating.value = false;
      },
      onInterrupt: () => {
        isNavigating.value = false;
      }
    });
  };

  // Configuration des interactions tactiles pour mobile AVEC gestion spéciale slide-73 ET slide-21
  const setupMobileInteractions = () => {
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;

      if (Math.abs(swipeDistance) > minSwipeDistance && !isNavigating.value) {
        
        if (swipeDistance > 0) {
          // Swipe vers le haut (bas->haut) = slide suivante
          const currentSection = sections.value[currentSectionIndex.value];
          
          // GESTION SPÉCIALE POUR SLIDE-73
          if (currentSection && currentSection.id === 'slide-73') {
            // Si l'animation n'a jamais été vue, la déclencher
            if (animationStates.value['slide-73-mobile'] === 'hidden') {
              if (currentSection._triggerAnimationUp) {
                currentSection._triggerAnimationUp();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-73-animation-playing']) {
              return;
            }
            
            // Si l'animation est terminée, permettre la navigation
            if (animationStates.value['slide-73-mobile'] === 'complete') {
              // Continuer avec la navigation normale
            }
          }
          
          // GESTION SPÉCIALE POUR SLIDE-21
          if (currentSection && currentSection.id === 'slide-21') {
            // Si #doctornek n'a jamais été montré, déclencher son animation
            if (animationStates.value['slide-21-mobile'] === 'hidden' && 
                animationStates.value['slide-21-mshill-shown']) {
              if (currentSection._triggerAnimation) {
                currentSection._triggerAnimation();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation #doctornek est en cours, ignorer le swipe
            if (animationStates.value['slide-21-animation-playing']) {
              return;
            }
          }
          
          // Navigation normale vers la slide suivante
          if (currentSectionIndex.value < sections.value.length - 1) {
            goToMobileSection(currentSectionIndex.value + 1);
          }
          
        } else {
          // Swipe vers le bas (haut->bas) = slide précédente OU animation inverse pour slide73
          const currentSection = sections.value[currentSectionIndex.value];
          
          // GESTION SPÉCIALE POUR SLIDE-73 - ANIMATION INVERSE
          if (currentSection && currentSection.id === 'slide-73') {
            // Si les points sont affichés (animation terminée), faire l'animation inverse
            if (animationStates.value['slide-73-mobile'] === 'complete' && 
                animationStates.value['slide-73-points-shown']) {
              if (currentSection._triggerAnimationDown) {
                currentSection._triggerAnimationDown();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-73-animation-playing']) {
              return;
            }
            
            // Si on est à l'état initial, permettre la navigation vers la slide précédente
            if (animationStates.value['slide-73-mobile'] === 'hidden') {
              // Continuer avec la navigation normale vers la slide précédente
            }
          }
          
          // Navigation normale vers la slide précédente
          if (currentSectionIndex.value > 0) {
            goToMobileSection(currentSectionIndex.value - 1);
          }
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    mobileEventListeners.push(
      { element: document, event: 'touchstart', handler: handleTouchStart },
      { element: document, event: 'touchend', handler: handleTouchEnd }
    );
  };

  // Initialisation des animations mobiles
  const initMobileAnimations = (sectionsElements) => {
    if (!Array.isArray(sectionsElements) || sectionsElements.some(el => !(el instanceof HTMLElement))) {
      return;
    }
    sections.value = sectionsElements;
    
    if (sections.value.length > 0) {
      // Enregistrement des animations mobiles simplifiées
      registerMobileSlide73Animation();
      registerMobileSlide21Animation(); // Nouvelle animation
      registerMobileSlide20Animation();
      registerMobileSlide23Animation();
      registerMobileSlide128Animation();
      registerMobileSlide59Animation();
      
      // Configuration des interactions tactiles
      setupMobileInteractions();
      
      // Positionnement initial
      goToMobileSection(0, 0);
    }
  };

  // Nettoyage des animations mobiles
  const cleanupMobileAnimations = () => {
    // Nettoyage des ScrollTriggers
    mobileScrollTriggers.forEach(st => st.kill());
    mobileScrollTriggers.length = 0;
    
    // Nettoyage des event listeners
    mobileEventListeners.forEach(listener => {
      listener.element.removeEventListener(listener.event, listener.handler);
    });
    mobileEventListeners.length = 0;
    
    // Nettoyage des animations
    gsap.killTweensOf(SCROLLER_SELECTOR);
    
    // Réinitialisation des états
    currentSectionIndex.value = 0;
    isNavigating.value = false;
    isAnimating.value = false;
    Object.keys(animationStates.value).forEach(key => delete animationStates.value[key]);
    sections.value = [];
  };

  // Hook de nettoyage
  onUnmounted(cleanupMobileAnimations);

  // Retour de l'API publique
  return {
    currentSectionIndex,
    isNavigating,
    animationStates, // Exposer les états d'animation pour le système responsif
    initMobileAnimations,
    goToMobileSection,
    cleanupMobileAnimations
  };
}

export default useMobileAnimations;
