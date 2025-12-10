'use client'

import { useBusiness } from '@/lib/hooks/useBusiness'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Conversation, Message } from '@/types/database'

export default function ConversationsPage() {
  const { business } = useBusiness()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchConversations()
  }, [business])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  async function fetchConversations() {
    if (!business) return

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('business_id', business.id)
        .order('last_message_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  if (loading) {
    return <div>Loading conversations...</div>
  }

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Conversations</h2>
          <p className="text-sm text-gray-600 mt-1">
            {conversations.length} total
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-600 text-sm">
              No conversations yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                  selectedConversation === conv.id ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-900">
                    {conv.channel}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(conv.last_message_at || conv.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  Session: {conv.session_id?.substring(0, 8)}...
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages View */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Conversation Details</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : msg.role === 'assistant'
                        ? 'bg-white text-gray-900 border border-gray-200'
                        : 'bg-gray-100 text-gray-600 text-sm'
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {msg.role === 'user' ? 'Customer' : msg.role === 'assistant' ? 'AI Assistant' : 'System'}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-4">👈</div>
              <p className="text-gray-600">
                Select a conversation to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
