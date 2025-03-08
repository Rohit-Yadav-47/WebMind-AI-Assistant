# WebMind AI Assistant

A powerful Chrome extension that brings AI capabilities directly into your browser with seamless website interaction and advanced features.

![screenshot](https://github.com/user-attachments/assets/e5068372-63c2-4750-aaf1-184b475ecc3f)
![screenshot (1)](https://github.com/user-attachments/assets/f3ba8a3d-b74e-4353-9ed9-991f64b61ffa)


## 🌟 Key Features

### Multi-Model AI Support
- **Multiple LLM Options**: Switch between Llama 3, Mixtral, Gemma, and other state-of-the-art AI models
- **Model-Specific Optimizations**: Each model is tuned for different types of queries and use cases
- **Easy Model Switching**: Change models on-the-fly without disrupting your workflow
- **Performance Comparison**: Try different models for the same query to compare responses

### Seamless Website Integration
- **Non-intrusive UI**: Interact with websites normally while the AI assistant is available
- **Context-aware**: Extracts and analyzes page content to provide relevant answers
- **Text selection**: Right-click any selected text to get instant explanations

### Powerful Keyboard Shortcuts
- **Ctrl+Q**: Open the AI search bar anywhere (main shortcut)
- **Enter**: Send your query
- **Esc**: Close the assistant
- **Tab**: Navigate through interface elements

### Advanced Interaction
- **Voice Input**: Click the microphone or say "Hey AI" to speak your queries
- **Conversation Mode**: Have multi-turn discussions with context memory
- **Code Support**: Beautiful code blocks with syntax highlighting and copy function

## 🚀 Getting Started

### Installation
1. Download the extension files or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension will be installed and ready to use

### Setup
1. Sign up for a [Groq API key](https://console.groq.com/)
2. Click the extension icon in your Chrome toolbar
3. Enter your Groq API key in the settings
4. Choose your preferred AI model
5. Press **Ctrl+Q** on any webpage to activate the AI search bar

## 💬 How to Use

### Choosing the Right AI Model
- **Llama 3 (70B)**: Best for general knowledge and detailed explanations
- **Mixtral 8x7B**: Excellent for code generation and technical tasks
- **Gemma 2**: Fast responses for simple queries and creative tasks
- **DeepSeek**: Superior for complex reasoning and analysis

### Basic Queries
- **Press Ctrl+Q** to open the search bar (main way to access)
- Type your question and press Enter
- The AI will respond with relevant information using your selected model

### Webpage Context
- Click the **"Use Page Content"** button to analyze the current webpage
- Ask questions about the page content for more relevant answers
- The AI automatically extracts important information from the page

### Voice Commands
- Click the microphone icon to enable voice input
- Speak your question clearly
- The AI will respond, and can read the answer aloud

### Conversation Mode
- Click **"Conversation Mode"** button for multi-turn conversations
- Continue asking follow-up questions without repeating context
- Clear the conversation any time with the "Clear Chat" button

### Text Selection
1. Select any text on a webpage
2. Right-click and choose "Explain with AI"
3. Get instant explanations or insights about the selected text

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| **Ctrl+Q** | Open AI search bar |
| **Enter** | Send query |
| **Esc** | Close assistant |
| **Tab** | Navigate UI elements |
| **Up/Down** | Browse history (when history panel is open) |

## 🔧 Configuration Options

The extension can be customized through the popup interface:

- **AI Model Selection**: Choose from various Groq models with different capabilities:
  - Llama 3 (70B): Powerful all-purpose model with extensive knowledge
  - Mixtral 8x7B: Specialized for coding and technical content
  - Gemma 2 (9B): Lightweight yet capable model for fast responses
  - DeepSeek: Advanced model with superior reasoning abilities
- **UI Transparency**: Adjust how the interface blends with websites
- **Voice Settings**: Configure voice recognition and synthesis options
- **Custom Prompts**: Set default system prompts for specialized use cases

## 🛠️ Technical Details

- **Multi-Model Architecture**: Seamless integration with various Groq-powered LLMs
- **Shadow DOM Architecture**: Complete style isolation from websites
- **Event Isolation**: Careful event handling to prevent webpage conflicts
- **Memory Management**: Efficient cleanup of resources when not in use
- **Error Recovery**: Graceful fallbacks for network issues or API failures

## 📋 Browser Compatibility

- Chrome 80+
- Edge 80+ (Chromium-based)
- Brave, Opera, and other Chromium-based browsers

## 🔒 Privacy & Security

- Your API key is stored locally in your browser's secure storage
- Queries are processed directly through the Groq API
- Page content analysis is performed locally in your browser
- No data is stored on external servers beyond what the API requires
