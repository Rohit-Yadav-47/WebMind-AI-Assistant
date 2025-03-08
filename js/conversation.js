/**
 * WebMind AI Assistant - Conversation Manager
 * Handles conversation state, history, and context
 */

const ConversationManager = (() => {
  // Private variables
  let currentChatId = null;
  let chatHistory = [];
  let conversationContext = [];
  let isConversationMode = false;
  
  // Public methods
  return {
    init() {
      // Load chat history from storage
      chrome.storage.local.get('chatHistory', function(data) {
        chatHistory = data.chatHistory || [];
      });
    },
    
    generateNewChatId() {
      currentChatId = Date.now().toString();
      return currentChatId;
    },
    
    isConversationModeActive() {
      return isConversationMode;
    },
    
    resetConversationMode() {
      isConversationMode = false;
    },
    
    getPageContext() {
      return conversationContext.length > 0 ? conversationContext[0] : null;
    },
    
    loadPreviousChats(container) {
      chrome.storage.local.get('chatHistory', function(data) {
        if (data.chatHistory && data.chatHistory.length > 0) {
          chatHistory = data.chatHistory;
          // Don't display chats automatically - only when user clicks history toggle
        } else {
          chatHistory = [];
        }
      });
    },
    
    displayPreviousChats(container) {
      const previousChatsContainer = container.querySelector('#ai-previous-chats');
      if (!previousChatsContainer) return;
      
      previousChatsContainer.innerHTML = '';
      
      // Show only the last 5 chats
      const recentChats = [...chatHistory]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      
      if (recentChats.length === 0) {
        previousChatsContainer.innerHTML = '<div class="ai-no-history">No previous conversations</div>';
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
        
        chatItem.addEventListener('click', () => {
          container.querySelector('#ai-search-input').value = chat.query;
          APIClient.processQuery(chat.query, container);
          
          // Hide the previous chats panel
          previousChatsContainer.classList.add('hidden');
        });
        
        previousChatsContainer.appendChild(chatItem);
      });
    },
    
    toggleConversationMode(container) {
      const button = container.querySelector('#ai-conversation-mode');
      const thread = container.querySelector('#ai-conversation-thread');
      const resultContainer = container.querySelector('#ai-result-container');
      
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
    },
    
    clearCurrentChat(container) {
      const thread = container.querySelector('#ai-conversation-thread');
      const contextBox = container.querySelector('#ai-context-box');
      const resultContainer = container.querySelector('#ai-result-container');
      
      // Clear all content
      thread.innerHTML = '';
      contextBox.style.display = 'none';
      resultContainer.innerHTML = '';
      container.querySelector('#ai-search-input').value = '';
      
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
    },
    
    clearPageContext(container) {
      const contextBox = container.querySelector('#ai-context-box');
      contextBox.style.display = 'none';
      conversationContext = [];
    },
    
    setPageContext(context) {
      conversationContext = [context];
    },
    
    saveChatToHistory(query, answer) {
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
  };
})();
