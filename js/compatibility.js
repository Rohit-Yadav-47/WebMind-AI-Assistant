/**
 * WebMind AI Assistant - Compatibility Layer
 * This script ensures backwards compatibility during the migration to modules
 */

console.log('WebMind AI Assistant compatibility layer loading...');

// Map old global utilities to new modules - with safety checks
window.ShadowUtils = window.ShadowUtils || (typeof ShadowDOM !== 'undefined' ? ShadowDOM : {});
window.ShadowDomUtils = window.ShadowDomUtils || (typeof DOMFixer !== 'undefined' ? DOMFixer : {});

// Add missing methods to ShadowDomUtils if they don't exist
if (window.ShadowDomUtils && typeof window.ShadowDomUtils.fixShadowDomStyles !== 'function') {
  window.ShadowDomUtils.fixShadowDomStyles = function() {
    console.log('Default fixShadowDomStyles implementation called');
    // Default implementation that does nothing but prevents errors
    return true;
  };
}

// For the Ctrl+Q shortcut
if (typeof window.createSearchBar === 'undefined' && typeof UIManager !== 'undefined') {
  window.createSearchBar = function(initialQuery) {
    UIManager.createSearchBar(initialQuery);
  };
}

// Make sure we have access to any needed global variables
if (typeof window.searchBarActive === 'undefined') {
  window.searchBarActive = false;
}

// Add a global listener for Ctrl+Q as a backup
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === 'q') {
    console.log('Backup Ctrl+Q listener triggered');
    
    // Prevent default browser behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're in an input element
    const target = e.target;
    const isInputOrTextarea = target.tagName === 'INPUT' || 
                              target.tagName === 'TEXTAREA' || 
                              target.isContentEditable;
    
    // Don't trigger in input fields
    if (isInputOrTextarea) return;
    
    // Only activate if not already active
    if (!window.searchBarActive) {
      window.searchBarActive = true;
      
      try {
        if (typeof UIManager !== 'undefined' && typeof UIManager.createSearchBar === 'function') {
          UIManager.createSearchBar();
        } else if (typeof window.createSearchBar === 'function') {
          window.createSearchBar();
        } else {
          console.error('No search bar creation function found');
        }
      } catch (err) {
        console.error('Error creating search bar:', err);
      }
    }
  }
});

console.log('WebMind AI Assistant compatibility layer loaded');
