import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: appointmentId } = await params

    // Get appointment details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:customers(id, name, email, phone),
        service:services(id, name, description, duration_minutes, price),
        business:businesses(id, name, email, phone, timezone, address, city, state)
      `)
      .eq('id', appointmentId)
      .single()

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
