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
    })

    if (error) {
      console.error('Error retrieving context:', error)
      return []
    }

    return data?.map((chunk: { content: string }) => chunk.content) || []
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

  return `You are an AI administrative assistant for ${businessName}. Your role is to help customers by:
1. Answering questions about the business using the provided context
2. Booking appointments when requested
3. Providing information about services and availability
4. Being helpful, professional, and concise

${contextSection}

Guidelines:
- Always be polite and professional
- If you don't know something, say so - don't make up information
- When booking appointments, confirm all details with the customer
- Use the available functions/tools to check availability and create appointments
- Keep responses concise but friendly`
}
