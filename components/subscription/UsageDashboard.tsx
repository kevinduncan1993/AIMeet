'use client'

import { useEffect, useState } from 'react'
import { PlanType, SUBSCRIPTION_PLANS } from '@/lib/stripe/plans'

interface UsageData {
  conversations: { current: number; limit: number }
  faqs: { current: number; limit: number }
  services: { current: number; limit: number }
}

interface UsageDashboardProps {
  planType: PlanType | null
  businessId: string
}

export default function UsageDashboard({ planType, businessId }: UsageDashboardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsage()
  }, [businessId])

  const fetchUsage = async () => {
    try {
      const response = await fetch(`/api/usage?businessId=${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !usage) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const plan = planType ? SUBSCRIPTION_PLANS[planType] : null
  const planName = plan?.name || 'Free'

  const getPercentage = (current: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((current / limit) * 100, 100)
  }

  const getColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-indigo-600'
  }

  const UsageBar = ({ label, current, limit, icon }: { label: string; current: number; limit: number; icon: string }) => {
    const percentage = getPercentage(current, limit)
    const color = getColor(percentage)
    const isUnlimited = limit === -1

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-700 font-medium">
            <span>{icon}</span>
            {label}
          </span>
          <span className="text-gray-600">
            {current} / {isUnlimited ? '∞' : limit}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-300 rounded-full`}
            style={{ width: isUnlimited ? '100%' : `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Current Usage</h3>
          <p className="text-sm text-gray-600 mt-1">
            {planName} Plan
          </p>
        </div>
        {planType && (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
            {planName}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <UsageBar
          label="Conversations (this month)"
          current={usage.conversations.current}
          limit={usage.conversations.limit}
          icon="💬"
        />
        <UsageBar
          label="Knowledge Base Articles"
          current={usage.faqs.current}
          limit={usage.faqs.limit}
          icon="📚"
        />
        <UsageBar
          label="Services"
          current={usage.services.current}
          limit={usage.services.limit}
          icon="⚙️"
        />
      </div>

      {!planType && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            You're on the free plan. Upgrade to remove limits and unlock premium features.
          </p>
        </div>
      )}
    </div>
  )
}
