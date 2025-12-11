import { z } from 'zod'

// Chat API request schema
export const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  widgetKey: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
})

// Stripe checkout request schema
export const stripeCheckoutSchema = z.object({
  planType: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
})

// Service creation schema
export const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  duration_minutes: z.number().int().min(5).max(480), // 5 min to 8 hours
  buffer_minutes: z.number().int().min(0).max(120).optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  is_active: z.boolean().optional(),
})

// Appointment creation schema
export const createAppointmentSchema = z.object({
  service_id: z.string().uuid(),
  customer_name: z.string().min(1).max(255),
  customer_email: z.string().email(),
  customer_phone: z.string().min(1).max(50),
  start_time: z.string().datetime(),
  notes: z.string().max(1000).optional(),
})

// Business update schema
export const updateBusinessSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  website: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

// FAQ creation schema
export const createFAQSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
  category: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
})

// Business hours schema
export const businessHoursSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  is_closed: z.boolean().optional(),
})

/**
 * Validate request body against a Zod schema
 * @param data - The data to validate
 * @param schema - The Zod schema to validate against
 * @returns Validated data or throws a ZodError
 */
export function validateRequest<T>(data: unknown, schema: z.ZodSchema<T>): T {
  return schema.parse(data)
}

/**
 * Safe validation that returns a result object instead of throwing
 * @param data - The data to validate
 * @param schema - The Zod schema to validate against
 * @returns Object with success boolean and either data or error
 */
export function safeValidateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}
