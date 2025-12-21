import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the first business's widget key
    const { data: business, error } = await (supabase
      .from('businesses') as any)
      .select('widget_key, name')
      .limit(1)
      .maybeSingle()

    if (error || !business) {
      return NextResponse.json({
        message: 'No businesses found. Please sign up first at /auth/signup',
        signupUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup`,
      })
    }

    return NextResponse.json({
      widgetKey: business.widget_key,
      businessName: business.name,
      embedUrl: `${process.env.NEXT_PUBLIC_APP_URL}/embed?key=${business.widget_key}`,
      testInstructions: {
        step1: 'Copy the embedUrl below',
        step2: 'Open it in your browser',
        step3: 'Try chatting with the AI assistant',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get test widget key' }, { status: 500 })
  }
}
