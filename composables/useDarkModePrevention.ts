/**
 * Composable for Dark Mode Prevention Control
 * Provides utilities to test and debug the dark mode prevention system
 */

export const useDarkModePrevention = () => {
  // Check if we're on client side
  const isClient = process.client;

  // Device detection
  const detectDevice = () => {
    if (!isClient) return null;
    
    return {
      isAndroid: /Android/i.test(navigator.userAgent),
      isSamsungBrowser: /SamsungBrowser/i.test(navigator.userAgent),
      isChrome: /Chrome/i.test(navigator.userAgent) && !/Edg|OPR/i.test(navigator.userAgent),
      isMobile: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent),
      userAgent: navigator.userAgent
    };
  };

  // Test if dark mode forcing is active
  const testDarkModeForcing = () => {
    if (!isClient) return null;

    const testResults = {
      timestamp: new Date().toISOString(),
      device: detectDevice(),
      colorSchemeSupport: false,
      forcedColorAdjustSupport: false,
      currentColors: {} as Record<string, string>,
      issues: [] as string[]
    };

    // Test CSS property support
    if (CSS && CSS.supports) {
      testResults.colorSchemeSupport = CSS.supports('color-scheme', 'light');
      testResults.forcedColorAdjustSupport = CSS.supports('forced-color-adjust', 'none');
    }

    // Check current colors of critical elements
    const splitContainerItems = document.querySelectorAll('.split-container ul li');
    splitContainerItems.forEach((item, index) => {
      const computedStyle = window.getComputedStyle(item);
      const color = computedStyle.getPropertyValue('color');
      const backgroundColor = computedStyle.getPropertyValue('background-color');
      
      testResults.currentColors[`splitContainer_${index}`] = {
        color,
        backgroundColor,
        isVodafoneRed: color.includes('230, 0, 0') || color.includes('#e60000'),
        isProbablyForced: color === 'rgb(0, 0, 0)' || color === 'black'
      };

      // Detect issues
      if (color === 'rgb(0, 0, 0)' || color === 'black') {
        testResults.issues.push(`Element ${index}: Color forced to black`);
      }
      if (!color.includes('230, 0, 0') && !color.includes('#e60000')) {
        testResults.issues.push(`Element ${index}: Not Vodafone red (${color})`);
      }
    });

    return testResults;
  };

  // Force reapply dark mode prevention
  const forceReapply = () => {
    if (!isClient) return false;

    try {
      // Call the global function if it exists
      if ((window as any).reapplyDarkModePrevention) {
        (window as any).reapplyDarkModePrevention();
        return true;
      }

      // Fallback manual reapplication
      document.documentElement.style.setProperty('color-scheme', 'light', 'important');
      document.documentElement.style.setProperty('forced-color-adjust', 'none', 'important');
      
      const splitContainerItems = document.querySelectorAll('.split-container ul li');
      splitContainerItems.forEach((item) => {
        (item as HTMLElement).style.setProperty('color', '#e60000', 'important');
        (item as HTMLElement).style.setProperty('-webkit-text-fill-color', '#e60000', 'important');
      });

      return true;
    } catch (error) {
      console.error('Failed to reapply dark mode prevention:', error);
      return false;
    }
  };

  // Get detailed color report
  const getColorReport = () => {
    if (!isClient) return null;

    const report = {
      htmlColorScheme: getComputedStyle(document.documentElement).getPropertyValue('color-scheme'),
      bodyColorScheme: getComputedStyle(document.body).getPropertyValue('color-scheme'),
      systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      elements: {} as Record<string, any>
    };

    // Check all Vodafone red elements
    const redElements = document.querySelectorAll('.split-container ul li, .vodafone-red, [class*="red"]');
    redElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      report.elements[`element_${index}`] = {
        tagName: element.tagName,
        className: element.className,
        color: computedStyle.getPropertyValue('color'),
        webkitTextFillColor: computedStyle.getPropertyValue('-webkit-text-fill-color'),
        backgroundColor: computedStyle.getPropertyValue('background-color'),
        visibility: computedStyle.getPropertyValue('visibility'),
        display: computedStyle.getPropertyValue('display'),
        isVisible: rect.width > 0 && rect.height > 0,
        position: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      };
    });

    return report;
  };

  // Enable debug mode (adds visible borders to problematic elements)
  const enableDebugMode = () => {
    if (!isClient) return false;

    const debugStyle = document.createElement('style');
    debugStyle.id = 'dark-mode-debug';
    debugStyle.textContent = `
      .split-container ul li {
        border: 2px solid lime !important;
        background: rgba(255, 255, 0, 0.3) !important;
        padding: 5px !important;
        position: relative !important;
      }
      
      .split-container ul li::after {
        content: "Color: " attr(data-current-color);
        position: absolute;
        top: -20px;
        left: 0;
        font-size: 10px;
        background: black;
        color: white;
        padding: 2px;
        border-radius: 2px;
        white-space: nowrap;
        z-index: 10000;
      }
    `;
    document.head.appendChild(debugStyle);

    // Add current color as data attribute
    const splitContainerItems = document.querySelectorAll('.split-container ul li');
    splitContainerItems.forEach((item) => {
      const color = window.getComputedStyle(item).getPropertyValue('color');
      item.setAttribute('data-current-color', color);
    });

    return true;
  };

  // Disable debug mode
  const disableDebugMode = () => {
    if (!isClient) return false;

    const debugStyle = document.getElementById('dark-mode-debug');
    if (debugStyle) {
      debugStyle.remove();
    }

    // Remove debug attributes
    const splitContainerItems = document.querySelectorAll('.split-container ul li');
    splitContainerItems.forEach((item) => {
      item.removeAttribute('data-current-color');
    });

    return true;
  };

  // Export reactive state
  const device = ref(detectDevice());
  const isDebugMode = ref(false);

  // Watch for debug mode changes
  watch(isDebugMode, (newValue) => {
    if (newValue) {
      enableDebugMode();
    } else {
      disableDebugMode();
    }
  });

  return {
    device: readonly(device),
    isDebugMode,
    detectDevice,
    testDarkModeForcing,
    forceReapply,
    getColorReport,
    enableDebugMode,
    disableDebugMode
  };
}; 