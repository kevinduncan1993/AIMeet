import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  refreshGoogleAccessToken,
} from './google'
import {
  createMicrosoftCalendarEvent,
  updateMicrosoftCalendarEvent,
  deleteMicrosoftCalendarEvent,
  refreshMicrosoftAccessToken,
} from './microsoft'
import { logger } from '@/lib/logger'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AppointmentData {
  id: string
  business_id: string
  start_time: string
  end_time: string
  google_event_id?: string | null
  microsoft_event_id?: string | null
  customer: {
    name: string
    email: string
  }
  service: {
    name: string
  }
  business: {
    name: string
    address?: string | null
    timezone: string
    google_access_token?: string | null
    google_refresh_token?: string | null
    microsoft_access_token?: string | null
    microsoft_refresh_token?: string | null
  }
}

/**
 * Sync appointment to connected calendars (create event)
 */
export async function syncAppointmentToCalendars(appointment: AppointmentData) {
  const results = {
    google: { success: false, eventId: null as string | null, error: null as any },
    microsoft: { success: false, eventId: null as string | null, error: null as any },
  }

  // Prepare event data
  const eventData = {
    summary: `${appointment.service.name} - ${appointment.customer.name}`,
    description: `Appointment with ${appointment.customer.name} (${appointment.customer.email}) for ${appointment.service.name}`,
    location: appointment.business.address || undefined,
    startTime: appointment.start_time,
    endTime: appointment.end_time,
    attendees: [appointment.customer.email],
    timezone: appointment.business.timezone,
  }

  // Sync to Google Calendar
  if (
    appointment.business.google_access_token &&
    appointment.business.google_refresh_token
  ) {
    try {
      const eventId = await createGoogleCalendarEvent(
        appointment.business.google_access_token,
        appointment.business.google_refresh_token,
        eventData
      )

      results.google.success = true
      results.google.eventId = eventId

      // Save event ID to database
      await supabase
        .from('appointments')
        .update({ google_event_id: eventId })
        .eq('id', appointment.id)

      logger.info('Synced appointment to Google Calendar', {
        appointmentId: appointment.id,
        eventId,
      })
    } catch (error: any) {
      results.google.error = error
      logger.error('Failed to sync to Google Calendar', error, {
        appointmentId: appointment.id,
      })

      // If access token expired, try to refresh
      if (error.message?.includes('invalid_grant') || error.code === 401) {
        try {
          const newAccessToken = await refreshGoogleAccessToken(
            appointment.business.google_refresh_token!
          )

          await supabase
            .from('businesses')
            .update({ google_access_token: newAccessToken })
            .eq('id', appointment.business_id)

          logger.info('Refreshed Google access token')
        } catch (refreshError) {
          logger.error('Failed to refresh Google access token', refreshError)
        }
      }
    }
  }

  // Sync to Microsoft Calendar
  if (
    appointment.business.microsoft_access_token &&
    appointment.business.microsoft_refresh_token
  ) {
    try {
      const eventId = await createMicrosoftCalendarEvent(
        appointment.business.microsoft_access_token,
        eventData
      )

      results.microsoft.success = true
      results.microsoft.eventId = eventId

      // Save event ID to database
      await supabase
        .from('appointments')
        .update({ microsoft_event_id: eventId })
        .eq('id', appointment.id)

      logger.info('Synced appointment to Microsoft Calendar', {
        appointmentId: appointment.id,
        eventId,
      })
    } catch (error: any) {
      results.microsoft.error = error
      logger.error('Failed to sync to Microsoft Calendar', error, {
        appointmentId: appointment.id,
      })

      // If access token expired, try to refresh
      if (error.message?.includes('InvalidAuthenticationToken') || error.code === 401) {
        try {
          const newAccessToken = await refreshMicrosoftAccessToken(
            appointment.business.microsoft_refresh_token!
          )

          await supabase
            .from('businesses')
            .update({ microsoft_access_token: newAccessToken })
            .eq('id', appointment.business_id)

          logger.info('Refreshed Microsoft access token')
        } catch (refreshError) {
          logger.error('Failed to refresh Microsoft access token', refreshError)
        }
      }
    }
  }

  return results
}

/**
 * Update calendar events when appointment is rescheduled
 */
export async function updateCalendarEvents(
  appointment: AppointmentData,
  updates: {
    startTime?: string
    endTime?: string
    summary?: string
  }
) {
  const results = {
    google: { success: false, error: null as any },
    microsoft: { success: false, error: null as any },
  }

  // Update Google Calendar event
  if (
    appointment.google_event_id &&
    appointment.business.google_access_token &&
    appointment.business.google_refresh_token
  ) {
    try {
      await updateGoogleCalendarEvent(
        appointment.business.google_access_token,
        appointment.business.google_refresh_token,
        appointment.google_event_id,
        {
          startTime: updates.startTime,
          endTime: updates.endTime,
          summary: updates.summary,
          timezone: appointment.business.timezone,
        }
      )

      results.google.success = true
      logger.info('Updated Google Calendar event', {
        appointmentId: appointment.id,
        eventId: appointment.google_event_id,
      })
    } catch (error) {
      results.google.error = error
      logger.error('Failed to update Google Calendar event', error)
    }
  }

  // Update Microsoft Calendar event
  if (
    appointment.microsoft_event_id &&
    appointment.business.microsoft_access_token
  ) {
    try {
      await updateMicrosoftCalendarEvent(
        appointment.business.microsoft_access_token,
        appointment.microsoft_event_id,
        {
          startTime: updates.startTime,
          endTime: updates.endTime,
          summary: updates.summary,
          timezone: appointment.business.timezone,
        }
      )

      results.microsoft.success = true
      logger.info('Updated Microsoft Calendar event', {
        appointmentId: appointment.id,
        eventId: appointment.microsoft_event_id,
      })
    } catch (error) {
      results.microsoft.error = error
      logger.error('Failed to update Microsoft Calendar event', error)
    }
  }

  return results
}

/**
 * Delete calendar events when appointment is cancelled
 */
export async function deleteCalendarEvents(appointment: AppointmentData) {
  const results = {
    google: { success: false, error: null as any },
    microsoft: { success: false, error: null as any },
  }

  // Delete from Google Calendar
  if (
    appointment.google_event_id &&
    appointment.business.google_access_token &&
    appointment.business.google_refresh_token
  ) {
    try {
      await deleteGoogleCalendarEvent(
        appointment.business.google_access_token,
        appointment.business.google_refresh_token,
        appointment.google_event_id
      )

      results.google.success = true
      logger.info('Deleted Google Calendar event', {
        appointmentId: appointment.id,
        eventId: appointment.google_event_id,
      })
    } catch (error) {
      results.google.error = error
      logger.error('Failed to delete Google Calendar event', error)
    }
  }

  // Delete from Microsoft Calendar
  if (
    appointment.microsoft_event_id &&
    appointment.business.microsoft_access_token
  ) {
    try {
      await deleteMicrosoftCalendarEvent(
        appointment.business.microsoft_access_token,
        appointment.microsoft_event_id
      )

      results.microsoft.success = true
      logger.info('Deleted Microsoft Calendar event', {
        appointmentId: appointment.id,
        eventId: appointment.microsoft_event_id,
      })
    } catch (error) {
      results.microsoft.error = error
      logger.error('Failed to delete Microsoft Calendar event', error)
    }
  }

  return results
}
