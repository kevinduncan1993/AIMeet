import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { updateCalendarEvents } from '@/lib/calendar/sync'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: appointmentId } = await params
    const body = await request.json()
    const { newStartTime, newEndTime } = body

    if (!newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: 'New start time and end time are required' },
        { status: 400 }
      )
    }

    // Get appointment details before rescheduling
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:customers(name, email),
        service:services(name, duration_minutes),
        business:businesses(name, email, timezone)
      `)
      .eq('id', appointmentId)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check if already cancelled or completed
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return NextResponse.json(
        { error: `Cannot reschedule ${appointment.status} appointment` },
        { status: 400 }
      )
    }

    // Check if the new time slot is available
    const { data: conflictingAppointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('business_id', appointment.business_id)
      .neq('id', appointmentId)
      .in('status', ['scheduled', 'confirmed'])
      .or(`and(start_time.lte.${newStartTime},end_time.gt.${newStartTime}),and(start_time.lt.${newEndTime},end_time.gte.${newEndTime})`)

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'The selected time slot is not available' },
        { status: 409 }
      )
    }

    // Store old time for email
    const oldStartTime = appointment.start_time

    // Update appointment with new time
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        start_time: newStartTime,
        end_time: newEndTime,
        status: 'scheduled', // Reset to scheduled if it was confirmed
        confirmation_sent_at: null, // Reset confirmation
        reminder_sent_at: null, // Reset reminder
      })
      .eq('id', appointmentId)

    if (updateError) {
      logger.error('Error rescheduling appointment', updateError)
      return NextResponse.json(
        { error: 'Failed to reschedule appointment' },
        { status: 500 }
      )
    }

    // Update calendar events
    updateCalendarEvents(appointment as any, {
      startTime: newStartTime,
      endTime: newEndTime,
    }).catch((error) => {
      logger.error('Failed to update calendar events', error)
      // Don't fail the reschedule if calendar sync fails
    })

    // Format dates for emails
    const oldDate = new Date(oldStartTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: appointment.business.timezone,
    })

    const oldTime = new Date(oldStartTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: appointment.business.timezone,
    })

    const newDate = new Date(newStartTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: appointment.business.timezone,
    })

    const newTime = new Date(newStartTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: appointment.business.timezone,
    })

    // Send rescheduling confirmation email to customer
    if (appointment.customer?.email) {
      await sendEmail({
        to: appointment.customer.email,
        subject: `Appointment Rescheduled - ${appointment.business.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Appointment Rescheduled</h2>
            <p>Hello ${appointment.customer.name},</p>
            <p>Your appointment has been rescheduled.</p>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">Previous Time:</h3>
              <p><strong>Date:</strong> ${oldDate}</p>
              <p><strong>Time:</strong> ${oldTime}</p>
            </div>

            <div style="background-color: #dcfce7; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #065f46;">New Appointment Details:</h3>
              <p><strong>Service:</strong> ${appointment.service.name}</p>
              <p><strong>Date:</strong> ${newDate}</p>
              <p><strong>Time:</strong> ${newTime}</p>
              <p><strong>Duration:</strong> ${appointment.service.duration_minutes} minutes</p>
            </div>

            <p>If you need to make any changes, please contact us at ${appointment.business.email || 'the business'}.</p>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              ${appointment.business.name}
            </p>
          </div>
        `,
      })
    }

    // Send notification to business owner
    if (appointment.business?.email) {
      await sendEmail({
        to: appointment.business.email,
        subject: `Appointment Rescheduled - ${appointment.customer.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Appointment Rescheduled</h2>
            <p>An appointment has been rescheduled.</p>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">Previous Time:</h3>
              <p><strong>Date:</strong> ${oldDate}</p>
              <p><strong>Time:</strong> ${oldTime}</p>
            </div>

            <div style="background-color: #dcfce7; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #065f46;">New Appointment:</h3>
              <p><strong>Customer:</strong> ${appointment.customer.name}</p>
              <p><strong>Email:</strong> ${appointment.customer.email}</p>
              <p><strong>Service:</strong> ${appointment.service.name}</p>
              <p><strong>Date:</strong> ${newDate}</p>
              <p><strong>Time:</strong> ${newTime}</p>
            </div>

            <p>You can view all appointments in your dashboard.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment: {
        id: appointmentId,
        start_time: newStartTime,
        end_time: newEndTime,
      },
    })
  } catch (error) {
    console.error('Error in reschedule appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
