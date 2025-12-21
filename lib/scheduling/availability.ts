import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TimeSlot {
  start: string // ISO 8601 format
  end: string
  available: boolean
}

interface AvailableSlot {
  start_time: string
  end_time: string
}

/**
 * Get available time slots for a specific service on a given date
 */
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  date: string // YYYY-MM-DD format
): Promise<AvailableSlot[]> {
  // Get service details - first try by ID
  let service
  let serviceError

  const { data: serviceData, error: serviceErr } = await supabase
    .from('services')
    .select('duration_minutes, buffer_minutes')
    .eq('id', serviceId)
    .eq('business_id', businessId)
    .single()

  service = serviceData
  serviceError = serviceErr

  // If not found by ID, try to find by name (fallback for when AI uses wrong ID)
  if (serviceError || !service) {
    console.warn(`⚠️  Service not found by ID: ${serviceId}`)
    console.warn(`   Business ID: ${businessId}`)
    console.warn(`   Attempting fallback to first available service...`)

    const { data: allServices } = await supabase
      .from('services')
      .select('id, name, duration_minutes, buffer_minutes')
      .eq('business_id', businessId)
      .eq('is_active', true)

    const servicesArray = allServices as any[]

    if (servicesArray && servicesArray.length > 0) {
      // Just use the first active service as fallback
      console.warn(`   ✅ Fallback successful: Using "${servicesArray[0].name}" (ID: ${servicesArray[0].id})`)
      service = servicesArray[0]
      serviceError = null
    } else {
      console.error(`   ❌ No active services found for business ${businessId}`)
    }
  }

  if (serviceError || !service) {
    throw new Error('Service not found')
  }

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = new Date(date + 'T00:00:00').getDay()

  // Get business hours for this day
  const { data: businessHours, error: hoursError } = await supabase
    .from('business_hours')
    .select('start_time, end_time')
    .eq('business_id', businessId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  const hours = businessHours as any[]

  if (hoursError || !hours || hours.length === 0) {
    return [] // No business hours set for this day
  }

  // Get existing appointments for this date
  const startOfDay = new Date(date + 'T00:00:00').toISOString()
  const endOfDay = new Date(date + 'T23:59:59').toISOString()

  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('business_id', businessId)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .in('status', ['scheduled', 'confirmed'])

  const appointments = appointmentsData as any[]

  if (appointmentsError) {
    throw new Error('Failed to fetch appointments')
  }

  // Generate all possible slots
  const availableSlots: AvailableSlot[] = []
  const totalDuration = service.duration_minutes + (service.buffer_minutes || 0)

  for (const hoursItem of hours) {
    const slots = generateSlotsForPeriod(
      date,
      hoursItem.start_time,
      hoursItem.end_time,
      totalDuration,
      appointments || []
    )
    availableSlots.push(...slots)
  }

  return availableSlots
}

/**
 * Generate time slots for a given time period
 */
function generateSlotsForPeriod(
  date: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  existingAppointments: Array<{ start_time: string; end_time: string }>
): AvailableSlot[] {
  const slots: AvailableSlot[] = []

  // Parse start and end times (format: HH:MM:SS)
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  // Create Date objects for the given date
  const currentSlot = new Date(date + 'T00:00:00')
  currentSlot.setHours(startHour, startMinute, 0, 0)

  const endDateTime = new Date(date + 'T00:00:00')
  endDateTime.setHours(endHour, endMinute, 0, 0)

  // Generate slots every 15 minutes (or use duration if smaller)
  const slotInterval = Math.min(15, durationMinutes)

  while (currentSlot.getTime() + durationMinutes * 60000 <= endDateTime.getTime()) {
    const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000)

    // Check if this slot conflicts with any existing appointment
    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.start_time).getTime()
      const aptEnd = new Date(apt.end_time).getTime()
      const slotStart = currentSlot.getTime()
      const slotEndTime = slotEnd.getTime()

      // Check for overlap
      return (
        (slotStart >= aptStart && slotStart < aptEnd) ||
        (slotEndTime > aptStart && slotEndTime <= aptEnd) ||
        (slotStart <= aptStart && slotEndTime >= aptEnd)
      )
    })

    // Only add slots that don't conflict and are in the future
    const now = new Date()
    if (!hasConflict && currentSlot.getTime() > now.getTime()) {
      slots.push({
        start_time: currentSlot.toISOString(),
        end_time: slotEnd.toISOString(),
      })
    }

    // Move to next slot
    currentSlot.setMinutes(currentSlot.getMinutes() + slotInterval)
  }

  return slots
}

/**
 * Find or create a customer by email
 */
export async function findOrCreateCustomer(
  businessId: string,
  email: string,
  name?: string,
  phone?: string
): Promise<{ id: string }> {
  // Try to find existing customer
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', businessId)
    .eq('email', email)
    .single()

  if (existingCustomer) {
    return existingCustomer
  }

  // Create new customer
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      business_id: businessId,
      email,
      name: name || email.split('@')[0],
      phone: phone || null,
    } as any)
    .select('id')
    .maybeSingle()

  if (error || !newCustomer) {
    console.error('❌ Failed to create customer:', {
      error: error,
      errorDetails: JSON.stringify(error, null, 2),
      businessId,
      email,
      name: name || email.split('@')[0],
    })
    throw new Error(`Failed to create customer: ${error?.message || 'Unknown error'}`)
  }

  return newCustomer
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  businessId: string,
  serviceId: string,
  customerId: string,
  startTime: string,
  notes?: string
): Promise<{ id: string; start_time: string; end_time: string }> {
  // Get business timezone
  const { data: businessData } = await supabase
    .from('businesses')
    .select('timezone')
    .eq('id', businessId)
    .maybeSingle()

  const business: { timezone?: string } | null = businessData as any
  const timezone = business?.timezone || 'America/New_York' // Default timezone if not set

  // Get service duration
  const { data: serviceData } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .maybeSingle()

  const service: { duration_minutes?: number } | null = serviceData as any

  if (!service) {
    throw new Error('Service not found')
  }

  // Calculate end time
  const start = new Date(startTime)
  const end = new Date(start.getTime() + (service.duration_minutes || 30) * 60000)

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      business_id: businessId,
      service_id: serviceId,
      customer_id: customerId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'scheduled',
      customer_notes: notes || null,
      timezone: timezone,
    } as any)
    .select('id, start_time, end_time')
    .maybeSingle()

  if (error || !appointment) {
    console.error('❌ Failed to create appointment:', {
      error: error,
      errorDetails: JSON.stringify(error, null, 2),
      businessId,
      serviceId,
      customerId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      timezone,
    })
    throw new Error(`Failed to create appointment: ${error?.message || 'Unknown error'}`)
  }

  return appointment
}
