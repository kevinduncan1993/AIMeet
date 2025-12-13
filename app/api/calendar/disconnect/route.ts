import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider } = await request.json()

    if (!provider || !['google', 'microsoft'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "google" or "microsoft"' },
        { status: 400 }
      )
    }

    // Get business for this user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Remove calendar credentials
    const updateData =
      provider === 'google'
        ? {
            google_access_token: null,
            google_refresh_token: null,
            google_token_expires_at: null,
          }
        : {
            microsoft_access_token: null,
            microsoft_refresh_token: null,
            microsoft_token_expires_at: null,
          }

    const { error: updateError } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', business.id)

    if (updateError) {
      logger.error('Failed to disconnect calendar', updateError)
      throw updateError
    }

    logger.info('Calendar disconnected successfully', {
      userId: user.id,
      businessId: business.id,
      provider,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error disconnecting calendar', error)
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 }
    )
  }
}
