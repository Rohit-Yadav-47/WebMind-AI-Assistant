/**
 * WebMind AI Assistant - UI Manager
 * Handles UI rendering, updates and interactions
 */

const UIManager = (() => {
  // Private variables
  let shadowRoot = null;
  let searchBarContainer = null;
  let currentTime = '';
  let currentModel = '';
  let clockInterval = null;
  
  // Public methods
  return {
    init() {
      // Initialize any UI-related setup
      if (!window.ShadowDomUtils) {
        this.loadShadowDomUtils();
      }
    },
    
    createSearchBar(initialQuery = '') {
      // Generate a unique ID for this chat session
      ConversationManager.generateNewChatId();
      
      // Get the current time for display
      currentTime = Utils.updateClock();
      
      // Create shadow DOM if it doesn't exist yet
      if (!shadowRoot) {
        shadowRoot = ShadowDOM.insertShadowContainer();
        ShadowDOM.injectStyles(shadowRoot).then(() => {
          this.renderSearchBar(initialQuery);
          // Apply fixes after rendering is complete
          setTimeout(() => {
            this.safelyApplyShadowDomFixes();
          }, 100);
        });
      } else {
        this.renderSearchBar(initialQuery);
      }
    },
    
    renderSearchBar(initialQuery = '') {
      // Create container in the shadow DOM
      searchBarContainer = document.createElement('div');
      searchBarContainer.id = 'ai-search-bar-container';
      
      // Add a safeguard to ensure the shadow root exists
      if (!shadowRoot) {
        console.error('Shadow root is null in renderSearchBar');
        shadowRoot = ShadowDOM.insertShadowContainer();
        if (!shadowRoot) {
          console.error('Failed to create shadow root container');
          return;
        }
      }
      
      shadowRoot.appendChild(searchBarContainer);
      
      // Get settings
      chrome.storage.sync.get(['transparency', 'aiModel'], (data) => {
        const transparency = data.transparency || 0.85;
        if (searchBarContainer) {
          searchBarContainer.style.setProperty('--transparency', transparency);
        }
        
        currentModel = data.aiModel || 'llama3-70b-8192';
        const modelName = this.getModelDisplayName(currentModel);
        
        // Render the UI components
        if (searchBarContainer) {
          this.renderUIComponents(initialQuery, modelName);
          
          // Setup event listeners
          this.setupEventListeners(initialQuery);
        } else {
          console.error('searchBarContainer became null before rendering components');
        }
      });
      
      // Setup outside click detection - bind to preserve context
      document.addEventListener('mousedown', this.handleOutsideClick.bind(this), true);
    },
    
    getModelDisplayName(modelId) {
      const modelNameMap = {
        'llama3-70b-8192': 'Llama 3 (70B)',
        'mixtral-8x7b-32768': 'Mixtral 8x7B',
        'gemma2-9b-it': 'Gemma 2 (9B)',
        'deepseek-r1-distill-llama-70b': 'DeepSeek (70B)'
      };
      
      return modelNameMap[modelId] || modelId;
    },
    
    renderUIComponents(initialQuery, modelName) {
      searchBarContainer.innerHTML = `
        <div class="ai-status-bar">
          <div class="ai-status-right">
            <span class="ai-clock">${currentTime}</span>
            <span class="ai-model-badge"><i class="ai-model-icon"></i>${modelName}</span>
          </div>
        </div>
        <div class="ai-search-bar">
          <div class="ai-search-icon">
            <svg viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
            </svg>
          </div>
          <input type="text" id="ai-search-input" placeholder="Ask me anything...">
          <div class="ai-voice-btn" id="ai-voice-btn">
            <svg viewBox="0 0 24 24" class="ai-mic-icon">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"></path>
            </svg>
            <div class="ai-voice-waves">
              <span></span><span></span><span></span><span></span>
            </div>
          </div>
          <div class="ai-loader"></div>
        </div>

        <div class="ai-keyboard-hint">
          <span class="ai-key">Ctrl+Q</span> to open | <span class="ai-key">Enter</span> to send | <span class="ai-key">Esc</span> to close | <span class="ai-key">🎤</span> for voice
        </div>
        <div class="ai-results" id="ai-results">
          <div class="ai-toolbar">
            <button class="ai-toolbar-btn" id="ai-extract-page">
              <svg viewBox="0 0 24 24">
                <path d="M19 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h4l3 3 3-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 16h-4.83l-.59.59L12 20.17l-1.59-1.59-.58-.58H5V4h14v14z"></path>
              </svg>
              Use Page Content
            </button>
            <div class="ai-context-divider"></div>
            <button class="ai-toolbar-btn" id="ai-conversation-mode">
              <svg viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"></path>
              </svg>
              Conversation Mode
            </button>
            <button class="ai-toolbar-btn" id="ai-clear-chat">
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path>
              </svg>
              Clear Chat
            </button>
          </div>
          <div id="ai-context-box" class="ai-context-box" style="display: none;">
            <div class="ai-context-box-header">
              <span>Using context from this page</span>
              <span class="ai-clear-context" id="ai-clear-context">Clear</span>
            </div>
            <div class="ai-context-content" id="ai-context-content"></div>
          </div>
          <div id="ai-conversation-thread" class="ai-conversation-thread" style="display: none;"></div>
          <div id="ai-result-container"></div>
          <div class="ai-history-toggle" id="ai-history-toggle">
            <svg class="ai-history-icon" viewBox="0 0 24 24">
              <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"></path>
            </svg>
            <span>Previous chats</span>
          </div>
          <div class="ai-previous-chats hidden" id="ai-previous-chats"></div>
        </div>
      `;
    },
    
    setupEventListeners(initialQuery) {
      // Apply Shadow DOM fixes
      this.safelyApplyShadowDomFixes();
      
      // First verify searchBarContainer exists
      if (!searchBarContainer) {
        console.error('Search bar container is null in setupEventListeners');
        return;
      }
      
      // Store a reference to searchBarContainer to use in the interval
      const container = searchBarContainer;
      
      // Update clock every second with proper error handling
      clockInterval = setInterval(() => {
        try {
          if (container && document.body.contains(container)) {
            const clockElement = container.querySelector('.ai-clock');
            if (clockElement) {
              clockElement.textContent = Utils.updateClock();
            }
          } else {
            // Container no longer exists in DOM, clear the interval
            console.log('Search bar container no longer in DOM, clearing clock interval');
            clearInterval(clockInterval);
          }
        } catch (err) {
          console.error('Error updating clock:', err);
          clearInterval(clockInterval);
        }
      }, 1000);
      
      try {
        const searchInput = searchBarContainer.querySelector('#ai-search-input');
        if (!searchInput) {
          console.error('Search input element not found');
          return;
        }
        
        if (initialQuery) {
          searchInput.value = initialQuery;
        }
        searchInput.focus();
        
        // Load previous chats
        ConversationManager.loadPreviousChats(searchBarContainer);
        
        // Safe method to add click event listener
        const safeAddClickListener = (selector, callback) => {
          const element = searchBarContainer.querySelector(selector);
          if (element) {
            element.addEventListener('click', callback);
          } else {
            console.error(`Element not found: ${selector}`);
          }
        };
        
        // Attach event listeners to toolbar buttons with error handling
        safeAddClickListener('#ai-extract-page', () => {
          TextProcessor.extractPageContent(searchBarContainer);
        });
        
        safeAddClickListener('#ai-conversation-mode', () => {
          ConversationManager.toggleConversationMode(searchBarContainer);
        });
        
        safeAddClickListener('#ai-clear-chat', () => {
          ConversationManager.clearCurrentChat(searchBarContainer);
        });
        
        safeAddClickListener('#ai-clear-context', () => {
          ConversationManager.clearPageContext(searchBarContainer);
        });
        
        // Fix: Directly handle Enter key for search input
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            console.log('Enter key pressed in search input');
            const query = searchInput.value.trim();
            if (query) {
              APIClient.processQuery(query, searchBarContainer);
              e.preventDefault();
              e.stopPropagation();
            }
          }
        });
        
        // Handle Escape key globally
        const handleEscapeKey = (e) => {
          if (e.key === 'Escape' && window.searchBarActive) {
            console.log('Escape key pressed');
            clearInterval(clockInterval);
            this.hideSearchBar();
            e.preventDefault();
            e.stopPropagation();
          }
        };
        
        // Add escape key listener to document
        document.addEventListener('keydown', handleEscapeKey);
        
        // Fix history toggle with proper error handling
        const historyToggle = searchBarContainer.querySelector('#ai-history-toggle');
        if (historyToggle) {
          historyToggle.addEventListener('click', () => {
            try {
              const previousChats = searchBarContainer.querySelector('#ai-previous-chats');
              if (previousChats) {
                previousChats.classList.toggle('hidden');
                if (!previousChats.classList.contains('hidden')) {
                  ConversationManager.displayPreviousChats(searchBarContainer);
                }
              } else {
                console.error('#ai-previous-chats element not found');
              }
            } catch (err) {
              console.error('Error toggling history:', err);
            }
          });
        } else {
          console.error('#ai-history-toggle element not found');
        }
        
        // Make the results container visible
        const resultsContainer = searchBarContainer.querySelector('#ai-results');
        if (resultsContainer) {
          resultsContainer.style.display = 'block';
        } else {
          console.error('#ai-results container not found');
        }
        
        // Process initial query if provided
        if (initialQuery) {
          APIClient.processQuery(initialQuery, searchBarContainer);
        }
        
        searchBarContainer.style.pointerEvents = 'auto';
        
        // Update inner searchBarContainer event handling
        searchBarContainer.addEventListener('click', function(e) {
          e.stopPropagation();
        });
        
        // Voice button
        const voiceBtn = searchBarContainer.querySelector('#ai-voice-btn');
        if (voiceBtn) {
          voiceBtn.addEventListener('click', () => {
            VoiceManager.toggleVoiceMode(searchBarContainer);
          });
        } else {
          console.error('#ai-voice-btn element not found');
        }
      } catch (err) {
        console.error('Error setting up event listeners:', err);
      }
    },
    
    safelyApplyShadowDomFixes() {
      try {
        if (window.ShadowDomUtils && typeof window.ShadowDomUtils.fixShadowDomStyles === 'function') {
          window.ShadowDomUtils.fixShadowDomStyles();
        } else {
          console.log('ShadowDomUtils.fixShadowDomStyles not available');
        }
      } catch (err) {
        console.error('Error applying shadow DOM fixes:', err);
      }
    },
    
    handleOutsideClick(e) {
      // Use window.searchBarActive instead of local variable
      if (!window.searchBarActive || !searchBarContainer) return;
      
      const shadowContainer = document.getElementById('ai-extension-container');
      if (!shadowContainer) return;
      
      const path = e.composedPath();
      if (path.includes(searchBarContainer)) {
        return; // Click was inside UI
      }
      
      // Use bound method call to preserve context
      this.hideSearchBar();
    },
    
    hideSearchBar() {
      if (searchBarContainer) {
        // Stop voice features
        VoiceManager.cleanup();
        
        searchBarContainer.classList.add('closing');
        document.removeEventListener('mousedown', this.handleOutsideClick, true);
        
        setTimeout(() => {
          if (searchBarContainer && searchBarContainer.parentNode) {
            searchBarContainer.parentNode.removeChild(searchBarContainer);
          }
          searchBarContainer = null;
          window.searchBarActive = false;
          ConversationManager.resetConversationMode();
          
          // Make shadow container pass-through for events
          const shadowContainer = document.getElementById('ai-extension-container');
          if (shadowContainer) {
            shadowContainer.style.pointerEvents = 'none';
          }
          
          // Restore original selection if there was one
          if (window.originalSelection) {
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(window.originalSelection);
            window.originalSelection = null;
          }
        }, 300);
      }
    },
    
    loadShadowDomUtils() {
      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          console.error('Extension context invalidated');
          return;
        }

        if (!window.ShadowDomUtils) {
          const script = document.createElement('script');
          script.src = chrome.runtime.getURL('fix-shadow-dom.js');
          script.onload = function() {
            console.log('Shadow DOM utilities loaded');
            if (shadowRoot && window.ShadowDomUtils && typeof window.ShadowDomUtils.fixShadowDomStyles === 'function') {
              window.ShadowDomUtils.fixShadowDomStyles();
            }
          };
          script.onerror = function(error) {
            console.error('Failed to load Shadow DOM utilities:', error);
          };
          document.head.appendChild(script);
        }
      } catch (err) {
        console.error('Error loading Shadow DOM utilities:', err);
      }
    }
  };
})();
