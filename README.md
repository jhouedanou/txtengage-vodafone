Les modifications ont été apportées.

D'accord, j'ai créé les composants pour les slides 59, 128 et 60.

J'ai placé les fichiers `Slide59.vue`, `Slide128.vue` et `Slide60.vue` dans le dossier slides.

Chaque composant de slide :
- Accepte les `props` : `slide` (données de la diapositive), `animationStates` (pour suivre l'état des animations) et `isMobile`.
- Utilise GSAP pour animer ses éléments lorsque le composant est monté (`onMounted`).
- Met à jour `animationStates` pour indiquer quand ses animations sont terminées, ce qui peut être utilisé par `FullpageWrapper.vue` pour contrôler la navigation.
- A des styles `scoped` pour éviter les conflits.

**Prochaines étapes :**
1.  **Vérifier la structure des données** : Assurez-vous que les données passées à chaque composant (`props.slide`) correspondent à ce que le template attend (par exemple, `slide.title`, `slide.wp_content`, `slide.paragraphs`, `slide.image_url`). J'ai fait quelques suppositions basées sur les noms de classes et les ID de votre code précédent.
2.  **Ajuster les animations GSAP** : Les animations actuelles sont des exemples. Vous devrez les affiner pour qu'elles correspondent exactement aux animations de votre version originale avec ScrollTrigger. La logique de déclenchement sera différente ; au lieu de se baser sur la position de défilement, elles se déclencheront généralement lorsque la section devient active dans fullpage.js.
3.  **Logique de blocage dans `FullpageWrapper.vue`** : Revoyez la fonction `onLeave` dans `FullpageWrapper.vue` pour vous assurer que les conditions de blocage (basées sur `animationStates`) sont correctes pour chaque slide. Par exemple, pour la `Slide59`, vous pourriez vouloir bloquer la navigation tant que `animationStates['slide-59']` n'est pas égal à `1` (ou l'état final de votre animation séquentielle).
4.  **Tester** : Testez chaque slide individuellement et la navigation entre elles.

N'hésitez pas si vous avez d'autres questions ou si vous souhaitez que je génère le code pour d'autres composants de slide !