/**
 * WebMind AI Assistant - DOM Fixer
 * Provides utilities for fixing Shadow DOM styling and interaction issues
 */

const DOMFixer = {
  /**
   * Fixes styles in Shadow DOM to ensure proper rendering
   */
  fixShadowDomStyles() {
    console.log('Applying Shadow DOM style fixes');
    try {
      const shadowContainer = document.getElementById('ai-extension-container');
      if (!shadowContainer || !shadowContainer.shadowRoot) {
        console.warn('Shadow container not found or no shadow root available');
        return false;
      }

      // Apply fixes for specific browsers
      this.fixFontRendering(shadowContainer.shadowRoot);
      this.fixInputFocus(shadowContainer.shadowRoot);
      this.fixScrollbehavior(shadowContainer.shadowRoot);
      
      return true;
    } catch (err) {
      console.error('Error fixing Shadow DOM styles:', err);
      return false;
    }
  },
  
  /**
   * Fix font rendering issues in Shadow DOM
   */
  fixFontRendering(shadowRoot) {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `;
    shadowRoot.appendChild(styleElement);
  },
  
  /**
   * Fix input focus behavior in Shadow DOM
   */
  fixInputFocus(shadowRoot) {
    const inputs = shadowRoot.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', function() {
        this.style.outline = 'none';
      });
    });
  },
  
  /**
   * Fix scroll behavior in Shadow DOM
   */
  fixScrollbehavior(shadowRoot) {
    const scrollableElements = shadowRoot.querySelectorAll('.ai-results, .ai-conversation-thread');
    scrollableElements.forEach(el => {
      el.style.scrollBehavior = 'smooth';
    });
  }
};

// Make available globally
window.DOMFixer = DOMFixer;
