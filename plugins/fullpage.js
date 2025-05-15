import Vue from 'vue'
import 'fullpage.js/dist/fullpage.css'

export default async ({ app }) => {
  // Import fullpage.js uniquement côté client
  if (process.client) {
    const fullpage = await import('fullpage.js').then(m => m.default || m)
    
    // Créer un plugin global Vue pour fullpage
    Vue.prototype.$fullpage = fullpage
  }
}