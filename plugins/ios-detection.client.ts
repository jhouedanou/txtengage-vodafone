export default defineNuxtPlugin(() => {
  if (process.client) {
    const detectiOS = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Detect iOS devices
      const isiOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      
      // Detect specific iOS devices
      const isiPhone = /iPhone/.test(userAgent);
      const isiPad = /iPad/.test(userAgent);
      const isiPod = /iPod/.test(userAgent);
      
      // Detect iOS version
      let iOSVersion = '';
      if (isiOS) {
        const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (match) {
          iOSVersion = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
        }
      }
      
      // Detect Safari on iOS
      const isiOSSafari = isiOS && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
      
      // Detect viewport dimensions for iOS device types
      const isLargeScreen = window.screen.width >= 768 || window.screen.height >= 768;
      const isProbablyiPad = isiOS && isLargeScreen;
      
      return {
        isiOS,
        isiPhone,
        isiPad,
        isiPod,
        isiOSSafari,
        isProbablyiPad,
        iOSVersion,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio || 1
      };
    };
    
    const addDataAttributes = () => {
      const detection = detectiOS();
      const html = document.documentElement;
      
      // Add main iOS detection
      if (detection.isiOS) {
        html.setAttribute('data-ios', 'true');
        html.classList.add('is-ios');
        
        // Add iOS version
        if (detection.iOSVersion) {
          html.setAttribute('data-ios-version', detection.iOSVersion);
          html.setAttribute('data-ios-major', detection.iOSVersion.split('.')[0]);
        }
        
        // Add device type
        if (detection.isiPhone) {
          html.setAttribute('data-ios-device', 'iphone');
          html.classList.add('is-iphone');
        } else if (detection.isiPad || detection.isProbablyiPad) {
          html.setAttribute('data-ios-device', 'ipad');
          html.classList.add('is-ipad');
        } else if (detection.isiPod) {
          html.setAttribute('data-ios-device', 'ipod');
          html.classList.add('is-ipod');
        }
        
        // Add Safari detection
        if (detection.isiOSSafari) {
          html.setAttribute('data-ios-safari', 'true');
          html.classList.add('is-ios-safari');
        }
        
        // Add screen info
        html.setAttribute('data-screen-width', detection.screenWidth.toString());
        html.setAttribute('data-screen-height', detection.screenHeight.toString());
        html.setAttribute('data-pixel-ratio', detection.devicePixelRatio.toString());
        
        // Add orientation
        const updateOrientation = () => {
          const isPortrait = window.innerHeight > window.innerWidth;
          html.setAttribute('data-orientation', isPortrait ? 'portrait' : 'landscape');
          html.classList.toggle('is-portrait', isPortrait);
          html.classList.toggle('is-landscape', !isPortrait);
        };
        
        updateOrientation();
        window.addEventListener('orientationchange', () => {
          setTimeout(updateOrientation, 100); // Delay to get accurate dimensions
        });
        window.addEventListener('resize', updateOrientation);
        
      } else {
        html.setAttribute('data-ios', 'false');
        html.classList.add('is-not-ios');
      }
      
      // Add mobile detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      html.setAttribute('data-mobile', isMobile.toString());
      html.classList.toggle('is-mobile', isMobile);
      html.classList.toggle('is-desktop', !isMobile);
      
      console.log('iOS Detection Plugin:', detection);
    };
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addDataAttributes);
    } else {
      addDataAttributes();
    }
  }
}); 