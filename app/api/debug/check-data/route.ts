import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check businesses
    const { data: businesses, error: bizError } = await (supabase
      .from('businesses') as any)
      .select('id, name, email, widget_key, created_at')
      .limit(10)

    // Check services
    const { data: services, error: servError } = await (supabase
      .from('services') as any)
      .select('id, name, description, duration_minutes, price, business_id, is_active')
      .limit(10)

    // Check business hours
    const { data: hours, error: hoursError } = await (supabase
      .from('business_hours') as any)
      .select('id, business_id, day_of_week, start_time, end_time, is_active')
      .limit(10)

    // Check FAQs
    const { data: faqs, error: faqsError } = await (supabase
      .from('faqs') as any)
      .select('id, business_id, question, answer')
      .limit(10)

    // Check users
    const { data: users, error: usersError } = await (supabase
      .from('users') as any)
      .select('id, email, full_name, created_at')
      .limit(10)

    return NextResponse.json({
      summary: {
        businesses: businesses?.length || 0,
        services: services?.length || 0,
        businessHours: hours?.length || 0,
        faqs: faqs?.length || 0,
        users: users?.length || 0,
      },
      data: {
        businesses: businesses || [],
        services: services || [],
        businessHours: hours || [],
        faqs: faqs || [],
        users: users || [],
      },
      errors: {
        bizError,
        servError,
        hoursError,
        faqsError,
        usersError,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check data', details: error }, { status: 500 })
  }
}
