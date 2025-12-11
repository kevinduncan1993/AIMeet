import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface AppointmentEmailData {
  customerName: string
  customerEmail: string
  businessName: string
  serviceName: string
  appointmentTime: string
  appointmentDate: string
  duration: number
}

/**
 * Send appointment confirmation email to customer
 */
export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  try {
    const { customerName, customerEmail, businessName, serviceName, appointmentTime, appointmentDate, duration } = data

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Confirmed!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Your appointment with <strong>${businessName}</strong> has been confirmed!
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">Appointment Details</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-weight: bold; width: 120px;">Service:</td>
          <td style="padding: 10px 0;">${serviceName}</td>
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
          <td style="padding: 10px 0;">${duration} minutes</td>
        </tr>
      </table>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>⏰ Please arrive 5-10 minutes early</strong><br>
        If you need to reschedule or cancel, please contact us as soon as possible.
      </p>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Thank you for choosing ${businessName}. We look forward to seeing you!
    </p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
      <p>This is an automated confirmation email from ${businessName}</p>
    </div>
  </div>
</body>
</html>
    `

    const emailText = `
Appointment Confirmation

Hi ${customerName},

Your appointment with ${businessName} has been confirmed!

APPOINTMENT DETAILS:
- Service: ${serviceName}
- Date: ${appointmentDate}
- Time: ${appointmentTime}
- Duration: ${duration} minutes

Please arrive 5-10 minutes early. If you need to reschedule or cancel, please contact us as soon as possible.

Thank you for choosing ${businessName}. We look forward to seeing you!
    `

    await resend.emails.send({
      from: `${businessName} <onboarding@resend.dev>`,
      to: [customerEmail],
      subject: `Appointment Confirmed - ${appointmentDate} at ${appointmentTime}`,
      html: emailHtml,
      text: emailText,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send appointment confirmation email:', error)
    return { success: false, error }
  }
}

/**
 * Send appointment notification to business owner
 */
export async function sendBusinessNotification(
  businessEmail: string,
  data: AppointmentEmailData
) {
  try {
    const { customerName, customerEmail, serviceName, appointmentTime, appointmentDate } = data

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Appointment Booked</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #667eea;">New Appointment Booked</h2>

  <p>A new appointment has been scheduled:</p>

  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
    <table style="width: 100%;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Customer:</td>
        <td style="padding: 8px 0;">${customerName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Email:</td>
        <td style="padding: 8px 0;">${customerEmail}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Service:</td>
        <td style="padding: 8px 0;">${serviceName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
        <td style="padding: 8px 0;">${appointmentDate} at ${appointmentTime}</td>
      </tr>
    </table>
  </div>
</body>
</html>
    `

    await resend.emails.send({
      from: 'AIMeet Notifications <onboarding@resend.dev>',
      to: [businessEmail],
      subject: `New Appointment: ${customerName} - ${appointmentDate}`,
      html: emailHtml,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send business notification email:', error)
    return { success: false, error }
  }
}
