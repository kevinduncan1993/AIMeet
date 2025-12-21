'use client'

import { useBusiness } from '@/lib/hooks/useBusiness'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AppointmentsPage() {
  const { business } = useBusiness()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()
  }, [business])

  async function fetchAppointments() {
    if (!business) return

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(name, email, phone),
          service:services(name, duration_minutes)
        `)
        .eq('business_id', business.id)
        .order('start_time', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading appointments...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">
            Manage your upcoming and past appointments
          </p>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No appointments yet
          </h3>
          <p className="text-gray-600 mb-6">
            Appointments booked through your AI assistant will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {(appointment.service as any)?.name || 'Service'}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {(appointment.customer as any)?.name || 'Customer'} - {(appointment.customer as any)?.email}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>📅 {new Date(appointment.start_time).toLocaleDateString()}</span>
                    <span>🕐 {new Date(appointment.start_time).toLocaleTimeString()}</span>
                    <span>⏱️ {(appointment.service as any)?.duration_minutes} min</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {appointment.status}
                </span>
              </div>
              {appointment.customer_notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Notes:</span> {appointment.customer_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
