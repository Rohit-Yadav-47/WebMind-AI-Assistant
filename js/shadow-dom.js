/**
 * WebMind AI Assistant - Shadow DOM Utilities
 * Handles Shadow DOM creation and style injection
 */

const ShadowDOM = (() => {
  return {
    insertShadowContainer() {
      // Create a shadow DOM container to isolate our UI from the page's styles
      const shadowContainer = document.createElement('div');
      shadowContainer.id = 'ai-extension-container';
      shadowContainer.style.position = 'fixed';
      shadowContainer.style.top = '0';
      shadowContainer.style.left = '0';
      shadowContainer.style.width = '100%';
      shadowContainer.style.height = '100%';
      shadowContainer.style.zIndex = '2147483647'; // Max z-index
      shadowContainer.style.pointerEvents = 'none'; // Let events pass through by default
      
      document.body.appendChild(shadowContainer);
      
      // Create shadow DOM
      const shadowRoot = shadowContainer.attachShadow({ mode: 'open' });
      
      return shadowRoot;
    },
    
    injectStyles(shadow) {
      return new Promise((resolve) => {
        // Create a stylesheet
        const style = document.createElement('style');
        
        try {
          const cssURL = chrome.runtime.getURL('content.css');
          
          // Check if chrome.runtime is still valid
          if (chrome.runtime.id) {
            fetch(cssURL)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to load CSS: ${response.status}`);
                }
                return response.text();
              })
              .then(css => {
                // Ensure CSS variables are properly scoped to the shadow root
                const processedCss = css.replace(/:root/g, ':host');
                style.textContent = processedCss;
                
                // Append style to shadow DOM
                shadow.appendChild(style);
                
                console.log('CSS successfully injected into Shadow DOM');
                resolve(shadow);
              })
              .catch(error => {
                console.warn('Could not load external CSS, falling back to embedded CSS:', error);
                this.fallbackToEmbeddedCSS(style, shadow, resolve);
              });
          } else {
            // Runtime is invalid, use embedded CSS
            console.warn('Chrome runtime context invalid, using embedded CSS');
            this.fallbackToEmbeddedCSS(style, shadow, resolve);
          }
        } catch (err) {
          // Any error in chrome.runtime API calls will be caught here
          console.warn('Error accessing chrome.runtime, using embedded CSS:', err);
          this.fallbackToEmbeddedCSS(style, shadow, resolve);
        }
      });
    },
    
    fallbackToEmbeddedCSS(style, shadow, resolve) {
      style.textContent = this.getEmbeddedCSS();
      shadow.appendChild(style);
      resolve(shadow);
    },
    
    getEmbeddedCSS() {
      return `
        :host {
          --primary: #ffff00;
          --primary-glow: rgba(255, 255, 0, 0.853);
          --secondary: #ff00e5;
          --secondary-glow: rgba(255, 0, 229, 0.6);
          --background: rgba(15, 15, 20, var(--transparency, 0.85));
          --card-bg: rgba(25, 25, 35, 0.7);
          --text: #ffffff;
          --text-light: #a0a0b0;
          --border: rgba(255, 255, 0, 0.2);
          --shadow: rgba(0, 0, 0, 0.4);
          --neon-shadow: 0 0 10px var(--primary-glow), 0 0 20px rgba(255, 255, 0, 0.2);
          --toolbar-bg: rgba(20, 20, 30, 0.7);
          --accent: #ff9500;
          --accent-glow: rgba(255, 149, 0, 0.6);
          --voice: #ff3333;
          --voice-glow: rgba(255, 51, 51, 0.6);
        }
        
        /* Basic styles for searchbar container */
        #ai-search-bar-container {
          position: fixed;
          top: 10%;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          max-width: 95vw;
          z-index: 2147483647;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: auto;
        }
        
        /* Animation for entering/exiting */
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-40px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        
        #ai-search-bar-container.closing {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes slideUp {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to { opacity: 0; transform: translateX(-50%) translateY(-40px); }
        }
      `; // Minimal CSS for fallback - the full CSS is in content.css
    }
  };
})();
