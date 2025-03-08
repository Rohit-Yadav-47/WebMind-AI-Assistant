// Background script for AI Search Bar extension
chrome.runtime.onInstalled.addListener(function() {
  // Create context menu item for explaining selected text
  chrome.contextMenus.create({
    id: "explainSelection",
    title: "Explain with AI",
    contexts: ["selection"]
  });

  // Set default settings if not already set
  chrome.storage.sync.get({
    groqApiKey: '',
    aiModel: 'llama3-70b-8192',
    theme: 'auto',
    customPrompt: 'You are a helpful assistant. Give concise and informative answers.',
    transparency: '0.9'
  }, function(items) {
    if (!items.groqApiKey) {
      // If this is a new installation, open options page
      chrome.runtime.openOptionsPage();
    }
  });
});

// Handle context menu clicks with better error handling
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "explainSelection" && info.selectionText) {
    console.log('Context menu: Explain with AI clicked', info.selectionText.substring(0, 30) + '...');
    
    // Send message to content script with retry mechanism
    function sendExplainMessage(retryCount = 0) {
      // Check if tab still exists before sending message
      chrome.tabs.get(tab.id, function(currentTab) {
        if (chrome.runtime.lastError) {
          console.error("Tab no longer exists:", chrome.runtime.lastError);
          return;
        }
        
        chrome.tabs.sendMessage(tab.id, {
          action: 'explainSelection',
          selection: info.selectionText
        }, response => {
          // Check if there was an error communicating with the content script
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            
            // If we haven't retried too many times, try injecting the content script and retrying
            if (retryCount < 2) {
              console.log('Retrying after injecting content script...');
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['js/content.js']
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Error injecting script:", chrome.runtime.lastError);
                  return;
                }
                setTimeout(() => sendExplainMessage(retryCount + 1), 100);
              });
            }
          }
        });
      });
    }
    
    sendExplainMessage();
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "getSettings") {
    chrome.storage.sync.get(null, function(data) {
      sendResponse(data);
    });
    return true;  // Will respond asynchronously
  }
});
