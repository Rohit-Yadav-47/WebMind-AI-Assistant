// This script helps diagnose and fix Shadow DOM style issues

// Function to check if styles are properly loaded
function checkShadowDomStyles() {
  const shadowContainer = document.getElementById('ai-extension-container');
  if (!shadowContainer) {
    console.error('Shadow DOM container not found');
    return;
  }
  
  const shadowRoot = shadowContainer.shadowRoot;
  if (!shadowRoot) {
    console.error('Shadow root not attached');
    return;
  }
  
  const styles = shadowRoot.querySelectorAll('style');
  console.log(`Found ${styles.length} style elements in Shadow DOM`);
  
  styles.forEach((style, index) => {
    console.log(`Style ${index + 1} content length:`, style.textContent.length);
  });
  
  // Check if key elements exist and have styles
  const searchBar = shadowRoot.querySelector('#ai-search-bar-container');
  if (searchBar) {
    console.log('Search bar container found, computed styles:', getComputedStyles(searchBar));
  } else {
    console.error('Search bar container not found in Shadow DOM');
  }
}

// Helper to get relevant computed styles
function getComputedStyles(element) {
  if (!element) return 'Element not found';
  
  const computedStyle = getComputedStyle(element);
  return {
    position: computedStyle.position,
    top: computedStyle.top,
    left: computedStyle.left,
    width: computedStyle.width,
    zIndex: computedStyle.zIndex,
    background: computedStyle.background
  };
}

// Function to fix common Shadow DOM style issues
function fixShadowDomStyles() {
  const shadowContainer = document.getElementById('ai-extension-container');
  if (!shadowContainer || !shadowContainer.shadowRoot) {
    console.error('Shadow DOM not found');
    return;
  }
  
  const shadowRoot = shadowContainer.shadowRoot;
  
  // Set container to not capture events by default
  shadowContainer.style.pointerEvents = 'none';
  
  // Ensure main container has pointer-events auto
  const searchBar = shadowRoot.querySelector('#ai-search-bar-container');
  if (searchBar) {
    searchBar.style.pointerEvents = 'auto';
    
    // Fix pointerEvents for all interactive elements
    const interactiveSelectors = [
      '.ai-search-bar', 
      '.ai-toolbar-btn', 
      '.ai-clear-context', 
      '.ai-history-toggle',
      '.ai-previous-chats',
      '.ai-history-item',
      'button',
      'input',
      '.ai-results',
      '.ai-copy-btn',
      '.ai-conversation-thread',
      '#ai-search-input',
      '.ai-toolbar',
      '.ai-context-box',
      '.ai-previous-chats'
    ];
    
    interactiveSelectors.forEach(selector => {
      const elements = shadowRoot.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.pointerEvents = 'auto';
      });
    });
  }
  
  // Fix scrolling in results container
  const results = shadowRoot.querySelector('.ai-results');
  if (results) {
    results.style.maxHeight = '550px';
    results.style.overflow = 'auto';
    results.style.display = 'block';
    results.style.pointerEvents = 'auto';
  }
  
  console.log('Applied event handling fixes to Shadow DOM elements');
}

// Export utilities for use in content script
window.ShadowDomUtils = {
  checkShadowDomStyles,
  fixShadowDomStyles
};
