import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const SCOPES = ['https://www.googleapis.com/auth/calendar.events']

/**
 * Create OAuth2 client for Google Calendar
 */
export function getGoogleOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`
  )
}

/**
 * Generate Google Calendar authorization URL
 */
export function getGoogleAuthUrl(userId: string): string {
  const oauth2Client = getGoogleOAuthClient()

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId, // Pass user ID to identify who's connecting
    prompt: 'consent', // Force consent screen to get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function getGoogleTokens(code: string) {
  const oauth2Client = getGoogleOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Set credentials for OAuth client
 */
export function setGoogleCredentials(
  accessToken: string,
  refreshToken?: string
): OAuth2Client {
  const oauth2Client = getGoogleOAuthClient()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  return oauth2Client
}

/**
 * Create a Google Calendar event
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  refreshToken: string,
  event: {
    summary: string
    description?: string
    location?: string
    startTime: string
    endTime: string
    attendees?: string[]
    timezone: string
  }
) {
  const oauth2Client = setGoogleCredentials(accessToken, refreshToken)
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime,
        timeZone: event.timezone,
      },
      end: {
        dateTime: event.endTime,
        timeZone: event.timezone,
      },
      attendees: event.attendees?.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    },
    sendUpdates: 'all',
  })

  return response.data.id
}

/**
 * Update a Google Calendar event
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  event: {
    summary?: string
    description?: string
    location?: string
    startTime?: string
    endTime?: string
    attendees?: string[]
    timezone?: string
  }
) {
  const oauth2Client = setGoogleCredentials(accessToken, refreshToken)
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const updateData: any = {}

  if (event.summary) updateData.summary = event.summary
  if (event.description) updateData.description = event.description
  if (event.location) updateData.location = event.location
  if (event.startTime && event.timezone) {
    updateData.start = {
      dateTime: event.startTime,
      timeZone: event.timezone,
    }
  }
  if (event.endTime && event.timezone) {
    updateData.end = {
      dateTime: event.endTime,
      timeZone: event.timezone,
    }
  }
  if (event.attendees) {
    updateData.attendees = event.attendees.map((email) => ({ email }))
  }

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: updateData,
    sendUpdates: 'all',
  })
}

/**
 * Delete a Google Calendar event
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string
) {
  const oauth2Client = setGoogleCredentials(accessToken, refreshToken)
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
    sendUpdates: 'all',
  })
}

/**
 * Get user's calendar list to verify access
 */
export async function getGoogleCalendarList(
  accessToken: string,
  refreshToken: string
) {
  const oauth2Client = setGoogleCredentials(accessToken, refreshToken)
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const response = await calendar.calendarList.list()
  return response.data.items || []
}

/**
 * Refresh access token using refresh token
 */
export async function refreshGoogleAccessToken(refreshToken: string) {
  const oauth2Client = getGoogleOAuthClient()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials.access_token
}
