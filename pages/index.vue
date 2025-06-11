<script setup>
import {
  onMounted,
  ref,
  computed,
  nextTick,
  onBeforeUnmount,
  reactive,
  watch,
} from "vue";
import { useSlidesStore } from "~/stores/slides";
import { useRuntimeConfig } from "#app";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useResponsiveAnimations } from "~/utils/useResponsiveAnimations"; // Nouveau système responsif
// Lenis n'a pas pu être intégré correctement, nous utilisons une approche native

// Initialisation du système de fullpage personnalisé avec détection automatique mobile/desktop

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const config = useRuntimeConfig();

const showButton = ref(false);
const slidesStore = useSlidesStore();
const loading = computed(() => slidesStore.loading);
const sortedSlides = computed(() => slidesStore.sortedSlides);

// Nouveau système responsif qui commute automatiquement entre desktop/mobile/tablette
const {
  isMobile: isResponsiveMobile,
  isTablet: isResponsiveTablet,
  isInitialized: animationsInitialized,
  currentAnimationSystem,
  initResponsiveAnimations,
  goToSection: goToResponsiveSection,
  getCurrentSectionIndex,
  isNavigating: isResponsiveNavigating,
  getAnimationStates
} = useResponsiveAnimations();

// Utiliser l'index de section depuis le système responsif
const activeSlideIndex = computed(() => getCurrentSectionIndex());

const activeSlideId = computed(() => {
  if (
    sortedSlides.value.length > 0 &&
    activeSlideIndex.value < sortedSlides.value.length
  ) {
    return sortedSlides.value[activeSlideIndex.value]?.id;
  }
  return null;
});

const defaultBackground = ref("url(/images/bg12.webp)");
const specialBackground = ref("url(/images/nono.webp)");
const currentBackground = ref(defaultBackground.value);
const isMobile = ref(false);
const scrollCursor = ref(null);

const caseStudyActiveIndex = ref(0);

// Fonction pour mettre à jour la position du curseur de scrollbar
const updateScrollbarCursor = () => {
  if (!scrollCursor.value) return;

  const TOTAL_SLIDES = sortedSlides.value.length || 8;
  const currentPosition = activeSlideIndex.value;
  const clampedPosition = Math.min(
    Math.max(currentPosition, 0),
    TOTAL_SLIDES - 1
  );
  const percentage =
    TOTAL_SLIDES > 1 ? clampedPosition / (TOTAL_SLIDES - 1) : 0;

  // Détecter si on est en mode mobile (écran < 1024px)
  const isMobileMode = window.innerWidth < 1024;
  
  const trackElement = scrollCursor.value.parentElement;
  
  if (isMobileMode) {
    // Mode horizontal sur mobile
    // Largeur de la piste moins largeur du curseur
    const trackWidth = trackElement.offsetWidth - scrollCursor.value.offsetWidth;
    const leftPosition = percentage * trackWidth;
    
    // Ajouter la classe d'animation
    scrollCursor.value.classList.add("animating");
    scrollCursor.value.style.left = `${leftPosition}px`;
    scrollCursor.value.style.top = '0px'; // Reset top position
  } else {
    // Mode vertical sur desktop
    // Hauteur de la piste moins hauteur du curseur
    const trackHeight = trackElement.offsetHeight - scrollCursor.value.offsetHeight;
    const topPosition = percentage * trackHeight;
    
    // Ajouter la classe d'animation
    scrollCursor.value.classList.add("animating");
    scrollCursor.value.style.top = `${topPosition}px`;
    scrollCursor.value.style.left = '0px'; // Reset left position
  }

  // Retirer la classe d'animation après la transition
  setTimeout(() => {
    if (scrollCursor.value) {
      scrollCursor.value.classList.remove("animating");
    }
  }, 600);

  // Afficher/masquer la scrollbar selon le contexte
  const scrollbarElement = trackElement.parentElement;
  if (TOTAL_SLIDES > 1) {
    scrollbarElement.classList.add("visible");
    scrollbarElement.classList.remove("hidden");
  } else {
    scrollbarElement.classList.add("hidden");
    scrollbarElement.classList.remove("visible");
  }

  // Optionnel : ajouter le numéro de slide dans le curseur
  if (scrollCursor.value.classList.contains("numbered")) {
    scrollCursor.value.textContent = (currentPosition + 1).toString();
  }
};

// Fonction pour activer/désactiver les effets
const toggleScrollbarEffects = (enable = true) => {
  if (!scrollCursor.value) return;

  if (enable) {
    // Activer l'effet de pulsation au premier chargement
    setTimeout(() => {
      if (scrollCursor.value) {
        scrollCursor.value.classList.add("pulse");
        // Retirer après 6 secondes
        setTimeout(() => {
          if (scrollCursor.value) {
            scrollCursor.value.classList.remove("pulse");
          }
        }, 6000);
      }
    }, 2000);
  }
};

const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
};

const updateBackground = () => {
  // Modifiez pour utiliser activeSlideId.value (qui est maintenant un computed)
  nextTick(() => {
    const wrapper = document.getElementById("vodacomwrapper");
    if (wrapper) {
      const currentSlideIdVal = activeSlideId.value; // Utilisez la valeur du computed
      if (currentSlideIdVal === 20 || currentSlideIdVal === 114) {
        wrapper.style.backgroundImage = specialBackground.value;
      } else {
        wrapper.style.backgroundImage = defaultBackground.value;
      }

      // Mettre à jour la position du curseur de scrollbar
      updateScrollbarCursor();

      // Appliquer les autres styles de fond
      wrapper.style.backgroundSize = "cover";
      wrapper.style.backgroundPosition = "center center";
      wrapper.style.backgroundRepeat = "no-repeat";
    }
  });
};

const activeAccordionIndex = ref(null);
const activeAccordionImage = ref(null);

const toggleAccordion = (slideId, index) => {
  const currentSlide = slidesStore.sortedSlides.find((s) => s.id === slideId);
  if (!currentSlide) return;
  activeAccordionIndex.value =
    activeAccordionIndex.value === index ? null : index;
  const imgSrc = currentSlide.paragraphs?.[index]?.match(/src="([^"]*)"/)?.[1];
  activeAccordionImage.value = imgSrc;
};

const formData = ref({
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  phone: "",
  message: "",
});
const formLoading = ref(false);
const showAlert = ref(false);
const alertType = ref("");
const alertMessage = ref("");

const submitForm = async () => {
  formLoading.value = true;
  
  // Log des données du formulaire pour debug
  console.log('📝 Données du formulaire:', {
    name: `${formData.value.firstName} ${formData.value.lastName}`,
    email: formData.value.email,
    company: formData.value.company,
    phone: formData.value.phone,
    message: formData.value.message
  });
  
  try {
    const response = await fetch(
      "https://public.herotofu.com/v1/f69a2860-b0b2-11ef-b6f4-4774a3a77de8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: `${formData.value.firstName} ${formData.value.lastName}`,
          email: formData.value.email,
          company: formData.value.company,
          phone: formData.value.phone,
          message: formData.value.message,
        }),
      }
    );
    if (response.ok) {
      alertType.value = "alert-success";
      alertMessage.value = "Message envoyé avec succès !";
      formData.value = {
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        phone: "",
        message: "",
      };
    } else {
      throw new Error("Form submission failed");
    }
  } catch (error) {
    alertType.value = "alert-danger";
    alertMessage.value = "Une erreur est survenue. Veuillez réessayer.";
  } finally {
    showAlert.value = true;
    formLoading.value = false;
    setTimeout(() => {
      showAlert.value = false;
    }, 5000);
  }
};

const slideAnimationsPlayed = reactive({});
let sectionScrollTriggers = [];

const setupSectionScrolling = () => {
  const sections = document.querySelectorAll(".slide-section");

  sections.forEach((section, index) => {
    const sectionId = section.getAttribute("id");

    // Supprimé : fonction onEnter pour slide-73

    const slideId = parseInt(section.dataset.slideId);
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top center+=10%",
      end: "bottom center-=10%",
      onEnter: () => {
        console.log(
          `Entering section: ${section.id}, index: ${index}, slideId: ${slideId}`
        );
        
        // Supprimer la classe 'active' de toutes les sections
        sections.forEach(sec => sec.classList.remove('active'));
        
        // Ajouter la classe 'active' à la section actuellement visible
        section.classList.add('active');
        
        activeSlideIndex.value = index;
        activeSlideId.value = slideId;
        updateBackground();
        
        // Gérer la couleur du hamburger pour les slides spécifiques (59, 73, 128)
        const hamburger = document.querySelector('.hamburger');
        if (hamburger) {
          hamburger.classList.remove('hamburger-red', 'hamburger-white');
          if (slideId === 59 || slideId === 73 || slideId === 128) {
            hamburger.classList.add('hamburger-red');
            console.log(`🍔 Hamburger rouge sur slide-${slideId}`);
          } else {
            hamburger.classList.add('hamburger-white');
            console.log(`🍔 Hamburger blanc sur slide-${slideId}`);
          }
        }
        
        // 🎬 NOUVEAU : Redémarrer automatiquement les animations SVG dans cette section
        setTimeout(() => {
          restartSectionSvgAnimations(section);
        }, 100); // Petit délai pour s'assurer que la section est bien visible
      },
      onEnterBack: () => {
        console.log(
          `Entering back section: ${section.id}, index: ${index}, slideId: ${slideId}`
        );
        
        // Supprimer la classe 'active' de toutes les sections
        sections.forEach(sec => sec.classList.remove('active'));
        
        // Ajouter la classe 'active' à la section actuellement visible
        section.classList.add('active');
        
        activeSlideIndex.value = index;
        activeSlideId.value = slideId;
        updateBackground();
        
        // Gérer la couleur du hamburger pour les slides spécifiques (59, 73, 128)
        const hamburger = document.querySelector('.hamburger');
        if (hamburger) {
          hamburger.classList.remove('hamburger-red', 'hamburger-white');
          if (slideId === 59 || slideId === 73 || slideId === 128) {
            hamburger.classList.add('hamburger-red');
            console.log(`🍔 Hamburger rouge sur slide-${slideId}`);
          } else {
            hamburger.classList.add('hamburger-white');
            console.log(`🍔 Hamburger blanc sur slide-${slideId}`);
          }
        }
        
        // 🎬 NOUVEAU : Redémarrer automatiquement les animations SVG dans cette section
        setTimeout(() => {
          restartSectionSvgAnimations(section);
        }, 100); // Petit délai pour s'assurer que la section est bien visible
      },
      onLeave: () => {
        console.log(`Leaving section: ${section.id}`);
        
        // Supprimer la classe 'active' de la section qui est quittée
        section.classList.remove('active');
        
        // Supprimé : if (slideId === 73) { destroySlide73AnimationGSAP(section); }
      },
      onLeaveBack: () => {
        console.log(`Leaving back section: ${section.id}`);
        
        // Supprimer la classe 'active' de la section qui est quittée
        section.classList.remove('active');
        
        // Supprimé : if (slideId === 73) { destroySlide73AnimationGSAP(section); }
      },
    });

    sectionScrollTriggers.push(trigger);
  });

  if (sections.length > 0) {
    // Ajouter la classe 'active' à la première section par défaut
    sections[0].classList.add('active');
    
    activeSlideIndex.value = 0;
    activeSlideId.value = parseInt(sections[0].dataset.slideId);
    updateBackground();
    
    // Initialiser la couleur du hamburger pour la première section
    const initialSlideId = parseInt(sections[0].dataset.slideId);
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
      hamburger.classList.remove('hamburger-red', 'hamburger-white');
      if (initialSlideId === 59 || initialSlideId === 73 || initialSlideId === 128) {
        hamburger.classList.add('hamburger-red');
        console.log(`🍔 Hamburger rouge initial sur slide-${initialSlideId}`);
      } else {
        hamburger.classList.add('hamburger-white');
        console.log(`🍔 Hamburger blanc initial sur slide-${initialSlideId}`);
      }
    }
    
    // Supprimé : if (activeSlideId.value === 73) { initSlide73AnimationGSAP(sections[0]); }
    // TODO: Animer la première slide si nécessaire
  }
};

const scrollToSection = (target) => {
  let targetElement;
  if (typeof target === "number") {
    const sections = gsap.utils.toArray(".slide-section");
    targetElement = sections[target];
  } else if (typeof target === "string") {
    targetElement = document.querySelector(
      target.startsWith("#") ? target : `#${target}`
    );
  } else {
    targetElement = target;
  }

  if (targetElement) {
    gsap.to(window, {
      scrollTo: { y: targetElement, autoKill: false },
      duration: 1,
      ease: "power2.inOut",
    });
  }
};

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
  // Mettre à jour la position de la scrollbar lors du redimensionnement
  // pour gérer le changement d'orientation horizontal/vertical
  nextTick(() => {
    updateScrollbarCursor();
  });
};

onMounted(async () => {
  await slidesStore.fetchSlides(config.public.apiUrl);
  if (slidesStore.error) {
    console.error("Failed to load slides:", slidesStore.error);
    // Afficher un message à l'utilisateur ou gérer l'erreur autrement
    return; // Arrêter l'exécution si les slides ne sont pas chargées
  }
  preloadImage(defaultBackground.value);
  preloadImage(specialBackground.value);
  updateBackground();

  window.addEventListener("resize", handleResize);
  handleResize(); // Appel initial

  // Ajouter un watcher pour mettre à jour la scrollbar quand le slide actif change
  watch(activeSlideIndex, (newIndex) => {
    nextTick(() => {
      updateScrollbarCursor();
    });
  });

  // Initialiser la scrollbar immédiatement
  nextTick(() => {
    // Rendre la scrollbar visible
    const scrollbarElement = document.querySelector(".simple-scrollbar");
    if (scrollbarElement) {
      scrollbarElement.classList.add("visible");
      scrollbarElement.classList.remove("hidden");
    }

    // Mettre à jour la position initiale
    updateScrollbarCursor();

    // Activer les effets de la scrollbar
    toggleScrollbarEffects(true);

    console.log("Scrollbar initialisée avec succès");
  });

  // Initialiser la couleur du hamburger
  nextTick(() => {
    const hamburger = document.querySelector('.hamburger');
    if (hamburger && (activeSlideId.value === 59 || activeSlideId.value === 73 || activeSlideId.value === 128)) {
      hamburger.classList.add('hamburger-red');
      console.log(`🍔 Hamburger initialisé en rouge sur slide-${activeSlideId.value}`);
    } else if (hamburger) {
      hamburger.classList.add('hamburger-white');
      console.log('🍔 Hamburger initialisé en blanc');
    }
  });

  // Écouter l'événement de navigation émis par la scrollbar custom
  document.addEventListener("navigateToSection", handleNavigateToSection);

  // Watcher pour changer la couleur du hamburger selon la slide active
  watch(activeSlideId, (newSlideId) => {
    nextTick(() => {
      const hamburger = document.querySelector('.hamburger');
      if (hamburger) {
        // Supprimer toutes les classes de couleur existantes
        hamburger.classList.remove('hamburger-red', 'hamburger-white');
        
        // Ajouter la classe appropriée selon la slide
        if (newSlideId === 59 || newSlideId === 73 || newSlideId === 128) {
          hamburger.classList.add('hamburger-red');
          console.log(`🍔 Hamburger rouge sur slide-${newSlideId}`);
        } else {
          hamburger.classList.add('hamburger-white');
          console.log(`🍔 Hamburger blanc sur slide-${newSlideId}`);
        }
      }
    });
  });

  // Initialiser le scroll fullpage après que le DOM soit prêt et les slides chargées
  await nextTick();
  const sectionsArray = Array.from(document.querySelectorAll(".slide-section"));

  // Préparer les options pour slide-128
  const slide128Data = sortedSlides.value.find((s) => s.id === 128);
  let slide128ParagraphsRef = ref([]);
  if (slide128Data) {
    slide128ParagraphsRef = ref(slide128Data.paragraphs || []);
  }

  const fullpageOptions = {
    slide128: {
      caseStudyActiveIndexRef: caseStudyActiveIndex,
      paragraphsRef: slide128ParagraphsRef,
    },
  };

  if (sectionsArray.length > 0) {
    // Utiliser le nouveau système responsif qui gère automatiquement tablettes/desktop/mobile
    initResponsiveAnimations(sectionsArray, fullpageOptions);
    console.log(`🚀 Système responsif initialisé avec ${sectionsArray.length} sections`);
    
    // Log du type d'appareil détecté
    if (isResponsiveTablet.value) {
      console.log('📱 Tablette détectée - Mode desktop avec gestes tactiles activé');
    } else if (isResponsiveMobile.value) {
      console.log('📱 Mobile détecté - Mode mobile natif activé');
    } else {
      console.log('🖥️ Desktop détecté - Mode desktop complet activé');
    }
  } else {
    console.warn("No sections found for fullpage scroll initialization.");
  }

  // Initialiser les animations SVG Svgator
  initSvgatorAnimations();

  // 🎯 NOUVEAU : Système de surveillance pour slide-23
  initSlide23SvgWatcher();

  // Exposer les fonctions utiles globalement pour le debug
  if (typeof window !== 'undefined') {
    window.debugSvgAnimations = {
      restart: restartSvgAnimation,
      restartAll: () => {
        // Redémarrer toutes les animations SVG
        const containers = document.querySelectorAll('[id^="image-container-"]');
        containers.forEach(container => {
          if (container.querySelector('object[type="image/svg+xml"]')) {
            restartSvgAnimation(container.id);
          }
        });
      },
      restartSection: (sectionId) => {
        // 🎬 NOUVEAU : Redémarrer les animations d'une section spécifique
        const section = document.getElementById(sectionId);
        if (section) {
          restartSectionSvgAnimations(section);
        } else {
          console.warn(`❌ Section non trouvée: ${sectionId}`);
        }
      },
      restartCurrentSection: () => {
        // 🎬 NOUVEAU : Redémarrer les animations de la section actuellement active
        const activeSection = document.querySelector('.slide-section.active');
        if (activeSection) {
          console.log(`🎯 Redémarrage des animations de la section active: ${activeSection.id}`);
          restartSectionSvgAnimations(activeSection);
        } else {
          console.warn(`❌ Aucune section active trouvée`);
        }
      },
      listAnimations: () => {
        // Lister toutes les animations détectées
        const svgObjects = document.querySelectorAll('object[type="image/svg+xml"]');
        svgObjects.forEach((obj, index) => {
          const containerId = obj.getAttribute('data-container-id');
          console.log(`📋 Animation ${index + 1}: ${containerId}, URL: ${obj.data}`);
        });
      },
      reinitialize: () => {
        console.log('🔄 Réinitialisation des animations SVG');
        setTimeout(() => {
          initSvgatorAnimations();
        }, 1000);
      },
      checkPlayers: () => {
        // Vérifier l'état des players Svgator
        const svgObjects = document.querySelectorAll('object[type="image/svg+xml"]');
        svgObjects.forEach((obj, index) => {
          const containerId = obj.getAttribute('data-container-id');
          const svgDoc = obj.contentDocument;
          if (svgDoc) {
            const svgWindow = svgDoc.defaultView;
            const player = svgWindow && svgWindow.svgatorPlayer;
            console.log(`🔍 ${containerId}: Player ${player ? '✅ trouvé' : '❌ non trouvé'}`);
            if (player) {
              console.log(`   - restart: ${typeof player.restart === 'function' ? '✅' : '❌'}`);
              console.log(`   - setOptions: ${typeof player.setOptions === 'function' ? '✅' : '❌'}`);
              console.log(`   - onFinish: ${typeof player.onFinish === 'function' ? '✅' : '❌'}`);
            }
          }
        });
      },
      // 🎯 NOUVEAU : Fonctions spécifiques pour slide-23
      slide23: {
        forceUpdate: () => {
          // Force la mise à jour des animations slide-23
          const slide23Section = document.getElementById('slide-23');
          if (slide23Section) {
            console.log('🔄 Mise à jour forcée des animations slide-23');
            handleSlide23SvgAnimations(slide23Section);
          } else {
            console.warn('❌ Slide-23 non trouvée');
          }
        },
        checkStatus: () => {
          // Vérifier l'état du système slide-23
          console.log('📊 État du système slide-23:');
          console.log(`   - Slide active: ${isSlide23Active}`);
          console.log(`   - Dernier index: ${lastSlide23Index}`);
          console.log(`   - Surveillance active: ${slide23SvgWatcherInterval !== null}`);
          
          if (typeof window !== 'undefined') {
            const desktopIndex = window.debugDesktopAnimations?.states?.value?.['slide-23-current-index'];
            const mobileIndex = window.debugMobileAnimations?.states?.value?.['slide-23-current-index'];
            console.log(`   - Index desktop: ${desktopIndex}`);
            console.log(`   - Index mobile: ${mobileIndex}`);
          }
        },
        restartCurrent: () => {
          // Redémarrer l'animation du container actuellement actif
          if (!isSlide23Active) {
            console.warn('❌ Pas sur slide-23 actuellement');
            return;
          }
          
          let currentIndex = 0;
          if (typeof window !== 'undefined') {
            if (window.debugDesktopAnimations?.states?.value?.['slide-23-current-index'] !== undefined) {
              currentIndex = window.debugDesktopAnimations.states.value['slide-23-current-index'];
            } else if (window.debugMobileAnimations?.states?.value?.['slide-23-current-index'] !== undefined) {
              currentIndex = window.debugMobileAnimations.states.value['slide-23-current-index'];
            }
          }
          
          const containerId = `image-container-${currentIndex + 1}`;
          console.log(`🎬 Redémarrage forcé de l'animation ${containerId}`);
          restartSlide23SvgAnimation(containerId);
        },
        stopAll: () => {
          // Arrêter toutes les animations slide-23
          const slide23Section = document.getElementById('slide-23');
          if (slide23Section) {
            const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
            console.log(`⏸️ Arrêt de ${imageContainers.length} animations slide-23`);
            imageContainers.forEach((container) => {
              if (container.id) {
                stopSlide23SvgAnimation(container.id);
              }
            });
          }
        },
        testRestart: () => {
          // Forcer le redémarrage de toutes les animations (test)
          const slide23Section = document.getElementById('slide-23');
          if (slide23Section) {
            const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
            console.log(`🧪 Test redémarrage de ${imageContainers.length} animations slide-23`);
            imageContainers.forEach((container, index) => {
              if (container.id) {
                console.log(`🧪 Test redémarrage ${container.id} (index ${index})`);
                restartSlide23SvgAnimation(container.id);
              }
            });
          }
        },
        realTimeCheck: () => {
          // Vérification en temps réel de l'état
          console.log('⏰ Vérification en temps réel:');
          console.log(`   - activeSlideId.value: ${activeSlideId.value}`);
          console.log(`   - isSlide23Active: ${isSlide23Active}`);
          console.log(`   - lastSlide23Index: ${lastSlide23Index}`);
          
          if (typeof window !== 'undefined') {
            const desktopIndex = window.debugDesktopAnimations?.states?.value?.['slide-23-current-index'];
            const mobileIndex = window.debugMobileAnimations?.states?.value?.['slide-23-current-index'];
            console.log(`   - Desktop index: ${desktopIndex}`);
            console.log(`   - Mobile index: ${mobileIndex}`);
          }
          
          // Forcer une mise à jour si on est sur slide-23
          if (activeSlideId.value === 23) {
            console.log('🔄 Force mise à jour car sur slide-23');
            const slide23Section = document.getElementById('slide-23');
            if (slide23Section) {
              handleSlide23SvgAnimations(slide23Section);
            }
          }
        },
        forceLoadSvgs: () => {
          // Forcer le chargement des SVG en les rendant visibles
          console.log('🚀 Tentative de force de chargement des SVG...');
          
          const slide23Section = document.getElementById('slide-23');
          if (slide23Section) {
            const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
            console.log(`📊 ${imageContainers.length} containers à traiter`);
            
            imageContainers.forEach((container, index) => {
              const svgObject = container.querySelector('object[type="image/svg+xml"]');
              if (svgObject) {
                console.log(`🔧 Force chargement ${container.id}`);
                
                // Méthode 1: Rendre visible temporairement
                const originalDisplay = svgObject.style.display;
                const originalVisibility = svgObject.style.visibility;
                
                svgObject.style.display = 'block';
                svgObject.style.visibility = 'visible';
                svgObject.style.position = 'absolute';
                svgObject.style.top = '0';
                svgObject.style.left = '0';
                svgObject.style.zIndex = '9999';
                
                // Méthode 2: Déclencher le chargement en forçant un reload
                const originalData = svgObject.data;
                svgObject.data = '';
                setTimeout(() => {
                  svgObject.data = originalData;
                  console.log(`🔄 Rechargement forcé de ${container.id}`);
                }, 100);
                
                // Vérifier le chargement après délai
                setTimeout(() => {
                  console.log(`📋 État après force: ${container.id} - contentDocument: ${!!svgObject.contentDocument}`);
                  
                  // Restaurer les styles originaux
                  svgObject.style.display = originalDisplay;
                  svgObject.style.visibility = originalVisibility;
                  svgObject.style.position = '';
                  svgObject.style.top = '';
                  svgObject.style.left = '';
                  svgObject.style.zIndex = '';
                }, 2000);
              }
            });
          }
        },
        alternativeApproach: () => {
          // Approche alternative : charger directement les SVG via fetch
          console.log('🔧 Approche alternative : chargement direct via fetch');
          
          const slide23Section = document.getElementById('slide-23');
          if (slide23Section) {
            const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
            
            imageContainers.forEach(async (container, index) => {
              const svgObject = container.querySelector('object[type="image/svg+xml"]');
              if (svgObject && svgObject.data) {
                console.log(`🌐 Tentative de chargement direct : ${container.id}`);
                
                try {
                  const response = await fetch(svgObject.data);
                  const svgText = await response.text();
                  
                  // Créer un document SVG temporaire
                  const parser = new DOMParser();
                  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                  
                  console.log(`✅ SVG chargé directement pour ${container.id}`);
                  console.log(`📄 Document SVG créé:`, svgDoc);
                  
                  // Chercher les scripts Svgator dans le SVG
                  const scripts = svgDoc.querySelectorAll('script');
                  console.log(`🔍 ${scripts.length} scripts trouvés dans ${container.id}`);
                  
                  scripts.forEach((script, idx) => {
                    if (script.textContent && script.textContent.includes('svgatorPlayer')) {
                      console.log(`🎬 Script Svgator trouvé dans ${container.id} (script ${idx + 1})`);
                      
                      // Essayer d'exécuter le script dans un contexte global
                      try {
                        const svgatorCode = script.textContent;
                        eval(svgatorCode);
                        console.log(`✅ Script Svgator exécuté pour ${container.id}`);
                      } catch (execError) {
                        console.error(`❌ Erreur exécution script Svgator pour ${container.id}:`, execError);
                      }
                    }
                  });
                  
                } catch (fetchError) {
                  console.error(`❌ Erreur chargement SVG ${container.id}:`, fetchError);
                }
              }
            });
          }
        },
        diagnose: () => {
          // Diagnostic complet de la slide-23
          console.log('🏥 Diagnostic slide-23:');
          
          const slide23Section = document.getElementById('slide-23');
          if (!slide23Section) {
            console.error('❌ Section slide-23 non trouvée');
            return;
          }
          
          const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
          console.log(`📊 ${imageContainers.length} image-containers trouvés`);
          
          imageContainers.forEach((container, index) => {
            console.log(`\n🔍 Container ${index + 1}: ${container.id}`);
            
            const svgObject = container.querySelector('object[type="image/svg+xml"]');
            if (!svgObject) {
              console.log(`  ❌ Aucun object SVG trouvé`);
              return;
            }
            
            console.log(`  ✅ Object SVG trouvé: ${svgObject.data}`);
            console.log(`  📄 contentDocument: ${!!svgObject.contentDocument}`);
            
            if (svgObject.contentDocument) {
              const svgWindow = svgObject.contentDocument.defaultView;
              console.log(`  🪟 defaultView: ${!!svgWindow}`);
              
              if (svgWindow) {
                console.log(`  🎮 svgatorPlayer: ${!!svgWindow.svgatorPlayer}`);
                
                // Lister toutes les propriétés contenant 'svgator' ou 'player'
                const relevantProps = [];
                for (let prop in svgWindow) {
                  if (prop.toLowerCase().includes('svgator') || prop.toLowerCase().includes('player')) {
                    relevantProps.push(prop);
                  }
                }
                console.log(`  🔑 Propriétés intéressantes: ${relevantProps.join(', ') || 'aucune'}`);
                
                // Vérifier les méthodes du player si trouvé
                if (svgWindow.svgatorPlayer) {
                  const player = svgWindow.svgatorPlayer;
                  console.log(`  📋 Méthodes disponibles:`);
                  console.log(`    - restart: ${typeof player.restart}`);
                  console.log(`    - pause: ${typeof player.pause}`);
                  console.log(`    - seek: ${typeof player.seek}`);
                  console.log(`    - setCurrentTime: ${typeof player.setCurrentTime}`);
                }
              }
            } else {
              console.log(`  ⏳ SVG pas encore chargé`);
            }
          });
        }
      }
    };
    
    console.log('🛠️ Fonctions de debug améliorées disponibles:');
    console.log('- window.debugSvgAnimations.restart("image-container-1") // Redémarre une animation spécifique');
    console.log('- window.debugSvgAnimations.restartAll() // Redémarre toutes les animations');
    console.log('- window.debugSvgAnimations.restartSection("slide-23") // 🎬 NOUVEAU: Redémarre les animations d\'une section');
    console.log('- window.debugSvgAnimations.restartCurrentSection() // 🎬 NOUVEAU: Redémarre les animations de la section active');
    console.log('- window.debugSvgAnimations.listAnimations() // Liste toutes les animations');
    console.log('- window.debugSvgAnimations.reinitialize() // Réinitialise complètement');
    console.log('- window.debugSvgAnimations.checkPlayers() // Vérifie l\'état des players');
    console.log('');
    console.log('🎯 Fonctions spécifiques pour slide-23:');
    console.log('- window.debugSvgAnimations.slide23.forceUpdate() // Force la mise à jour des animations slide-23');
    console.log('- window.debugSvgAnimations.slide23.checkStatus() // Vérifie l\'état du système slide-23'); 
    console.log('- window.debugSvgAnimations.slide23.restartCurrent() // Redémarre l\'animation du container actif');
    console.log('- window.debugSvgAnimations.slide23.stopAll() // Arrête toutes les animations slide-23');
    console.log('- window.debugSvgAnimations.slide23.testRestart() // Forcer le redémarrage de toutes les animations slide-23');
    console.log('- window.debugSvgAnimations.slide23.realTimeCheck() // Vérification en temps réel');
    console.log('- window.debugSvgAnimations.slide23.forceLoadSvgs() // Forcer le chargement des SVG en les rendant visibles');
    console.log('- window.debugSvgAnimations.slide23.alternativeApproach() // Approche alternative : chargement direct via fetch');
    console.log('- window.debugSvgAnimations.slide23.diagnose() // Diagnostic complet des SVG slide-23');
  }

  // Bouton Back to Top
  const backToTopButton = document.getElementById("backToTop");
  const masterScrollContainer = document.getElementById(
    "master-scroll-container"
  );

  if (masterScrollContainer && backToTopButton) {
    masterScrollContainer.addEventListener("scroll", () => {
      if (masterScrollContainer.scrollTop > 300) {
        // Afficher après 300px de scroll
        backToTopButton.classList.add("show");
      } else {
        backToTopButton.classList.remove("show");
      }
    });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("navigateToSection", handleNavigateToSection);
  sectionScrollTriggers.forEach((trigger) => trigger.kill());
  sectionScrollTriggers.length = 0;
  cleanupSlide23SvgWatcher();
});

const isMenuOpen = ref(false);
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const goToSlide = (index) => {
  // Utiliser le nouveau système responsif qui gère automatiquement tablettes/desktop/mobile
  goToResponsiveSection(index);
  isMenuOpen.value = false;
};

useHead({ 
  title: "TXT Engage - Vodafone",
  script: [
    {
      src: '/js/debug-slides.js',
      defer: true
    },
    {
      src: '/js/test-hamburger-slides.js',
      defer: true
    },
    {
      src: '/js/debug-tablet-detection.js',
      defer: true
    }
  ]
});

const extractTitle = (html) => {
  const match = html.match(/<h3>(.*?)<\/h3>/);
  return match ? match[1] : "";
};
const extractTextContent = (html) => {
  let content = html.replace(/<h3>.*?<\/h3>/, "");
  content = content.replace(/<img.*?\/?>/g, "");
  return content;
};
const extractImage = (html) => {
  const match = html.match(/src="([^"]*?)"/);
  return match ? match[1] : "";
};

const toggleCaseStudySection = (index) => {
  caseStudyActiveIndex.value = index;
};

// Nouvelle fonction pour gérer correctement l'affichage des arrière-plans
const getBackgroundImage = (slide) => {
  if (!slide) return "none";

  // Vérifier si on utilise le fallback et si le store a corrigé les images
  if (slidesStore.usingFallback) {
    console.log(`Utilisation de l'arrière-plan corrigé pour slide-${slide.id}`);
  }

  // Adapter en fonction de l'appareil (mobile ou desktop)
  if (isMobile.value) {
    // Pour le mobile, utiliser backgroundMobile s'il existe, sinon thumbnail
    if (
      slide.backgroundMobile &&
      slide.backgroundMobile !== "false" &&
      slide.backgroundMobile !== false
    ) {
      return `url(${slide.backgroundMobile})`;
    } else if (
      slide.thumbnail &&
      slide.thumbnail !== "false" &&
      slide.thumbnail !== false
    ) {
      return `url(${slide.thumbnail})`;
    }
  } else {
    // Pour desktop, utiliser thumbnail
    if (
      slide.thumbnail &&
      slide.thumbnail !== "false" &&
      slide.thumbnail !== false
    ) {
      return `url(${slide.thumbnail})`;
    }
  }

  // Fallback par défaut si aucune image n'est disponible
  return isMobile.value
    ? "url(/images/bgmbile.webp)"
    : "url(/images/bg12.webp)";
};

const handleNavigateToSection = (event) => {
  const sectionIndex = event.detail.index;
  if (sectionIndex >= 0 && sectionIndex < sortedSlides.value.length) {
    // Utiliser le système de navigation responsif qui gère automatiquement tablettes/desktop/mobile
    if (animationsInitialized.value && goToResponsiveSection) {
      goToResponsiveSection(sectionIndex);
    } else {
      // Fallback à la navigation manuelle si le système n'est pas encore initialisé
      scrollToSection(sectionIndex);
    }
  }
};

// Méthode pour revenir à la slide-73 avec réinitialisation des animations
const goToFirstSlide = () => {
  console.log('🏠 Clic sur le logo - Retour à la page d\'accueil');
  console.log('🔄 Réinitialisation et retour à slide-73');
  
  // Fermer le menu s'il était ouvert
  isMenuOpen.value = false;
  
  // Réinitialiser toutes les animations via le système desktop/responsif
  if (window.debugDesktopAnimations) {
    // Réinitialiser toutes les animations une par une
    if (window.debugDesktopAnimations.resetSlide73) {
      window.debugDesktopAnimations.resetSlide73();
    }
    if (window.debugDesktopAnimations.resetSlide20) {
      window.debugDesktopAnimations.resetSlide20();
    }
    if (window.debugDesktopAnimations.resetSlide23) {
      window.debugDesktopAnimations.resetSlide23();
    }
    if (window.debugDesktopAnimations.resetSlide59) {
      window.debugDesktopAnimations.resetSlide59();
    }
    if (window.debugDesktopAnimations.resetSlide128) {
      window.debugDesktopAnimations.resetSlide128();
    }
    
    // Réinitialiser les états d'animation
    if (window.debugDesktopAnimations.states && window.debugDesktopAnimations.states.value) {
      const states = window.debugDesktopAnimations.states.value;
      Object.keys(states).forEach(key => {
        delete states[key];
      });
    }
    console.log('✅ Toutes les animations réinitialisées');
  }
  
  // Trouver l'index de la slide-73
  const slide73Index = sortedSlides.value.findIndex(slide => slide.id === 73);
  
  if (slide73Index !== -1) {
    console.log(`🎯 Navigation vers slide-73 (index: ${slide73Index})`);
    
    // Utiliser le système de navigation responsif
    if (animationsInitialized.value && goToResponsiveSection) {
      goToResponsiveSection(slide73Index);
    } else {
      // Fallback à la navigation manuelle
      scrollToSection(slide73Index);
    }
    
    // Déclencher l'animation slide-73 après un délai pour s'assurer qu'on est bien arrivé
    setTimeout(() => {
      if (window.debugDesktopAnimations && window.debugDesktopAnimations.triggerSlide73) {
        console.log('🎬 Déclenchement animation slide-73');
        window.debugDesktopAnimations.triggerSlide73();
      }
    }, 800); // Délai pour laisser le temps à la navigation de se terminer
    
  } else {
    console.warn('⚠️  Slide-73 non trouvée');
    // Fallback - aller à la première slide
    if (animationsInitialized.value && goToResponsiveSection) {
      goToResponsiveSection(0);
    } else {
      scrollToSection(0);
    }
  }
};

// Méthode spécifique pour les SVG Svgator avec réinitialisation des animations
const initSvgatorAnimations = () => {
  nextTick(() => {
    // Attendre que les objects SVG soient chargés
    const svgObjects = document.querySelectorAll('object[type="image/svg+xml"]');
    
    svgObjects.forEach((obj, index) => {
      obj.addEventListener('load', () => {
        try {
          const svgDoc = obj.contentDocument;
          if (svgDoc) {
            console.log(`🔍 Analyse du SVG ${index + 1} dans ${obj.getAttribute('data-container-id') || 'conteneur inconnu'}`);
            
            // Rechercher les scripts Svgator dans le document SVG
            const scripts = svgDoc.querySelectorAll('script');
            let svgatorFound = false;
            
            scripts.forEach(script => {
              if (script.textContent && script.textContent.includes('svgatorPlayer')) {
                svgatorFound = true;
                console.log(`🎬 Animation Svgator trouvée dans ${obj.getAttribute('data-container-id')}`);
                
                try {
                  // Créer un script element dans le document SVG au lieu d'utiliser Function
                  const newScript = svgDoc.createElement('script');
                  newScript.textContent = script.textContent;
                  
                  // Supprimer l'ancien script pour éviter les doublons
                  script.remove();
                  
                  // Ajouter le nouveau script au SVG document
                  svgDoc.documentElement.appendChild(newScript);
                  
                  console.log(`✅ Script Svgator réinjecté avec succès dans ${obj.getAttribute('data-container-id')}`);
                  
                  // Configurer l'animation après un délai court
                  setTimeout(() => {
                    configureSvgatorRepeat(svgDoc, obj.getAttribute('data-container-id'));
                  }, 1000); // Réduit à 1 seconde
                  
                } catch (execError) {
                  console.error(`❌ Erreur lors de l'injection du script Svgator:`, execError);
                  
                  // Fallback: essayer d'exécuter le script dans le contexte de la fenêtre SVG
                  try {
                    const svgWindow = svgDoc.defaultView || window;
                    const scriptFunction = new Function(script.textContent);
                    scriptFunction.call(svgWindow);
                    console.log(`✅ Script Svgator exécuté via fallback dans ${obj.getAttribute('data-container-id')}`);
                    
                    // Configurer après le fallback
                    setTimeout(() => {
                      configureSvgatorRepeat(svgDoc, obj.getAttribute('data-container-id'));
                    }, 1000);
                  } catch (fallbackError) {
                    console.error(`❌ Échec du fallback pour ${obj.getAttribute('data-container-id')}:`, fallbackError);
                  }
                }
              }
            });
            
            if (!svgatorFound) {
              console.log(`ℹ️ Aucune animation Svgator détectée dans ${obj.getAttribute('data-container-id')}`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Impossible d'accéder au contenu du SVG ${index + 1}:`, error);
        }
      });
    });
  });
};

// Fonction pour configurer la répétition des animations Svgator
const configureSvgatorRepeat = (svgDoc, containerId) => {
  try {
    console.log(`🔍 Recherche du player Svgator dans ${containerId}`);
    
    // Rechercher les players Svgator dans le document SVG
    const svgWindow = svgDoc.defaultView;
    
    // Attendre que le player soit initialisé avec plusieurs tentatives
    let attempts = 0;
    const maxAttempts = 5; // Réduire le nombre de tentatives
    
    const findAndConfigurePlayer = () => {
      attempts++;
      
      // Méthode 1: Chercher dans svgWindow
      let player = svgWindow && svgWindow.svgatorPlayer;
      
      // Méthode 2: Chercher dans les variables globales du SVG
      if (!player && svgWindow) {
        // Chercher dans toutes les propriétés de svgWindow
        for (let prop in svgWindow) {
          if (prop.includes('svgator') || prop.includes('player')) {
            console.log(`🔍 Propriété trouvée: ${prop}`, svgWindow[prop]);
            if (svgWindow[prop] && typeof svgWindow[prop] === 'object') {
              player = svgWindow[prop];
              break;
            }
          }
        }
      }
      
      // Méthode 3: Chercher dans le document SVG lui-même
      if (!player) {
        const svgElement = svgDoc.querySelector('svg');
        if (svgElement && svgElement.svgatorPlayer) {
          player = svgElement.svgatorPlayer;
        }
      }
      
      if (player) {
        console.log(`🎯 Player Svgator trouvé dans ${containerId} après ${attempts} tentatives`);
        
        try {
          // Ne plus configurer de répétition automatique
          // L'animation se jouera une seule fois naturellement
          console.log(`✅ Animation configurée pour lecture unique dans ${containerId}`);
          
          // Optionnel: démarrer l'animation immédiatement si elle n'est pas déjà en cours
          if (typeof player.restart === 'function') {
            player.restart();
            console.log(`🎬 Animation démarrée dans ${containerId}`);
          }
          
        } catch (configError) {
          console.error(`❌ Erreur lors de la configuration du player:`, configError);
        }
        
      } else if (attempts < maxAttempts) {
        console.log(`⏳ Player non trouvé, tentative ${attempts}/${maxAttempts} dans ${containerId}`);
        setTimeout(findAndConfigurePlayer, 300); // Réduire le délai à 300ms
      } else {
        console.warn(`⚠️ Player Svgator non trouvé après ${maxAttempts} tentatives dans ${containerId}`);
      }
    };
    
    // Démarrer la recherche
    findAndConfigurePlayer();
    
  } catch (error) {
    console.error(`❌ Erreur lors de la configuration pour ${containerId}:`, error);
  }
};

// Fonction manuelle pour redémarrer une animation spécifique
const restartSvgAnimation = (containerId) => {
  const container = document.getElementById(containerId);
  if (container) {
    const svgObject = container.querySelector('object[type="image/svg+xml"]');
    if (svgObject && svgObject.contentDocument) {
      const svgWindow = svgObject.contentDocument.defaultView;
      if (svgWindow && svgWindow.svgatorPlayer) {
        svgWindow.svgatorPlayer.restart();
        console.log(`🎬 Animation redémarrée manuellement dans ${containerId}`);
      }
    }
  }
};

// Nouvelle fonction pour redémarrer toutes les animations SVG dans une section
const restartSectionSvgAnimations = (section) => {
  if (!section) return;
  
  console.log(`🔍 Recherche d'animations SVG dans ${section.id}`);
  
  // Traitement spécial pour la slide-23
  if (section.id === 'slide-23') {
    handleSlide23SvgAnimations(section);
    return;
  }
  
  // Chercher tous les .image-container dans cette section
  const imageContainers = section.querySelectorAll('.image-container');
  
  imageContainers.forEach((container) => {
    const containerId = container.id;
    const svgObject = container.querySelector('object[type="image/svg+xml"]');
    
    if (svgObject && containerId) {
      console.log(`🎯 Container SVG trouvé: ${containerId}`);
      
      // Vérifier si le SVG est déjà chargé
      if (svgObject.contentDocument) {
        restartSvgAnimation(containerId);
      } else {
        // Si le SVG n'est pas encore chargé, attendre l'événement load
        console.log(`⏳ Attente du chargement du SVG dans ${containerId}`);
        svgObject.addEventListener('load', () => {
          setTimeout(() => {
            restartSvgAnimation(containerId);
          }, 500); // Petit délai pour s'assurer que le player Svgator est prêt
        }, { once: true }); // N'écouter qu'une seule fois
      }
    }
  });
  
  // Si aucun container trouvé, chercher aussi les SVG directement dans les objects
  if (imageContainers.length === 0) {
    const directSvgObjects = section.querySelectorAll('object[type="image/svg+xml"]');
    
    directSvgObjects.forEach((svgObject) => {
      const containerElement = svgObject.closest('[id^="image-container-"]') || svgObject.parentElement;
      if (containerElement && containerElement.id) {
        console.log(`🎯 SVG direct trouvé dans: ${containerElement.id}`);
        
        if (svgObject.contentDocument) {
          restartSvgAnimation(containerElement.id);
        } else {
          svgObject.addEventListener('load', () => {
            setTimeout(() => {
              restartSvgAnimation(containerElement.id);
            }, 500);
          }, { once: true });
        }
      }
    });
  }
};

// Fonction spécifique pour la slide-23 avec contrôle des animations selon l'index actif
const handleSlide23SvgAnimations = (section) => {
  console.log(`🎯 Gestion spécifique slide-23`);
  
  // Chercher tous les image-containers dans .bdrs
  const imageContainers = section.querySelectorAll('.bdrs .image-container');
  
  if (imageContainers.length === 0) {
    console.log(`⚠️ Aucun image-container trouvé dans .bdrs de slide-23`);
    return;
  }
  
  console.log(`📊 ${imageContainers.length} image-containers trouvés dans slide-23`);
  
  // Utiliser l'index depuis le système de navigation responsif ou fallback vers 0
  let currentIndex = 0;
  
  // Essayer de récupérer l'index depuis les systèmes d'animation
  if (typeof window !== 'undefined') {
    // Essayer le système desktop
    if (window.debugDesktopAnimations?.states?.value?.['slide-23-current-index'] !== undefined) {
      currentIndex = window.debugDesktopAnimations.states.value['slide-23-current-index'];
      console.log(`🖥️ Index depuis système desktop: ${currentIndex}`);
    }
    // Essayer le système mobile
    else if (window.debugMobileAnimations?.states?.value?.['slide-23-current-index'] !== undefined) {
      currentIndex = window.debugMobileAnimations.states.value['slide-23-current-index'];
      console.log(`📱 Index depuis système mobile: ${currentIndex}`);
    } else {
      console.log(`⚠️ Aucun index trouvé dans les systèmes d'animation, utilisation de 0`);
    }
  }
  
  console.log(`📊 Index actuel slide-23: ${currentIndex} / ${imageContainers.length - 1}`);
  
  // Contrôler les animations SVG selon l'index actif
  imageContainers.forEach((container, index) => {
    const containerId = container.id;
    const svgObject = container.querySelector('object[type="image/svg+xml"]');
    
    if (svgObject && containerId) {
      if (index === currentIndex) {
        // Container actif : démarrer l'animation
        console.log(`🎬 Démarrage animation ${containerId} (actif) - Index ${index}`);
        
        if (svgObject.contentDocument) {
          restartSlide23SvgAnimation(containerId);
        } else {
          console.log(`⏳ SVG non chargé pour ${containerId}, attente de chargement...`);
          svgObject.addEventListener('load', () => {
            setTimeout(() => {
              console.log(`✅ SVG maintenant chargé pour ${containerId}, redémarrage...`);
              restartSlide23SvgAnimation(containerId);
            }, 500);
          }, { once: true });
        }
      } else {
        // Container inactif : arrêter/réinitialiser l'animation
        console.log(`⏸️ Arrêt animation ${containerId} (inactif) - Index ${index}`);
        stopSlide23SvgAnimation(containerId);
      }
    } else {
      if (!svgObject) {
        console.log(`❌ Pas d'object SVG trouvé dans ${containerId || `container-${index}`}`);
      }
      if (!containerId) {
        console.log(`❌ Pas d'ID trouvé pour le container ${index}`);
      }
    }
  });
};

// Fonction pour démarrer une animation SVG spécifique à slide-23
const restartSlide23SvgAnimation = (containerId) => {
  console.log(`🔍 Tentative de redémarrage ${containerId}`);
  
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`❌ Container ${containerId} non trouvé`);
    return;
  }
  
  const svgObject = container.querySelector('object[type="image/svg+xml"]');
  if (!svgObject) {
    console.warn(`❌ Object SVG non trouvé dans ${containerId}`);
    return;
  }
  
  console.log(`🎯 Object SVG trouvé dans ${containerId}, URL: ${svgObject.data}`);
  
  // Vérifier si le SVG est chargé
  if (!svgObject.contentDocument) {
    console.log(`⏳ SVG pas encore chargé dans ${containerId}, attente...`);
    
    // Attendre le chargement du SVG (une seule fois)
    const loadHandler = () => {
      console.log(`✅ SVG chargé dans ${containerId}, tentative de redémarrage`);
      setTimeout(() => {
        restartSlide23SvgAnimationForced(containerId);
      }, 300);
    };
    
    svgObject.addEventListener('load', loadHandler, { once: true });
    
    // Timeout de sécurité
    setTimeout(() => {
      svgObject.removeEventListener('load', loadHandler);
      console.warn(`⏰ Timeout pour le chargement SVG de ${containerId}`);
    }, 3000);
    
    return;
  }
  
  // SVG chargé, essayer de redémarrer
  restartSlide23SvgAnimationForced(containerId);
};

// Fonction interne pour forcer le redémarrage (sans retry)
const restartSlide23SvgAnimationForced = (containerId) => {
  const container = document.getElementById(containerId);
  const svgObject = container?.querySelector('object[type="image/svg+xml"]');
  
  if (!svgObject?.contentDocument) {
    console.warn(`❌ Impossible d'accéder au contentDocument de ${containerId}`);
    return;
  }
  
  try {
    const svgDoc = svgObject.contentDocument;
    const svgWindow = svgDoc.defaultView;
    
    console.log(`🔍 Recherche du player dans ${containerId}`);
    console.log(`   - svgDoc: ${!!svgDoc}`);
    console.log(`   - svgWindow: ${!!svgWindow}`);
    
    // Essayer différentes méthodes pour trouver le player
    let player = null;
    
    // Méthode 1: svgWindow.svgatorPlayer
    if (svgWindow && svgWindow.svgatorPlayer) {
      player = svgWindow.svgatorPlayer;
      console.log(`✅ Player trouvé via svgWindow.svgatorPlayer dans ${containerId}`);
    }
    
    // Méthode 2: Chercher dans les propriétés de svgWindow
    if (!player && svgWindow) {
      for (let prop in svgWindow) {
        if (prop.toLowerCase().includes('svgator') || prop.toLowerCase().includes('player')) {
          console.log(`🔍 Propriété potentielle trouvée: ${prop}`);
          if (svgWindow[prop] && typeof svgWindow[prop] === 'object' && svgWindow[prop].restart) {
            player = svgWindow[prop];
            console.log(`✅ Player trouvé via ${prop} dans ${containerId}`);
            break;
          }
        }
      }
    }
    
    // Méthode 3: Chercher dans window global du SVG
    if (!player && svgWindow) {
      if (svgWindow.window && svgWindow.window.svgatorPlayer) {
        player = svgWindow.window.svgatorPlayer;
        console.log(`✅ Player trouvé via window.svgatorPlayer dans ${containerId}`);
      }
    }
    
    if (player && typeof player.restart === 'function') {
      console.log(`🎬 Redémarrage effectif de l'animation dans ${containerId}`);
      player.restart();
      console.log(`✅ Animation SVG redémarrée avec succès dans ${containerId}`);
    } else {
      console.warn(`⚠️ Player Svgator non trouvé ou méthode restart manquante dans ${containerId}`);
      console.log(`   - player: ${!!player}`);
      console.log(`   - restart method: ${player ? typeof player.restart : 'N/A'}`);
      
      // Lister toutes les méthodes disponibles si player trouvé
      if (player) {
        const methods = Object.getOwnPropertyNames(player).filter(prop => typeof player[prop] === 'function');
        console.log(`   - méthodes disponibles: ${methods.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors du redémarrage de l'animation dans ${containerId}:`, error);
  }
};

// Fonction pour arrêter une animation SVG spécifique à slide-23
const stopSlide23SvgAnimation = (containerId) => {
  console.log(`🔍 Tentative d'arrêt ${containerId}`);
  
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`❌ Container ${containerId} non trouvé pour arrêt`);
    return;
  }
  
  const svgObject = container.querySelector('object[type="image/svg+xml"]');
  if (!svgObject) {
    console.warn(`❌ Object SVG non trouvé dans ${containerId} pour arrêt`);
    return;
  }
  
  if (!svgObject.contentDocument) {
    console.log(`⏳ SVG pas encore chargé dans ${containerId}, arrêt non nécessaire`);
    return;
  }
  
  try {
    const svgDoc = svgObject.contentDocument;
    const svgWindow = svgDoc.defaultView;
    
    // Essayer différentes méthodes pour trouver le player
    let player = null;
    
    if (svgWindow && svgWindow.svgatorPlayer) {
      player = svgWindow.svgatorPlayer;
    } else if (svgWindow) {
      // Chercher dans les propriétés
      for (let prop in svgWindow) {
        if (prop.toLowerCase().includes('svgator') || prop.toLowerCase().includes('player')) {
          if (svgWindow[prop] && typeof svgWindow[prop] === 'object') {
            player = svgWindow[prop];
            break;
          }
        }
      }
    }
    
    if (player) {
      console.log(`⏸️ Arrêt effectif de l'animation dans ${containerId}`);
      
      // Arrêter l'animation
      if (typeof player.pause === 'function') {
        player.pause();
        console.log(`⏸️ Animation mise en pause dans ${containerId}`);
      }
      
      // Revenir au début
      if (typeof player.seek === 'function') {
        player.seek(0);
        console.log(`⏮️ Animation remise à zéro dans ${containerId}`);
      } else if (typeof player.setCurrentTime === 'function') {
        player.setCurrentTime(0);
        console.log(`⏮️ Animation remise à zéro (setCurrentTime) dans ${containerId}`);
      }
      
      console.log(`✅ Animation SVG arrêtée avec succès dans ${containerId}`);
    } else {
      console.warn(`⚠️ Player Svgator non trouvé pour arrêt dans ${containerId}`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'arrêt de l'animation dans ${containerId}:`, error);
  }
};

// Système de surveillance pour slide-23
let slide23SvgWatcherInterval = null;
let lastSlide23Index = -1;
let isSlide23Active = false;

const initSlide23SvgWatcher = () => {
  console.log(`🔍 Initialisation du système de surveillance slide-23`);
  
  // Nettoyer l'interval existant s'il y en a un
  if (slide23SvgWatcherInterval) {
    clearInterval(slide23SvgWatcherInterval);
  }
  
  // Démarrer la surveillance toutes les 200ms
  slide23SvgWatcherInterval = setInterval(() => {
    // Vérifier si on est sur la slide-23
    const currentSlide23Active = activeSlideId.value === 23;
    
    // Si on vient d'entrer dans slide-23
    if (currentSlide23Active && !isSlide23Active) {
      console.log(`🎯 Entrée dans slide-23 détectée`);
      isSlide23Active = true;
      lastSlide23Index = -1; // Force la mise à jour
      
      // Démarrer immédiatement le contrôle des animations
      setTimeout(() => {
        const slide23Section = document.getElementById('slide-23');
        if (slide23Section) {
          console.log(`🔄 Premier contrôle des animations après entrée dans slide-23`);
          handleSlide23SvgAnimations(slide23Section);
        }
      }, 300); // Petit délai pour que la section soit bien active
    }
    // Si on vient de quitter slide-23
    else if (!currentSlide23Active && isSlide23Active) {
      console.log(`🚪 Sortie de slide-23 détectée`);
      isSlide23Active = false;
      
      // Arrêter toutes les animations SVG de slide-23
      const slide23Section = document.getElementById('slide-23');
      if (slide23Section) {
        const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
        imageContainers.forEach((container) => {
          if (container.id) {
            stopSlide23SvgAnimation(container.id);
          }
        });
      }
      return; // Pas besoin de vérifier l'index si on n'est pas sur slide-23
    }
    
    // Si on est sur slide-23, surveiller les changements d'index
    if (isSlide23Active) {
      let currentIndex = 0;
      
      // Récupérer l'index actuel depuis les systèmes d'animation
      if (typeof window !== 'undefined') {
        // Essayer le système desktop
        if (window.debugDesktopAnimations?.states?.value?.['slide-23-current-index'] !== undefined) {
          currentIndex = window.debugDesktopAnimations.states.value['slide-23-current-index'];
        }
        // Essayer le système mobile
        else if (window.debugMobileAnimations?.states?.value?.['slide-23-current-index'] !== undefined) {
          currentIndex = window.debugMobileAnimations.states.value['slide-23-current-index'];
        }
      }
      
      // Si l'index a changé, mettre à jour les animations
      if (currentIndex !== lastSlide23Index) {
        console.log(`📊 Changement d'index slide-23: ${lastSlide23Index} → ${currentIndex}`);
        lastSlide23Index = currentIndex;
        
        const slide23Section = document.getElementById('slide-23');
        if (slide23Section) {
          handleSlide23SvgAnimations(slide23Section);
        }
      }
    }
  }, 200); // Surveillance toutes les 200ms
  
  console.log(`✅ Système de surveillance slide-23 démarré`);
};

// Fonction pour nettoyer le système de surveillance
const cleanupSlide23SvgWatcher = () => {
  if (slide23SvgWatcherInterval) {
    clearInterval(slide23SvgWatcherInterval);
    slide23SvgWatcherInterval = null;
    console.log(`🧹 Système de surveillance slide-23 nettoyé`);
  }
};
</script>

<template>
  <div id="vodacomwrapper">
    <!-- Overlay de rotation pour tablettes en mode portrait -->
    <div class="rotation-overlay">
      <div class="message-container">
        <div class="icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.48 2.52c3.27 1.55 5.61 4.72 5.97 8.48M1.55 7.52C2.72 4.25 5.89 1.91 9.65 1.55M8.53 20.93c-4.15-.69-7.4-3.94-8.09-8.09M20.93 15.47c-.69 4.15-3.94 7.4-8.09 8.09" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
          </svg>
        </div>
        <h2 class="title">Rotation Required</h2>
        <p class="description">
          Please rotate your iPad (including iPad Mini 6)<br>
          to landscape mode for an optimal experience
        </p>
      </div>
    </div>

    <div v-if="loading" class="loader-container">
      <img src="/images/logovector.svg" class="logo-loader" alt="Logo" />
    </div>

    <div v-if="!loading && slidesStore.error" class="error-container">
      <div class="error-message">
        <p>{{ slidesStore.error }}</p>
        <button @click="slidesStore.fetchSlides()" class="retry-button">
          Réessayer
        </button>
      </div>
    </div>

    <header class="fixed-top">
      <div
        id="headerpadding"
        class="p-4 flex-row justify-content-between align-items-center"
      >
        <img 
          src="/images/logovector.svg" 
          alt="Logo" 
          @click="goToFirstSlide"
          class="logo-clickable"
        />
        <div class="menu-container">
          <button
            class="hamburger"
            @click="toggleMenu"
            :class="{ 'is-active': isMenuOpen }"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav id="menu" class="slide-menu" :class="{ 'is-open': isMenuOpen }">
            <ul>
              <li
                v-for="(slide, index) in sortedSlides"
                :key="slide.id"
                :class="{ active: activeSlideIndex === index }"
                @click="goToSlide(index)"
              >
                <!-- Utilise activeSlideIndex du composable -->
                <span class="slide-label">{{ slide.menuTitle }}</span>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>

    <div id="master-scroll-container" class="slides">
      <section
        v-for="slide in sortedSlides"
        :key="slide.id"
        class="slide-section"
        :id="`slide-${slide.id}`"
        :data-slide-id="slide.id"
        :style="{
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }"
      >
        <div
          class="slides-container"
          :style="{
            width: '100%',
            height: '100%',
            display: 'flex',
            backgroundImage: getBackgroundImage(slide),
            //backgroundSize: 'cover',
            //backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }"
        >
          <!-- Contenu spécifique pour la slide 73 -->
          <div v-if="slide.id === 73" class="txtintro row m-0 p-0 slide">
            <div class="firstContainer">
              <div class="slapjh">
                <div class="subint" id="subint">
                  <h2
                    class="text-element slide-73-title"
                    v-html="slide.title"
                  ></h2>
                  <p
                    class="text-element slide-73-content"
                    v-html="slide.wp_content"
                  ></p>
                </div>
                <div class="points-fort" id="points-fort">
                  <!-- Cet ID n'est plus nécessaire si vous ciblez par classe -->
                  <!-- Les classes text-element slide-73-point peuvent rester si elles sont utilisées pour le style, mais l'animation GSAP ne les ciblera plus -->
                  <div
                    v-for="(paragraph, idx) in slide.paragraphs"
                    :key="idx"
                    class="text-element slide-73-point"
                    :class="`point-${idx}`"
                    v-html="paragraph"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="slide.id === 21"
            id="thoiathoing"
            class="p-0 m-0 slide"
          >
            <div class="cont p-2">
              <div class="row">
                <h3
                  id="mshill"
                  class="slide-21-title"
                  v-html="slide.wp_content"
                ></h3>
              </div>
              <div id="doctornek" class="row flex-row">
                <div
                  v-for="(paragraph, idx) in slide.paragraphs"
                  :key="idx"
                  class="text-element slide-21-point col col-s-12 m-0 p-2"
                  :class="`point-21-${idx}`"
                  v-html="paragraph"
                ></div>
              </div>
            </div>
          </div>

          <div v-else-if="slide.id === 20" id="kiff" class="p-0 m-0 slide">
            <img id="turtlebeach" src="/images/hs.png" alt="" />
            <div id="ozaru" class="row">
              <div id="mzu" class="nusrru col-md-5">
                <h2
                  id="slide2a"
                  class="text-element"
                  v-html="slide.wp_title"
                ></h2>
                <h2 id="slide2b" class="text-element" v-html="slide.title"></h2>
                <h2
                  id="slide2c"
                  class="text-element"
                  v-html="slide.wp_content"
                ></h2>
              </div>
              <div id="guysamuel" class="gee col-md-7">
                <div
                  v-for="(paragraph, idx) in slide.paragraphs"
                  :key="idx"
                  class="text-element"
                  :id="`text-element-${idx}`"
                  v-html="paragraph"
                ></div>
              </div>
            </div>
          </div>

          <div
            v-else-if="slide.id === 114"
            id="kiffyu"
            class="p-0 m-0 bgblur slide"
          >
            <div id="tchoffo">
              <div id="deffp" class="preme">
                <div
                  v-for="(paragraph, idx) in slide.paragraphs"
                  :key="idx"
                  class="text-element"
                  v-html="paragraph"
                ></div>
              </div>
            </div>
          </div>

          <div
            v-else-if="slide.id === 22"
            id="thoiathoing"
            class="p-0 m-0 slide"
          >
            <div class="cont p-2">
              
              <div
                class="row flex-row align-content-center align-items-center juustify-content-center"
              >
                <div
                  v-for="(paragraph, idx) in slide.paragraphs"
                  :key="idx"
                  id="thoiathoing2"
                  class="text-element col m-0 p-2"
                  v-html="paragraph"
                ></div>
              </div>
            </div>
          </div>

          <div
            v-else-if="slide.id === 23"
            id="bygone-bip"
            class="p-0 m-0 slide"
          >
            <div id="perdrix-container" class="container">
              <!-- <div id="decodemerde" class="hidden hide">
                <div class="row">
                  <div class="col-md-6 d-none d-md-block">
                    <p></p>
                  </div>          
                  <div class="col-md-6">
                    <div id="teste">
                      <p></p>
                    </div>
                  </div>
                </div>
              </div>   -->
              <div id="perdrix" class="row">
                <div class="perdrix-slider">
                  <div class="perdrix-slider-container">
                    <div id="joce" class="perdrix-slides-wrapper container">
                      <div id="sharon" class="split-container row row-no-gutters">
                        <!-- Colonne de gauche : tous les textes -->
                        <div id="quadi" class="text-column col-md-6">
                          <div
                            v-for="(paragraph, idx) in slide.paragraphs"
                            :id="`perdrix-slide-${idx + 1}`"
                            :key="idx"
                            class="perdrix-slide text-block"
                          >
                            <div class="text-container">
                              <h3 v-if="extractTitle(paragraph)">
                                {{ extractTitle(paragraph) }}
                              </h3>
                              <div
                                class="text-content"
                                v-html="extractTextContent(paragraph)"
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div
                          id="stone" class="image-column col-md-6"
                        >
                        <div id="sparta">
                          <div id="rodman">
                            <div class="bdrs">
                            <div
                            v-for="(paragraph, idx) in slide.paragraphs"
                            :id="`image-container-${idx + 1}`"
                            :key="idx"
                            class="image-container"
                          >
                              <!-- Vérifier le type de fichier pour choisir le bon élément -->
                              <!-- SVG animé : utiliser object -->
                              <object
                                v-if="extractImage(paragraph).toLowerCase().endsWith('.svg')"
                                :data="extractImage(paragraph)"
                                type="image/svg+xml"
                                class="img-fluid m-0 p-0"
                                style="width: 100%; height: auto;"
                                :data-container-id="`image-container-${idx + 1}`"
                              >
                                <!-- Fallback si le SVG ne charge pas -->
                                <img
                                  :src="extractImage(paragraph)"
                                  alt="Image"
                                  class="img-fluid m-0 p-0"
                                />
                              </object>
                              
                              <!-- Image statique (WebP, PNG, JPG, etc.) : utiliser img -->
                              <img
                                v-else
                                :src="extractImage(paragraph)"
                                alt="Image"
                                class="img-fluid m-0 p-0"
                              />
                            </div>
                          </div>
                          </div>
                         
                        </div>
                        
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            id="slide-59"
            v-else-if="slide.id === 59"
            class="slide d-flex align-items-center justify-content-center"
          >
            <div id="killerjunior" class="ouh container">
              <div class="row">
                <div class="col-md-5 leporc">
                  <h2 class="text-element aya" v-html="slide.title"></h2>
                  <p v-html="slide.wp_content"></p>
                </div>
                <div class="col-md-7 kankan">
                  <div id="gorr">
                    <div id="gor">
                      <img id="llass" src="/images/Group105.svg" alt=" " />
                      <img id="lele" src="/images/Group203.svg" alt=" " />
                    </div>
                  </div>
                  <div
                    v-for="(paragraph, idx) in slide.paragraphs"
                    :key="idx"
                    class="lemouds"
                    v-html="paragraph"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div id="slide-128" v-else-if="slide.id === 128" class="slide">
            <div id="killerwu" class="ouh">
              <div class="case-study-container container">
                <div class="row">
                  <h2
                    class="d-block d-md-none text-element aya hightower"
                    v-html="slide.title"
                  ></h2>

                  <div id="bawse" class="col-md-7 col-sm-7 col-7">
                    <div id="casestudy">
                      <div id="dec">
                        <h2
                          class="d-none d-md-block text-element aya"
                          v-html="slide.title"
                        ></h2>
                        <div
                          v-for="(paragraph, idx) in slide.paragraphs"
                          :key="idx"
                          class="text-element col m-0 p-2"
                          :id="`case-study-item-${idx + 1}`"
                          :class="{
                            'case-study-active': idx === caseStudyActiveIndex,
                            'case-study-item': true,
                          }"
                        >
                          <h3 class="case-study-header">
                            {{ extractTitle(paragraph) }}
                          </h3>
                          <div
                            class="case-study-content"
                            :id="`case-study-content-${idx + 1}`"
                          >
                            <div v-html="extractTextContent(paragraph)"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div> 
                  <div class="col-md-5 col-sm-5 col-5">
                    <div class="case-study-image">
                      <img
                        v-if="slide.thumbnail"
                        :src="slide.thumbnail"
                        alt="Case Study Image"
                        class="img-fluid"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="lemof" v-else-if="slide.id === 60" class="slide">
            <div id="lafill" class="container">
              <h2 class="text-element lopere" v-html="slide.title"></h2>
              <div
                v-for="(paragraph, idx) in slide.paragraphs"
                :key="idx"
                class="text-element ditocard"
                v-html="paragraph"
              ></div>
              <div class="form-container">
                <div
                  v-if="showAlert"
                  :class="['alert', alertType]"
                  role="alert"
                >
                  {{ alertMessage }}
                </div>
                <form @submit.prevent="submitForm" class="contact-form">
                  <div class="row">
                    <div class="col-md-6">
                      <input
                        v-model="formData.firstName"
                        type="text"
                        class="form-control"
                        placeholder="First Name"
                        required
                      />
                    </div>
                    <div class="col-md-6 col-sm-12">
                      <input
                        v-model="formData.lastName"
                        type="text"
                        class="form-control"
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-12">
                      <input
                        v-model="formData.email"
                        type="email"
                        class="form-control"
                        placeholder="Email Address"
                        required
                      />
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-6">
                      <input
                        v-model="formData.company"
                        type="text"
                        class="form-control"
                        placeholder="Company Name"
                        required
                      />
                    </div>
                    <div class="col-md-6">
                      <input
                        v-model="formData.phone"
                        type="tel"
                        class="form-control"
                        placeholder="Contact Number"
                        required
                      />
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-12">
                      <textarea
                        v-model="formData.message"
                        class="form-control"
                        placeholder="Tell us more"
                        rows="4"
                      ></textarea>
                    </div>
                  </div>

                  <div class="row submit-row">
                    <div class="col-md-12">
                      <button
                        type="submit"
                        class="btn btn-primary"
                        :disabled="formLoading"
                      >
                        {{ formLoading ? "Sending..." : "Submit" }}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              <div
                id="yenamarre"
                class="d-flex align-items-center justify-content-center m-1"
              >
                <a
                  @click="goToFirstSlide"
                  class="back-to-top"
                  :class="{ show: showButton }"
                >
                  <img src="/images/backToTop.svg" alt="Back to Top" />
                </a>
              </div>
            </div>
            <div id="pdf">
                <ul>
                  <li><a href="#">VodaMedia Privacy Statement &copy; 2024</a></li>
                  <li><a href="#">FAQ's</a></li>
                  <li class="pdf-separator">|</li>
                  <li><a href="#">Legal</a></li>
                  <li class="pdf-separator">|</li>
                  <li><a href="#">T's & C's</a></li>
                </ul>
              </div>
          </div>

          <div v-else class="default-slide-content p-5 slide">
            <h1 class="text-element" v-html="slide.title"></h1>
            <div
              class="text-element"
              v-html="slide.content || slide.wp_content"
            ></div>
            <div
              v-for="(paragraph, pIdx) in slide.paragraphs"
              :key="pIdx"
              class="text-element"
              v-html="paragraph"
            ></div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- Custom scrollbar indicator -->
  <div class="simple-scrollbar">
    <div class="scrollbar-track">
      <div class="scrollbar-cursor" ref="scrollCursor"></div>
    </div>
  </div>
</template>

<style lang="scss">
:root {
  overflow: hidden;
}

#vodacomwrapper {
  transition: background-image 0.5s ease-in-out;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
}

#master-scroll-container {
  overflow-x: hidden;
}

.slide-section {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.slide-content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-size: cover;
  background-position: center center;
}

.bgblur {
  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.1);
}

.loader-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}

.logo-loader {
  width: 150px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  padding: 20px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.retry-button {
  margin-top: 15px;
  padding: 10px 20px;
  background-color: #721c24;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
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

header.fixed-top {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background-color: transparent;
  transition: background-color 0.3s ease;
}

header.fixed-top.scrolled {
  background-color: rgba(0, 0, 0, 0.8);
}

#headerpadding {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

#headerpadding img {
  height: 40px;
}

.logo-clickable {
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 1;
}

.logo-clickable:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.logo-clickable:active {
  transform: scale(0.95);
}

.menu-container {
  position: relative;
}

.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 25px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  position: fixed;
  right: 20px;
  top: 25px;
  z-index: 100000;
}

.hamburger span {
  width: 30px;
  height: 3px;
  background: #ff0000; /* Rouge vif par défaut */
  border-radius: 5px;
  transition: all 0.3s linear;
  position: relative;
  transform-origin: 1px;
}

/* Classes dynamiques pour la couleur du hamburger */
.hamburger.hamburger-red span {
  background: #ff0000 !important;
}

.hamburger.hamburger-red.is-active span:nth-child(1),
.hamburger.hamburger-red.is-active span:nth-child(3) {
  background: #ff0000 !important;
}

.hamburger.hamburger-white span {
  background: white !important;
}

.hamburger.hamburger-white.is-active span:nth-child(1),
.hamburger.hamburger-white.is-active span:nth-child(3) {
  background: white !important;
}

.hamburger.is-active span:nth-child(1) {
  transform: rotate(45deg);
}

.hamburger.is-active span:nth-child(2) {
  opacity: 0;
  transform: translateX(20px);
}

.hamburger.is-active span:nth-child(3) {
  transform: rotate(-45deg);
}

#menu {
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 60px;
  z-index: 9999;
  display: flex;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
  
  /* Animation de glissement : fermé = complètement à droite */
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

#menu.is-open {
  /* Animation de glissement : ouvert = position normale */
  transform: translateX(0);
}

#menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  text-align: center;
  width: 100%;
  opacity: 0;
  transform: translateX(20px);
  transition: opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s;
}

#menu.is-open ul {
  opacity: 1;
  transform: translateX(0);
}

#menu ul li {
  margin: 15px 0;
  cursor: pointer;
  padding: 10px 20px;
  opacity: 0;
  transform: translateX(30px);
  transition: all 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
}

#menu.is-open ul li {
  opacity: 1;
  transform: translateX(0);
}

/* Animation en cascade pour les éléments de liste */
#menu.is-open ul li:nth-child(1) { transition-delay: 0.1s; }
#menu.is-open ul li:nth-child(2) { transition-delay: 0.15s; }
#menu.is-open ul li:nth-child(3) { transition-delay: 0.2s; }
#menu.is-open ul li:nth-child(4) { transition-delay: 0.25s; }
#menu.is-open ul li:nth-child(5) { transition-delay: 0.3s; }
#menu.is-open ul li:nth-child(6) { transition-delay: 0.35s; }
#menu.is-open ul li:nth-child(7) { transition-delay: 0.4s; }
#menu.is-open ul li:nth-child(8) { transition-delay: 0.45s; }

#menu ul li .slide-label {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

#menu ul li.active .slide-label,
#menu ul li:hover .slide-label {
  color: #e60000;
}

@media (max-width: 1024px) {
  #menu {
    width: 70%;
  }
  #menu ul li {
    margin: 20px 0;
  }
}

.simple-scrollbar {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  height: 80dvh; // Hauteur de 80% du viewport dynamique
  width: 4px;
  background: transparent;
  pointer-events: none; // Évite les interactions accidentelles
}

.scrollbar-track {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  //backdrop-filter: blur(5px);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.scrollbar-cursor {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 40px; // Hauteur du curseur augmentée de 20px à 40px
  background: linear-gradient(180deg, #e60000 0%, #cc0000 100%);
  border-radius: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(230, 0, 0, 0.4);

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 16px; // Augmenté de 8px à 16px pour correspondre au curseur plus long
    background: rgba(255, 255, 255, 0.6);
    border-radius: 1px;
  }

  &:hover {
    background: linear-gradient(180deg, #ff1a1a 0%, #e60000 100%);
    transform: scale(1.2);
    box-shadow: 0 4px 12px rgba(230, 0, 0, 0.6);
  }
}

// Animation d'apparition/disparition
.simple-scrollbar {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;

  &.visible {
    opacity: 1;
    visibility: visible;
  }

  &.hidden {
    opacity: 0;
    visibility: hidden;
  }
}

// Animation lors du changement de slide
.scrollbar-cursor.animating {
  transition: top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

// Animation de pulsation pour attirer l'attention
@keyframes scrollbar-pulse {
  0% {
    box-shadow: 0 2px 8px rgba(230, 0, 0, 0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 4px 16px rgba(230, 0, 0, 0.8);
    transform: scale(1.1);
  }
  100% {
    box-shadow: 0 2px 8px rgba(230, 0, 0, 0.4);
    transform: scale(1);
  }
}

.scrollbar-cursor.pulse {
  animation: scrollbar-pulse 2s infinite;
}

// Responsive design
@media screen and (max-width: 1024px) {
  .simple-scrollbar {
    // Passage en mode horizontal
    right: auto;
    top: auto;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    height: 4px; // Hauteur réduite pour le mode horizontal
    width: 80vw; // Largeur adaptée au mode horizontal
  }

  .scrollbar-track {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }

  .scrollbar-cursor {
    width: 40px; // Largeur du curseur en mode horizontal
    height: 100%; // Hauteur complète de la track

    &::before {
      width: 16px; // Largeur de l'indicateur interne
      height: 2px; // Hauteur de l'indicateur interne
    }
    
    // Animation spécifique pour le mode horizontal
    &.animating {
      transition: left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
  }
}

@media screen and (max-width: 768px) {
  .simple-scrollbar {
    bottom: 15px;
    width: 85vw; // Largeur légèrement plus grande sur mobile
    height: 3px;
  }

  .scrollbar-cursor {
    width: 35px; // Légèrement plus petit sur mobile

    &::before {
      width: 14px;
      height: 1px;
    }
  }
}

// Responsive design pour tablettes
@media screen and (min-width: 768px) and (max-width: 1366px) and (pointer: coarse) {
  /* Styles spécifiques pour tablettes avec écran tactile */
  .simple-scrollbar {
    /* Scrollbar légèrement plus grande sur tablettes pour faciliter l'interaction */
    width: 6px;
  }

  .scrollbar-cursor {
    height: 50px; // Curseur plus grand pour les tablettes
    
    &::before {
      height: 20px; // Indicateur interne plus grand
    }
  }

  /* Améliorer les zones tactiles */
  .hamburger {
    width: 35px;
    height: 30px;
    
    span {
      height: 4px; // Barres légèrement plus épaisses
    }
  }

  #menu ul li {
    padding: 15px 25px; // Zones tactiles plus grandes
    font-size: 1.1em; // Texte légèrement plus grand
  }
}

/* Optimisations pour iPad en mode paysage */
@media screen and (min-width: 1024px) and (max-width: 1366px) and (orientation: landscape) and (pointer: coarse) {
  .slide-section {
    /* S'assurer que les sections utilisent toute la hauteur sur iPad paysage */
    min-height: 100vh;
  }
}

/* Optimisations pour iPad en mode portrait */
@media screen and (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) and (pointer: coarse) {
  .simple-scrollbar {
    /* Repositionner la scrollbar en mode portrait */
    right: 15px;
    height: 75vh;
  }
}

/* Désactiver le scroll natif sur tablettes quand le système desktop est actif */
.tablet-mode-desktop {
  overflow: hidden !important;
  
  body, html {
    overflow: hidden !important;
    touch-action: none; /* Empêcher les gestes natifs */
  }
}

/* Styles pour le formulaire de contact */
.contact-form {
  .form-control {
    margin-bottom: 0;
    border-radius: 5px;
    border: 2px solid #ffffff;
    padding: 12px 15px;
    transition: border-color 0.3s ease;
    
    &:focus {
      border-color: #e60000;
      box-shadow: 0 0 0 0.2rem rgba(230, 0, 0, 0.25);
      outline: none;
    }
    
    &::placeholder {
      color: #ffffff;
      opacity: 1;
    }
  }
  
  textarea.form-control {
    resize: vertical;
    min-height: 50px;
    font-family: inherit;
  }
  
  .btn-primary {
    background-color: #e60000;
    border-color: #e60000;
    padding: 12px 30px;
    border-radius: 5px;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #cc0000;
      border-color: #cc0000;
      transform: translateY(-1px);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }
}

/* Alert styles */
.alert {
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}
</style>
