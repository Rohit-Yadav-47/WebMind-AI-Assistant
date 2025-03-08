/**
 * WebMind AI Assistant - Shadow DOM Fix Script
 * This script is injected directly into web pages to fix styling issues
 */

// Make sure we don't conflict with page variables
(function() {
  console.log('WebMind Shadow DOM fixer script loaded');
  
  // Create a global DOMFixer object if it doesn't exist
  if (!window.DOMFixer) {
    window.DOMFixer = {
      fixShadowDomStyles: function() {
        console.log('Applying Shadow DOM style fixes from injected script');
        try {
          const shadowContainer = document.getElementById('ai-extension-container');
          if (!shadowContainer || !shadowContainer.shadowRoot) {
            console.warn('Shadow container not found or no shadow root available');
            return false;
          }
    
          // Apply font rendering fixes
          const styleElement = document.createElement('style');
          styleElement.textContent = `
            * {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
          `;
          // Fix: Use shadowContainer.shadowRoot instead of undefined shadowRoot
          shadowContainer.shadowRoot.appendChild(styleElement);
          
          // Fix input focus
          const inputs = shadowContainer.shadowRoot.querySelectorAll('input, textarea');
          inputs.forEach(input => {
            input.addEventListener('focus', function() {
              this.style.outline = 'none';
            });
          });
          
          // Fix scroll behavior
          const scrollableElements = shadowContainer.shadowRoot.querySelectorAll('.ai-results, .ai-conversation-thread');
          scrollableElements.forEach(el => {
            el.style.scrollBehavior = 'smooth';
          });
          
          return true;
        } catch (err) {
          console.error('Error fixing Shadow DOM styles:', err);
          return false;
        }
      }
    };
  }
  
  // Signal that the script is ready
  document.dispatchEvent(new CustomEvent('webmind-domfixer-loaded'));
})();
