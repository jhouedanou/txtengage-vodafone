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

  // ===========================================================================
  // SECTION 2: FONCTIONS UTILITAIRES
  // ===========================================================================

  const goToSection = (index, duration = 1.2) => {
    if (index < 0 || index >= sections.value.length || isNavigating.value) return;

    console.log(`🚀 Navigation vers section ${index}`);
    isNavigating.value = true;
    currentSectionIndex.value = index;

    const targetSection = sections.value[index];

    gsap.to(SCROLLER_SELECTOR, {
      scrollTo: { y: targetSection, autoKill: false },
      duration: duration,
      ease: "power2.inOut",
      onComplete: () => {
        console.log(`✅ Navigation terminée vers section ${index}`);
        isNavigating.value = false;
        hasScrolledOnce.value = true;

        // Déclencher les animations automatiques à l'arrivée sur certaines slides
        if (targetSection.id === 'slide-21') {
          triggerSlide21Animation();
        } else if (targetSection.id === 'slide-20') {
          triggerSlide20Animation();
        } else if (targetSection.id === 'slide-22') {
          triggerSlide22Animation();
        } else if (targetSection.id === 'slide-23') {
          triggerSlide23Animation();
        }
      }
    });
  };

  // ===========================================================================
  // SECTION 3: GESTION DES ÉVÉNEMENTS DE NAVIGATION
  // ===========================================================================

  const handleWheelEvent = (e) => {
    if (isNavigating.value) return;

    const currentSection = sections.value[currentSectionIndex.value];
    
    if (e.deltaY > 0) {
      // Scroll vers le bas
      
      // Gestion spéciale pour slide-73
      if (currentSection && currentSection.id === 'slide-73') {
        if (!animationStates.value['slide-73-complete']) {
          triggerSlide73Animation();
          return;
        }
      }
      
      // Gestion spéciale pour slide-20 (#text-element-5)
      if (currentSection && currentSection.id === 'slide-20') {
        if (!animationStates.value['slide-20-text-element-5']) {
          triggerSlide20TextElement5();
          return;
        }
      }
      
      // Gestion spéciale pour slide-23 (défilement des perdrix)
      if (currentSection && currentSection.id === 'slide-23') {
        if (animationStates.value['slide-23-initialized']) {
          scrollPerdrixForward();
          return;
        }
      }
      
      // Gestion spéciale pour slide-59
      if (currentSection && currentSection.id === 'slide-59') {
        if (!animationStates.value['slide-59-lass-shown']) {
          triggerSlide59Animation();
          return;
        }
      }
      
      // Gestion spéciale pour slide-128
      if (currentSection && currentSection.id === 'slide-128') {
        if (animationStates.value['slide-128-initialized']) {
          scrollSlide128Forward();
          return;
        }
      }
      
      // Navigation normale vers la slide suivante
      if (currentSectionIndex.value < sections.value.length - 1) {
        goToSection(currentSectionIndex.value + 1);
      }
      
    } else {
      // Scroll vers le haut
      
      // Gestion spéciale pour slide-23 (défilement des perdrix)
      if (currentSection && currentSection.id === 'slide-23') {
        if (animationStates.value['slide-23-initialized']) {
          scrollPerdrixBackward();
          return;
        }
      }
      
      // Gestion spéciale pour slide-128
      if (currentSection && currentSection.id === 'slide-128') {
        if (animationStates.value['slide-128-initialized']) {
          scrollSlide128Backward();
          return;
        }
      }
      
      // Navigation normale vers la slide précédente
      if (currentSectionIndex.value > 0) {
        goToSection(currentSectionIndex.value - 1);
      }
    }
  };

  const handleKeyboardNavigation = (e) => {
    if (isNavigating.value) return;

    switch(e.key) {
      case 'ArrowDown':
      case 'PageDown':
      case ' ': // Espace
        e.preventDefault();
        if (currentSectionIndex.value < sections.value.length - 1) {
          goToSection(currentSectionIndex.value + 1);
        }
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        if (currentSectionIndex.value > 0) {
          goToSection(currentSectionIndex.value - 1);
        }
        break;
      case 'Home':
        e.preventDefault();
        goToSection(0);
        break;
      case 'End':
        e.preventDefault();
        goToSection(sections.value.length - 1);
        break;
    }
  };

  // ===========================================================================
  // SECTION 4: ANIMATIONS SPÉCIFIQUES AUX SLIDES
  // ===========================================================================

  // SLIDE-73 : Animation uniquement des points forts
  const registerSlide73Animation = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (!slide73Section) return;

    const slidesContainerDiv = slide73Section.querySelector('.slides-container');
    const pointsFortDiv = slide73Section.querySelector('.points-fort');

    if (slidesContainerDiv && pointsFortDiv) {
      // État initial
      gsap.set(slidesContainerDiv, {
        opacity: 1,
        visibility: 'inherit',
        height: '100vh',
        width: '100vw'
        // Suppression des propriétés background qui ne seront plus animées
      });
      
      gsap.set(pointsFortDiv, {
        opacity: 1,
        visibility: 'inherit',
        height: '100vh',
        width: '0vw'
      });
    }

    const st = ScrollTrigger.create({
      trigger: slide73Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        // Animation automatique lors de l'entrée sur la slide
        if (!animationStates.value['slide-73-complete']) {
          // Pas d'animation automatique, attendre le scroll
        }
      },
      onLeave: () => {
        // Maintenir l'état final si l'animation est terminée
      },
      onEnterBack: () => {
        // Réinitialiser l'animation quand on revient du bas
        resetSlide73Animation();
      },
      onLeaveBack: () => {
        // Maintenir l'état
      }
    });

    specificAnimationTriggers.push(st);
  };

  const triggerSlide73Animation = () => {
    if (animationStates.value['slide-73-complete']) return;
    
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    const slidesContainerDiv = slide73Section?.querySelector('.slides-container');
    const pointsFortDiv = slide73Section?.querySelector('.points-fort');
    
    if (!slidesContainerDiv || !pointsFortDiv) return;

    animationStates.value['slide-73-animating'] = true;
    isNavigating.value = true;

    const tl = gsap.timeline({
      onComplete: () => {
        animationStates.value['slide-73-complete'] = true;
        animationStates.value['slide-73-animating'] = false;
        isNavigating.value = false;
        console.log('Slide-73: Animation terminée');
      }
    });

    // Animation uniquement des points forts
    tl.to(pointsFortDiv, {
      width: '50vw',
      duration: 0.8,
      ease: 'power3.easeInOut'
    });

    // Ne plus animer slides-container - il garde sa largeur de 100vw
  };

  const resetSlide73Animation = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    const slidesContainerDiv = slide73Section?.querySelector('.slides-container');
    const pointsFortDiv = slide73Section?.querySelector('.points-fort');
    
    if (slidesContainerDiv && pointsFortDiv) {
      // slides-container garde toujours sa largeur de 100vw (pas de reset nécessaire)
      gsap.set(pointsFortDiv, {
        width: '0vw'
      });
    }
    
    animationStates.value['slide-73-complete'] = false;
    animationStates.value['slide-73-animating'] = false;
  };

  // SLIDE-21 : Faire apparaître le texte une fois la slide visible
  const triggerSlide21Animation = () => {
    if (animationStates.value['slide-21-complete']) return;
    
    const slide21Section = sections.value.find(s => s.id === 'slide-21');
    const thoiathoing = slide21Section?.querySelector('#thoiathoing');
    
    if (thoiathoing) {
      gsap.to(thoiathoing, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          animationStates.value['slide-21-complete'] = true;
        }
      });
    }
  };

  // SLIDE-20 : Éléments apparaissent les uns après les autres
  const registerSlide20Animation = () => {
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    if (!slide20Section) return;

    const textElements = slide20Section.querySelectorAll('.text-element:not(#text-element-5)');
    const textElement5 = slide20Section.querySelector('#text-element-5');

    // État initial
    if (textElements.length > 0) {
      gsap.set(textElements, { autoAlpha: 0, y: 100 });
    }
    if (textElement5) {
      gsap.set(textElement5, { autoAlpha: 0, y: 100 });
    }

    const st = ScrollTrigger.create({
      trigger: slide20Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnterBack: () => {
        resetSlide20Animation();
      }
    });

    specificAnimationTriggers.push(st);
  };

  const triggerSlide20Animation = () => {
    if (animationStates.value['slide-20-main-complete']) return;
    
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    const textElements = slide20Section?.querySelectorAll('.text-element:not(#text-element-5)');
    
    if (textElements && textElements.length > 0) {
      gsap.to(textElements, {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.15,
        ease: 'power2.out',
        onComplete: () => {
          animationStates.value['slide-20-main-complete'] = true;
        }
      });
    }
  };

  const triggerSlide20TextElement5 = () => {
    if (animationStates.value['slide-20-text-element-5']) return;
    
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    const textElement5 = slide20Section?.querySelector('#text-element-5');
    
    if (textElement5) {
      isNavigating.value = true;
      gsap.to(textElement5, {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          animationStates.value['slide-20-text-element-5'] = true;
          isNavigating.value = false;
        }
      });
    }
  };

  const resetSlide20Animation = () => {
    const slide20Section = sections.value.find(s => s.id === 'slide-20');
    const textElements = slide20Section?.querySelectorAll('.text-element');
    
    if (textElements) {
      gsap.set(textElements, { autoAlpha: 0, y: 100 });
    }
    
    animationStates.value['slide-20-main-complete'] = false;
    animationStates.value['slide-20-text-element-5'] = false;
  };

  // SLIDE-22 : Faire apparaître le texte une fois la slide visible
  const triggerSlide22Animation = () => {
    if (animationStates.value['slide-22-complete']) return;
    
    const slide22Section = sections.value.find(s => s.id === 'slide-22');
    const textContent = slide22Section?.querySelector('.text-element, .content');
    
    if (textContent) {
      gsap.to(textContent, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          animationStates.value['slide-22-complete'] = true;
        }
      });
    }
  };

  // SLIDE-23 : Afficher perdrix-slide-1 et faire défiler les div .perdix
  const registerSlide23Animation = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    if (!slide23Section) return;

    const perdrixSlide1 = slide23Section.querySelector('.perdrix-slide-1');
    const perdrixElements = slide23Section.querySelectorAll('.perdix');

    // État initial
    if (perdrixSlide1) {
      gsap.set(perdrixSlide1, { autoAlpha: 0 });
    }
    if (perdrixElements.length > 0) {
      gsap.set(perdrixElements, { x: 0 });
    }

    const st = ScrollTrigger.create({
      trigger: slide23Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnterBack: () => {
        resetSlide23Animation();
      }
    });

    specificAnimationTriggers.push(st);
  };

  const triggerSlide23Animation = () => {
    if (animationStates.value['slide-23-initialized']) return;
    
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    const perdrixSlide1 = slide23Section?.querySelector('.perdrix-slide-1');
    
    if (perdrixSlide1) {
      gsap.to(perdrixSlide1, {
        autoAlpha: 1,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          animationStates.value['slide-23-initialized'] = true;
          animationStates.value['slide-23-scroll-index'] = 0;
        }
      });
    }
  };

  let perdrixScrollIndex = 0;
  const maxPerdrixScroll = 3; // Ajustez selon le nombre d'éléments

  const scrollPerdrixForward = () => {
    if (perdrixScrollIndex >= maxPerdrixScroll) return;
    
    perdrixScrollIndex++;
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    const perdrixElements = slide23Section?.querySelectorAll('.perdix');
    
    if (perdrixElements) {
      gsap.to(perdrixElements, {
        x: `-${perdrixScrollIndex * 100}vw`,
        duration: 0.7,
        ease: 'power3.easeInOut'
      });
    }
  };

  const scrollPerdrixBackward = () => {
    if (perdrixScrollIndex <= 0) return;
    
    perdrixScrollIndex--;
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    const perdrixElements = slide23Section?.querySelectorAll('.perdix');
    
    if (perdrixElements) {
      gsap.to(perdrixElements, {
        x: `-${perdrixScrollIndex * 100}vw`,
        duration: 0.7,
        ease: 'power3.easeInOut'
      });
    }
  };

  const resetSlide23Animation = () => {
    const slide23Section = sections.value.find(s => s.id === 'slide-23');
    const perdrixSlide1 = slide23Section?.querySelector('.perdrix-slide-1');
    const perdrixElements = slide23Section?.querySelectorAll('.perdix');
    
    if (perdrixSlide1) {
      gsap.set(perdrixSlide1, { autoAlpha: 0 });
    }
    if (perdrixElements) {
      gsap.set(perdrixElements, { x: 0 });
    }
    
    perdrixScrollIndex = 0;
    animationStates.value['slide-23-initialized'] = false;
    animationStates.value['slide-23-scroll-index'] = 0;
  };

  // SLIDE-59 : Afficher la div #lass au défilement vers le bas
  const triggerSlide59Animation = () => {
    if (animationStates.value['slide-59-lass-shown']) return;
    
    const slide59Section = sections.value.find(s => s.id === 'slide-59');
    const lassDiv = slide59Section?.querySelector('#lass');
    
    if (lassDiv) {
      isNavigating.value = true;
      gsap.to(lassDiv, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          animationStates.value['slide-59-lass-shown'] = true;
          isNavigating.value = false;
        }
      });
    }
  };

  // SLIDE-128 : Afficher #killerwu et faire défiler les case studies
  const registerSlide128Animation = () => {
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    if (!slide128Section) return;

    const killerwuDiv = slide128Section.querySelector('#killerwu');
    const caseStudies = slide128Section.querySelectorAll('.case-study');

    // État initial
    if (killerwuDiv) {
      gsap.set(killerwuDiv, { autoAlpha: 0 });
    }
    if (caseStudies.length > 0) {
      gsap.set(caseStudies, { x: 0 });
    }

    const st = ScrollTrigger.create({
      trigger: slide128Section,
      scroller: SCROLLER_SELECTOR,
      start: 'top center+=10%',
      onEnter: () => {
        triggerSlide128Animation();
      },
      onEnterBack: () => {
        resetSlide128Animation();
      }
    });

    specificAnimationTriggers.push(st);
  };

  const triggerSlide128Animation = () => {
    if (animationStates.value['slide-128-initialized']) return;
    
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    const killerwuDiv = slide128Section?.querySelector('#killerwu');
    const firstCaseStudy = slide128Section?.querySelector('.case-study:first-child');
    
    const tl = gsap.timeline({
      onComplete: () => {
        animationStates.value['slide-128-initialized'] = true;
        animationStates.value['slide-128-scroll-index'] = 0;
      }
    });

    if (killerwuDiv) {
      tl.to(killerwuDiv, {
        autoAlpha: 1,
        duration: 0.8,
        ease: "power2.out"
      });
    }

    if (firstCaseStudy) {
      tl.to(firstCaseStudy, {
        autoAlpha: 1,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.3");
    }
  };

  let slide128ScrollIndex = 0;
  const maxSlide128Scroll = 3; // Ajustez selon le nombre de case studies

  const scrollSlide128Forward = () => {
    if (slide128ScrollIndex >= maxSlide128Scroll) return;
    
    slide128ScrollIndex++;
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    const caseStudies = slide128Section?.querySelectorAll('.case-study');
    
    if (caseStudies) {
      gsap.to(caseStudies, {
        x: `-${slide128ScrollIndex * 100}vw`,
        duration: 0.7,
        ease: 'power3.easeInOut'
      });
    }
  };

  const scrollSlide128Backward = () => {
    if (slide128ScrollIndex <= 0) return;
    
    slide128ScrollIndex--;
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    const caseStudies = slide128Section?.querySelectorAll('.case-study');
    
    if (caseStudies) {
      gsap.to(caseStudies, {
        x: `-${slide128ScrollIndex * 100}vw`,
        duration: 0.7,
        ease: 'power3.easeInOut'
      });
    }
  };

  const resetSlide128Animation = () => {
    const slide128Section = sections.value.find(s => s.id === 'slide-128');
    const killerwuDiv = slide128Section?.querySelector('#killerwu');
    const caseStudies = slide128Section?.querySelectorAll('.case-study');
    
    if (killerwuDiv) {
      gsap.set(killerwuDiv, { autoAlpha: 0 });
    }
    if (caseStudies) {
      gsap.set(caseStudies, { x: 0, autoAlpha: 0 });
    }
    
    slide128ScrollIndex = 0;
    animationStates.value['slide-128-initialized'] = false;
    animationStates.value['slide-128-scroll-index'] = 0;
  };

  // ===========================================================================
  // SECTION 5: INITIALISATION ET NETTOYAGE
  // ===========================================================================

  const init = (sectionsElements) => {
    if (!Array.isArray(sectionsElements) || sectionsElements.some(el => !(el instanceof HTMLElement))) {
      console.error('❌ Erreur: sectionsElements doit être un tableau d\'éléments HTML');
      return;
    }

    sections.value = sectionsElements;

    if (sections.value.length > 0) {
      // Configuration des ScrollTriggers pour l'observation
      stObserve = ScrollTrigger.create({
        trigger: sections.value[0],
        start: "top center",
        end: "bottom center",
        scroller: SCROLLER_SELECTOR,
        onUpdate: (self) => {
          const progress = self.progress;
          const totalSections = sections.value.length;
          const newIndex = Math.min(Math.floor(progress * totalSections), totalSections - 1);
          
          if (newIndex !== currentSectionIndex.value && !isNavigating.value) {
            currentSectionIndex.value = newIndex;
          }
        }
      });

      // Enregistrement des animations spécifiques
      registerSlide73Animation();
      registerSlide20Animation();
      registerSlide23Animation();
      registerSlide128Animation();

      // Configuration des événements de navigation
      keyboardListener.value = (e) => handleKeyboardNavigation(e);
      document.addEventListener('keydown', keyboardListener.value);
      document.addEventListener('wheel', handleWheelEvent, { passive: false });

      // Navigation initiale
      goToSection(0, 0);
    }
  };

  const cleanup = () => {
    if (stObserve) {
      stObserve.kill();
      stObserve = null;
    }

    specificAnimationTriggers.forEach(st => st.kill());
    specificAnimationTriggers.length = 0;

    slideSpecificEventListeners.forEach(listener => {
      listener.element.removeEventListener(listener.event, listener.handler);
    });
    slideSpecificEventListeners.length = 0;

    if (keyboardListener.value) {
      document.removeEventListener('keydown', keyboardListener.value);
      keyboardListener.value = null;
    }

    document.removeEventListener('wheel', handleWheelEvent);

    gsap.killTweensOf(SCROLLER_SELECTOR);

    // Reset de tous les états
    currentSectionIndex.value = 0;
    isNavigating.value = false;
    hasScrolledOnce.value = false;
    isAnimating.value = false;
    Object.keys(animationStates.value).forEach(key => delete animationStates.value[key]);
    sections.value = [];
  };

  onUnmounted(() => {
    cleanup();
  });

  // Fonctions de debug
  window.debugDesktopAnimations = {
    states: animationStates,
    resetSlide73: resetSlide73Animation,
    resetSlide20: resetSlide20Animation,
    resetSlide23: resetSlide23Animation,
    resetSlide128: resetSlide128Animation,
    triggerSlide73: triggerSlide73Animation,
    currentSection: () => sections.value[currentSectionIndex.value]?.id
  };

  return {
    currentSectionIndex,
    isNavigating,
    animationStates,
    init,
    goToSection,
    cleanup
  };
}

export default useFullpageScrollTrigger;