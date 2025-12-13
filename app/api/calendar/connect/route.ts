import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleAuthUrl } from '@/lib/calendar/google'
import { getMicrosoftAuthUrl } from '@/lib/calendar/microsoft'

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

    // Generate authorization URL
    let authUrl: string

    if (provider === 'google') {
      authUrl = getGoogleAuthUrl(user.id)
    } else {
      authUrl = getMicrosoftAuthUrl(user.id)
    }

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating calendar auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}
