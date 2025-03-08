/**
 * WebMind AI Assistant - Utilities
 * General helper functions used across the extension
 */

const Utils = (() => {
  return {
    updateClock() {
      const now = new Date();
      return now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    },
    
    showError(message, container) {
      const resultsContainer = container.querySelector('#ai-results');
      const resultContainer = container.querySelector('#ai-result-container');
      
      // Ensure the results container is visible
      resultsContainer.style.display = 'block';
      
      // Display error message
      resultContainer.innerHTML = `<div class="ai-error">${message}</div>`;
    },
    
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func(...args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },
    
    generateUUID() {
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    },
    
    sanitizeHTML(html) {
      const temp = document.createElement('div');
      temp.textContent = html;
      return temp.innerHTML;
    }
  };
})();
