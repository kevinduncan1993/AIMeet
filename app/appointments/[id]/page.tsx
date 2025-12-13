'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAvailableSlots } from '@/lib/scheduling/availability'

interface Appointment {
  id: string
  start_time: string
  end_time: string
  status: string
  timezone: string
  customer_notes: string | null
  customer: {
    name: string
    email: string
    phone: string | null
  }
  service: {
    id: string
    name: string
    description: string | null
    duration_minutes: number
    price: number | null
  }
  business: {
    id: string
    name: string
    email: string | null
    phone: string | null
    timezone: string
    address: string | null
    city: string | null
    state: string | null
  }
}

interface AvailableSlot {
  start_time: string
  end_time: string
}

export default function AppointmentManagementPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    fetchAppointment()
  }, [appointmentId])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      if (!response.ok) {
        throw new Error('Appointment not found')
      }
      const data = await response.json()
      setAppointment(data.appointment)
    } catch (err) {
      setError('Failed to load appointment')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelledBy: 'customer',
          reason: cancelReason,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel appointment')
      }

      // Refresh appointment data
      await fetchAppointment()
      setShowCancelModal(false)
      setCancelReason('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel appointment')
    } finally {
      setCancelling(false)
    }
  }

  const fetchAvailableSlots = async (date: string) => {
    if (!appointment) return

    setLoadingSlots(true)
    try {
      const response = await fetch(
        `/api/chat/slots?businessId=${appointment.business.id}&serviceId=${appointment.service.id}&date=${date}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch available slots')
      }

      const data = await response.json()
      setAvailableSlots(data.slots || [])
    } catch (err) {
      console.error('Error fetching slots:', err)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleReschedule = async () => {
    if (!selectedSlot) return

    setRescheduling(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStartTime: selectedSlot.start_time,
          newEndTime: selectedSlot.end_time,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reschedule appointment')
      }

      // Refresh appointment data
      await fetchAppointment()
      setShowRescheduleModal(false)
      setSelectedDate('')
      setSelectedSlot(null)
      setAvailableSlots([])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reschedule appointment')
    } finally {
      setRescheduling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Appointment Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const appointmentDate = new Date(appointment.start_time).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: appointment.business.timezone,
  })

  const appointmentTime = new Date(appointment.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: appointment.business.timezone,
  })

  const canManage = appointment.status === 'scheduled' || appointment.status === 'confirmed'
  const isCancelled = appointment.status === 'cancelled'
  const isCompleted = appointment.status === 'completed'

  // Get minimum date (tomorrow) for reschedule
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Status Badge */}
        <div className="mb-6 text-center">
          {isCancelled && (
            <span className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold">
              ❌ Cancelled
            </span>
          )}
          {isCompleted && (
            <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
              ✅ Completed
            </span>
          )}
          {appointment.status === 'scheduled' && (
            <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
              📅 Scheduled
            </span>
          )}
          {appointment.status === 'confirmed' && (
            <span className="inline-block bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-semibold">
              ✓ Confirmed
            </span>
          )}
        </div>

        {/* Appointment Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Appointment</h1>

          <div className="space-y-6">
            {/* Business Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Business</h2>
              <p className="text-2xl font-bold text-indigo-600">{appointment.business.name}</p>
              {appointment.business.phone && (
                <p className="text-gray-600">{appointment.business.phone}</p>
              )}
              {appointment.business.email && (
                <p className="text-gray-600">{appointment.business.email}</p>
              )}
              {appointment.business.address && (
                <p className="text-gray-600">
                  {appointment.business.address}
                  {appointment.business.city && `, ${appointment.business.city}`}
                  {appointment.business.state && `, ${appointment.business.state}`}
                </p>
              )}
            </div>

            {/* Service Info */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Service</h2>
              <p className="text-xl font-semibold text-gray-900">{appointment.service.name}</p>
              {appointment.service.description && (
                <p className="text-gray-600 mt-1">{appointment.service.description}</p>
              )}
              <p className="text-gray-600 mt-2">
                <strong>Duration:</strong> {appointment.service.duration_minutes} minutes
              </p>
              {appointment.service.price && (
                <p className="text-gray-600">
                  <strong>Price:</strong> ${appointment.service.price}
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Date & Time</h2>
              <p className="text-xl font-semibold text-gray-900">{appointmentDate}</p>
              <p className="text-xl font-semibold text-gray-900">{appointmentTime}</p>
            </div>

            {/* Customer Info */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Information</h2>
              <p className="text-gray-900"><strong>Name:</strong> {appointment.customer.name}</p>
              <p className="text-gray-900"><strong>Email:</strong> {appointment.customer.email}</p>
              {appointment.customer.phone && (
                <p className="text-gray-900"><strong>Phone:</strong> {appointment.customer.phone}</p>
              )}
            </div>

            {appointment.customer_notes && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Notes</h2>
                <p className="text-gray-600">{appointment.customer_notes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {canManage && (
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Reschedule Appointment
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Cancel Appointment
              </button>
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cancel Appointment?</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Let us know why you're cancelling..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setCancelReason('')
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition"
                  disabled={cancelling}
                >
                  Keep Appointment
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full my-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Reschedule Appointment</h2>
              <p className="text-gray-600 mb-6">
                Select a new date and time for your appointment.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedSlot(null)
                    fetchAvailableSlots(e.target.value)
                  }}
                  min={minDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {selectedDate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Time Slots
                  </label>
                  {loadingSlots ? (
                    <p className="text-gray-500">Loading available slots...</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-gray-500">No available slots for this date</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {availableSlots.map((slot, index) => {
                        const slotTime = new Date(slot.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZone: appointment.business.timezone,
                        })
                        const isSelected = selectedSlot?.start_time === slot.start_time

                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-4 rounded-lg font-medium transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {slotTime}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowRescheduleModal(false)
                    setSelectedDate('')
                    setSelectedSlot(null)
                    setAvailableSlots([])
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition"
                  disabled={rescheduling}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                  disabled={!selectedSlot || rescheduling}
                >
                  {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
