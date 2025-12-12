'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/plans'

export default function PaywallPage() {
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user already has a subscription
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/business/current')
      if (response.ok) {
        const business = await response.json()
        // If they have an active subscription, redirect to dashboard
        if (business.subscription_status === 'active' || business.subscription_status === 'trialing') {
          router.push('/dashboard')
          return
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleStartTrial = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: 'STARTER' }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error starting trial:', error)
      alert('Failed to start trial. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const starterPlan = SUBSCRIPTION_PLANS.STARTER

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Start Your Free Trial
          </h1>
          <p className="text-xl text-gray-600">
            Get full access to AIMeet for 3 days, completely free
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-indigo-100">
          {/* Trial Banner */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 mb-8 text-center">
            <div className="text-6xl font-bold mb-2">3 Days</div>
            <div className="text-xl">Absolutely Free Trial</div>
            <div className="text-indigo-100 text-sm mt-2">
              No credit card charged during trial • Cancel anytime
            </div>
          </div>

          {/* Features */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              What's included in your trial:
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {starterPlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5"
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
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Info */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 font-medium">After trial ends:</span>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  ${starterPlan.price}
                </div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
            </div>
            <div className="text-sm text-gray-600 border-t border-gray-200 pt-4">
              ✓ You'll be billed ${starterPlan.price}/month after your 3-day trial
              <br />
              ✓ Cancel anytime before trial ends - no charge
              <br />
              ✓ Continue seamlessly if you love it
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                Processing...
              </span>
            ) : (
              <>Start My Free 3-Day Trial</>
            )}
          </button>

          {/* Trust Indicators */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No Setup Fees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By starting your trial, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
