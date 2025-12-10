'use client'

import { useBusiness } from '@/lib/hooks/useBusiness'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const { business } = useBusiness()
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalConversations: 0,
    activeServices: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      if (!business) return

      try {
        // Fetch stats in parallel
        const [appointments, todayAppts, conversations, services] = await Promise.all([
          supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', business.id),
          supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', business.id)
            .gte('start_time', new Date().toISOString().split('T')[0]),
          supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', business.id),
          supabase
            .from('services')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', business.id)
            .eq('is_active', true),
        ])

        setStats({
          totalAppointments: appointments.count || 0,
          todayAppointments: todayAppts.count || 0,
          totalConversations: conversations.count || 0,
          activeServices: services.count || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [business, supabase])

  if (!business) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome to AIMeet
        </h1>
        <p className="text-gray-600">Loading your business...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back!
        </h1>
        <p className="text-gray-600">
          Here&apos;s what&apos;s happening with {business.name} today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Total Appointments
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalAppointments}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Today's Appointments
          </div>
          <div className="text-3xl font-bold text-indigo-600">
            {stats.todayAppointments}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Conversations
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalConversations}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Active Services
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.activeServices}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/services"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-semibold text-gray-900">Add Service</div>
            <div className="text-sm text-gray-600">Create a new service offering</div>
          </a>

          <a
            href="/dashboard/hours"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition"
          >
            <div className="text-2xl mb-2">🕐</div>
            <div className="font-semibold text-gray-900">Set Hours</div>
            <div className="text-sm text-gray-600">Configure business hours</div>
          </a>

          <a
            href="/dashboard/knowledge"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition"
          >
            <div className="text-2xl mb-2">📚</div>
            <div className="font-semibold text-gray-900">Add Knowledge</div>
            <div className="text-sm text-gray-600">Upload FAQs and documents</div>
          </a>
        </div>
      </div>

      {/* Widget Embed Code */}
      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">
          Embed Your Chat Widget
        </h2>
        <p className="mb-4 opacity-90">
          Add this code to your website to start using the AI assistant
        </p>
        <div className="bg-black bg-opacity-30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <code>{`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-widget-key="${business.widget_key}"></script>`}</code>
        </div>
      </div>
    </div>
  )
}
