<script setup>
import { onMounted, ref, computed, reactive, nextTick, onUnmounted, onBeforeUnmount, watch } from 'vue'
import { useSlidesStore } from '~/stores/slides'
import { useRuntimeConfig } from '#app'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Observer } from 'gsap/Observer'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { CSSPlugin } from 'gsap/CSSPlugin' // Importer CSSPlugin
import CustomScrollbar from '~/components/CustomScrollbar.vue'

// Supprimer les enregistrements de plugins GSAP ici
// gsap.registerPlugin(ScrollTrigger, Observer, ScrollToPlugin, CSSPlugin) 

// // Enregistrer les plugins GSAP dans le contexte client
// if (process.client) {
//   gsap.registerPlugin(ScrollTrigger, Observer, ScrollToPlugin, CSSPlugin) 
// }

// Récupérer les configurations
const config = useRuntimeConfig()

// Références d'instances
const fullpageRef = ref(null)
const fullpageApi = ref(null)
const showButton = ref(false)
const slidesStore = useSlidesStore()
const loading = computed(() => slidesStore.loading)
const sortedSlides = computed(() => slidesStore.sortedSlides)
const activeSlideIndex = ref(0)
const activeSlideId = ref(null)
const defaultBackground = ref('url(/images/bg12.webp)')
const specialBackground = ref('url(/images/nono.webp)')
const currentBackground = ref(defaultBackground.value)

// Variable pour contrôler le défilement des sections
const canScrollToNextSection = ref(true)

// Références pour ScrollMagic
const scrollMagicController = ref(null)

let mastertl = null; // Déclarer mastertl ici

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

const isFirstSlideActive = ref(true)

// Fonction pour gérer le défilement de fullpage
const onLeave = (origin, destination, direction) => {
  // Si on essaie de quitter la slide 73 et que l'animation n'est pas terminée
  if (origin.item && origin.item.id === 'section-slide-73' && !slide73AnimationComplete.value) {
    // Forcer la progression à 1 pour terminer l'animation
    slide73Progress.value = 1;
    updateSlide73Animations();
    slide73AnimationComplete.value = true;
    return false; // Laisser l'événement onLeave de fullpage.js prendre le relais
  }
  // Si on essaie de quitter la slide 21 et que l'animation n'est pas terminée
  if (origin.item && origin.item.id === 'section-slide-21' && !slide21AnimationComplete.value) {
    // Forcer la progression à 1 pour terminer l'animation
    slide21Progress.value = 1;
    if (document.querySelector('.slide-21-title') && document.querySelectorAll('.slide-21-point')) {
      updateSlide21Animations(document.querySelector('.slide-21-title'), document.querySelectorAll('.slide-21-point'));
    }
    slide21AnimationComplete.value = true;
    return false; // Laisser l'événement onLeave de fullpage.js prendre le relais
  }
  return true;
};

// Options de configuration pour fullpage.js
const fullpageOptions = {
  licenseKey: '1EEMD-B27MY-J7J14-PVI3I-XOPOM',  // Clé valide pour le projet
  scrollingSpeed: 800,
  verticalCentered: true,
  navigation: true,
  navigationTooltips: ['Accueil', 'Services', 'Offres', 'Solutions', 'Clients', 'Impact Social', 'Contact', 'FAQ'],
  showActiveTooltip: true,
  menu: '#menu',
  anchors: ['slide1', 'slide2', 'slide3', 'slide4', 'slide5', 'slide6', 'slide7', 'slide8'],
  scrollOverflow: true,
  autoScrolling: true,  // Maintenir le défilement automatique entre les sections
  fitToSection: true,   // Ajuster la vue à la section
  showActiveTooltip: false,
  lockAnchors: true,    // Désactiver les hashtags dans l'URL
  easingcss3: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)',
  onLeave: function(origin, destination, direction) {
    const originSlideId = origin.item ? origin.item.id : null;

    if (mastertl) {
        if (originSlideId === 'section-slide-73') {
            const currentTime = mastertl.time();
            const animStart = mastertl.labels.slide73AnimStart;
            const animEnd = mastertl.labels.slide73AnimEnd;

            if (animStart !== undefined && animEnd !== undefined && currentTime >= animStart && currentTime < animEnd) {
                console.log('Animation de la slide 73 encore en cours. Blocage du défilement.');
                return false; // Bloquer le défilement
            }
        } else if (originSlideId === 'section-slide-21') {
            const currentTime = mastertl.time();
            const animStart = mastertl.labels.slide21AnimStart;
            const animEnd = mastertl.labels.slide21AnimEnd;

            if (animStart !== undefined && animEnd !== undefined && currentTime >= animStart && currentTime < animEnd) {
                console.log('Animation de la slide 21 encore en cours. Blocage du défilement.');
                return false; // Bloquer le défilement
            }
        }
    }

    // Empêcher le défilement vers le haut depuis la première slide
    if (origin.index === 0 && direction === 'up') {
      return false;
    }
    return true; // Autoriser le défilement par défaut
  },
  afterLoad: function(origin, destination, direction) {
    if (destination.index !== undefined) {
      activeSlideIndex.value = destination.index;
      updateFirstSlideStatus();
      animateSlideElements(destination.index); // Gère les animations pour les slides autres que 21/73
      
      const destSlideId = destination.item ? destination.item.id : null;

      if (mastertl) {
        if (destSlideId === 'section-slide-73') {
          if (mastertl.labels.slide73AnimStart !== undefined) {
            mastertl.seek(mastertl.labels.slide73AnimStart);
          } else {
            console.warn("Label slide73AnimStart non trouvé dans mastertl.");
          }
        } else if (destSlideId === 'section-slide-21') {
          if (mastertl.labels.slide21AnimStart !== undefined) {
            mastertl.seek(mastertl.labels.slide21AnimStart);
          } else {
            console.warn("Label slide21AnimStart non trouvé dans mastertl.");
          }
        } else {
          // Optionnel: Pour les autres slides, mettre mastertl en pause si elle ne doit pas être active
          // if (!mastertl.paused()) {
          //   mastertl.pause();
          // }
        }
      }
    }
    // La logique existante de afterLoad pour initSlide73Animation/initSlide21Animation (qui étaient vidées)
    // est maintenant gérée par le seek de mastertl ci-dessus.
  },
  afterRender: () => {
    fullpageApi.value = window.fullpage_api;
    // Initialiser ScrollTrigger après le rendu
    try {
      initScrollTrigger();
    } catch (error) {
      console.error('Erreur dans afterRender:', error);
    }
  }
};

// Animations des slides avec GSAP
const animateSlideElements = (activeIndex) => {
  const timeline = gsap.timeline()
  if (!sortedSlides.value[activeIndex]) return;

  // Animez uniquement les slides autres que 73 (qui a sa propre animation)
  if (sortedSlides.value[activeIndex]?.id === 73) {
    return; // Ne pas animer ici, c'est géré par ScrollTrigger
  }

  // Animation spécifique pour la slide 10 sur mobile
  if (sortedSlides.value[activeIndex]?.id === 10) {
      // Animation uniquement sur mobile
      if (isMobile.value) {
          // Décaler l'arrière-plan vers le haut
          const wrapper = document.getElementById('vodacomwrapper');
          if (wrapper) {
              gsap.to(wrapper, {
                  backgroundPositionY: "-30px",
                  duration: 0.8,
                  ease: "power1.out"
              });
          }

          // Animer les text-elements l'un après l'autre
          const textElements = document.querySelectorAll('#section-slide-10 .text-element');
          if (textElements.length > 0) {
              gsap.set(textElements, { opacity: 0, y: 30 }); // Position initiale
              gsap.to(textElements, {
                  opacity: 1,
                  y: 0,
                  duration: 0.5,
                  stagger: 0.2, // Délai entre chaque animation
                  ease: "back.out(1.7)"
              });
          }
      }
  } else if (sortedSlides.value[activeIndex]?.id !== 10 && isMobile.value) {
      // Réinitialiser la position de l'arrière-plan quand on quitte la slide 10
      const wrapper = document.getElementById('vodacomwrapper');
      if (wrapper) {
          gsap.to(wrapper, {
              backgroundPositionY: "0px",
              duration: 0.5
          });
      }
  }

  // Slide 20 - Reach 32 million customers
  if (sortedSlides.value[activeIndex]?.id === 20) {
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

  // Slide 21 - No internet access needed
  else if (sortedSlides.value[activeIndex]?.id === 21) {
      const mshill = document.getElementById('mshill')
      
      // Version Desktop
      if (window.innerWidth > 1024) {
          if (mshill) timeline.fromTo(mshill, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
          
          // Utiliser un sélecteur qui existe réellement
          const textElements = document.querySelectorAll('#thoiathoing .text-element')
          if (textElements.length > 0) {
              timeline.fromTo(textElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
          }
      }
      // Version Mobile
      else {
          if (mshill) timeline.fromTo(mshill, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
          
          // Utiliser un sélecteur qui existe réellement sur mobile
          const textElements = document.querySelectorAll('#thoiathoing .text-element')
          if (textElements.length > 0) {
              timeline.fromTo(textElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
          }
      }
  }

  // Slide 22 - Other advantages
  else if (sortedSlides.value[activeIndex]?.id === 22) {
      const mshill = document.getElementById('mshill')
      const textElements = document.querySelectorAll('#thoiathoing .text-element')
      
      if (mshill) timeline.fromTo(mshill, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
      if (textElements.length > 0) {
          timeline.fromTo(textElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
      }
  }

  // Slide 59
  else if (sortedSlides.value[activeIndex]?.id === 59) {
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

const goToFirstSlide = () => {
  if (fullpageApi.value) {
    fullpageApi.value.moveTo(1);
  } else {
    console.error('fullpage API is not available')
  }
}

// Initialisation de ScrollTrigger
const initScrollTrigger = () => {
  if (process.client) {
    // Initialiser les animations pour la slide 73
    if (document.querySelector('#section-slide-73')) {
      initSlide73Animation();
    }
  }
};

// Initialisation de ScrollMagic (déprécié, conservé pour référence)
const initScrollMagic = () => {
  if (process.client) {
    scrollMagicController.value = new ScrollMagic.Controller();
    
    // Exemple de scène ScrollMagic pour la première slide
    const textElements = document.querySelectorAll('#section-slide-10 .text-element');
    if (textElements.length > 0) {
      textElements.forEach((element, index) => {
        const tween = gsap.from(element, { 
          opacity: 0, 
          y: 50, 
          duration: 0.5, 
          delay: index * 0.1 
        });
        
        new ScrollMagic.Scene({
          triggerElement: element,
          triggerHook: 0.8,
          reverse: false
        })
        .setTween(tween)
        .addTo(scrollMagicController.value);
      });
    }
    
    // Animation pour la slide 73 avec pin (épingle)
    const slide73Section = document.querySelector('#section-slide-73');
    const pointsFort = document.querySelector('#section-slide-73 #points-fort');
    
    if (slide73Section && pointsFort) {
      // Créer une timeline pour l'animation des éléments
      const timeline = gsap.timeline();
      
      // Récupérer tous les éléments texte dans points-fort
      const textElements = document.querySelectorAll('#section-slide-73 #points-fort .text-element');
      
      // D'abord, masquer tous les éléments
      gsap.set(textElements, { opacity: 0, y: 20 });
      
      // Rendre le conteneur points-fort visible immédiatement
      timeline.to(pointsFort, { opacity: 1, duration: 0.1 });
      
      // Puis animer chaque élément texte un par un
      textElements.forEach((element, index) => {
        timeline.to(element, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "back.out(1.4)"
        }, "+=0.3"); // Ajouter un délai entre chaque animation
      });
      
      // Créer une scène avec pin pour maintenir la section visible pendant l'animation
      const pinScene = new ScrollMagic.Scene({
        triggerElement: slide73Section,
        triggerHook: 0.2, // Déclencher près du haut de la fenêtre
        duration: timeline.duration() * 1000, // Convertir la durée de la timeline en pixels (approximatif)
        reverse: true // Permettre l'inversion de l'animation lors du défilement vers le haut
      })
      .setPin(slide73Section, {pushFollowers: true}) // Épingler la section pendant l'animation
      .setTween(timeline) // Associer la timeline à la scène
      .addTo(scrollMagicController.value);
      
      // Ajouter des indicateurs de débogage si disponibles
      if (process.env.NODE_ENV !== 'production' && pinScene.addIndicators) {
        pinScene.addIndicators({name: "PIN scene", colorTrigger: "red", colorStart: "green", colorEnd: "red"});
      }
    }
    
    // Ajouter d'autres scènes selon vos besoins
  }
}

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
  gsap.registerPlugin(ScrollTrigger, Observer, ScrollToPlugin, CSSPlugin);

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
  mastertl = gsap.timeline({ // Assigner à la variable mastertl dans la portée supérieure
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
    mastertl.addLabel("slide73AnimStart") // Étiquette de début pour la diapositive 73
    // 1. Animation du titre (avec visibility pour corriger l'attribut caché)
    .to('.slide-73-title', {
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
    .addLabel("slide73AnimEnd") // Étiquette de fin pour la diapositive 73

    // Transition vers slide 21 // NOTE: Cette transition pourrait être gérée par fullpage.js
    // .to(window, { 
    //   scrollTo: { y: '#section-slide-21', autoKill: false }, 
    //   duration: sectionDuration, 
    //   ease: sectionEase,
    //   autoAlpha: 1 // autoAlpha ici pourrait aussi causer un avertissement si CSSPlugin n'est pas prêt globalement
    // }) 
    
    // SLIDE 21 ANIMATIONS avec la même approche que la slide 73
    mastertl.addLabel("slide21AnimStart") // Étiquette de début pour la diapositive 21
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
    .addLabel("slide21AnimEnd"); // Étiquette de fin pour la diapositive 21

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

      // Les plugins GSAP (Observer inclus) sont enregistrés au début de gsapInitialization.
      // La vérification et l'enregistrement redondant ici peuvent être supprimés.
      // if (typeof gsap.Observer === 'undefined') {
      //   console.warn("GSAP Observer n'est pas défini, tentative d'enregistrement manuel");
      //   gsap.registerPlugin(Observer);
      // }

      // Création manuelle de l'écouteur d'événements de défilement
      const wheelHandler = (event) => {
        event.preventDefault();
        
        // Calcul de la direction
        const direction = event.deltaY > 0 ? 1 : -1;
        
        if (direction > 0) {
          // Défilement vers le bas
          if (mastertl.totalProgress() < 1 && !animInprogress) {
            animInprogress = true;
            mastertl.play();
          }
        } else {
          // Défilement vers le haut
          if (mastertl.totalProgress() > 0 && !animInprogress) {
            animInprogress = true;
            mastertl.reverse();
          }
        }
      };
      
      // Ajouter l'écouteur d'événements
      window.addEventListener('wheel', wheelHandler, { passive: false });
      
      // Nettoyage - retourner une fonction pour supprimer les écouteurs d'événements
      return () => {
        window.removeEventListener('wheel', wheelHandler);
      };
      
    } catch (error) {
      console.error("Erreur lors de la configuration de l'observateur:", error);
      
      // Fallback sans Observer - utiliser un écouteur d'événements standard
      const wheelHandler = (event) => {
        if (event.deltaY > 0) {
          if (mastertl.totalProgress() < 1) {
            mastertl.play();
          }
        } else {
          if (mastertl.totalProgress() > 0) {
            mastertl.reverse();
          }
        }
      };
      
      window.addEventListener('wheel', wheelHandler, { passive: false });
      
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
      document.querySelectorAll('.slide-container').forEach(slide => {
        slide.querySelectorAll('h1, h2, h3, .text-element, p, li, .sub-section').forEach(element => {
          gsap.set(element, { opacity: 0, y: 30 });
        });
      });
    }
    
    // Initialiser l'animation avec GSAP après le chargement des slides
    nextTick(() => {
      if (process.client) {
        gsapInitialization();
      }
    });
  });
  slidesStore.startAutoRefresh();
  
  // Initialisation de fullpage.js
  if (process.client) {
    initFullPage();
  }
  
  // Afficher par défaut le premier élément dans la slide 23
  activeIndex.value = 0;
  
  // Changement automatique de l'image dans la slide 23
  const firstSlide = sortedSlides.value.find(s => s.id === 23);
  if (firstSlide?.paragraphs?.[0]) {
    activeImage.value = firstSlide.paragraphs[0].match(/src="([^"]*)"/)?.[1];
  }
  
  // Vérification de la taille de l'écran
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
  
  // Initialisation des Intersection Observers pour les animations
  initIntersectionObservers();
});

// Initialisation de fullPage.js
const initFullPage = () => {
  // S'assurer que le DOM est bien chargé et que fullpage.js est disponible
  if (typeof window !== 'undefined' && typeof window.fullpage === 'function' && fullpageRef.value) {
    console.log('Initialisation de fullpage.js...');
    
    // Vérifier que nous avons des slides à afficher
    if (!sortedSlides.value || sortedSlides.value.length === 0) {
      console.log('Aucune slide disponible, attente des données...');
      setTimeout(initFullPage, 500);
      return;
    }
    
    try {
      // Assurer que le DOM est prêt avant l'initialisation
      nextTick(() => {
        const fpContainer = document.getElementById('fullpage');
        if (!fpContainer) {
          console.warn('Le conteneur #fullpage n\'est pas présent dans le DOM.');
          setTimeout(initFullPage, 500);
          return;
        }
        
        // Vérifier que l'élément a des sections
        const sections = document.querySelectorAll('.section');
        if (!sections || sections.length === 0) {
          console.warn('Aucune section trouvée dans le DOM pour fullpage.js, nouvelle tentative dans 500ms...');
          setTimeout(initFullPage, 500);
          return;
        }
        
        console.log(`${sections.length} sections trouvées, initialisation de fullpage.js...`);
        
        try {
          fullpageApi.value = window.fullpage('#fullpage', fullpageOptions);
        } catch (initError) {
          console.error('Erreur lors de l\'initialisation de fullpage.js:', initError);
          setTimeout(initFullPage, 1500);
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de fullpage.js:', error);
      // Ne pas réessayer immédiatement en cas d'erreur réelle
      setTimeout(initFullPage, 1500);
    }
  } else {
    console.log('Fullpage.js n\'est pas encore chargé, nouvelle tentative dans 500ms...');
    // Réessayer après un court délai si les dépendances ne sont pas encore chargées
    setTimeout(initFullPage, 500);
  }
};

// Nettoyage avant démontage du composant
onBeforeUnmount(() => {
  if (process.client) {
    if (fullpageApi.value) {
      fullpageApi.value.destroy('all');
    }
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
    
    if (scrollMagicController.value) {
      scrollMagicController.value.destroy(true);
      scrollMagicController.value = null;
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
  if (fullpageApi.value) {
    fullpageApi.value.moveTo(index + 1); // fullpage index starts at 1
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
      :fullpageApi="fullpageApi" 
      :activeSection="activeSlideIndex" 
      :totalSections="sortedSlides.length" 
    />

    <!-- Structure fullPage.js -->
    <div id="fullpage">
      <!-- Loop through slides -->
      <div v-for="(slide, index) in sortedSlides" :key="slide.id" 
        :class="['section', `fp-section-${index}`]" 
        :id="`section-slide-${slide.id}`"
        :data-anchor="`slide${index+1}`">
        
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
@use 'swiper/css';
@use 'swiper/css/scrollbar';
@import 'fullpage.js/dist/fullpage.css';

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

/* Styles pour fullPage.js */
#fullpage {
  width: 100%;
  height: 100vh;
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

/* Classes ajoutées par ScrollMagic */
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