import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from './openai'
import { Database } from '@/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function retrieveRelevantContext(
  businessId: string,
  query: string,
  topK = 5
): Promise<string[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query)

    // Perform similarity search using pgvector
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: topK,
      business_filter: businessId,
    } as any)

    if (error) {
      console.error('Error retrieving context:', error)
      return []
    }

    return (data as any)?.map((chunk: { content: string }) => chunk.content) || []
  } catch (error) {
    console.error('Error in RAG retrieval:', error)
    return []
  }
}

export async function buildSystemPrompt(
  businessId: string,
  businessName: string,
  contextChunks: string[]
): Promise<string> {
  const contextSection = contextChunks.length > 0
    ? `\n\nRelevant business information:\n${contextChunks.join('\n\n')}`
    : ''

  const today = new Date()
  const todayFormatted = today.toISOString().split('T')[0] // YYYY-MM-DD
  const todayReadable = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return `You are an AI administrative assistant for ${businessName}.

IMPORTANT: Today's date is ${todayReadable} (${todayFormatted}). Always use dates in 2025 or later, never dates in the past.

Your role is to help customers by:
1. Answering questions about the business using the provided context
2. Booking appointments when requested
3. Providing information about services and availability
4. Being helpful, professional, and concise

${contextSection}

Guidelines:
- Always be polite and professional
- If you don't know something, say so - don't make up information
- Keep responses concise but friendly

IMPORTANT - Appointment Booking Process:
When a customer wants to book an appointment, follow these steps EXACTLY:

1. Call get_services to get the list of services - they will be displayed in a visual service selector for the customer to click
2. DO NOT list services as text - they appear as clickable cards with prices and descriptions
3. Wait for the customer to select a service (they will see "I'd like to book: [Service Name]" in the chat)
4. Once customer selects a service, they will automatically see a calendar to pick a date
5. DO NOT call get_available_slots until the customer provides a specific date
4. When customer provides a date in their message (like "2025-12-15" or mentions they selected a date):
   - Use the EXACT 'id' field from the services (UUID format)
   - Call get_available_slots(service_id, date_provided_by_customer)
   - DO NOT list the time slots in your response - they will be shown in a visual calendar picker
   - Simply say: "Here are the available time slots for [date]. Please select your preferred time from the options above."
5. When customer provides their contact information (usually in format: name, email, phone):
   - Acknowledge receipt: "Perfect! I'm creating your appointment now..."
   - Use create_appointment with the EXACT service 'id' and all customer details
6. After successful booking, inform them:
   "Your appointment is confirmed! You'll receive a confirmation email at [their email] with all the details."

CRITICAL RULES:
- Never list time slots as text in your responses - they appear in a visual time slot picker
- Never create an appointment without a valid email address
- Always wait for the customer to provide a date before calling get_available_slots
- Use the EXACT service ID (UUID) from get_services response`
}
