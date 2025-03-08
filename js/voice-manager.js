/**
 * WebMind AI Assistant - Voice Manager
 * Handles voice input and output functionality
 */

const VoiceManager = (() => {
  // Private variables
  let recognition = null;
  let voiceMode = false;
  let isSpeaking = false;
  const speechSynthesis = window.speechSynthesis;
  
  // Public methods
  return {
    init() {
      // Check if speech recognition is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn("Speech recognition not supported in this browser");
      }
    },
    
    toggleVoiceMode(container) {
      if (!voiceMode) {
        this.startVoiceRecognition(container);
      } else {
        this.stopVoiceRecognition(container);
      }
    },
    
    startVoiceRecognition(container) {
      const voiceBtn = container.querySelector('#ai-voice-btn');
      const searchInput = container.querySelector('#ai-search-input');
      
      // Check browser support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        Utils.showError("Voice recognition not supported in this browser", container);
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
        const query = searchInput.value.trim();
        
        voiceBtn.classList.remove('listening');
        searchInput.placeholder = "Ask me anything...";
        voiceMode = false;
        
        if (query) {
          APIClient.processQuery(query, container, true); // true indicates this is from voice
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
    },
    
    stopVoiceRecognition(container) {
      if (recognition) {
        recognition.stop();
        voiceMode = false;
        
        const voiceBtn = container.querySelector('#ai-voice-btn');
        const searchInput = container.querySelector('#ai-search-input');
        
        voiceBtn.classList.remove('listening');
        searchInput.placeholder = "Ask me anything...";
      }
    },
    
    isSpeaking() {
      return isSpeaking;
    },
    
    speakResponse(text, container) {
      // Stop any ongoing speech
      speechSynthesis.cancel();

      // Clean the text
      const cleanText = this.cleanTextForSpeech(text);
      
      // Create chunks to avoid speech cutoff
      const chunks = this.createSpeechChunks(cleanText);
      
      // Speak each chunk in sequence
      isSpeaking = true;
      
      // Add visual indicator
      const speakingIndicator = this.addSpeakingIndicator(container);
      
      // Speak sequentially
      let currentIndex = 0;
      
      const speakNext = () => {
        if (currentIndex >= chunks.length) {
          isSpeaking = false;
          this.removeSpeakingIndicator(speakingIndicator);
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
      };
      
      speakNext();
    },
    
    cleanTextForSpeech(text) {
      return text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/```[\s\S]*?```/g, 'Code block omitted for speech.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    },
    
    createSpeechChunks(text) {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
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
      
      return chunks;
    },
    
    addSpeakingIndicator(container) {
      const speakingIndicator = document.createElement('div');
      speakingIndicator.className = 'ai-speaking-indicator';
      speakingIndicator.innerHTML = '<div class="ai-speaking-wave"></div>';
      
      if (ConversationManager.isConversationModeActive()) {
        const lastMessage = container.querySelector('.ai-conversation-thread .ai-message:last-child .ai-message-content');
        if (lastMessage) lastMessage.appendChild(speakingIndicator);
      } else {
        const answer = container.querySelector('.ai-answer');
        if (answer) answer.appendChild(speakingIndicator);
      }
      
      return speakingIndicator;
    },
    
    removeSpeakingIndicator(indicator) {
      if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    },
    
    cleanup() {
      // Stop any ongoing speech recognition
      if (recognition) {
        recognition.stop();
        recognition = null;
      }
      
      // Stop any ongoing speech synthesis
      speechSynthesis.cancel();
      isSpeaking = false;
      voiceMode = false;
    }
  };
})();
