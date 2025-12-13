import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/scheduling/availability'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')

    if (!businessId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const slots = await getAvailableSlots(businessId, serviceId, date)

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    )
  }
}
