'use client'

import { useBusiness } from '@/lib/hooks/useBusiness'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BusinessHours } from '@/types/database'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function BusinessHoursPage() {
  const { business } = useBusiness()
  const [hours, setHours] = useState<BusinessHours[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchHours()
  }, [business])

  async function fetchHours() {
    if (!business) return

    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('business_id', business.id)
        .is('staff_member_id', null)
        .order('day_of_week', { ascending: true })

      if (error) throw error
      setHours(data || [])
    } catch (error) {
      console.error('Error fetching hours:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addHours(dayOfWeek: number, startTime: string, endTime: string) {
    if (!business) return

    try {
      const { error } = await supabase.from('business_hours').insert({
        business_id: business.id,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
      })

      if (error) throw error
      fetchHours()
    } catch (error) {
      console.error('Error adding hours:', error)
      alert('Error adding hours')
    }
  }

  async function deleteHours(id: string) {
    if (!confirm('Remove these hours?')) return

    try {
      const { error } = await supabase
        .from('business_hours')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchHours()
    } catch (error) {
      console.error('Error deleting hours:', error)
    }
  }

  if (loading) {
    return <div>Loading business hours...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Hours</h1>
        <p className="text-gray-600 mt-1">
          Set your weekly operating hours for appointments
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Weekly Schedule
        </h2>

        {DAYS.map((day, index) => {
          const dayHours = hours.filter((h) => h.day_of_week === index)

          return (
            <div key={index} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{day}</h3>
              </div>

              {dayHours.length === 0 ? (
                <p className="text-gray-500 text-sm mb-2">Closed</p>
              ) : (
                <div className="space-y-2 mb-2">
                  {dayHours.map((h) => (
                    <div key={h.id} className="flex items-center gap-4">
                      <span className="text-gray-700">
                        {h.start_time.substring(0, 5)} - {h.end_time.substring(0, 5)}
                      </span>
                      <button
                        onClick={() => deleteHours(h.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  const start = prompt('Start time (HH:MM)', '09:00')
                  const end = prompt('End time (HH:MM)', '17:00')
                  if (start && end) {
                    addHours(index, start, end)
                  }
                }}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
              >
                + Add hours
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
