import { NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/scheduling/availability'

export async function GET() {
  try {
    const businessId = '9527b5a9-8067-42a6-8222-daad28ff9649'
    const serviceId = '437d554a-eca1-41f1-9b92-8ad05eebaa49'
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    console.log('Testing availability for:', { businessId, serviceId, date: tomorrowStr })

    const slots = await getAvailableSlots(businessId, serviceId, tomorrowStr)

    return NextResponse.json({
      success: true,
      businessId,
      serviceId,
      date: tomorrowStr,
      slotsFound: slots.length,
      slots: slots.map(slot => ({
        start: slot.start_time,
        end: slot.end_time,
      })),
    })
  } catch (error) {
    console.error('Test availability error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
