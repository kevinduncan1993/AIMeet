import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chatCompletion } from '@/lib/ai/openai'
import { retrieveRelevantContext, buildSystemPrompt } from '@/lib/ai/rag'
import { Database } from '@/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// AI function definitions for booking appointments
const functions = [
  {
    name: 'get_available_slots',
    description: 'Get available appointment time slots for a specific service',
    parameters: {
      type: 'object',
      properties: {
        service_id: {
          type: 'string',
          description: 'The ID of the service to book',
        },
        date: {
          type: 'string',
          description: 'The date to check availability (YYYY-MM-DD format)',
        },
      },
      required: ['service_id', 'date'],
    },
  },
  {
    name: 'create_appointment',
    description: 'Create a new appointment booking',
    parameters: {
      type: 'object',
      properties: {
        service_id: {
          type: 'string',
          description: 'The ID of the service',
        },
        customer_name: {
          type: 'string',
          description: 'Customer full name',
        },
        customer_email: {
          type: 'string',
          description: 'Customer email address',
        },
        customer_phone: {
          type: 'string',
          description: 'Customer phone number',
        },
        start_time: {
          type: 'string',
          description: 'Appointment start time (ISO 8601 format)',
        },
        notes: {
          type: 'string',
          description: 'Any customer notes or special requests',
        },
      },
      required: ['service_id', 'customer_email', 'start_time'],
    },
  },
  {
    name: 'get_services',
    description: 'Get list of available services offered by the business',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
]

export async function POST(request: NextRequest) {
  try {
    const { message, widgetKey, conversationId } = await request.json()

    if (!message || !widgetKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get business by widget key
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('widget_key', widgetKey)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Invalid widget key' },
        { status: 404 }
      )
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()
      conversation = data
    }

    if (!conversation) {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          business_id: business.id,
          channel: 'widget',
          first_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      conversation = data
    }

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
    })

    // Get conversation history
    const { data: previousMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(10)

    // Retrieve relevant context using RAG
    const contextChunks = await retrieveRelevantContext(business.id, message)

    // Build system prompt with context
    const systemPrompt = await buildSystemPrompt(
      business.id,
      business.name,
      contextChunks
    )

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(previousMessages?.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })) || []),
    ]

    // Get AI response
    const completion = await chatCompletion(messages, functions)
    const assistantMessage = completion.choices[0].message

    // Handle function calls if present
    if (assistantMessage.tool_calls) {
      const toolCall = assistantMessage.tool_calls[0]
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments)

      let functionResult

      switch (functionName) {
        case 'get_services':
          const { data: services } = await supabase
            .from('services')
            .select('id, name, description, duration_minutes, price')
            .eq('business_id', business.id)
            .eq('is_active', true)

          functionResult = JSON.stringify(services)
          break

        case 'get_available_slots':
          // TODO: Implement availability logic
          functionResult = JSON.stringify({
            message: 'Availability checking not yet implemented',
          })
          break

        case 'create_appointment':
          // TODO: Implement appointment creation
          functionResult = JSON.stringify({
            message: 'Appointment booking not yet implemented',
          })
          break

        default:
          functionResult = JSON.stringify({ error: 'Unknown function' })
      }

      // Call AI again with function result
      const followUpMessages = [
        ...messages,
        assistantMessage,
        {
          role: 'function' as const,
          name: functionName,
          content: functionResult,
        },
      ]

      const followUpCompletion = await chatCompletion(followUpMessages as never)
      const finalMessage = followUpCompletion.choices[0].message.content

      // Save assistant message
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: finalMessage || '',
        function_call: { name: functionName, arguments: functionArgs },
      })

      return NextResponse.json({
        message: finalMessage,
        conversationId: conversation.id,
      })
    }

    // Save assistant message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: assistantMessage.content || '',
    })

    // Update conversation last message time
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id)

    return NextResponse.json({
      message: assistantMessage.content,
      conversationId: conversation.id,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
