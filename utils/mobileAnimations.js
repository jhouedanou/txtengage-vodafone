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
      console.warn('❌ Slide-73 section not found');
      return;
    }

    const pointsFortDiv = slide73Section.querySelector('.points-fort');
    const slidesContainerDiv = slide73Section.querySelector('.slides-container');
    // ESSAYER LES DEUX SÉLECTEURS : .slide-73-point ET .points-fort li
    const pointsElements = Array.from(slide73Section.querySelectorAll('.slide-73-point'));
    const pointsLiElements = Array.from(slide73Section.querySelectorAll('.points-fort li'));
    
    // Utiliser les éléments qui existent réellement
    const actualPointsElements = pointsElements.length > 0 ? pointsElements : pointsLiElements;

    console.log('🔍 Slide73 Mobile Debug:', {
      section: !!slide73Section,
      pointsFortDiv: !!pointsFortDiv,
      slidesContainer: !!slidesContainerDiv,
      slidePointsCount: pointsElements.length,
      liPointsCount: pointsLiElements.length,
      actualElementsCount: actualPointsElements.length
    });

    if (!pointsFortDiv) {
      console.warn('❌ .points-fort div not found in slide-73');
      return;
    }

    // Fonction pour réinitialiser les éléments à l'état initial
    const resetToInitialState = () => {
      console.log('🔄 Slide73 Mobile: Reset to initial state');
      
      // Points-fort commence en bas (hors écran)
      gsap.set(pointsFortDiv, { 
        autoAlpha: 1, 
        y: '100vh', // Commence en bas
        height: '80vh', // Hauteur définitive
        scale: 1 
      });
      
      // Cacher tous les éléments de points
      actualPointsElements.forEach(point => {
        gsap.set(point, { autoAlpha: 0, y: 30 });
      });
      
      // GARDER LE BACKGROUND FIXE - ne pas le modifier
      if (slidesContainerDiv) {
        gsap.set(slidesContainerDiv, { 
          backgroundSize: 'cover', 
          backgroundPositionY: '0vw',
          // S'assurer que le background ne bouge pas
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
      console.log('🚀 Slide73 Mobile: Starting UP animation');
      
      // DEBUG: Vérifier les éléments avant animation
      console.log('🔍 Elements DEBUG avant animation:', {
        pointsFortDiv: pointsFortDiv,
        pointsFortExists: !!pointsFortDiv,
        pointsFortClasses: pointsFortDiv?.className,
        pointsFortStyle: pointsFortDiv?.style.cssText,
        pointsFortComputedStyle: pointsFortDiv ? {
          opacity: getComputedStyle(pointsFortDiv).opacity,
          visibility: getComputedStyle(pointsFortDiv).visibility,
          transform: getComputedStyle(pointsFortDiv).transform,
          height: getComputedStyle(pointsFortDiv).height,
          width: getComputedStyle(pointsFortDiv).width,
          position: getComputedStyle(pointsFortDiv).position,
          top: getComputedStyle(pointsFortDiv).top,
          left: getComputedStyle(pointsFortDiv).left,
          zIndex: getComputedStyle(pointsFortDiv).zIndex
        } : null,
        actualPointsElements: actualPointsElements,
        actualPointsCount: actualPointsElements.length,
        actualPointsElementsDetails: actualPointsElements.map(el => ({
          element: el,
          className: el.className,
          textContent: el.textContent?.substring(0, 50),
          style: el.style.cssText
        }))
      });
      
      // Marquer l'animation comme en cours pour bloquer la navigation
      animationStates.value['slide-73-animation-playing'] = true;
      animationStates.value['slide-73-mobile'] = 'animating';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          // DEBUG: Vérifier les éléments après animation
          console.log('🔍 Elements DEBUG après animation:', {
            pointsFortComputedStyleAfter: pointsFortDiv ? {
              opacity: getComputedStyle(pointsFortDiv).opacity,
              visibility: getComputedStyle(pointsFortDiv).visibility,
              transform: getComputedStyle(pointsFortDiv).transform,
              height: getComputedStyle(pointsFortDiv).height,
              top: getComputedStyle(pointsFortDiv).top
            } : null,
            actualPointsVisible: actualPointsElements.map(el => ({
              opacity: getComputedStyle(el).opacity,
              visibility: getComputedStyle(el).visibility,
              transform: getComputedStyle(el).transform
            }))
          });
          
          // MARQUER L'ANIMATION COMME TERMINÉE
          animationStates.value['slide-73-mobile'] = 'complete';
          animationStates.value['slide-73-animation-playing'] = false;
          animationStates.value['slide-73-animation-complete'] = true;
          animationStates.value['slide-73-points-shown'] = true;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log('✅ Slide73 Mobile: UP Animation completed');
        }
      });

      // 1. SEULEMENT faire glisser points-fort vers le haut pour occuper 80vh
      console.log('🎬 Animating points-fort from y:100vh to y:20vh');
      tl.to(pointsFortDiv, {
        y: '20vh', // Positionner à 20vh du haut (donc 80vh de hauteur visible)
        duration: 0.8,
        ease: 'power3.easeOut',
        onStart: () => {
          console.log('🎬 Points-fort animation started, current style:', {
            transform: getComputedStyle(pointsFortDiv).transform,
            y: getComputedStyle(pointsFortDiv).top
          });
        },
        onUpdate: () => {
          console.log('🎬 Points-fort animating, current transform:', getComputedStyle(pointsFortDiv).transform);
        },
        onComplete: () => {
          console.log('🎬 Points-fort animation complete, final style:', {
            transform: getComputedStyle(pointsFortDiv).transform,
            top: getComputedStyle(pointsFortDiv).top
          });
        }
      });

      // 2. Faire apparaître les points un par un SEULEMENT S'IL Y EN A
      if (actualPointsElements.length > 0) {
        console.log('🎬 Animating points elements, count:', actualPointsElements.length);
        tl.to(actualPointsElements, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          onStart: () => {
            console.log('🎬 Points elements animation started');
          },
          onComplete: () => {
            console.log('🎬 Points elements animation complete');
          }
        }, "-=0.3");
      } else {
        console.warn('⚠️ Aucun élément de points trouvé pour l\'animation');
      }
    };

    // Fonction pour l'animation vers le bas (swipe down - inverse)
    const triggerSlide73AnimationDown = () => {
      console.log('🚀 Slide73 Mobile: Starting DOWN animation (reverse)');
      
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
          
          console.log('✅ Slide73 Mobile: DOWN Animation completed');
        }
      });

      // 1. Faire disparaître les points d'abord
      if (actualPointsElements.length > 0) {
        tl.to(actualPointsElements, {
          autoAlpha: 0,
          y: 30,
          duration: 0.3,
          stagger: -0.05, // Stagger inversé
          ease: 'power2.in'
        });
      }

      // 2. SEULEMENT faire glisser points-fort vers le bas (hors écran)
      tl.to(pointsFortDiv, {
        y: '100vh', // Retour en bas
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
        console.log('📍 Slide73 Mobile: onEnter');
        // Toujours à l'état initial quand on entre
      },
      onLeave: () => {
        console.log('📍 Slide73 Mobile: onLeave');
        // TOUJOURS réinitialiser quand on quitte
        resetToInitialState();
      },
      onEnterBack: () => {
        console.log('📍 Slide73 Mobile: onEnterBack');
        // TOUJOURS réinitialiser quand on revient
        resetToInitialState();
      },
      onLeaveBack: () => {
        console.log('📍 Slide73 Mobile: onLeaveBack');
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
      console.warn('❌ Éléments #mshill ou #doctornek non trouvés dans slide-21');
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
      
      console.log('🔄 Slide 21 reset to initial state');
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
          
          console.log('Slide-21: Animation #doctornek terminée');
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
        ease: "power2.out", // Même easing que thoiathoing
        onComplete: () => {
          console.log('Slide-21: #mshill fade-in terminé (style useFullpageScrollTrigger)');
        }
      });
    };

    // ScrollTrigger pour détecter quand la slide 21 est visible et déclencher l'animation
    const st = ScrollTrigger.create({
      trigger: slide21Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%', // Même timing que useFullpageScrollTrigger
      end: 'bottom top',
      onEnter: () => {
        console.log('📍 Slide 21 is now visible');
        
        // Animation automatique de #mshill à l'entrée, comme dans useFullpageScrollTrigger
        // où l'animation se déclenche automatiquement dans goToSection
        if (!animationStates.value['slide-21-mshill-shown']) {
          showMshill();
        }
      },
      onLeave: () => {
        console.log('📍 Leaving slide 21 (going down)');
        // TOUJOURS réinitialiser quand on quitte
        resetToInitialState();
      },
      onEnterBack: () => {
        console.log('📍 Entering back slide 21');
        // TOUJOURS réinitialiser quand on revient
        resetToInitialState();
        // Petit délai pour que le reset soit effectif, puis rejouer l'animation
        setTimeout(() => {
          showMshill();
        }, 50);
      },
      onLeaveBack: () => {
        console.log('📍 Leaving slide 21 (going up)');
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
      console.log('👆 Touch Start:', {
        startY: touchStartY,
        currentSection: sections.value[currentSectionIndex.value]?.id,
        sectionsCount: sections.value.length,
        timestamp: Date.now()
      });
    };

    const handleTouchEnd = (e) => {
      touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;

      console.log('📱 Touch End:', {
        startY: touchStartY,
        endY: touchEndY,
        swipeDistance,
        swipeDirection: swipeDistance > 0 ? 'UP' : 'DOWN',
        minSwipeDistance,
        isNavigating: isNavigating.value,
        currentSectionIndex: currentSectionIndex.value,
        currentSectionId: sections.value[currentSectionIndex.value]?.id,
        passesThreshold: Math.abs(swipeDistance) > minSwipeDistance,
        canProcess: Math.abs(swipeDistance) > minSwipeDistance && !isNavigating.value
      });

      if (Math.abs(swipeDistance) > minSwipeDistance && !isNavigating.value) {
        
        if (swipeDistance > 0) {
          // Swipe vers le haut (bas->haut) = slide suivante
          console.log('🔼 Processing SWIPE UP');
          
          const currentSection = sections.value[currentSectionIndex.value];
          console.log('📍 Current section details:', {
            section: currentSection,
            id: currentSection?.id,
            hasSection: !!currentSection,
            isSlide73: currentSection?.id === 'slide-73'
          });
          
          // GESTION SPÉCIALE POUR SLIDE-73
          if (currentSection && currentSection.id === 'slide-73') {
            console.log('🎯 Slide73 swipe UP detected:', {
              state: animationStates.value['slide-73-mobile'],
              isPlaying: animationStates.value['slide-73-animation-playing'],
              hasAnimationUp: !!currentSection._triggerAnimationUp,
              hasReverseAnimation: !!currentSection._triggerAnimationDown,
              pointsShown: animationStates.value['slide-73-points-shown'],
              debugInfo: currentSection._debugInfo,
              sectionElement: currentSection
            });
            
            // Si l'animation n'a jamais été vue, la déclencher
            if (animationStates.value['slide-73-mobile'] === 'hidden') {
              if (currentSection._triggerAnimationUp) {
                console.log('🚀 Triggering slide73 animation UP');
                currentSection._triggerAnimationUp();
                return; // Bloquer la navigation normale
              } else {
                console.warn('❌ _triggerAnimationUp not found on slide73 section');
                console.log('Available methods:', Object.keys(currentSection));
              }
            } else {
              console.log('⚠️ Slide73 not in hidden state, current state:', animationStates.value['slide-73-mobile']);
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-73-animation-playing']) {
              console.log('🔄 Slide73 animation already playing, ignoring swipe');
              return;
            }
            
            // Si l'animation est terminée, permettre la navigation
            if (animationStates.value['slide-73-mobile'] === 'complete') {
              console.log('✅ Slide73 animation complete, allowing navigation');
              // Continuer avec la navigation normale
            }
          } else {
            console.log('📍 Not on slide-73, current section:', currentSection?.id);
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
            console.log('📱 Normal navigation to next slide');
            goToMobileSection(currentSectionIndex.value + 1);
          } else {
            console.log('📱 Already at last slide');
          }
          
        } else {
          // Swipe vers le bas (haut->bas) = slide précédente OU animation inverse pour slide73
          console.log('🔽 Processing SWIPE DOWN');
          
          const currentSection = sections.value[currentSectionIndex.value];
          
          // GESTION SPÉCIALE POUR SLIDE-73 - ANIMATION INVERSE
          if (currentSection && currentSection.id === 'slide-73') {
            console.log('🎯 Slide73 swipe DOWN detected:', {
              state: animationStates.value['slide-73-mobile'],
              isPlaying: animationStates.value['slide-73-animation-playing'],
              pointsShown: animationStates.value['slide-73-points-shown']
            });
            
            // Si les points sont affichés (animation terminée), faire l'animation inverse
            if (animationStates.value['slide-73-mobile'] === 'complete' && 
                animationStates.value['slide-73-points-shown']) {
              if (currentSection._triggerAnimationDown) {
                console.log('🚀 Triggering slide73 animation DOWN (reverse)');
                currentSection._triggerAnimationDown();
                return; // Bloquer la navigation normale
              } else {
                console.warn('❌ _triggerAnimationDown not found on slide73 section');
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-73-animation-playing']) {
              console.log('🔄 Slide73 animation already playing, ignoring swipe');
              return;
            }
            
            // Si on est à l'état initial, permettre la navigation vers la slide précédente
            if (animationStates.value['slide-73-mobile'] === 'hidden') {
              console.log('✅ Slide73 at initial state, allowing navigation to previous slide');
              // Continuer avec la navigation normale vers la slide précédente
            }
          }
          
          // Navigation normale vers la slide précédente
          if (currentSectionIndex.value > 0) {
            console.log('📱 Normal navigation to previous slide');
            goToMobileSection(currentSectionIndex.value - 1);
          } else {
            console.log('📱 Already at first slide');
          }
        }
      } else {
        console.log('⚠️ Swipe not processed:', {
          reason: Math.abs(swipeDistance) <= minSwipeDistance ? 'Distance too small' : 'Navigation in progress',
          distance: Math.abs(swipeDistance),
          required: minSwipeDistance,
          isNavigating: isNavigating.value
        });
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

  // Fonction utilitaire pour reset complet (à appeler dans la console pour les tests)
  const resetSlide73State = () => {
    localStorage.removeItem('slide-73-animation-seen');
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (slide73Section && slide73Section._resetToInitialState) {
      slide73Section._resetToInitialState();
    }
    console.log('État de la slide 73 réinitialisé');
  };

  // Exposer la fonction pour le debug
  window.resetSlide73State = resetSlide73State;

  // NOUVELLES FONCTIONS DE DEBUG POUR SLIDE73
  window.debugSlide73Mobile = {
    // Forcer l'animation slide73 UP
    triggerAnimationUp: () => {
      const slide73Section = sections.value.find(s => s.id === 'slide-73');
      if (slide73Section && slide73Section._triggerAnimationUp) {
        console.log('🎮 Debug: Forcing slide73 animation UP');
        slide73Section._triggerAnimationUp();
      } else {
        console.warn('❌ Slide73 section or animation UP not found');
      }
    },
    
    // Forcer l'animation slide73 DOWN (inverse)
    triggerAnimationDown: () => {
      const slide73Section = sections.value.find(s => s.id === 'slide-73');
      if (slide73Section && slide73Section._triggerAnimationDown) {
        console.log('🎮 Debug: Forcing slide73 animation DOWN');
        slide73Section._triggerAnimationDown();
      } else {
        console.warn('❌ Slide73 section or animation DOWN not found');
      }
    },
    
    // Vérifier l'état actuel
    checkState: () => {
      const slide73Section = sections.value.find(s => s.id === 'slide-73');
      console.log('🔍 Slide73 Debug State:', {
        currentIndex: currentSectionIndex.value,
        currentSection: sections.value[currentSectionIndex.value]?.id,
        animationStates: {
          mobile: animationStates.value['slide-73-mobile'],
          playing: animationStates.value['slide-73-animation-playing'],
          complete: animationStates.value['slide-73-animation-complete'],
          pointsShown: animationStates.value['slide-73-points-shown']
        },
        section: !!slide73Section,
        hasAnimationUp: !!(slide73Section && slide73Section._triggerAnimationUp),
        hasAnimationDown: !!(slide73Section && slide73Section._triggerAnimationDown),
        debugInfo: slide73Section?._debugInfo
      });
    },
    
    // Diagnostic complet
    fullDiagnostic: () => {
      console.log('🔬 DIAGNOSTIC COMPLET SLIDE73:');
      console.log('1. Sections disponibles:', sections.value.map(s => ({ id: s.id, element: s })));
      
      const slide73Section = sections.value.find(s => s.id === 'slide-73');
      
      if (slide73Section) {
        console.log('2. Slide73 trouvée:', slide73Section);
        console.log('3. DOM Elements:');
        
        const pointsFortDiv = slide73Section.querySelector('.points-fort');
        const slidesContainerDiv = slide73Section.querySelector('.slides-container');
        const pointsElements = Array.from(slide73Section.querySelectorAll('.slide-73-point'));
        const pointsLiElements = Array.from(slide73Section.querySelectorAll('.points-fort li'));
        
        console.log('   - .points-fort:', pointsFortDiv);
        console.log('   - .slides-container:', slidesContainerDiv);
        console.log('   - .slide-73-point count:', pointsElements.length);
        console.log('   - .points-fort li count:', pointsLiElements.length);
        
        console.log('4. Méthodes attachées:');
        console.log('   - _triggerAnimationUp:', !!slide73Section._triggerAnimationUp);
        console.log('   - _triggerAnimationDown:', !!slide73Section._triggerAnimationDown);
        console.log('   - _resetToInitialState:', !!slide73Section._resetToInitialState);
        
        console.log('5. États d\'animation:', {
          mobile: animationStates.value['slide-73-mobile'],
          playing: animationStates.value['slide-73-animation-playing'],
          complete: animationStates.value['slide-73-animation-complete'],
          pointsShown: animationStates.value['slide-73-points-shown']
        });
        
        console.log('6. Position actuelle:', {
          currentIndex: currentSectionIndex.value,
          currentSection: sections.value[currentSectionIndex.value]?.id,
          isOnSlide73: sections.value[currentSectionIndex.value]?.id === 'slide-73'
        });
        
      } else {
        console.error('❌ Slide73 NON TROUVÉE dans les sections!');
        console.log('Sections disponibles:', sections.value);
      }
      
      console.log('7. Configuration mobile:');
      console.log('   - isNavigating:', isNavigating.value);
      console.log('   - minSwipeDistance:', 50);
      console.log('   - Listeners actifs:', mobileEventListeners.length);
    },
    
    // Reset l'état
    reset: () => {
      const slide73Section = sections.value.find(s => s.id === 'slide-73');
      if (slide73Section && slide73Section._resetToInitialState) {
        console.log('🔄 Debug: Resetting slide73 state');
        slide73Section._resetToInitialState();
      } else {
        console.warn('❌ Slide73 reset function not found');
      }
    },
    
    // Naviguer vers slide73
    goToSlide73: () => {
      const slide73Index = sections.value.findIndex(s => s.id === 'slide-73');
      if (slide73Index !== -1) {
        console.log('🎯 Debug: Navigating to slide73');
        goToMobileSection(slide73Index);
      } else {
        console.warn('❌ Slide73 not found in sections');
      }
    },
    
    // Test complet du cycle d'animation
    testFullCycle: async () => {
      console.log('🧪 Debug: Testing full animation cycle');
      const slide73Section = sections.value.find(s => s.id === 'slide-73');
      
      if (!slide73Section) {
        console.warn('❌ Slide73 not found');
        return;
      }
      
      // 1. Aller à slide73
      window.debugSlide73Mobile.goToSlide73();
      
      // 2. Attendre un peu puis déclencher animation UP
      setTimeout(() => {
        window.debugSlide73Mobile.triggerAnimationUp();
        
        // 3. Attendre la fin de l'animation puis déclencher DOWN
        setTimeout(() => {
          window.debugSlide73Mobile.triggerAnimationDown();
        }, 2000);
      }, 1000);
    }
  };

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
