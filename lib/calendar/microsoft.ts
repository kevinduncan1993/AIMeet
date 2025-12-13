/**
 * Microsoft Graph API (Outlook Calendar) integration
 */

const SCOPES = ['Calendars.ReadWrite', 'offline_access']

interface MicrosoftTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

/**
 * Generate Microsoft OAuth authorization URL
 */
export function getMicrosoftAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/microsoft/callback`,
    response_mode: 'query',
    scope: SCOPES.join(' '),
    state: userId,
  })

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function getMicrosoftTokens(code: string): Promise<MicrosoftTokens> {
  const response = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/microsoft/callback`,
        grant_type: 'authorization_code',
      }),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens')
  }

  return await response.json()
}

/**
 * Refresh Microsoft access token
 */
export async function refreshMicrosoftAccessToken(
  refreshToken: string
): Promise<string> {
  const response = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Create a Microsoft Calendar event
 */
export async function createMicrosoftCalendarEvent(
  accessToken: string,
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
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/calendar/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: event.summary,
        body: {
          contentType: 'HTML',
          content: event.description || '',
        },
        location: {
          displayName: event.location || '',
        },
        start: {
          dateTime: event.startTime,
          timeZone: event.timezone,
        },
        end: {
          dateTime: event.endTime,
          timeZone: event.timezone,
        },
        attendees: event.attendees?.map((email) => ({
          emailAddress: {
            address: email,
          },
          type: 'required',
        })),
        reminderMinutesBeforeStart: 60,
        isReminderOn: true,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create event: ${error}`)
  }

  const data = await response.json()
  return data.id
}

/**
 * Update a Microsoft Calendar event
 */
export async function updateMicrosoftCalendarEvent(
  accessToken: string,
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
  const updateData: any = {}

  if (event.summary) updateData.subject = event.summary
  if (event.description) {
    updateData.body = {
      contentType: 'HTML',
      content: event.description,
    }
  }
  if (event.location) {
    updateData.location = { displayName: event.location }
  }
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
    updateData.attendees = event.attendees.map((email) => ({
      emailAddress: { address: email },
      type: 'required',
    }))
  }

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendar/events/${eventId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to update event: ${error}`)
  }
}

/**
 * Delete a Microsoft Calendar event
 */
export async function deleteMicrosoftCalendarEvent(
  accessToken: string,
  eventId: string
) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendar/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to delete event')
  }
}

/**
 * Get user's calendars to verify access
 */
export async function getMicrosoftCalendarList(accessToken: string) {
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/calendars',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get calendar list')
  }

  const data = await response.json()
  return data.value || []
}
