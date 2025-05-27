/**
 * Dark Mode Prevention Plugin for Samsung Android
 * Prevents Samsung Internet and Android Chrome from forcing text colors to black
 */

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (process.client) {
    // Device and browser detection
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isSamsungBrowser = /SamsungBrowser/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edg|OPR/i.test(navigator.userAgent);
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);

    // Dark mode prevention function
    const preventDarkModeForcing = () => {
      // Set global color scheme to light
      document.documentElement.style.setProperty('color-scheme', 'light', 'important');
      document.documentElement.style.setProperty('-webkit-color-scheme', 'light', 'important');
      document.documentElement.style.setProperty('forced-color-adjust', 'none', 'important');
      document.documentElement.style.setProperty('-webkit-forced-color-adjust', 'none', 'important');

      // Add data attributes for CSS targeting
      if (isAndroid) document.documentElement.setAttribute('data-android', 'true');
      if (isSamsungBrowser) document.documentElement.setAttribute('data-samsung-browser', 'true');
      if (isMobile) document.documentElement.setAttribute('data-mobile', 'true');

      // Create and inject specific CSS rules
      const styleId = 'dark-mode-prevention-styles';
      let existingStyle = document.getElementById(styleId);
      
      if (!existingStyle) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Global dark mode prevention */
          html, body {
            color-scheme: light !important;
            -webkit-color-scheme: light !important;
            forced-color-adjust: none !important;
            -webkit-forced-color-adjust: none !important;
          }

          /* Specific Samsung Browser overrides */
          [data-samsung-browser="true"] .split-container ul li {
            color: #e60000 !important;
            -webkit-text-fill-color: #e60000 !important;
            background-color: white !important;
            text-shadow: none !important;
            filter: none !important;
            -webkit-filter: none !important;
          }

          /* Android Chrome specific */
          [data-android="true"] .split-container ul li {
            color: #e60000 !important;
            -webkit-text-fill-color: #e60000 !important;
            -webkit-appearance: none !important;
          }

          /* Mobile device overrides */
          [data-mobile="true"] {
            /* Ensure Vodafone red is preserved */
            .split-container ul li,
            .vodafone-red,
            [class*="red"] {
              color: #e60000 !important;
              -webkit-text-fill-color: #e60000 !important;
            }

            /* Preserve white text */
            .text-element h3,
            .text-element p,
            .points-fort h3,
            .points-fort p {
              color: white !important;
              -webkit-text-fill-color: white !important;
            }
          }

          /* Force override any system dark mode */
          @media (prefers-color-scheme: dark) {
            .split-container ul li {
              color: #e60000 !important;
              -webkit-text-fill-color: #e60000 !important;
              background-color: white !important;
              filter: none !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    };

    // Monitor for color changes and reapply if needed
    const monitorColorChanges = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
            
            // Check if any .split-container ul li elements have been affected
            const listItems = document.querySelectorAll('.split-container ul li');
            listItems.forEach((item: Element) => {
              const computedStyle = window.getComputedStyle(item);
              const currentColor = computedStyle.getPropertyValue('color');
              
              // If color has been forced to black or very dark, reapply our styles
              if (currentColor === 'rgb(0, 0, 0)' || 
                  currentColor === 'black' || 
                  currentColor.includes('rgb(33, 33, 33)')) {
                
                console.warn('🚫 Dark mode forcing detected, reapplying Vodafone red');
                (item as HTMLElement).style.setProperty('color', '#e60000', 'important');
                (item as HTMLElement).style.setProperty('-webkit-text-fill-color', '#e60000', 'important');
              }
            });
          }
        });
      });

      // Start observing
      observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['style', 'class']
      });

      return observer;
    };

    // Initialize when DOM is ready
    const init = () => {
      preventDarkModeForcing();
      
      // Start monitoring only on Android devices
      if (isAndroid || isSamsungBrowser) {
        const observer = monitorColorChanges();
        
        // Log detection for debugging
        console.log('🛡️ Dark mode prevention active', {
          android: isAndroid,
          samsung: isSamsungBrowser,
          chrome: isChrome,
          mobile: isMobile
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
          observer.disconnect();
        });
      }

      // Reapply styles after any major DOM changes
      document.addEventListener('DOMContentLoaded', preventDarkModeForcing);
      window.addEventListener('load', preventDarkModeForcing);
      
      // Reapply on focus (when returning to the tab/app)
      window.addEventListener('focus', preventDarkModeForcing);
    };

    // Run immediately if DOM is already loaded, otherwise wait
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    // Expose global function for manual reapplication if needed
    (window as any).reapplyDarkModePrevention = preventDarkModeForcing;
  }
}); 