import { NextRequest, NextResponse } from 'next/server'
import { stripe, SUBSCRIPTION_PLANS, PlanType } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { stripeCheckoutSchema, safeValidateRequest } from '@/lib/validation/schemas'

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

    const body = await request.json()

    // Validate request body
    const validation = safeValidateRequest(body, stripeCheckoutSchema)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { planType } = validation.data

    const plan = SUBSCRIPTION_PLANS[planType]

    // Get or create Stripe customer
    let customerId: string | undefined

    // Check if user already has a Stripe customer ID
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (business?.stripe_customer_id) {
      customerId = business.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to database
      await supabase
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Create checkout session with 3-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          userId: user.id,
          planType,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?trial=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user.id,
        planType,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
