import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMicrosoftTokens } from '@/lib/calendar/microsoft'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // user_id
    const error = searchParams.get('error')

    if (error) {
      logger.warn('Microsoft Calendar OAuth error', { error })
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
    const tokens = await getMicrosoftTokens(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Microsoft')
    }

    // Calculate token expiration
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in)

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

    // Update business with Microsoft Calendar credentials
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        microsoft_access_token: tokens.access_token,
        microsoft_refresh_token: tokens.refresh_token,
        microsoft_token_expires_at: expiresAt.toISOString(),
      })
      .eq('id', business.id)

    if (updateError) {
      logger.error('Failed to save Microsoft Calendar tokens', updateError)
      throw updateError
    }

    logger.info('Microsoft Calendar connected successfully', { userId, businessId: business.id })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?calendar_connected=microsoft`
    )
  } catch (error) {
    logger.error('Error in Microsoft Calendar OAuth callback', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?calendar_error=oauth_failed`
    )
  }
}
