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

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "explainSelection" && info.selectionText) {
    // Send message to content script to open AI search bar with the selected text
    chrome.tabs.sendMessage(tab.id, {
      action: 'explainSelection',
      selection: info.selectionText
    });
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
