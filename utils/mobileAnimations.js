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

  // Animation spéciale pour la slide 73 sur mobile - déclenchée par swipe bas->haut avec blocage
  // Version simplifiée : reset systématique
  const registerMobileSlide73Animation = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (!slide73Section) return;

    const pointsFortDiv = slide73Section.querySelector('.points-fort');
    const slidesContainerDiv = slide73Section.querySelector('.slides-container');
    const pointsElements = Array.from(slide73Section.querySelectorAll('.slide-73-point'));

    if (!pointsFortDiv) return;

    // Fonction pour réinitialiser les éléments à l'état initial
    const resetToInitialState = () => {
      gsap.set(pointsFortDiv, { autoAlpha: 0, y: 50, scale: 0.9 });
      pointsElements.forEach(point => {
        gsap.set(point, { autoAlpha: 0, y: 30, x: -20 });
      });
      if (slidesContainerDiv) {
        gsap.set(slidesContainerDiv, { backgroundSize: 'cover', backgroundPositionY: '0vw' });
      }
      
      // Réinitialiser les états
      animationStates.value['slide-73-mobile'] = 'hidden';
      animationStates.value['slide-73-animation-playing'] = false;
      animationStates.value['slide-73-animation-complete'] = false;
    };

    // === TOUJOURS COMMENCER À L'ÉTAT INITIAL ===
    resetToInitialState();

    // Fonction pour déclencher l'animation (inchangée)
    const triggerSlide73Animation = () => {
      // Marquer l'animation comme en cours pour bloquer la navigation
      animationStates.value['slide-73-animation-playing'] = true;
      animationStates.value['slide-73-mobile'] = 'animating';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          // MARQUER L'ANIMATION COMME TERMINÉE MAIS NE PAS NAVIGUER
          animationStates.value['slide-73-mobile'] = 'complete';
          animationStates.value['slide-73-animation-playing'] = false;
          animationStates.value['slide-73-animation-complete'] = true; // L'animation est finie
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          // SUPPRIMER LA NAVIGATION AUTOMATIQUE
          // L'utilisateur devra faire un second swipe pour continuer
          
          // Optionnel : Sauvegarder dans localStorage que l'animation a été vue
          localStorage.setItem('slide-73-animation-seen', 'true');
        }
      });

      // 1. Faire apparaître la div points-fort
      tl.to(pointsFortDiv, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'power2.out'
      });

      // 2. Animer le background en parallèle
      if (slidesContainerDiv) {
        tl.to(slidesContainerDiv, {
          backgroundPositionY: '-10vw',
          duration: 0.5,
          ease: 'power2.out',
        }, "-=0.4");
      }

      // 3. Faire apparaître les points un par un
      tl.to(pointsElements, {
        autoAlpha: 1,
        y: 0,
        x: 0,
        duration: 0.4,
        stagger: 0.15,
        ease: 'power2.out'
      }, "-=0.2");

      // 4. Délai final réduit
      tl.to({}, { duration: 0.5 });
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
    slide73Section._triggerAnimation = triggerSlide73Animation;
    slide73Section._resetToInitialState = resetToInitialState;
  };

  // Animation simplifiée pour la slide 21
  const registerMobileSlide21Animation = () => {
    const slide21Section = sections.value.find(s => s.id === 'slide-21');
    if (!slide21Section) return;

    const thoiathoingDiv = slide21Section.querySelector('#thoiathoing');
    if (!thoiathoingDiv) return;

    gsap.set(thoiathoingDiv, { autoAlpha: 0, y: 30 }); // Moins de déplacement
    animationStates.value['slide-21-playedOnce'] = false;

    const st = ScrollTrigger.create({
      trigger: slide21Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        if (!animationStates.value['slide-21-playedOnce']) {
          gsap.to(thoiathoingDiv, {
            autoAlpha: 1,
            y: 0,
            duration: 0.6, // Animation plus rapide
            ease: 'power2.out',
            onComplete: () => {
              animationStates.value['slide-21-playedOnce'] = true;
            }
          });
        }
      }
    });
    mobileScrollTriggers.push(st);
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

  // Configuration des interactions tactiles pour mobile AVEC gestion spéciale slide-73
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
          
          // GESTION SPÉCIALE POUR SLIDE-73
          const currentSection = sections.value[currentSectionIndex.value];
          if (currentSection && currentSection.id === 'slide-73') {
            
            // Si l'animation n'a jamais été vue, la déclencher
            if (animationStates.value['slide-73-mobile'] === 'hidden') {
              if (currentSection._triggerAnimation) {
                currentSection._triggerAnimation();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-73-animation-playing']) {
              return;
            }
            
            // Si l'animation est terminée, permettre la navigation normale
            // (ce sera le second swipe qui déclenchera la navigation)
          }
          
          // Navigation normale vers la slide suivante
          if (currentSectionIndex.value < sections.value.length - 1) {
            goToMobileSection(currentSectionIndex.value + 1);
          }
          
        } else {
          // Swipe vers le bas (haut->bas) = slide précédente
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
      registerMobileSlide21Animation();
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
