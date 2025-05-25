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
      
      gsap.set(pointsFortDiv, { y: 0 });
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

    // Fonction pour vérifier si on est sur mobile
    const isMobile = () => {
      return window.innerWidth <= 1024;
    };

    // Fonction pour appliquer les styles mobiles spécifiques SEULEMENT sur mobile
    const applyMobileStylesIfNeeded = () => {
      if (!isMobile()) return; // Ne rien faire sur desktop
      
      console.log('🔧 Application des styles mobiles pour slide-21');
      
      // Configurer #doctornek pour le recouvrement (comme .points-fort sur slide-73)
      gsap.set(doctornekDiv, {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        backgroundSize: 'cover',
        clearProps: 'transform'
      });

      // S'assurer que #thoiathoing est visible et bien positionné
      gsap.set(mshillDiv, {
        position: 'relative',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        zIndex: 1
      });
    };

    // Fonction pour réinitialiser les éléments à l'état initial
    const resetToInitialState = () => {
      console.log('🔄 Reset slide-21 to initial state, isMobile:', isMobile());
      
      if (isMobile()) {
        // Nettoyer les animations GSAP précédentes
        gsap.killTweensOf([mshillDiv, doctornekDiv]);
        
        // Appliquer les styles mobiles
        applyMobileStylesIfNeeded();
        
        // État initial mobile : #doctornek caché, glissé vers le bas
        gsap.set(doctornekDiv, { 
          y: '100vh', // Commence hors écran en bas, comme .points-fort
          x: 0,
          scale: 1
        });
        
        // #thoiathoing (mshill) caché initialement
        gsap.set(mshillDiv, { autoAlpha: 0, y: 50 });
      } else {
        // Desktop - états par défaut
        gsap.set(doctornekDiv, { autoAlpha: 0, y: 50, scale: 1 });
        gsap.set(mshillDiv, { autoAlpha: 0, y: 50 });
      }
    
      // Réinitialiser les états
      animationStates.value['slide-21-mobile'] = 'hidden';
      animationStates.value['slide-21-animation-playing'] = false;
      animationStates.value['slide-21-animation-complete'] = false;
      animationStates.value['slide-21-mshill-shown'] = false;
      animationStates.value['slide-21-thoiathoing-shown'] = false;
      
      console.log('🔄 Reset slide-21 terminé, état:', animationStates.value['slide-21-mobile']);
    };

    // === ÉTAT INITIAL ===
    console.log('🚀 Initialisation slide-21, écran mobile:', isMobile());
    
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

    // Animation FORWARD (swipe bas->haut) : Recouvrement #doctornek depuis le bas
    const triggerSlide21ForwardAnimation = () => {
      if (animationStates.value['slide-21-animation-playing']) return;
      
      animationStates.value['slide-21-animation-playing'] = true;
      animationStates.value['slide-21-mobile'] = 'animating-forward';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          animationStates.value['slide-21-mobile'] = 'complete';
          animationStates.value['slide-21-animation-playing'] = false;
          animationStates.value['slide-21-animation-complete'] = true;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log('Slide-21: Animation forward #doctornek terminée');
        }
      });

      // Glissement de #doctornek depuis le bas de l'écran pour recouvrir #thoiathoing
      tl.to(doctornekDiv, {
        y: 0, // Glisser vers la position finale
        duration: 0.8,
        ease: 'power2.out'
      });
    };

    // Animation REVERSE (swipe haut->bas) : Retour #doctornek vers le bas
    const triggerSlide21ReverseAnimation = () => {
      if (animationStates.value['slide-21-animation-playing']) return;
      
      animationStates.value['slide-21-animation-playing'] = true;
      animationStates.value['slide-21-mobile'] = 'animating-reverse';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          animationStates.value['slide-21-mobile'] = 'thoiathoing-visible';
          animationStates.value['slide-21-animation-playing'] = false;
          animationStates.value['slide-21-animation-complete'] = false;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log('Slide-21: Animation reverse #doctornek terminée');
        }
      });

      // Glissement de #doctornek vers le bas de l'écran
      tl.to(doctornekDiv, {
        y: '100vh', // Glisser complètement vers le bas
        duration: 0.6,
        ease: 'power2.in'
      });
    };

    // Fonction pour faire apparaître #thoiathoing (#mshill) automatiquement
    const showThoiathoing = () => {
      if (animationStates.value['slide-21-thoiathoing-shown']) return;
      
      animationStates.value['slide-21-thoiathoing-shown'] = true;
      animationStates.value['slide-21-mobile'] = 'thoiathoing-visible';
      
      // Animation d'apparition de #thoiathoing
      gsap.to(mshillDiv, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          console.log('Slide-21: #thoiathoing fade-in terminé');
        }
      });
    };

    // Fonction pour mettre les éléments à l'état final (visible)
    const setToFinalState = () => {
      // Appliquer les styles mobiles SEULEMENT si on est sur mobile
      if (isMobile()) {
        applyMobileStylesIfNeeded();
      }
      
      gsap.set(mshillDiv, { autoAlpha: 1, y: 0 });
      gsap.set(doctornekDiv, { y: 0 });
      
      // Marquer comme complet
      animationStates.value['slide-21-mobile'] = 'complete';
      animationStates.value['slide-21-animation-complete'] = true;
      animationStates.value['slide-21-thoiathoing-shown'] = true;
    };

    // ScrollTrigger pour détecter quand la slide 21 est visible et déclencher l'animation
    const st = ScrollTrigger.create({
      trigger: slide21Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      end: 'bottom top',
      onEnter: () => {
        console.log('📍 Slide 21 is now visible');
        
        // Animation automatique de #thoiathoing à l'entrée
        if (!animationStates.value['slide-21-thoiathoing-shown']) {
          showThoiathoing();
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
          showThoiathoing();
        }, 50);
      },
      onLeaveBack: () => {
        console.log('📍 Leaving slide 21 (going up)');
        // TOUJOURS réinitialiser quand on quitte vers le haut
        resetToInitialState();
      }
    });

    mobileScrollTriggers.push(st);
    slide21Section._triggerForwardAnimation = triggerSlide21ForwardAnimation;
    slide21Section._triggerReverseAnimation = triggerSlide21ReverseAnimation;
    slide21Section._resetToInitialState = resetToInitialState;
    slide21Section._showThoiathoing = showThoiathoing;
    slide21Section._setToFinalState = setToFinalState;
    slide21Section._applyMobileStylesIfNeeded = applyMobileStylesIfNeeded;
  };

  // Animation simplifiée pour la slide 22 - fade-in de #thoiathoing2
  const registerMobileSlide22Animation = () => {
    const slide22Section = sections.value.find(s => s.id === 'slide-22');
    if (!slide22Section) return;

    const thoiathoing2Div = slide22Section.querySelector('#thoiathoing2');
    
    if (!thoiathoing2Div) {
      console.warn('❌ Élément #thoiathoing2 non trouvé dans slide-22');
      return;
    }

    // État initial
    gsap.set(thoiathoing2Div, { autoAlpha: 0, y: 50 });

    // Fonction pour faire apparaître #thoiathoing2 automatiquement
    const showThoiathoing2 = () => {
      // Animation d'apparition de #thoiathoing2
      gsap.to(thoiathoing2Div, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          console.log('Slide-22: #thoiathoing2 fade-in terminé');
        }
      });
    };

    // ScrollTrigger pour détecter quand la slide 22 est visible
    const st = ScrollTrigger.create({
      trigger: slide22Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      end: 'bottom top',
      onEnter: () => {
        console.log('📍 Slide 22 is now visible');
        showThoiathoing2();
      },
      onLeave: () => {
        console.log('📍 Leaving slide 22 (going down)');
        // Réinitialiser quand on quitte
        gsap.set(thoiathoing2Div, { autoAlpha: 0, y: 50 });
      },
      onEnterBack: () => {
        console.log('📍 Entering back slide 22');
        // Rejouer l'animation quand on revient
        showThoiathoing2();
      },
      onLeaveBack: () => {
        console.log('📍 Leaving slide 22 (going up)');
        // Réinitialiser quand on quitte vers le haut
        gsap.set(thoiathoing2Div, { autoAlpha: 0, y: 50 });
      }
    });

    mobileScrollTriggers.push(st);
  };

  // Animation bidirectionnelle pour la slide 20 - #text-element-5 comme overlay
  const registerMobileSlide20Animation = () => {
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    if (!slide20Section) return;

    const turtleBeach = slide20Section.querySelector('#turtlebeach');
    const mzuH2Elements = slide20Section.querySelectorAll('#mzu h2');
    const textElement5 = slide20Section.querySelector('#text-element-5');
    const otherTextElements = [
      slide20Section.querySelector('#text-element-0'),
      slide20Section.querySelector('#text-element-1'),
      slide20Section.querySelector('#text-element-2'),
      slide20Section.querySelector('#text-element-3'),
      slide20Section.querySelector('#text-element-4')
    ].filter(el => el);

    if (!textElement5) {
      console.warn('❌ Élément #text-element-5 non trouvé dans slide-20');
      return;
    }

    // Fonction pour vérifier si on est sur mobile
    const isMobile = () => {
      return window.innerWidth <= 1024;
    };

    // Fonction pour appliquer les styles mobiles spécifiques SEULEMENT sur mobile
    const applyMobileStylesIfNeeded = () => {
      if (!isMobile()) return; // Ne rien faire sur desktop
      
      console.log('🔧 Application des styles mobiles pour slide-20');
      
      // Configurer #text-element-5 pour le recouvrement (comme #doctornek sur slide-21)
      gsap.set(textElement5, {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        clearProps: 'transform'
      });
    };

    // Fonction pour réinitialiser les éléments à l'état initial
    const resetToInitialState = () => {
      console.log('🔄 Reset slide-20 to initial state, isMobile:', isMobile());
      
      if (isMobile()) {
        // Nettoyer les animations GSAP précédentes
        gsap.killTweensOf([turtleBeach, mzuH2Elements, textElement5, ...otherTextElements]);
        
        // Appliquer les styles mobiles
        applyMobileStylesIfNeeded();
        
        // État initial mobile : #text-element-5 caché, glissé vers le bas
        gsap.set(textElement5, { 
          y: '100vh', // Commence hors écran en bas
          x: 0,
          scale: 1
        });
        
        // Autres éléments à l'état visible normal
        if (turtleBeach) gsap.set(turtleBeach, { scale: 1, autoAlpha: 1 });
        if (mzuH2Elements) gsap.set(mzuH2Elements, { autoAlpha: 1, y: 0 });
        otherTextElements.forEach(el => gsap.set(el, { autoAlpha: 1, y: 0 }));
      } else {
        // Desktop - états par défaut
        if (turtleBeach) gsap.set(turtleBeach, { scale: 0.8, autoAlpha: 1 });
        if (mzuH2Elements) gsap.set(mzuH2Elements, { autoAlpha: 0, y: 15 });
        gsap.set(textElement5, { autoAlpha: 0, y: 15 });
        otherTextElements.forEach(el => gsap.set(el, { autoAlpha: 0, y: 15 }));
      }
    
      // Réinitialiser les états
      animationStates.value['slide-20-mobile'] = 'elements-visible';
      animationStates.value['slide-20-animation-playing'] = false;
      animationStates.value['slide-20-animation-complete'] = false;
      animationStates.value['slide-20-overlay-shown'] = false;
      
      console.log('🔄 Reset slide-20 terminé, état:', animationStates.value['slide-20-mobile']);
    };

    // === ÉTAT INITIAL ===
    console.log('🚀 Initialisation slide-20, écran mobile:', isMobile());
    
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

    // Fonction pour afficher les éléments principaux automatiquement
    const showMainElements = () => {
      if (animationStates.value['slide-20-elements-shown']) return;
      
      animationStates.value['slide-20-elements-shown'] = true;
      animationStates.value['slide-20-mobile'] = 'elements-visible';
      
      // Animation d'apparition des éléments principaux (mode desktop adapté au mobile)
      const tl = gsap.timeline();
      
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
          stagger: 0.05,
          ease: "power2.out"
        }, "-=0.2");
      }
      
      // Afficher les autres éléments texte (mais pas #text-element-5)
      tl.to(otherTextElements, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out"
      }, "-=0.2");
    };

    // Animation FORWARD (swipe bas->haut) : Recouvrement #text-element-5 depuis le bas
    const triggerSlide20ForwardAnimation = () => {
      if (animationStates.value['slide-20-animation-playing']) return;
      
      animationStates.value['slide-20-animation-playing'] = true;
      animationStates.value['slide-20-mobile'] = 'animating-forward';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          animationStates.value['slide-20-mobile'] = 'complete';
          animationStates.value['slide-20-animation-playing'] = false;
          animationStates.value['slide-20-animation-complete'] = true;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log('Slide-20: Animation forward #text-element-5 terminée');
        }
      });

      // Glissement de #text-element-5 depuis le bas de l'écran pour recouvrir les autres éléments
      tl.to(textElement5, {
        y: 0, // Glisser vers la position finale
        duration: 0.8,
        ease: 'power2.out'
      });
    };

    // Animation REVERSE (swipe haut->bas) : Retour #text-element-5 vers le bas
    const triggerSlide20ReverseAnimation = () => {
      if (animationStates.value['slide-20-animation-playing']) return;
      
      animationStates.value['slide-20-animation-playing'] = true;
      animationStates.value['slide-20-mobile'] = 'animating-reverse';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const tl = gsap.timeline({
        onComplete: () => {
          animationStates.value['slide-20-mobile'] = 'elements-visible';
          animationStates.value['slide-20-animation-playing'] = false;
          animationStates.value['slide-20-animation-complete'] = false;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log('Slide-20: Animation reverse #text-element-5 terminée');
        }
      });

      // Glissement de #text-element-5 vers le bas de l'écran
      tl.to(textElement5, {
        y: '100vh', // Glisser complètement vers le bas
        duration: 0.6,
        ease: 'power2.in'
      });
    };

    // Fonction pour mettre les éléments à l'état final (visible)
    const setToFinalState = () => {
      // Appliquer les styles mobiles SEULEMENT si on est sur mobile
      if (isMobile()) {
        applyMobileStylesIfNeeded();
      }
      
      if (turtleBeach) gsap.set(turtleBeach, { scale: 1, autoAlpha: 1 });
      if (mzuH2Elements) gsap.set(mzuH2Elements, { autoAlpha: 1, y: 0 });
      otherTextElements.forEach(el => gsap.set(el, { autoAlpha: 1, y: 0 }));
      gsap.set(textElement5, { y: 0 });
      
      // Marquer comme complet
      animationStates.value['slide-20-mobile'] = 'complete';
      animationStates.value['slide-20-animation-complete'] = true;
      animationStates.value['slide-20-elements-shown'] = true;
    };

    // ScrollTrigger pour détecter quand la slide 20 est visible
    const st = ScrollTrigger.create({
      trigger: slide20Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      end: 'bottom top',
      onEnter: () => {
        console.log('📍 Slide 20 is now visible');
        
        // Animation automatique des éléments principaux à l'entrée (sauf sur mobile où ils sont déjà visibles)
        if (!isMobile() && !animationStates.value['slide-20-elements-shown']) {
          showMainElements();
        }
      },
      onLeave: () => {
        console.log('📍 Leaving slide 20 (going down)');
        // TOUJOURS réinitialiser quand on quitte
        resetToInitialState();
      },
      onEnterBack: () => {
        console.log('📍 Entering back slide 20');
        // TOUJOURS réinitialiser quand on revient
        resetToInitialState();
        // Petit délai pour que le reset soit effectif, puis rejouer l'animation
        if (!isMobile()) {
          setTimeout(() => {
            showMainElements();
          }, 50);
        }
      },
      onLeaveBack: () => {
        console.log('📍 Leaving slide 20 (going up)');
        // TOUJOURS réinitialiser quand on quitte vers le haut
        resetToInitialState();
      }
    });

    mobileScrollTriggers.push(st);
    slide20Section._triggerForwardAnimation = triggerSlide20ForwardAnimation;
    slide20Section._triggerReverseAnimation = triggerSlide20ReverseAnimation;
    slide20Section._resetToInitialState = resetToInitialState;
    slide20Section._showMainElements = showMainElements;
    slide20Section._setToFinalState = setToFinalState;
    slide20Section._applyMobileStylesIfNeeded = applyMobileStylesIfNeeded;
  };

  // Animation complète pour la slide 23 (Perdrix) - Transposition de l'animation desktop
  const registerMobileSlide23Animation = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    if (!slide23Section) return;

    // Chercher les éléments essentiels (même structure que desktop)
    const perdrixContainer = slide23Section.querySelector('#perdrix-container, #bygone-bip');
    const perdrixSlides = slide23Section.querySelectorAll('.perdrix-slide');
    const firstPerdrixSlide = slide23Section.querySelector('#perdrix-slide-1');
    // Structure : les image-containers sont dans .bdrs
    const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');

    if (!perdrixContainer || perdrixSlides.length === 0) {
      console.warn('❌ Éléments perdrix non trouvés dans slide-23');
      return;
    }

    console.log('🚀 Slide-23 Mobile Register:', {
      perdrixContainer: !!perdrixContainer,
      perdrixSlidesCount: perdrixSlides.length,
      imageContainersCount: imageContainers.length
    });

    // Variables pour le défilement perdrix mobile
    let perdrixScrollIndex = 0;
    let maxPerdrixScroll = 0;
    let isScrollingPerdrix = false;

    // Fonction pour vérifier si on est sur mobile
    const isMobile = () => {
      return window.innerWidth <= 1024;
    };

    // Fonction pour initialiser les limites de défilement
    const initializePerdrixScrollLimits = () => {
      const perdrixCount = perdrixSlides ? perdrixSlides.length : 0;
      const imageCount = imageContainers ? imageContainers.length : 0;
      maxPerdrixScroll = Math.max(perdrixCount, imageCount) - 1;
      console.log(`📊 Perdrix mobile limites: max = ${maxPerdrixScroll} (perdrix: ${perdrixCount}, images: ${imageCount})`);
    };

    // Fonction pour appliquer les styles mobiles spécifiques SEULEMENT sur mobile
    const applyMobileStylesIfNeeded = () => {
      if (!isMobile()) return; // Ne rien faire sur desktop
      
      console.log('🔧 Application des styles mobiles pour slide-23');
      
      // S'assurer que le conteneur perdrix est bien configuré
      if (perdrixContainer) {
        gsap.set(perdrixContainer, {
          position: 'relative',
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        });
      }
    };

    // Fonction pour réinitialiser les éléments à l'état initial
    const resetToInitialState = () => {
      console.log('🔄 Reset slide-23 mobile to initial state');
      
      // Nettoyer les animations GSAP précédentes
      gsap.killTweensOf([perdrixContainer, perdrixSlides, imageContainers]);
      
      if (isMobile()) {
        // Appliquer les styles mobiles
        applyMobileStylesIfNeeded();
      }
      
      // État initial du conteneur
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
            if (textContainer) gsap.set(textContainer, { y: 0, autoAlpha: 1 });
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
            gsap.set(container, { autoAlpha: 1, y: isMobile() ? '100vh' : '504px' });
          }
        });
      }
      
      // Réinitialiser les variables
      perdrixScrollIndex = 0;
      isScrollingPerdrix = false;
      animationStates.value['slide-23-mobile'] = 'initialized';
      animationStates.value['slide-23-animation-playing'] = false;
      animationStates.value['slide-23-current-index'] = 0;
      
      console.log('🔄 Reset slide-23 mobile terminé');
    };

    // === ÉTAT INITIAL ===
    console.log('🚀 Initialisation slide-23 mobile');
    
    if (isMobile()) {
      // Appliquer les styles de base immédiatement
      applyMobileStylesIfNeeded();
      
      // Petit délai pour que les styles CSS soient bien appliqués
      gsap.delayedCall(0.05, () => {
        resetToInitialState();
        initializePerdrixScrollLimits();
      });
    } else {
      resetToInitialState();
      initializePerdrixScrollLimits();
    }

    // Animation FORWARD (swipe bas->haut) : Défilement vers le slide perdrix suivant
    const triggerSlide23ForwardAnimation = () => {
      if (isScrollingPerdrix) return false;
      
      // Si on a atteint la fin, permettre la navigation vers la slide suivante
      if (perdrixScrollIndex >= maxPerdrixScroll) {
        console.log('🏁 Fin des slides perdrix atteinte');
        return false; // Indiquer qu'on peut passer à la slide suivante
      }
      
      isScrollingPerdrix = true;
      animationStates.value['slide-23-animation-playing'] = true;
      animationStates.value['slide-23-mobile'] = 'animating-forward';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const currentSlide = slide23Section.querySelector(`#perdrix-slide-${perdrixScrollIndex + 1}`);
      const nextSlide = slide23Section.querySelector(`#perdrix-slide-${perdrixScrollIndex + 2}`);
      const currentImageContainer = slide23Section.querySelector(`.bdrs #image-container-${perdrixScrollIndex + 1}`);
      const nextImageContainer = slide23Section.querySelector(`.bdrs #image-container-${perdrixScrollIndex + 2}`);
      
      console.log(`📱 Défilement perdrix mobile avant: ${perdrixScrollIndex} -> ${perdrixScrollIndex + 1}`);

      const tl = gsap.timeline({
        onComplete: () => {
          perdrixScrollIndex++;
          animationStates.value['slide-23-current-index'] = perdrixScrollIndex;
          animationStates.value['slide-23-mobile'] = 'slide-visible';
          animationStates.value['slide-23-animation-playing'] = false;
          isScrollingPerdrix = false;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log(`✅ Défilement mobile terminé - nouvel index: ${perdrixScrollIndex}`);
        }
      });

      // Animation des perdrix-slides (même logique que desktop)
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
            duration: 0.6, // Un peu plus lent sur mobile
            ease: 'power3.easeInOut'
          }, 0);
        }
        
        if (nextTextContainer) {
          tl.to(nextTextContainer, {
            y: 0,
            autoAlpha: 1,
            duration: 0.6,
            ease: 'power3.easeInOut'
          }, 0);
        }
        
        // Masquer le slide actuel après l'animation
        tl.to(currentSlide, {
          autoAlpha: 1,
          duration: 0.1,
          ease: 'power3.out'
        }, 0.6);
      }

      // Animation synchronisée des image-containers (adaptée pour mobile)
      if (currentImageContainer && nextImageContainer) {
        // Préparer le container suivant
        gsap.set(nextImageContainer, { autoAlpha: 1, y: isMobile() ? '100vh' : '504px' });
        
        // Animation simultanée des image-containers
        tl.to(currentImageContainer, {
          y: isMobile() ? '-100vh' : '-504px',
          duration: 0.6,
          ease: 'power3.easeInOut'
        }, 0);
        
        tl.to(nextImageContainer, {
          y: 0,
          duration: 0.6,
          ease: 'power3.easeInOut'
        }, 0);
      }

      return true; // Indiquer que l'animation a été lancée
    };

    // Animation REVERSE (swipe haut->bas) : Défilement vers le slide perdrix précédent
    const triggerSlide23ReverseAnimation = () => {
      if (isScrollingPerdrix || perdrixScrollIndex <= 0) return false;
      
      isScrollingPerdrix = true;
      animationStates.value['slide-23-animation-playing'] = true;
      animationStates.value['slide-23-mobile'] = 'animating-reverse';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const currentSlide = slide23Section.querySelector(`#perdrix-slide-${perdrixScrollIndex + 1}`);
      const prevSlide = slide23Section.querySelector(`#perdrix-slide-${perdrixScrollIndex}`);
      const currentImageContainer = slide23Section.querySelector(`.bdrs #image-container-${perdrixScrollIndex + 1}`);
      const prevImageContainer = slide23Section.querySelector(`.bdrs #image-container-${perdrixScrollIndex}`);
      
      console.log(`📱 Défilement perdrix mobile arrière: ${perdrixScrollIndex} -> ${perdrixScrollIndex - 1}`);

      const tl = gsap.timeline({
        onComplete: () => {
          perdrixScrollIndex--;
          animationStates.value['slide-23-current-index'] = perdrixScrollIndex;
          animationStates.value['slide-23-mobile'] = 'slide-visible';
          animationStates.value['slide-23-animation-playing'] = false;
          isScrollingPerdrix = false;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log(`✅ Défilement mobile arrière terminé - nouvel index: ${perdrixScrollIndex}`);
        }
      });

      // Animation des perdrix-slides (même logique que desktop)
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
            duration: 0.6,
            ease: 'power3.easeInOut'
          }, 0);
        }
        
        if (prevTextContainer) {
          tl.to(prevTextContainer, {
            y: 0,
            autoAlpha: 1,
            duration: 0.6,
            ease: 'power3.easeInOut'
          }, 0);
        }
        
        // Masquer le slide actuel après l'animation
        tl.to(currentSlide, {
          autoAlpha: 0,
          duration: 0.1,
          ease: 'power3.out'
        }, 0.6);
      }

      // Animation synchronisée des image-containers (adaptée pour mobile)
      if (currentImageContainer && prevImageContainer) {
        // Préparer le container précédent
        gsap.set(prevImageContainer, { autoAlpha: 1, y: isMobile() ? '-100vh' : '-504px' });
        
        // Animation simultanée des image-containers
        tl.to(currentImageContainer, {
          y: isMobile() ? '100vh' : '504px',
          duration: 0.6,
          ease: 'power3.easeInOut'
        }, 0);
        
        tl.to(prevImageContainer, {
          y: 0,
          duration: 0.6,
          ease: 'power3.easeInOut'
        }, 0);
      }

      return true; // Indiquer que l'animation a été lancée
    };

    // Fonction pour mettre les éléments à l'état final
    const setToFinalState = () => {
      // Aller au dernier slide
      perdrixScrollIndex = maxPerdrixScroll;
      
      // Afficher le dernier slide et masquer les autres
      perdrixSlides.forEach((slide, index) => {
        const textContainer = slide.querySelector('.text-container');
        
        if (index === maxPerdrixScroll) {
          gsap.set(slide, { autoAlpha: 1 });
          if (textContainer) gsap.set(textContainer, { y: 0, autoAlpha: 1 });
        } else {
          gsap.set(slide, { autoAlpha: 0 });
          if (textContainer) gsap.set(textContainer, { y: '100vh', autoAlpha: 0 });
        }
      });

      // Afficher le dernier image-container
      if (imageContainers.length > 0) {
        imageContainers.forEach((container, index) => {
          if (index === maxPerdrixScroll) {
            gsap.set(container, { autoAlpha: 1, y: 0 });
          } else {
            gsap.set(container, { autoAlpha: 1, y: isMobile() ? '100vh' : '504px' });
          }
        });
      }
      
      animationStates.value['slide-23-mobile'] = 'complete';
      animationStates.value['slide-23-current-index'] = maxPerdrixScroll;
    };

    // ScrollTrigger pour détecter quand la slide 23 est visible
    const st = ScrollTrigger.create({
      trigger: slide23Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      end: 'bottom top',
      onEnter: () => {
        console.log('📍 Slide 23 mobile is now visible');
        // Réinitialiser à l'état initial à l'entrée
        resetToInitialState();
        initializePerdrixScrollLimits();
      },
      onLeave: () => {
        console.log('📍 Leaving slide 23 mobile (going down)');
        // Maintenir l'état en quittant
      },
      onEnterBack: () => {
        console.log('📍 Entering back slide 23 mobile');
        // Réinitialiser à l'état initial au retour
        resetToInitialState();
        initializePerdrixScrollLimits();
      },
      onLeaveBack: () => {
        console.log('📍 Leaving slide 23 mobile (going up)');
        // Réinitialiser quand on quitte vers le haut
        resetToInitialState();
      }
    });

    mobileScrollTriggers.push(st);
    slide23Section._triggerForwardAnimation = triggerSlide23ForwardAnimation;
    slide23Section._triggerReverseAnimation = triggerSlide23ReverseAnimation;
    slide23Section._resetToInitialState = resetToInitialState;
    slide23Section._setToFinalState = setToFinalState;
    slide23Section._initializePerdrixScrollLimits = initializePerdrixScrollLimits;
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
          
          // GESTION SPÉCIALE POUR SLIDE-21 - ANIMATION BIDIRECTIONNELLE
          if (currentSection && currentSection.id === 'slide-21') {
            
            // Si #thoiathoing est visible mais #doctornek n'a jamais été montré, déclencher l'animation forward
            if (animationStates.value['slide-21-mobile'] === 'thoiathoing-visible') {
              if (currentSection._triggerForwardAnimation) {
                currentSection._triggerForwardAnimation();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-21-animation-playing']) {
              return;
            }
          }
          
          // GESTION SPÉCIALE POUR SLIDE-20 - ANIMATION BIDIRECTIONNELLE
          if (currentSection && currentSection.id === 'slide-20') {
            
            // Si les éléments principaux sont visibles mais #text-element-5 n'a jamais été montré, déclencher l'animation forward
            if (animationStates.value['slide-20-mobile'] === 'elements-visible') {
              if (currentSection._triggerForwardAnimation) {
                currentSection._triggerForwardAnimation();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-20-animation-playing']) {
              return;
            }
          }
          
          // GESTION SPÉCIALE POUR SLIDE-23 - ANIMATION BIDIRECTIONNELLE PERDRIX
          if (currentSection && currentSection.id === 'slide-23') {
            
            // Si on est dans les slides perdrix, gérer le défilement interne
            if (animationStates.value['slide-23-mobile'] === 'initialized' || 
                animationStates.value['slide-23-mobile'] === 'slide-visible') {
              
              // Swipe vers le haut : slide perdrix suivant
              if (currentSection._triggerForwardAnimation) {
                const animationLaunched = currentSection._triggerForwardAnimation();
                if (animationLaunched) {
                  return; // Bloquer la navigation normale
                }
                // Si l'animation n'a pas été lancée (fin des slides), continuer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-23-animation-playing']) {
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

          // GESTION SPÉCIALE POUR SLIDE-21 - ANIMATION REVERSE
          if (currentSection && currentSection.id === 'slide-21') {
            
            // Si l'animation est complète, déclencher l'animation reverse
            if (animationStates.value['slide-21-mobile'] === 'complete') {
              if (currentSection._triggerReverseAnimation) {
                currentSection._triggerReverseAnimation();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-21-animation-playing']) {
              return;
            }
          }

          // GESTION SPÉCIALE POUR SLIDE-20 - ANIMATION REVERSE
          if (currentSection && currentSection.id === 'slide-20') {
            
            // Si l'animation est complète, déclencher l'animation reverse
            if (animationStates.value['slide-20-mobile'] === 'complete') {
              if (currentSection._triggerReverseAnimation) {
                currentSection._triggerReverseAnimation();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-20-animation-playing']) {
              return;
            }
          }
          
          // GESTION SPÉCIALE POUR SLIDE-23 - ANIMATION REVERSE PERDRIX
          if (currentSection && currentSection.id === 'slide-23') {
            
            // Si on est dans les slides perdrix, gérer le défilement interne
            if (animationStates.value['slide-23-mobile'] === 'initialized' || 
                animationStates.value['slide-23-mobile'] === 'slide-visible') {
              
              // Swipe vers le bas : slide perdrix précédent
              if (currentSection._triggerReverseAnimation) {
                const animationLaunched = currentSection._triggerReverseAnimation();
                if (animationLaunched) {
                  return; // Bloquer la navigation normale
                }
                // Si l'animation n'a pas été lancée (début des slides), continuer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-23-animation-playing']) {
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
      registerMobileSlide22Animation();
      
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

  // Fonction de debug pour tester les animations slide-73
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

  // Fonction de debug pour tester les animations slide-21
  const debugSlide21Animation = () => {
    const slide21Section = sections.value.find(s => s.id === 'slide-21');
    if (!slide21Section) {
      console.log('❌ Section slide-21 non trouvée');
      return;
    }
    
    console.log('🔍 DEBUG Slide-21:');
    console.log('- Section trouvée:', !!slide21Section);
    console.log('- isMobile:', window.innerWidth <= 1024);
    console.log('- État actuel:', animationStates.value['slide-21-mobile']);
    console.log('- Animation en cours:', animationStates.value['slide-21-animation-playing']);
    console.log('- #thoiathoing montré:', animationStates.value['slide-21-thoiathoing-shown']);
    console.log('- Animation complète:', animationStates.value['slide-21-animation-complete']);
    
    const doctornekDiv = slide21Section.querySelector('#doctornek');
    const mshillDiv = slide21Section.querySelector('#mshill');
    if (doctornekDiv) {
      const computedStyle = window.getComputedStyle(doctornekDiv);
      console.log('- #doctornek Position CSS:', computedStyle.position);
      console.log('- #doctornek Transform CSS:', computedStyle.transform);
      console.log('- #doctornek Opacity CSS:', computedStyle.opacity);
    }
    if (mshillDiv) {
      const computedStyle = window.getComputedStyle(mshillDiv);
      console.log('- #mshill Opacity CSS:', computedStyle.opacity);
    }
    
    // Tester l'animation forward
    console.log('🎬 Test animation forward dans 2 secondes...');
    setTimeout(() => {
      if (slide21Section._triggerForwardAnimation) {
        slide21Section._triggerForwardAnimation();
      }
    }, 2000);
  };

  // Fonction de debug pour tester les animations slide-20
  const debugSlide20Animation = () => {
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    if (!slide20Section) {
      console.log('❌ Section slide-20 non trouvée');
      return;
    }
    
    console.log('🔍 DEBUG Slide-20:');
    console.log('- Section trouvée:', !!slide20Section);
    console.log('- isMobile:', window.innerWidth <= 1024);
    console.log('- État actuel:', animationStates.value['slide-20-mobile']);
    console.log('- Animation en cours:', animationStates.value['slide-20-animation-playing']);
    console.log('- Éléments montrés:', animationStates.value['slide-20-elements-shown']);
    console.log('- Animation complète:', animationStates.value['slide-20-animation-complete']);
    
    const textElement5 = slide20Section.querySelector('#text-element-5');
    const turtleBeach = slide20Section.querySelector('#turtlebeach');
    if (textElement5) {
      const computedStyle = window.getComputedStyle(textElement5);
      console.log('- #text-element-5 Position CSS:', computedStyle.position);
      console.log('- #text-element-5 Transform CSS:', computedStyle.transform);
      console.log('- #text-element-5 Opacity CSS:', computedStyle.opacity);
    }
    if (turtleBeach) {
      const computedStyle = window.getComputedStyle(turtleBeach);
      console.log('- #turtlebeach Opacity CSS:', computedStyle.opacity);
    }
    
    // Tester l'animation forward
    console.log('🎬 Test animation forward dans 2 secondes...');
    setTimeout(() => {
      if (slide20Section._triggerForwardAnimation) {
        slide20Section._triggerForwardAnimation();
      }
    }, 2000);
  };

  // Fonction de debug pour tester les animations slide-23
  const debugSlide23Animation = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    if (!slide23Section) {
      console.log('❌ Section slide-23 non trouvée');
      return;
    }
    
    console.log('🔍 DEBUG Slide-23:');
    console.log('- Section trouvée:', !!slide23Section);
    console.log('- isMobile:', window.innerWidth <= 1024);
    console.log('- État actuel:', animationStates.value['slide-23-mobile']);
    console.log('- Animation en cours:', animationStates.value['slide-23-animation-playing']);
    console.log('- Index actuel:', animationStates.value['slide-23-current-index']);
    
    const perdrixContainer = slide23Section.querySelector('#perdrix-container, #bygone-bip');
    const perdrixSlides = slide23Section.querySelectorAll('.perdrix-slide');
    const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
    
    console.log('- Perdrix container:', !!perdrixContainer);
    console.log('- Perdrix slides count:', perdrixSlides.length);
    console.log('- Image containers count:', imageContainers.length);
    
    if (perdrixContainer) {
      const computedStyle = window.getComputedStyle(perdrixContainer);
      console.log('- Container Opacity CSS:', computedStyle.opacity);
    }
    
    // Tester l'animation forward
    console.log('🎬 Test animation forward dans 2 secondes...');
    setTimeout(() => {
      if (slide23Section._triggerForwardAnimation) {
        const result = slide23Section._triggerForwardAnimation();
        console.log('Animation forward result:', result);
      }
    }, 2000);
  };

  // Exposer les fonctions pour le debug
  window.resetSlide73State = resetSlide73State;
  window.setSlide73ToFinalState = setSlide73ToFinalState;
  window.debugSlide73Animation = debugSlide73Animation;
  window.debugSlide21Animation = debugSlide21Animation;
  window.debugSlide20Animation = debugSlide20Animation;
  window.debugSlide23Animation = debugSlide23Animation;

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
