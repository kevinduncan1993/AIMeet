import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionLimit } from '@/lib/subscription/limits'
import { PlanType } from '@/lib/stripe/plans'

export async function GET(request: NextRequest) {
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

    // Get business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, subscription_plan')
      .eq('user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get usage for all resource types
    const [conversations, faqs, services] = await Promise.all([
      checkSubscriptionLimit(business.id, 'conversations', business.subscription_plan as PlanType | null),
      checkSubscriptionLimit(business.id, 'faqs', business.subscription_plan as PlanType | null),
      checkSubscriptionLimit(business.id, 'services', business.subscription_plan as PlanType | null),
    ])

    return NextResponse.json({
      conversations: {
        current: conversations.current,
        limit: conversations.limit,
      },
      faqs: {
        current: faqs.current,
        limit: faqs.limit,
      },
      services: {
        current: services.current,
        limit: services.limit,
      },
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
