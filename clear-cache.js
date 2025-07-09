// Script to clear all caches and service workers
// Run this in your browser console

async function clearAllCaches() {
  console.log('Starting cache cleanup...');
  
  // 1. Unregister all service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      console.log('Unregistering service worker:', registration.scope);
      await registration.unregister();
    }
  }
  
  // 2. Clear all caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (let cacheName of cacheNames) {
      console.log('Deleting cache:', cacheName);
      await caches.delete(cacheName);
    }
  }
  
  // 3. Clear localStorage and sessionStorage
  if (typeof Storage !== "undefined") {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Cleared localStorage and sessionStorage');
  }
  
  // 4. Clear IndexedDB (if any)
  if ('indexedDB' in window) {
    indexedDB.databases().then(dbs => {
      dbs.forEach(db => {
        indexedDB.deleteDatabase(db.name);
        console.log('Deleted IndexedDB:', db.name);
      });
    });
  }
  
  console.log('✅ All caches cleared! Please refresh the page.');
}

// Run the cleanup
clearAllCaches(); 