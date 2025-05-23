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

// Nouveau système responsif qui commute automatiquement entre desktop et mobile
const {
  isMobile: isResponsiveMobile,
  isInitialized: animationsInitialized,
  currentAnimationSystem,
  initResponsiveAnimations,
  goToSection: goToResponsiveSection,
  getCurrentSectionIndex,
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

  // Hauteur de la piste moins hauteur du curseur
  const trackElement = scrollCursor.value.parentElement;
  const trackHeight =
    trackElement.offsetHeight - scrollCursor.value.offsetHeight;
  const topPosition = percentage * trackHeight;

  // Ajouter la classe d'animation
  scrollCursor.value.classList.add("animating");
  scrollCursor.value.style.top = `${topPosition}px`;

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
});
const formLoading = ref(false);
const showAlert = ref(false);
const alertType = ref("");
const alertMessage = ref("");

const submitForm = async () => {
  formLoading.value = true;
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
        activeSlideIndex.value = index;
        activeSlideId.value = slideId;
        updateBackground();
        // Supprimé : if (slideId === 73) { initSlide73AnimationGSAP(section); }
      },
      onEnterBack: () => {
        console.log(
          `Entering back section: ${section.id}, index: ${index}, slideId: ${slideId}`
        );
        activeSlideIndex.value = index;
        activeSlideId.value = slideId;
        updateBackground();
        // Supprimé : if (slideId === 73) { initSlide73AnimationGSAP(section); }
      },
      onLeave: () => {
        console.log(`Leaving section: ${section.id}`);
        // Supprimé : if (slideId === 73) { destroySlide73AnimationGSAP(section); }
      },
      onLeaveBack: () => {
        console.log(`Leaving back section: ${section.id}`);
        // Supprimé : if (slideId === 73) { destroySlide73AnimationGSAP(section); }
      },
    });

    sectionScrollTriggers.push(trigger);
  });

  if (sections.length > 0) {
    activeSlideIndex.value = 0;
    activeSlideId.value = parseInt(sections[0].dataset.slideId);
    updateBackground();
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
  // Potentiellement re-calculer des éléments si nécessaire
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

  // Écouter l'événement de navigation émis par la scrollbar custom
  document.addEventListener("navigateToSection", handleNavigateToSection);

  // Observer les changements de activeSlideIndex pour mettre à jour le fond
  // watch(activeSlideId, (newId, oldId) => {
  //   if (newId !== oldId) {
  //     updateBackground();
  //   }
  // });

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
    initResponsiveAnimations(sectionsArray, fullpageOptions);
  } else {
    console.warn("No sections found for fullpage scroll initialization.");
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
});

const isMenuOpen = ref(false);
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const goToSlide = (index) => {
  goToResponsiveSection(index); // Utiliser le nouveau système responsif
  isMenuOpen.value = false;
};

useHead({ title: "TXT Engage - Vodafone" });

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
    // Utiliser le système de navigation responsif
    if (animationsInitialized.value && goToResponsiveSection) {
      goToResponsiveSection(sectionIndex);
    } else {
      // Fallback à la navigation manuelle
      scrollToSection(sectionIndex);
    }
  }
};
</script>

<template>
  <div id="vodacomwrapper">
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
        <img src="/images/logovector.svg" alt="Logo" />
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
              <div class="row">
                <h3 id="mshill" v-html="slide.wp_content"></h3>
              </div>
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

                        <!-- Colonne de droite : toutes les images -->
                        <div
                          id="stone" class="image-column col-md-6"
                        >
                        <div id="sparta">
                          <div
                            v-for="(paragraph, idx) in slide.paragraphs"
                            :id="`image-container-${idx + 1}`"
                            :key="idx"
                            class="image-container"
                          >
                            <img
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
                        v-model="formData.company"
                        type="text"
                        class="form-control"
                        placeholder="Company Name"
                        required
                      />
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-12">
                      <input
                        v-model="formData.phone"
                        type="tel"
                        class="form-control"
                        placeholder="Contact Number"
                        required
                      />
                    </div>
                  </div>

                  <div class="row submit-row">
                    <div class="col-md-">
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
                class="d-flex align-items-center justify-content-center m-4"
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
  background: white;
  border-radius: 5px;
  transition: all 0.3s linear;
  position: relative;
  transform-origin: 1px;
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
  right: -100%;
  width: 300px;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: left 0.5s ease;
  padding-top: 60px;
  z-index: 9;
  display: flex;
}

#menu.is-open {
  right: 0;
}

#menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  text-align: center;
  width: 100%;
}

#menu ul li {
  margin: 15px 0;
  cursor: pointer;
  padding: 10px 20px;
}

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
  transition: top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
    right: 15px;
    height: 75dvh; // Légèrement plus petite sur tablette
    width: 3px;
  }

  .scrollbar-cursor {
    height: 30px; // Proportionnel à la taille desktop

    &::before {
      width: 1px;
      height: 12px; // Proportionnel
    }
  }
}

@media screen and (max-width: 768px) {
  .simple-scrollbar {
    right: 10px;
    height: 70dvh; // Plus petite sur mobile
    width: 3px;
  }

  .scrollbar-cursor {
    height: 25px; // Proportionnel

    &::before {
      height: 10px; // Proportionnel
    }
  }
}
</style>
