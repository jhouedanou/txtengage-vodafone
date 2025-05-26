# 🎯 Debouncing Sélectif macOS - Animations vs Navigation

## 🎯 **Nouvelle Approche - Debouncing à Deux Vitesses**

Le système de debouncing a été amélioré pour être **sélectif avec deux vitesses** :
- **Debouncing normal (120ms)** : Pour les animations principales
- **Debouncing rapide (80ms)** : Pour le défilement interne des slides 23 et 128
- **Sans debouncing** : Pour la navigation entre slides

## 🔧 **Fonctionnement**

### **📱 Avec Debouncing Normal (120ms)**
- **Slide-20** : Animation text-element-5 pas encore affichée  

### **⚡ Avec Debouncing Rapide (80ms)**
- **Slide-73** : Animation points-fort pas encore lancée
- **Slide-23** : Défilement interne des perdrix-slides
- **Slide-128** : Défilement interne des case-study-content

### **🚀 Sans Debouncing (Immédiat)**
- **Navigation normale** : Passage d'une slide à l'autre
- **Slides sans animation** : Toutes les autres slides
- **Animations terminées** : Quand toutes les animations sont complètes

## 🧪 **Comment Tester**

### **1. En Console**
```javascript
// Tester si une action aura un debouncing et quel type
debugDesktopAnimations.testDebouncing(100)  // Scroll down
debugDesktopAnimations.testDebouncing(-100) // Scroll up

// Voir les délais configurés
debugDesktopAnimations.debounceDelays()
// Retourne: { normal: "120ms", internal: "80ms", threshold: "30ms" }

// Voir l'état actuel
debugDesktopAnimations.shouldApplyDebouncing(100)
```

### **2. Logs Console**
- `✅ Exécution du scroll macOS avec debouncing { debounceType: 'normal', delay: '120ms' }`
- `✅ Exécution du scroll macOS avec debouncing { debounceType: 'internal', delay: '80ms' }`
- `✅ Navigation normale macOS (sans debouncing)`
- `🚫 Scroll double détecté et ignoré { debounceType: 'internal' }`

## 📊 **Exemple Concret**

### **Slide-73 (Points-Fort)**
```
1er scroll trackpad → Animation points-fort (AVEC debouncing 80ms)
2ème scroll trackpad → Navigation slide suivante (SANS debouncing)
```

### **Slide-23 (Perdrix)**
```
1er scroll trackpad → Perdrix slide 1→2 (AVEC debouncing 80ms)
2ème scroll trackpad → Perdrix slide 2→3 (AVEC debouncing 80ms)
...
Dernier scroll → Navigation slide suivante (SANS debouncing)
```

### **Slide-128 (Case Studies)**
```
1er scroll trackpad → Case study 1→2 (AVEC debouncing 80ms)
2ème scroll trackpad → Case study 2→3 (AVEC debouncing 80ms)
...
Dernier scroll → Navigation slide suivante (SANS debouncing)
```

### **Slide Normale**
```
1er scroll trackpad → Navigation slide suivante (SANS debouncing)
```

## 🔍 **Avantages du Système à Deux Vitesses**

1. **Animations principales protégées** : Plus de doubles déclenchements (120ms)
2. **Défilement interne fluide** : Réactivité améliorée pour slides 23/128 (80ms)
3. **Navigation ultra-rapide** : Pas de délai sur le changement de slide
4. **Intelligent** : S'adapte au contexte automatiquement
5. **Transparent** : Fonctionne seulement sur macOS

## ⚙️ **Configuration**

### **Constantes**
```javascript
MACOS_SCROLL_DEBOUNCE_DELAY = 120ms          // Délai pour animations principales
MACOS_SCROLL_DEBOUNCE_DELAY_INTERNAL = 80ms  // Délai pour défilement interne
MACOS_SCROLL_THRESHOLD = 30ms                // Seuil détection double
```

### **Types de Debouncing**
- `'normal'` : 120ms pour animations principales
- `'internal'` : 80ms pour défilement interne slides 23/128
- `false` : Pas de debouncing, navigation immédiate

### **Slides Concernées**
- `slide-73` : Animation points-fort (**internal** 80ms)
- `slide-20` : Animation text-element-5 (**normal** 120ms)
- `slide-23` : Défilement perdrix (**internal** 80ms)
- `slide-128` : Défilement case-study (**internal** 80ms)

## 🚀 **Résultat Final**

**Navigation entre slides** : Toujours fluide et rapide ⚡
**Animations principales** : Protégées contre les doubles (120ms) 🛡️
**Défilement interne** : Réactif et fluide (80ms) ⚡
**Experience utilisateur** : Optimale sur macOS 🍎 