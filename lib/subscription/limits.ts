import { PlanType, SUBSCRIPTION_PLANS } from '@/lib/stripe/plans'

/**
 * Check if a business has reached their subscription limit
 */
export async function checkSubscriptionLimit(
  businessId: string,
  limitType: 'conversations' | 'faqs' | 'services',
  planType: PlanType | null
): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  // If no plan, treat as free tier with minimal limits
  const plan = planType ? SUBSCRIPTION_PLANS[planType] : null
  const limit = plan?.limits[limitType] ?? 10 // Free tier: 10 of each

  // Get current usage from database
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  let current = 0

  switch (limitType) {
    case 'conversations': {
      // Count conversations for current month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', startOfMonth.toISOString())

      current = count || 0
      break
    }

    case 'faqs': {
      const { count } = await supabase
        .from('faqs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)

      current = count || 0
      break
    }

    case 'services': {
      const { count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)

      current = count || 0
      break
    }
  }

  // -1 means unlimited
  const allowed = limit === -1 || current < limit

  return {
    allowed,
    current,
    limit,
    message: allowed
      ? undefined
      : `You've reached your ${limitType} limit (${limit}). Upgrade to ${getNextPlan(planType)} for more.`,
  }
}

/**
 * Check if a feature is available for a subscription plan
 */
export function hasFeatureAccess(
  planType: PlanType | null,
  feature: 'calendar_sync' | 'custom_branding' | 'api_access' | 'priority_support' | 'custom_ai'
): boolean {
  if (!planType) return false // Free tier has no premium features

  switch (feature) {
    case 'calendar_sync':
      return planType === 'PROFESSIONAL' || planType === 'ENTERPRISE'

    case 'custom_branding':
      return planType === 'PROFESSIONAL' || planType === 'ENTERPRISE'

    case 'api_access':
      return planType === 'ENTERPRISE'

    case 'priority_support':
      return planType === 'PROFESSIONAL' || planType === 'ENTERPRISE'

    case 'custom_ai':
      return planType === 'ENTERPRISE'

    default:
      return false
  }
}

/**
 * Get the next plan recommendation for upgrade
 */
function getNextPlan(currentPlan: PlanType | null): string {
  if (!currentPlan) return 'Starter'
  if (currentPlan === 'STARTER') return 'Professional'
  if (currentPlan === 'PROFESSIONAL') return 'Enterprise'
  return 'Enterprise'
}

/**
 * Get human-readable plan name
 */
export function getPlanName(planType: PlanType | null): string {
  if (!planType) return 'Free'
  return SUBSCRIPTION_PLANS[planType].name
}

/**
 * Check if user can create a new resource
 */
export async function canCreateResource(
  businessId: string,
  resourceType: 'conversations' | 'faqs' | 'services',
  planType: PlanType | null
): Promise<{ allowed: boolean; message?: string }> {
  const result = await checkSubscriptionLimit(businessId, resourceType, planType)

  return {
    allowed: result.allowed,
    message: result.message,
  }
}
