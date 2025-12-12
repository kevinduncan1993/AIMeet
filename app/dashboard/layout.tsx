'use client'

import { useBusiness } from '@/lib/hooks/useBusiness'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { business, loading } = useBusiness()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Check subscription status and redirect to paywall if needed
  useEffect(() => {
    if (!loading && business) {
      const subscriptionStatus = business.subscription_status
      const hasActiveSubscription =
        subscriptionStatus === 'active' ||
        subscriptionStatus === 'trialing'

      // Redirect to paywall if no active subscription (except on billing page)
      if (!hasActiveSubscription && pathname !== '/dashboard/billing') {
        router.push('/paywall')
      }
    }
  }, [business, loading, pathname, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: '📊' },
    { name: 'Appointments', href: '/dashboard/appointments', icon: '📅' },
    { name: 'Services', href: '/dashboard/services', icon: '⚙️' },
    { name: 'Business Hours', href: '/dashboard/hours', icon: '🕐' },
    { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: '📚' },
    { name: 'Conversations', href: '/dashboard/conversations', icon: '💬' },
    { name: 'Billing', href: '/dashboard/billing', icon: '💳' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-indigo-600">AIMeet</h1>
            {business && (
              <p className="text-sm text-gray-600 mt-1 truncate">{business.name}</p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
