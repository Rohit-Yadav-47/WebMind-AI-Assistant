document.addEventListener('DOMContentLoaded', function() {
  // Tab functionality
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      tabContents.forEach(content => {
        content.classList.add('hidden');
        if (content.id === `${targetTab}-tab`) {
          content.classList.remove('hidden');
        }
      });
    });
  });

  // Load saved settings
  chrome.storage.sync.get(['groqApiKey', 'aiModel', 'transparency'], function(data) {
    if (data.groqApiKey) {
      document.getElementById('apiKey').value = data.groqApiKey;
    }
    
    if (data.aiModel) {
      document.getElementById('model').value = data.aiModel;
    }
    
    if (data.transparency) {
      document.getElementById('transparency').value = data.transparency;
    }
  });
  
  // Save settings
  document.getElementById('saveSettings').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('model').value;
    const transparency = document.getElementById('transparency').value;
    
    chrome.storage.sync.set({
      groqApiKey: apiKey,
      aiModel: model,
      transparency: transparency
    }, function() {
      // Show save confirmation
      const button = document.getElementById('saveSettings');
      const originalText = button.textContent;
      button.textContent = 'Saved!';
      button.style.backgroundColor = '#28a745';
      
      setTimeout(function() {
        button.textContent = originalText;
        button.style.backgroundColor = '#0070e0';
      }, 1500);
    });
  });
  
  // Load chat history
  loadChatHistory();
  
  // Clear history button
  document.getElementById('clearHistory').addEventListener('click', function() {
    chrome.storage.local.set({ chatHistory: [] }, function() {
      loadChatHistory();
    });
  });
});

// Add the missing loadChatHistory function
function loadChatHistory() {
  const historyContainer = document.getElementById('history-container');
  // If the container doesn't exist, don't try to load history
  if (!historyContainer) {
    return;
  }
  
  chrome.storage.local.get('chatHistory', function(data) {
    if (data.chatHistory && data.chatHistory.length > 0) {
      historyContainer.innerHTML = '';
      
      // Show the 5 most recent chats
      const recentChats = data.chatHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      
      recentChats.forEach(chat => {
        const chatElement = document.createElement('div');
        chatElement.className = 'history-item';
        
        const date = new Date(chat.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        chatElement.innerHTML = `
          <div class="history-query">${chat.query}</div>
          <div class="history-date">${formattedDate}</div>
        `;
        
        historyContainer.appendChild(chatElement);
      });
    } else {
      historyContainer.innerHTML = '<div class="empty-state">No chat history</div>';
    }
  });
}

