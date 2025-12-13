import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleTokens } from '@/lib/calendar/google'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // user_id
    const error = searchParams.get('error')

    if (error) {
      logger.warn('Google Calendar OAuth error', { error })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?calendar_error=${error}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?calendar_error=missing_params`
      )
    }

    const userId = state

    // Exchange code for tokens
    const tokens = await getGoogleTokens(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google')
    }

    // Save tokens to database
    const supabase = await createClient()

    // Get business for this user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (businessError || !business) {
      logger.error('Failed to find business for user', businessError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?calendar_error=business_not_found`
      )
    }

    // Update business with Google Calendar credentials
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
      })
      .eq('id', business.id)

    if (updateError) {
      logger.error('Failed to save Google Calendar tokens', updateError)
      throw updateError
    }

    logger.info('Google Calendar connected successfully', { userId, businessId: business.id })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?calendar_connected=google`
    )
  } catch (error) {
    logger.error('Error in Google Calendar OAuth callback', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?calendar_error=oauth_failed`
    )
  }
}
