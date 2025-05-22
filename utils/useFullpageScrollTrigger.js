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
  
  // Constantes
  const SCROLLER_SELECTOR = "#master-scroll-container";
  
  // Variables internes de gestion
  let stObserve = null;
  const keyboardListener = ref(null);
  const specificAnimationTriggers = [];
  const slideSpecificEventListeners = [];

  // Détection macOS et configuration du debounce pour le trackpad
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const MAC_TRACKPAD_SCROLL_DEBOUNCE_MS = 400; // Ajustez cette valeur si nécessaire (en ms)
  let macScrollUpTimeoutId = null;
  let macScrollDownTimeoutId = null;

  // Variables pour débouncer les interations spécifiques à chaque slide
  let macScrollSlide20TimeoutId = null;
  let macScrollSlide23TimeoutId = null;
  let macScrollSlide73TimeoutId = null;
  let macScrollSlide128TimeoutId = null;
  let lastInteractionTime = 0; // Horodatage de la dernière interaction

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
          
          console.log('Slide-73: Début de l\'animation - état changé à pending_st');
          animationStates.value['slide-73'] = 'pending_st'; // ST prend le relais

          if (pointsFortDiv) {
            gsap.to(pointsFortDiv, {
              x: 0,
              duration: 0.8,
              ease: 'power2.out',
              onComplete: () => {
                if (animationStates.value['slide-73'] === 'pending_st') {
                  // Ajouter un délai avant de permettre le scroll vers la prochaine slide
                  // Ceci permet d'éviter qu'un seul événement de scroll déclenche à la fois
                  // l'animation et le passage à la slide suivante
                  console.log('Slide-73: Animation des points-fort terminée - début du délai de 800ms');
                  setTimeout(() => {
                    animationStates.value['slide-73'] = true;
                    console.log('Slide-73: Animation terminée, scroll vers la slide suivante maintenant possible');
                  }, 800); // 800ms de délai supplémentaire
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
      },
      onEnterBack: () => {
        // En remontant depuis la slide suivante
        if (textElement5) gsap.set(textElement5, { autoAlpha: 1, y: 0 });
        if (turtleBeach) gsap.set(turtleBeach, { scale: 1, autoAlpha: 1 });
        if (mzuH2Elements) gsap.set(mzuH2Elements, { autoAlpha: 1, y: 0 });
        if (textElement3) gsap.set(textElement3, { autoAlpha: 1, y: 0 });
        if (textElement0) gsap.set(textElement0, { autoAlpha: 1, y: 0 });
        if (textElement4) gsap.set(textElement4, { autoAlpha: 1, y: 0 });
        if (textElement2) gsap.set(textElement2, { autoAlpha: 1, y: 0 });
        if (textElement1) gsap.set(textElement1, { autoAlpha: 1, y: 0 });
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
        
        // Aucune animation de bulles nécessaire
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
        
        // Aucune animation de bulles à nettoyer
      },
      onLeaveBack: () => {
        // Si on quitte vers le haut avant d'avoir terminé l'animation initiale
        if (!animationStates.value['slide-20-initialAnimPlayed']) {
          resetSlide20Elements(turtleBeach, mzuH2Elements, textElement3, textElement0, 
                            textElement4, textElement2, textElement1);
        }
        
        // Aucune animation de bulles à nettoyer
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

      
        const slide128Index = sections.value.findIndex(s => s.id === 'slide-128');
      
        // Si c'est la première fois qu'on entre dans la slide
        if (animationStates.value['slide-128'] === -1) {
          // Ajouter un délai pour laisser la slide-128 apparaître d'abord

          
          // Attendre un délai avant de démarrer l'animation
          setTimeout(() => {
            // Animation initiale: faire apparaître #killerwu
            gsap.to(killerwuDiv, {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              ease: 'power2.out',
              onComplete: () => {

                // Prêt pour le premier item
                animationStates.value['slide-128'] = 0;
                
                // Activer automatiquement le premier élément case-study après un court délai
                setTimeout(() => {
                  // Le code suivant est extrait de la fonction activateNextCaseStudyItem
                  // mais appliqué directement pour le premier item

                  
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

        return false;
      }
    
      // Le numéro d'item à activer (1-indexed)
      const itemNumber = currentStep + 1;

    
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
    
    /**
     * Fonction utilitaire pour avancer manuellement au prochain case-study-item
     * Peut être appelée depuis le clavier ou les swipes mobiles
     */
    window.advanceCaseStudyItem = (sectionElement) => {
      // Vérifier que nous sommes sur la bonne slide
      if (!sectionElement || sectionElement.id !== 'slide-128') return false;
      
      // Vérifier si on est dans un état valide pour avancer
      const currentStep = animationStates.value['slide-128'];
      if (currentStep < 0 || currentStep >= caseStudyItems.length) {
        return false;
      }
      
      // N'avancer que si aucune animation n'est en cours
      if (!isAnimating.value) {
        isAnimating.value = true;
        activateNextCaseStudyItem();
        return true;
      }
      
      return false;
    };
  
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
      let lastScrollTime = 0;
      const scrollCooldown = 0; // Délai minimum entre chaque animation (en ms)
      let lastDeltaY = 0;
      let cumulativeDeltaY = 0;
      const deltaYThreshold = 20; // Seuil pour déclencher une animation (ajustez selon sensibilité)

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
        // Vérifier si nous sommes actuellement sur la slide-23
        const currentSlideId = sections.value[currentSectionIndex.value]?.id;
        
        if (currentSlideId !== 'slide-23') {
          // Si l'écouteur est toujours actif mais qu'on n'est plus sur slide-23,
          // il est préférable de le retirer pour éviter des traitements inutiles.
          // Cependant, la logique de cleanup devrait s'en charger.
          // Pour l'instant, on retourne simplement.
          postSequenceDeltaY = 0; // Réinitialiser si on quitte la slide
          return; 
        }

        // Si la séquence d'animation des perdrix est complètement terminée
        if (animationStates.value['slide-23'] === perdrixSlides.length) {


          // 1. S'assurer que le scroll est bien débloqué.
          if (isNavigating.value) {

            unblockScrolling(); // Assure la libération
          }
          
          // 2. Accumuler le deltaY pour potentiellement forcer le changement de slide
          postSequenceDeltaY += Math.abs(event.deltaY);

          
          // 3. Si l'accumulation dépasse le seuil, forcer le changement de slide
          if (postSequenceDeltaY >= POST_SEQUENCE_THRESHOLD) {
            // Déterminer la direction et appeler goToSection en conséquence
            if (event.deltaY > 0) {

              postSequenceDeltaY = 0; // Réinitialiser l'accumulateur
              event.preventDefault(); // Empêcher les comportements par défaut
              event.stopPropagation();
              goToSection(currentSectionIndex.value + 1); // Aller à la slide suivante
              return;
            } else if (event.deltaY < 0) {

              postSequenceDeltaY = 0; // Réinitialiser l'accumulateur
              event.preventDefault(); // Empêcher les comportements par défaut
              event.stopPropagation();
              goToSection(currentSectionIndex.value - 1); // Aller à la slide précédente
              return;
            }
          }
          
          // 4. Laisser le scroll se propager si on n'a pas forcé de changement

          return; 
        }
        
        // Si l'état de l'animation n'est pas valide pour une gestion active 
        // (par exemple, -1 avant initialisation complète par onEnter, ou > perdrixSlides.length)
        if (animationStates.value['slide-23'] < 0 || animationStates.value['slide-23'] > perdrixSlides.length) {

           return; 
        }

        // À ce stade :
        // 1. Nous sommes sur slide-23.
        // 2. Les animations Perdrix ne sont PAS encore terminées (état de 0 à perdrixSlides.length - 1).
        // 3. Nous DEVONS contrôler le scroll pour les slides perdrix.

        event.preventDefault(); // Bloquer le défilement par défaut UNIQUEMENT MAINTENANT.
        event.stopPropagation();

        // Mesurer le temps écoulé depuis le dernier scroll traité
        const now = Date.now();
        const timeSinceLastScroll = now - lastScrollTime;
        
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
        lastScrollTime = now;
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
      
      /**
       * Fonction utilitaire pour avancer manuellement dans les perdrix-slides
       * Peut être appelée depuis le clavier ou les swipes mobiles
       */
      window.advancePerdrixSlide = (sectionElement) => {
        // Si nous ne sommes pas sur slide-23, ne rien faire
        if (!sectionElement || sectionElement.id !== 'slide-23') return false;
        
        // Vérifier si on est dans un état valide pour avancer
        if (animationStates.value['slide-23'] < 0 || 
            animationStates.value['slide-23'] >= perdrixSlides.length) {
          return false;
        }
        
        // Simuler un scroll vers le bas pour déclencher l'animation
        const fakeEvent = { deltaY: 100, preventDefault: () => {}, stopPropagation: () => {} };
        handlePerdrixScroll(fakeEvent);
        return true;
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
        const targetSectionOnStart = sections.value[index];
        if (targetSectionOnStart && targetSectionOnStart.id === 'slide-20') {
          const textElement5 = targetSectionOnStart.querySelector('#text-element-5');
          if (textElement5) {
            gsap.set(textElement5, { autoAlpha: 0, y: 50 }); // Cacher dès le début de la transition
          }
        }
      },
      onComplete: () => {
        const targetSection = sections.value[index]; // Récupérer la section cible ici

        // Si on arrive sur slide-20
        if (targetSection && targetSection.id === 'slide-20') {
          // text-element-5 est déjà caché par onStart, la ligne suivante n'est plus nécessaire ici
          // const textElement5 = targetSection.querySelector('#text-element-5');
          // if (textElement5) {
          //   gsap.set(textElement5, { autoAlpha: 0, y: 50 }); 
          // }
          animationStates.value['slide-20-text5Shown'] = false; // Toujours réinitialiser son état

          if (!animationStates.value['slide-20-initialAnimPlayed']) {
            playSlide20InitialAnimation(targetSection); // Jouer l'anim complète si jamais jouée
          } else {
            // Si l'anim initiale a déjà été jouée, s'assurer que les bulles sont visibles
            // car playSlide20InitialAnimation (qui les montre) ne sera pas appelée.
            const textElementsToReset = ['#text-element-3', '#text-element-0', '#text-element-4', '#text-element-2', '#text-element-1']
              .map(sel => targetSection.querySelector(sel))
              .filter(el => el);
            gsap.to(textElementsToReset, { autoAlpha: 1, y: 0, duration: 0.01 }); // Presque instantané pour les (ré)afficher
          }
          isNavigating.value = false; // Fin de navigation spécifique à slide-20
        } 
        // Animation pour slide-21
        else if (targetSection && targetSection.id === 'slide-21' && 
                 !animationStates.value['slide-21-playedOnce']) {
          const thoiathoingDiv = targetSection.querySelector('#thoiathoing');
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
            animationStates.value['slide-21-playedOnce'] = true; // Marquer comme fait même si l'élément n'est pas trouvé
          }
          isNavigating.value = false; // Fin de navigation spécifique à slide-21
        }
        // Animation pour slide-22
        else if (targetSection && targetSection.id === 'slide-22' && !animationStates.value['slide-22-played']) {
          const thoiathoingDiv = targetSection.querySelector('#thoiathoing');
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
            animationStates.value['slide-22-played'] = true; // Marquer comme fait même si l'élément n'est pas trouvé
          }
          isNavigating.value = false; // Fin de navigation spécifique à slide-22
        } else {
          // Pour toutes les autres slides, ou si les conditions spécifiques ne sont pas remplies
          isNavigating.value = false;
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
      debounce: false,
      onUp: (self) => {
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
        
        // Ajout: Gestion spécifique pour slide-20 sur swipe vers le haut (comme sur onDown)
        if (currentSectionElement && currentSectionElement.id === 'slide-20') {
          if (animationStates.value['slide-20-initialAnimPlayed'] && !animationStates.value['slide-20-text5Shown']) {
            playSlide20Text5Animation(currentSectionElement);
            return; 
          }
        }
        
        const event = self.event; // Accéder à l'événement original
        const isMobile = window.innerWidth <= 768; // Détection simplifiée du mobile
        
        // Action de navigation par défaut pour "onUp"
        const navigateDefaultUp = () => goToSection(currentSectionIndex.value - 1);
        // Action de navigation inversée pour mobile pour "onUp"
        const navigateMobileUpInverted = () => goToSection(currentSectionIndex.value + 1);

        if (isMac && event.type === 'wheel') { // Si c'est un Mac et un événement de molette
          clearTimeout(macScrollUpTimeoutId);
          console.log(`Mac Trackpad (UP): Début debounce ${MAC_TRACKPAD_SCROLL_DEBOUNCE_MS}ms...`);
          macScrollUpTimeoutId = setTimeout(() => {
            console.log(`Mac Trackpad (UP): Fin debounce ${MAC_TRACKPAD_SCROLL_DEBOUNCE_MS}ms. Navigation !`);
            navigateDefaultUp();
          }, MAC_TRACKPAD_SCROLL_DEBOUNCE_MS);
        } else if (event.type.startsWith('touch') && isMobile) { // Si c'est un swipe tactile sur mobile
          navigateMobileUpInverted(); // Swipe HAUT sur mobile -> SUIVANT
        } else { // Pour tous les autres cas (molette non-Mac, etc.)
          navigateDefaultUp();
        }
      },
      onDown: (self) => {
        handleFirstInteraction();
        if (isNavigating.value) return;

        const event = self.event; // Accéder à l'événement original
        const isMobile = window.innerWidth <= 768; // Détection simplifiée du mobile
        
        // Logique de blocage spécifique à onDown (exemples: slides 73, 20, 23)
        const currentSectionElement = sections.value[currentSectionIndex.value];
        if (currentSectionElement && currentSectionElement.id === 'slide-73' && animationStates.value['slide-73'] !== true) {
          return;
        }
        if (currentSectionElement && currentSectionElement.id === 'slide-20') {
          if (animationStates.value['slide-20-initialAnimPlayed'] && !animationStates.value['slide-20-text5Shown']) {
            playSlide20Text5Animation(currentSectionElement);
            return; 
          }
        }
        if (currentSectionElement && currentSectionElement.id === 'slide-23') {
          const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined && 
              animationStates.value['slide-23'] < perdrixSlides.length) {
            return; 
          }
        }

        // Action de navigation par défaut pour "onDown"
        const navigateDefaultDown = () => goToSection(currentSectionIndex.value + 1);
        // Action de navigation inversée pour mobile pour "onDown"
        const navigateMobileDownInverted = () => goToSection(currentSectionIndex.value - 1);

        if (isMac && event.type === 'wheel') { // Si c'est un Mac et un événement de molette
          clearTimeout(macScrollDownTimeoutId);
          console.log(`Mac Trackpad (DOWN): Début debounce ${MAC_TRACKPAD_SCROLL_DEBOUNCE_MS}ms...`);
          macScrollDownTimeoutId = setTimeout(() => {
            console.log(`Mac Trackpad (DOWN): Fin debounce ${MAC_TRACKPAD_SCROLL_DEBOUNCE_MS}ms. Navigation !`);
            navigateDefaultDown();
          }, MAC_TRACKPAD_SCROLL_DEBOUNCE_MS);
        } else if (event.type.startsWith('touch') && isMobile) { // Si c'est un swipe tactile sur mobile
          const currentSectionElementForTouch = sections.value[currentSectionIndex.value]; // Need to get currentSectionElement here as it might not be defined in this scope
          
          // Gestion du swipe pour slide-20
          if (currentSectionElementForTouch && currentSectionElementForTouch.id === 'slide-20') {
            if (animationStates.value['slide-20-initialAnimPlayed'] && !animationStates.value['slide-20-text5Shown']) {
              playSlide20Text5Animation(currentSectionElementForTouch);
              return; 
            }
          }
          
          // Gestion du swipe pour slide-23
          if (currentSectionElementForTouch && currentSectionElementForTouch.id === 'slide-23') {
            const perdrixSlides = Array.from(currentSectionElementForTouch.querySelectorAll('.perdrix-slide'));
            if (animationStates.value['slide-23'] !== undefined && 
                animationStates.value['slide-23'] < perdrixSlides.length) {
              // Avancer à la prochaine perdrix-slide avec protection contre les scrolls multiples
              if (window.advancePerdrixSlide) {
                if (isMac && event.type === 'wheel') {
                  clearTimeout(macScrollSlide23TimeoutId);
                  console.log(`Mac Trackpad (Slide-23): Début debounce ${MAC_TRACKPAD_SCROLL_DEBOUNCE_MS}ms...`);
                  macScrollSlide23TimeoutId = setTimeout(() => {
                    console.log(`Mac Trackpad (Slide-23): Fin debounce ${MAC_TRACKPAD_SCROLL_DEBOUNCE_MS}ms. Animation!`);
                    window.advancePerdrixSlide(currentSectionElementForTouch);
                  }, MAC_TRACKPAD_SCROLL_DEBOUNCE_MS);
                } else {
                  window.advancePerdrixSlide(currentSectionElementForTouch);
                }
              }
              return;
            }
          }
          
          // Gestion du swipe pour slide-128
          if (currentSectionElementForTouch && currentSectionElementForTouch.id === 'slide-128') {
            const currentStep = animationStates.value['slide-128'];
            // Vérifier si on est dans un état valide pour avancer
            if (currentStep >= 0 && currentStep < 3) { // 3 est le nombre de case-study-items
              // Avancer au prochain case-study-item avec protection contre les scrolls multiples
              if (window.advanceCaseStudyItem) {
                if (isMac && event.type === 'wheel') {
                  clearTimeout(macScrollSlide128TimeoutId);
                  console.log(`Mac Trackpad (Slide-128): Début debounce ${MAC_TRACKPAD_SCROLL_DEBOUNCE_MS}ms...`);
                  macScrollSlide128TimeoutId = setTimeout(() => {
                    console.log(`Mac Trackpad (Slide-128): Fin debounce ${MAC_TRACKPAD_SCROLL_DEBOUNCE_MS}ms. Animation!`);
                    window.advanceCaseStudyItem(currentSectionElementForTouch);
                  }, MAC_TRACKPAD_SCROLL_DEBOUNCE_MS);
                } else {
                  window.advanceCaseStudyItem(currentSectionElementForTouch);
                }
              }
              return;
            }
          }
          navigateMobileDownInverted(); // Swipe BAS sur mobile -> PRÉCÉDENT
        } else { // Pour tous les autres cas (molette non-Mac, etc.)
          navigateDefaultDown();
        }
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
        
        // Blocage pour slide-59 (vérifier si cette logique est toujours désirée pour le clavier)
        // if (currentSectionElement && currentSectionElement.id === 'slide-59' && 
        //     animationStates.value['slide-59'] !== 1 && 
        //     newIndex > currentSectionIndex.value) { 
        //   return;
        // }
        
        // Blocage pour slide-20
        if (currentSectionElement && currentSectionElement.id === 'slide-20') {
          if (animationStates.value['slide-20-initialAnimPlayed'] && !animationStates.value['slide-20-text5Shown']) {
            // Protection contre les scrolls multiples
            if (isMac && event.type === 'wheel') {
              clearTimeout(macScrollSlide20TimeoutId);
              console.log(`Mac Trackpad (Slide-20): Début debounce ${MAC_TRACKPAD_SCROLL_DEBOUNCE_MS}ms...`);
              macScrollSlide20TimeoutId = setTimeout(() => {
                console.log(`Mac Trackpad (Slide-20): Fin debounce ${MAC_TRACKPAD_SCROLL_DEBOUNCE_MS}ms. Animation!`);
                playSlide20Text5Animation(currentSectionElement);
              }, MAC_TRACKPAD_SCROLL_DEBOUNCE_MS);
            } else {
              playSlide20Text5Animation(currentSectionElement);
            }
            return;
          }
        }
        
        // Piloter l'animation des perdrix-slides avec les touches du clavier
        if (currentSectionElement && currentSectionElement.id === 'slide-23') {
          const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined && 
              animationStates.value['slide-23'] < perdrixSlides.length) {
            // Avancer à la prochaine perdrix-slide avec protection contre les interactions multiples
            if (window.advancePerdrixSlide) {
              const now = Date.now();
              const timeSinceLastInteraction = now - lastInteractionTime;
              
              if (timeSinceLastInteraction < MAC_TRACKPAD_SCROLL_DEBOUNCE_MS) {
                console.log(`Clavier (Slide-23): Ignoré - trop rapproché (${timeSinceLastInteraction}ms)`);
                return;
              }
              
              lastInteractionTime = now;
              window.advancePerdrixSlide(currentSectionElement);
            }
            return;
          }
        }
        
        // Piloter l'animation des case-study-items avec les touches du clavier
        if (currentSectionElement && currentSectionElement.id === 'slide-128') {
          const currentStep = animationStates.value['slide-128'];
          // Vérifier si on est dans un état valide pour avancer
          if (currentStep >= 0 && currentStep < 3) { // 3 est le nombre de case-study-items
            // Avancer au prochain case-study-item avec protection contre les interactions multiples
            if (window.advanceCaseStudyItem) {
              const now = Date.now();
              const timeSinceLastInteraction = now - lastInteractionTime;
              
              if (timeSinceLastInteraction < MAC_TRACKPAD_SCROLL_DEBOUNCE_MS) {
                console.log(`Clavier (Slide-128): Ignoré - trop rapproché (${timeSinceLastInteraction}ms)`);
                return;
              }
              
              lastInteractionTime = now;
              window.advanceCaseStudyItem(currentSectionElement);
            }
            return;
          }
        }
        
        newIndex++;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        
        // Bloquer la navigation de slide-23 vers slide-22 (vérifier si cette logique est toujours désirée pour le clavier)
        if (currentSectionElement && currentSectionElement.id === 'slide-23') {
          const perdrixSlides = Array.from(currentSectionElement.querySelectorAll('.perdrix-slide'));
          if (animationStates.value['slide-23'] !== undefined &&
              animationStates.value['slide-23'] <= perdrixSlides.length) {
            return; 
          }
        }
        
        // Bloquer la navigation de slide-59 vers slide-23 (vérifier si cette logique est toujours désirée pour le clavier)
        // const slide23Index = sections.value.findIndex(s => s.id === 'slide-23');
        // if (currentSectionIndex.value - 1 === slide23Index) {
        //   const slide23Section = sections.value[slide23Index];
        //   const perdrixSlides = Array.from(slide23Section.querySelectorAll('.perdrix-slide'));
        //   if (animationStates.value['slide-23'] !== undefined && 
        //       animationStates.value['slide-23'] <= perdrixSlides.length) {
        //     return; 
        //   }
        // }
        
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