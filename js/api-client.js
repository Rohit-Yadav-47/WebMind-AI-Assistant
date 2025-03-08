/**
 * WebMind AI Assistant - API Client
 * Handles API requests and responses
 */

const APIClient = (() => {
  // Private variables
  let apiKey = '';
  let currentModel = '';
  
  // Public methods
  return {
    init() {
      // Load API key and model settings
      chrome.storage.sync.get(['groqApiKey', 'aiModel'], function(data) {
        apiKey = data.groqApiKey || '';
        currentModel = data.aiModel || 'llama3-70b-8192';
      });
    },
    
    processQuery(query, container, useVoice = false) {
      const resultsContainer = container.querySelector('#ai-results');
      const resultContainer = container.querySelector('#ai-result-container');
      const conversationThread = container.querySelector('#ai-conversation-thread');
      const loader = container.querySelector('.ai-loader');
      
      // Show loader and ensure results container is visible
      loader.style.display = 'block';
      resultsContainer.style.display = 'block';
      
      // If in conversation mode, add user message to conversation thread
      if (ConversationManager.isConversationModeActive()) {
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
      
      // Get the API key and model
      chrome.storage.sync.get(['groqApiKey', 'aiModel', 'customPrompt'], (data) => {
        if (!data.groqApiKey) {
          this.showError("Please set your Groq API key in the extension popup.", container);
          loader.style.display = 'none';
          return;
        }
        
        const apiKey = data.groqApiKey;
        const model = data.aiModel || 'llama3-70b-8192';
        let systemPrompt = data.customPrompt || "You are a helpful assistant. Give concise and informative answers.";
        
        // Add page context if available
        const pageContext = ConversationManager.getPageContext();
        if (pageContext) {
          systemPrompt += ` You have access to the following page content: Title: "${pageContext.title}", Content: "${pageContext.content}", URL: ${pageContext.url}`;
        }
        
        // Prepare messages array for API request
        const messages = [
          { role: "system", content: systemPrompt },
        ];
        
        // If in conversation mode, include previous messages
        if (ConversationManager.isConversationModeActive()) {
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
        this.callGroqAPI(model, messages, apiKey)
          .then(response => {
            loader.style.display = 'none';
            
            if (response && response.choices && response.choices[0]) {
              const answer = response.choices[0].message.content;
              
              // Convert markdown to HTML
              const formattedAnswer = TextProcessor.markdownToHtml(answer);
              
              // Store in chat history
              ConversationManager.saveChatToHistory(query, answer);
              
              if (ConversationManager.isConversationModeActive()) {
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
                TextProcessor.addCopyButtonsToCodeBlocks(conversationThread.lastElementChild);
              } else {
                // Standard single response view
                resultContainer.innerHTML = `
                  <div class="ai-result-item new">
                    <div class="ai-query">${query}</div>
                    <div class="ai-answer">${formattedAnswer}</div>
                  </div>
                `;
                
                // Add copy buttons to code blocks
                TextProcessor.addCopyButtonsToCodeBlocks(resultContainer);
              }
              
              // If query came from voice input, speak the response back
              if (useVoice && !VoiceManager.isSpeaking()) {
                VoiceManager.speakResponse(answer, container);
              }
            } else {
              this.showError("Sorry, I couldn't process your request.", container);
            }
          })
          .catch(error => {
            loader.style.display = 'none';
            this.showError(`Error: ${error.message}`, container);
          });
      });
    },
    
    callGroqAPI(model, messages, apiKey) {
      return fetch('https://api.groq.com/openai/v1/chat/completions', {
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
      });
    },
    
    showError(message, container) {
      const resultsContainer = container.querySelector('#ai-results');
      const resultContainer = container.querySelector('#ai-result-container');
      
      // Ensure the results container is visible
      resultsContainer.style.display = 'block';
      
      // Display error message
      resultContainer.innerHTML = `<div class="ai-error">${message}</div>`;
    }
  };
})();
