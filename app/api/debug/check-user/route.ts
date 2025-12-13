import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Temporary debug endpoint - remove before production
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  // Get user data from Supabase auth (requires service role)
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const user = data.users.find(u => u.email === email)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    email: user.email,
    confirmed: user.email_confirmed_at !== null,
    confirmedAt: user.email_confirmed_at,
    createdAt: user.created_at,
    lastSignIn: user.last_sign_in_at,
  })
}
