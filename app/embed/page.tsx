'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import ChatWidget from '@/components/widget/ChatWidget'

function EmbedContent() {
  const searchParams = useSearchParams()
  const widgetKey = searchParams.get('key')

  // Remove scrollbars from body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  // Show helpful message if no key is provided
  if (!widgetKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Widget Key Required</h1>
          <p className="text-gray-600 mb-4">
            This page requires a widget key to display the chat widget.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm font-semibold text-blue-900 mb-2">To embed the widget:</p>
            <code className="text-xs bg-white px-2 py-1 rounded block overflow-x-auto">
              {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-widget-key="YOUR_KEY"></script>`}
            </code>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: transparent !important;
        }
        html {
          overflow: hidden !important;
          background: transparent !important;
        }
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
        }
      ` }} />
      <div className="relative w-full h-screen m-0 p-0 overflow-hidden" style={{ background: 'transparent' }}>
        <ChatWidget widgetKey={widgetKey} />
      </div>
    </>
  )
}

export default function EmbedPage() {
  return (
    <Suspense
      fallback={
        <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #ccc', borderTop: '4px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      }
    >
      <EmbedContent />
    </Suspense>
  )
}
