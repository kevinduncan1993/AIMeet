import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { deleteCalendarEvents } from '@/lib/calendar/sync'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: appointmentId } = await params
    const body = await request.json()
    const { cancelledBy, reason } = body // 'customer' or 'business'

    // Get appointment details before canceling
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

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      )
    }

    // Update appointment status to cancelled
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        internal_notes: reason
          ? `Cancelled by ${cancelledBy}: ${reason}`
          : `Cancelled by ${cancelledBy}`,
      })
      .eq('id', appointmentId)

    if (updateError) {
      logger.error('Error cancelling appointment', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel appointment' },
        { status: 500 }
      )
    }

    // Delete calendar events
    deleteCalendarEvents(appointment as any).catch((error) => {
      logger.error('Failed to delete calendar events', error)
      // Don't fail the cancellation if calendar deletion fails
    })

    // Send cancellation emails
    const appointmentDate = new Date(appointment.start_time).toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: appointment.business.timezone,
      }
    )

    const appointmentTime = new Date(appointment.start_time).toLocaleTimeString(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: appointment.business.timezone,
      }
    )

    // Email to customer
    if (cancelledBy === 'business' && appointment.customer?.email) {
      await sendEmail({
        to: appointment.customer.email,
        subject: `Appointment Cancelled - ${appointment.business.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Appointment Cancelled</h2>
            <p>Hello ${appointment.customer.name},</p>
            <p>Your appointment has been cancelled.</p>

            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #991b1b;">Cancelled Appointment Details:</h3>
              <p><strong>Service:</strong> ${appointment.service.name}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>

            <p>If you have any questions, please contact us at ${appointment.business.email || 'the business'}.</p>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              ${appointment.business.name}
            </p>
          </div>
        `,
      })
    }

    // Email to business owner
    if (cancelledBy === 'customer' && appointment.business?.email) {
      await sendEmail({
        to: appointment.business.email,
        subject: `Appointment Cancelled by Customer - ${appointment.customer.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Appointment Cancelled</h2>
            <p>A customer has cancelled their appointment.</p>

            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #991b1b;">Cancelled Appointment:</h3>
              <p><strong>Customer:</strong> ${appointment.customer.name}</p>
              <p><strong>Email:</strong> ${appointment.customer.email}</p>
              <p><strong>Service:</strong> ${appointment.service.name}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>

            <p>You can view all appointments in your dashboard.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
    })
  } catch (error) {
    console.error('Error in cancel appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
