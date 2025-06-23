// Script de test pour valider le comportement du hamburger sur slides 59, 73, 128
// Usage: Inclure ce script et appeler window.testHamburgerSlides.runAllTests()

(function() {
    'use strict';
    
    console.log('🧪 Test Hamburger Slides - Chargé');
    
    const SPECIAL_SLIDES = [59, 73, 128];
    const NORMAL_SLIDES = [20, 21, 22, 23, 60, 114]; // Exemples de slides normales
    
    // Fonction utilitaire pour attendre
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Fonction pour vérifier l'état du hamburger
    function checkHamburgerState() {
        const hamburger = document.querySelector('.hamburger');
        if (!hamburger) {
            return { error: 'Hamburger non trouvé' };
        }
        
        const hasRed = hamburger.classList.contains('hamburger-red');
        const hasWhite = hamburger.classList.contains('hamburger-white');
        const spans = hamburger.querySelectorAll('span');
        const spanColors = Array.from(spans).map(span => {
            const style = window.getComputedStyle(span);
            return style.backgroundColor;
        });
        
        return {
            hasRed,
            hasWhite,
            spanColors,
            classes: Array.from(hamburger.classList)
        };
    }
    
    // Fonction pour vérifier quelle slide est active
    function getActiveSlide() {
        const activeSections = document.querySelectorAll('.slide-section.active');
        if (activeSections.length === 0) {
            return { error: 'Aucune section active trouvée' };
        }
        
        const activeSection = activeSections[0];
        const slideId = parseInt(activeSection.dataset.slideId);
        
        return {
            slideId,
            sectionId: activeSection.id,
            totalActive: activeSections.length
        };
    }
    
    // Test 1: Vérifier l'état initial
    function testInitialState() {
        console.log('🧪 Test 1: État initial');
        
        const slideState = getActiveSlide();
        const hamburgerState = checkHamburgerState();
        
        console.log('Slide active:', slideState);
        console.log('État hamburger:', hamburgerState);
        
        if (slideState.error || hamburgerState.error) {
            console.error('❌ Test 1 échoué:', slideState.error || hamburgerState.error);
            return false;
        }
        
        const shouldBeRed = SPECIAL_SLIDES.includes(slideState.slideId);
        const isRed = hamburgerState.hasRed;
        
        if (shouldBeRed === isRed) {
            console.log('✅ Test 1 réussi: Hamburger dans le bon état');
            return true;
        } else {
            console.error(`❌ Test 1 échoué: Slide ${slideState.slideId} - Attendu: ${shouldBeRed ? 'rouge' : 'blanc'}, Trouvé: ${isRed ? 'rouge' : 'blanc'}`);
            return false;
        }
    }
    
    // Test 2: Navigation vers une slide spéciale
    async function testNavigationToSpecialSlide() {
        console.log('🧪 Test 2: Navigation vers slide spéciale');
        
        // Trouver une slide spéciale différente de la slide actuelle
        const currentSlide = getActiveSlide();
        const targetSlide = SPECIAL_SLIDES.find(id => id !== currentSlide.slideId);
        
        if (!targetSlide) {
            console.log('⏭️ Test 2 ignoré: Déjà sur toutes les slides spéciales');
            return true;
        }
        
        // Simuler la navigation (vous devrez adapter selon votre système de navigation)
        console.log(`📍 Navigation vers slide-${targetSlide}`);
        
        // Simuler le changement d'état comme le ferait ScrollTrigger
        const sections = document.querySelectorAll('.slide-section');
        sections.forEach(section => section.classList.remove('active'));
        
        const targetSection = document.querySelector(`#slide-${targetSlide}`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Attendre un peu pour les mises à jour asynchrones
            await wait(100);
            
            const hamburgerState = checkHamburgerState();
            
            if (hamburgerState.hasRed) {
                console.log('✅ Test 2 réussi: Hamburger rouge sur slide spéciale');
                return true;
            } else {
                console.error('❌ Test 2 échoué: Hamburger pas rouge sur slide spéciale');
                return false;
            }
        } else {
            console.error(`❌ Test 2 échoué: Slide-${targetSlide} non trouvée`);
            return false;
        }
    }
    
    // Test 3: Navigation vers une slide normale
    async function testNavigationToNormalSlide() {
        console.log('🧪 Test 3: Navigation vers slide normale');
        
        const targetSlide = NORMAL_SLIDES[0];
        
        // Simuler le changement d'état
        const sections = document.querySelectorAll('.slide-section');
        sections.forEach(section => section.classList.remove('active'));
        
        const targetSection = document.querySelector(`#slide-${targetSlide}`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            await wait(100);
            
            const hamburgerState = checkHamburgerState();
            
            if (hamburgerState.hasWhite) {
                console.log('✅ Test 3 réussi: Hamburger blanc sur slide normale');
                return true;
            } else {
                console.error('❌ Test 3 échoué: Hamburger pas blanc sur slide normale');
                return false;
            }
        } else {
            console.error(`❌ Test 3 échoué: Slide-${targetSlide} non trouvée`);
            return false;
        }
    }
    
    // Test 4: Vérifier toutes les slides spéciales
    async function testAllSpecialSlides() {
        console.log('🧪 Test 4: Vérification de toutes les slides spéciales');
        
        let allPassed = true;
        
        for (const slideId of SPECIAL_SLIDES) {
            const targetSection = document.querySelector(`#slide-${slideId}`);
            if (!targetSection) {
                console.warn(`⚠️ Slide-${slideId} non trouvée - ignorée`);
                continue;
            }
            
            // Simuler l'activation
            const sections = document.querySelectorAll('.slide-section');
            sections.forEach(section => section.classList.remove('active'));
            targetSection.classList.add('active');
            
            await wait(50);
            
            const hamburgerState = checkHamburgerState();
            
            if (hamburgerState.hasRed) {
                console.log(`✅ Slide-${slideId}: Hamburger rouge ✓`);
            } else {
                console.error(`❌ Slide-${slideId}: Hamburger pas rouge ✗`);
                allPassed = false;
            }
        }
        
        return allPassed;
    }
    
    // Fonction principale de test
    async function runAllTests() {
        console.log('🚀 Début des tests du hamburger');
        console.log('📋 Slides spéciales:', SPECIAL_SLIDES);
        
        const results = [];
        
        // Sauvegarder l'état initial
        const originalActiveSlide = getActiveSlide();
        
        try {
            results.push(await testInitialState());
            results.push(await testNavigationToSpecialSlide());
            results.push(await testNavigationToNormalSlide());
            results.push(await testAllSpecialSlides());
            
            const passed = results.filter(r => r).length;
            const total = results.length;
            
            console.log(`\n📊 Résultats: ${passed}/${total} tests réussis`);
            
            if (passed === total) {
                console.log('🎉 Tous les tests sont passés !');
            } else {
                console.log('⚠️ Certains tests ont échoué');
            }
            
        } finally {
            // Restaurer l'état initial
            if (originalActiveSlide.slideId) {
                const sections = document.querySelectorAll('.slide-section');
                sections.forEach(section => section.classList.remove('active'));
                
                const originalSection = document.querySelector(`#slide-${originalActiveSlide.slideId}`);
                if (originalSection) {
                    originalSection.classList.add('active');
                }
            }
        }
        
        return results;
    }
    
    // Exporter les fonctions de test
    window.testHamburgerSlides = {
        runAllTests,
        testInitialState,
        testNavigationToSpecialSlide,
        testNavigationToNormalSlide,
        testAllSpecialSlides,
        checkHamburgerState,
        getActiveSlide,
        SPECIAL_SLIDES,
        NORMAL_SLIDES
    };
    
    console.log('🔧 Tests disponibles: window.testHamburgerSlides.runAllTests()');
    
})(); 