import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const CHAT_MODEL = 'gpt-4-turbo-preview'

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  })

  return response.data[0].embedding
}

export async function chatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  functions?: Array<{
    name: string
    description: string
    parameters: unknown
  }>,
  temperature = 0.7
) {
  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    tools: functions?.map((fn) => ({
      type: 'function' as const,
      function: fn as any,
    })),
    temperature,
  })

  return response
}
