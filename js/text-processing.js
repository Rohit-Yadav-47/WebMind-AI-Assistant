/**
 * WebMind AI Assistant - Text Processor
 * Handles text extraction, markdown processing, and code formatting
 */

const TextProcessor = (() => {
  return {
    extractPageContent(container) {
      const contextBox = container.querySelector('#ai-context-box');
      const contextContent = container.querySelector('#ai-context-content');
      
      // Extract page title and main content
      const title = document.title;
      let content = '';
      
      // Try multiple strategies to extract the main content
      // Strategy 1: Look for semantic elements
      const mainContent = document.querySelector('article') || 
                          document.querySelector('main') || 
                          document.querySelector('.content') || 
                          document.querySelector('#content');
      
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
      ConversationManager.setPageContext(pageContext);
      
      // Update search input with suggested query
      const searchInput = container.querySelector('#ai-search-input');
      if (!searchInput.value) {
        searchInput.value = `Summarize this page content`;
        searchInput.focus();
        searchInput.setSelectionRange(0, searchInput.value.length);
      }
      
      // Add visual feedback when extracting content
      const button = container.querySelector('#ai-extract-page');
      button.classList.add('active');
      
      setTimeout(() => {
        button.classList.remove('active');
      }, 1000);
    },
    
    markdownToHtml(markdown) {
      // Handle code blocks with language specification
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      
      // First handle the code blocks to avoid conflicts
      let html = markdown.replace(codeBlockRegex, (match, lang, code) => {
        const languageClass = lang ? ` class="language-${lang}"` : '';
        return `<pre><code${languageClass}>${this.escapeHtml(code)}</code></pre>`;
      });
      
      // Process tables
      html = this.processMarkdownTables(html);
      
      // Handle basic formatting
      html = html
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
      
      return html;
    },
    
    processMarkdownTables(text) {
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
          const tableHtml = this.convertTableToHtml(tableLines);
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
        const tableHtml = this.convertTableToHtml(tableLines);
        result.push(tableHtml);
      }
      
      return result.join('\n');
    },
    
    convertTableToHtml(tableLines) {
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
        
        // Check if this is a header separator row
        if (/^[\s-:|]+$/.test(line.replace(/\|/g, ''))) {
          hasHeader = true;
          return; // Skip the separator row
        }
        
        // Start new row
        html += '<tr>';
        
        // Determine if this is a header row
        const cellType = (index === 0 && hasHeader) || 
                        (index === 0 && tableLines.length > 1 && 
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
    },
    
    escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
    
    addCopyButtonsToCodeBlocks(container) {
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
  };
})();
