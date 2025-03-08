let searchBarActive = false;
let originalSelection = null;
let chatHistory = [];
let currentChatId = null;
let conversationContext = [];
let isConversationMode = false;
let currentTime = '';
let currentModel = '';
let shadowRoot = null;
let searchBarContainer = null;
let voiceMode = false;
let recognition = null;
let isSpeaking = false;
let speechSynthesis = window.speechSynthesis;

// Update clock every second
function updateClock() {
  const now = new Date();
  return now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Create search bar elements
function createSearchBar(initialQuery = '') {
  // Generate a unique ID for this chat session
  currentChatId = Date.now().toString();
  
  // Get the current time for display
  currentTime = updateClock();
  
  // Create shadow DOM if it doesn't exist yet
  if (!shadowRoot) {
    shadowRoot = window.ShadowUtils.insertShadowContainer();
    window.ShadowUtils.injectStyles(shadowRoot).then(() => {
      renderSearchBar(initialQuery);
      // Apply fixes after rendering is complete
      setTimeout(() => {
        if (window.ShadowDomUtils) {
          window.ShadowDomUtils.fixShadowDomStyles();
        }
      }, 100);
    });
  } else {
    renderSearchBar(initialQuery);
  }
}

// Render the actual search bar in the shadow DOM
function renderSearchBar(initialQuery = '') {
  // Create container in the shadow DOM
  searchBarContainer = document.createElement('div');
  searchBarContainer.id = 'ai-search-bar-container';
  shadowRoot.appendChild(searchBarContainer);
  
  // Get transparency and model settings
  chrome.storage.sync.get(['transparency', 'aiModel'], function(data) {
    const transparency = 0.85; // Use stored value or default to 0.85
    searchBarContainer.style.setProperty('--transparency', transparency);
    
    currentModel = data.aiModel || 'llama2-70b-4096';
    
    // Update model name display
    const modelNameMap = {
      'llama2-70b-4096': 'Llama 2 (70B)',
      'mixtral-8x7b-32768': 'Mixtral 8x7B',
      'gemma-7b-it': 'Gemma 7B',
      'claude-3-opus-20240229': 'Claude 3 Opus'
    };
    
    const modelName = modelNameMap[currentModel] || currentModel;
    
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
            <span></span>
            <span></span>
            <span></span>
            <span></span>
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
    
    // After rendering UI elements, apply Shadow DOM fixes immediately
    if (window.ShadowDomUtils) {
      setTimeout(() => {
        window.ShadowDomUtils.fixShadowDomStyles();
      }, 0);
    }
    
    // Update clock every second
    if (searchBarActive){ setInterval(() => {
      const clockElement = searchBarContainer.querySelector('.ai-clock');
      if (clockElement) {
        clockElement.textContent = updateClock();
      }
    }, 1000);}
    
    const searchInput = searchBarContainer.querySelector('#ai-search-input');
    if (initialQuery) {
      searchInput.value = initialQuery;
    }
    searchInput.focus();
    
    // Load previous chats
    loadPreviousChats();
    
    // Attach event listeners to toolbar buttons
    searchBarContainer.querySelector('#ai-extract-page').addEventListener('click', extractPageContent);
    searchBarContainer.querySelector('#ai-conversation-mode').addEventListener('click', toggleConversationMode);
    searchBarContainer.querySelector('#ai-clear-chat').addEventListener('click', clearCurrentChat);
    searchBarContainer.querySelector('#ai-clear-context').addEventListener('click', clearPageContext);
    
    // Handle search input events - FIX: Only listen on the input element
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        clearInterval(searchBarContainer.clockInterval);
        hideSearchBar();
        e.preventDefault(); // Prevent event from bubbling
        e.stopPropagation();
      } else if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          processAIQuery(query);
          e.preventDefault(); // Prevent event from bubbling
          e.stopPropagation();
        }
      } 
    });
    
    // Toggle history
    searchBarContainer.querySelector('#ai-history-toggle').addEventListener('click', function() {
      const previousChats = searchBarContainer.querySelector('#ai-previous-chats');
      previousChats.classList.toggle('hidden');
      if (!previousChats.classList.contains('hidden')) {
        displayPreviousChats();
      }
    });
    
    // Make the results container visible
    const resultsContainer = searchBarContainer.querySelector('#ai-results');
    resultsContainer.style.display = 'block';
    
    // Process initial query if provided
    if (initialQuery) {
      processAIQuery(initialQuery);
    }
    
    searchBarContainer.style.pointerEvents = 'auto';
    
    // Update inner searchBarContainer event handling
    searchBarContainer.addEventListener('click', function(e) {
      // This prevents clicks inside the container from bubbling up to the document
      e.stopPropagation();
    });
    
    // Add voice button event listener
    const voiceBtn = searchBarContainer.querySelector('#ai-voice-btn');
    voiceBtn.addEventListener('click', toggleVoiceMode);
  });
  
  document.addEventListener('mousedown', handleOutsideClick, true);
}

function hideSearchBar() {
  if (searchBarContainer) {
    // Stop speech and recognition before closing
    if (recognition) {
      recognition.stop();
    }
    speechSynthesis.cancel();
    isSpeaking = false;
    
    searchBarContainer.classList.add('closing');
    // Remove click listener to prevent issues
    document.removeEventListener('mousedown', handleOutsideClick, true);
    
    setTimeout(() => {
      if (searchBarContainer && searchBarContainer.parentNode) {
        searchBarContainer.parentNode.removeChild(searchBarContainer);
      }
      searchBarContainer = null;
      searchBarActive = false;
      isConversationMode = false;
      
      // Get the shadow container and make it fully pass-through for events
      const shadowContainer = document.getElementById('ai-extension-container');
      if (shadowContainer) {
        shadowContainer.style.pointerEvents = 'none';
      }
      
      // Restore original selection if there was one
      if (originalSelection) {
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(originalSelection);
        originalSelection = null;
      }
    }, 300);
  }
}

// Separate function for click handler to allow proper removal
function handleOutsideClick(e) {
  // If search bar is not active or doesn't exist, do nothing
  if (!searchBarActive || !searchBarContainer) return;

  // Check if the click was inside the search bar container
  const shadowContainer = document.getElementById('ai-extension-container');
  if (!shadowContainer) return;
  
  // Use composed path to check if the click was inside the shadow DOM
  const path = e.composedPath();
  if (path.includes(searchBarContainer)) {
    // Click was inside our UI, do nothing
    return;
  }
  
  // The click was outside, hide the search bar
  hideSearchBar();
}

function loadPreviousChats() {
  chrome.storage.local.get('chatHistory', function(data) {
    if (data.chatHistory && data.chatHistory.length > 0) {
      chatHistory = data.chatHistory;
      displayPreviousChats();
    } else {
      chatHistory = [];
    }
  });
}

function displayPreviousChats() {
  const container = searchBarContainer.querySelector('#ai-previous-chats');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Show only the last 5 chats
  const recentChats = [...chatHistory]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);
  
  if (recentChats.length === 0) {
    container.innerHTML = '<div class="ai-no-history">No previous conversations</div>';
    return;
  }
  
  recentChats.forEach(chat => {
    const chatItem = document.createElement('div');
    chatItem.className = 'ai-history-item';
    
    const date = new Date(chat.timestamp);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    chatItem.innerHTML = `
      <div class="ai-history-query">${chat.query}</div>
      <div class="ai-history-date">${formattedDate}</div>
    `;
    
    chatItem.addEventListener('click', function() {
      searchBarContainer.querySelector('#ai-search-input').value = chat.query;
      processAIQuery(chat.query);
      
      // Hide the previous chats panel
      searchBarContainer.querySelector('#ai-previous-chats').classList.add('hidden');
    });
    
    container.appendChild(chatItem);
  });
}

// Extract content from the current page
function extractPageContent() {
  const contextBox = searchBarContainer.querySelector('#ai-context-box');
  const contextContent = searchBarContainer.querySelector('#ai-context-content');
  
  // Extract page title and main content
  const title = document.title;
  let content = '';
  
  // Try multiple strategies to extract the main content
  // Strategy 1: Look for semantic elements
  const mainContent = document.querySelector('article') || document.querySelector('main') || document.querySelector('.content') || document.querySelector('#content');
  
  if (mainContent) {
    // If we found a main content container, use its text
    content = mainContent.innerText.trim();
  } else {
    // Strategy 2: Get all text-containing elements from the body
    const textElements = [];
    
    // Function to recursively collect text from the DOM
    function extractTextFromNode(node) {
      // Skip hidden elements and common non-content areas
      if (node.offsetParent === null || 
          node.style.display === 'none' || 
          node.style.visibility === 'hidden' ||
          node.tagName === 'SCRIPT' || 
          node.tagName === 'STYLE' ||
          node.tagName === 'NOSCRIPT' || 
          node.tagName === 'IFRAME' ||
          node.classList.contains('header') ||
          node.classList.contains('footer') ||
          node.classList.contains('nav') ||
          node.classList.contains('menu') ||
          node.id === 'header' ||
          node.id === 'footer' ||
          node.id === 'navigation') {
        return;
      }
      
      // If this is a text node with non-whitespace content, collect it
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text.length > 20) { // Only collect substantial text
          textElements.push(text);
        }
        return;
      }
      
      // Otherwise, recurse into child nodes
      if (node.childNodes) {
        node.childNodes.forEach(child => extractTextFromNode(child));
      }
    }
    
    // Start extraction from the body
    extractTextFromNode(document.body);
    
    // Combine all text
    content = textElements.join(' ');
    
    // If we still don't have enough content, fallback to all paragraphs and headings
    if (content.length < 200) {
      const paragraphs = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, div'))
        .filter(el => {
          const text = el.innerText.trim();
          return text.length > 10 && !el.closest('nav') && !el.closest('header') && !el.closest('footer');
        })
        .map(el => el.innerText.trim());
      
      content = paragraphs.join(' ');
    }
  }
  
  // Clean up the content
  content = content
    .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
    .replace(/\n+/g, ' ')  // Replace newlines with space
    .trim();
  
  // Limit content length (1500 characters is reasonable for context)
  const maxLength = 1500;
  content = content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  
  // Display extracted content in the context box
  contextContent.innerText = `"${title}": ${content}`;
  contextBox.style.display = 'block';
  
  // Store the context for use in queries
  const pageContext = {
    title: title,
    content: content,
    url: window.location.href
  };
  
  // Save to conversation context
  conversationContext = [pageContext];
  
  // Update search input with suggested query
  const searchInput = searchBarContainer.querySelector('#ai-search-input');
  if (!searchInput.value) {
    searchInput.value = `Summarize this page content`;
    searchInput.focus();
    searchInput.setSelectionRange(0, searchInput.value.length);
  }
  
  // Add visual feedback when extracting content
  const button = searchBarContainer.querySelector('#ai-extract-page');
  button.classList.add('active');
  
  setTimeout(() => {
    button.classList.remove('active');
  }, 1000);
}

// Toggle conversation mode between single Q&A and ongoing conversation
function toggleConversationMode() {
  const button = searchBarContainer.querySelector('#ai-conversation-mode');
  const thread = searchBarContainer.querySelector('#ai-conversation-thread');
  const resultContainer = searchBarContainer.querySelector('#ai-result-container');
  
  isConversationMode = !isConversationMode;
  
  if (isConversationMode) {
    // Switch to conversation mode
    button.style.background = 'rgba(255, 0, 229, 0.2)';
    thread.style.display = 'block';
    resultContainer.style.display = 'none';
    
    // Initialize with a welcome message if thread is empty
    if (!thread.innerHTML.trim()) {
      thread.innerHTML = `
        <div class="ai-message ai-assistant-message">
          <div class="ai-message-content">How can I help you today?</div>
          <div class="ai-message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
      `;
    }
  } else {
    // Switch back to single Q&A mode
    button.style.background = '';
    thread.style.display = 'none';
    resultContainer.style.display = 'block';
  }
}

// Clear the current chat
function clearCurrentChat() {
  const thread = searchBarContainer.querySelector('#ai-conversation-thread');
  const contextBox = searchBarContainer.querySelector('#ai-context-box');
  const resultContainer = searchBarContainer.querySelector('#ai-result-container');
  
  // Clear all content
  thread.innerHTML = '';
  contextBox.style.display = 'none';
  resultContainer.innerHTML = '';
  searchBarContainer.querySelector('#ai-search-input').value = '';
  
  // Reset state
  conversationContext = [];
  
  // If in conversation mode, add the welcome message back
  if (isConversationMode) {
    thread.innerHTML = `
      <div class="ai-message ai-assistant-message">
        <div class="ai-message-content">How can I help you today?</div>
        <div class="ai-message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
    `;
  }
}

// Clear the page context
function clearPageContext() {
  const contextBox = searchBarContainer.querySelector('#ai-context-box');
  contextBox.style.display = 'none';
  conversationContext = [];
}

function processAIQuery(query, useVoice = false) {
  const resultsContainer = searchBarContainer.querySelector('#ai-results');
  const resultContainer = searchBarContainer.querySelector('#ai-result-container');
  const conversationThread = searchBarContainer.querySelector('#ai-conversation-thread');
  const loader = searchBarContainer.querySelector('.ai-loader');
  
  // Show loader and ensure results container is visible
  loader.style.display = 'block';
  resultsContainer.style.display = 'block';
  
  // If in conversation mode, add user message to conversation thread
  if (isConversationMode) {
    const userMsgElement = document.createElement('div');
    userMsgElement.className = 'ai-message ai-user-message';
    userMsgElement.innerHTML = `
      <div class="ai-message-content">${query}</div>
      <div class="ai-message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    conversationThread.appendChild(userMsgElement);
    
    // Scroll to bottom
    conversationThread.scrollTop = conversationThread.scrollHeight;
  }
  
  // Get the API key and model from storage
  chrome.storage.sync.get(['groqApiKey', 'aiModel', 'customPrompt'], function(data) {
    if (!data.groqApiKey) {
      showError("Please set your Groq API key in the extension popup.");
      loader.style.display = 'none';
      return;
    }
    
    const apiKey = data.groqApiKey;
    const model = data.aiModel || 'llama3-70b-8192';
    let systemPrompt = data.customPrompt || "You are a helpful assistant. Give concise and informative answers.";
    
    // Add page context if available
    if (conversationContext.length > 0) {
      const pageInfo = conversationContext[0];
      systemPrompt += ` You have access to the following page content: Title: "${pageInfo.title}", Content: "${pageInfo.content}", URL: ${pageInfo.url}`;
    }
    
    // Prepare messages array for API request
    const messages = [
      { role: "system", content: systemPrompt },
    ];
    
    // If in conversation mode, include previous messages
    if (isConversationMode) {
      const messageElements = conversationThread.querySelectorAll('.ai-message');
      
      // Skip the initial greeting and the current user query
      const messagesToInclude = Array.from(messageElements).slice(1, -1);
      
      messagesToInclude.forEach(msgElem => {
        const content = msgElem.querySelector('.ai-message-content').innerText;
        const role = msgElem.classList.contains('ai-user-message') ? 'user' : 'assistant';
        messages.push({ role, content });
      });
    }
    
    // Add the current query
    messages.push({ role: "user", content: query });
    
    // Call Groq API
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      loader.style.display = 'none';
      
      if (data.choices && data.choices[0]) {
        const answer = data.choices[0].message.content;
        
        // Convert markdown to HTML
        const formattedAnswer = markdownToHtml(answer);
        
        // Store in chat history
        saveChatToHistory(query, answer);
        
        if (isConversationMode) {
          // Add assistant response to conversation thread
          const assistantMsgElement = document.createElement('div');
          assistantMsgElement.className = 'ai-message ai-assistant-message';
          assistantMsgElement.innerHTML = `
            <div class="ai-message-content">${formattedAnswer}</div>
            <div class="ai-message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          `;
          conversationThread.appendChild(assistantMsgElement);
          
          // Scroll to bottom
          conversationThread.scrollTop = conversationThread.scrollHeight;
          
          // Add copy buttons to code blocks
          addCopyButtonsToCodeBlocks(conversationThread.lastElementChild);
        } else {
          // Standard single response view
          resultContainer.innerHTML = `
            <div class="ai-result-item new">
              <div class="ai-query">${query}</div>
              <div class="ai-answer">${formattedAnswer}</div>
            </div>
          `;
          
          // Add copy buttons to code blocks
          addCopyButtonsToCodeBlocks(resultContainer);
        }
        
        // If query came from voice input, speak the response back
        if (useVoice && !isSpeaking) {
          speakResponse(answer);
        }
      } else {
        showError("Sorry, I couldn't process your request.");
      }
    })
    .catch(error => {
      loader.style.display = 'none';
      showError(`Error: ${error.message}`);
    });
  });
}

function saveChatToHistory(query, answer) {
  const chatItem = {
    id: currentChatId,
    query: query,
    answer: answer,
    timestamp: Date.now(),
    hasPageContext: conversationContext.length > 0
  };
  
  // Add to the chat history
  chrome.storage.local.get('chatHistory', function(data) {
    let history = data.chatHistory || [];
    
    // Add the new chat
    history.unshift(chatItem);
    
    // Keep only the last 20 chats
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    
    // Save updated history
    chrome.storage.local.set({ chatHistory: history });
    
    // Update local cache
    chatHistory = history;
  });
}

// Add copy buttons to code blocks
function addCopyButtonsToCodeBlocks(container) {
  const codeBlocks = container.querySelectorAll('pre code');
  
  codeBlocks.forEach(codeBlock => {
    const pre = codeBlock.parentNode;
    
    // Check if copy button already exists
    if (pre.querySelector('.ai-copy-btn')) return;
    
    // Create copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'ai-copy-btn';
    copyBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    
    // Set up copy functionality
    copyBtn.addEventListener('click', () => {
      const code = codeBlock.innerText;
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.classList.add('ai-copied');
        
        setTimeout(() => {
          copyBtn.classList.remove('ai-copied');
        }, 2000);
      });
    });
    
    // Add button to pre element
    pre.style.position = 'relative';
    pre.appendChild(copyBtn);
  });
}

// Enhanced markdown to HTML converter with better code formatting
function markdownToHtml(markdown) {
  // Handle code blocks with language specification
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  // First handle the code blocks to avoid conflicts
  let html = markdown.replace(codeBlockRegex, (match, lang, code) => {
    const languageClass = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${languageClass}>${escapeHtml(code)}</code></pre>`;
  });
  
  // Process tables - more robust version
  html = processMarkdownTables(html);
  
  // Handle basic formatting
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  
  return html;
}

// Process markdown tables
function processMarkdownTables(text) {
  if (!text.includes('|')) return text;
  
  const lines = text.split('\n');
  let result = [];
  let tableLines = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this could be a table row
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableLines = [];
      }
      tableLines.push(line);
    } 
    // Line with dashes and pipes is likely a table header separator
    else if (inTable && line.includes('|') && /^\|[\s-:|]+\|$/.test(line)) {
      tableLines.push(line);
    }
    // End of table
    else if (inTable) {
      // We've collected a complete table, now convert it
      const tableHtml = convertTableToHtml(tableLines);
      result.push(tableHtml);
      inTable = false;
      tableLines = [];
      
      // Don't forget to add the current line
      result.push(line);
    }
    // Not in a table
    else {
      result.push(line);
    }
  }
  
  // If we ended while still in a table
  if (inTable && tableLines.length > 0) {
    const tableHtml = convertTableToHtml(tableLines);
    result.push(tableHtml);
  }
  
  return result.join('\n');
}

// Convert table lines to HTML table
function convertTableToHtml(tableLines) {
  if (tableLines.length < 2) return tableLines.join('\n');
  
  let html = '<div class="table-container"><table class="ai-markdown-table">';
  let hasHeader = false;
  
  // Process each row
  tableLines.forEach((line, index) => {
    // Clean the line - remove outer pipes and trim each cell
    const cells = line
      .substring(1, line.length - 1)
      .split('|')
      .map(cell => cell.trim());
    
    // Check if this is a header separator row (contains only dashes, colons and spaces)
    if (/^[\s-:|]+$/.test(line.replace(/\|/g, ''))) {
      hasHeader = true;
      return; // Skip the separator row
    }
    
    // Start new row
    html += '<tr>';
    
    // Determine if this is a header row
    const cellType = (index === 0 && hasHeader) || (index === 0 && tableLines.length > 1 && 
                    /^[\s-:|]+$/.test(tableLines[1].replace(/\|/g, ''))) 
                    ? 'th' : 'td';
    
    // Add each cell
    cells.forEach(cell => {
      html += `<${cellType}>${cell}</${cellType}>`;
    });
    
    html += '</tr>';
  });
  
  html += '</table></div>';
  return html;
}

// Helper function to escape HTML characters in code blocks
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('keydown', function(e) {
  // Only trigger if not in an input field or textarea
  const target = e.target;
  const isInputOrTextarea = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable;
  
  if (e.ctrlKey && e.key === 'q' && !isInputOrTextarea) {
    e.preventDefault(); // Prevent default behavior
    
    // Save the current selection before showing search bar
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      originalSelection = selection.getRangeAt(0).cloneRange();
    }
    
    if (!searchBarActive) {
      searchBarActive = true;
      createSearchBar();
    }
  }
});

// Add context menu for explaining selected text
document.addEventListener('selectionchange', function() {
  const selection = window.getSelection();
  if (!selection.isCollapsed) {
    // User has selected some text
    document.addEventListener('contextmenu', handleContextMenu);
  } else {
    document.removeEventListener('contextmenu', handleContextMenu);
  }
});

function handleContextMenu(e) {
  const selection = window.getSelection().toString().trim();
  if (selection) {
    // Store selection for restoration later
    if (window.getSelection().rangeCount > 0) {
      originalSelection = window.getSelection().getRangeAt(0).cloneRange();
    }
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'explainSelection') {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      searchBarActive = true;
      createSearchBar(`Explain: "${selection}"`);
    }
    return true;
  }
});

// Initialize - prevent multiple instances of listeners
document.removeEventListener('DOMContentLoaded', initAISearchBar);
document.addEventListener('DOMContentLoaded', initAISearchBar);

function initAISearchBar() {
  console.log('AI Search Bar initialized with advanced features');
  
  // Add error handling for runtime context
  function loadShadowDomUtils() {
    try {
      // Check if chrome runtime is still valid
      if (!chrome.runtime || !chrome.runtime.id) {
        console.error('Extension context invalidated, cannot load shadow DOM utilities');
        return;
      }

      if (!window.ShadowDomUtils) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('fix-shadow-dom.js');
        script.onload = function() {
          console.log('Shadow DOM utilities loaded');
          // Run the fix immediately if ShadowRoot is already created
          if (shadowRoot && window.ShadowDomUtils) {
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

  // Load utilities with error handling
  loadShadowDomUtils();
}

// Add a periodic check for runtime validity
function setupRuntimeCheck() {
  // Check every 5 seconds if the extension context is still valid
  const checkInterval = setInterval(() => {
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        console.warn('Extension context invalidated, disabling interaction');
        clearInterval(checkInterval);
        
        // Clean up if necessary
        if (searchBarActive && searchBarContainer) {
          hideSearchBar();
        }
      }
    } catch (err) {
      console.warn('Runtime check failed, extension context may be invalid');
      clearInterval(checkInterval);
    }
  }, 5000);
}

// Call the setup function
setupRuntimeCheck();

// Toggle voice recognition on/off
function toggleVoiceMode() {
  if (!voiceMode) {
    startVoiceRecognition();
  } else {
    stopVoiceRecognition();
  }
}

// Initialize and start the voice recognition
function startVoiceRecognition() {
  const voiceBtn = searchBarContainer.querySelector('#ai-voice-btn');
  const searchInput = searchBarContainer.querySelector('#ai-search-input');
  
  // Check browser support
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showError("Voice recognition not supported in this browser");
    return;
  }
  
  // Initialize recognition
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  // Update UI
  voiceMode = true;
  voiceBtn.classList.add('listening');
  searchInput.placeholder = "Listening...";
  
  // Handle results
  recognition.onresult = function(event) {
    const transcript = Array.from(event.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('');
    
    searchInput.value = transcript;
  };
  
  // Handle end of speech
  recognition.onend = function() {
    const searchInput = searchBarContainer.querySelector('#ai-search-input');
    const query = searchInput.value.trim();
    
    voiceBtn.classList.remove('listening');
    searchInput.placeholder = "Ask me anything...";
    voiceMode = false;
    
    if (query) {
      processAIQuery(query, true); // true indicates this is from voice
    }
  };
  
  // Handle errors
  recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
    voiceBtn.classList.remove('listening');
    searchInput.placeholder = "Ask me anything...";
    voiceMode = false;
  };
  
  // Start listening
  recognition.start();
}

// Stop voice recognition
function stopVoiceRecognition() {
  if (recognition) {
    recognition.stop();
    voiceMode = false;
    
    const voiceBtn = searchBarContainer.querySelector('#ai-voice-btn');
    const searchInput = searchBarContainer.querySelector('#ai-search-input');
    
    voiceBtn.classList.remove('listening');
    searchInput.placeholder = "Ask me anything...";
  }
}

// Function to speak the AI response
function speakResponse(text) {
  // Stop any ongoing speech
  speechSynthesis.cancel();

  // Clean the text a bit for speech (remove markdown, etc)
  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/```[\s\S]*?```/g, 'Code block omitted for speech.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
  // Create parts of reasonable length to avoid speech cutoff
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
  const chunks = [];
  let currentChunk = '';
  
  sentences.forEach(sentence => {
    if (currentChunk.length + sentence.length < 200) {
      currentChunk += sentence;
    } else {
      chunks.push(currentChunk);
      currentChunk = sentence;
    }
  });
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  // Speak each chunk in sequence
  isSpeaking = true;
  
  // Add visual indicator
  const speakingIndicator = document.createElement('div');
  speakingIndicator.className = 'ai-speaking-indicator';
  speakingIndicator.innerHTML = '<div class="ai-speaking-wave"></div>';
  
  if (isConversationMode) {
    const lastMessage = searchBarContainer.querySelector('.ai-conversation-thread .ai-message:last-child .ai-message-content');
    if (lastMessage) lastMessage.appendChild(speakingIndicator);
  } else {
    const answer = searchBarContainer.querySelector('.ai-answer');
    if (answer) answer.appendChild(speakingIndicator);
  }
  
  // Speak sequentially
  let currentIndex = 0;
  
  function speakNext() {
    if (currentIndex >= chunks.length) {
      isSpeaking = false;
      if (speakingIndicator && speakingIndicator.parentNode) {
        speakingIndicator.parentNode.removeChild(speakingIndicator);
      }
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = function() {
      currentIndex++;
      speakNext();
    };
    
    speechSynthesis.speak(utterance);
  }
  
  speakNext();
}

// Add an error handling function if it doesn't exist
function showError(message) {
  const resultsContainer = searchBarContainer.querySelector('#ai-results');
  const resultContainer = searchBarContainer.querySelector('#ai-result-container');
  
  // Ensure the results container is visible
  resultsContainer.style.display = 'block';
  
  // Display error message
  resultContainer.innerHTML = `<div class="ai-error">${message}</div>`;
}
