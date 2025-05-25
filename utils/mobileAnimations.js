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

  // Animation spéciale pour la slide 73 sur mobile - BIDIRECTIONNELLE
  // Swipe haut->bas : animation forward (translation div + fade li)
  // Swipe bas->haut : animation reverse (fade out li + translation div)
  const registerMobileSlide73Animation = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (!slide73Section) return;

    const pointsFortDiv = slide73Section.querySelector('.points-fort');
    const slidesContainerDiv = slide73Section.querySelector('.slides-container');
    const pointsElements = Array.from(slide73Section.querySelectorAll('.slide-73-point'));

    if (!pointsFortDiv) return;

    // Fonction pour vérifier si on est sur mobile
    const isMobile = () => {
      return window.innerWidth <= 1024;
    };

        // Fonction pour appliquer les styles mobiles spécifiques SEULEMENT sur mobile
    const applyMobileStylesIfNeeded = () => {
      if (!isMobile()) return; // Ne rien faire sur desktop
      
      console.log('🔧 Application des styles mobiles pour slide-73');
      
      // Neutraliser complètement tous les styles desktop
      gsap.set(pointsFortDiv, {
        position: 'relative',
        transform: 'none',
        width: '100vw',
        maxWidth: '100vw',
        padding: '0rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        left: 'auto',
        right: 'auto',
        top: 'auto',
        bottom: 'auto',
        margin: '0 auto',
        // Forcer la réinitialisation complète
        clearProps: 'x,y,width,height,transform,left,right,top,bottom,translateX,translateY'
      });
      
      // S'assurer que le background du slides-container est bien configuré
      if (slidesContainerDiv) {
        gsap.set(slidesContainerDiv, {
          backgroundSize: 'cover',
          backgroundPositionY: '0vh', // Position initiale du background
          backgroundRepeat: 'no-repeat'
        });
      }
    };

    // Fonction pour réinitialiser les éléments à l'état initial (caché)
    const resetToInitialState = () => {
      console.log('🔄 Reset slide-73 to initial state, isMobile:', isMobile());
      
      if (isMobile()) {
        // ÉTAPE 1: Nettoyer complètement tous les styles GSAP précédents
        gsap.killTweensOf(pointsFortDiv);
        gsap.killTweensOf(pointsElements);
        
        // ÉTAPE 2: Appliquer les styles mobiles de base
        applyMobileStylesIfNeeded();
        
        // ÉTAPE 3: Attendre un frame, puis définir la position initiale
        gsap.delayedCall(0.01, () => {
          gsap.set(pointsFortDiv, { 
            autoAlpha: 0, 
            y: '100vh',
            x: 0,
            scale: 1
          });
          console.log('✅ Slide-73 position initiale définie: y=100vh');
        });
      } else {
        // Sur desktop, laisser les styles par défaut
        gsap.set(pointsFortDiv, { autoAlpha: 0, y: 50 });
      }
      
      // Réinitialiser tous les points
      pointsElements.forEach((point, index) => {
        gsap.set(point, { 
          autoAlpha: 0, 
          y: 30 + (index * 5) // Décalage progressif pour l'effet stagger
        });
      });
      
      if (slidesContainerDiv && isMobile()) {
        gsap.set(slidesContainerDiv, { 
          backgroundSize: 'cover', 
          backgroundPositionY: '0vh' // Position initiale du background
        });
      }
      
      // Réinitialiser les états
      animationStates.value['slide-73-mobile'] = 'hidden';
      animationStates.value['slide-73-animation-playing'] = false;
      animationStates.value['slide-73-animation-complete'] = false;
      
      console.log('🔄 Reset terminé, état:', animationStates.value['slide-73-mobile']);
    };

    // Fonction pour mettre les éléments à l'état final (visible)
    const setToFinalState = () => {
      // Appliquer les styles mobiles SEULEMENT si on est sur mobile
      applyMobileStylesIfNeeded();
      
      gsap.set(pointsFortDiv, { autoAlpha: 1, y: 0 });
      pointsElements.forEach(point => {
        gsap.set(point, { autoAlpha: 1, y: 0 });
      });
      
      // Position finale du background (seulement sur mobile)
      if (slidesContainerDiv && isMobile()) {
        gsap.set(slidesContainerDiv, { backgroundPositionY: '-10vh' });
      }
      
      // Marquer comme complet
      animationStates.value['slide-73-mobile'] = 'complete';
      animationStates.value['slide-73-animation-complete'] = true;
    };

    // === ÉTAT INITIAL ===
    console.log('🚀 Initialisation slide-73, écran mobile:', isMobile());
    
    // Forcer immédiatement les styles mobiles pour éviter le glissement depuis la droite
    if (isMobile()) {
      // Appliquer les styles de base immédiatement
      applyMobileStylesIfNeeded();
      
      // Petit délai pour que les styles CSS soient bien appliqués
      gsap.delayedCall(0.05, () => {
        resetToInitialState();
      });
    } else {
      resetToInitialState();
    }

    // Animation FORWARD (swipe bas->haut) : Translation div puis fade li
    const triggerSlide73ForwardAnimation = () => {
      if (animationStates.value['slide-73-animation-playing']) return;
      
      animationStates.value['slide-73-animation-playing'] = true;
      animationStates.value['slide-73-mobile'] = 'animating-forward';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          animationStates.value['slide-73-mobile'] = 'complete';
          animationStates.value['slide-73-animation-playing'] = false;
          animationStates.value['slide-73-animation-complete'] = true;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log('Slide-73: Animation forward terminée');
        }
      });

      // 1. Glissement de la div points-fort depuis le bas de l'écran
      const forwardAnimProps = {
        autoAlpha: 1,
        y: 0, // Glisser vers la position finale
        duration: 0.8, // Durée un peu plus longue pour l'effet de glissement
        ease: 'power2.out'
      };
      
      // Ajouter les propriétés mobiles SEULEMENT sur mobile
      if (isMobile()) {
        forwardAnimProps.position = 'relative';
        forwardAnimProps.transform = 'translateY(0px)';
      }
      
      tl.to(pointsFortDiv, forwardAnimProps);

      // 1b. Animer le background slides-container en parallèle (seulement sur mobile)
      if (slidesContainerDiv && isMobile()) {
        tl.to(slidesContainerDiv, {
          backgroundPositionY: '-10vh', // Décaler SEULEMENT le background vers le haut
          duration: 0.8,
          ease: 'power2.out'
        }, 0); // En parallèle avec l'animation points-fort (démarrage à 0)
      }

      // 2. Fade des éléments li un par un avec stagger
      tl.to(pointsElements, {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.15,
        ease: 'power2.out'
      }, "-=0.2");
    };

    // Animation REVERSE (swipe haut->bas) : Fade out li puis translation div
    const triggerSlide73ReverseAnimation = () => {
      if (animationStates.value['slide-73-animation-playing']) return;
      
      animationStates.value['slide-73-animation-playing'] = true;
      animationStates.value['slide-73-mobile'] = 'animating-reverse';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          animationStates.value['slide-73-mobile'] = 'hidden';
          animationStates.value['slide-73-animation-playing'] = false;
          animationStates.value['slide-73-animation-complete'] = false;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log('Slide-73: Animation reverse terminée');
        }
      });

      // 1. Fade out des éléments li (dans l'ordre inverse)
      tl.to([...pointsElements].reverse(), {
        autoAlpha: 0,
        y: 20,
        duration: 0.3,
        stagger: 0.1,
        ease: 'power2.out'
      });

      // 2. Glissement de la div points-fort vers le bas de l'écran (reverse)
      const reverseAnimProps = {
        autoAlpha: 0,
        y: '100vh', // Glisser complètement vers le bas
        duration: 0.6, // Durée adaptée pour l'effet de glissement
        ease: 'power2.in' // Easing différent pour la sortie
      };
      
      // Ajouter les propriétés mobiles SEULEMENT sur mobile
      if (isMobile()) {
        reverseAnimProps.position = 'relative';
        reverseAnimProps.transform = 'translateY(100vh)';
      }
      
      tl.to(pointsFortDiv, reverseAnimProps, "-=0.1");

      // 2b. Remettre le background slides-container à sa position initiale (seulement sur mobile)
      if (slidesContainerDiv && isMobile()) {
        tl.to(slidesContainerDiv, {
          backgroundPositionY: '0vh', // Remettre SEULEMENT le background à sa position initiale
          duration: 0.6,
          ease: 'power2.in'
        }, "-=0.5"); // Commencer un peu avant la fin de l'animation points-fort
      }
    };

    // ScrollTrigger simplifié
    const st = ScrollTrigger.create({
      trigger: slide73Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => {
        // Appliquer les styles mobiles SEULEMENT si on est sur mobile
        applyMobileStylesIfNeeded();
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
    slide73Section._triggerForwardAnimation = triggerSlide73ForwardAnimation;
    slide73Section._triggerReverseAnimation = triggerSlide73ReverseAnimation;
    slide73Section._resetToInitialState = resetToInitialState;
    slide73Section._setToFinalState = setToFinalState;
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
    };

    const handleTouchEnd = (e) => {
      touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;

      if (Math.abs(swipeDistance) > minSwipeDistance && !isNavigating.value) {
        
        if (swipeDistance > 0) {
          // Swipe vers le haut (bas->haut) = slide suivante
          
          const currentSection = sections.value[currentSectionIndex.value];
          
          // GESTION SPÉCIALE POUR SLIDE-73 - ANIMATION BIDIRECTIONNELLE
          if (currentSection && currentSection.id === 'slide-73') {
            
            // Si l'animation n'a jamais été vue, déclencher l'animation forward
            if (animationStates.value['slide-73-mobile'] === 'hidden') {
              if (currentSection._triggerForwardAnimation) {
                currentSection._triggerForwardAnimation();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-73-animation-playing']) {
              return;
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
          // Swipe vers le bas (haut->bas) = slide précédente
          
          const currentSection = sections.value[currentSectionIndex.value];
          
          // GESTION SPÉCIALE POUR SLIDE-73 - ANIMATION REVERSE
          if (currentSection && currentSection.id === 'slide-73') {
            
            // Si l'animation est complète, déclencher l'animation reverse
            if (animationStates.value['slide-73-mobile'] === 'complete') {
              if (currentSection._triggerReverseAnimation) {
                currentSection._triggerReverseAnimation();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-73-animation-playing']) {
              return;
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

  // Fonction utilitaire pour reset complet (à appeler dans la console pour les tests)
  const resetSlide73State = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (slide73Section && slide73Section._resetToInitialState) {
      slide73Section._resetToInitialState();
    }
    console.log('État de la slide 73 réinitialisé - Animation bidirectionnelle');
  };

  // Fonction utilitaire pour mettre la slide 73 à l'état final
  const setSlide73ToFinalState = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (slide73Section && slide73Section._setToFinalState) {
      slide73Section._setToFinalState();
    }
    console.log('Slide 73 mise à l\'état final');
  };

  // Fonction de debug pour tester les animations
  const debugSlide73Animation = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (!slide73Section) {
      console.log('❌ Section slide-73 non trouvée');
      return;
    }
    
    console.log('🔍 DEBUG Slide-73:');
    console.log('- Section trouvée:', !!slide73Section);
    console.log('- isMobile:', window.innerWidth <= 1024);
    console.log('- État actuel:', animationStates.value['slide-73-mobile']);
    console.log('- Animation en cours:', animationStates.value['slide-73-animation-playing']);
    console.log('- Animation complète:', animationStates.value['slide-73-animation-complete']);
    
    const pointsFortDiv = slide73Section.querySelector('.points-fort');
    if (pointsFortDiv) {
      const computedStyle = window.getComputedStyle(pointsFortDiv);
      console.log('- Position CSS:', computedStyle.position);
      console.log('- Transform CSS:', computedStyle.transform);
      console.log('- Opacity CSS:', computedStyle.opacity);
    }
    
    // Tester l'animation forward
    console.log('🎬 Test animation forward dans 2 secondes...');
    setTimeout(() => {
      if (slide73Section._triggerForwardAnimation) {
        slide73Section._triggerForwardAnimation();
      }
    }, 2000);
  };

  // Exposer les fonctions pour le debug
  window.resetSlide73State = resetSlide73State;
  window.setSlide73ToFinalState = setSlide73ToFinalState;
  window.debugSlide73Animation = debugSlide73Animation;

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
