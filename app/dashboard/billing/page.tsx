'use client'

import { useState, useEffect } from 'react'
import { SUBSCRIPTION_PLANS, PlanType } from '@/lib/stripe/plans'
import { loadStripe } from '@stripe/stripe-js'
import UsageDashboard from '@/components/subscription/UsageDashboard'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface BusinessData {
  id: string
  subscription_plan: PlanType | null
  subscription_status: string | null
  stripe_customer_id: string | null
}

export default function BillingPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchBusinessData()
  }, [])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch('/api/business/current')
      if (response.ok) {
        const data = await response.json()
        setBusiness(data)
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async (planType: PlanType) => {
    setCheckoutLoading(planType)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      alert('Failed to open billing portal. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const currentPlan = business?.subscription_plan
  const isActive = business?.subscription_status === 'active'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Usage Dashboard */}
      {business && (
        <div className="mb-8">
          <UsageDashboard planType={currentPlan ?? null} businessId={business.id} />
        </div>
      )}

      {/* Current Plan Card */}
      {currentPlan && isActive && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Current Plan</p>
              <h2 className="text-2xl font-bold mt-1">
                {SUBSCRIPTION_PLANS[currentPlan].name}
              </h2>
              <p className="text-indigo-100 mt-2">
                ${SUBSCRIPTION_PLANS[currentPlan].price}/month
              </p>
            </div>
            <button
              onClick={handleManageSubscription}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(SUBSCRIPTION_PLANS) as PlanType[]).map((planKey) => {
          const plan = SUBSCRIPTION_PLANS[planKey]
          const isCurrent = currentPlan === planKey && isActive

          return (
            <div
              key={planKey}
              className={`rounded-lg border-2 p-6 ${
                isCurrent
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-300 transition-colors'
              }`}
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="ml-2 text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(planKey)}
                disabled={isCurrent || checkoutLoading !== null}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  isCurrent
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                }`}
              >
                {checkoutLoading === planKey ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading...
                  </span>
                ) : isCurrent ? (
                  'Current Plan'
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Can I change my plan anytime?
            </h4>
            <p className="text-sm text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes take
              effect immediately and are prorated.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              What payment methods do you accept?
            </h4>
            <p className="text-sm text-gray-600">
              We accept all major credit cards (Visa, Mastercard, American Express)
              through our secure payment processor, Stripe.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Can I cancel my subscription?
            </h4>
            <p className="text-sm text-gray-600">
              Yes, you can cancel anytime through the billing portal. You&apos;ll retain
              access until the end of your current billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
