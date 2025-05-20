import { ref, onUnmounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function useFullpageScrollTrigger() {
  // --- Refs et Variables d'état ---
  const sections = ref([]);
  const currentSectionIndex = ref(0);
  const isNavigating = ref(false);
  const hasScrolledOnce = ref(false); // True après la première interaction utilisateur
  const animationStates = ref({}); // Stocke l'état des animations spécifiques (ex: 'slide-73': true si terminée)

  // --- Constantes ---
  const SCROLLER_SELECTOR = "#master-scroll-container";

  // --- Variables Internes ---
  let stObserve = null; // Instance de ScrollTrigger.observe
  const keyboardListener = ref(null); // Référence au gestionnaire d'événements clavier
  const specificAnimationTriggers = []; // Pour stocker les instances de ScrollTrigger spécifiques à des slides
  const slideSpecificEventListeners = []; // Pour stocker les event listeners spécifiques aux slides
  const isAnimating = ref(false); // Pour suivre si une animation particulière est en cours

  // --- Gestion des Animations Spécifiques (ex: Slide 73) ---

  /**
   * Gère la première interaction utilisateur pour déclencher des animations initiales si nécessaire.
   * Actuellement utilisé pour l'animation de la slide-73 si elle est la première affichée.
   */
  const handleFirstInteraction = () => {
    if (hasScrolledOnce.value) return;
    hasScrolledOnce.value = true;

    const slide73Index = sections.value.findIndex(s => s.id === 'slide-73');
    if (slide73Index === 0 && currentSectionIndex.value === 0) {
      const slide73Section = sections.value.find(s => s.id === 'slide-73');
      // Déclencher seulement si l'animation n'est pas déjà terminée ou en cours par ScrollTrigger
      if (slide73Section && animationStates.value['slide-73'] !== true && animationStates.value['slide-73'] !== 'pending_st') {
        const pointsFortDiv = slide73Section.querySelector('.points-fort');
        const slidesContainerDiv = slide73Section.querySelector('.slides-container');

        animationStates.value['slide-73'] = false; // Marquer comme initiée par interaction

        if (pointsFortDiv) {
          gsap.to(pointsFortDiv, {
            x: 0,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
              if (animationStates.value['slide-73'] === false) { // S'assurer que ST n'a pas pris le dessus
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
        // Il est important de rafraîchir ScrollTrigger si des dimensions ou positions changent dynamiquement
        // avant que ScrollTrigger n'ait eu la chance de les recalculer.
        // Cependant, si l'animation ne change pas les dimensions/offsets de manière significative
        // pour les autres triggers, cela peut ne pas être toujours nécessaire ici.
        // ScrollTrigger.refresh(); // Peut être nécessaire dans certains cas.
      }
    }
  };

  /**
   * Configure les animations spécifiques pour la slide-73 via ScrollTrigger.
   */
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
  /**
   * Configure les animations spécifiques pour la slide-21.
   * L'animation d'entrée est déclenchée via goToSection et ne se joue qu'une fois.
   */
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

    // Ce ScrollTrigger peut être simplifié ou supprimé si on ne veut plus de réinitialisation
    // pour rejouer. Si on veut juste l'animer une fois, on n'a pas besoin de onLeave/onLeaveBack
    // pour réinitialiser l'état en vue d'une nouvelle animation.
    // Cependant, il peut être utile si l'utilisateur quitte la slide AVANT que l'animation
    // "jouer une fois" ne se soit déclenchée.
    const st21 = ScrollTrigger.create({
      trigger: slide21Section,
      scroller: SCROLLER_SELECTOR,
      // markers: true,
      onLeave: () => {
        // Si l'animation "jouer une fois" n'a pas encore eu lieu,
        // et que l'on quitte la slide, on s'assure qu'elle reste dans son état initial.
        if (!animationStates.value['slide-21-playedOnce']) {
          gsap.set(thoiathoingDiv, { autoAlpha: 0, y: 50 });
        }
      },
      onLeaveBack: () => {
        if (!animationStates.value['slide-21-playedOnce']) {
          gsap.set(thoiathoingDiv, { autoAlpha: 0, y: 50 });
        }
      },
    });
    specificAnimationTriggers.push(st21);
  };
  /**
   * Configure les animations spécifiques pour la slide-22.
   * L'animation d'entrée est déclenchée via goToSection et ne se joue qu'une seule fois,
   * peu importe si l'utilisateur revient sur la slide.
   */
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
    animationStates.value['slide-22-played'] = false; // Pour suivre si l'animation a été jouée

    // Ce ScrollTrigger est simplifié - pas de réinitialisation dans onLeave/onLeaveBack
    // car on veut conserver l'animation une fois jouée
    const st22 = ScrollTrigger.create({
      trigger: slide22Section,
      scroller: SCROLLER_SELECTOR,
      // markers: true, // Pour débogage
      // Les callbacks onLeave et onLeaveBack sont supprimés pour conserver l'état final
    });
    specificAnimationTriggers.push(st22);
  };

  /**
   * Configure les animations spécifiques pour la slide-20.
   * Animation en deux phases:
   * 1. Animation initiale des éléments au chargement de la slide
   * 2. Animation de #text-element-5 au prochain scroll vers le bas
   */
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
        
        // Setup the bubbles mouse animation when slide first enters
        setupBubblesMouseAnimation(slide20Section);
      },
      onEnterBack: () => {
        // En remontant depuis la slide suivante
        if (textElement5) gsap.set(textElement5, { autoAlpha: 0, y: 20 });
        animationStates.value['slide-20-text5Shown'] = false;
        
        // Toujours afficher les éléments immédiatement lorsqu'on revient depuis slide-21
        // après que text-element-5 a été affiché
        if (animationStates.value['slide-20-text5Shown'] || animationStates.value['slide-20-elementsVisible']) {
          // Afficher immédiatement tous les éléments sans animation (set au lieu de to)
          // Rendre visible les éléments bulle
          const bubbleElements = [textElement3, textElement0, textElement4, textElement2, textElement1].filter(el => el);
          bubbleElements.forEach(element => {
            gsap.set(element, {
              autoAlpha: 1,
              y: 0
            });
          });
          
          // Rendre visible turtleBeach
          if (turtleBeach) {
            gsap.set(turtleBeach, {
              autoAlpha: 1,
              scale: 1
            });
          }
          
          // Rendre visible les éléments mzuH2
          if (mzuH2Elements && mzuH2Elements.length) {
            gsap.set(mzuH2Elements, {
              autoAlpha: 1,
              y: 0
            });
          }
          
          animationStates.value['slide-20-elementsVisible'] = true;
        } else {
          // Sinon, jouer l'animation initiale si elle n'a pas encore été jouée
          if (!animationStates.value['slide-20-initialAnimPlayed']) {
            playSlide20InitialAnimation(slide20Section);
          } else {
            // Show bubble elements again when coming back from slide-21
            const bubbleElements = [textElement3, textElement0, textElement4, textElement2, textElement1].filter(el => el);
            bubbleElements.forEach(element => {
              gsap.to(element, {
                autoAlpha: 1,
                duration: 0.5,
                ease: "power2.out"
              });
            });
            
            // Show turtleBeach again
            if (turtleBeach) {
              gsap.to(turtleBeach, {
                autoAlpha: 1,
                scale: 1,
                duration: 0.5,
                ease: "power2.out"
              });
            }
            
            // Show mzuH2Elements again
            if (mzuH2Elements && mzuH2Elements.length) {
              gsap.to(mzuH2Elements, {
                autoAlpha: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out"
              });
            }
          }
        }
        
        // Setup the bubbles mouse animation when returning to slide
        setupBubblesMouseAnimation(slide20Section);
      },
      onLeave: () => {
        // Si on quitte avant d'avoir terminé l'animation initiale
        if (!animationStates.value['slide-20-initialAnimPlayed']) {
          resetSlide20Elements(turtleBeach, mzuH2Elements, textElement3, textElement0, 
                            textElement4, textElement2, textElement1);
        }
        
        // Cacher text-element-5 lors du passage à la slide suivante
        if (textElement5) {
          gsap.to(textElement5, {
            autoAlpha: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        }
        
        // S'assurer que tous les autres éléments sont visibles pour le retour
        if (animationStates.value['slide-20-text5Shown']) {
          // Afficher immédiatement tous les éléments sans animation (set au lieu de to)
          // Rendre visible les éléments bulle
          const bubbleElements = [textElement3, textElement0, textElement4, textElement2, textElement1].filter(el => el);
          bubbleElements.forEach(element => {
            gsap.set(element, {
              autoAlpha: 1,
              y: 0
            });
          });
          
          // Rendre visible turtleBeach
          if (turtleBeach) {
            gsap.set(turtleBeach, {
              autoAlpha: 1,
              scale: 1
            });
          }
          
          // Rendre visible les éléments mzuH2
          if (mzuH2Elements && mzuH2Elements.length) {
            gsap.set(mzuH2Elements, {
              autoAlpha: 1,
              y: 0
            });
          }
          
          // Créer un nouvel état pour suivre que les éléments doivent rester visibles
          animationStates.value['slide-20-elementsVisible'] = true;
          // Réinitialiser l'état pour indiquer que text-element-5 n'est plus affiché
          animationStates.value['slide-20-text5Shown'] = false;
        }
        
        // Clean up bubble animation when leaving slide
        if (typeof animationStates.value['slide-20-bubbles-cleanup'] === 'function') {
          animationStates.value['slide-20-bubbles-cleanup']();
          animationStates.value['slide-20-bubbles-animated'] = false;
        }
      },
      onLeaveBack: () => {
        // Si on quitte vers le haut avant d'avoir terminé l'animation initiale
        if (!animationStates.value['slide-20-initialAnimPlayed']) {
          resetSlide20Elements(turtleBeach, mzuH2Elements, textElement3, textElement0, 
                            textElement4, textElement2, textElement1);
        }
        
        // Clean up bubble animation when leaving slide
        if (typeof animationStates.value['slide-20-bubbles-cleanup'] === 'function') {
          animationStates.value['slide-20-bubbles-cleanup']();
          animationStates.value['slide-20-bubbles-animated'] = false;
        }
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
      goToSection(currentSectionIndex.value + 1); // Passer à la slide suivante immédiatement si l'élément n'existe pas
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

    // Hide all bubble elements with fade out animation
    bubbleElements.forEach(element => {
      gsap.to(element, {
        autoAlpha: 0,
        duration: 0.5,
        ease: "power2.out"
      });
    });
    
    // Hide turtleBeach element
    if (turtleBeach) {
      gsap.to(turtleBeach, {
        autoAlpha: 0,
        duration: 0.5,
        ease: "power2.out"
      });
    }
    
    // Hide mzuH2Elements
    if (mzuH2Elements && mzuH2Elements.length) {
      gsap.to(mzuH2Elements, {
        autoAlpha: 0,
        duration: 0.5,
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
        animationStates.value['slide-20-text5Shown'] = true;
        // Maintenant que l'animation est terminée, passer à la slide suivante automatiquement
        setTimeout(() => {
          goToSection(currentSectionIndex.value + 1);
        }, 500); // Délai court pour que l'utilisateur puisse voir le texte avant de passer à la slide suivante
      }
    });
  };

  /**
   * Sets up continuous subtle animation for bubble text elements reacting to mouse movement
   * This animation will be active as long as the slide is visible
   */
  const setupBubblesMouseAnimation = (sectionElement) => {
    // Early return if animation is already set up - prevents multiple initialization
    if (animationStates.value['slide-20-bubbles-animated'] === true) return;

    // Get all bubble text elements
    const bubbleElements = [
      sectionElement.querySelector('#text-element-3'),
      sectionElement.querySelector('#text-element-0'),
      sectionElement.querySelector('#text-element-4'),
      sectionElement.querySelector('#text-element-2'),
      sectionElement.querySelector('#text-element-1')
    ].filter(el => el); // Filter out any null elements
  
    if (bubbleElements.length === 0) return;

    // Initialize mouse position variables
    let mouseX = 0, mouseY = 0;
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    // Function to update mouse position
    const updateMousePosition = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Add mouse move listener
    window.addEventListener('mousemove', updateMousePosition);
  
    // Animation parameters - different for each bubble to create organic movement
    const animParams = bubbleElements.map((_, i) => ({
      xFactor: 0.01 + (i * 0.005),   // Different x movement factor for each bubble
      yFactor: 0.01 + (i * 0.004),   // Different y movement factor for each bubble
      speedFactor: 0.1 + (i * 0.05)  // Different speed for each bubble
    }));
  
    // Set up the continuous animation for bubbles
    let animating = true;
  
    // Animation function that will run continuously
    const animateBubbles = () => {
      if (!animating) return;
    
      // Calculate normalized mouse position (0-1)
      const normalizedX = mouseX / windowWidth;
      const normalizedY = mouseY / windowHeight;
    
      // Animate each bubble element with subtle parallax effect
      bubbleElements.forEach((bubble, i) => {
        if (!bubble) return;
      
        // Calculate offsets based on mouse position - kept subtle
        const xOffset = (normalizedX - 0.5) * 20 * animParams[i].xFactor;
        const yOffset = (normalizedY - 0.5) * 15 * animParams[i].yFactor;
      
        // Apply the animation
        gsap.to(bubble, {
          x: xOffset,
          y: yOffset,
          duration: animParams[i].speedFactor,
          ease: 'power1.out'
        });
      });
    
      // Request next frame
      requestAnimationFrame(animateBubbles);
    };
  
    // Start the animation
    animateBubbles();
  
    // Handle window resize
    const handleResize = () => {
      windowWidth = window.innerWidth;
      windowHeight = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
  
    // Clean up function - used when the section is completely left
    const cleanupBubbleAnimation = () => {
      animating = false;
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('resize', handleResize);
      bubbleElements.forEach(bubble => {
        if (bubble) {
          gsap.killTweensOf(bubble);
        }
      });
    };
  
    // Store the cleanup function for later use
    animationStates.value['slide-20-bubbles-cleanup'] = cleanupBubbleAnimation;
  
    // Mark as initialized
    animationStates.value['slide-20-bubbles-animated'] = true;
  };

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
    // 0: animation initiale terminée, prêt pour case-study-item-1
    // 1: case-study-item-1 terminé, prêt pour case-study-item-2
    // 2: case-study-item-2 terminé, prêt pour case-study-item-3
    // 3: tous les items terminés, prêt pour passer à la slide suivante
    animationStates.value['slide-128'] = -1;

    // Initialisation: cacher tous les contenus d'étude de cas
    const caseStudyItems = Array.from(slide128Section.querySelectorAll('.case-study-item'));
    const caseStudyContents = Array.from(slide128Section.querySelectorAll('.case-study-content'));
    const caseStudyHeaders = Array.from(slide128Section.querySelectorAll('.case-study-header'));
  
    // Configuration initiale avec GSAP
    gsap.set(killerwuDiv, { autoAlpha: 0, y: 50 });
    caseStudyItems.forEach(item => {
      gsap.set(item, { color: '#000000' });
    });
    caseStudyContents.forEach(content => {
      gsap.set(content, { autoAlpha: 0, display: 'none' });
    });
    caseStudyHeaders.forEach(header => {
      header.classList.remove('active');
    });

    const st = ScrollTrigger.create({
      trigger: slide128Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: (self) => {
        console.log(`ScrollTrigger Composable: Slide 128 onEnter. Anim state: ${animationStates.value['slide-128']}, hasScrolledOnce: ${hasScrolledOnce.value}, currentIndex: ${currentSectionIndex.value}`);
      
        const slide128Index = sections.value.findIndex(s => s.id === 'slide-128');
      
        // Si c'est la première fois qu'on entre dans la slide
        if (animationStates.value['slide-128'] === -1) {
          // Ajouter un délai pour laisser la slide-128 apparaître d'abord
          console.log("ScrollTrigger Composable: Attente avant animation de killerwu...");
          
          // Attendre un délai avant de démarrer l'animation
          setTimeout(() => {
            // Animation initiale: faire apparaître #killerwu
            gsap.to(killerwuDiv, {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              ease: 'power2.out',
              onComplete: () => {
                console.log('ScrollTrigger Composable: Animation initiale slide 128 terminée.');
                // Prêt pour le premier item
                animationStates.value['slide-128'] = 0;
                
                // Activer automatiquement le premier élément case-study après un court délai
                setTimeout(() => {
                  // Le code suivant est extrait de la fonction activateNextCaseStudyItem
                  // mais appliqué directement pour le premier item
                  console.log("ScrollTrigger Composable: Activation automatique du premier case-study-item");
                  
                  const itemNumber = 1;
                  const itemToActivate = slide128Section.querySelector(`#case-study-item-${itemNumber}`);
                  const contentToShow = slide128Section.querySelector(`#case-study-content-${itemNumber}`);
                  const headerToActivate = itemToActivate ? itemToActivate.querySelector('.case-study-header') : null;
                  
                  if (itemToActivate && contentToShow) {
                    // D'abord fermer tous les contenus
                    closeAllCaseStudyItems();
                    
                    // Animation pour activer l'item et afficher son contenu
                    const timeline = gsap.timeline({
                      onComplete: () => {
                        console.log(`ScrollTrigger Composable: Animation de case-study-item-${itemNumber} terminée.`);
                        animationStates.value['slide-128'] = 1; // Mettre directement à 1 car c'est le premier item
                      }
                    });
                    
                    timeline.to(itemToActivate, {
                      color: '#ff0000',
                      duration: 0.4,
                      ease: 'power1.out'
                    });
                    
                    // Ajouter la classe active au header
                    if (headerToActivate) {
                      timeline.add(() => {
                        headerToActivate.classList.add('active');
                      }, "-=0.4");
                    }
                  
                    timeline.to(contentToShow, {
                      autoAlpha: 1,
                      display: 'block',
                      duration: 0.6,
                      ease: 'power2.out'
                    }, "-=0.2");
                  }
                }, 300); // Petit délai pour une transition visuelle plus agréable
              }
            });
          }, 800); // Délai de 800ms pour laisser la slide s'afficher d'abord
          
          self.disable(); // Désactive ce trigger après l'animation initiale
        }
      }
    });
    specificAnimationTriggers.push(st);

    // Fonction pour fermer tous les contenus et réinitialiser les styles/classes
    const closeAllCaseStudyItems = () => {
      // Réinitialiser la couleur de tous les items
      caseStudyItems.forEach(item => {
        gsap.to(item, {
          color: '#000000',
          duration: 0.3,
          ease: 'power1.out'
        });
      });
      
      // Cacher tous les contenus
      caseStudyContents.forEach(content => {
        gsap.to(content, {
          autoAlpha: 0,
          duration: 0.3,
          ease: 'power1.out',
          onComplete: () => {
            gsap.set(content, { display: 'none' });
          }
        });
      });
      
      // Retirer la classe active de tous les headers
      caseStudyHeaders.forEach(header => {
        header.classList.remove('active');
      });
    };

    // Fonction pour activer le prochain item d'étude de cas
    const activateNextCaseStudyItem = () => {
      const currentStep = animationStates.value['slide-128'];
    
      // Vérifier si tous les items sont déjà activés
      if (currentStep >= caseStudyItems.length) {
        console.log('ScrollTrigger Composable: Tous les items de slide 128 sont activés.');
        return false;
      }
    
      // Le numéro d'item à activer (1-indexed)
      const itemNumber = currentStep + 1;
      console.log(`ScrollTrigger Composable: Activation de case-study-item-${itemNumber}`);
    
      // Trouver les éléments à animer
      const itemToActivate = slide128Section.querySelector(`#case-study-item-${itemNumber}`);
      const contentToShow = slide128Section.querySelector(`#case-study-content-${itemNumber}`);
      const headerToActivate = itemToActivate ? itemToActivate.querySelector('.case-study-header') : null;
    
      if (!itemToActivate || !contentToShow) {
        console.warn(`ScrollTrigger Composable: Item ${itemNumber} ou son contenu non trouvé.`);
        animationStates.value['slide-128']++;
        return false;
      }
      
      // D'abord fermer tous les contenus existants
      closeAllCaseStudyItems();
    
      // Animation pour activer l'item et afficher son contenu
      const timeline = gsap.timeline({
        onComplete: () => {
          console.log(`ScrollTrigger Composable: Animation de case-study-item-${itemNumber} terminée.`);
          animationStates.value['slide-128']++;
          // Débloquer après l'animation
          isAnimating.value = false;
        }
      });
    
      timeline.to(itemToActivate, {
        color: '#ff0000',
        duration: 0.4,
        ease: 'power1.out'
      });
      
      // Ajouter la classe active au header
      if (headerToActivate) {
        timeline.add(() => {
          headerToActivate.classList.add('active');
        }, "-=0.4");
      }
    
      timeline.to(contentToShow, {
        autoAlpha: 1,
        display: 'block',
        duration: 0.6,
        ease: 'power2.out'
      }, "-=0.2");
    };

    // Observer la roue de la souris pour la progression séquentielle de slide 128
    const handleSlide128ScrollProgress = (e) => {
      // Vérifier si nous sommes actuellement sur la slide-128
      if (currentSectionIndex.value === sections.value.findIndex(s => s.id === 'slide-128')) {
        const currentStateValue = animationStates.value['slide-128'];
      
        // Si on essaie de scroller vers le bas et qu'il y a encore des items à activer
        if (e.deltaY > 0 && currentStateValue >= 0 && currentStateValue < caseStudyItems.length) {
          e.preventDefault();
          e.stopPropagation();
        
          // Activer le prochain item si ce n'est pas déjà en cours d'animation
          if (!isAnimating.value) {
            isAnimating.value = true;
            activateNextCaseStudyItem();
          }
        
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
        console.log(`ScrollTrigger Composable: Slide 59 onEnter. Anim state: ${animationStates.value['slide-59']}, currentIndex: ${currentSectionIndex.value}`);
      
        const slide59Index = sections.value.findIndex(s => s.id === 'slide-59');
      
        // Si l'animation n'a pas encore été jouée
        if (animationStates.value['slide-59'] === -1) {
          // Ajouter un délai pour laisser la slide-59 apparaître d'abord
          console.log("ScrollTrigger Composable: Attente avant animation de killerjunior...");
          
          // Attendre un délai avant de démarrer l'animation
          setTimeout(() => {
            // Animation: faire apparaître #killerjunior
            gsap.to(killerJuniorDiv, {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              ease: 'power2.out',
              onComplete: () => {
                console.log('ScrollTrigger Composable: Animation initiale slide 59 terminée.');
                // Marquer que killerjunior est affiché, prêt pour la suite de l'animation
                animationStates.value['slide-59'] = 0;
                
                // Lancer automatiquement l'animation de llass après un court délai
                if (llassImg) {
                  setTimeout(() => {
                    console.log("ScrollTrigger Composable: Animation automatique de llass...");
                    isAnimating.value = true;
                    
                    // Animation avec effet de remplissage progressif des arcs rouges (de droite à gauche)
                    gsap.to(llassImg, {
                      clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%)',
                      duration: 2.5,
                      ease: 'power1.inOut',
                      onComplete: () => {
                        console.log('ScrollTrigger Composable: Animation llass terminée.');
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

  const registerSlide23Animation = () => {
    console.log("Démarrage de registerSlide23Animation");

    // Attendre un peu pour que le DOM soit complètement chargé
    setTimeout(() => {
      // Récupérer la section slide-23 par son ID
      const slide23Section = document.getElementById('slide-23');
      if (!slide23Section) {
        console.warn('ScrollTrigger Composable: Section slide-23 non trouvée pour l\'animation.');
        return;
      }
      console.log("Slide-23 trouvée via document.getElementById:", slide23Section);

      // Mise à jour: cibler directement le div #joce dans la nouvelle structure
      const joceDiv = slide23Section.querySelector('#joce');
      if (!joceDiv) {
        console.warn('ScrollTrigger Composable: Div #joce non trouvée dans slide-23.');
        return;
      }
      console.log("Div #joce trouvée:", joceDiv);

      const perdrixSlides = Array.from(slide23Section.querySelectorAll('.perdrix-slide'));
      console.log("Nombre de .perdrix-slide trouvées:", perdrixSlides.length);

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
      let lastScrollTime = 0;
      const scrollCooldown = 750; // Délai minimum entre chaque animation (en ms)
      let lastDeltaY = 0;
      let cumulativeDeltaY = 0;
      const deltaYThreshold = 20; // Seuil pour déclencher une animation (ajustez selon sensibilité)

      // Fonction pour bloquer le défilement, fonctionne même sans fullpage_api
      const blockScrolling = () => {
        console.log("Blocage du défilement pour slide-23");
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
        console.log("Défilement libéré pour slide-23");
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

      // Gestionnaire d'événement pour les scrolls sur la slide-23
      const handlePerdrixScroll = (event) => {
        // Vérifier si nous sommes actuellement sur la slide-23
        const currentSlideId = sections.value[currentSectionIndex.value]?.id;
        console.log("handlePerdrixScroll - ID de la slide actuelle:", currentSlideId);
        
        if (currentSlideId !== 'slide-23') {
          console.log("handlePerdrixScroll - Pas sur la slide-23, événement ignoré");
          return; // Ne pas traiter l'événement si nous ne sommes pas sur la slide-23
        }

        // Toujours bloquer l'événement de défilement par défaut
        event.preventDefault();
        event.stopPropagation();

        // Ignorer si l'animation n'est pas au bon stade
        if (animationStates.value['slide-23'] < 0 || 
            animationStates.value['slide-23'] >= perdrixSlides.length) {
          console.log("Animation pas au bon stade, état:", animationStates.value['slide-23']);
          return;
        }
        
        // Mesurer le temps écoulé depuis le dernier scroll traité
        const now = Date.now();
        const timeSinceLastScroll = now - lastScrollTime;
        
        // IMPORTANT: Pour macOS/trackpad, deltaY peut avoir des valeurs positives ou négatives très petites
        // On considère que le scroll est vers le bas si deltaY > 0
        console.log("[SCROLL DEBUG] Direction:", event.deltaY > 0 ? "BAS" : "HAUT", 
                 "| Valeur:", event.deltaY.toFixed(2), 
                 "| Temps depuis dernier scroll:", timeSinceLastScroll, "ms", 
                 "| Animation en cours:", isAnimating, 
                 "| Cumul deltaY:", cumulativeDeltaY.toFixed(2));
        
        // Vérifier que le sens est vers le bas (deltaY > 0)
        if (event.deltaY <= 0) return;
        
        // Accumuler les deltaY pour détecter l'intention de scroll
        cumulativeDeltaY += event.deltaY;
        lastDeltaY = event.deltaY;
        
        // Si une animation est déjà en cours ou si le délai de cooldown n'est pas écoulé, ignorer l'événement
        if (isAnimating || timeSinceLastScroll < scrollCooldown) {
          console.log("[SCROLL DEBUG] Scroll ignoré - Animation en cours ou délai non écoulé");
          return;
        }
        
        // Vérifier si le seuil cumulatif est atteint
        if (cumulativeDeltaY < deltaYThreshold) {
          console.log("[SCROLL DEBUG] Seuil non atteint, accumulation: " + cumulativeDeltaY.toFixed(2) + "/" + deltaYThreshold);
          return;
        }
        
        // Marquer l'animation comme en cours
        isAnimating = true;
        lastScrollTime = now;
        cumulativeDeltaY = 0; // Réinitialiser l'accumulation
        
        console.log("[SCROLL DEBUG] Déclenchement de l'animation - Prochaine perdrix:", currentPerdrixIndex + 1);
        
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
          console.log(`[SCROLL DEBUG] Animation perdrix ${currentPerdrixIndex} - apparition`);
          // Laisser la transformation en place sur l'élément, mais changer juste l'opacité
          gsap.to(perdrixSlides[currentPerdrixIndex], {
            autoAlpha: 1,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => {
              animationStates.value['slide-23'] = currentPerdrixIndex + 1;
              console.log(`[SCROLL DEBUG] Animation terminée - État: ${animationStates.value['slide-23']}`);
              
              // Si c'est la dernière perdrix-slide, libérer le défilement
              if (currentPerdrixIndex === perdrixSlides.length - 1) {
                unblockScrolling();
                animationStates.value['slide-23'] = perdrixSlides.length;
                console.log('[SCROLL DEBUG] Animation slide-23 terminée, défilement libéré.');
              }
              
              // Réinitialiser le flag d'animation après un délai
              setTimeout(() => {
                isAnimating = false;
                console.log("[SCROLL DEBUG] Système prêt pour la prochaine animation");
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
          console.log(`ScrollTrigger Composable: Slide-23 onEnter. État d'animation: ${animationStates.value['slide-23']}`);
      
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
                console.log('ScrollTrigger Composable: #slide-23 affiché, prêt pour la première perdrix-slide.');
                
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
                      console.log(`Première perdrix affichée, état: ${animationStates.value['slide-23']}`);
                      
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
            console.log("Réinitialisation de l'animation slide-23 lors du retour en arrière");
            
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

  const goToSection = (index, duration = 1) => {
    console.log(`ScrollTrigger Composable: Tentative goToSection(${index}). Actuel: ${currentSectionIndex.value}, isNavigating: ${isNavigating.value}`);
    if (index < 0 || index >= sections.value.length || (isNavigating.value && duration !== 0)) {
      console.log('ScrollTrigger Composable: goToSection bloqué (limites ou navigation en cours)');
      return; // Ne pas retourner si duration === 0 pour permettre la mise en place initiale
    }
    if (index === currentSectionIndex.value && duration !== 0) {
      console.log('ScrollTrigger Composable: goToSection bloqué (déjà sur la section)');
      return;
    }

    const currentSectionElement = sections.value[currentSectionIndex.value];
    
    // BLOCAGE STRICT pour slide-23: empêcher de quitter la slide tant que l'animation n'est pas terminée
    if (currentSectionElement && currentSectionElement.id === 'slide-23') {
      const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
      // Vérifier si l'animation des perdrix-slides n'est pas terminée
      if (animationStates.value['slide-23'] !== undefined && 
          animationStates.value['slide-23'] < perdrixSlides.length) {
        console.log("ScrollTrigger Composable: Navigation depuis slide-23 BLOQUÉE - Animation perdrix en cours.");
        return; // Blocage strict de la navigation
      }
    }
    
    // Blocage pour slide-73
    if (currentSectionElement && currentSectionElement.id === 'slide-73' && animationStates.value['slide-73'] !== true) {
      console.log("ScrollTrigger Composable: Tentative de navigation depuis slide 73 avant fin animation. Bloqué.");
      return;
    }
    
    // Blocage pour slide-59
    if (currentSectionElement && currentSectionElement.id === 'slide-59' && 
        animationStates.value['slide-59'] !== 1 && // L'animation n'est pas complète
        index > currentSectionIndex.value) { // Seulement bloquer vers le bas
      console.log("ScrollTrigger Composable: Navigation depuis slide-59 bloquée (animation en cours).");
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

  // --- Configuration des Observateurs et Gestionnaires d'Événements ---

  /**
   * Configure les observateurs de défilement (molette, tactile) et les écouteurs de clavier.
   */
  const setupFullpageObserver = () => {
    if (sections.value.length === 0) return;

    stObserve = ScrollTrigger.observe({
      target: SCROLLER_SELECTOR,
      type: "wheel,touch",
      debounce: false,
      onUp: () => {
        handleFirstInteraction();
        if (isNavigating.value) return;
        
        // Bloquer le défilement vers le haut si on est sur slide-23 et l'animation n'est pas terminée
        const currentSectionElement = sections.value[currentSectionIndex.value];
        if (currentSectionElement && currentSectionElement.id === 'slide-23') {
          const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined &&
              animationStates.value['slide-23'] <= perdrixSlides.length) {
            return; // Bloquer le défilement
          }
        }
        
        goToSection(currentSectionIndex.value - 1);
      },
      onDown: () => {
        handleFirstInteraction();
        if (isNavigating.value) return;
        
        const currentSectionElement = sections.value[currentSectionIndex.value];
        
        // Gérer le cas spécial pour slide-73
        if (currentSectionElement && currentSectionElement.id === 'slide-73' && 
          animationStates.value['slide-73'] !== true) {
          return;
        }
        
        // Gérer le cas spécial pour slide-20
        if (currentSectionElement && currentSectionElement.id === 'slide-20') {
          // Si l'animation initiale est terminée mais text-element-5 pas encore affiché
          if (animationStates.value['slide-20-initialAnimPlayed'] && 
              !animationStates.value['slide-20-text5Shown']) {
            // Afficher text-element-5
            playSlide20Text5Animation(currentSectionElement);
            return; // Bloquer le défilement pour le moment
          }
        }
        
        // Gérer le cas spécial pour slide-23
        if (currentSectionElement && currentSectionElement.id === 'slide-23') {
          const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined && 
              animationStates.value['slide-23'] <= perdrixSlides.length) {
            return; // Bloquer le défilement
          }
        }
        
        goToSection(currentSectionIndex.value + 1);
      },
    });

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
              animationStates.value['slide-23'] <= perdrixSlides.length) {
            return; // Bloquer la navigation vers le bas
          }
        }
        
        // Bloquer la navigation de slide-22 vers slide-23 si l'animation de slide-23 n'est pas terminée
        const slide23Index = sections.value.findIndex(s => s.id === 'slide-23');
        if (newIndex + 1 === slide23Index) {
          const slide23Section = sections.value[slide23Index];
          const perdrixSlides = Array.from(slide23Section.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined && 
              animationStates.value['slide-23'] <= perdrixSlides.length) {
            return; // Bloquer la navigation
          }
        }
        
        newIndex++;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        
        // Bloquer la navigation de slide-23 vers slide-22
        if (currentSectionElement && currentSectionElement.id === 'slide-23') {
          const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined && 
              animationStates.value['slide-23'] <= perdrixSlides.length) {
            return; // Bloquer la navigation vers le haut
          }
        }
        
        // Bloquer la navigation de slide-59 vers slide-23 si l'animation de slide-23 n'est pas terminée
        const slide23Index = sections.value.findIndex(s => s.id === 'slide-23');
        if (currentSectionIndex.value - 1 === slide23Index) {
          const slide23Section = sections.value[slide23Index];
          const perdrixSlides = Array.from(slide23Section.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined && 
              animationStates.value['slide-23'] <= perdrixSlides.length) {
            return; // Bloquer la navigation
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

  /**
   * Initialise le composable avec les éléments de section.
   * @param {HTMLElement[]} sectionsElements - Un tableau d'éléments DOM représentant les sections.
   */
  const init = (sectionsElements, options = {}) => {
    if (!Array.isArray(sectionsElements) || sectionsElements.some(el => !(el instanceof HTMLElement))) {
      return;
    }
    sections.value = sectionsElements;

    console.log('ScrollTrigger Composable: Initialisation avec sections:', sections.value.length, sections.value.map(s=>s.id));
    
    if (sections.value.length > 0) {
      // hasScrolledOnce est initialisé à false par défaut.
      // La logique pour différer l'animation de la slide 73 (si première) est dans son onEnter.
      registerSlide73Animation(); // Enregistrer après que sections.value soit défini
      registerSlide128Animation(options.slide128 || {}); // Enregistrer l'animation pour la slide 128
      registerSlide59Animation(); // Enregistrer l'animation pour la slide 59
      registerSlide21Animation();
      registerSlide20Animation(); // Ajouter l'enregistrement de slide-20
      registerSlide22Animation();
      registerSlide23Animation(); // Ajouter l'animation pour slide-23
      setupFullpageObserver(); // Configurer les observateurs après que sections.value soit défini
      goToSection(0, 0); // Aller à la première section sans animation
    }
  };

  /**
   * Nettoie les instances de ScrollTrigger, les écouteurs d'événements et les tweens GSAP.
   */
  const cleanup = () => {
    console.log("ScrollTrigger Composable: Nettoyage...");
    if (stObserve) {
      stObserve.kill();
      stObserve = null;
    }
    if (keyboardListener.value) {
      window.removeEventListener('keydown', keyboardListener.value);
      keyboardListener.value = null;
    }
    specificAnimationTriggers.forEach(st => st.kill());
    specificAnimationTriggers.length = 0;
    
    // Nettoyage des event listeners spécifiques aux slides
    slideSpecificEventListeners.forEach(listener => {
      listener.element.removeEventListener(listener.event, listener.handler);
    });
    slideSpecificEventListeners.length = 0;
    
    gsap.killTweensOf(SCROLLER_SELECTOR); // Cible le conteneur de défilement
    // Réinitialiser les refs si nécessaire pour une réinitialisation complète
    currentSectionIndex.value = 0;
    isNavigating.value = false;
    isAnimating.value = false;
    hasScrolledOnce.value = false;
    Object.keys(animationStates.value).forEach(key => delete animationStates.value[key]);
    sections.value = [];
  };

  onUnmounted(cleanup);

  return {
    currentSectionIndex,
    isNavigating,
    init,
    goToSection,
    // cleanup n'est généralement pas exposé car géré par onUnmounted
  };
}