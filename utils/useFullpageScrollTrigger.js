import { ref, onUnmounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function useFullpageScrollTrigger() {
  const sections = ref([]);
  const currentSectionIndex = ref(0);
  const isNavigating = ref(false);
  const animationStates = ref({});
  let stObserve = null;
  const keyboardListener = ref(null);
  const specificAnimationTriggers = [];
  const hasScrolledOnce = ref(false); // True après la première interaction utilisateur

  const SCROLLER_SELECTOR = "#master-scroll-container"; // Définit le sélecteur du conteneur de défilement

  // Appelée lors de la première interaction utilisateur (scroll, keydown)
  const handleFirstInteraction = () => {
    if (!hasScrolledOnce.value) {
      hasScrolledOnce.value = true;
      console.log("ScrollTrigger Composable: Première interaction utilisateur détectée.");
      // Si la diapositive 73 est la première et que son animation attendait cette interaction
      const slide73Index = sections.value.findIndex(s => s.id === 'slide-73');
      if (slide73Index === 0 && currentSectionIndex.value === 0) {
        // Déclencher manuellement l'animation de la slide 73
        const slide73Section = sections.value.find(s => s.id === 'slide-73');
        if (slide73Section && !animationStates.value['slide-73']) {
          const pointsFortDiv = slide73Section.querySelector('.points-fort');
          if (pointsFortDiv) {
            console.log("ScrollTrigger Composable: Déclenchement manuel de l'animation pour slide 73.");
            animationStates.value['slide-73'] = true; // Marque que l'animation a été déclenchée

            gsap.to(pointsFortDiv, {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: 'power2.out',
              onComplete: () => {
                console.log('ScrollTrigger Composable: Animation slide 73 terminée.');
              }
            });
          }
        }
        ScrollTrigger.refresh();
      }
    }
  };

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
    if (currentSectionElement && currentSectionElement.id === 'slide-73' && !animationStates.value['slide-73'] && index > currentSectionIndex.value) {
      console.log("ScrollTrigger Composable: Tentative de descendre depuis slide 73 avant fin anim. Bloqué.");
      return;
    }

    isNavigating.value = true;
    console.log('ScrollTrigger Composable: isNavigating mis à true');

    gsap.to(SCROLLER_SELECTOR, { // Cible le conteneur de défilement
      scrollTo: { y: sections.value[index], autoKill: false },
      duration: duration,
      ease: 'power2.inOut',
      onStart: () => {
        currentSectionIndex.value = index;
      },
      onComplete: () => {
        isNavigating.value = false;
        console.log(`ScrollTrigger Composable: Navigué vers section ${index}. isNavigating mis à false.`);
        // La logique pour la diapositive 73 à l'arrivée est gérée par son propre ScrollTrigger
      },
      onInterrupt: () => {
        isNavigating.value = false;
        console.log('ScrollTrigger Composable: Navigation interrompue. isNavigating mis à false.');
      }
    });
  };

  const registerSlide73Animation = () => {
    const slide73Section = sections.value.find(s => s.id === 'slide-73');
    if (!slide73Section) {
      console.warn('ScrollTrigger Composable: Section slide-73 non trouvée pour l\'animation.');
      return;
    }
    const pointsFortDiv = slide73Section.querySelector('.points-fort');
    if (!pointsFortDiv) {
      console.warn('ScrollTrigger Composable: Div .points-fort non trouvée dans slide-73.');
      return;
    }

    gsap.set(pointsFortDiv, { autoAlpha: 0, y: 50 });
    animationStates.value['slide-73'] = false; // État initial: animation non jouée

    const st = ScrollTrigger.create({
      trigger: slide73Section,
      scroller: SCROLLER_SELECTOR, // Spécifie le conteneur de défilement
      start: 'top center+=10%',
      // markers: true, // Décommenter pour le débogage visuel
      onEnter: (self) => {
        console.log(`ScrollTrigger Composable: Slide 73 onEnter. Anim state: ${animationStates.value['slide-73']}, hasScrolledOnce: ${hasScrolledOnce.value}, currentIndex: ${currentSectionIndex.value}`);

        const slide73Index = sections.value.findIndex(s => s.id === 'slide-73');

        // Si c'est la première diapositive (index 0), et qu'aucune interaction utilisateur n'a eu lieu,
        // et que nous sommes effectivement sur cette diapositive (pour éviter les déclenchements précoces au chargement),
        // alors ne pas jouer l'animation tout de suite.
        if (slide73Index === 0 && currentSectionIndex.value === 0 && !hasScrolledOnce.value) {
          console.log("ScrollTrigger Composable: Slide 73 est la diapositive initiale, animation différée jusqu'à la première interaction.");
          return; // Attend une interaction pour que hasScrolledOnce devienne true
        }

        if (!animationStates.value['slide-73']) {
          console.log("ScrollTrigger Composable: Déclenchement de l'animation pour slide 73.");
          animationStates.value['slide-73'] = true; // Marque que l'animation a été déclenchée

          gsap.to(pointsFortDiv, {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => {
              console.log('ScrollTrigger Composable: Animation slide 73 terminée.');
            }
          });
          self.disable(); // Désactive ce trigger après son unique exécution
        }
      }
    });
    specificAnimationTriggers.push(st);
  };

  const setupFullpageObserver = () => {
    if (sections.value.length === 0) return;

    stObserve = ScrollTrigger.observe({
      target: SCROLLER_SELECTOR, // Cible le conteneur de défilement
      type: "wheel,touch", // Pointer peut être ajouté si nécessaire: "wheel,touch,pointer"
      debounce: false, // Maintenir si ce comportement est désiré, sinon true ou une valeur en ms
      onUp: () => {
        handleFirstInteraction();
        console.log('ScrollTrigger Composable: Observe onUp. isNavigating:', isNavigating.value);
        if (isNavigating.value) return;
        
        const currentSectionElement = sections.value[currentSectionIndex.value];
        // La logique de blocage pour la slide 73 est déjà dans goToSection, mais une double vérification ici peut être utile
        // si l'animation de la slide 73 doit absolument finir AVANT de pouvoir remonter.
        // Actuellement, on permet de remonter même si l'anim de la 73 n'est pas finie.
        // Si elle DOIT finir:
        // if (currentSectionElement && currentSectionElement.id === 'slide-73' && !animationStates.value['slide-73-completed']) {
        //   console.log("ScrollTrigger Composable: Tentative de monter depuis slide 73 avant fin anim. Bloqué.");
        //   return;
        // }
        goToSection(currentSectionIndex.value - 1);
      },
      onDown: () => {
        handleFirstInteraction();
        console.log('ScrollTrigger Composable: Observe onDown. isNavigating:', isNavigating.value);
        if (isNavigating.value) return;
        
        const currentSectionElement = sections.value[currentSectionIndex.value];
        if (currentSectionElement && currentSectionElement.id === 'slide-73' && !animationStates.value['slide-73']) {
          console.log("ScrollTrigger Composable: Tentative de descendre (via wheel/touch) depuis slide 73 avant fin anim. Bloqué.");
          // On pourrait forcer l'animation ici si elle n'est pas déjà en cours.
          // Mais il vaut mieux laisser le ScrollTrigger de l'animation la gérer.
          return;
        }
        goToSection(currentSectionIndex.value + 1);
      },
      // La gestion onWheel personnalisée est supprimée car onUp/onDown devraient suffire.
    });

    keyboardListener.value = (e) => {
      handleFirstInteraction();
      if (isNavigating.value) return;

      let newIndex = currentSectionIndex.value;
      const currentSectionElement = sections.value[currentSectionIndex.value];

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); // Empêche le défilement natif de la page avec la barre d'espace
        if (currentSectionElement && currentSectionElement.id === 'slide-73' && !animationStates.value['slide-73']) {
          console.log("ScrollTrigger Composable: Défilement clavier vers le bas depuis slide 73 bloqué (animation en attente).");
          return;
        }
        newIndex++;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        // Pas de blocage spécifique en montant depuis la slide 73 ici, goToSection gère les limites.
        newIndex--;
      }

      if (newIndex !== currentSectionIndex.value) {
        goToSection(newIndex);
      }
    };
    window.addEventListener('keydown', keyboardListener.value);
  };

  const init = (sectionsElements) => {
    sections.value = sectionsElements.map(el => ({
      id: el.id,
      offsetTop: el.offsetTop, // Stocker l'offsetTop relatif au conteneur de défilement
      node: el // Garder une référence à l'élément DOM si nécessaire
    }));
    
    // Recalculer les offsets par rapport au SCROLLER_SELECTOR si ce n'est pas window
    // Si SCROLLER_SELECTOR est un élément, offsetTop des sections est déjà relatif à lui s'il est offsetParent.
    // Sinon, il faut s'assurer que les valeurs y pour scrollTo sont correctes.
    // Pour l'instant, on suppose que sections.value[index] (l'élément DOM) passé à scrollTo: { y: sections.value[index] }
    // est correctement interprété par GSAP pour scroller à cet élément dans son conteneur.
    // Si sectionsElements sont des éléments DOM, gsap.scrollTo({y: element}) fonctionne.
    // Donc, sections.value = sectionsElements; est probablement suffisant.
    // Rétablissons la version simple si sectionsElements sont les éléments DOM eux-mêmes.
    sections.value = sectionsElements;


    console.log('ScrollTrigger Composable: Initialisation avec sections:', sections.value.length, sections.value.map(s=>s.id));
    
    if (sections.value.length > 0) {
      // hasScrolledOnce est initialisé à false par défaut.
      // La logique pour différer l'animation de la slide 73 (si première) est dans son onEnter.
      registerSlide73Animation(); // Enregistrer après que sections.value soit défini
      setupFullpageObserver(); // Configurer les observateurs après que sections.value soit défini
      goToSection(0, 0); // Aller à la première section sans animation
    }
  };

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
    gsap.killTweensOf(SCROLLER_SELECTOR); // Cible le conteneur de défilement
    // Réinitialiser les refs si nécessaire pour une réinitialisation complète
    currentSectionIndex.value = 0;
    isNavigating.value = false;
    hasScrolledOnce.value = false;
    Object.keys(animationStates.value).forEach(key => delete animationStates.value[key]);
  };

  onUnmounted(cleanup);

  return {
    currentSectionIndex,
    isNavigating,
    init,
    goToSection,
    // cleanup, // Pas besoin d'exposer, géré par onUnmounted
  };
}