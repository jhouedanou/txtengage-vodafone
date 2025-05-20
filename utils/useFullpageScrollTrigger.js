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
  const isAnimating = ref(false); // Used for intra-slide animations like slide-128 items
  const isScrolling = ref(false); // Flag for wheel event cooldown
  
  // Constantes
  const SCROLLER_SELECTOR = "#master-scroll-container";
  const SCROLL_COOLDOWN = 500; // Milliseconds, adjusted for smoother control
  const WHEEL_TOLERANCE = 20; // Pixels, minimum deltaY to trigger event
  
  // Variables internes de gestion
  let stObserve = null;
  const keyboardListener = ref(null);
  const specificAnimationTriggers = [];
  const slideSpecificEventListeners = [];
  let lastScrollTime = 0;

  // ===========================================================================
  // SECTION 3: MÉCANISMES GLOBAUX DE NAVIGATION
  // ===========================================================================
  
  const handleFirstInteraction = () => {
    if (hasScrolledOnce.value) return;
    hasScrolledOnce.value = true;

    const slide73Index = sections.value.findIndex(s => s.id === 'slide-73');
    if (slide73Index === 0 && currentSectionIndex.value === 0) {
      const slide73Section = sections.value.find(s => s.id === 'slide-73');
      if (slide73Section && animationStates.value['slide-73'] !== true && animationStates.value['slide-73'] !== 'pending_st') {
        const pointsFortDiv = slide73Section.querySelector('.points-fort');
        const slidesContainerDiv = slide73Section.querySelector('.slides-container');

        animationStates.value['slide-73'] = false;

        if (pointsFortDiv) {
          gsap.to(pointsFortDiv, {
            x: 0,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
              if (animationStates.value['slide-73'] === false) {
                animationStates.value['slide-73'] = true;
              }
            }
          });
        }

        if (slidesContainerDiv) {
          gsap.to(slidesContainerDiv, {
            backgroundSize: 'cover',
            backgroundPositionX: '-25vw',
            duration: 0.5,
            ease: 'power2.out',
          });
        }
      }
    }
  };

  // ===========================================================================
  // SECTION 8: ANIMATION DE LA SLIDE 73 (POINTS FORTS)
  // ===========================================================================
  // Fonctionnement: Animation des éléments .points-fort via ScrollTrigger
  
  const registerSlide73Animation = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (!slide73Section) {
      // console.warn('ScrollTrigger Composable: Section slide-73 non trouvée pour l\'animation.');
      return;
    }
    const pointsFortDiv = slide73Section.querySelector('.points-fort');
    const slidesContainerDiv = slide73Section.querySelector('.slides-container');

    if (pointsFortDiv) {
      gsap.set(pointsFortDiv, { x: '100vw', autoAlpha: 1 });
    }
    if (slidesContainerDiv) {
      gsap.set(slidesContainerDiv, { backgroundSize: 'cover', backgroundPositionX: '0vw' });//etat initial du background avec la
    }
    
    animationStates.value['slide-73'] = false; // Initialement, l'animation n'est pas terminée/déclenchée

    const st = ScrollTrigger.create({
      trigger: slide73Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%', // Ajuster selon le besoin
      // markers: true, // Pour débogage
      onEnter: (self) => {
        const slide73Index = sections.value.findIndex(s => s.id === 'slide-73');
        // Si c'est la première slide et qu'il n'y a pas eu d'interaction, on attend handleFirstInteraction
        if (slide73Index === 0 && currentSectionIndex.value === 0 && !hasScrolledOnce.value) {
          return;
        }

        // Déclencher si pas déjà fait par handleFirstInteraction ou un onEnter précédent
        if (!self.userData || !self.userData.triggeredST) {
          if (animationStates.value['slide-73'] === true) { // Déjà complétée par handleFirstInteraction
             if(self.userData) self.userData.triggeredST = true;
            return;
          }
          
          if(self.userData) self.userData.triggeredST = true;
          else self.userData = { triggeredST: true };
          
          animationStates.value['slide-73'] = 'pending_st'; // ST prend le relais

          if (pointsFortDiv) {
            gsap.to(pointsFortDiv, {
              x: 0,
              duration: 0.8,
              ease: 'power2.out',
              onComplete: () => {
                if (animationStates.value['slide-73'] === 'pending_st') {
                  animationStates.value['slide-73'] = true;
                }
              }
            });
          }

        if (slidesContainerDiv) {
          gsap.to(slidesContainerDiv, {
            backgroundSize: 'cover',
            backgroundPositionX: '-25vw',
            duration: 0.5,
            ease: 'power2.out',
          });
        }
          // self.disable(); // Optionnel: désactiver après la première exécution
        }
      },
      onLeave: (self) => {
        // Optionnel: réinitialiser pour rejouer l'animation à chaque entrée
        // if (self.userData) self.userData.triggeredST = false;
        // gsap.set(pointsFortDiv, { x: '-100%', autoAlpha: 1 });
        // gsap.set(slidesContainerDiv, { backgroundSize: '200%', backgroundPositionX: '0vw' });
        // animationStates.value['slide-73'] = false;
      },
      onEnterBack: (self) => {
        // Similaire à onLeave si on veut rejouer l'animation en revenant par le haut
        // if (self.userData) self.userData.triggeredST = false;
      }
    });
    specificAnimationTriggers.push(st);
  };
  // ===========================================================================
  // SECTION 5: ANIMATION DE LA SLIDE 21
  // ===========================================================================
  // Fonctionnement: Animation déclenchée uniquement via goToSection
  
  const registerSlide21Animation = () => {
    const slide21Section = sections.value.find(s => s.id === 'slide-21');
    if (!slide21Section) {
      return;
    }
    const thoiathoingDiv = slide21Section.querySelector('#thoiathoing');

    if (!thoiathoingDiv) {
      return;
    }

    // État initial de #thoiathoing: invisible et décalé vers le bas
    gsap.set(thoiathoingDiv, { autoAlpha: 0, y: 50 });
    animationStates.value['slide-21-playedOnce'] = false; // Pour suivre si l'animation a été jouée une fois

    const st21 = ScrollTrigger.create({
      trigger: slide21Section,
      scroller: SCROLLER_SELECTOR
    });
    specificAnimationTriggers.push(st21);
  };
  // ===========================================================================
  // SECTION 6: ANIMATION DE LA SLIDE 22
  // ===========================================================================
  // Fonctionnement: Animation déclenchée uniquement via goToSection (une seule fois)
  
  const registerSlide22Animation = () => {
    const slide22Section = sections.value.find(s => s.id === 'slide-22');
    if (!slide22Section) {
      return;
    }
    const thoiathoingDiv = slide22Section.querySelector('#thoiathoing');

    if (!thoiathoingDiv) {
      return;
    }

    // État initial de #thoiathoing: invisible et décalé vers le bas
    gsap.set(thoiathoingDiv, { autoAlpha: 0, y: 50 });
    animationStates.value['slide-22-playedOnce'] = false; // Pour suivre si l'animation a été jouée
    const st22 = ScrollTrigger.create({
      trigger: slide22Section,
      scroller: SCROLLER_SELECTOR

    });
    specificAnimationTriggers.push(st22);
  };

  // ===========================================================================
  // SECTION 4: ANIMATION DE LA SLIDE 20 (TURTLE BEACH)
  // ===========================================================================
  // Fonctionnement: 
  // 1. Animation initiale: turtlebeach + éléments textuels en séquence
  // 2. Animation secondaire: text-element-5 sur scroll vers le bas
  
  const registerSlide20Animation = () => {
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    if (!slide20Section) {
      return;
    }
    
    // Références aux éléments à animer
    const turtleBeach = slide20Section.querySelector('#turtlebeach');
    const mzuH2Elements = slide20Section.querySelectorAll('#mzu h2');
    const textElement3 = slide20Section.querySelector('#text-element-3');
    const textElement0 = slide20Section.querySelector('#text-element-0');
    const textElement4 = slide20Section.querySelector('#text-element-4');
    const textElement2 = slide20Section.querySelector('#text-element-2');
    const textElement1 = slide20Section.querySelector('#text-element-1');
    const textElement5 = slide20Section.querySelector('#text-element-5');
    
    // État initial des éléments
    if (turtleBeach) gsap.set(turtleBeach, { scale: 0, autoAlpha: 1 });
    if (mzuH2Elements) gsap.set(mzuH2Elements, { autoAlpha: 0, y: 20 });
    if (textElement3) gsap.set(textElement3, { autoAlpha: 0, y: 20 });
    if (textElement0) gsap.set(textElement0, { autoAlpha: 0, y: 20 });
    if (textElement4) gsap.set(textElement4, { autoAlpha: 0, y: 20 });
    if (textElement2) gsap.set(textElement2, { autoAlpha: 0, y: 20 });
    if (textElement1) gsap.set(textElement1, { autoAlpha: 0, y: 20 });
    if (textElement5) gsap.set(textElement5, { autoAlpha: 0, y: 20 });
    
    // Variables d'état pour cette slide
    animationStates.value['slide-20-initialAnimPlayed'] = false;
    animationStates.value['slide-20-text5Shown'] = false;
    animationStates.value['slide-20-bubbles-animated'] = false;
    
    // ScrollTrigger pour la slide-20
    const st20 = ScrollTrigger.create({
      trigger: slide20Section,
      scroller: SCROLLER_SELECTOR,
      // markers: true,
      onEnter: () => {
        // Réinitialiser l'état du text-element-5 au premier passage ou retour
        if (textElement5) gsap.set(textElement5, { autoAlpha: 0, y: 20 });
        animationStates.value['slide-20-text5Shown'] = false;
        // Aucune animation de bulles nécessaire

        // Jouer l'animation initiale si elle n'a pas encore été jouée
        // et que nous ne sommes pas dans un état où elle est déjà considérée comme visible
        if (!animationStates.value['slide-20-initialAnimPlayed'] && !animationStates.value['slide-20-elementsVisible']) {
          playSlide20InitialAnimation(slide20Section);
        } else if (animationStates.value['slide-20-elementsVisible']) {
          // Si les éléments sont marqués comme visibles (ex: après un onEnterBack complet)
          // s'assurer qu'ils le sont effectivement.
          gsap.set(turtleBeach, { scale: 1, autoAlpha: 1 });
          gsap.set(mzuH2Elements, { autoAlpha: 1, y: 0 });
          const bubbleElements = [textElement3, textElement0, textElement4, textElement2, textElement1].filter(el => el);
          bubbleElements.forEach(element => gsap.set(element, { autoAlpha: 1, y: 0 }));
        }
      },
      onEnterBack: () => {
        // En remontant depuis la slide suivante (slide-21)
        // Masquer text-element-5 et réinitialiser son état pour permettre de le re-déclencher au scroll down
        if (textElement5) gsap.set(textElement5, { autoAlpha: 0, y: 20 });
        animationStates.value['slide-20-text5Shown'] = false;

        // Afficher immédiatement tous les autres éléments principaux sans animation
        if (turtleBeach) gsap.set(turtleBeach, { scale: 1, autoAlpha: 1 });
        if (mzuH2Elements) gsap.set(mzuH2Elements, { autoAlpha: 1, y: 0 });
        const bubbleElements = [textElement3, textElement0, textElement4, textElement2, textElement1].filter(el => el);
        bubbleElements.forEach(element => {
          gsap.set(element, { autoAlpha: 1, y: 0 });
        });
        animationStates.value['slide-20-elementsVisible'] = true; // Marque que les éléments principaux sont visibles
        animationStates.value['slide-20-initialAnimPlayed'] = true; // L'animation initiale est considérée comme jouée
        
        // L'ancien code plus complexe pour onEnterBack n'est plus nécessaire avec cette approche simplifiée.
      },
      onLeave: () => {
        // Potentiellement réinitialiser des états si on quitte la slide vers le bas et que text-5 a été montré
        // Par exemple, si on veut que l'anim initiale rejoue si on revient de loin.
        // Pour l'instant, on garde les états tels quels.
      },
      onLeaveBack: () => {
        // Si on quitte la slide vers le haut (vers slide-19)
        // On peut vouloir réinitialiser complètement 'slide-20-initialAnimPlayed' pour que tout rejoue
        // animationStates.value['slide-20-initialAnimPlayed'] = false;
        // animationStates.value['slide-20-elementsVisible'] = false;
      }
    });
    specificAnimationTriggers.push(st20);
  };

  /**
   * Réinitialise les éléments de la slide-20 à leur état initial
   */
  const resetSlide20Elements = (turtleBeach, mzuH2Elements, textElement3, textElement0, 
                              textElement4, textElement2, textElement1) => {
    if (turtleBeach) gsap.set(turtleBeach, { scale: 0, autoAlpha: 1 });
    if (mzuH2Elements) gsap.set(mzuH2Elements, { autoAlpha: 0, y: 20 });
    if (textElement3) gsap.set(textElement3, { autoAlpha: 0, y: 20 });
    if (textElement0) gsap.set(textElement0, { autoAlpha: 0, y: 20 });
    if (textElement4) gsap.set(textElement4, { autoAlpha: 0, y: 20 });
    if (textElement2) gsap.set(textElement2, { autoAlpha: 0, y: 20 });
    if (textElement1) gsap.set(textElement1, { autoAlpha: 0, y: 20 });
  };

  /**
   * Joue la séquence d'animation initiale de la slide-20
   */
  const playSlide20InitialAnimation = (targetSectionElement) => {
    const turtleBeach = targetSectionElement.querySelector('#turtlebeach');
    const mzuH2Elements = targetSectionElement.querySelectorAll('#mzu h2');
    const textElement3 = targetSectionElement.querySelector('#text-element-3');
    const textElement0 = targetSectionElement.querySelector('#text-element-0');
    const textElement4 = targetSectionElement.querySelector('#text-element-4');
    const textElement2 = targetSectionElement.querySelector('#text-element-2');
    const textElement1 = targetSectionElement.querySelector('#text-element-1');
    
    // Timeline pour séquencer les animations
    const tl = gsap.timeline({
      onComplete: () => {
        animationStates.value['slide-20-initialAnimPlayed'] = true;
        isNavigating.value = false; // Autoriser le scroll après la séquence
      }
    });
    
    // Ajouter les animations à la timeline
    if (turtleBeach) {
      tl.to(turtleBeach, {
        scale: 1,
        duration: 0.8,
        ease: "power2.out"
      });
    }
    
    if (mzuH2Elements && mzuH2Elements.length) {
      tl.to(mzuH2Elements, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
      }, "-=0.3");
    }
    
    // Séquence des éléments de texte
    if (textElement3) {
      tl.to(textElement3, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.2");
    }
    
    if (textElement0) {
      tl.to(textElement0, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.2");
    }
    
    if (textElement4) {
      tl.to(textElement4, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.2");
    }
    
    if (textElement2) {
      tl.to(textElement2, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.2");
    }
    
    if (textElement1) {
      tl.to(textElement1, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.2");
    }
    
    return tl;
  };

  /**
   * Joue l'animation de #text-element-5 sur le second scroll
   */
  const playSlide20Text5Animation = (sectionElement) => {
    const textElement5 = sectionElement.querySelector('#text-element-5');
    if (!textElement5) {
      animationStates.value['slide-20-text5Shown'] = true; // Marquer comme complété même si l'élément n'existe pas
      // Si text-element-5 n'existe pas, on ne devrait pas essayer de naviguer. 
      // On laisse le scroll par défaut (via setupFullpageObserver) gérer la navigation.
      // goToSection(currentSectionIndex.value + 1); // Retiré
      return;
    }
    
    // Get the turtle beach element
    const turtleBeach = sectionElement.querySelector('#turtlebeach');
    
    // Get the mzu H2 elements
    const mzuH2Elements = sectionElement.querySelectorAll('#mzu h2');
    
    // Get all bubble elements that need to be hidden
    const bubbleElements = [
      sectionElement.querySelector('#text-element-3'),
      sectionElement.querySelector('#text-element-0'),
      sectionElement.querySelector('#text-element-4'),
      sectionElement.querySelector('#text-element-2'),
      sectionElement.querySelector('#text-element-1')
    ].filter(el => el); // Filter out any null elements

    // Forcefully hide all bubble elements immediately using gsap.set()
    bubbleElements.forEach(element => {
      gsap.set(element, { autoAlpha: 0 }); 
    });

    // Then, apply fade out animation (optional, as they are already hidden by set)
    // Keeping it can be a fallback or if set isn't enough for some complex cases,
    // but usually, set is definitive.
    bubbleElements.forEach(element => {
      gsap.to(element, {
        autoAlpha: 0, // Target state is already 0, but .to() can ensure it if there were other tweens
        duration: 0.3, // Shorter duration as they are already hidden
        ease: "power2.out"
      });
    });
  
    // Forcefully hide turtleBeach element immediately
    if (turtleBeach) {
      gsap.set(turtleBeach, { autoAlpha: 0 });
      gsap.to(turtleBeach, {
        autoAlpha: 0, // Target state
        duration: 0.3,
        ease: "power2.out"
      });
    }
  
    // Forcefully hide mzuH2Elements immediately
    if (mzuH2Elements && mzuH2Elements.length) {
      gsap.set(mzuH2Elements, { autoAlpha: 0 });
      gsap.to(mzuH2Elements, {
        autoAlpha: 0, // Target state
        duration: 0.3,
        ease: "power2.out"
      });
    }
  
    // Show text-element-5 with animation
    gsap.to(textElement5, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => {

        // Marquer l'animation comme terminée
        animationStates.value['slide-20-text5Shown'] = true;
        // Ne pas naviguer automatiquement - laisser l'utilisateur scroller
      }
    });
  };

  // ===========================================================================
  // SECTION 10: ANIMATION DE LA SLIDE 128 (CASE STUDY)
  // ===========================================================================
  // Fonctionnement: Navigation entre études de cas avec scroll vertical
  // Les animations: H2 + image d'étude + titres + contenus défilables
  
  const registerSlide128Animation = (options = {}) => {
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    if (!slide128Section) {
      console.warn('ScrollTrigger Composable: Section slide-128 non trouvée pour l\'animation.');
      return;
    }

    const killerwuDiv = slide128Section.querySelector('#killerwu');
    if (!killerwuDiv) {
      console.warn('ScrollTrigger Composable: Div #killerwu non trouvée dans slide-128.');
      return;
    }

    // État d'animation initial pour la slide 128
    // -1: animation initiale non démarrée
    // 0: killerjunior affiché, prêt pour l'animation de llass
    // 1: toutes les animations terminées
    animationStates.value['slide-128'] = -1;

    // Configuration initiale avec GSAP - cacher initialement #killerjunior
    gsap.set(killerwuDiv, { autoAlpha: 0, y: 50 });
    
    // Cacher llass initialement et le configurer pour l'animation de remplissage de droite à gauche
    const llassImg = slide128Section.querySelector('#llass');
    if (llassImg) {
      gsap.set(llassImg, { 
        display: 'block',
        autoAlpha: 1,
        // Configuration pour un remplissage de droite à gauche
        clipPath: 'polygon(100% 0%, 100% 100%, 100% 100%, 100% 0%)'
      });
    }

    const st = ScrollTrigger.create({
      trigger: slide128Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: (self) => {

      
        const slide128Index = sections.value.findIndex(s => s.id === 'slide-128');
      
        // Si l'animation n'a pas encore été jouée
        if (animationStates.value['slide-128'] === -1) {
          // Ajouter un délai pour laisser la slide-128 apparaître d'abord

          
          // Attendre un délai avant de démarrer l'animation
          setTimeout(() => {
            // Animation: faire apparaître #killerjunior
            gsap.to(killerwuDiv, {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              ease: 'power2.out',
              onComplete: () => {

                // Marquer que killerjunior est affiché, prêt pour la suite de l'animation
                animationStates.value['slide-128'] = 0;
                
                // Lancer automatiquement l'animation de llass après un court délai
                if (llassImg) {
                  setTimeout(() => {

                    isAnimating.value = true;
                    
                    // Animation avec effet de remplissage progressif des arcs rouges (de droite à gauche)
                    gsap.to(llassImg, {
                      clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%)',
                      duration: 2.5,
                      ease: 'power1.inOut',
                      onComplete: () => {

                        animationStates.value['slide-128'] = 1; // Animation complète
                        isAnimating.value = false; // Libérer le défilement
                      }
                    });
                  }, 300); // Petit délai pour une transition visuelle plus agréable
                }
              }
            });
          }, 800); // Délai de 800ms pour laisser la slide s'afficher d'abord
          
          self.disable(); // Désactive ce trigger après son unique exécution
        }
      }
    });
    specificAnimationTriggers.push(st);
    
    // Observer la roue de la souris pour bloquer le défilement pendant l'animation
    const handleSlide128ScrollProgress = (e) => {
      // Vérifier si nous sommes actuellement sur la slide-128 
      if (isScrolling.value || isNavigating.value) { // Added isScrolling check
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (currentSectionIndex.value === sections.value.findIndex(s => s.id === 'slide-128')) {
        // Si l'animation n'est pas encore terminée et qu'on essaie de défiler vers le bas
        if (animationStates.value['slide-128'] !== 1 && // L'animation n'est pas complète
            e.deltaY > 0) { // Défilement vers le bas
          // Bloquer le défilement
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // Ajouter l'observateur d'événement pour la slide 128
    slide128Section.addEventListener('wheel', handleSlide128ScrollProgress, { passive: false });
  
    // Stocker la référence pour le nettoyage
    slideSpecificEventListeners.push({
      element: slide128Section,
      event: 'wheel',
      handler: handleSlide128ScrollProgress
    });
  };

  // ===========================================================================
  // SECTION 9: ANIMATION DE LA SLIDE 59
  // ===========================================================================
  // Fonctionnement: Animation séquentielle contrôlée par scroll
  
  const registerSlide59Animation = () => {
    const slide59Section = sections.value.find(s => s.id === 'slide-59');
    if (!slide59Section) {
      console.warn('ScrollTrigger Composable: Section slide-59 non trouvée pour l\'animation.');
      return;
    }

    const killerJuniorDiv = slide59Section.querySelector('#killerjunior');
    if (!killerJuniorDiv) {
      console.warn('ScrollTrigger Composable: Div #killerjunior non trouvée dans slide-59.');
      return;
    }

    const llassImg = slide59Section.querySelector('#llass');
    if (!llassImg) {
      console.warn('ScrollTrigger Composable: Image #llass non trouvée dans slide-59.');
      // Continuer l'exécution même si #llass n'est pas trouvé
    }

    // États d'animation pour la slide 59
    // -1: animation initiale non jouée
    // 0: killerjunior affiché, prêt pour l'animation de llass
    // 1: toutes les animations terminées
    animationStates.value['slide-59'] = -1;

    // Configuration initiale avec GSAP - cacher initialement #killerjunior
    gsap.set(killerJuniorDiv, { autoAlpha: 0, y: 50 });
    
    // Cacher llass initialement et le configurer pour l'animation de remplissage de droite à gauche
    if (llassImg) {
      gsap.set(llassImg, { 
        display: 'block',
        autoAlpha: 1,
        // Configuration pour un remplissage de droite à gauche
        clipPath: 'polygon(100% 0%, 100% 100%, 100% 100%, 100% 0%)'
      });
    }

    const st = ScrollTrigger.create({
      trigger: slide59Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: (self) => {

      
        const slide59Index = sections.value.findIndex(s => s.id === 'slide-59');
      
        // Si l'animation n'a pas encore été jouée
        if (animationStates.value['slide-59'] === -1) {
          // Ajouter un délai pour laisser la slide-59 apparaître d'abord

          
          // Attendre un délai avant de démarrer l'animation
          setTimeout(() => {
            // Animation: faire apparaître #killerjunior
            gsap.to(killerJuniorDiv, {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              ease: 'power2.out',
              onComplete: () => {

                // Marquer que killerjunior est affiché, prêt pour la suite de l'animation
                animationStates.value['slide-59'] = 0;
                
                // Lancer automatiquement l'animation de llass après un court délai
                if (llassImg) {
                  setTimeout(() => {

                    isAnimating.value = true;
                    
                    // Animation avec effet de remplissage progressif des arcs rouges (de droite à gauche)
                    gsap.to(llassImg, {
                      clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%)',
                      duration: 2.5,
                      ease: 'power1.inOut',
                      onComplete: () => {

                        animationStates.value['slide-59'] = 1; // Animation complète
                        isAnimating.value = false; // Libérer le défilement
                      }
                    });
                  }, 300); // Petit délai pour une transition visuelle plus agréable
                }
              }
            });
          }, 800); // Délai de 800ms pour laisser la slide s'afficher d'abord
          
          self.disable(); // Désactive ce trigger après son unique exécution
        }
      }
    });
    specificAnimationTriggers.push(st);
    
    // Observer la roue de la souris pour bloquer le défilement pendant l'animation
    const handleSlide59ScrollProgress = (e) => {
      // Vérifier si nous sommes actuellement sur la slide-59 
      if (isScrolling.value || isNavigating.value) { // Added isScrolling check
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (currentSectionIndex.value === sections.value.findIndex(s => s.id === 'slide-59')) {
        // Si l'animation n'est pas encore terminée et qu'on essaie de défiler vers le bas
        if (animationStates.value['slide-59'] !== 1 && // L'animation n'est pas complète
            e.deltaY > 0) { // Défilement vers le bas
          // Bloquer le défilement
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // Ajouter l'observateur d'événement pour la slide 59
    slide59Section.addEventListener('wheel', handleSlide59ScrollProgress, { passive: false });
  
    // Stocker la référence pour le nettoyage
    slideSpecificEventListeners.push({
      element: slide59Section,
      event: 'wheel',
      handler: handleSlide59ScrollProgress
    });
  };

  // ===========================================================================
  // SECTION 7: ANIMATION DE LA SLIDE 23 (PERDRIX)
  // ===========================================================================
  // Fonctionnement: Navigation par étapes entre les perdrix-slide avec blocage de scroll
  
  const registerSlide23Animation = () => {
    // Attendre un peu pour que le DOM soit complètement chargé
    setTimeout(() => {
      // Récupérer la section slide-23 par son ID
      const slide23Section = document.getElementById('slide-23');
      if (!slide23Section) {
        console.warn('ScrollTrigger Composable: Section slide-23 non trouvée pour l\'animation.');
        return;
      }

      // Mise à jour: cibler directement le div #joce dans la nouvelle structure
      const joceDiv = slide23Section.querySelector('#joce');
      if (!joceDiv) {
        console.warn('ScrollTrigger Composable: Div #joce non trouvée dans slide-23.');
        return;
      }

      const perdrixSlides = Array.from(slide23Section.querySelectorAll('.perdrix-slide'));

      if (perdrixSlides.length === 0) {
        console.warn('ScrollTrigger Composable: Aucun élément .perdrix-slide trouvé dans slide-23.');
        return;
      }

      // États d'animation pour slide-23:
      // -1: Initiale, animation pas encore démarrée
      // 0: joce et perdrix-slide-1 affichésfz, attendant scroll
      // 1 à N-1: N perdrix-slides sont affichées (de 1 à N-1)
      // N: Toutes les perdrix-slides sont affichées, défilement libéré
      animationStates.value['slide-23'] = -1;
      let currentPerdrixIndex = -1;

      // Configuration initiale: cacher joce et toutes les perdrix-slide
      gsap.set(joceDiv, { autoAlpha: 0 });
      perdrixSlides.forEach((slide) => {
        // On laisse les styles de positionnement mais on cache avec opacity
        gsap.set(slide, { 
          autoAlpha: 0,
          // On conserve la position mais sans animation de translation
          y: 0,
          // On s'assure que l'élément reste dans le flux
          position: 'relative'
        });
      });

      // Créer un point d'ancrage pour ScrollTrigger
      const anchorElement = document.createElement('div');
      anchorElement.id = 'slide23-anchor';
      anchorElement.style.position = 'absolute';
      anchorElement.style.top = '0';
      anchorElement.style.width = '100%';
      anchorElement.style.height = '100%';
      anchorElement.style.pointerEvents = 'none';
      slide23Section.appendChild(anchorElement);

      // Variables pour contrôler le throttling du scroll
      let isAnimating = false;
      let lastScroll = 0;
      const scrollCooldown = 750; // Délai minimum entre chaque animation (en ms)
      let lastDeltaY = 0;
      let cumulativeDeltaY = 0;
      const deltaYThreshold = 5; // Seuil pour déclencher une animation (ajustez selon sensibilité)

      // Fonction pour bloquer le défilement, fonctionne même sans fullpage_api
      const blockScrolling = () => {

        isNavigating.value = true; // Bloquer la navigation interne
        
        // Utiliser fullpage_api si disponible
        if (typeof fullpage_api !== 'undefined') {
          try {
            fullpage_api.setAllowScrolling(false);
            fullpage_api.setKeyboardScrolling(false);
          } catch (error) {
            console.error("Erreur lors du blocage du défilement via fullpage_api:", error);
          }
        }
      };

      // Fonction pour libérer le défilement
      const unblockScrolling = () => {

        isNavigating.value = false;
        
        if (typeof fullpage_api !== 'undefined') {
          try {
            fullpage_api.setAllowScrolling(true);
            fullpage_api.setKeyboardScrolling(true);
          } catch (error) {
            console.error("Erreur lors de la libération du défilement via fullpage_api:", error);
          }
        }
      };

      // Variables pour l'accumulation du scroll post-séquence
      let postSequenceDeltaY = 0; // Pour accumuler le scroll après la fin de séquence
      const POST_SEQUENCE_THRESHOLD = 150; // Seuil pour déclencher le changement de slide après la séquence
      
      // Gestionnaire d'événement pour les scrolls sur la slide-23
      const handlePerdrixScroll = (event) => {
        let cumulativeDeltaY = 0; // Initialize cumulative scroll delta
        const deltaYThreshold = 5; // Set desired sensitivity
        if (isScrolling.value || isNavigating.value) { // Added isScrolling check
          event.preventDefault();
          return;
        }
        // Vérifier si nous sommes actuellement sur la slide-23 
        const currentSlideId = sections.value[currentSectionIndex.value]?.id;
        
        if (currentSlideId !== 'slide-23') {
          // Nettoyer l'écouteur si on n'est plus sur la slide-23 (mesure de sécurité)
          document.removeEventListener('wheel', handlePerdrixScroll);
          return;
        }

        const perdrixSlides = Array.from(slide23Section.querySelectorAll('.perdrix-slide'));
        // Correction: Fetch perdrixSlides from the current section if it's slide-23
        let slide23SectionElement = sections.value[currentSectionIndex.value];
        if (slide23SectionElement.id !== 'slide-23') slide23SectionElement = sections.value.find(s => s.id === 'slide-23');
        const actualPerdrixSlides = slide23SectionElement ? Array.from(slide23SectionElement.querySelectorAll('.perdrix-slide')) : [];

        // Si la séquence d'animation des perdrix est complètement terminée
        if (animationStates.value['slide-23'] === actualPerdrixSlides.length) {
          // Laisser le scroll se propager à l'observateur principal (setupFullpageObserver)
          // Ne pas appeler preventDefault() ou stopPropagation() ici.
          // Le `postSequenceDeltaY` et `POST_SEQUENCE_THRESHOLD` sont retirés.
          return; 
        }
        
        // (par exemple, -1 avant initialisation complète par onEnter, ou > perdrixSlides.length)
        // Utiliser actualPerdrixSlides.length pour la vérification
        if (animationStates.value['slide-23'] < 0 || animationStates.value['slide-23'] > actualPerdrixSlides.length) {
          return; 
        }

        event.preventDefault(); // Bloquer le défilement par défaut UNIQUEMENT MAINTENANT (pendant la sequence perdrix).
        event.stopPropagation();

        const timeSinceLastScroll = Date.now() - lastScroll;
        const scrollCooldown = 300; // 'scrollCooldown' is local to handlePerdrixScroll
        
        // Mesurer le temps écoulé depuis le dernier scroll traité
        const now = Date.now();
        
        // IMPORTANT: Pour macOS/trackpad, deltaY peut avoir des valeurs positives ou négatives très petites
        // On considère que le scroll est vers le bas si deltaY > 0

        // Vérifier que le sens est vers le bas (deltaY > 0)
        if (event.deltaY <= 0) {
          return;
        }
        
        // Accumuler les deltaY pour détecter l'intention de scroll
        cumulativeDeltaY += event.deltaY;
        lastDeltaY = event.deltaY;
        
        // Si une animation est déjà en cours ou si le délai de cooldown n'est pas écoulé, ignorer l'événement
        if (isAnimating || timeSinceLastScroll < scrollCooldown) {
          return;
        }
        
        // Vérifier si le seuil cumulatif est atteint
        if (cumulativeDeltaY < deltaYThreshold) {
          return;
        }
        
        // Marquer l'animation comme en cours
        isAnimating = true;
        lastScroll = now;
        cumulativeDeltaY = 0; // Réinitialiser l'accumulation
        

        // Masquer la perdrix actuelle avec un fondu
        if (currentPerdrixIndex >= 0 && currentPerdrixIndex < perdrixSlides.length) {
          gsap.to(perdrixSlides[currentPerdrixIndex], { 
            autoAlpha: 0, 
            duration: 0.3,
            ease: 'power2.inOut'
          });
        }
        
        // Passer à la suivante
        currentPerdrixIndex++;
        
        if (currentPerdrixIndex < perdrixSlides.length) {
          // Laisser la transformation en place sur l'élément, mais changer juste l'opacité
          gsap.to(perdrixSlides[currentPerdrixIndex], {
            autoAlpha: 1,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => {
              animationStates.value['slide-23'] = currentPerdrixIndex + 1;

              // Si c'est la dernière perdrix-slide, libérer le défilement
              if (currentPerdrixIndex === perdrixSlides.length - 1) {
                unblockScrolling(); // Libère isNavigating et potentiellement fullpage_api
                animationStates.value['slide-23'] = perdrixSlides.length; // Marque la fin complète de la séquence Perdrix

              }
              
              // Réinitialiser le flag d'animation après un délai
              setTimeout(() => {
                isAnimating = false;

              }, 300); // Délai supplémentaire pour éviter les déclenchements trop rapides
            }
          });
        }
      };
      
      // Créer un ScrollTrigger pour la slide-23
      const st = ScrollTrigger.create({
        trigger: anchorElement,
        scroller: SCROLLER_SELECTOR,
        start: 'top center',
        onEnter: () => {
          // Lors de la première entrée dans la slide
          if (animationStates.value['slide-23'] === -1) {
            // Bloquer immédiatement le défilement
            blockScrolling();
            
            // 1. Faire apparaître #slide-23 immédiatement
            gsap.to(joceDiv, {
              autoAlpha: 1,
              duration: 0.8,
              ease: 'power2.out',
              onComplete: () => {
                // 2. Faire apparaître la première perdrix-slide automatiquement
                if (perdrixSlides.length > 0) {
                  currentPerdrixIndex = 0;
                  gsap.to(perdrixSlides[0], {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.6,
                    ease: 'power2.out',
                    onComplete: () => {
                      animationStates.value['slide-23'] = 1;

                      // Après affichage de la première perdrix, écouter les scrolls
                      document.addEventListener('wheel', handlePerdrixScroll, { passive: false });
                      slideSpecificEventListeners.push({
                        element: document,
                        event: 'wheel',
                        handler: handlePerdrixScroll
                      });
                    }
                  });
                }
              }
            });
          } else if (animationStates.value['slide-23'] > 0 && 
                     animationStates.value['slide-23'] < perdrixSlides.length) {
            // Si on revient sur la slide pendant que l'animation est en cours
            blockScrolling();
          }
        },
        onLeave: () => {
          // S'assurer que l'animation est terminée avant de permettre la navigation
          if (animationStates.value['slide-23'] < perdrixSlides.length) {
            // Bloquer la navigation si l'animation n'est pas terminée
            return false;
          }
        },
        onLeaveBack: () => {
          // Si on revient en arrière vers slide-22, réinitialiser si nécessaire
          if (animationStates.value['slide-23'] < perdrixSlides.length) {
            // Réinitialiser uniquement si l'animation n'était pas terminée

            // Libérer le défilement
            unblockScrolling();
            
            // Détacher l'écouteur d'événement wheel
            document.removeEventListener('wheel', handlePerdrixScroll);
            
            // Réinitialiser l'état
            animationStates.value['slide-23'] = -1;
            currentPerdrixIndex = -1;
            
            // Réinitialiser visuellement
            gsap.set(joceDiv, { autoAlpha: 0 });
            perdrixSlides.forEach((slide) => {
              gsap.set(slide, { autoAlpha: 0, y: '100%' });
            });
          }
        }
      });
  
      specificAnimationTriggers.push(st);
    }, 500);
  };

  // --- Logique de Navigation ---

  // ===========================================================================
  // SECTION 11: NAVIGATION ENTRE SLIDES
  // ===========================================================================
  // Fonctionnement: Animation du scroll entre les sections avec déclenchement
  // des animations spécifiques à chaque slide à l'arrivée
  
  const goToSection = (index, duration = 1) => {
    if (index < 0 || index >= sections.value.length || (isNavigating.value && duration !== 0)) {
      return; // Ne pas retourner si duration === 0 pour permettre la mise en place initiale
    }
    if (index === currentSectionIndex.value && duration !== 0) {
      return;
    }

    const currentSectionElement = sections.value[currentSectionIndex.value];
    
    // BLOCAGE STRICT pour slide-23: empêcher de quitter la slide tant que l'animation n'est pas terminée
    if (currentSectionElement && currentSectionElement.id === 'slide-23') {
      const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
      // Vérifier si l'animation des perdrix-slides n'est pas terminée
      if (animationStates.value['slide-23'] !== undefined && 
          animationStates.value['slide-23'] < perdrixSlides.length) {
        return; // Blocage strict de la navigation
      }
    }
    
    // Blocage pour slide-73
    if (currentSectionElement && currentSectionElement.id === 'slide-73' && animationStates.value['slide-73'] !== true) {
      return;
    }
    
    // Blocage pour slide-59
    if (currentSectionElement && currentSectionElement.id === 'slide-59' && 
        animationStates.value['slide-59'] !== 1 && // L'animation n'est pas complète
        index > currentSectionIndex.value) { // Seulement bloquer vers le bas
      return;
    }
    
    // Blocage pour slide-20
    if (currentSectionElement && currentSectionElement.id === 'slide-20' && 
      !animationStates.value['slide-20-text5Shown'] && index > currentSectionIndex.value) {
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
        // Animation initiale pour slide-20
        if (sections.value[index] && sections.value[index].id === 'slide-20' && 
          !animationStates.value['slide-20-initialAnimPlayed']) {
          // Garder isNavigating à true pendant l'animation
          playSlide20InitialAnimation(sections.value[index]);
        } 
        // Animation pour slide-21
        else if (sections.value[index] && sections.value[index].id === 'slide-21' && 
                 !animationStates.value['slide-21-playedOnce']) {
          const thoiathoingDiv = sections.value[index].querySelector('#thoiathoing');
          if (thoiathoingDiv) {
            gsap.to(thoiathoingDiv, {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: 'power2.out',
              onComplete: () => {
                animationStates.value['slide-21-playedOnce'] = true;
              }
            });
          } else {
            animationStates.value['slide-21-playedOnce'] = true;
          }
          isNavigating.value = false;
        } else {
          isNavigating.value = false;
        }
        
        if (sections.value[index] && sections.value[index].id === 'slide-22' && !animationStates.value['slide-22-played']) {
          const thoiathoingDiv = sections.value[index].querySelector('#thoiathoing');
          if (thoiathoingDiv) {
            gsap.to(thoiathoingDiv, {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: 'power2.out',
              onComplete: () => {
                // Marquer comme jouée définitivement
                animationStates.value['slide-22-played'] = true;
              }
            });
          } else {
            animationStates.value['slide-22-played'] = true;
          }
        }
      },
      onInterrupt: () => {
        isNavigating.value = false;
      }
    });
  };
  
  // ===========================================================================
  // SECTION 12: SYSTÈME D'OBSERVATION DU SCROLL
  // ===========================================================================
  // Capture des événements de scroll et gestion des interactions spéciales
  
  const setupFullpageObserver = () => {
    if (sections.value.length === 0) return;

    stObserve = ScrollTrigger.observe({
      target: SCROLLER_SELECTOR,
      type: "wheel,touch",
      debounce: false, // Debounce is handled manually with SCROLL_COOLDOWN
      tolerance: WHEEL_TOLERANCE, // GSAP's built-in tolerance
      onUp: () => {
        const currentTime = Date.now();
        if (isScrolling.value || isNavigating.value || (currentTime - lastScrollTime < SCROLL_COOLDOWN)) {
          return;
        }
        isScrolling.value = true;
        lastScrollTime = currentTime;

        handleFirstInteraction();
        if (isNavigating.value) { 
          setTimeout(() => { isScrolling.value = false; }, SCROLL_COOLDOWN); // Ensure isScrolling resets
          return; 
        }
        
        // Bloquer le défilement vers le haut si on est sur slide-23 et l'animation n'est pas terminée
        const currentSectionElement = sections.value[currentSectionIndex.value];
        if (currentSectionElement && currentSectionElement.id === 'slide-23') {
          const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined &&
              animationStates.value['slide-23'] < perdrixSlides.length && animationStates.value['slide-23'] !== -1) { // Changed <= to <
            setTimeout(() => { isScrolling.value = false; }, SCROLL_COOLDOWN);
            return; // Bloquer le défilement
          }
        }
        
        goToSection(currentSectionIndex.value - 1);
        setTimeout(() => { isScrolling.value = false; }, SCROLL_COOLDOWN);
      },
      onDown: () => {
        const currentTime = Date.now();
        if (isScrolling.value || isNavigating.value || (currentTime - lastScrollTime < SCROLL_COOLDOWN)) {
          return;
        }
        isScrolling.value = true;
        lastScrollTime = currentTime;

        handleFirstInteraction();
        if (isNavigating.value) { 
          setTimeout(() => { isScrolling.value = false; }, SCROLL_COOLDOWN); // Ensure isScrolling resets
          return; 
        }

        const currentSectionElement = sections.value[currentSectionIndex.value];
        
        // Blocage pour slide-73
        if (currentSectionElement && currentSectionElement.id === 'slide-73' && animationStates.value['slide-73'] !== true) {
          setTimeout(() => { isScrolling.value = false; }, SCROLL_COOLDOWN);
          return;
        }
        
        // Blocage pour slide-59
        if (currentSectionElement && currentSectionElement.id === 'slide-59' && 
            animationStates.value['slide-59'] !== 1 && // L'animation n'est pas complète
            currentSectionIndex.value > sections.value.findIndex(s => s.id === 'slide-59')) { // Seulement bloquer vers le bas
          setTimeout(() => { isScrolling.value = false; }, SCROLL_COOLDOWN);
          return;
        }
        
        // Blocage pour slide-20
        if (currentSectionElement && currentSectionElement.id === 'slide-20' && 
          !animationStates.value['slide-20-text5Shown'] && currentSectionIndex.value > sections.value.findIndex(s => s.id === 'slide-20')) {
          setTimeout(() => { isScrolling.value = false; }, SCROLL_COOLDOWN);
          return;
        }
        
        // Blocage pour slide-23
        if (currentSectionElement && currentSectionElement.id === 'slide-23') {
          const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined && 
              animationStates.value['slide-23'] < perdrixSlides.length && animationStates.value['slide-23'] !== -1) {
            setTimeout(() => { isScrolling.value = false; }, SCROLL_COOLDOWN);
            return; // Bloquer le défilement
          }
        }
        
        // Blocage pour slide-20
        if (currentSectionElement && currentSectionElement.id === 'slide-20') {
          if (animationStates.value['slide-20-initialAnimPlayed'] && 
              !animationStates.value['slide-20-text5Shown']) {
            // Si l'animation initiale est terminée mais text-element-5 pas encore affiché
            playSlide20Text5Animation(currentSectionElement);
            setTimeout(() => { isScrolling.value = false; }, SCROLL_COOLDOWN);
            return; // Bloquer le défilement pour le moment, car playSlide20Text5Animation va s'exécuter
          } 
          // Si text-element-5 est déjà affiché (animationStates.value['slide-20-text5Shown'] === true),
          // alors on ne bloque pas, et on passe à goToSection(currentSectionIndex.value + 1)
        }
        
        goToSection(currentSectionIndex.value + 1);
        setTimeout(() => { isScrolling.value = false; }, SCROLL_COOLDOWN);
      },
      // Potentially add onWheel if more granular control is needed before onUp/onDown
    });
    specificAnimationTriggers.push(stObserve);

    // Mise à jour également du gestionnaire clavier
    keyboardListener.value = (e) => {
      handleFirstInteraction();
      if (isNavigating.value) return;

      let newIndex = currentSectionIndex.value;
      const currentSectionElement = sections.value[currentSectionIndex.value];

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        
        // Blocage pour slide-73
        if (currentSectionElement && currentSectionElement.id === 'slide-73' && animationStates.value['slide-73'] !== true) {
          return;
        }
        
        // Blocage pour slide-59
        if (currentSectionElement && currentSectionElement.id === 'slide-59' && 
            animationStates.value['slide-59'] !== 1 && // L'animation n'est pas complète
            newIndex > currentSectionIndex.value) { // Seulement bloquer vers le bas
          return;
        }
        
        // Blocage pour slide-20
        if (currentSectionElement && currentSectionElement.id === 'slide-20' && 
          !animationStates.value['slide-20-text5Shown'] && newIndex > currentSectionIndex.value) {
          return;
        }
        
        // Blocage pour slide-23
        if (currentSectionElement && currentSectionElement.id === 'slide-23') {
          const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined && 
              animationStates.value['slide-23'] < perdrixSlides.length && animationStates.value['slide-23'] !== -1) {
            return; // Blocage strict de la navigation vers le bas
          }
        }
        
        newIndex++;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        
        // Bloquer la navigation de slide-23 vers slide-22
        if (currentSectionElement && currentSectionElement.id === 'slide-23') {
          const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined && 
              animationStates.value['slide-23'] < perdrixSlides.length && animationStates.value['slide-23'] !== -1) {
            return; // Blocage strict de la navigation vers le haut
          }
        }
        
        // Bloquer la navigation de slide-59 vers slide-23 si l'animation de slide-23 n'est pas terminée
        const slide23Index = sections.value.findIndex(s => s.id === 'slide-23');
        if (currentSectionIndex.value - 1 === slide23Index) {
          const slide23Section = sections.value[slide23Index];
          const perdrixSlides = Array.from(slide23Section.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined && 
              animationStates.value['slide-23'] < perdrixSlides.length && animationStates.value['slide-23'] !== -1) {
            return; // Blocage strict de la navigation
          }
        }
        
        newIndex--;
      }

      if (newIndex !== currentSectionIndex.value) {
        goToSection(newIndex);
      }
    };
    window.addEventListener('keydown', keyboardListener.value);
  };

  // --- Initialisation et Nettoyage ---

  // ===========================================================================
  // SECTION 2: INITIALISATION ET NETTOYAGE
  // ===========================================================================
  
  const init = (sectionsElements, options = {}) => {
    if (!Array.isArray(sectionsElements) || sectionsElements.some(el => !(el instanceof HTMLElement))) {
      return;
    }
    sections.value = sectionsElements;
    
    if (sections.value.length > 0) {
      // Enregistrement des animations pour chaque slide
      registerSlide20Animation();
      registerSlide21Animation();
      registerSlide22Animation();
      registerSlide23Animation();
      registerSlide59Animation();
      registerSlide73Animation();
      registerSlide128Animation(options.slide128 || {});
      
      // Configuration des interactions et positionnement initial
      setupFullpageObserver();
      goToSection(0, 0);
    }
  };

  const cleanup = () => {
    // Nettoyage des ScrollTriggers
    if (stObserve) {
      stObserve.kill();
      stObserve = null;
    }
    specificAnimationTriggers.forEach(st => st.kill());
    specificAnimationTriggers.length = 0;
    
    // Nettoyage des event listeners
    if (keyboardListener.value) {
      window.removeEventListener('keydown', keyboardListener.value);
      keyboardListener.value = null;
    }
    slideSpecificEventListeners.forEach(listener => {
      listener.element.removeEventListener(listener.event, listener.handler);
    });
    slideSpecificEventListeners.length = 0;
    
    // Nettoyage des animations
    gsap.killTweensOf(SCROLLER_SELECTOR);
    
    // Réinitialisation des états
    currentSectionIndex.value = 0;
    isNavigating.value = false;
    isAnimating.value = false;
    hasScrolledOnce.value = false;
    Object.keys(animationStates.value).forEach(key => delete animationStates.value[key]);
    sections.value = [];
  };

  // Nettoyer les ressources lors du démontage du composant
  onUnmounted(cleanup);

  // Exposer l'API publique du composable
  return {
    currentSectionIndex,
    isNavigating,
    init,
    goToSection,
    // Exposer les fonctions d'enregistrement d'animation pour permettre
    // l'enregistrement individuel de slides si nécessaire
    registerSlide20Animation,
    registerSlide21Animation,
    registerSlide22Animation,
    registerSlide23Animation,
    registerSlide59Animation,
    registerSlide73Animation,
    registerSlide128Animation
  };
}