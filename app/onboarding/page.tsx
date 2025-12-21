'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PlanType } from '@/lib/stripe/plans'

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const initiateTrial = async () => {
      try {
        // Get plan from URL or localStorage
        const planFromUrl = searchParams.get('plan') as PlanType
        const planFromStorage = localStorage.getItem('selectedPlan') as PlanType
        const selectedPlan = planFromUrl || planFromStorage || 'STARTER'

        // Clean up localStorage
        localStorage.removeItem('selectedPlan')

        // Create Stripe checkout session
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planType: selectedPlan }),
        })

        if (!response.ok) {
          throw new Error('Failed to create checkout session')
        }

        const { url } = await response.json()

        if (url) {
          // Redirect to Stripe checkout
          window.location.href = url
        } else {
          throw new Error('No checkout URL returned')
        }
      } catch (err) {
        console.error('Error initiating trial:', err)
        setError('Failed to start your trial. Please try again.')
        setLoading(false)
      }
    }

    initiateTrial()
  }, [searchParams])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard/billing')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Go to Billing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Setting up your trial...
        </h1>
        <p className="text-gray-600">
          We&apos;re redirecting you to complete your subscription setup.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          This will only take a moment
        </p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Loading...
            </h1>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}
