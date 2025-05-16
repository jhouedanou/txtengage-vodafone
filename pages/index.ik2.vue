<script setup>
import { onMounted, ref, computed, reactive, nextTick, onUnmounted, onBeforeUnmount, watch } from 'vue'
import { useSlidesStore } from '~/stores/slides'
import { useRuntimeConfig } from '#app'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Observer } from 'gsap/Observer'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { CSSPlugin } from 'gsap/CSSPlugin'
import CustomScrollbar from '~/components/CustomScrollbar.vue'

// N'enregistrer les plugins GSAP que dans le contexte client
if (process.client) {
  // S'assurer que les plugins sont correctement enregistrés dans l'ordre
  try {
    // Selon la documentation GSAP, il faut d'abord s'assurer que les plugins de base sont enregistrés
    // CSSPlugin est automatiquement inclus dans gsap.core, mais nous l'enregistrons explicitement
    gsap.registerPlugin(CSSPlugin);
    console.log('CSSPlugin enregistré');
    
    // Plugins de scroll dans l'ordre recommandé
    gsap.registerPlugin(ScrollToPlugin);
    console.log('ScrollToPlugin enregistré');
    
    gsap.registerPlugin(Observer);
    console.log('Observer enregistré');
    
    gsap.registerPlugin(ScrollTrigger);
    console.log('ScrollTrigger enregistré');
    
    // Ré-enregistrer CSSPlugin une fois de plus pour s'assurer qu'il est bien reconnu
    if (!gsap.utils.checkPrefix('autoAlpha')) {
      console.log('Ré-enregistrement du CSSPlugin pour autoAlpha');
      gsap.registerPlugin(CSSPlugin);
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des plugins GSAP:', error);
  }
}

// Configuration pour le défilement et les animations contrôlées par GSAP
const scrollSmooth = ref(true); // Activer/désactiver le défilement fluide
const scrollDuration = ref(1); // Durée de l'animation de défilement

// Récupérer les configurations
const config = useRuntimeConfig()

// Références d'instances
const scrollContainerRef = ref(null)  // Référence au conteneur principal de scroll
const showButton = ref(false)
const slidesStore = useSlidesStore()
const loading = computed(() => slidesStore.loading)
const sortedSlides = computed(() => slidesStore.sortedSlides)
const activeSlideIndex = ref(0) // Index de la slide active, commence à 0
const activeSlideId = computed(() => sortedSlides.value[activeSlideIndex.value]?.id || null)

// Éléments DOM
const slides = ref([])
const sections = ref([]) // Stocke les références aux sections

// État de navigation
const isFirstSlideActive = ref(true) // Par défaut, nous sommes sur la première slide
const isLastSlideActive = ref(false) // Par défaut, nous ne sommes pas sur la dernière slide
const defaultBackground = ref('url(/images/bg12.webp)')
const specialBackground = ref('url(/images/nono.webp)')
const currentBackground = ref(defaultBackground.value)

// Variables pour le contrôle du défilement
const isAnimating = ref(false)        // Indique si une animation est en cours
const canScroll = ref(true)           // Indique si le scroll est autorisé
const scrollDirection = ref(null)     // Direction du défilement (up/down)
// Sections sont déjà déclarées plus haut (ligne 58)

// Variables pour les animations GSAP
const scrollTimeline = ref(null)      // Timeline principale pour les animations
const sectionTimelines = ref({})      // Timelines pour chaque section individuelle

// Configuration pour ScrollTrigger
const scrollConfig = {
  // Désactiver le scroll natif pour le contrôler via GSAP
  preventOverscroll: true,
  // Durée de l'animation de défilement
  scrollDuration: 1,
  // Easing pour les animations de défilement
  scrollEase: "power2.inOut",
  // Classe pour les slides/sections
  sectionClass: ".section",
  // Classes pour indiquer l'animation en cours
  activeClass: "active",
  inViewClass: "in-view",
  // Options pour le défilement au scroll de souris
  mousewheel: {
    enabled: true,
    sensitivity: 1
  }
}

// Fonction pour précharger l'image
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.onload = () => resolve(img)
    img.onerror = reject
  })
}

// Précharger les images
onMounted(async () => {
  try {
    await preloadImage('/images/nono.webp')
    await preloadImage('/images/bg12.webp')
  } catch (error) {
    // Ignorer les erreurs
  }
})

// Mettre à jour l'arrière-plan en fonction de la slide active
const updateBackground = () => {
  // S'assurer que la fonction s'exécute seulement après le montage du composant
  nextTick(() => {
    const wrapper = document.getElementById('vodacomwrapper');
    
    if (wrapper) {
      // Vérifier si l'une des slides spéciales est active
      const currentSlideId = activeSlideId.value;
      
      if (currentSlideId === 20 || currentSlideId === 114) {
        wrapper.style.backgroundImage = 'url(/images/nono.webp)';
        wrapper.style.backgroundSize = 'cover';
        wrapper.style.backgroundPosition = 'center center';
        wrapper.style.backgroundRepeat = 'no-repeat';
      } else {
        wrapper.style.backgroundImage = 'url(/images/bg12.webp)';
        wrapper.style.backgroundSize = 'cover';
        wrapper.style.backgroundPosition = 'center center';
        wrapper.style.backgroundRepeat = 'no-repeat';
      }
    }
  });
}

// Slide 23 - Accordéon
const activeIndex = ref(null)
const activeImage = ref(null)

const toggleAccordion = (slideId, index) => {
    const currentSlide = slidesStore.sortedSlides.find(s => s.id === slideId)
    if (!currentSlide) return

    activeIndex.value = activeIndex.value === index ? null : index
    const imgSrc = currentSlide.paragraphs?.[index]?.match(/src="([^"]*)"/)?.[1]
    activeImage.value = imgSrc
}

// isFirstSlideActive est déjà déclaré à la ligne 61

// Gestionnaires d'événements pour Swiper
const onSwiperInit = (swiper) => {
  console.log('Swiper initialisé', swiper);
  // Initialiser ScrollTrigger après le rendu
  initScrollTrigger();
};

// Fonction principale pour initialiser le scroll contrôlé par GSAP
const initScrollControl = () => {
  if (!process.client) return;

  // 1. D'abord, on définit les sections initiales
  const sections = document.querySelectorAll('.section');
  if (sections.length === 0) {
    console.error('Aucune section trouvée pour le système de défilement');
    return;
  }

  console.log(`${sections.length} sections trouvées`);

  // Définir la première section comme active
  sections[0].classList.add('active');
  sections[0].classList.add('in-view');
  sections[0].style.zIndex = '2';
  sections[0].style.opacity = '1';
  sections[0].style.pointerEvents = 'auto';
  
  // Masquer les autres sections au départ
  for (let i = 1; i < sections.length; i++) {
    sections[i].style.zIndex = '1';
    sections[i].style.opacity = '0';
    sections[i].style.pointerEvents = 'none';
  }

  // 2. Initialiser le système de détection du scroll via Observer
  Observer.create({
    type: 'wheel,touch,pointer',
    wheelSpeed: -1,
    onDown: () => {
      // Actions à effectuer lorsque l'utilisateur défile vers le bas
      if (!isAnimating.value) {
        navigateToSlide(activeSlideIndex.value + 1);
      }
    },
    onUp: () => {
      // Actions à effectuer lorsque l'utilisateur défile vers le haut
      if (!isAnimating.value) {
        navigateToSlide(activeSlideIndex.value - 1);
      }
    },
    tolerance: 10,
    preventDefault: true
  });

  // 3. Écouter les événements de touche pour contrôler le défilement
  document.addEventListener('keydown', (e) => {
    if (isAnimating.value) return;
    
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      navigateToSlide(activeSlideIndex.value + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      navigateToSlide(activeSlideIndex.value - 1);
      e.preventDefault();
    }
  });

  // 4. Écouter l'événement personnalisé de navigation (pour la barre de défilement)
  document.addEventListener('navigateToSection', (e) => {
    if (!isAnimating.value) {
      navigateToSlide(e.detail.index);
    }
  });

  console.log('Système de défilement contrôlé par GSAP initialisé');
};

// Configurer les animations pour chaque section
const setupSectionAnimations = () => {
  sections.value.forEach((section, index) => {
    const sectionId = section.id;
    
    // Créer une timeline pour cette section
    const timeline = gsap.timeline({
      paused: true,
      defaults: {
        ease: 'power2.inOut',
        duration: 0.4
      }
    });

    // Obtenir tous les éléments à animer dans cette section
    const elements = section.querySelectorAll('h1, h2, h3, .text-element, p, li, .sub-section');
    
    // Configuration initiale : tous les éléments sont invisibles
    gsap.set(elements, { opacity: 0, y: 30 });

    // Animer chaque élément séquentiellement
    elements.forEach((el, idx) => {
      timeline.to(el, {
        opacity: 1,
        y: 0,
        delay: idx * 0.1 // Ajouter un délai croissant pour une animation séquentielle
      });
    });

    // Ajouter une pause à la fin pour attendre avant de passer à la section suivante
    timeline.addPause();

    // Stocker la timeline pour cette section
    sectionTimelines.value[sectionId] = timeline;
  });
};

// Configurer les écouteurs d'événements pour le défilement
const setupScrollListeners = () => {
  // Configurer l'écouteur d'événements pour la molette de souris
  if (scrollConfig.mousewheel.enabled) {
    window.addEventListener('wheel', handleMouseWheel, { passive: false });
  }

  // Écouteur pour les touches fléchées
  window.addEventListener('keydown', handleKeyDown);
};

// Gérer l'événement de la molette de souris
const handleMouseWheel = (event) => {
  // Si une animation est en cours, bloquer tout nouveau défilement
  if (isAnimating.value) {
    event.preventDefault();
    return;
  }

  const direction = event.deltaY > 0 ? 'down' : 'up';
  scrollDirection.value = direction;

  // Empêcher le défilement natif
  if (scrollConfig.preventOverscroll) {
    event.preventDefault();
  }

  // Si le défilement est autorisé
  if (canScroll.value) {
    handleScroll(direction);
  }
};

// Gérer l'événement des touches fléchées
const handleKeyDown = (event) => {
  // Si une animation est en cours, bloquer toute nouvelle navigation
  if (isAnimating.value) return;

  let direction = null;

  switch (event.key) {
    case 'ArrowDown':
    case 'PageDown':
      direction = 'down';
      break;
    case 'ArrowUp':
    case 'PageUp':
      direction = 'up';
      break;
  }

  if (direction && canScroll.value) {
    event.preventDefault();
    handleScroll(direction);
  }
};

// Gérer le défilement
const handleScroll = (direction) => {
  // Index de la section active
  const currentIndex = activeSlideIndex.value;
  
  // Section/slide actuelle
  const currentSection = sections.value[currentIndex];
  
  // Timeline de la section actuelle
  const currentTimeline = currentSection ? sectionTimelines.value[currentSection.id] : null;

  // Si nous avons une timeline pour cette section
  if (currentTimeline) {
    // Vérifier où nous en sommes dans l'animation de la section
    const progress = currentTimeline.progress();

    // Si l'animation n'est pas terminée et que la direction est vers le bas
    if (progress < 1 && direction === 'down') {
      isAnimating.value = true;
      // Continuer à animer cette section
      currentTimeline.play();
      return;
    } 
    // Si l'animation n'est pas au début et que la direction est vers le haut
    else if (progress > 0 && direction === 'up') {
      isAnimating.value = true;
      // Revenir en arrière dans l'animation de cette section
      currentTimeline.reverse();
      return;
    }
  }

  // Si nous arrivons ici, c'est que nous pouvons passer à une autre section
  let targetIndex;

  if (direction === 'down') {
    // Si nous sommes à la dernière section, ne rien faire
    if (currentIndex >= sections.value.length - 1) return;
    targetIndex = currentIndex + 1;
  } else {
    // Si nous sommes à la première section, ne rien faire
    if (currentIndex <= 0) return;
    targetIndex = currentIndex - 1;
  }

  // Passer à la section cible
  navigateToSlide(targetIndex);
};

// Naviguer vers une diapositive spécifique
const navigateToSlide = (index) => {
  // Vérifier que l'index est valide
  if (index < 0 || index >= sortedSlides.value.length || index === activeSlideIndex.value || isAnimating.value) {
    return;
  }

  // Marquer comme en cours d'animation
  isAnimating.value = true;
  console.log(`Transition vers la slide ${index}`);

  // Sélectionner les éléments DOM
  const sections = document.querySelectorAll('.section');
  if (!sections || sections.length === 0) {
    isAnimating.value = false;
    return;
  }

  const currentSection = sections[activeSlideIndex.value];
  const targetSection = sections[index];

  if (!currentSection || !targetSection) {
    isAnimating.value = false;
    return;
  }

  // Déterminer la direction de l'animation (vers le haut ou vers le bas)
  const direction = index > activeSlideIndex.value ? 1 : -1; // 1 = vers le bas, -1 = vers le haut
  
  // S'assurer que toutes les sections sont initialement invisibles sauf la section actuelle
  sections.forEach(section => {
    if (section !== currentSection) {
      gsap.set(section, { autoAlpha: 0, display: 'none' });
    }
  });
  
  // Préparer la section cible pour l'animation
  gsap.set(targetSection, {
    y: direction * window.innerHeight,  // Positionner hors écran
    autoAlpha: 1,                      // Visible mais transparent
    display: 'block',                  // Affichée
    position: 'absolute',              // Position absolue pour éviter le chevauchement
    top: 0,                            // Aligner en haut
    left: 0,                           // Aligner à gauche
    width: '100%',                     // Largeur complète
    height: '100%',                    // Hauteur complète
    zIndex: 2                          // Au-dessus de l'actuelle
  });
  
  // Configurer la section actuelle
  gsap.set(currentSection, {
    position: 'absolute',              // Position absolue pour éviter le chevauchement
    top: 0,                            // Aligner en haut
    left: 0,                           // Aligner à gauche
    width: '100%',                     // Largeur complète
    height: '100%',                    // Hauteur complète
    zIndex: 1                          // En dessous de la cible
  });
  
  // Animation des deux sections avec un timeline
  const tl = gsap.timeline({
    onComplete: () => {
      // Mettre à jour l'index actif
      activeSlideIndex.value = index;
      
      // Mettre à jour les états de navigation
      isFirstSlideActive.value = activeSlideIndex.value === 0;
      isLastSlideActive.value = activeSlideIndex.value === sortedSlides.value.length - 1;
      console.log(`État mis à jour - Slide ${activeSlideIndex.value} active`);
      
      // Masquer l'ancienne section complètement
      gsap.set(currentSection, { autoAlpha: 0, display: 'none' });
      
      // Rétablir le positionnement normal de la section active
      gsap.set(targetSection, {
        position: 'relative',
        zIndex: 'auto',
        y: 0
      });
      
      // Lancer les animations internes avec un court délai pour s'assurer que tout est bien positionné
      setTimeout(() => {
        // Déclencher les animations internes
        console.log('Animation des éléments internes pour la slide', index);
        animateSlideElements(index);
        
        // Autoriser le défilement à nouveau
        isAnimating.value = false;
        console.log(`Transition terminée vers la slide ${index}`);
      }, 100);
    }
  });
  
  // Animer le départ de la section courante
  tl.to(currentSection, {
    y: -direction * window.innerHeight, // Sortir dans la direction opposée
    duration: 0.8,
    ease: "power2.inOut"
  }, 0);
  
  // Animer l'arrivée de la section cible
  tl.to(targetSection, {
    y: 0, // Position finale
    duration: 0.8,
    ease: "power2.inOut"
  }, 0);

  // Mettre à jour les classes pour le styling CSS
  sections.forEach((section, idx) => {
    section.classList.toggle('active', idx === index);
    section.classList.toggle('in-view', idx === index);
  });
};

// Activer une section
const activateSection = (index) => {
  // Mettre à jour l'index actif
  activeSlideIndex.value = index;
  
  // Mettre à jour toutes les classes CSS
  sections.value.forEach((section, idx) => {
    section.classList.toggle(scrollConfig.activeClass, idx === index);
    section.classList.toggle(scrollConfig.inViewClass, idx === index);
  });

  // Mettre à jour l'ID de slide actif
  const currentSlide = sortedSlides.value[index];
  if (currentSlide) {
    activeSlideId.value = currentSlide.id;
    updateBackground();
  }

  updateFirstSlideStatus();

  // Déclencher l'animation pour cette section
  const currentSection = sections.value[index];
  if (currentSection) {
    const sectionId = currentSection.id;
    
    // Déclencher les animations pour cette section
    if (sectionId === 'section-slide-73') {
      nextTick(() => {
        initSlide73Animation();
      });
    } else if (sectionId === 'section-slide-21') {
      nextTick(() => {
        initSlide21Animation();
      });
    } else {
      // Pour les autres sections, utiliser l'animation standard
      const timeline = sectionTimelines.value[sectionId];
      if (timeline) {
        timeline.play(0);
      }
    }
  }
};

// Fonction pour faire défiler vers une section spécifique
const scrollToSection = (index) => {
  if (index < 0 || index >= sections.value.length) return;
  
  isAnimating.value = true;
  
  // Afficher la section cible (en la positionnant par CSS)
  const targetSection = sections.value[index];
  
  if (scrollSmooth.value) {
    // Utiliser GSAP pour animer la transition
    gsap.to(window, {
      duration: scrollConfig.scrollDuration,
      scrollTo: targetSection,
      ease: scrollConfig.scrollEase,
      onComplete: () => {
        // Activer la nouvelle section une fois l'animation terminée
        activateSection(index);
      }
    });
  } else {
    // Transition instantanée
    targetSection.scrollIntoView({ behavior: 'auto' });
    activateSection(index);
  }
};

// Aller à la première slide
const goToFirstSlide = () => {
  scrollToSection(0);
}

// Animations des slides avec GSAP
const animateSlideElements = (activeIndex) => {
  // Vérifier que l'index est valide
  if (!sortedSlides.value[activeIndex]) {
    console.warn(`Slide avec index ${activeIndex} introuvable`);
    return;
  }
  
  // Créer une nouvelle timeline pour cette animation
  const timeline = gsap.timeline();
  
  // ID de la slide actuelle
  const currentSlideId = sortedSlides.value[activeIndex]?.id;
  const currentSlideSelector = `#section-slide-${currentSlideId}`;
  console.log(`Animation des éléments pour la slide ${currentSlideId} avec sélecteur ${currentSlideSelector}`);

  // Exception pour la slide 73 (animée par ScrollTrigger)
  if (currentSlideId === 73) {
    return; // Ne pas animer ici, c'est géré par ScrollTrigger
  }
  
  // Trouver la slide actuelle dans le DOM
  const currentSlide = document.querySelector(currentSlideSelector);
  if (!currentSlide) {
    console.warn(`Slide non trouvée dans le DOM: ${currentSlideSelector}`);
    return;
  }
  
  // S'assurer que la slide est bien visible
  gsap.set(currentSlide, { 
    display: 'block', 
    autoAlpha: 1,
    position: 'relative'
  });
  
  // Sélectionner tous les éléments à animer - sélection plus large
  const elementsToAnimate = [
    ...Array.from(currentSlide.querySelectorAll('h1, h2, h3, h4, h5, h6')),   // Titres
    ...Array.from(currentSlide.querySelectorAll('p')),                         // Paragraphes
    ...Array.from(currentSlide.querySelectorAll('.text-element')),             // Éléments texte spécifiques
    ...Array.from(currentSlide.querySelectorAll('li')),                        // Éléments de liste
    ...Array.from(currentSlide.querySelectorAll('.sub-section')),              // Sous-sections
    ...Array.from(currentSlide.querySelectorAll('.animate-me'))                // Classe spécifique pour l'animation
  ];
  
  // Éliminer les doublons (un élément pourrait correspondre à plusieurs sélecteurs)
  const uniqueElements = [...new Set(elementsToAnimate)];
  
  console.log(`${uniqueElements.length} éléments à animer trouvés dans la slide ${currentSlideId}`);
  
  // S'il y a des éléments à animer
  if (uniqueElements.length > 0) {
    // Arrêter toutes les animations en cours sur ces éléments
    gsap.killTweensOf(uniqueElements);
    
    // Définir l'état initial (caché, décalé vers le bas)
    gsap.set(uniqueElements, {
      opacity: 0,
      y: 30,
      visibility: 'visible' // Rendre visible mais transparent
    });
    
    // Petit délai pour s'assurer que la transition de slide est terminée
    setTimeout(() => {
      // Animer l'apparition avec un décalage entre chaque élément (stagger)
      gsap.to(uniqueElements, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,           // Délai entre chaque animation (élément par élément)
        ease: "back.out(1.2)",    // Un peu de rebond pour plus de dynamisme
        clearProps: "visibility", // Nettoyer les propriétés après l'animation
        onComplete: () => {
          console.log(`Animations terminées pour la slide ${currentSlideId}`);
        }
      });
    }, 100); // Léger délai après la transition de slide
  } else {
    console.warn(`Aucun élément à animer trouvé dans ${currentSlideSelector}`);
  }

  // Animation spécifique pour la slide 10 sur mobile
  if (currentSlideId === 10 && isMobile?.value) {
    // Décaler l'arrière-plan vers le haut
    const wrapper = document.getElementById('vodacomwrapper');
    if (wrapper) {
      gsap.to(wrapper, {
        backgroundPositionY: "-30px",
        duration: 0.8,
        ease: "power1.out"
      });
    }
  } 
  // Réinitialiser l'arrière-plan pour les autres slides sur mobile
  else if (currentSlideId !== 10 && isMobile?.value) {
    const wrapper = document.getElementById('vodacomwrapper');
    if (wrapper) {
      gsap.to(wrapper, {
        backgroundPositionY: "0px",
        duration: 0.5
      });
    }
  }

  // Slide 20 - Animations spécifiques supplémentaires
  if (currentSlideId === 20) {
    // Vérifier si les éléments existent avant d'animer
    const slide2a = document.getElementById('slide2a')
    const slide2b = document.getElementById('slide2b')
    const slide2c = document.getElementById('slide2c')
    const guysamuelElements = document.querySelectorAll('#guysamuel .text-element')
    
    if (slide2a) timeline.fromTo(slide2a, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
    if (slide2b) timeline.fromTo(slide2b, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
    if (slide2c) timeline.fromTo(slide2c, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
    if (guysamuelElements.length > 0) {
      timeline.fromTo(guysamuelElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }
  }

  // Slide 21 - Animations spécifiques supplémentaires
  else if (currentSlideId === 21) {
    const mshill = document.getElementById('mshill')
    const textElements = document.querySelectorAll('#thoiathoing .text-element')
    
    if (mshill) timeline.fromTo(mshill, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
    if (textElements.length > 0) {
      timeline.fromTo(textElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }
  }

  // Slide 22 - Animations spécifiques supplémentaires
  else if (currentSlideId === 22) {
    const mshill = document.getElementById('mshill')
    const textElements = document.querySelectorAll('#thoiathoing .text-element')
    
    if (mshill) timeline.fromTo(mshill, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
    if (textElements.length > 0) {
      timeline.fromTo(textElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }
  }

  // Slide 59 - Animations spécifiques supplémentaires
  else if (currentSlideId === 59) {
    const h2Element = document.querySelector('#killerjunior h2')
    const pElement = document.querySelector('#killerjunior p')
    const lemoudsElements = document.querySelectorAll('.lemouds')
    
    if (h2Element) timeline.fromTo(h2Element, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
    if (pElement) timeline.fromTo(pElement, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
    if (lemoudsElements.length > 0) {
      timeline.fromTo(lemoudsElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }
  }

  // Slide 60 - Form
  else if (sortedSlides.value[activeIndex]?.id === 60) {
      const lopere = document.querySelector('.lopere')
      const ditocard = document.querySelectorAll('.ditocard')
      const contactForm = document.querySelector('.contact-form')
      
      if (lopere) timeline.fromTo(lopere, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
      if (ditocard.length > 0) timeline.fromTo(ditocard, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
      if (contactForm) timeline.fromTo(contactForm, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
  }
}

const updateFirstSlideStatus = () => {
  isFirstSlideActive.value = activeSlideIndex.value === 0;
}

// Fonction supprimée - utiliser la version GSAP définie plus haut

// Initialisation de ScrollTrigger
const initScrollTrigger = () => {
  if (process.client) {
    // Initialiser les animations pour la slide 73
    if (document.querySelector('#section-slide-73')) {
      initSlide73Animation();
    }
  }
};

/* 
// Cette fonction utilisait ScrollMagic qui a été remplacé par GSAP ScrollTrigger
// Elle est commentée pour éviter les erreurs, car nous utilisons maintenant GSAP et ScrollTrigger
const initScrollMagic = () => {
  // Code supprimé car nous utilisons GSAP ScrollTrigger à la place
};
*/

// Formulaire de contact
const formData = ref({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: ''
})

const showAlert = ref(false)
const alertType = ref('')
const alertMessage = ref('')

const submitForm = async () => {
    loading.value = true
    try {
        const response = await fetch('https://public.herotofu.com/v1/f69a2860-b0b2-11ef-b6f4-4774a3a77de8', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: `${formData.value.firstName} ${formData.value.lastName}`,
                email: formData.value.email,
                company: formData.value.company,
                phone: formData.value.phone,
            })
        })

        if (response.ok) {
            alertType.value = 'alert-success'
            alertMessage.value = 'Message envoyé avec succès !',
                formData.value = {
                    firstName: '',
                    lastName: '',
                    email: '',
                    company: '',
                    phone: ''
                }
        }
    } catch (error) {
        alertType.value = 'alert-danger'
        alertMessage.value = 'Une erreur est survenue. Veuillez réessayer.'
    } finally {
        showAlert.value = true
        loading.value = false
        setTimeout(() => {
            showAlert.value = false
        }, 5000)
    }
}

// Variables pour suivre l'état de la slide 73
const slide73AnimationComplete = ref(false);
const slide73Progress = ref(0);
const slide73ElementsList = [
  { selector: '.slide-73-title', threshold: 0.1 },
  { selector: '.slide-73-content', threshold: 0.25 },
  { selector: '.points-fort', threshold: 0.4 }
];
const slide73Points = ref([]);
const slide73WheelHandler = ref(null);

const slide21AnimationComplete = ref(false);
const slide21Progress = ref(0);
const slide21WheelHandler = ref(null);

// Fonction principale d'initialisation GSAP
const gsapInitialization = () => {
  if (!process.client) return;

  // Configuration GSAP
  gsap.registerPlugin(ScrollTrigger);
  gsap.registerPlugin(Observer);
  gsap.registerPlugin(ScrollToPlugin);

  // Configuration des easing functions
  gsap.config({
    easeInOutCubic: function (progress) {
      return progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    }
  });

  // Configuration pour l'animation
  let sectionEase = "power3.easeinOut";
  let slideEase = "power3.easeinOut";
  let otherAnimationEase = "easeInOutCubic";

  let sectionDuration = 0.8;
  let slideDuration = 0.7;

  let animInprogress = false;
  let animTimeStamp, animTimeStamp2;

  // Mettre à jour l'état de la diapositive active
  const updateSlideState = () => {
    // Vérifier si nous sommes sur la première diapositive
    isFirstSlideActive.value = activeSlideIndex.value === 0;
    
    // Vérifier si nous sommes sur la dernière diapositive
    isLastSlideActive.value = activeSlideIndex.value === sortedSlides.length - 1;
    
    console.log(`État mis à jour - Slide ${activeSlideIndex.value} active`);
  };

  // Préparation des éléments d'animation
  const prepareElements = () => {
    console.log("Préparation des éléments d'animation");
    
    // Spécifique pour la slide 73
    if (document.querySelector('#slide-73')) {
      // Titre principal et introduction
      const title73 = document.querySelector('.slide-73-title');
      const content73 = document.querySelector('.slide-73-content');
      
      if (title73) gsap.set(title73, { opacity: 0, y: 30, visibility: 'visible' });
      if (content73) gsap.set(content73, { opacity: 0, y: 30, visibility: 'visible' });
      
      // Pour chaque point, masquer à la fois le conteneur et ses h3/p enfants
      const points = document.querySelectorAll('.slide-73-point');
      points.forEach(point => {
        gsap.set(point, { opacity: 0, y: 30 });
        
        // Masquer spécifiquement les h3 et p à l'intérieur de chaque point
        const h3 = point.querySelector('h3');
        const p = point.querySelector('p');
        
        if (h3) gsap.set(h3, { opacity: 0, y: 30 });
        if (p) gsap.set(p, { opacity: 0, y: 30 });
      });
    }
    
    // Masquer les éléments des autres slides
    document.querySelectorAll('.slide-container:not(#slide-73)').forEach(slide => {
      // Cibler tous types d'éléments qui doivent être animés
      slide.querySelectorAll('h1, h2, h3, .text-element, p, li, .sub-section').forEach(element => {
        gsap.set(element, { opacity: 0, y: 30 });
      });
    });

    // Slide 21
    const title21 = document.querySelector('.slide-21-title');
    const pointElements = document.querySelectorAll('.slide-21-point');
    
    if (title21) gsap.set(title21, { opacity: 0, y: 30 });
    pointElements.forEach(element => {
      gsap.set(element, { opacity: 0, y: 30 });
    });
  };

  // Créer la timeline principale
  let mastertl = gsap.timeline({
    paused: true,
    defaults: {
      ease: otherAnimationEase,
      duration: 0.3,
      autoAlpha: 0,
      onComplete: () => {
        animInprogress = false;
      },
      onReverseComplete: () => {
        animInprogress = false;
      }
    },
  });

  // Initialiser la timeline principale
  const initMasterTimeline = () => {
    prepareElements();

    // SLIDE 73 ANIMATIONS - Séquence demandée
    // 1. Animation du titre (avec visibility pour corriger l'attribut caché)
    mastertl.to('.slide-73-title', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.4,
      ease: 'power2.out'
    }).addPause()
    
    // 2. Animation du contenu
    .to('.slide-73-content', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration:1,
      ease: 'power2.out'
    }).addPause()
    .addPause()
    .addPause()
    .addPause()
    
    // 3. D'abord animer le conteneur .points-fort avec un sélecteur plus spécifique
    .to('#slide-73 .points-fort', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.4,
      ease: 'power2.out'
    }).addPause()
    
    // 4. Maintenant nous allons animer chaque point + son contenu h3 et p
    // Point 1 - d'abord le conteneur
    .to('#slide-73 .slide-73-point.point-0', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.3,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    // Puis son titre h3
    .to('#slide-73 .slide-73-point.point-0 h3', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.4,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    // Puis son texte p
    .to('#slide-73 .slide-73-point.point-0 p', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    }).addPause()
    
    // Point 2
    .to('#slide-73 .slide-73-point.point-1', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.3,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    .to('#slide-73 .slide-73-point.point-1 h3', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    .to('#slide-73 .slide-73-point.point-1 p', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    }).addPause()
    
    // Point 3
    .to('#slide-73 .slide-73-point.point-2', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.3,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    .to('#slide-73 .slide-73-point.point-2 h3', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    .to('#slide-73 .slide-73-point.point-2 p', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    }).addPause()
    
    // Point 4
    .to('#slide-73 .slide-73-point.point-3', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.3,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    .to('#slide-73 .slide-73-point.point-3 h3', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    .to('#slide-73 .slide-73-point.point-3 p', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    }).addPause()

    // Transition vers slide 21
    .to(window, { 
      scrollTo: { y: '#section-slide-21', autoKill: false }, 
      duration: sectionDuration, 
      ease: sectionEase,
      autoAlpha: 1
    })
    
    // SLIDE 21 ANIMATIONS avec la même approche que la slide 73
    // 1. Animation du titre
    .to('#slide-21 .slide-21-title', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.4,
      ease: 'power2.out'
    }).addPause()
    
    // 2. Animation du point 1
    .to('#slide-21 .slide-21-point.point-21-0', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.3,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    // Titre h3 du point 1
    .to('#slide-21 .slide-21-point.point-21-0 h3', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    // Texte p du point 1
    .to('#slide-21 .slide-21-point.point-21-0 p', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    }).addPause()
    
    // 3. Animation du point 2
    .to('#slide-21 .slide-21-point.point-21-1', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.3,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    // Titre h3 du point 2
    .to('#slide-21 .slide-21-point.point-21-1 h3', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    // Texte p du point 2
    .to('#slide-21 .slide-21-point.point-21-1 p', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    }).addPause()
    
    // 4. Animation du point 3
    .to('#slide-21 .slide-21-point.point-21-2', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.3,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    // Titre h3 du point 3
    .to('#slide-21 .slide-21-point.point-21-2 h3', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    })
    // Légère pause
    .to({}, {duration: 0.2})
    // Texte p du point 3
    .to('#slide-21 .slide-21-point.point-21-2 p', {
      opacity: 1,
      y: 0,
      visibility: 'visible',
      duration: 0.2,
      ease: 'power2.out'
    }).addPause()

    // D'autres animations pour d'autres slides peuvent être ajoutées ici
  };

  // Configurer l'observateur pour le défilement
const setupObserver = () => {
  try {
    // D'abord, masquer tous les éléments d'animation
    // Parcourir toutes les slides et masquer leurs sous-éléments
    document.querySelectorAll('.slide-container').forEach(slide => {
      // Masquer tous les titres h1, h2, h3 et les text-element
      slide.querySelectorAll('h1, h2, h3, .text-element, p').forEach(element => {
        gsap.set(element, { opacity: 0, y: 30 });
      });
    });

    // Configurer l'observateur avec GSAP
    Observer.create({
      type: 'wheel,touch',
      wheelSpeed: -1,
      onDown: () => {
        if (!isAnimating.value) {
          navigateToSlide(activeSlideIndex.value + 1);
        }
      },
      onUp: () => {
        if (!isAnimating.value) {
          navigateToSlide(activeSlideIndex.value - 1);
        }
      },
      tolerance: 10,
      preventDefault: true
    });
    
    console.log('GSAP Observer configuré avec succès');
  } catch (error) {
    console.error("Erreur lors de la configuration de l'observateur:", error);
    
    // Fallback sans Observer - utiliser un écouteur d'événements standard
    const wheelHandler = (event) => {
      event.preventDefault();
      if (event.deltaY > 0) {
        // Défilement vers le bas
        if (!isAnimating.value) {
          navigateToSlide(activeSlideIndex.value + 1);
        }
      } else {
        // Défilement vers le haut
        if (!isAnimating.value) {
          navigateToSlide(activeSlideIndex.value - 1);
        }
      }
    };
    
    window.addEventListener('wheel', wheelHandler, { passive: false });
    console.log('Fallback de défilement configuré');
    
    // Retourner une fonction pour nettoyage
    return () => {
      window.removeEventListener('wheel', wheelHandler);
    };
  }
};

  // Navigation avec les touches fléchées
  const setupKeyboardNavigation = () => {
    const handleKeyDown = (key) => {
      key.preventDefault();
      if (key.keyCode == '38') { // Flèche vers le haut
        if (mastertl.totalProgress() <= 1) {
          mastertl.reverse();
        }
      } else if (key.keyCode == '40') { // Flèche vers le bas
        if (mastertl.totalProgress() < 1) {
          mastertl.play();
        }
      }
    };

    document.onkeydown = handleKeyDown;
  };

  // Initialiser tous les composants
  initMasterTimeline();
  setupObserver();
  setupKeyboardNavigation();

  // Nettoyer en cas de destruction
  return () => {
    mastertl.kill();
    document.onkeydown = null;
  };
};

// Conserver ces fonctions pour compatibilité avec le reste du code
// Mais leur implémentation est maintenant gérée par gsapInitialization
const initSlide73Animation = () => {
  if (!process.client) return;
  // L'animation sera gérée par gsapInitialization
};

const updateSlide73Animations = () => {
  // Cette fonction est remplacée par la timeline GSAP
};

const initSlide21Animation = () => {
  if (!process.client) return;
  // L'animation sera gérée par gsapInitialization
};

const updateSlide21Animations = (titleElement, pointElements) => {
  // Cette fonction est remplacée par la timeline GSAP
};

// Initialisation des données au chargement
onMounted(() => {
  slidesStore.fetchSlides().then(() => {
    // Masquer tous les éléments par défaut
    if (process.client) {
      // S'assurer que ScrollTrigger est enregistré
      if (typeof gsap.ScrollTrigger === 'undefined') {
        console.log('Ré-enregistrement de ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
      }

      // Initialiser le système de défilement contrôlé par GSAP
      nextTick(() => {
        // Initialiser les animations GSAP
        gsapInitialization();
        
        // Initialiser le système de défilement
        initScrollControl();
        
        // Configuration initiale : rendre la première section active
        const firstSection = document.querySelector('.section');
        if (firstSection) {
          firstSection.classList.add('active');
          firstSection.classList.add('in-view');
        }
        
        console.log('Système de défilement GSAP initialisé');
      });
    }
  });
  slidesStore.startAutoRefresh();
});

// Nettoyage avant démontage du composant
onBeforeUnmount(() => {
  if (process.client) {
    // Arrêter tout refresh automatique si nécessaire
    if (typeof slidesStore.stopAutoRefresh === 'function') {
      slidesStore.stopAutoRefresh();
    }
    window.removeEventListener('resize', checkScreenSize);
    
    // Supprimer le gestionnaire d'événements wheel pour la slide 73
    if (slide73WheelHandler.value) {
      const section = document.querySelector('#section-slide-73');
      if (section) {
        section.removeEventListener('wheel', slide73WheelHandler.value);
      }
    }
    
    // Supprimer le gestionnaire d'événements wheel pour la slide 21
    if (slide21WheelHandler.value) {
      const section = document.querySelector('#section-slide-21');
      if (section) {
        section.removeEventListener('wheel', slide21WheelHandler.value);
      }
    }
    
    // Nettoyer les instances GSAP
    if (typeof gsap !== 'undefined' && typeof gsap.killTweensOf === 'function') {
      gsap.killTweensOf('*');
    }
    
    // Nettoyer ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.getAll === 'function') {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
    
    // Nettoyer Observer
    if (typeof Observer !== 'undefined' && typeof Observer.getAll === 'function') {
      Observer.getAll().forEach(observer => observer.kill());
    }
  }
});

// Responsive design
const isMobile = ref(false);

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 1025;
}

// Navigation mobile
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
}

const goToSlide = (index) => {
  if (swiperRef.value && swiperRef.value.swiper) {
    swiperRef.value.swiper.slideTo(index);
    isMenuOpen.value = false;
  }
}

// Meta tags
useHead({
  title: 'TXT Engage - Vodafone'
});

// Fonctions pour extraire le titre, le texte et l'image du HTML des paragraphes
const extractTitle = (html) => {
  const match = html.match(/<h3>(.*?)<\/h3>/);
  return match ? match[1] : '';
}

const extractTextContent = (html) => {
  // Extraire le contenu texte (paragraphes et listes) en excluant les images
  let content = html.replace(/<h3>.*?<\/h3>/, ''); // Enlever le titre
  content = content.replace(/<img.*?\/?>/g, ''); // Enlever les balises img
  return content;
}

const extractImage = (html) => {
  const match = html.match(/src="([^"]*?)"/);
  return match ? match[1] : '';
};

// Fonction pour gérer l'accordéon de la section #casestudy
const caseStudyActiveIndex = ref(0);

const initCaseStudyAccordion = () => {
  // Afficher par défaut le premier élément
  caseStudyActiveIndex.value = 0;
}

const toggleCaseStudySection = (index) => {
  caseStudyActiveIndex.value = index;
};

// Fonction pour initialiser les Intersection Observers pour les animations
const initIntersectionObservers = () => {
  // Style par défaut pour les text-elements
  const textElements = document.querySelectorAll('#section-slide-10 .text-element');
  if (textElements.length > 0) {
    gsap.set(textElements, { opacity: 0, y: 30 }); // Position initiale invisible
  }

  // Observer pour la slide 10 (animation des text-elements et déplacement de l'arrière-plan)
  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.3 // Déclencher quand au moins 30% de la slide est visible
  };

  // Observer pour réinitialiser l'arrière-plan quand on quitte la slide 10
  const resetBackgroundObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting && isMobile.value) {
        // Réinitialiser la position de l'arrière-plan
        const wrapper = document.getElementById('vodacomwrapper');
        if (wrapper) {
          gsap.to(wrapper, {
            backgroundPositionY: "0px",
            duration: 0.5
          });
        }
        
        // Réinitialiser l'opacité des éléments pour la prochaine fois
        if (textElements.length > 0) {
          gsap.set(textElements, { opacity: 0, y: 30 });
        }
      }
    });
  }, { ...observerOptions, threshold: 0.1 });

  // Observer les slides spécifiques
  nextTick(() => {
    const slide10Element = document.querySelector('#section-slide-10');
    if (slide10Element) {
      resetBackgroundObserver.observe(slide10Element);
    }
  });
};
</script>

<template>
  <div id="vodacomwrapper" ref="fullpageRef">
    <!-- Couches d'arrière-plan pour transition fluide -->
    <div class="background-layer background-primary"></div>
    <div class="background-layer background-secondary"></div>
    
    <div v-if="loading" class="loader-container">
      <nuxt-img src="/images/logovector.svg" class="logo-loader" alt="Logo" />
    </div>
    
    <div v-if="!loading && slidesStore.error" class="error-container">
      <div class="error-message">
        <p>{{ slidesStore.error }}</p>
        <button @click="slidesStore.fetchSlides()" class="retry-button">Réessayer</button>
      </div>
    </div>

    <header class="fixed-top">
      <div id="headerpadding" class="p-4 flex-row justify-content-between align-items-center">
        <img src="/images/logovector.svg" alt="Logo" />
        <div class="menu-container">
          <button class="hamburger" @click="toggleMenu" :class="{ 'is-active': isMenuOpen }">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav id="menu" class="slide-menu" :class="{ 'is-open': isMenuOpen }">
            <ul>
              <li v-for="(slide, index) in sortedSlides" :key="slide.id"
                :class="{ active: activeSlideIndex === index }" @click="goToSlide(index)">
                <span class="slide-label">{{ slide.menuTitle }}</span>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>

    <!-- Barre de défilement personnalisée style macOS -->
    <CustomScrollbar 
      :scrollContainer="scrollContainerRef" 
      :activeSection="activeSlideIndex" 
      :totalSections="sortedSlides.length" 
    />

    <!-- Structure basée sur des sections pour GSAP ScrollTrigger -->
    <div id="scroll-container" ref="scrollContainerRef" class="scroll-container">
      <!-- Loop through slides -->
      <div v-for="(slide, index) in sortedSlides" :key="slide.id" 
        :class="['section', index === activeSlideIndex ? 'active' : '', `section-${index}`]" 
        :id="`section-slide-${slide.id}`">
        
        <div :id="`slide-${slide.id}`" class="slide-container animate__animated animate__fadeIn"
          :style="{ backgroundImage: isMobile ? (slide.backgroundMobile ? `url(${slide.backgroundMobile})` : 'none') : (slide.thumbnail ? `url(${slide.thumbnail})` : 'none') }">
          
          <!-- Première slide -->
          <div v-if="slide.id === 73" class="txtintro row m-0 p-0" ref="slide73">
            <div class="firstContainer">
              <div class="slapjh">
                <div class="subint" id="subint">
                  <h2 class="text-element slide-73-title" v-html="slide.title"></h2>
                  <p class="text-element slide-73-content" v-html="slide.wp_content"></p>
                </div>
                <div class="points-fort" id="points-fort">
                  <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx"
                    class="text-element slide-73-point" :class="`point-${idx}`" v-html="paragraph">
                  </div>
                </div>
              </div>
            </div>
          </div>
          
   
          
          <!-- No internet access needed -->
          <div v-else-if="slide.id === 21" id="thoiathoing" class="p-0 m-0">
            <div class="cont p-2">
              <div class="row">
                <h3 id="mshill" class="slide-21-title" v-html="slide.wp_content"></h3>
              </div>
              <div class="row flex-row">
                <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx"
                  class="text-element slide-21-point col m-0 p-2" :class="`point-21-${idx}`" v-html="paragraph">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Reach 32 million customers -->
          <div v-else-if="slide.id === 20" id="kiff" class="p-0 m-0">
            <div id="usruu">
              <div id="mzu" class="nusrru">
                <h2 id="slide2a" class="text-element" v-html="slide.wp_title"></h2>
                <h2 id="slide2b" class="text-element" v-html="slide.title"></h2>
                <div id="slide2c" class="apitch" v-html="slide.content"></div>
              </div>
              <div id="guysamuel" class="gee">
                <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx" class="text-element"
                  v-html="paragraph">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Reach 32 million customers part deux -->
          <div v-else-if="slide.id === 114" id="kiffyu" class="p-0 m-0">
            <div id="tchoffo">
              <div id="deffp" class="preme">
                <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx" class="text-element"
                  v-html="paragraph">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Other advantages -->
          <div v-else-if="slide.id === 22" id="thoiathoing" class="p-0 m-0">
            <div class="cont p-2">
              <div class="row">
                <h3 id="mshill" v-html="slide.wp_content"></h3>
              </div>
              <div class="row flex-row align-content-center align-items-center juustify-content-center">
                <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx"
                  class="text-element col m-0 p-2" v-html="paragraph">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Features Slider -->
          <div v-else-if="slide.id === 23" id="bygone-bip" class="p-0 m-0">
            <div class="container">
              <div id="perdrix" class="row">
                <div class="perdrix-slider">
                  <div class="perdrix-slider-container">
                    <div class="perdrix-slider-navigation">
                      <button class="perdrix-nav-prev"><i class="fas fa-chevron-left"></i></button>
                      <button class="perdrix-nav-next"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    
                    <div class="perdrix-slides-wrapper">
                      <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx" 
                        class="perdrix-slide" :class="{ 'active': idx === activeIndex }">
                        <div class="split-container">
                          <div class="text-container">
                            <h3 v-if="extractTitle(paragraph)">{{ extractTitle(paragraph) }}</h3>
                            <div class="text-content" v-html="extractTextContent(paragraph)"></div>
                          </div>
                          <div class="image-container">
                            <img v-if="extractImage(paragraph)" :src="extractImage(paragraph)" 
                              alt="Feature illustration" class="feature-image" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="perdrix-pagination">
                      <span v-for="(paragraph, idx) in slide.paragraphs" :key="idx"
                        class="perdrix-bullet" :class="{ 'active': idx === activeIndex }"
                        @click="activeIndex = idx"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Features -->
          <div v-else-if="slide.id === 59">
            <div id="killerjunior" class="ouh">
              <div class="row">
                <div class="col-md-5 leporc">
                  <h2 class="text-element aya" v-html="slide.title"></h2>
                  <p v-html="slide.wp_content"></p>
                </div>
                <div class="col-md-7 kankan">
                  <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx" class="lemouds"
                    v-html="paragraph">
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Case Study -->
          <div v-else-if="slide.id === 128">
            <div id="killerwu" class="ouh">
              <div class="case-study-container">
                <div class="row">
                  <div class="col-md-7">
                    <div id="casestudy">
                      <div id="dec">  
                        <h2 class="text-element aya" v-html="slide.title"></h2>
                        <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx"
                          class="text-element col m-0 p-2" 
                          :class="{'case-study-active': idx === caseStudyActiveIndex, 'case-study-item': true}">
                          <h3 @click="toggleCaseStudySection(idx)" class="case-study-header">
                            {{ extractTitle(paragraph) }}
                            <span class="case-study-indicator">{{ idx === caseStudyActiveIndex ? '−' : '+' }}</span>
                          </h3>
                          <div class="case-study-content" :class="{'case-study-content-visible': idx === caseStudyActiveIndex}">
                            <div v-html="extractTextContent(paragraph)"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-5">
                    <div class="case-study-image">
                      <img v-if="slide.thumbnail" :src="slide.thumbnail" alt="Case Study Image" class="img-fluid">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Contact Form -->
          <div id="lemof" v-else-if="slide.id === 60">
            <div id="lafill" class="container">
              <h2 class="text-element lopere" v-html="slide.title"></h2>
              <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx"
                class="text-element ditocard" v-html="paragraph">
              </div>
              <div class="form-container">
                <div v-if="showAlert" :class="['alert', alertType]" role="alert">
                  {{ alertMessage }}
                </div>
                <form @submit.prevent="submitForm" class="contact-form">
                  <div class="row">
                    <div class="col-md-6">
                      <input v-model="formData.firstName" type="text" class="form-control"
                        placeholder="First Name" required>
                    </div>
                    <div class="col-md-6 col-sm-12">
                      <input v-model="formData.lastName" type="text" class="form-control"
                        placeholder="Last Name" required>
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-12">
                      <input v-model="formData.company" type="text" class="form-control"
                        placeholder="Company Name" required>
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-12">
                      <input v-model="formData.phone" type="tel" class="form-control"
                        placeholder="Contact Number" required>
                    </div>
                  </div>

                  <div class="row submit-row">
                    <div class="col-md-">
                      <button type="submit" class="btn btn-primary" :disabled="loading">
                        {{ loading ? 'Sending...' : 'Submit' }}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div id="yenamarre" class="d-flex align-items-center justify-content-center m-4">
                <!-- Back to top button -->
                <a @click="goToFirstSlide" class="back-to-top" :class="{ 'show': showButton }">
                  <img src="/images/backToTop.svg" alt="Back to Top" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
/* Styles pour le système de défilement basé sur GSAP */

:root {
  overflow: hidden;
}

#vodacomwrapper {
  height: 100vh;
  position: fixed;
  width: 100%;
}

.slide-container {
  overflow: hidden;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: 50% 50%;
}

.loader-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white !important
}

.logo-loader {
  width: 50px;
  animation: logoAnimation 2s infinite;
}

@keyframes logoAnimation {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.text-element {
  margin: 20px 0;
}

.container-full {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 15px;
}

.txtintro {
  width: 100%;
  height: 100%;
}

#slide-1 {
  background: rgba(0, 0, 0, 0);
}

#slide-2 {
  background: linear-gradient(45deg, #1a75ff, #4da6ff);
}

#slide-3 {
  background: linear-gradient(45deg, #1aff66, #66ff99);
}

#slide-4 {
  background: linear-gradient(45deg, #ffcc00, #ffdd4d);
}

/* Styles pour le système de défilement basé sur GSAP */
.scroll-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.section {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
}

.section.active {
  opacity: 1;
  pointer-events: auto;
  z-index: 2;
}

.section.in-view {
  z-index: 2;
}

/* Animation d'entrée/sortie pour les sections */
.section.enter-active {
  animation: fadeIn 0.5s ease forwards;
}

.section.leave-active {
  animation: fadeOut 0.5s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.section {
  height: 100vh;
  width: 100%;
}

/* Pagination personnalisée de fullPage.js */
#fp-nav ul li a span, 
.fp-slidesNav ul li a span {
  background: #e60000;
}

/* Style pour le menu de navigation */
.menu-container {
  position: relative;
}

.hamburger {
  width: 30px;
  height: 25px;
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 101;

  span {
    display: block;
    position: absolute;
    height: 3px;
    width: 100%;
    background: #e60000;
    transition: 0.3s ease;

    &:nth-child(1) {
      top: 0;
    }

    &:nth-child(2) {
      top: 50%;
      transform: translateY(-50%);
    }

    &:nth-child(3) {
      bottom: 0;
    }
  }

  &.is-active {
    span {
      &:nth-child(1) {
        transform: rotate(45deg);
        top: 11px;
      }

      &:nth-child(2) {
        opacity: 0;
      }

      &:nth-child(3) {
        transform: rotate(-45deg);
        bottom: 11px;
      }
    }
  }
}

.slide-menu {
  position: fixed;
  top: 0;
  right: -300px;
  width: 300px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  padding: 80px 20px;
  transition: 0.3s ease;
  z-index: 100;

  &.is-open {
    right: 0;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 15px 0;
    color: white;
    cursor: pointer;
    transition: 0.3s ease;

    &:hover {
      color: #e60000;
    }

    &.active {
      color: #e60000;
    }
  }
}

.menu-container {
  position: fixed;
  right: 31px;
  color: white;
  top: 29px;

  .hamburger {
    span {
      background-color: white;
    }
  }
}

/* Style pour les couches d'arrière-plan */
.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

.background-primary {
  background-image: url(/images/bg12.webp);
  opacity: 1;
}

.background-secondary {
  background-image: url(/images/nono.webp);
  opacity: 0;
}

/* Slider Perdrix */
.perdrix-slider {
  width: 100%;
  height: 80vh;
  position: relative;
  margin: 0 auto;
  max-width: 90%;
}

.perdrix-slider-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.perdrix-slides-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.perdrix-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.active {
    opacity: 1;
    z-index: 5;
  }
}

.split-container {
  display: flex;
  width: 100%;
  height: 100%;
  border-radius: 15px;
  overflow: hidden;
}

.text-container {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.text-container h3 {
  color: #fff;
  font-size: 2rem;
  margin-bottom: 20px;
  font-weight: 700;
}

.text-content {
  color: #fff;
  font-size: 1.1rem;
  line-height: 1.6;
}

.text-content ul {
  padding-left: 20px;
  margin: 15px 0;
}

.text-content li {
  margin-bottom: 8px;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

.feature-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.feature-image:hover {
  transform: scale(1.05);
}

.perdrix-slider-navigation {
  position: absolute;
  top: 50%;
  width: 100%;
  z-index: 10;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  
  button {
    background-color: rgba(255, 255, 255, 0.7);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.9);
    }
  }
}

.perdrix-pagination {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 10;
  
  .perdrix-bullet {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    margin: 0 5px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &.active {
      background: #ffffff;
      transform: scale(1.2);
    }
  }
}

/* Responsive */
@media screen and (max-width: 992px) {
  .split-container {
    flex-direction: column;
  }
  
  .text-container, .image-container {
    flex: none;
    width: 100%;
  }
  
  .text-container {
    padding: 30px;
  }
  
  .image-container {
    height: 250px;
  }
}

#thoiathoing {
  .row {
    height: auto;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    &:nth-of-type(1) {
      margin-bottom: 2em;
    }

    &:nth-of-type(2) {
      .text-element {
        min-height: auto;
        margin: 1em 0;

        p {
          min-height: auto;
          line-height: 0.7 !important;
          padding: 0em;
        }
      }
    }
  }

  .cont {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

/* Styles pour le case study accordéon */
#casestudy {
  padding: 0;
  margin: 20px 0 !important;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  max-width: 100% !important;
}

#casestudy .text-element {
  margin: 0;
  padding: 0;
  width: 100%;
}

.case-study-item {
  margin-bottom: 0px;
  border-radius: 0px;
  overflow: hidden;
  width: 100%;
}

.case-study-container {
  .col-md-6 {
    &:nth-of-type(1) {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
  }
}

#casestudy {
  height: 100vh;
  
  .aya {
    font-family: Vodafone;
    font-size: 102px;
    font-weight: bold;
    font-stretch: normal;
    font-style: normal;
    line-height: 1;
    letter-spacing: normal;
    text-align: left;
    color: #f00;
    padding-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  
  .case-study-header {  
    width: 100%;
    display: block;
    justify-content: center;
    align-items: flex-start;
    opacity: 0.27;
    font-family: Vodafone;
    font-size: 48px;
    font-weight: bold;
    font-stretch: normal;
    font-style: normal;
    line-height: 0.83;
    letter-spacing: normal;
    text-align: left;
    color: #231f20;
    
    &:hover {
      cursor: pointer;
      opacity: 1;
      color: #ff0000;
    }
  }

  .case-study-active {
    h3 {
      cursor: pointer;
      opacity: 1;
      color: #ff0000;
    }
  }
}

.case-study-indicator {
  display: none;
  font-size: 24px;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.case-study-active .case-study-indicator {
  transform: rotate(180deg);
}

.case-study-content {
  max-height: 0;
  display: block;
  width: 100%;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.2s ease;
  padding: 0;
  opacity: 0;
  transform: translateY(-10px);
  
  ul {
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: row;
    
    li {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      margin-right: 4em;
      font-family: Raleway;
      font-size: 23px;
      font-weight: normal;
      font-stretch: normal;
      font-style: normal;
      line-height: 1.44;
      letter-spacing: normal;
      text-align: left;
      color: #000;
      
      strong {
        width: 94px;
        height: 94px;
        flex-grow: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        background-color: #f00;
        border-radius: 100%;
        font-family: Vodafone;
        font-size: 50px;
        font-weight: bold;
        font-stretch: normal;
        font-style: normal;
        line-height: 0.8;
        letter-spacing: normal;
        text-align: center;
        color: #fff;
        
        span {
          font-size: 21px;
        }
      }
    }
  }
}

.case-study-content-visible {
  max-height: 500px;
  padding: 0px;
  opacity: 1;
  transform: translateY(0);
  transition: max-height 0.4s ease, padding 0.2s ease, opacity 0.3s ease, transform 0.3s ease;
}

/* Style des éléments à l'intérieur de l'accordéon */
.case-study-content ul {
  padding-left: 20px;
  margin: 10px 0;
}

.case-study-content strong {
  color: #e60000;
  font-size: 1.2em;
}

/* Ajout des styles CSS pour la disposition en deux colonnes (accordéon et image) dans la section case study */
.case-study-container {
  display: flex;
  width: 100%;
  gap: 30px;
  align-items: flex-start;
  margin-top: 20px;
  background-color: #d9d9d9;
}

#casestudy {
  flex: 1;
  max-width: 60%;
}

.case-study-image img:hover {
  transform: scale(1.05);
}

/* Responsive design pour les appareils mobiles */
@media screen and (max-width: 992px) {
  .case-study-container {
    flex-direction: column;
  }
  
  #casestudy, .case-study-image {
    max-width: 100%;
  }
  
  .case-study-image {
    margin-top: 20px;
    order: -1;
  }
}

/* Arrière-plans spécifiques pour mobile */
@media screen and (max-width: 1024px) {
  .background-primary {
    background-image: url(/images/bgmbile.jpg);
  }
  
  .background-secondary {
    background-image: url(/images/Group184.webp);
  }
}

/* Formulaire */
.alert {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 4px;
  animation: fadeIn 0.3s ease;
}

.alert-success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

#yenamarre {
  a {
    &:hover {
      cursor: pointer;
    }
  }
}

.back-to-top {
  width: 128px;
  height: 80px;
  position: fixed;
  margin: auto;
  right: 0;
  bottom: 1em;
  left: 0;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
}

.back-to-top:hover {
  transform: scale(1.1);
}

/* Animation pour toutes les slides */
.slide-container h1, 
.slide-container h2, 
.slide-container h3, 
.slide-container p, 
.slide-container .text-element,
.slide-container li,
.slide-container .sub-section {
  opacity: 0; /* Masquer par défaut */
  transform: translateY(30px); /* Décalage initial */
  transition: opacity 0.4s ease, transform 0.4s ease; /* Transition douce */
}

/* Animation pour la slide 73 */
#section-slide-73 {
  position: relative;
  overflow: visible !important; /* Éviter que fullpage.js ne masque le contenu */
  z-index: 10;
}

#section-slide-73 #points-fort {
  opacity: 0; /* Initialement masqué */
}

#section-slide-73 #points-fort .text-element {
  opacity: 0; /* Initialement masqués */
  transform: translateY(30px);
  text-align: left;
  align-items: flex-start;
}

/* Classes pour le contrôle des animations */
.pinned {
  z-index: 100 !important;
}

/* Styles pour la slide 21 */
#section-slide-21 {
  position: relative;
  overflow: visible !important;
  z-index: 10;
}

#section-slide-21 .slide-21-title,
#section-slide-21 .slide-21-point {
  opacity: 0; /* Initialement masqués */
  transform: translateY(30px);
}

#section-slide-21 .slide-21-point {
  text-align: left;
}

.element-visible {
  opacity: 1 !important;
  transform: translateY(0) !important;
}
</style>