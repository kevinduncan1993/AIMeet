'use client'

import { useState, useEffect, useRef } from 'react'
import TimeSlotPicker from './TimeSlotPicker'
import BookingForm from './BookingForm'
import DatePicker from './DatePicker'
import ServicePicker from './ServicePicker'

interface TimeSlot {
  time: string
  start_time: string
  end_time: string
}

interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number | null
}

interface SlotData {
  date: string
  slots: TimeSlot[]
  service_id: string
}

interface BookingData {
  slot: TimeSlot
  slotData: SlotData
  serviceName: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  slotData?: SlotData
  showDatePicker?: boolean
  serviceId?: string
  services?: Service[]
}

interface ChatWidgetProps {
  widgetKey: string
  apiUrl?: string
}

// Helper function to format message content with basic markdown support
function formatMessage(content: string) {
  // Replace **bold** with <strong>
  let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Replace *italic* with <em>
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Replace line breaks
  formatted = formatted.replace(/\n/g, '<br />')

  // Replace bullet points
  formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>')
  formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc ml-4 my-2">$&</ul>')

  return formatted
}

export default function ChatWidget({ widgetKey, apiUrl = '/api/chat' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [selectedService, setSelectedService] = useState<{ id: string; name: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Notify parent window when chat is opened/closed
  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(
        {
          type: 'aimeet-widget-resize',
          isOpen: isOpen
        },
        '*'
      )
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setShowWelcome(false)
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }])
    setLoading(true)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          widgetKey,
          conversationId,
        }),
      })

      const data = await response.json()

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          slotData: data.slotData || undefined,
          showDatePicker: data.showDatePicker || false,
          serviceId: data.serviceId || undefined,
          services: data.services || undefined,
        },
      ])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error while processing your request. Please try again in a moment.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSlotSelection = async (slot: TimeSlot, slotData: SlotData) => {
    // Extract service name from the last assistant message
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()
    const serviceName = 'Appointment' // Default, will be extracted from context

    // Show booking form
    setBookingData({
      slot,
      slotData,
      serviceName
    })
  }

  const handleBookingSubmit = async (formData: {
    name: string
    email: string
    phone: string
    notes?: string
  }) => {
    if (!bookingData) return

    const { slot, slotData } = bookingData

    // Create booking message
    const bookingMessage = `Please book an appointment for ${formData.name} (${formData.email}, ${formData.phone}) at ${slot.time} on ${slotData.date}. ${formData.notes ? `Notes: ${formData.notes}` : ''}`

    setShowWelcome(false)
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `Book appointment: ${slot.time} on ${slotData.date}`,
        timestamp: new Date()
      }
    ])
    setLoading(true)
    setBookingData(null) // Hide form

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: bookingMessage,
          widgetKey,
          conversationId,
        }),
      })

      const data = await response.json()

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error('Error creating booking:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error while creating your appointment. Please try again in a moment.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleBookingCancel = () => {
    setBookingData(null)
  }

  const handleServiceSelection = (serviceId: string, serviceName: string) => {
    setSelectedService({ id: serviceId, name: serviceName })
    setShowWelcome(false)
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `I'd like to book: ${serviceName}`,
        timestamp: new Date()
      },
      {
        role: 'assistant',
        content: 'Great choice! Please select your preferred date from the calendar below.',
        timestamp: new Date(),
        showDatePicker: true,
        serviceId: serviceId,
      }
    ])
  }

  const handleDateSelection = async (date: string, serviceId: string) => {
    // Send message to AI to get available slots for this date
    const message = `Show me available times for ${date}`

    setShowWelcome(false)
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `Selected date: ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`,
        timestamp: new Date()
      }
    ])
    setLoading(true)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Get available appointment slots for service ID ${serviceId} on ${date}`,
          widgetKey,
          conversationId,
        }),
      })

      const data = await response.json()

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          slotData: data.slotData || undefined,
          showDatePicker: data.showDatePicker || false,
          serviceId: data.serviceId || undefined,
          services: data.services || undefined,
        },
      ])
    } catch (error) {
      console.error('Error fetching slots:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error while fetching available slots. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Chat bubble button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-2 right-2 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 z-50"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="absolute top-0 left-0 w-full h-full bg-white rounded-2xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs opacity-90">How can I help you today?</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-indigo-700 rounded-full p-1 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {showWelcome && messages.length === 0 && (
              <div className="text-center text-gray-900 mt-8 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-2">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome! 👋</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    I'm your AI assistant. I can help you with:
                  </p>
                  <div className="mt-3 space-y-2 text-left max-w-xs mx-auto">
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Answering questions about our services</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Booking appointments</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Providing business information</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-4">How can I help you today?</p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                } w-full`}
              >
                <div
                  className={`${msg.slotData ? 'w-full' : 'max-w-[85%]'} rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'
                  }`}
                >
                  <div
                    className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                </div>
                {msg.timestamp && (
                  <span className="text-xs text-gray-400 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                )}
                {msg.services && msg.services.length > 0 && (
                  <div className="w-full mt-2">
                    <ServicePicker
                      services={msg.services}
                      onSelectService={handleServiceSelection}
                      loading={loading}
                    />
                  </div>
                )}
                {msg.showDatePicker && msg.serviceId && !msg.services && (
                  <div className="w-full mt-2">
                    <DatePicker
                      onSelectDate={(date) => handleDateSelection(date, msg.serviceId!)}
                      loading={loading}
                    />
                  </div>
                )}
                {msg.slotData && !msg.showDatePicker && (
                  <div className="w-full mt-2">
                    <TimeSlotPicker
                      date={msg.slotData.date}
                      slots={msg.slotData.slots}
                      onSelectSlot={(slot) => handleSlotSelection(slot, msg.slotData!)}
                      loading={loading}
                    />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                      style={{ animationDelay: '0.15s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                      style={{ animationDelay: '0.3s' }}
                    ></div>
                    <span className="ml-2 text-xs text-gray-500">AI is typing...</span>
                  </div>
                </div>
              </div>
            )}

            {bookingData && (
              <div className="w-full">
                <BookingForm
                  serviceName={bookingData.serviceName}
                  appointmentTime={bookingData.slot.time}
                  appointmentDate={new Date(bookingData.slotData.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  onSubmit={handleBookingSubmit}
                  onCancel={handleBookingCancel}
                  loading={loading}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by AI
            </p>
          </div>
        </div>
      )}
    </>
  )
}
