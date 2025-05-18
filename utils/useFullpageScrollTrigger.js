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

  // --- Logique de Navigation ---

  const goToSection = (index, duration = 1) => {
    if (index < 0 || index >= sections.value.length || (isNavigating.value && duration !== 0)) {
      return;
    }
    if (index === currentSectionIndex.value && duration !== 0) {
      return;
    }

    const previousSectionElement = sections.value[currentSectionIndex.value];
    const targetSectionElement = sections.value[index];

    // Vérifications pour bloquer le défilement
    if (previousSectionElement && previousSectionElement.id === 'slide-73' && 
      animationStates.value['slide-73'] !== true && index > currentSectionIndex.value) {
      return;
    }
    
    // Bloquer le défilement de slide-20 vers slide-21 si text-element-5 n'est pas affiché
    if (previousSectionElement && previousSectionElement.id === 'slide-20' && 
      !animationStates.value['slide-20-text5Shown'] && index > currentSectionIndex.value) {
      return;
    }

    isNavigating.value = true;
    gsap.to(SCROLLER_SELECTOR, {
      scrollTo: { y: targetSectionElement, autoKill: false },
      duration: duration,
      ease: 'power2.inOut',
      onStart: () => {
        currentSectionIndex.value = index;
      },
      onComplete: () => {
        // Animation initiale pour slide-20
        if (targetSectionElement && targetSectionElement.id === 'slide-20' && 
          !animationStates.value['slide-20-initialAnimPlayed']) {
          // Garder isNavigating à true pendant l'animation
          playSlide20InitialAnimation(targetSectionElement);
        } 
        // Animation pour slide-21
        else if (targetSectionElement && targetSectionElement.id === 'slide-21' && 
                 !animationStates.value['slide-21-playedOnce']) {
          const thoiathoingDiv = targetSectionElement.querySelector('#thoiathoing');
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
        
        if (targetSectionElement && targetSectionElement.id === 'slide-22' && !animationStates.value['slide-22-played']) {
          const thoiathoingDiv = targetSectionElement.querySelector('#thoiathoing');
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
        
        // Bloquer pour slide-73
        if (currentSectionElement && currentSectionElement.id === 'slide-73' && 
          animationStates.value['slide-73'] !== true) {
          return;
        }
        
        // Gérer le cas spécial pour slide-20
        if (currentSectionElement && currentSectionElement.id === 'slide-20') {
          if (animationStates.value['slide-20-initialAnimPlayed'] && 
              !animationStates.value['slide-20-text5Shown']) {
            playSlide20Text5Animation(currentSectionElement);
            return;
          }
        }
        
        newIndex++;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
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
  const init = (sectionsElements) => {
    if (!Array.isArray(sectionsElements) || sectionsElements.some(el => !(el instanceof HTMLElement))) {
      return;
    }
    sections.value = sectionsElements;

    if (sections.value.length > 0) {
      nextTick(() => {
        registerSlide73Animation();
        registerSlide21Animation();
        registerSlide20Animation(); // Ajouter l'enregistrement de slide-20
        registerSlide22Animation();
        setupFullpageObserver();
        goToSection(0, 0); 
        ScrollTrigger.refresh();
      });
    }
  };

  /**
   * Nettoie les instances de ScrollTrigger, les écouteurs d'événements et les tweens GSAP.
   */
  const cleanup = () => {
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
    gsap.killTweensOf(SCROLLER_SELECTOR);

    // Réinitialisation de l'état
    currentSectionIndex.value = 0;
    isNavigating.value = false;
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