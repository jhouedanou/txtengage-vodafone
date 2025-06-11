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
        
        // 🚀 NOUVEAU : Gestion simple pour slide-23
        if (slideId === 23) {
          console.log(`🎯 Activation de slide-23`);
          // Initialiser les SVG de slide-23 uniquement maintenant
          setTimeout(() => {
            initSlide23SvgOnActivation();
          }, 300);
        } else {
          // Nettoyer slide-23 si on la quitte
          cleanupSlide23SvgOnDeactivation();
        }
        
        // 🎬 Redémarrer automatiquement les animations SVG dans cette section (autres slides)
        if (slideId !== 23) {
          setTimeout(() => {
            restartSectionSvgAnimations(section);
          }, 100);
        }
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
        
        // 🚀 NOUVEAU : Gestion simple pour slide-23
        if (slideId === 23) {
          console.log(`🎯 Activation de slide-23`);
          // Initialiser les SVG de slide-23 uniquement maintenant
          setTimeout(() => {
            initSlide23SvgOnActivation();
          }, 300);
        } else {
          // Nettoyer slide-23 si on la quitte
          cleanupSlide23SvgOnDeactivation();
        }
        
        // 🎬 Redémarrer automatiquement les animations SVG dans cette section (autres slides)
        if (slideId !== 23) {
          setTimeout(() => {
            restartSectionSvgAnimations(section);
          }, 100);
        }
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

  // Initialiser les animations SVG Svgator (SAUF pour slide-23)
  initSvgatorAnimations();
  
  // Ajouter un fallback pour la production avec un délai plus long
  if (process.env.NODE_ENV === 'production') {
    console.log('🏭 Mode production détecté - Activation du fallback SVG');
    initSvgatorProductionFallback();
  }

  // ✅ SYSTÈME SIMPLE : Slide-23 sera gérée uniquement à l'activation
  console.log('✅ SVG slide-23 seront initialisés uniquement à l\'activation de la slide');

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
      forceReload: forceSvgReload,
      productionFallback: () => {
        console.log('🏭 Activation manuelle du fallback production');
        initSvgatorProductionFallback();
      },
      // 🚀 NOUVEAU : Fonctions pour le lazy loading
      lazyLoading: {
        reinit: () => {
          console.log('🔄 Réinitialisation du lazy loading slide-23');
          cleanupSlide23LazyLoading();
          setTimeout(() => {
            initSlide23LazyLoading();
          }, 500);
        },
        testVisible: () => {
          // Tester quels containers sont visibles
          const slide23Section = document.getElementById('slide-23');
          if (slide23Section) {
            const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
            imageContainers.forEach(container => {
              const rect = container.getBoundingClientRect();
              const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
              console.log(`👁️ ${container.id}: ${isVisible ? 'VISIBLE' : 'CACHÉ'}`);
            });
          }
        },
        forceLoad: (containerId) => {
          // Forcer le lazy loading d'un container spécifique
          const container = document.getElementById(containerId);
          if (container) {
            const svgObject = container.querySelector('object[type="image/svg+xml"]');
            if (svgObject) {
              console.log(`🚀 Force lazy loading de ${containerId}`);
              lazyLoadSvgAnimation(containerId, svgObject);
            }
          }
        },
        toggleActive: (active) => {
          // Activer/désactiver le lazy loading
          toggleSlide23LazyLoading(active);
        },
        status: () => {
          // État du lazy loading
          console.log('📊 État lazy loading slide-23:');
          console.log(`   - Observer: ${slide23Observer ? '✅ actif' : '❌ inactif'}`);
          console.log(`   - Slide active: ${slide23IsActive ? '✅' : '❌'}`);
          console.log(`   - Slide courante: ${activeSlideId.value}`);
          
          // Vérifier les players stockés pour slide-23
          if (window.svgatorPlayers) {
            console.log('📊 Players SVG slide-23:');
            const slide23Section = document.getElementById('slide-23');
            if (slide23Section) {
              const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
              imageContainers.forEach(container => {
                const hasPlayer = window.svgatorPlayers.has(container.id);
                console.log(`   - ${container.id}: ${hasPlayer ? '✅ player trouvé' : '❌ player manquant'}`);
              });
            }
          }
        },
        initNow: () => {
          // Forcer l'initialisation des SVG slide-23
          console.log('🚀 Force initialisation des SVG slide-23');
          initSlide23SvgAnimations();
        },
        cleanupNow: () => {
          // Forcer le nettoyage des animations slide-23
          console.log('🧹 Force nettoyage des animations slide-23');
          cleanupSlide23Animations();
        }
      }
    };
    
    console.log('🛠️ Fonctions de debug avec lazy loading disponibles:');
    console.log('- window.debugSvgAnimations.restart("image-container-1") // Redémarre une animation spécifique');
    console.log('- window.debugSvgAnimations.restartAll() // Redémarre toutes les animations');
    console.log('- window.debugSvgAnimations.restartSection("slide-23") // Redémarre les animations d\'une section');
    console.log('- window.debugSvgAnimations.restartCurrentSection() // Redémarre les animations de la section active');
    console.log('- window.debugSvgAnimations.listAnimations() // Liste toutes les animations');
    console.log('- window.debugSvgAnimations.reinitialize() // Réinitialise complètement');
    console.log('- window.debugSvgAnimations.checkPlayers() // Vérifie l\'état des players');
    console.log('- window.debugSvgAnimations.forceReload() // Force le rechargement des objets SVG');
    console.log('- window.debugSvgAnimations.productionFallback() // Active le fallback de production');
    console.log('');
    console.log('🚀 Nouvelles fonctions de lazy loading:');
    console.log('- window.debugSvgAnimations.lazyLoading.reinit() // Réinitialise le lazy loading');
    console.log('- window.debugSvgAnimations.lazyLoading.testVisible() // Teste quels containers sont visibles');
    console.log('- window.debugSvgAnimations.lazyLoading.forceLoad("image-container-1") // Force le lazy loading d\'un container');
    console.log('- window.debugSvgAnimations.lazyLoading.toggleActive(true/false) // Active/désactive le lazy loading');
    console.log('- window.debugSvgAnimations.lazyLoading.status() // État du lazy loading');
    console.log('- window.debugSvgAnimations.lazyLoading.initNow() // Force l\'initialisation des SVG slide-23');
    console.log('- window.debugSvgAnimations.lazyLoading.cleanupNow() // Force le nettoyage des animations slide-23');
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
  // ✅ Nettoyage simple slide-23
  cleanupSlide23SvgOnDeactivation();
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
  console.log('🚀 Initialisation des animations SVG Svgator...');
  
  // Attendre que le DOM soit complètement hydraté
  nextTick(() => {
    // Double vérification pour s'assurer que nous sommes côté client
    if (typeof window === 'undefined') {
      console.warn('⚠️ initSvgatorAnimations: pas côté client, abandon');
      return;
    }
    
    // Initialiser le stockage global des players
    if (!window.svgatorPlayers) {
      window.svgatorPlayers = new Map();
    }
    
    // Fonction pour traiter un objet SVG
    const processSvgObject = (obj, index) => {
      const containerId = obj.getAttribute('data-container-id') || `svg-${index}`;
      
      // ⛔ BLOCAGE TOTAL : Ignorer TOUS les SVG de slide-23 - ils seront gérés à l'activation
        const slide23Section = document.getElementById('slide-23');
      if (slide23Section && slide23Section.contains(obj)) {
        console.log(`⛔ BLOQUÉ: ${containerId} appartient à slide-23, sera géré uniquement à l'activation`);
            return;
      }
      
      console.log(`🔍 Traitement du SVG ${index + 1} dans ${containerId}`);
      
      // Fonction pour initialiser le SVG une fois chargé
      const initializeSvg = () => {
        try {
          const svgDoc = obj.contentDocument;
          if (!svgDoc) {
            console.warn(`⚠️ Impossible d'accéder au contentDocument de ${containerId}`);
            return false;
          }
          
          console.log(`📄 Document SVG accessible pour ${containerId}`);
          
          // Rechercher les scripts Svgator dans le document SVG
          const scripts = svgDoc.querySelectorAll('script');
          let svgatorFound = false;
          
          scripts.forEach(script => {
            if (script.textContent && script.textContent.includes('svgatorPlayer')) {
              svgatorFound = true;
              console.log(`🎬 Animation Svgator trouvée dans ${containerId}`);
              
              try {
                // Méthode robuste pour l'exécution du script
                const executeScript = () => {
                  try {
                    // Essayer d'exécuter le script dans le contexte du SVG
                    const svgWindow = svgDoc.defaultView || window;
                    const scriptFunction = new Function(script.textContent);
                    scriptFunction.call(svgWindow);
                    
                    console.log(`✅ Script Svgator exécuté dans ${containerId}`);
                    
                    // Configurer l'animation avec retry
                    setTimeout(() => {
                      configureSvgatorRepeat(svgDoc, containerId);
                    }, 500);
                    
                    return true;
                  } catch (error) {
                    console.error(`❌ Erreur lors de l'exécution du script pour ${containerId}:`, error);
                    return false;
                  }
                };
                
                // Exécuter immédiatement
                if (!executeScript()) {
                  // Retry après un délai
                  setTimeout(() => {
                    console.log(`🔄 Retry script execution pour ${containerId}`);
                    executeScript();
                  }, 1000);
                }
                
              } catch (error) {
                console.error(`❌ Erreur lors du traitement du script Svgator:`, error);
              }
            }
          });
          
          if (!svgatorFound) {
            console.log(`ℹ️ Aucune animation Svgator détectée dans ${containerId}`);
          }
          
          return true;
        } catch (error) {
          console.warn(`⚠️ Erreur lors de l'initialisation du SVG ${containerId}:`, error);
          return false;
        }
      };
      
      // Vérifier si le SVG est déjà chargé
      if (obj.contentDocument) {
        console.log(`✅ SVG ${containerId} déjà chargé`);
        initializeSvg();
      } else {
        // Ajouter des listeners pour le chargement
        console.log(`⏳ Attente du chargement de ${containerId}`);
        
        const onLoad = () => {
          console.log(`📥 SVG ${containerId} chargé via événement load`);
          setTimeout(() => initializeSvg(), 100);
        };
        
        // Écouter l'événement load
        obj.addEventListener('load', onLoad, { once: true });
        
        // Fallback avec polling pour la production
        let checkAttempts = 0;
        const maxCheckAttempts = 10;
        
        const pollForContent = () => {
          checkAttempts++;
          
          if (obj.contentDocument) {
            console.log(`📥 SVG ${containerId} détecté via polling (tentative ${checkAttempts})`);
            obj.removeEventListener('load', onLoad);
            initializeSvg();
          } else if (checkAttempts < maxCheckAttempts) {
            setTimeout(pollForContent, 300);
          } else {
            console.warn(`⚠️ Timeout pour le chargement de ${containerId} après ${maxCheckAttempts} tentatives`);
          }
        };
        
        // Démarrer le polling après un délai initial
        setTimeout(pollForContent, 200);
      }
    };
    
    // Trouver tous les objets SVG
    const svgObjects = document.querySelectorAll('object[type="image/svg+xml"]');
    console.log(`🔍 ${svgObjects.length} objets SVG trouvés`);
    
    if (svgObjects.length === 0) {
      console.warn('⚠️ Aucun objet SVG trouvé dans le DOM');
      return;
    }
    
    // Traiter chaque objet SVG
    svgObjects.forEach(processSvgObject);
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
          // Pour les animations normales (non-slide-23), démarrer normalement
            console.log(`✅ Animation configurée pour lecture unique dans ${containerId}`);
            
          // Démarrer l'animation immédiatement
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

// 🚀 NOUVEAU SYSTÈME SIMPLE : Initialiser slide-23 uniquement à l'activation
const initSlide23SvgOnActivation = () => {
  console.log('🎯 Activation des SVG slide-23 - Début initialisation');
  
  const slide23Section = document.getElementById('slide-23');
  if (!slide23Section) {
    console.warn('❌ Slide-23 non trouvée');
    return;
  }
  
  // Trouver tous les objets SVG dans slide-23
  const svgObjects = slide23Section.querySelectorAll('object[type="image/svg+xml"]');
  console.log(`📊 ${svgObjects.length} objets SVG trouvés dans slide-23`);
  
  svgObjects.forEach((obj, index) => {
    const containerId = obj.getAttribute('data-container-id') || `slide-23-svg-${index}`;
    console.log(`🔄 Initialisation SVG slide-23: ${containerId}`);
    
    const initSvg = () => {
    try {
      const svgDoc = obj.contentDocument;
      if (!svgDoc) {
          console.warn(`⚠️ Pas d'accès contentDocument pour ${containerId}`);
          return;
      }
      
        console.log(`📄 Document SVG accessible pour ${containerId}`);
      
      const scripts = svgDoc.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && script.textContent.includes('svgatorPlayer')) {
          try {
              console.log(`🎬 Exécution script Svgator pour ${containerId}`);
              
            const svgWindow = svgDoc.defaultView || window;
            const scriptFunction = new Function(script.textContent);
            scriptFunction.call(svgWindow);
            
              // Attendre et configurer le player
            setTimeout(() => {
                const player = svgWindow.svgatorPlayer;
                if (player && typeof player.restart === 'function') {
                  player.restart();
                  console.log(`✅ SVG slide-23 animé: ${containerId}`);
                } else {
                  console.warn(`⚠️ Player non trouvé pour ${containerId}`);
                }
            }, 500);
            
          } catch (error) {
              console.error(`❌ Erreur script ${containerId}:`, error);
          }
        }
      });
      
    } catch (error) {
        console.error(`❌ Erreur init ${containerId}:`, error);
      }
    };
    
    // Si déjà chargé, initialiser immédiatement
    if (obj.contentDocument) {
      initSvg();
  } else {
      // Sinon attendre le chargement
      obj.addEventListener('load', () => {
        setTimeout(initSvg, 100);
      }, { once: true });
    }
  });
};

// 🚀 SYSTÈME SIMPLE : Nettoyer slide-23 à la désactivation
const cleanupSlide23SvgOnDeactivation = () => {
  console.log('🧹 Désactivation des SVG slide-23');
  
  const slide23Section = document.getElementById('slide-23');
  if (!slide23Section) return;
  
  const svgObjects = slide23Section.querySelectorAll('object[type="image/svg+xml"]');
  
  svgObjects.forEach(obj => {
    try {
          const svgDoc = obj.contentDocument;
          if (svgDoc) {
            const svgWindow = svgDoc.defaultView;
            const player = svgWindow && svgWindow.svgatorPlayer;
      
      if (player) {
          if (typeof player.pause === 'function') {
            player.pause();
          }
            if (typeof player.seek === 'function') {
              player.seek(0);
            }
        }
      }
  } catch (error) {
      console.warn('⚠️ Erreur nettoyage SVG:', error);
  }
  });
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
  
  // Traitement spécial pour la slide-23 - maintenant géré par lazy loading
  if (section.id === 'slide-23') {
    console.log(`🚀 Slide-23 détectée - Lazy loading activé automatiquement`);
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
  
  // 🚀 NOUVEAU : Utiliser le player stocké si disponible
  if (window.svgatorPlayers && window.svgatorPlayers.has(containerId)) {
    const player = window.svgatorPlayers.get(containerId);
    
    try {
      if (player && typeof player.restart === 'function') {
        player.restart();
        console.log(`✅ Animation redémarrée avec succès via player stocké dans ${containerId}`);
        return;
      }
    } catch (error) {
      console.warn(`⚠️ Erreur avec player stocké pour ${containerId}, fallback vers méthode classique:`, error);
    }
  }
  
  // Fallback vers la méthode classique si le player stocké n'est pas disponible
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
  
  // 🚀 NOUVEAU : Utiliser le player stocké si disponible
  if (window.svgatorPlayers && window.svgatorPlayers.has(containerId)) {
    const player = window.svgatorPlayers.get(containerId);
    
    try {
      if (player) {
        // Arrêter l'animation
        if (typeof player.pause === 'function') {
          player.pause();
          console.log(`⏸️ Animation mise en pause via player stocké dans ${containerId}`);
        }
        
        // Revenir au début
        if (typeof player.seek === 'function') {
          player.seek(0);
          console.log(`⏮️ Animation remise à zéro via player stocké dans ${containerId}`);
        }
        
        console.log(`✅ Animation SVG arrêtée avec succès via player stocké dans ${containerId}`);
        return;
      }
    } catch (error) {
      console.warn(`⚠️ Erreur avec player stocké pour arrêt ${containerId}, fallback vers méthode classique:`, error);
    }
  }
  
  // Fallback vers la méthode classique si le player stocké n'est pas disponible
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

// Système de lazy loading pour slide-23 avec Intersection Observer
let slide23Observer = null;
let slide23IsActive = false;

const initSlide23LazyLoading = () => {
  console.log(`🚀 Initialisation du lazy loading slide-23`);
  
  // Nettoyer l'observer existant
  if (slide23Observer) {
    slide23Observer.disconnect();
  }
  
  // Créer l'observer pour surveiller les .image-container dans slide-23
  slide23Observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const container = entry.target;
      const containerId = container.id;
      
      if (entry.isIntersecting && slide23IsActive) {
        console.log(`👁️ Container ${containerId} devient visible - Lazy loading`);
        
        // Trouver l'object SVG dans ce container
        const svgObject = container.querySelector('object[type="image/svg+xml"]');
        if (svgObject) {
          lazyLoadSvgAnimation(containerId, svgObject);
        }
      } else if (!entry.isIntersecting && slide23IsActive) {
        console.log(`👁️ Container ${containerId} n'est plus visible - Arrêt lazy`);
        // Optionnel : arrêter l'animation quand pas visible
        stopLazyLoadedAnimation(containerId);
      }
    });
  }, {
    root: null, // Viewport
    rootMargin: '10px', // Petite marge pour déclencher avant que ce soit complètement visible
    threshold: 0.1 // Déclencher quand 10% du container est visible
  });
  
  // Observer tous les image-containers dans slide-23
  const slide23Section = document.getElementById('slide-23');
  if (slide23Section) {
    const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
    imageContainers.forEach(container => {
      if (container.id) {
        console.log(`📋 Observation de ${container.id} pour lazy loading`);
        slide23Observer.observe(container);
      }
    });
  }
};

// Fonction pour lazy load d'une animation SVG
const lazyLoadSvgAnimation = (containerId, svgObject) => {
  console.log(`🔄 Lazy loading animation pour ${containerId}`);
  
  // Forcer le rechargement du SVG pour déclencher l'animation
  const originalData = svgObject.data;
  
  // Méthode 1: Recharger complètement le SVG
  svgObject.data = '';
  
  setTimeout(() => {
    svgObject.data = originalData;
    console.log(`✅ SVG rechargé pour ${containerId}`);
    
    // Attendre que le SVG soit chargé et essayer de démarrer l'animation
    svgObject.addEventListener('load', () => {
      setTimeout(() => {
        console.log(`🎬 Tentative de démarrage animation lazy pour ${containerId}`);
        startLazyLoadedAnimation(containerId);
      }, 500);
    }, { once: true });
    
  }, 100);
};

// Fonction pour démarrer une animation lazy loaded
const startLazyLoadedAnimation = (containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const svgObject = container.querySelector('object[type="image/svg+xml"]');
  if (!svgObject || !svgObject.contentDocument) {
    console.log(`⚠️ SVG pas prêt pour ${containerId}, retry dans 1s`);
    
    // Retry une seule fois
    setTimeout(() => {
      startLazyLoadedAnimation(containerId);
    }, 1000);
    return;
  }
  
  try {
    const svgWindow = svgObject.contentDocument.defaultView;
    if (svgWindow && svgWindow.svgatorPlayer) {
      svgWindow.svgatorPlayer.restart();
      console.log(`🎯 Animation lazy démarrée avec succès pour ${containerId}`);
    } else {
      console.log(`⚠️ Player Svgator non trouvé dans ${containerId} (lazy)`);
    }
  } catch (error) {
    console.error(`❌ Erreur animation lazy ${containerId}:`, error);
  }
};

// Fonction pour arrêter une animation lazy loaded
const stopLazyLoadedAnimation = (containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const svgObject = container.querySelector('object[type="image/svg+xml"]');
  if (!svgObject || !svgObject.contentDocument) return;
  
  try {
    const svgWindow = svgObject.contentDocument.defaultView;
    if (svgWindow && svgWindow.svgatorPlayer) {
      if (typeof svgWindow.svgatorPlayer.pause === 'function') {
        svgWindow.svgatorPlayer.pause();
      }
      console.log(`⏸️ Animation lazy arrêtée pour ${containerId}`);
    }
  } catch (error) {
    console.error(`❌ Erreur arrêt lazy ${containerId}:`, error);
  }
};

// Fonction pour activer/désactiver le lazy loading selon la slide
const toggleSlide23LazyLoading = (isActive) => {
  slide23IsActive = isActive;
  console.log(`🔄 Lazy loading slide-23: ${isActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
  
  if (isActive) {
    // 🚀 NOUVEAU : Initialiser les SVG de slide-23 seulement maintenant
    console.log(`🎯 Initialisation des SVG slide-23 au moment de l'activation`);
    initSlide23SvgAnimations();
    
    // Déclencher immédiatement un check pour voir quels containers sont visibles
    setTimeout(() => {
      const slide23Section = document.getElementById('slide-23');
      if (slide23Section) {
        const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
        imageContainers.forEach(container => {
          const rect = container.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          
          if (isVisible) {
            console.log(`👁️ Container ${container.id} déjà visible au chargement`);
            const svgObject = container.querySelector('object[type="image/svg+xml"]');
            if (svgObject) {
              lazyLoadSvgAnimation(container.id, svgObject);
            }
          }
        });
      }
    }, 500);
  } else {
    // Nettoyer les animations quand on quitte slide-23
    console.log(`🧹 Nettoyage des animations slide-23`);
    cleanupSlide23Animations();
  }
};

// 🚀 NOUVEAU : Initialiser spécifiquement les SVG de slide-23
const initSlide23SvgAnimations = () => {
  console.log('🎯 Initialisation spécifique des SVG slide-23');
  
  const slide23Section = document.getElementById('slide-23');
  if (!slide23Section) {
    console.warn('❌ Slide-23 non trouvée');
    return;
  }
  
  const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
  console.log(`📊 ${imageContainers.length} image-containers trouvés dans slide-23`);
  
  imageContainers.forEach((container, index) => {
    const containerId = container.id;
    const svgObject = container.querySelector('object[type="image/svg+xml"]');
    
    if (svgObject && containerId) {
      console.log(`🔄 Initialisation SVG pour ${containerId}`);
      
      // Traiter ce SVG avec la même logique que initSvgatorAnimations
      // mais spécifiquement pour slide-23
      processSlide23SvgObject(svgObject, containerId);
    }
  });
};

// Fonction pour traiter un SVG spécifique à slide-23
const processSlide23SvgObject = (obj, containerId) => {
  console.log(`🔍 Traitement spécifique SVG slide-23: ${containerId}`);
  
  // Fonction pour initialiser le SVG une fois chargé
  const initializeSvg = () => {
    try {
      const svgDoc = obj.contentDocument;
      if (!svgDoc) {
        console.warn(`⚠️ Impossible d'accéder au contentDocument de ${containerId}`);
        return false;
      }
      
      console.log(`📄 Document SVG accessible pour ${containerId} (slide-23)`);
      
      // Rechercher les scripts Svgator dans le document SVG
      const scripts = svgDoc.querySelectorAll('script');
      let svgatorFound = false;
      
      scripts.forEach(script => {
        if (script.textContent && script.textContent.includes('svgatorPlayer')) {
          svgatorFound = true;
          console.log(`🎬 Animation Svgator trouvée dans ${containerId} (slide-23)`);
          
          try {
            // Exécuter le script dans le contexte du SVG
            const svgWindow = svgDoc.defaultView || window;
            const scriptFunction = new Function(script.textContent);
            scriptFunction.call(svgWindow);
            
            console.log(`✅ Script Svgator exécuté dans ${containerId} (slide-23)`);
            
            // Configurer l'animation avec retry
            setTimeout(() => {
              configureSlide23SvgatorPlayer(svgDoc, containerId);
            }, 500);
            
          } catch (error) {
            console.error(`❌ Erreur lors de l'exécution du script pour ${containerId} (slide-23):`, error);
          }
        }
      });
      
      if (!svgatorFound) {
        console.log(`ℹ️ Aucune animation Svgator détectée dans ${containerId} (slide-23)`);
      }
      
      return true;
    } catch (error) {
      console.warn(`⚠️ Erreur lors de l'initialisation du SVG ${containerId} (slide-23):`, error);
      return false;
    }
  };
  
  // Vérifier si le SVG est déjà chargé
  if (obj.contentDocument) {
    console.log(`✅ SVG ${containerId} déjà chargé (slide-23)`);
    initializeSvg();
  } else {
    console.log(`⏳ Attente du chargement de ${containerId} (slide-23)`);
    
    const onLoad = () => {
      console.log(`📥 SVG ${containerId} chargé via événement load (slide-23)`);
      setTimeout(() => initializeSvg(), 100);
    };
    
    obj.addEventListener('load', onLoad, { once: true });
    
    // Fallback avec polling
    let checkAttempts = 0;
    const maxCheckAttempts = 10;
    
    const pollForContent = () => {
      checkAttempts++;
      
      if (obj.contentDocument) {
        console.log(`📥 SVG ${containerId} détecté via polling (tentative ${checkAttempts}) (slide-23)`);
        obj.removeEventListener('load', onLoad);
        initializeSvg();
      } else if (checkAttempts < maxCheckAttempts) {
        setTimeout(pollForContent, 300);
      } else {
        console.warn(`⚠️ Timeout pour le chargement de ${containerId} après ${maxCheckAttempts} tentatives (slide-23)`);
      }
    };
    
    setTimeout(pollForContent, 200);
  }
};

// Configurer le player Svgator pour slide-23
const configureSlide23SvgatorPlayer = (svgDoc, containerId) => {
  try {
    console.log(`🔍 Recherche du player Svgator dans ${containerId} (slide-23)`);
    
    const svgWindow = svgDoc.defaultView;
    let attempts = 0;
    const maxAttempts = 5;
    
    const findAndConfigurePlayer = () => {
      attempts++;
      
      let player = svgWindow && svgWindow.svgatorPlayer;
      
      if (!player && svgWindow) {
        for (let prop in svgWindow) {
          if (prop.includes('svgator') || prop.includes('player')) {
            if (svgWindow[prop] && typeof svgWindow[prop] === 'object') {
              player = svgWindow[prop];
              break;
            }
          }
        }
      }
      
      if (!player) {
        const svgElement = svgDoc.querySelector('svg');
        if (svgElement && svgElement.svgatorPlayer) {
          player = svgElement.svgatorPlayer;
        }
      }
      
      if (player) {
        console.log(`🎯 Player Svgator trouvé dans ${containerId} (slide-23) après ${attempts} tentatives`);
        
        try {
          // Stocker le player pour utilisation par le lazy loading
          if (!window.svgatorPlayers) {
            window.svgatorPlayers = new Map();
          }
          window.svgatorPlayers.set(containerId, player);
          
          // NE PAS démarrer l'animation automatiquement - attendre le lazy loading
          if (typeof player.seek === 'function') {
            player.seek(0);
          }
          if (typeof player.pause === 'function') {
            player.pause();
          }
          
          console.log(`⏸️ Player ${containerId} (slide-23) configuré mais en pause, attend lazy loading`);
          
        } catch (configError) {
          console.error(`❌ Erreur lors de la configuration du player ${containerId} (slide-23):`, configError);
        }
        
      } else if (attempts < maxAttempts) {
        console.log(`⏳ Player non trouvé, tentative ${attempts}/${maxAttempts} dans ${containerId} (slide-23)`);
        setTimeout(findAndConfigurePlayer, 300);
      } else {
        console.warn(`❌ Player Svgator non trouvé dans ${containerId} (slide-23) après ${maxAttempts} tentatives`);
      }
    };
    
    findAndConfigurePlayer();
    
  } catch (error) {
    console.error(`❌ Erreur lors de la configuration du player ${containerId} (slide-23):`, error);
  }
};

// Nettoyer les animations de slide-23
const cleanupSlide23Animations = () => {
  console.log('🧹 Nettoyage des animations slide-23');
  
  const slide23Section = document.getElementById('slide-23');
  if (slide23Section) {
    const imageContainers = slide23Section.querySelectorAll('.bdrs .image-container');
    
    imageContainers.forEach(container => {
      const containerId = container.id;
      
      // Arrêter les animations
      if (window.svgatorPlayers && window.svgatorPlayers.has(containerId)) {
        const player = window.svgatorPlayers.get(containerId);
        try {
          if (player && typeof player.pause === 'function') {
            player.pause();
          }
          if (player && typeof player.seek === 'function') {
            player.seek(0);
          }
          console.log(`⏸️ Animation ${containerId} arrêtée et remise à zéro`);
        } catch (error) {
          console.warn(`⚠️ Erreur lors de l'arrêt de ${containerId}:`, error);
        }
      }
      
      // Optionnel : Vider le cache des SVG pour économiser la mémoire
      const svgObject = container.querySelector('object[type="image/svg+xml"]');
      if (svgObject) {
        // Réinitialiser le SVG pour libérer la mémoire
        const originalData = svgObject.data;
        svgObject.data = '';
        setTimeout(() => {
          svgObject.data = originalData;
        }, 100);
      }
    });
  }
};

// Nettoyer le lazy loading
const cleanupSlide23LazyLoading = () => {
  if (slide23Observer) {
    slide23Observer.disconnect();
    slide23Observer = null;
    console.log('Lazy loading slide-23 nettoye');
  }
  slide23IsActive = false;
};

// Fonction d'initialisation retardée pour la production
const initSvgatorProductionFallback = () => {
  console.log('🔧 Initialisation fallback pour la production...');
  
  // Attendre plus longtemps pour s'assurer que tout est chargé
  setTimeout(() => {
    if (typeof window === 'undefined') return;
    
    const svgObjects = document.querySelectorAll('object[type="image/svg+xml"]');
    
    svgObjects.forEach((obj, index) => {
      const containerId = obj.getAttribute('data-container-id') || `svg-fallback-${index}`;
      
      // Forcer le rechargement de l'objet SVG si nécessaire
      if (!obj.contentDocument && obj.data) {
        console.log(`🔄 Rechargement forcé du SVG ${containerId}`);
        const originalData = obj.data;
        obj.data = '';
        setTimeout(() => {
          obj.data = originalData;
        }, 100);
      }
      
      // Polling plus agressif pour la production
      let retryCount = 0;
      const maxRetries = 15;
      
      const aggressivePolling = () => {
        retryCount++;
        
        if (obj.contentDocument) {
          console.log(`✅ SVG ${containerId} finalement accessible (retry ${retryCount})`);
          
          // Réessayer l'initialisation avec un délai
          setTimeout(() => {
            const svgDoc = obj.contentDocument;
            const scripts = svgDoc.querySelectorAll('script');
            
            scripts.forEach(script => {
              if (script.textContent && script.textContent.includes('svgatorPlayer')) {
                try {
                  const svgWindow = svgDoc.defaultView || window;
                  const scriptFunction = new Function(script.textContent);
                  scriptFunction.call(svgWindow);
                  
                  console.log(`✅ Script Svgator ré-exécuté avec succès (fallback) pour ${containerId}`);
                  
                  // Configuration avec délai plus long
                  setTimeout(() => {
                    configureSvgatorRepeat(svgDoc, containerId);
                  }, 1000);
                } catch (error) {
                  console.error(`❌ Erreur fallback pour ${containerId}:`, error);
                }
              }
            });
          }, 200);
          
        } else if (retryCount < maxRetries) {
          setTimeout(aggressivePolling, 500);
        } else {
          console.warn(`⚠️ Fallback timeout pour ${containerId} après ${maxRetries} tentatives`);
        }
      };
      
      // Démarrer le polling agressif après un délai initial
      setTimeout(aggressivePolling, 1000);
    });
  }, 2000); // Délai initial plus long pour la production
};

// Fonction pour forcer le rechargement des objets SVG
const forceSvgReload = () => {
  console.log('🔄 Rechargement forcé de tous les objets SVG...');
  
  const svgObjects = document.querySelectorAll('object[type="image/svg+xml"]');
  
  svgObjects.forEach((obj, index) => {
    const containerId = obj.getAttribute('data-container-id') || `svg-${index}`;
    
    // Vérifier si l'objet a des problèmes de chargement
    if (!obj.contentDocument) {
      console.log(`🔄 Rechargement de ${containerId}`);
      
      const originalData = obj.data;
      
      // Créer un nouvel objet SVG pour remplacer l'ancien
      const newObj = document.createElement('object');
      newObj.type = 'image/svg+xml';
      newObj.data = originalData;
      
      // Copier tous les attributs
      Array.from(obj.attributes).forEach(attr => {
        if (attr.name !== 'data') {
          newObj.setAttribute(attr.name, attr.value);
        }
      });
      
      // Ajouter un listener pour l'initialisation après rechargement
      newObj.addEventListener('load', () => {
        console.log(`✅ ${containerId} rechargé avec succès`);
        
        setTimeout(() => {
          const svgDoc = newObj.contentDocument;
          if (svgDoc) {
            const scripts = svgDoc.querySelectorAll('script');
            scripts.forEach(script => {
              if (script.textContent && script.textContent.includes('svgatorPlayer')) {
                try {
                  const svgWindow = svgDoc.defaultView || window;
                  const scriptFunction = new Function(script.textContent);
                  scriptFunction.call(svgWindow);
                  
                  console.log(`✅ Script Svgator réinitialisé pour ${containerId} après rechargement`);
                  
                  setTimeout(() => {
                    configureSvgatorRepeat(svgDoc, containerId);
                  }, 500);
                } catch (error) {
                  console.error(`❌ Erreur lors de la réinitialisation après rechargement:`, error);
                }
              }
            });
          }
        }, 200);
      }, { once: true });
      
      // Remplacer l'ancien objet par le nouveau
      obj.parentNode.replaceChild(newObj, obj);
    }
  });
};

// Fonction pour gérer les SVG externes avec fallback local
const handleExternalSvg = async (svgUrl, containerId) => {
  console.log(`🌐 Gestion SVG externe: ${svgUrl} pour ${containerId}`);
  
  // Vérifier si c'est un SVG externe
  const isExternal = svgUrl.startsWith('http') && !svgUrl.includes(window.location.hostname);
  
  if (!isExternal) {
    console.log(`✅ SVG local détecté: ${svgUrl}`);
    return svgUrl; // Retourner l'URL inchangée pour les SVG locaux
  }
  
  console.log(`🔍 SVG externe détecté: ${svgUrl}`);
  
  // Extraire le nom du fichier
  const fileName = svgUrl.split('/').pop();
  const localPath = `/svgs/${fileName}`;
  const localUrl = `${window.location.origin}${localPath}`;
  
  // Vérifier si le SVG existe déjà localement
  try {
    const response = await fetch(localUrl, { method: 'HEAD' });
    if (response.ok) {
      console.log(`✅ SVG trouvé localement: ${localUrl}`);
      return localPath; // Utiliser le chemin local
    }
  } catch (error) {
    console.log(`❌ SVG pas trouvé localement: ${localUrl}`);
  }
  
  // Si pas trouvé localement et en production, afficher un avertissement
  if (process.env.NODE_ENV === 'production') {
    console.warn(`⚠️ PROBLÈME CORS: SVG externe ${svgUrl} ne fonctionnera pas en production !`);
    console.warn(`💡 SOLUTION: Télécharger le fichier vers /public/svgs/${fileName}`);
    
    // Créer un message d'aide pour l'utilisateur
    if (typeof window !== 'undefined' && !window.externalSvgWarningShown) {
      window.externalSvgWarningShown = true;
      
      // Afficher un message console plus visible
      console.group('🚨 PROBLÈME DÉTECTÉ - SVG Externes');
      console.warn('Les animations SVG ne fonctionnent pas car elles sont hébergées sur un domaine externe.');
      console.info('SOLUTIONS:');
      console.info('1. Télécharger tous les SVG vers /public/svgs/');
      console.info('2. Configurer CORS sur le serveur externe');
      console.info('3. Utiliser un proxy/CDN');
      console.groupEnd();
    }
  }
  
  // Retourner l'URL externe (ne fonctionnera qu'en développement)
  return svgUrl;
};

// Fonction pour créer un objet SVG avec gestion des erreurs CORS
const createSvgObject = async (svgUrl, containerId, attributes = {}) => {
  console.log(`🔨 Création objet SVG pour ${containerId}`);
  
  // Gérer les SVG externes
  const finalUrl = await handleExternalSvg(svgUrl, containerId);
  
  // Créer l'objet SVG
  const svgObject = document.createElement('object');
  svgObject.type = 'image/svg+xml';
  svgObject.data = finalUrl;
  
  // Appliquer les attributs
  Object.entries(attributes).forEach(([key, value]) => {
    svgObject.setAttribute(key, value);
  });
  
  // Ajouter data-container-id
  svgObject.setAttribute('data-container-id', containerId);
  
  // Ajouter un gestionnaire d'erreur CORS
  svgObject.addEventListener('error', () => {
    console.error(`❌ Erreur de chargement SVG: ${finalUrl}`);
    
    if (finalUrl !== svgUrl) {
      console.log(`🔄 Tentative avec URL originale: ${svgUrl}`);
      // Essayer avec l'URL originale en dernier recours
      svgObject.data = svgUrl;
    }
  });
  
  // Ajouter un gestionnaire de succès
  svgObject.addEventListener('load', () => {
    console.log(`✅ SVG chargé avec succès: ${finalUrl}`);
    
    // Vérifier l'accès au contentDocument
    setTimeout(() => {
      if (svgObject.contentDocument) {
        console.log(`✅ ContentDocument accessible pour ${containerId}`);
      } else {
        console.warn(`⚠️ ContentDocument inaccessible pour ${containerId} - Problème CORS probable`);
        
        // Si en production, suggérer des solutions
        if (process.env.NODE_ENV === 'production') {
          console.warn(`💡 Pour résoudre: télécharger ${svgUrl.split('/').pop()} vers /public/svgs/`);
        }
      }
    }, 100);
  });
  
  return svgObject;
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
