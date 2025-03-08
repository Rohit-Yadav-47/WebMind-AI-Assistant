// This utility script helps with Shadow DOM operations

function insertShadowContainer() {
  // Create a shadow DOM container to isolate our UI from the page's styles
  const shadowContainer = document.createElement('div');
  shadowContainer.id = 'ai-extension-container';
  shadowContainer.style.position = 'fixed';
  shadowContainer.style.top = '0';
  shadowContainer.style.left = '0';
  shadowContainer.style.width = '100%';
  shadowContainer.style.height = '100%';
  shadowContainer.style.zIndex = '2147483647'; // Max z-index
  shadowContainer.style.pointerEvents = 'none'; // Change to none to let events pass through by default
  
  document.body.appendChild(shadowContainer);
  
  // Create shadow DOM
  const shadowRoot = shadowContainer.attachShadow({ mode: 'open' });
  
  return shadowRoot;
}

function injectStyles(shadow) {
  return new Promise((resolve) => {
    // Create a stylesheet
    const style = document.createElement('style');
    
    // Use try-catch to handle any potential issues with chrome.runtime
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
            
            // Append style to shadow DOM first
            shadow.appendChild(style);
            
            console.log('CSS successfully injected into Shadow DOM');
            resolve(shadow);
          })
          .catch(error => {
            console.warn('Could not load external CSS, falling back to embedded CSS:', error);
            fallbackToEmbeddedCSS(style, shadow, resolve);
          });
      } else {
        // Runtime is invalid, use embedded CSS
        console.warn('Chrome runtime context invalid, using embedded CSS');
        fallbackToEmbeddedCSS(style, shadow, resolve);
      }
    } catch (err) {
      // Any error in chrome.runtime API calls will be caught here
      console.warn('Error accessing chrome.runtime, using embedded CSS:', err);
      fallbackToEmbeddedCSS(style, shadow, resolve);
    }
  });
}

// Separate function for the fallback to make the code cleaner
function fallbackToEmbeddedCSS(style, shadow, resolve) {
  style.textContent = getEmbeddedCSS();
  shadow.appendChild(style);
  resolve(shadow);
}

// Provide more complete embedded CSS as fallback
function getEmbeddedCSS() {
  return `
    :host {
      --primary: #00e5ff;
      --primary-glow: rgba(15, 249, 233, 0.853);
      --secondary: #ff00e5;
      --secondary-glow: rgba(255, 0, 229, 0.6);
      --background: rgba(15, 15, 20, var(--transparency, 0.85));
      --card-bg: rgba(25, 25, 35, 0.7);
      --text: #ffffff;
      --text-light: #a0a0b0;
      --border: rgba(0, 229, 255, 0.2);
      --shadow: rgba(0, 0, 0, 0.4);
      --neon-shadow: 0 0 10px var(--primary-glow), 0 0 20px rgba(0, 229, 255, 0.2);
      --toolbar-bg: rgba(20, 20, 30, 0.7);
      --accent: #ff9500;
      --accent-glow: rgba(255, 149, 0, 0.6);
    }
    
    #ai-search-bar-container {
      position: fixed;
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      width: 700px;
      max-width: 95vw;
      z-index: 2147483647;
      font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-40px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    
    #ai-search-bar-container.closing {
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    @keyframes slideUp {
      from {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      to {
        opacity: 0;
        transform: translateX(-50%) translateY(-40px);
      }
    }
    
    .ai-search-bar {
      background: var(--background);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 24px;
      box-shadow: 0 10px 30px var(--shadow), var(--neon-shadow);
      padding: 18px 20px;
      display: flex;
      align-items: center;
      border: 1px solid var(--border);
      position: relative;
      transition: all 0.3s ease;
    }
    
    #ai-search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 17px;
      color: var(--text);
      padding: 0;
      font-family: inherit;
      letter-spacing: 0.3px;
    }
    
    .ai-results {
      background: var(--background);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 0 0 24px 24px;
      margin-top: 2px;
      max-height: 550px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-top: none;
      display: none;
      box-shadow: 0 15px 40px var(--shadow), 0 0 15px rgba(0, 229, 255, 0.2);
      scrollbar-width: thin;
      scrollbar-color: var(--primary) transparent;
    }
    
    .ai-toolbar-btn {
      display: flex;
      align-items: center;
      background: rgba(0, 229, 255, 0.1);
      border: 1px solid var(--border);
      color: var(--primary);
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    
    .ai-toolbar {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      background: var(--toolbar-bg);
      border-bottom: 1px solid var(--border);
      gap: 10px;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      overflow-x: auto;
    }
    
    .ai-result-item {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(0, 229, 255, 0.1);
    }
    
    .ai-query {
      font-weight: 600;
      font-size: 15px;
      color: var(--primary);
      margin-bottom: 12px;
      text-shadow: 0 0 10px var(--primary-glow);
    }
    
    .ai-answer {
      font-size: 15px;
      line-height: 1.7;
      color: var(--text);
    }
    
    .ai-message {
      display: flex;
      margin-bottom: 16px;
    }
    
    .ai-user-message {
      justify-content: flex-end;
    }
    
    .ai-assistant-message {
      justify-content: flex-start;
    }
    
    .ai-message-content {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
      position: relative;
    }
    
    .ai-error {
      color: #ff4570;
      padding: 16px;
      font-size: 14px;
      text-shadow: 0 0 10px rgba(255, 69, 112, 0.4);
    }
    
    .ai-history-toggle {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      border-top: 1px solid rgba(0, 229, 255, 0.1);
      color: var(--primary);
      font-size: 14px;
      cursor: pointer;
    }
  `;
}

// Create main container for our app within the shadow DOM
function createMainContainer(shadow) {
  const container = document.createElement('div');
  container.id = 'ai-search-bar-container';
  shadow.appendChild(container);
  return container;
}

// Export the functions for use in content.js
window.ShadowUtils = {
  insertShadowContainer,
  injectStyles,
  createMainContainer
};
