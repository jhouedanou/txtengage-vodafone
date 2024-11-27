<template>
    <div class="slide-container">
        <div class="text-container">
            <h2 class="text-element" ref="title">Bienvenue chez Vodafone</h2>
            <p class="text-element" ref="paragraph1">Découvrez nos services innovants</p>
            <p class="text-element" ref="paragraph2">Une connexion plus rapide que jamais</p>
            <p class="text-element" ref="paragraph3">Pour tous vos besoins numériques</p>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
    isActive: {
        type: Boolean,
        default: false
    }
})

const title = ref(null)
const paragraph1 = ref(null)
const paragraph2 = ref(null)
const paragraph3 = ref(null)

let tl

const initAnimation = () => {
    const elements = [title.value, paragraph1.value, paragraph2.value, paragraph3.value]
    if (!elements.every(el => el)) return

    gsap.set(elements, {
        opacity: 0,
        y: 50
    })

    tl = gsap.timeline({ paused: true })

    elements.forEach((element, index) => {
        tl.to(element, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out"
        }, index * 0.2)
    })
}

onMounted(() => {
    initAnimation()
})

watch(() => props.isActive, (newValue) => {
    if (!tl) return
    if (newValue) {
        tl.restart()
    } else {
        tl.progress(0)
    }
});
</script>


<style scoped>
.slide-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(45deg, #e60000, #ff1a1a);
}

.text-container {
    color: white;
    text-align: center;
}

.text-element {
    margin: 20px 0;
    /* Supprimez les styles CSS qui interfèrent avec GSAP */
}

h2 {
    font-size: 3rem;
    font-weight: bold;
}

p {
    font-size: 1.5rem;
}
</style>