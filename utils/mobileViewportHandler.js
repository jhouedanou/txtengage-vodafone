// Ajouter ces fonctions au début du fichier

// Fonction pour calculer la vraie hauteur viewport mobile
const calculateMobileViewportHeight = () => {
    // Calculer la vraie hauteur viewport en soustrayant les barres
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Appliquer aux slides
    const slideElements = document.querySelectorAll('.slide-section');
    slideElements.forEach(slide => {
      slide.style.height = `calc(var(--vh, 1vh) * 100)`;
    });
    
    const slidesContainers = document.querySelectorAll('.slides-container');
    slidesContainers.forEach(container => {
      container.style.height = `calc(var(--vh, 1vh) * 100)`;
    });
    
    const masterScrollContainer = document.querySelector('#master-scroll-container');
    if (masterScrollContainer) {
      masterScrollContainer.style.height = `calc(var(--vh, 1vh) * 100)`;
    }
    
    // Forcer la mise à jour de GSAP ScrollTrigger
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  };
  
  // Fonction pour gérer les événements de redimensionnement mobile
  const handleMobileResize = () => {
    if (window.innerWidth <= 1024) {
      calculateMobileViewportHeight();
    }
  };
  
  // Fonction pour détecter les changements de viewport mobile
  const setupMobileViewportDetection = () => {
    if (window.innerWidth <= 1024) {
      // Calculer initialement
      calculateMobileView