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
      
      // FORCER complètement les styles mobiles pour .points-fort
      gsap.set(pointsFortDiv, {
        position: 'relative',
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
        // IMPORTANT: Forcer x à 0 et supprimer tout transform horizontal
        x: 0,
        clearProps: 'transform' // Supprimer tout transform CSS existant
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
        
        // ÉTAPE 2: SUPPRIMER COMPLÈTEMENT tout transform CSS existant qui pourrait venir de la droite
        pointsFortDiv.style.transform = '';
        pointsFortDiv.style.webkitTransform = '';
        pointsFortDiv.style.cssText = pointsFortDiv.style.cssText.replace(/transform[^;]*;?/g, '');
        
        // ÉTAPE 3: Appliquer les styles mobiles de base IMMÉDIATEMENT
        applyMobileStylesIfNeeded();
        
        // ÉTAPE 4: Définir la position initiale AVEC FORCE - VIENT DU BAS UNIQUEMENT
        gsap.set(pointsFortDiv, { 
          y: '100vh', // OBLIGATOIREMENT du BAS - pas de la droite!
          x: 0,       // AUCUN décalage horizontal
          scale: 1,
          autoAlpha: 1, // Visible mais hors écran
          // Forcer l'effacement de tout transform précédent
          rotation: 0,  // S'assurer qu'il n'y a pas de rotation
          skewX: 0,     // S'assurer qu'il n'y a pas de skew
          skewY: 0
        });
        
        console.log('✅ Slide-73 position initiale FORCÉE: y=100vh (DEPUIS LE BAS UNIQUEMENT)');
        
        // Vérification de debug IMMÉDIATE
        nextTick(() => {
          const yPos = gsap.getProperty(pointsFortDiv, 'y');
          const xPos = gsap.getProperty(pointsFortDiv, 'x');
          const transform = window.getComputedStyle(pointsFortDiv).transform;
          console.log('🔍 Vérification IMMÉDIATE position après set: y=' + yPos + ', x=' + xPos);
          console.log('🔍 Transform CSS après set:', transform);
          
          // Si la position n'est pas correcte, forcer à nouveau
          if (yPos !== '100vh' && yPos !== window.innerHeight) {
            console.log('⚠️ Position incorrecte détectée, forçage supplémentaire...');
            gsap.set(pointsFortDiv, { 
              y: window.innerHeight, // Utiliser la valeur pixel directement
              x: 0,
              force3D: true // Forcer l'utilisation de transform3d
            });
          }
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
      // STEP 1: Nettoyer tout transform CSS existant IMMÉDIATEMENT
      pointsFortDiv.style.transform = '';
      pointsFortDiv.style.webkitTransform = '';
      pointsFortDiv.style.cssText = pointsFortDiv.style.cssText.replace(/transform[^;]*;?/g, '');
      
      // STEP 2: Appliquer les styles de base immédiatement
      applyMobileStylesIfNeeded();
      
      // STEP 3: Reset IMMÉDIAT avec position forcée du BAS - PAS DE DÉLAI
      resetToInitialState();
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

    // Corriger la sélection des éléments selon la vraie structure HTML
    const thoiathoingDiv = slide21Section.querySelector('#thoiathoing'); // Le conteneur principal
    const mshillDiv = slide21Section.querySelector('#mshill'); // Le h3 titre
    const doctornekDiv = slide21Section.querySelector('#doctornek'); // Le div.row avec les paragraphes
    
    if (!thoiathoingDiv || !mshillDiv || !doctornekDiv) {
      console.warn('❌ Éléments #thoiathoing, #mshill ou #doctornek non trouvés dans slide-21');
      return;
    }

    console.log('🚀 Slide-21 structure trouvée:', {
      thoiathoing: !!thoiathoingDiv,
      mshill: !!mshillDiv,
      doctornek: !!doctornekDiv
    });

    // Fonction pour vérifier si on est sur mobile
    const isMobile = () => {
      return window.innerWidth <= 1024;
    };

    // Fonction pour appliquer les styles mobiles spécifiques SEULEMENT sur mobile
    const applyMobileStylesIfNeeded = () => {
      if (!isMobile()) return; // Ne rien faire sur desktop
      
      console.log('🔧 Application des styles mobiles pour slide-21');
      
      // S'assurer que #thoiathoing (conteneur principal) est bien configuré
      gsap.set(thoiathoingDiv, {
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden' // Important pour masquer doctornek quand il est hors écran
      });

      // Configurer #doctornek pour le recouvrement (overlay complet)
      gsap.set(doctornekDiv, {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        backgroundColor: 'rgba(0, 0, 0, 0.9)', // Fond sombre pour l'overlay
        // Supprimer right, bottom qui peuvent créer des conflits avec width/height
        clearProps: 'right,bottom,transform'
      });

      // #mshill reste normal (c'est juste un h3 titre)
      // Pas besoin de modifier ses styles
    };

    // Fonction pour réinitialiser les éléments à l'état initial
    const resetToInitialState = () => {
      console.log('🔄 Reset slide-21 to initial state, isMobile:', isMobile());
      
      if (isMobile()) {
        // Nettoyer les animations GSAP précédentes
        gsap.killTweensOf([thoiathoingDiv, mshillDiv, doctornekDiv]);
        
        // SUPPRIMER tout transform CSS existant pour #doctornek
        doctornekDiv.style.transform = '';
        doctornekDiv.style.webkitTransform = '';
        doctornekDiv.style.cssText = doctornekDiv.style.cssText.replace(/transform[^;]*;?/g, '');
        
        // Appliquer les styles mobiles AVANT de définir la position
        applyMobileStylesIfNeeded();
        
        // État initial mobile : #doctornek caché COMPLÈTEMENT hors écran en bas
        gsap.set(doctornekDiv, { 
          y: '100vh', // Commence hors écran en bas
          x: 0,
          scale: 1,
          autoAlpha: 1, // Visible mais positionné hors écran
          zIndex: 10,   // S'assurer qu'il est au-dessus
          force3D: true // Forcer l'utilisation de transform3d
        });
        console.log('✅ Slide-21 #doctornek position initiale FORCÉE: y=100vh (complètement caché en bas)');
        
        // Vérification IMMÉDIATE de la position
        nextTick(() => {
          const yPos = gsap.getProperty(doctornekDiv, 'y');
          const xPos = gsap.getProperty(doctornekDiv, 'x');
          const zIndex = gsap.getProperty(doctornekDiv, 'zIndex');
          const transform = window.getComputedStyle(doctornekDiv).transform;
          console.log('🔍 Vérification #doctornek: y=' + yPos + ', x=' + xPos + ', zIndex=' + zIndex);
          console.log('🔍 Transform CSS #doctornek:', transform);
          
          // Si la position n'est pas correcte, forcer à nouveau
          if (yPos !== '100vh' && yPos !== window.innerHeight) {
            console.log('⚠️ Position #doctornek incorrecte, forçage supplémentaire...');
            gsap.set(doctornekDiv, { 
              y: window.innerHeight, // Utiliser la valeur pixel directement
              x: 0,
              zIndex: 10,
              force3D: true
            });
          }
        });
        
        // #thoiathoing (conteneur principal) caché initialement pour l'animation d'entrée
        gsap.set(thoiathoingDiv, { autoAlpha: 0, y: 50 });
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
      // STEP 1: Nettoyer tout transform CSS existant IMMÉDIATEMENT pour #doctornek
      doctornekDiv.style.transform = '';
      doctornekDiv.style.webkitTransform = '';
      doctornekDiv.style.cssText = doctornekDiv.style.cssText.replace(/transform[^;]*;?/g, '');
      
      // STEP 2: Appliquer les styles de base immédiatement
      applyMobileStylesIfNeeded();
      
      // STEP 3: Reset IMMÉDIAT - PAS DE DÉLAI
      resetToInitialState();
    } else {
      resetToInitialState();
    }

    // Animation FORWARD (swipe bas->haut) : Recouvrement #doctornek depuis le bas
    const triggerSlide21ForwardAnimation = () => {
      if (animationStates.value['slide-21-animation-playing']) return;
      
      animationStates.value['slide-21-animation-playing'] = true;
      animationStates.value['slide-21-mobile'] = 'animating-forward';

      console.log('🎬 Démarrage animation #doctornek - recouvrement depuis le bas');

      // BLOCAGE COMPLET des interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.pointerEvents = 'none'; // Bloquer TOUS les événements pointeur
      
      // Bloquer aussi le scroll sur le conteneur principal
      const scrollContainer = document.querySelector(SCROLLER_SELECTOR);
      if (scrollContainer) {
        scrollContainer.style.overflow = 'hidden';
        scrollContainer.style.touchAction = 'none';
        scrollContainer.style.pointerEvents = 'none';
      }

      const tl = gsap.timeline({
        onComplete: () => {
          animationStates.value['slide-21-mobile'] = 'complete';
          animationStates.value['slide-21-animation-playing'] = false;
          animationStates.value['slide-21-animation-complete'] = true;
          
          // Réactiver TOUTES les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          document.body.style.pointerEvents = '';
          
          if (scrollContainer) {
            scrollContainer.style.overflow = '';
            scrollContainer.style.touchAction = '';
            scrollContainer.style.pointerEvents = '';
          }
          
          console.log('✅ Slide-21: Animation forward #doctornek terminée - recouvrement complet');
        }
      });

      // Glissement de #doctornek depuis le bas de l'écran pour recouvrir COMPLÈTEMENT #thoiathoing
      tl.to(doctornekDiv, {
        y: 0, // Glisser vers la position finale (recouvrement complet)
        duration: 0.8,
        ease: 'power2.out',
        force3D: true, // Optimiser les performances
        onStart: () => {
          console.log('🚀 #doctornek glisse du bas vers le haut pour recouvrir la slide');
        },
        onComplete: () => {
          console.log('✅ #doctornek maintenant en position de recouvrement complet');
        }
      });
    };

    // Animation REVERSE (swipe haut->bas) : Retour #doctornek vers le bas
    const triggerSlide21ReverseAnimation = () => {
      if (animationStates.value['slide-21-animation-playing']) return;
      
      animationStates.value['slide-21-animation-playing'] = true;
      animationStates.value['slide-21-mobile'] = 'animating-reverse';

      console.log('🎬 Démarrage animation reverse #doctornek - retour vers le bas');

      // BLOCAGE COMPLET des interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.pointerEvents = 'none'; // Bloquer TOUS les événements pointeur
      
      // Bloquer aussi le scroll sur le conteneur principal
      const scrollContainer = document.querySelector(SCROLLER_SELECTOR);
      if (scrollContainer) {
        scrollContainer.style.overflow = 'hidden';
        scrollContainer.style.touchAction = 'none';
        scrollContainer.style.pointerEvents = 'none';
      }

      const tl = gsap.timeline({
        onComplete: () => {
          animationStates.value['slide-21-mobile'] = 'thoiathoing-visible';
          animationStates.value['slide-21-animation-playing'] = false;
          animationStates.value['slide-21-animation-complete'] = false;
          
          // Réactiver TOUTES les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          document.body.style.pointerEvents = '';
          
          if (scrollContainer) {
            scrollContainer.style.overflow = '';
            scrollContainer.style.touchAction = '';
            scrollContainer.style.pointerEvents = '';
          }
          
          console.log('✅ Slide-21: Animation reverse #doctornek terminée - retour en bas');
        }
      });

      // Glissement de #doctornek vers le bas de l'écran (sortie complète)
      tl.to(doctornekDiv, {
        y: '100vh', // Glisser complètement vers le bas (hors écran)
        duration: 0.6,
        ease: 'power2.in',
        force3D: true, // Optimiser les performances
        onStart: () => {
          console.log('🚀 #doctornek glisse vers le bas pour libérer la slide');
        },
        onComplete: () => {
          console.log('✅ #doctornek maintenant caché en bas, slide libérée');
        }
      });
    };

    // Fonction pour faire apparaître #thoiathoing (#mshill) automatiquement
    const showThoiathoing = () => {
      if (animationStates.value['slide-21-thoiathoing-shown']) return;
      
      animationStates.value['slide-21-thoiathoing-shown'] = true;
      animationStates.value['slide-21-mobile'] = 'thoiathoing-visible';
      
      // Animation d'apparition de #thoiathoing
      gsap.to(thoiathoingDiv, {
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
      
      gsap.set(thoiathoingDiv, { autoAlpha: 1, y: 0 });
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
        
        // État initial mobile : #text-element-5 caché, invisible mais en position
        gsap.set(textElement5, { 
          autoAlpha: 0, // Commence invisible
          y: 0,         // À sa position finale (pas hors écran)
          x: 0,
          scale: 0.95   // Légèrement réduit pour l'effet de fadeIn
        });
        
        // Autres éléments à l'état initial caché pour l'animation
        if (turtleBeach) gsap.set(turtleBeach, { scale: 0.8, autoAlpha: 0 });
        if (mzuH2Elements) gsap.set(mzuH2Elements, { autoAlpha: 0, y: 15 });
        otherTextElements.forEach(el => gsap.set(el, { autoAlpha: 0, y: 15 }));
      } else {
        // Desktop - états par défaut
    if (turtleBeach) gsap.set(turtleBeach, { scale: 0.8, autoAlpha: 1 });
    if (mzuH2Elements) gsap.set(mzuH2Elements, { autoAlpha: 0, y: 15 });
        gsap.set(textElement5, { autoAlpha: 0, y: 15 });
        otherTextElements.forEach(el => gsap.set(el, { autoAlpha: 0, y: 15 }));
      }
    
      // Réinitialiser les états
      animationStates.value['slide-20-mobile'] = 'hidden'; // État initial : éléments cachés
      animationStates.value['slide-20-animation-playing'] = false;
      animationStates.value['slide-20-animation-complete'] = false;
      animationStates.value['slide-20-elements-shown'] = false;
      animationStates.value['slide-20-elements-animation-complete'] = false; // Nouvel état
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
      animationStates.value['slide-20-mobile'] = 'animating-elements'; // État pendant l'animation des éléments
      
      // Animation d'apparition des éléments principaux un par un avec plus de délai
        const tl = gsap.timeline({
          onComplete: () => {
          // Marquer que l'animation des éléments principaux est terminée
          animationStates.value['slide-20-mobile'] = 'elements-visible';
          animationStates.value['slide-20-elements-animation-complete'] = true;
          console.log('Slide-20: Animation des éléments principaux terminée - swipe autorisé pour text-element-5');
          }
        });
        
      // 1. D'abord #turtlebeach avec scale et autoAlpha
        if (turtleBeach) {
          tl.to(turtleBeach, {
            scale: 1,
          autoAlpha: 1,
          duration: 0.8,
            ease: "power2.out"
          });
        }
        
      // 2. Puis les éléments h2 de #mzu un par un avec plus de délai
        if (mzuH2Elements && mzuH2Elements.length) {
          tl.to(mzuH2Elements, {
            autoAlpha: 1,
            y: 0,
          duration: 0.6,
          stagger: 0.2, // Plus de délai entre chaque élément h2
            ease: "power2.out"
        }, "-=0.3");
        }
        
      // 3. Enfin les autres éléments texte un par un (mais pas #text-element-5)
      if (otherTextElements && otherTextElements.length) {
        tl.to(otherTextElements, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15, // Délai entre chaque text-element
          ease: "power2.out"
        }, "-=0.2");
      }
    };

    // Animation FORWARD (swipe bas->haut) : FadeIn rapide de #text-element-5
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
          
          console.log('Slide-20: Animation forward #text-element-5 terminée (fadeIn rapide)');
        }
      });

      // FadeIn rapide de #text-element-5 au lieu du slide
      tl.fromTo(textElement5, {
        autoAlpha: 0, // Démarrer complètement invisible
        scale: 0.95,  // Légère échelle réduite pour un effet subtil
        y: 0         // Pas de décalage vertical
      }, {
        autoAlpha: 1, // Apparition complète
        scale: 1,     // Retour à l'échelle normale
        y: 0,         // Position finale normale
        duration: 0.4, // Animation rapide (au lieu de 0.8)
        ease: 'power2.out'
      });
    };

    // Animation REVERSE (swipe haut->bas) : FadeOut rapide de #text-element-5
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
          
          console.log('Slide-20: Animation reverse #text-element-5 terminée (fadeOut rapide)');
        }
      });

      // FadeOut rapide de #text-element-5 au lieu du slide vers le bas
      tl.to(textElement5, {
        autoAlpha: 0, // Disparition complète
        scale: 0.95,  // Légère réduction d'échelle
        y: 0,         // Reste à sa position
        duration: 0.3, // Animation très rapide
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
      gsap.set(textElement5, { autoAlpha: 1, y: 0, scale: 1 }); // Visible, position normale, échelle normale
      
      // Marquer comme complet
      animationStates.value['slide-20-mobile'] = 'complete';
      animationStates.value['slide-20-animation-complete'] = true;
      animationStates.value['slide-20-elements-shown'] = true;
      animationStates.value['slide-20-elements-animation-complete'] = true; // Nouvel état
    };

    // ScrollTrigger pour détecter quand la slide 20 est visible
    const st = ScrollTrigger.create({
      trigger: slide20Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      end: 'bottom top',
      onEnter: () => {
        console.log('📍 Slide 20 is now visible');
        
        // Animation automatique des éléments principaux à l'entrée (sur mobile ET desktop)
        if (!animationStates.value['slide-20-elements-shown']) {
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
        setTimeout(() => {
          showMainElements();
        }, 50);
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
      
      // Configurer la div .bdrs pour le défilement vertical des image-containers
      const bdrsDiv = slide23Section.querySelector('.bdrs');
      if (bdrsDiv) {
        gsap.set(bdrsDiv, {
          position: 'relative',
          width: '100%',
          height: '100vh',
          overflow: 'hidden', // Masquer les containers qui dépassent
          display: 'block'
        });
        console.log('📱 Div .bdrs configurée pour défilement vertical mobile');
      }
      
      // Supprimer toutes les marges des image-containers pour qu'ils soient parfaitement collés
      if (imageContainers.length > 0) {
        imageContainers.forEach((container, index) => {
          gsap.set(container, {
            margin: 0,
            padding: 0,
            border: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            display: 'block',
            lineHeight: 0, // Supprimer l'espacement de ligne
            fontSize: 0 // Supprimer l'espacement des caractères
          });
        });
        console.log('📱 Marges des image-containers supprimées');
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

      // Initialiser tous les image-containers avec positionnement vertical mobile
      if (imageContainers.length > 0) {
        imageContainers.forEach((container, index) => {
          if (isMobile()) {
            // Sur mobile : empilage vertical avec espacement de 332px
            // Premier container à y: 0, deuxième à y: 332px, troisième à y: 664px, etc.
            const yPosition = index * 332;
            gsap.set(container, { 
              autoAlpha: 1, 
              y: yPosition,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              // Supprimer toutes les marges pour éviter les espaces
              margin: 0,
              padding: 0,
              border: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              display: 'block',
              lineHeight: 0,
              fontSize: 0
            });
            console.log(`📱 Image-container ${index + 1} positionné à y: ${yPosition}px (sans marges)`);
          } else {
            // Desktop : logique originale
            if (index === 0) {
              gsap.set(container, { autoAlpha: 1, y: 0 });
            } else {
              gsap.set(container, { autoAlpha: 1, y: '504px' });
            }
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

      // Animation des perdrix-slides avec style tc_digital_content mobile
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
            y: '-50px', // Slide up légèrement
            duration: 0.3, // Vitesse normale
            ease: 'power3.easeInOut'
          }, 0);
          // Fade out simultané
          tl.to(currentTextContainer, {
            autoAlpha: 0,
            duration: 0.3, // Vitesse normale
            ease: 'power3.easeInOut'
          }, 0);
        }
        
        // ENTRÉE : Slide up SANS fade (reste visible) - PLUS RAPIDE
        if (nextTextContainer) {
          // Seulement translation - PAS de fade - PLUS RAPIDE
          tl.to(nextTextContainer, {
            y: 0, // Slide vers position finale
            duration: 0.2, // Plus rapide que l'élément sortant
            ease: 'power3.easeInOut'
          }, "+=0");
          // Pas d'animation de fade - l'élément reste à autoAlpha: 1
        }
        
        // Masquer le slide actuel après l'animation
        tl.to(currentSlide, {
          autoAlpha: 1,
          duration: 0.1,
          ease: 'power3.out'
        }, 0.6);
      }

      // Animation synchronisée des image-containers (défilement vertical mobile)
      if (currentImageContainer && nextImageContainer) {
        if (isMobile()) {
          // Sur mobile : défilement vertical de 332px vers le haut
          // Tous les containers remontent de 332px
          imageContainers.forEach((container) => {
            tl.to(container, {
              y: `-=332`, // Remonter de 332px
              duration: 0.6,
              ease: 'power3.easeInOut'
            }, 0);
          });
        } else {
          // Desktop : logique originale
          // Préparer le container suivant
          gsap.set(nextImageContainer, { autoAlpha: 1, y: '504px' });
          
          // Animation simultanée des image-containers
          tl.to(currentImageContainer, {
            y: '-504px',
            duration: 0.6,
            ease: 'power3.easeInOut'
          }, 0);
          
          tl.to(nextImageContainer, {
            y: 0,
            duration: 0.6,
            ease: 'power3.easeInOut'
          }, 0);
        }
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

      // Animation des perdrix-slides (selon brief client)
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
            ease: 'power3.easeInOut'
          }, 0);
          // Fade out simultané
          tl.to(currentTextContainer, {
            autoAlpha: 0,
            duration: 0.2, // Plus rapide que l'élément entrant
            ease: 'power3.easeInOut'
          }, 0);
        }
        
        // ENTRÉE : Slide down AVEC fadeIn - PLUS LENT
        if (prevTextContainer) {
          // Translation - PLUS LENT
          tl.to(prevTextContainer, {
            y: 0, // Slide vers position finale
            duration: 0.4, // Plus lent que l'élément sortant
            ease: 'power3.easeInOut'
          }, "+=0");
          // FadeIn simultané
          tl.to(prevTextContainer, {
            autoAlpha: 1,
            duration: 0.4, // Même durée que la translation
            ease: 'power3.easeInOut'
          }, "+=0");
        }
        
        // Masquer le slide actuel après l'animation
        tl.to(currentSlide, {
          autoAlpha: 0,
          duration: 0.1,
          ease: 'power3.out'
        }, 0.6);
      }

      // Animation synchronisée des image-containers (mobile : remontée de 332px)
      if (currentImageContainer && prevImageContainer) {
        if (isMobile()) {
          // Sur mobile : défilement vertical de 332px vers le bas
          // Tous les containers descendent de 332px
          imageContainers.forEach((container) => {
            tl.to(container, {
              y: `+=332`, // Descendre de 332px
              duration: 0.6,
              ease: 'power3.easeInOut'
            }, 0);
          });
        } else {
          // Desktop : logique originale
          // Préparer le container précédent
          gsap.set(prevImageContainer, { autoAlpha: 1, y: '-504px' });
          
          // Animation simultanée des image-containers
          tl.to(currentImageContainer, {
            y: '504px',
            duration: 0.6,
            ease: 'power3.easeInOut'
          }, 0);
          
          tl.to(prevImageContainer, {
            y: 0,
            duration: 0.6,
            ease: 'power3.easeInOut'
          }, 0);
        }
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

      // Positionner les image-containers à l'état final
      if (imageContainers.length > 0) {
        imageContainers.forEach((container, index) => {
          if (isMobile()) {
            // Sur mobile : position finale après défilement
            // Le dernier container doit être à y: 0, les autres décalés vers le haut
            const finalYPosition = (index - maxPerdrixScroll) * 332;
            gsap.set(container, { 
              autoAlpha: 1, 
              y: finalYPosition,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              // Supprimer toutes les marges pour éviter les espaces
              margin: 0,
              padding: 0,
              border: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              display: 'block',
              lineHeight: 0,
              fontSize: 0
            });
            console.log(`📱 Image-container ${index + 1} position finale: y: ${finalYPosition}px (sans marges)`);
          } else {
            // Desktop : logique originale
            if (index === maxPerdrixScroll) {
              gsap.set(container, { autoAlpha: 1, y: 0 });
            } else {
              gsap.set(container, { autoAlpha: 1, y: '504px' });
            }
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

  // Animation complète pour la slide 128 (Case Study) - Transposition de l'animation desktop
  const registerMobileSlide128Animation = () => {
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    if (!slide128Section) return;

    // Chercher les éléments essentiels (même structure que desktop)
    const killerwuDiv = slide128Section.querySelector('#killerwu');
    const caseStudyContents = slide128Section.querySelectorAll('.case-study-content');
    const caseStudyItems = slide128Section.querySelectorAll('.case-study-item');

    if (!killerwuDiv || caseStudyItems.length === 0) {
      console.warn('❌ Éléments case-study non trouvés dans slide-128');
      return;
    }

    console.log('🚀 Slide-128 Mobile Register:', {
      killerwuDiv: !!killerwuDiv,
      caseStudyContentsCount: caseStudyContents.length,
      caseStudyItemsCount: caseStudyItems.length
    });

    // Variables pour le défilement case-study mobile
    let slide128ScrollIndex = 0;
    let maxSlide128Scroll = 0;
    let isScrollingSlide128 = false;

    // Fonction pour vérifier si on est sur mobile
    const isMobile = () => {
      return window.innerWidth <= 1024;
    };

    // Fonction pour initialiser les limites de défilement
    const initializeSlide128ScrollLimits = () => {
      maxSlide128Scroll = caseStudyItems ? caseStudyItems.length - 1 : 0;
      console.log(`📊 Case-study mobile limites: max = ${maxSlide128Scroll} (${caseStudyItems.length} items)`);
    };

    // Fonction pour appliquer les styles mobiles spécifiques SEULEMENT sur mobile
    const applyMobileStylesIfNeeded = () => {
      if (!isMobile()) return; // Ne rien faire sur desktop
      
      console.log('🔧 Application des styles mobiles pour slide-128');
      
      // S'assurer que le conteneur killerwu est bien configuré
      if (killerwuDiv) {
        gsap.set(killerwuDiv, {
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
      console.log('🔄 Reset slide-128 mobile to initial state');
      
      // Nettoyer les animations GSAP précédentes
      gsap.killTweensOf([killerwuDiv, caseStudyItems, caseStudyContents]);
      
      if (isMobile()) {
        // Appliquer les styles mobiles
        applyMobileStylesIfNeeded();
      }
      
      // État initial du conteneur
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
              gsap.set(content, { display: 'block', opacity: 1 });
              item.classList.add('active');
            } else {
              // Autres items : masqués
              gsap.set(content, { display: 'none', opacity: 1 });
              item.classList.remove('active');
            }
          }
        });
      }
      
      // Réinitialiser les variables
      slide128ScrollIndex = 0;
      isScrollingSlide128 = false;
      animationStates.value['slide-128-mobile'] = 'hidden';
      animationStates.value['slide-128-animation-playing'] = false;
      animationStates.value['slide-128-current-index'] = 0;
      
      console.log('🔄 Reset slide-128 mobile terminé');
    };

    // === ÉTAT INITIAL ===
    console.log('🚀 Initialisation slide-128 mobile');
    
    if (isMobile()) {
      // Appliquer les styles de base immédiatement
      applyMobileStylesIfNeeded();
      
      // Petit délai pour que les styles CSS soient bien appliqués
      gsap.delayedCall(0.05, () => {
        resetToInitialState();
        initializeSlide128ScrollLimits();
      });
    } else {
      resetToInitialState();
      initializeSlide128ScrollLimits();
    }

    // Fonction pour déclencher l'animation initiale (affichage de #killerwu)
    const triggerSlide128InitialAnimation = () => {
      if (animationStates.value['slide-128-mobile'] !== 'hidden') return;
      
      animationStates.value['slide-128-mobile'] = 'initializing';
      
      const firstCaseStudyItem = slide128Section.querySelector('.case-study-item:first-child');
      const firstCaseStudyContent = firstCaseStudyItem?.querySelector('.case-study-content');
      
      console.log('🎬 Démarrage animation slide-128 mobile avec cycle des case-study-content');
      
      if (killerwuDiv) {
        // Afficher le conteneur et le premier case-study-content
        gsap.to(killerwuDiv, {
          autoAlpha: 1,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => {
            // S'assurer que le premier case-study-content est visible
            if (firstCaseStudyContent && firstCaseStudyItem) {
              gsap.set(firstCaseStudyContent, { display: 'block', opacity: 1 });
              firstCaseStudyItem.classList.add('active');
            }
            
            animationStates.value['slide-128-mobile'] = 'initialized';
            animationStates.value['slide-128-current-index'] = 0;
            console.log('✅ Slide-128 mobile initialisée - Premier case-study-content affiché');
          }
        });
      }
    };

    // Animation FORWARD (swipe bas->haut) : Défilement vers le case-study suivant
    const triggerSlide128ForwardAnimation = () => {
      if (isScrollingSlide128) return false;
      
      // Si on a atteint la fin, permettre la navigation vers la slide suivante
      if (slide128ScrollIndex >= maxSlide128Scroll) {
        console.log('🏁 Fin des case-study-content atteinte');
        return false; // Indiquer qu'on peut passer à la slide suivante
      }
      
      isScrollingSlide128 = true;
      animationStates.value['slide-128-animation-playing'] = true;
      animationStates.value['slide-128-mobile'] = 'animating-forward';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const allItems = slide128Section.querySelectorAll('.case-study-item');
      
      console.log(`📱 Défilement case-study mobile avant: ${slide128ScrollIndex} -> ${slide128ScrollIndex + 1}`);
      console.log(`Total items trouvés: ${allItems?.length}`);
      
      if (allItems && allItems.length > slide128ScrollIndex + 1) {
        const currentItem = allItems[slide128ScrollIndex];
        const nextItem = allItems[slide128ScrollIndex + 1];
        const currentContent = currentItem?.querySelector('.case-study-content');
        const nextContent = nextItem?.querySelector('.case-study-content');
        
        if (currentContent && nextContent) {
          // Switch instantané sans animation sur mobile
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
          
          // Mise à jour immédiate des indices et états
          slide128ScrollIndex++;
          animationStates.value['slide-128-current-index'] = slide128ScrollIndex;
          animationStates.value['slide-128-mobile'] = 'initialized';
          animationStates.value['slide-128-animation-playing'] = false;
          isScrollingSlide128 = false;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log(`✅ Défilement case-study mobile terminé - nouvel index: ${slide128ScrollIndex}`);
        }
      }

      return true; // Indiquer que l'animation a été lancée
    };

    // Animation REVERSE (swipe haut->bas) : Défilement vers le case-study précédent
    const triggerSlide128ReverseAnimation = () => {
      if (isScrollingSlide128 || slide128ScrollIndex <= 0) return false;
      
      isScrollingSlide128 = true;
      animationStates.value['slide-128-animation-playing'] = true;
      animationStates.value['slide-128-mobile'] = 'animating-reverse';

      // Bloquer les interactions pendant l'animation
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const allItems = slide128Section.querySelectorAll('.case-study-item');
      
      console.log(`📱 Défilement case-study mobile arrière: ${slide128ScrollIndex} -> ${slide128ScrollIndex - 1}`);
      
      if (allItems && allItems.length > 0) {
        const currentItem = allItems[slide128ScrollIndex];
        const prevItem = allItems[slide128ScrollIndex - 1];
        const currentContent = currentItem?.querySelector('.case-study-content');
        const prevContent = prevItem?.querySelector('.case-study-content');
        
        if (currentContent && prevContent) {
          // Switch instantané sans animation sur mobile (reverse)
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
          
          // Mise à jour immédiate des indices et états
          slide128ScrollIndex--;
          animationStates.value['slide-128-current-index'] = slide128ScrollIndex;
          animationStates.value['slide-128-mobile'] = 'initialized';
          animationStates.value['slide-128-animation-playing'] = false;
          isScrollingSlide128 = false;
          
          // Réactiver les interactions DOM
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          
          console.log(`✅ Défilement case-study mobile arrière terminé - nouvel index: ${slide128ScrollIndex}`);
        }
      }

      return true; // Indiquer que l'animation a été lancée
    };

    // Fonction pour mettre les éléments à l'état final
    const setToFinalState = () => {
      // Aller au dernier case-study
      slide128ScrollIndex = maxSlide128Scroll;
      
      // Afficher le dernier case-study et masquer les autres
      if (caseStudyItems.length > 0) {
        caseStudyItems.forEach((item, index) => {
          const content = item.querySelector('.case-study-content');
          if (content) {
            if (index === maxSlide128Scroll) {
              gsap.set(content, { display: 'block', opacity: 1 });
              item.classList.add('active');
            } else {
              gsap.set(content, { display: 'none', opacity: 1 });
              item.classList.remove('active');
            }
          }
        });
      }
      
      // Afficher killerwu
      if (killerwuDiv) {
        gsap.set(killerwuDiv, { autoAlpha: 1 });
      }
      
      animationStates.value['slide-128-mobile'] = 'complete';
      animationStates.value['slide-128-current-index'] = maxSlide128Scroll;
    };

    // ScrollTrigger pour détecter quand la slide 128 est visible
    const st = ScrollTrigger.create({
      trigger: slide128Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      end: 'bottom top',
      onEnter: () => {
        console.log('📍 Slide 128 mobile is now visible');
        // Déclencher l'animation initiale à l'entrée
        triggerSlide128InitialAnimation();
      },
      onLeave: () => {
        console.log('📍 Leaving slide 128 mobile (going down)');
        // Maintenir l'état en quittant
      },
      onEnterBack: () => {
        console.log('📍 Entering back slide 128 mobile');
        // Déclencher l'animation initiale au retour
        triggerSlide128InitialAnimation();
      },
      onLeaveBack: () => {
        console.log('📍 Leaving slide 128 mobile (going up)');
        // Réinitialiser quand on quitte vers le haut
        resetToInitialState();
      }
    });

    mobileScrollTriggers.push(st);
    slide128Section._triggerForwardAnimation = triggerSlide128ForwardAnimation;
    slide128Section._triggerReverseAnimation = triggerSlide128ReverseAnimation;
    slide128Section._resetToInitialState = resetToInitialState;
    slide128Section._setToFinalState = setToFinalState;
    slide128Section._initializeSlide128ScrollLimits = initializeSlide128ScrollLimits;
    slide128Section._triggerInitialAnimation = triggerSlide128InitialAnimation;
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
            
            // Si les éléments principaux sont visibles ET que leur animation est terminée, 
            // mais #text-element-5 n'a jamais été montré, déclencher l'animation forward
            if (animationStates.value['slide-20-mobile'] === 'elements-visible' && 
                animationStates.value['slide-20-elements-animation-complete'] === true) {
              if (currentSection._triggerForwardAnimation) {
                currentSection._triggerForwardAnimation();
                return; // Bloquer la navigation normale
              }
            }
            
            // Si l'animation des éléments principaux est en cours, ignorer le swipe
            if (animationStates.value['slide-20-mobile'] === 'animating-elements') {
              console.log('⏳ Slide-20: Animation des éléments en cours, swipe ignoré');
              return;
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
          
          // GESTION SPÉCIALE POUR SLIDE-128 - ANIMATION BIDIRECTIONNELLE CASE-STUDY
          if (currentSection && currentSection.id === 'slide-128') {
            
            // Si on est dans les case-study, gérer le défilement interne
            if (animationStates.value['slide-128-mobile'] === 'initialized') {
              
              // Swipe vers le haut : case-study suivant
              if (currentSection._triggerForwardAnimation) {
                const animationLaunched = currentSection._triggerForwardAnimation();
                if (animationLaunched) {
                  return; // Bloquer la navigation normale
                }
                // Si l'animation n'a pas été lancée (fin des case-study), continuer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-128-animation-playing']) {
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
          
          // GESTION SPÉCIALE POUR SLIDE-128 - ANIMATION REVERSE CASE-STUDY
          if (currentSection && currentSection.id === 'slide-128') {
            
            // Si on est dans les case-study, gérer le défilement interne
            if (animationStates.value['slide-128-mobile'] === 'initialized') {
              
              // Swipe vers le bas : case-study précédent
              if (currentSection._triggerReverseAnimation) {
                const animationLaunched = currentSection._triggerReverseAnimation();
                if (animationLaunched) {
                  return; // Bloquer la navigation normale
                }
                // Si l'animation n'a pas été lancée (début des case-study), continuer la navigation normale
              }
            }
            
            // Si l'animation est en cours, ignorer le swipe
            if (animationStates.value['slide-128-animation-playing']) {
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
    console.log('- Animation éléments terminée:', animationStates.value['slide-20-elements-animation-complete']);
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
    
    // Tester l'animation des éléments principaux
    console.log('🎬 Test animation des éléments principaux dans 2 secondes...');
    setTimeout(() => {
      if (slide20Section._showMainElements) {
        slide20Section._showMainElements();
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
    const bdrsDiv = slide23Section.querySelector('.bdrs');
    
    console.log('- Perdrix container:', !!perdrixContainer);
    console.log('- Perdrix slides count:', perdrixSlides.length);
    console.log('- Image containers count:', imageContainers.length);
    console.log('- Div .bdrs:', !!bdrsDiv);
    
    if (perdrixContainer) {
      const computedStyle = window.getComputedStyle(perdrixContainer);
      console.log('- Container Opacity CSS:', computedStyle.opacity);
    }
    
    // Debug des positions des image-containers
    if (imageContainers.length > 0) {
      console.log('📱 Positions actuelles des image-containers:');
      imageContainers.forEach((container, index) => {
        const computedStyle = window.getComputedStyle(container);
        const transform = computedStyle.transform;
        console.log(`  - Container ${index + 1}: transform = ${transform}`);
      });
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

  // Fonction de debug pour tester les animations slide-128
  const debugSlide128Animation = () => {
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    if (!slide128Section) {
      console.log('❌ Section slide-128 non trouvée');
      return;
    }
    
    console.log('🔍 DEBUG Slide-128:');
    console.log('- Section trouvée:', !!slide128Section);
    console.log('- isMobile:', window.innerWidth <= 1024);
    console.log('- État actuel:', animationStates.value['slide-128-mobile']);
    console.log('- Animation en cours:', animationStates.value['slide-128-animation-playing']);
    console.log('- Index actuel:', animationStates.value['slide-128-current-index']);
    
    const killerwuDiv = slide128Section.querySelector('#killerwu');
    const caseStudyContents = slide128Section.querySelectorAll('.case-study-content');
    const caseStudyItems = slide128Section.querySelectorAll('.case-study-item');
    
    console.log('- Killerwu div:', !!killerwuDiv);
    console.log('- Case study contents count:', caseStudyContents.length);
    console.log('- Case study items count:', caseStudyItems.length);
    
    if (killerwuDiv) {
      const computedStyle = window.getComputedStyle(killerwuDiv);
      console.log('- Killerwu Opacity CSS:', computedStyle.opacity);
    }
    
    // Tester l'animation forward
    console.log('🎬 Test animation forward dans 2 secondes...');
    setTimeout(() => {
      if (slide128Section._triggerForwardAnimation) {
        const result = slide128Section._triggerForwardAnimation();
        console.log('Animation forward result:', result);
      }
    }, 2000);
  };

  // Fonction de debug pour vérifier les marges des image-containers
  const debugSlide23Margins = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    if (!slide23Section) {
      console.log('❌ Section slide-23 non trouvée');
      return;
    }
    
    const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
    
    console.log('🔍 DEBUG Marges Slide-23:');
    console.log('- Image containers count:', imageContainers.length);
    
    if (imageContainers.length > 0) {
      console.log('📱 Styles actuels des image-containers:');
      imageContainers.forEach((container, index) => {
        const computedStyle = window.getComputedStyle(container);
        console.log(`  - Container ${index + 1}:`);
        console.log(`    margin: ${computedStyle.margin}`);
        console.log(`    padding: ${computedStyle.padding}`);
        console.log(`    border: ${computedStyle.border}`);
        console.log(`    line-height: ${computedStyle.lineHeight}`);
        console.log(`    font-size: ${computedStyle.fontSize}`);
        console.log(`    display: ${computedStyle.display}`);
        console.log(`    box-sizing: ${computedStyle.boxSizing}`);
        console.log(`    transform: ${computedStyle.transform}`);
      });
    }
  };

  // Fonction pour forcer la suppression des marges
  const forceRemoveSlide23Margins = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    if (!slide23Section) {
      console.log('❌ Section slide-23 non trouvée');
      return;
    }
    
    const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
    
    if (imageContainers.length > 0) {
      console.log('🔧 Suppression forcée des marges...');
      imageContainers.forEach((container, index) => {
        gsap.set(container, {
          margin: '0 !important',
          padding: '0 !important',
          border: 'none !important',
          outline: 'none !important',
          boxSizing: 'border-box !important',
          display: 'block !important',
          lineHeight: '0 !important',
          fontSize: '0 !important'
        });
        console.log(`✅ Container ${index + 1} : marges supprimées`);
      });
    }
  };

  // Fonction de debug pour tester l'effet de recouvrement de doctornek
  const debugDoctornekOverlay = () => {
    const slide21Section = sections.value.find(s => s.id === 'slide-21');
    if (!slide21Section) {
      console.log('❌ Section slide-21 non trouvée');
      return;
    }
    
    const thoiathoingDiv = slide21Section.querySelector('#thoiathoing');
    const doctornekDiv = slide21Section.querySelector('#doctornek');
    const mshillDiv = slide21Section.querySelector('#mshill');
    
    console.log('🔍 DEBUG Doctornek Overlay:');
    console.log('- Section slide-21 trouvée:', !!slide21Section);
    console.log('- #thoiathoing trouvé:', !!thoiathoingDiv);
    console.log('- #doctornek trouvé:', !!doctornekDiv);
    console.log('- #mshill trouvé:', !!mshillDiv);
    console.log('- isMobile:', window.innerWidth <= 1024);
    
    if (doctornekDiv) {
      const computedStyle = window.getComputedStyle(doctornekDiv);
      const gsapStyle = gsap.getProperty(doctornekDiv, 'y');
      
      console.log('- Styles #doctornek:');
      console.log('  * position CSS:', computedStyle.position);
      console.log('  * left CSS:', computedStyle.left);
      console.log('  * top CSS:', computedStyle.top);
      console.log('  * width CSS:', computedStyle.width);
      console.log('  * height CSS:', computedStyle.height);
      console.log('  * zIndex CSS:', computedStyle.zIndex);
      console.log('  * transform CSS:', computedStyle.transform);
      console.log('  * y GSAP:', gsapStyle);
      console.log('  * opacity CSS:', computedStyle.opacity);
      console.log('  * display CSS:', computedStyle.display);
      console.log('  * backgroundColor CSS:', computedStyle.backgroundColor);
    }
    
    if (thoiathoingDiv) {
      const computedStyle = window.getComputedStyle(thoiathoingDiv);
      console.log('- Styles #thoiathoing:');
      console.log('  * position CSS:', computedStyle.position);
      console.log('  * overflow CSS:', computedStyle.overflow);
      console.log('  * opacity CSS:', computedStyle.opacity);
      console.log('  * zIndex CSS:', computedStyle.zIndex);
    }
    
    console.log('- États actuels:');
    console.log('  * slide-21-mobile:', animationStates.value['slide-21-mobile']);
    console.log('  * animation-playing:', animationStates.value['slide-21-animation-playing']);
    console.log('  * thoiathoing-shown:', animationStates.value['slide-21-thoiathoing-shown']);
    
    // Test manuel de l'effet de recouvrement
    console.log('🎬 Test recouvrement dans 2 secondes...');
    setTimeout(() => {
      if (slide21Section._triggerForwardAnimation) {
        console.log('🚀 Déclenchement animation recouvrement doctornek');
        slide21Section._triggerForwardAnimation();
      }
    }, 2000);
  };

  // Fonction pour forcer le reset et tester doctornek
  const forceDoctornekReset = () => {
    const slide21Section = sections.value.find(s => s.id === 'slide-21');
    if (slide21Section && slide21Section._resetToInitialState) {
      console.log('🔄 Reset forcé de slide-21');
      slide21Section._resetToInitialState();
      
      // Attendre un peu puis tester
      setTimeout(() => {
        debugDoctornekOverlay();
      }, 500);
    }
  };

  // Fonction de test pour vérifier que slide-73 vient du bas (NOUVELLE VERSION)
  const testSlide73BottomDirection = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (!slide73Section) {
      console.log('❌ Section slide-73 non trouvée');
      return;
    }
    
    const pointsFortDiv = slide73Section.querySelector('.points-fort');
    if (!pointsFortDiv) {
      console.log('❌ Div .points-fort non trouvée');
      return;
    }
    
    console.log('🧪 TEST SLIDE-73 CORRECTION - Vérification direction BAS:');
    console.log('- isMobile:', window.innerWidth <= 1024);
    
    // Forcer le reset complet
    if (slide73Section._resetToInitialState) {
      console.log('🔄 Reset forcé...');
      slide73Section._resetToInitialState();
    }
    
    // Vérifier la position après reset - IMMÉDIAT
    const checkPosition = () => {
      const yPosition = gsap.getProperty(pointsFortDiv, 'y');
      const xPosition = gsap.getProperty(pointsFortDiv, 'x');
      const computedStyle = window.getComputedStyle(pointsFortDiv);
      const transform = computedStyle.transform;
      const position = computedStyle.position;
      
      console.log('📍 Position après reset CORRIGÉ:');
      console.log('  * y GSAP:', yPosition);
      console.log('  * x GSAP:', xPosition);
      console.log('  * transform CSS:', transform);
      console.log('  * position CSS:', position);
      console.log('  * Hauteur fenêtre:', window.innerHeight + 'px');
      
      // Vérifier si la position est correcte
      const isYCorrect = (yPosition === '100vh' || yPosition === window.innerHeight || yPosition === window.innerHeight + 'px');
      const isXCorrect = (xPosition === 0 || xPosition === '0px');
      
      if (isYCorrect && isXCorrect) {
        console.log('✅ CORRECTION RÉUSSIE: .points-fort vient bien du BAS');
        console.log('   Position Y correcte:', yPosition);
        console.log('   Position X correcte:', xPosition);
      } else {
        console.log('❌ CORRECTION ÉCHOUÉE:');
        if (!isYCorrect) console.log('   Y incorrect:', yPosition, '(devrait être 100vh ou', window.innerHeight + 'px)');
        if (!isXCorrect) console.log('   X incorrect:', xPosition, '(devrait être 0)');
      }
      
      // Test animation après 1 seconde
      console.log('🎬 Test animation dans 1 seconde...');
      setTimeout(() => {
        if (slide73Section._triggerForwardAnimation) {
          console.log('🚀 Déclenchement animation slide-73 CORRIGÉE (BAS vers HAUT)');
          slide73Section._triggerForwardAnimation();
        }
      }, 1000);
    };
    
    // Vérifier immédiatement et aussi après un petit délai
    checkPosition();
    setTimeout(checkPosition, 100);
  };

  // Fonction de test pour vérifier que slide-21 #doctornek fonctionne correctement
  const testSlide21DoctornekHiding = () => {
    const slide21Section = sections.value.find(s => s.id === 'slide-21');
    if (!slide21Section) {
      console.log('❌ Section slide-21 non trouvée');
      return;
    }
    
    const doctornekDiv = slide21Section.querySelector('#doctornek');
    const thoiathoingDiv = slide21Section.querySelector('#thoiathoing');
    
    if (!doctornekDiv || !thoiathoingDiv) {
      console.log('❌ Éléments #doctornek ou #thoiathoing non trouvés');
      return;
    }
    
    console.log('🧪 TEST SLIDE-21 CORRECTION - Vérification cachage/recouvrement:');
    console.log('- isMobile:', window.innerWidth <= 1024);
    
    // Forcer le reset complet
    if (slide21Section._resetToInitialState) {
      console.log('🔄 Reset forcé slide-21...');
      slide21Section._resetToInitialState();
    }
    
    // Vérifier la position initiale de #doctornek
    const checkInitialPosition = () => {
      const yPosition = gsap.getProperty(doctornekDiv, 'y');
      const xPosition = gsap.getProperty(doctornekDiv, 'x');
      const zIndex = gsap.getProperty(doctornekDiv, 'zIndex');
      const autoAlpha = gsap.getProperty(doctornekDiv, 'autoAlpha');
      const computedStyle = window.getComputedStyle(doctornekDiv);
      
      console.log('📍 Position initiale #doctornek CORRIGÉE:');
      console.log('  * y GSAP:', yPosition);
      console.log('  * x GSAP:', xPosition);
      console.log('  * zIndex GSAP:', zIndex);
      console.log('  * autoAlpha GSAP:', autoAlpha);
      console.log('  * position CSS:', computedStyle.position);
      console.log('  * display CSS:', computedStyle.display);
      console.log('  * transform CSS:', computedStyle.transform);
      
      // Vérifier si la position est correcte
      const isYCorrect = (yPosition === '100vh' || yPosition === window.innerHeight || yPosition === window.innerHeight + 'px');
      const isXCorrect = (xPosition === 0 || xPosition === '0px');
      const isZIndexCorrect = (zIndex === 10 || zIndex === '10');
      
      if (isYCorrect && isXCorrect && isZIndexCorrect) {
        console.log('✅ CORRECTION RÉUSSIE: #doctornek bien caché en bas');
        console.log('   Position Y correcte:', yPosition);
        console.log('   Position X correcte:', xPosition);
        console.log('   zIndex correct:', zIndex);
      } else {
        console.log('❌ CORRECTION ÉCHOUÉE:');
        if (!isYCorrect) console.log('   Y incorrect:', yPosition);
        if (!isXCorrect) console.log('   X incorrect:', xPosition);
        if (!isZIndexCorrect) console.log('   zIndex incorrect:', zIndex);
      }
      
      // Vérifier que #thoiathoing est bien configuré
      const thoiathoing_autoAlpha = gsap.getProperty(thoiathoingDiv, 'autoAlpha');
      console.log('📍 État #thoiathoing: autoAlpha =', thoiathoing_autoAlpha);
      
      // Test recouvrement après 2 secondes
      console.log('🎬 Test recouvrement #doctornek dans 2 secondes...');
      setTimeout(() => {
        if (slide21Section._triggerForwardAnimation) {
          console.log('🚀 Déclenchement animation recouvrement CORRIGÉE');
          slide21Section._triggerForwardAnimation();
          
          // Vérifier le blocage pendant l'animation
          setTimeout(() => {
            const isBlocked = animationStates.value['slide-21-animation-playing'];
            if (isBlocked) {
              console.log('✅ BLOCAGE RÉUSSI: Navigation bloquée pendant animation');
            } else {
              console.log('❌ BLOCAGE ÉCHOUÉ: Animation pas en cours ou terminée trop vite');
            }
          }, 200);
        }
      }, 2000);
    };
    
    // Vérifier immédiatement et aussi après un petit délai
    checkInitialPosition();
    setTimeout(checkInitialPosition, 100);
  };

  // Exposer les fonctions pour le debug
  window.resetSlide73State = resetSlide73State;
  window.setSlide73ToFinalState = setSlide73ToFinalState;
  window.debugSlide73Animation = debugSlide73Animation;
  window.testSlide73BottomDirection = testSlide73BottomDirection; // Nouvelle fonction de test
  window.debugSlide21Animation = debugSlide21Animation;
  window.testSlide21DoctornekHiding = testSlide21DoctornekHiding; // Nouvelle fonction de test
  window.debugDoctornekOverlay = debugDoctornekOverlay;
  window.forceDoctornekReset = forceDoctornekReset;
  window.debugSlide20Animation = debugSlide20Animation;
  window.debugSlide23Animation = debugSlide23Animation;
  window.debugSlide23Margins = debugSlide23Margins;
  window.forceRemoveSlide23Margins = forceRemoveSlide23Margins;
  window.debugSlide128Animation = debugSlide128Animation;

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
