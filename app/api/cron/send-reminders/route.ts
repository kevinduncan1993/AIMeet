import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { sendEmail } from '@/lib/email/resend'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Send appointment reminders for appointments happening in the next 24 hours
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
 *
 * To set up Vercel Cron:
 * 1. Create vercel.json in project root with:
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-reminders",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get appointments scheduled for the next 24 hours that haven't had reminders sent
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:customers(name, email, phone),
        service:services(name, duration_minutes),
        business:businesses(name, email, phone, timezone)
      `)
      .gte('start_time', now.toISOString())
      .lte('start_time', tomorrow.toISOString())
      .in('status', ['scheduled', 'confirmed'])
      .is('reminder_sent_at', null)

    if (fetchError) {
      console.error('Error fetching appointments for reminders:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments need reminders',
        count: 0,
      })
    }

    console.log(`📧 Sending reminders for ${appointments.length} appointments`)

    let successCount = 0
    let failureCount = 0

    // Send reminders
    for (const appointment of appointments) {
      try {
        if (!appointment.customer?.email) {
          console.warn(`⚠️ Skipping appointment ${appointment.id} - no customer email`)
          failureCount++
          continue
        }

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

        const managementUrl = `${process.env.NEXT_PUBLIC_APP_URL}/appointments/${appointment.id}`

        // Send reminder email
        await sendEmail({
          to: appointment.customer.email,
          subject: `Reminder: Your appointment tomorrow with ${appointment.business.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Appointment Reminder</h1>
              </div>

              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi ${appointment.customer.name},</p>

                <p style="font-size: 16px; margin-bottom: 20px;">
                  This is a friendly reminder about your upcoming appointment with <strong>${appointment.business.name}</strong>.
                </p>

                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                  <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">Appointment Details</h2>

                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; font-weight: bold; width: 120px;">Service:</td>
                      <td style="padding: 10px 0;">${appointment.service.name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; font-weight: bold;">Date:</td>
                      <td style="padding: 10px 0;">${appointmentDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; font-weight: bold;">Time:</td>
                      <td style="padding: 10px 0;">${appointmentTime}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; font-weight: bold;">Duration:</td>
                      <td style="padding: 10px 0;">${appointment.service.duration_minutes} minutes</td>
                    </tr>
                  </table>
                </div>

                ${appointment.business.address ? `
                <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px;">
                    <strong>📍 Location:</strong><br>
                    ${appointment.business.address}
                    ${appointment.business.city ? `, ${appointment.business.city}` : ''}
                    ${appointment.business.state ? `, ${appointment.business.state}` : ''}
                  </p>
                </div>
                ` : ''}

                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px;">
                    <strong>⏰ Please arrive 5-10 minutes early</strong><br>
                    ${appointment.business.phone ? `Questions? Call us at ${appointment.business.phone}` : ''}
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${managementUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin-right: 10px;">
                    View Details
                  </a>
                  <a href="${managementUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Cancel/Reschedule
                  </a>
                </div>

                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  We look forward to seeing you!
                </p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
                  <p>This is an automated reminder from ${appointment.business.name}</p>
                </div>
              </div>
            </div>
          `,
        })

        // Update reminder_sent_at timestamp
        await supabase
          .from('appointments')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', appointment.id)

        console.log(`✅ Reminder sent for appointment ${appointment.id}`)
        successCount++
      } catch (error) {
        console.error(`❌ Failed to send reminder for appointment ${appointment.id}:`, error)
        failureCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} reminders, ${failureCount} failed`,
      successCount,
      failureCount,
      total: appointments.length,
    })
  } catch (error) {
    console.error('Error in send-reminders cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
