/**
 * WebMind AI Assistant - Content Script Entry Point
 * Handles initialization and main event listeners
 */

// Global state
let originalSelection = null;

// We need to make these window-scoped so they're accessible across modules
window.searchBarActive = false;
window.originalSelection = null;

// Initialize immediately instead of waiting for DOMContentLoaded
function initWebMind() {
  console.log('WebMind AI Assistant initializing...');
  
  // Setup keyboard shortcuts - should run immediately
  setupKeyboardShortcuts();
  
  // Setup context menu selection handling
  setupSelectionHandling();
  
  // Setup message listener for background communication
  setupMessageListener();
  
  // Setup runtime validity checking
  setupRuntimeCheck();
  
  console.log('WebMind AI Assistant initialized');
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    console.log('Key pressed:', e.key, 'Ctrl key:', e.ctrlKey);
    
    const target = e.target;
    const isInputOrTextarea = target.tagName === 'INPUT' || 
                             target.tagName === 'TEXTAREA' || 
                             target.isContentEditable;
    
    if (e.ctrlKey && e.key === 'q' && !isInputOrTextarea) {
      console.log('Ctrl+Q shortcut detected');
      e.preventDefault();
      
      // Save current selection
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        window.originalSelection = selection.getRangeAt(0).cloneRange();
      }
      
      if (!window.searchBarActive) {
        console.log('Activating search bar...');
        window.searchBarActive = true;
        
        // Check if modules are loaded
        if (typeof UIManager !== 'undefined') {
          UIManager.createSearchBar();
        } else {
          // Fall back to the original monolithic function if modules aren't ready
          createSearchBar();
        }
      }
    }
  });
  
  console.log('Keyboard shortcut listener set up');
}

// Fall back to monolithic function if needed
function createSearchBar(initialQuery = '') {
  console.log('Creating search bar (fallback)...');
  // We'll use the original function from content.js if it exists
  if (typeof window.createSearchBar === 'function') {
    window.createSearchBar(initialQuery);
  } else {
    console.error('No search bar creation function found');
  }
}

// Setup text selection handling
function setupSelectionHandling() {
  let currentSelection = '';
  
  document.addEventListener('mouseup', function() {
    // Update selection on mouse up
    const selection = window.getSelection();
    currentSelection = selection.toString().trim();
    
    // Store for context menu use
    if (currentSelection && selection.rangeCount > 0) {
      window.originalSelection = selection.getRangeAt(0).cloneRange();
    }
  });

  // Listen for context menu events
  document.addEventListener('contextmenu', function(e) {
    if (currentSelection) {
      console.log('Context menu opened with text selected:', currentSelection.substring(0, 30) + '...');
    }
  });
}

// Handle messages from background script
function setupMessageListener() {
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Message received:', message.action);
    if (message.action === 'explainSelection') {
      const selection = message.selection || window.getSelection().toString().trim();
      console.log('Explaining selection:', selection.substring(0, 30) + '...');
      
      if (selection) {
        window.searchBarActive = true;
        if (typeof UIManager !== 'undefined') {
          UIManager.createSearchBar(`Explain: "${selection}"`);
        } else {
          createSearchBar(`Explain: "${selection}"`);
        }
      }
      return true;
    }
  });
}

// Runtime validity check
function setupRuntimeCheck() {
  const checkInterval = setInterval(() => {
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        console.warn('Extension context invalidated, disabling interaction');
        clearInterval(checkInterval);
        
        if (searchBarActive) {
          UIManager.hideSearchBar();
        }
      }
    } catch (err) {
      console.warn('Runtime check failed, extension context may be invalid');
      clearInterval(checkInterval);
    }
  }, 5000);
}

// Call init function immediately
console.log('WebMind AI Assistant script loaded');
initWebMind();
