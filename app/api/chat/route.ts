import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chatCompletion } from '@/lib/ai/openai'
import { retrieveRelevantContext, buildSystemPrompt } from '@/lib/ai/rag'
import { Database } from '@/types/database'
import {
  getAvailableSlots,
  findOrCreateCustomer,
  createAppointment,
} from '@/lib/scheduling/availability'
import { sendAppointmentConfirmation, sendBusinessNotification } from '@/lib/email/resend'

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
          description: 'The EXACT UUID id from the service object returned by get_services (e.g. "437d554a-eca1-41f1-9b92-8ad05eebaa49"). Must be the exact id value, NOT the service name.',
        },
        date: {
          type: 'string',
          description: 'The date to check availability in YYYY-MM-DD format (e.g. "2025-12-10")',
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
          description: 'The EXACT UUID id from the service object returned by get_services. Must be the exact id value, NOT the service name.',
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

          console.log('📋 Available services:', services)
          console.log('🏢 Business ID:', business.id)
          functionResult = JSON.stringify(services)
          break

        case 'get_available_slots':
          try {
            console.log('🔍 Getting slots for:', {
              business_id: business.id,
              service_id: functionArgs.service_id,
              date: functionArgs.date
            })

            // Validate service_id format (should be UUID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(functionArgs.service_id)) {
              console.error('❌ Invalid service_id format:', functionArgs.service_id)
              console.error('   Expected UUID format, got:', typeof functionArgs.service_id)
            }

            const slots = await getAvailableSlots(
              business.id,
              functionArgs.service_id,
              functionArgs.date
            )

            if (slots.length === 0) {
              functionResult = JSON.stringify({
                message: 'No available slots found for this date. Please try another date.',
                slots: [],
              })
            } else {
              // Format slots in a user-friendly way
              const formattedSlots = slots.map((slot) => {
                const time = new Date(slot.start_time).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
                return { time, start_time: slot.start_time, end_time: slot.end_time }
              })

              functionResult = JSON.stringify({
                date: functionArgs.date,
                slots: formattedSlots,
                count: slots.length,
              })
            }
          } catch (error) {
            console.error('Error getting available slots:', error)
            functionResult = JSON.stringify({
              error: 'Failed to retrieve available time slots',
            })
          }
          break

        case 'create_appointment':
          try {
            console.log('📅 Creating appointment with:', functionArgs)

            // Find or create customer
            const customer = await findOrCreateCustomer(
              business.id,
              functionArgs.customer_email,
              functionArgs.customer_name,
              functionArgs.customer_phone
            )

            // Create the appointment
            const appointment = await createAppointment(
              business.id,
              functionArgs.service_id,
              customer.id,
              functionArgs.start_time,
              functionArgs.notes
            )

            console.log('✅ Appointment created successfully:', appointment.id)

            // Get service details for confirmation
            const { data: service } = await supabase
              .from('services')
              .select('name')
              .eq('id', functionArgs.service_id)
              .single()

            const startDate = new Date(appointment.start_time)
            const appointmentTime = startDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })

            const appointmentDate = startDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })

            const appointmentDateTime = startDate.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })

            // Send confirmation email to customer
            console.log('📧 Sending confirmation email to:', functionArgs.customer_email)
            const emailResult = await sendAppointmentConfirmation({
              customerName: functionArgs.customer_name || 'Customer',
              customerEmail: functionArgs.customer_email,
              businessName: business.name,
              serviceName: service?.name || 'Service',
              appointmentTime,
              appointmentDate,
              duration: service?.duration_minutes || 30,
            })

            if (emailResult.success) {
              console.log('✅ Confirmation email sent successfully')
            } else {
              console.error('❌ Failed to send confirmation email:', emailResult.error)
            }

            // Send notification to business owner if email is set
            if (business.email) {
              console.log('📧 Sending notification to business owner:', business.email)
              const businessEmailResult = await sendBusinessNotification(business.email, {
                customerName: functionArgs.customer_name || 'Customer',
                customerEmail: functionArgs.customer_email,
                businessName: business.name,
                serviceName: service?.name || 'Service',
                appointmentTime,
                appointmentDate,
                duration: service?.duration_minutes || 30,
              })

              if (businessEmailResult.success) {
                console.log('✅ Business notification email sent successfully')
              } else {
                console.error('❌ Failed to send business notification:', businessEmailResult.error)
              }
            }

            functionResult = JSON.stringify({
              success: true,
              appointment_id: appointment.id,
              service_name: service?.name || 'Service',
              appointment_time: appointmentDateTime,
              customer_email: functionArgs.customer_email,
              message: `Appointment successfully booked for ${appointmentDateTime}.`,
            })
          } catch (error) {
            console.error('Error creating appointment:', error)
            functionResult = JSON.stringify({
              success: false,
              error: 'Failed to create appointment. Please try again or contact us directly.',
            })
          }
          break

        default:
          functionResult = JSON.stringify({ error: 'Unknown function' })
      }

      // Call AI again with function result
      const followUpMessages = [
        ...messages,
        assistantMessage,
        {
          role: 'tool' as const,
          tool_call_id: toolCall.id,
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

      // Include slot data in response if available
      let slotData = null
      let showDatePicker = false
      let serviceId = null

      if (functionName === 'get_available_slots') {
        try {
          const parsedResult = JSON.parse(functionResult)
          if (parsedResult.slots && parsedResult.slots.length > 0) {
            slotData = {
              date: parsedResult.date,
              slots: parsedResult.slots,
              service_id: functionArgs.service_id,
            }
          }
        } catch (e) {
          console.error('Error parsing slot data:', e)
        }
      }

      // Show date picker after services are listed
      if (functionName === 'get_services') {
        try {
          const services = JSON.parse(functionResult)
          if (services && services.length > 0) {
            showDatePicker = true
            serviceId = services[0].id // Use first service ID
          }
        } catch (e) {
          console.error('Error parsing services:', e)
        }
      }

      return NextResponse.json({
        message: finalMessage,
        conversationId: conversation.id,
        slotData,
        showDatePicker,
        serviceId,
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
