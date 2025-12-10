import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Get the widget key from URL params
  const url = new URL(request.url)
  const widgetKey = url.searchParams.get('key')

  // Generate the widget JavaScript code
  const widgetScript = `
(function() {
  'use strict';

  // Get widget key from script tag data attribute
  var currentScript = document.currentScript || document.querySelector('script[data-widget-key]');
  var widgetKey = currentScript ? currentScript.getAttribute('data-widget-key') : null;

  if (!widgetKey) {
    console.error('AIMeet Widget: No widget key provided');
    return;
  }

  // Create widget container
  var widgetContainer = document.createElement('div');
  widgetContainer.id = 'aimeet-widget-container';
  document.body.appendChild(widgetContainer);

  // Widget styles
  var style = document.createElement('style');
  style.textContent = \`
    #aimeet-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .aimeet-chat-bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .aimeet-chat-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }

    .aimeet-chat-bubble svg {
      width: 28px;
      height: 28px;
      fill: white;
    }

    .aimeet-chat-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }

    .aimeet-chat-window.open {
      display: flex;
    }

    .aimeet-chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .aimeet-chat-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .aimeet-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9fafb;
    }

    .aimeet-message {
      margin-bottom: 12px;
      display: flex;
    }

    .aimeet-message.user {
      justify-content: flex-end;
    }

    .aimeet-message-content {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 16px;
      word-wrap: break-word;
      line-height: 1.5;
    }

    .aimeet-message.user .aimeet-message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .aimeet-message.assistant .aimeet-message-content {
      background: white;
      color: #000000 !important;
      border: 1px solid #e5e7eb;
      font-weight: 500;
    }

    .aimeet-chat-input-container {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background: white;
      display: flex;
      gap: 8px;
    }

    .aimeet-chat-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 24px;
      outline: none;
      font-size: 14px;
      color: #000000 !important;
      font-weight: 600 !important;
      -webkit-text-fill-color: #000000 !important;
      opacity: 1 !important;
    }

    .aimeet-chat-input::placeholder {
      color: #9ca3af;
      -webkit-text-fill-color: #9ca3af;
    }

    .aimeet-chat-input:focus {
      border-color: #667eea;
      color: #000000 !important;
      -webkit-text-fill-color: #000000 !important;
    }

    .aimeet-chat-input:disabled {
      opacity: 0.5;
      color: #6b7280;
    }

    .aimeet-send-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .aimeet-send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .aimeet-loading {
      display: flex;
      gap: 4px;
      padding: 10px;
    }

    .aimeet-loading-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9ca3af;
      animation: aimeet-bounce 1.4s infinite ease-in-out both;
    }

    .aimeet-loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .aimeet-loading-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes aimeet-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  \`;
  document.head.appendChild(style);

  // Widget state
  var isOpen = false;
  var messages = [];
  var conversationId = null;
  var isLoading = false;

  // Create widget HTML
  function render() {
    widgetContainer.innerHTML = \`
      <div class="aimeet-chat-bubble" id="aimeet-bubble">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      </div>

      <div class="aimeet-chat-window \${isOpen ? 'open' : ''}" id="aimeet-window">
        <div class="aimeet-chat-header">
          <div>
            <div style="font-weight: 600; font-size: 16px;">AI Assistant</div>
            <div style="font-size: 12px; opacity: 0.9;">How can I help you?</div>
          </div>
          <button class="aimeet-chat-close" id="aimeet-close">×</button>
        </div>

        <div class="aimeet-chat-messages" id="aimeet-messages">
          \${messages.length === 0 ? \`
            <div style="text-align: center; padding: 40px 20px; color: #1f2937;">
              <div style="font-size: 40px; margin-bottom: 12px;">👋</div>
              <div style="font-weight: 500;">Hello! How can I assist you today?</div>
            </div>
          \` : messages.map(msg => \`
            <div class="aimeet-message \${msg.role}">
              <div class="aimeet-message-content">\${msg.role === 'assistant' ? '<span style="color: #000000; font-weight: 500;">' + msg.content + '</span>' : msg.content}</div>
            </div>
          \`).join('')}
          \${isLoading ? \`
            <div class="aimeet-message assistant">
              <div class="aimeet-message-content">
                <div class="aimeet-loading">
                  <div class="aimeet-loading-dot"></div>
                  <div class="aimeet-loading-dot"></div>
                  <div class="aimeet-loading-dot"></div>
                </div>
              </div>
            </div>
          \` : ''}
        </div>

        <div class="aimeet-chat-input-container">
          <input
            type="text"
            class="aimeet-chat-input"
            id="aimeet-input"
            placeholder="Type your message..."
            autocomplete="off"
            style="color: #000000 !important; font-weight: 600 !important; -webkit-text-fill-color: #000000 !important; opacity: 1 !important;"
            \${isLoading ? 'disabled' : ''}
          />
          <button
            class="aimeet-send-button"
            id="aimeet-send"
            \${isLoading ? 'disabled' : ''}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    \`;

    // Attach event listeners
    document.getElementById('aimeet-bubble').onclick = toggleChat;
    document.getElementById('aimeet-close').onclick = toggleChat;
    document.getElementById('aimeet-send').onclick = sendMessage;

    var inputElement = document.getElementById('aimeet-input');
    inputElement.onkeypress = function(e) {
      if (e.key === 'Enter') sendMessage();
    };

    // Force text color on input
    inputElement.addEventListener('input', function() {
      this.style.color = '#000000';
      this.style.webkitTextFillColor = '#000000';
    });

    // Force color on focus
    inputElement.addEventListener('focus', function() {
      this.style.color = '#000000';
      this.style.webkitTextFillColor = '#000000';
    });

    // Scroll to bottom
    var messagesDiv = document.getElementById('aimeet-messages');
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    render();
  }

  async function sendMessage() {
    var input = document.getElementById('aimeet-input');
    var message = input.value.trim();

    if (!message || isLoading) return;

    // Add user message
    messages.push({ role: 'user', content: message });
    input.value = '';
    isLoading = true;
    render();

    try {
      var response = await fetch(window.location.origin + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          widgetKey: widgetKey,
          conversationId: conversationId
        })
      });

      var data = await response.json();

      if (data.conversationId) {
        conversationId = data.conversationId;
      }

      messages.push({ role: 'assistant', content: data.message });
    } catch (error) {
      console.error('AIMeet Widget Error:', error);
      messages.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      });
    } finally {
      isLoading = false;
      render();
    }
  }

  // Initial render
  render();
})();
`;

  return new NextResponse(widgetScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
