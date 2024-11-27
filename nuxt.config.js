export default defineNuxtConfig({
  css: ['~/assets/scss/style.scss'],
//   vite: {
//     css: {
//       preprocessorOptions: {
//         scss: {
//           additionalData: '@use "@/assets/scss/style.scss" as *;'
//         }
//       }
//     }
//   },

  build: {
    transpile: ['gsap']
  },

  compatibilityDate: '2024-11-27'
})