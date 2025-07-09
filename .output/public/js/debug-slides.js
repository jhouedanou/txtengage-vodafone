// Script de debug pour tester les fonctionnalités des slides actives
// et la gestion du hamburger rouge sur slide-59

console.log('🔧 Debug script loaded');

// Fonction pour vérifier l'état actuel
function checkCurrentState() {
    console.log('📊 État actuel:');
    
    // Vérifier quelle section a la classe active
    const activeSections = document.querySelectorAll('.slide-section.active');
    console.log(`📍 Sections actives: ${activeSections.length}`);
    
    activeSections.forEach((section, index) => {
        const slideId = section.dataset.slideId;
        console.log(`   ${index + 1}. Section: ${section.id}, Slide ID: ${slideId}`);
    });
    
    // Vérifier l'état du hamburger
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        const classes = Array.from(hamburger.classList);
        console.log(`🍔 Classes du hamburger: ${classes.join(', ')}`);
        
        if (hamburger.classList.contains('hamburger-red')) {
            console.log('🔴 Hamburger est ROUGE');
        } else if (hamburger.classList.contains('hamburger-white')) {
            console.log('⚪ Hamburger est BLANC');
        } else {
            console.log('❓ Couleur du hamburger indéterminée');
        }
    } else {
        console.log('❌ Hamburger non trouvé');
    }
    
    // Vérifier si slide-59 est actif
    const slide59 = document.querySelector('#slide-59');
    if (slide59) {
        const isActive = slide59.classList.contains('active');
        console.log(`🎯 Slide-59 est ${isActive ? 'ACTIF' : 'INACTIF'}`);
        
        if (isActive && hamburger && hamburger.classList.contains('hamburger-red')) {
            console.log('✅ Logique correcte: slide-59 actif + hamburger rouge');
        } else if (!isActive && hamburger && hamburger.classList.contains('hamburger-white')) {
            console.log('✅ Logique correcte: slide-59 inactif + hamburger blanc');
        } else if (isActive && hamburger && !hamburger.classList.contains('hamburger-red')) {
            console.log('❌ Problème: slide-59 actif mais hamburger pas rouge');
        }
    }
    
    console.log('─'.repeat(50));
}

// Fonction pour simuler la navigation vers slide-59
function goToSlide59() {
    console.log('🎯 Navigation vers slide-59...');
    const slide59 = document.querySelector('#slide-59');
    if (slide59) {
        slide59.scrollIntoView({ behavior: 'smooth' });
        setTimeout(checkCurrentState, 1000); // Vérifier après 1 seconde
    } else {
        console.log('❌ Slide-59 non trouvé');
    }
}

// Fonction pour forcer l'activation de slide-59
function forceActivateSlide59() {
    console.log('🔧 Activation forcée de slide-59...');
    
    // Supprimer active de toutes les sections
    document.querySelectorAll('.slide-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Ajouter active à slide-59
    const slide59 = document.querySelector('#slide-59');
    if (slide59) {
        slide59.classList.add('active');
        console.log('✅ Classe active ajoutée à slide-59');
        
        // Mettre à jour le hamburger
        const hamburger = document.querySelector('.hamburger');
        if (hamburger) {
            hamburger.classList.remove('hamburger-red', 'hamburger-white');
            hamburger.classList.add('hamburger-red');
            console.log('✅ Hamburger mis en rouge');
        }
        
        checkCurrentState();
    } else {
        console.log('❌ Slide-59 non trouvé');
    }
}

// Observer pour détecter les changements de classes
function setupObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('slide-section')) {
                    console.log(`🔄 Changement de classe détecté sur ${target.id}`);
                    if (target.classList.contains('active')) {
                        console.log(`   ✅ ${target.id} est maintenant ACTIF`);
                    } else {
                        console.log(`   ❌ ${target.id} n'est plus actif`);
                    }
                }
                
                if (target.classList.contains('hamburger')) {
                    console.log('🔄 Changement de classe détecté sur hamburger');
                    checkCurrentState();
                }
            }
        });
    });
    
    // Observer les sections
    document.querySelectorAll('.slide-section').forEach(section => {
        observer.observe(section, { attributes: true });
    });
    
    // Observer le hamburger
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        observer.observe(hamburger, { attributes: true });
    }
    
    console.log('👁️ Observer configuré');
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Debug script initialisé');
    setupObserver();
    
    // Vérification initiale après un délai
    setTimeout(checkCurrentState, 2000);
    
    // Exposer les fonctions globalement pour les tests manuels
    window.debugSlides = {
        checkCurrentState,
        goToSlide59,
        forceActivateSlide59,
        setupObserver
    };
    
    console.log('🛠️ Fonctions disponibles: window.debugSlides.*');
});

// Si le DOM est déjà chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkCurrentState);
} else {
    setTimeout(checkCurrentState, 1000);
} 