import ChatWidget from '@/components/widget/ChatWidget'

export default function TestWidgetPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Widget Test Page
          </h1>
          <p className="text-gray-600 mb-4">
            This is a test page to demonstrate the chat widget. The widget will appear in the bottom-right corner.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-semibold mb-2">
              How to test:
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Look for the chat bubble in the bottom-right corner</li>
              <li>Click it to open the chat widget</li>
              <li>Try asking questions like "What services do you offer?"</li>
              <li>The AI will respond using your business knowledge base</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sample Content
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">
              This is sample content to show how the widget appears on a real page.
              The widget is non-intrusive and floats in the corner.
            </p>
            <p className="text-gray-700 mb-4">
              Your customers can click the chat bubble at any time to get help,
              ask questions, or book appointments.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Example Questions to Try:
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>What are your business hours?</li>
              <li>What services do you offer?</li>
              <li>How can I book an appointment?</li>
              <li>What is your pricing?</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget widgetKey="1919777b-b7ad-496f-b919-194402d044ff" />
    </div>
  )
}
