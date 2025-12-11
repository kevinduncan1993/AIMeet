import { NextResponse } from 'next/server'

export async function GET() {
  const widgetScript = `
(function() {
  'use strict';

  // Widget configuration
  const WIDGET_CONFIG = {
    apiUrl: '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/chat',
    styles: {
      zIndex: 9999,
      position: 'fixed',
      bottom: '24px',
      right: '24px'
    }
  };

  // Get widget key from script tag
  const scriptTag = document.currentScript;
  const widgetKey = scriptTag?.getAttribute('data-widget-key');

  if (!widgetKey) {
    console.error('AIMeet Widget: Missing data-widget-key attribute');
    return;
  }

  // Create widget container
  function createWidget() {
    const container = document.createElement('div');
    container.id = 'aimeet-widget-container';
    container.style.position = 'fixed';
    container.style.bottom = WIDGET_CONFIG.styles.bottom;
    container.style.right = WIDGET_CONFIG.styles.right;
    container.style.zIndex = WIDGET_CONFIG.styles.zIndex;
    container.style.border = 'none';
    container.style.outline = 'none';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    // Create iframe for widget with widget key in URL
    const iframe = document.createElement('iframe');
    iframe.id = 'aimeet-widget-iframe';
    iframe.src = '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/embed?key=' + encodeURIComponent(widgetKey);
    iframe.style.border = 'none';
    iframe.style.outline = 'none';
    iframe.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    iframe.allow = 'clipboard-write';
    iframe.style.background = 'transparent';
    iframe.setAttribute('frameborder', '0');

    // Start with bubble size
    iframe.style.width = '80px';
    iframe.style.height = '80px';
    iframe.style.borderRadius = '50%';
    iframe.style.boxShadow = 'none';

    container.appendChild(iframe);

    // Listen for resize messages from the iframe
    window.addEventListener('message', function(event) {
      // Verify origin for security (in production, check event.origin)
      if (event.data && event.data.type === 'aimeet-widget-resize') {
        if (event.data.isOpen) {
          // Chat is open - expand to full size
          iframe.style.width = '400px';
          iframe.style.height = '600px';
          iframe.style.borderRadius = '16px';
          iframe.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.2)';
        } else {
          // Chat is closed - shrink to bubble
          iframe.style.width = '80px';
          iframe.style.height = '80px';
          iframe.style.borderRadius = '50%';
          iframe.style.boxShadow = 'none';
        }
      }
    });
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
`

  return new NextResponse(widgetScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
