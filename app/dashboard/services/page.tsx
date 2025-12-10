'use client'

import { useBusiness } from '@/lib/hooks/useBusiness'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types/database'

export default function ServicesPage() {
  const { business } = useBusiness()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const supabase = createClient()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(30)
  const [buffer, setBuffer] = useState(0)
  const [price, setPrice] = useState('')

  useEffect(() => {
    fetchServices()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business])

  async function fetchServices() {
    if (!business) return

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update({
            name,
            description,
            duration_minutes: duration,
            buffer_minutes: buffer,
            price: price ? parseFloat(price) : null,
          })
          .eq('id', editingService.id)

        if (error) throw error
      } else {
        // Create new service
        const { error } = await supabase.from('services').insert({
          business_id: business.id,
          name,
          description,
          duration_minutes: duration,
          buffer_minutes: buffer,
          price: price ? parseFloat(price) : null,
        })

        if (error) throw error
      }

      // Reset form and refresh
      resetForm()
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Error saving service')
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setDuration(30)
    setBuffer(0)
    setPrice('')
    setShowForm(false)
    setEditingService(null)
  }

  const handleEdit = (service: Service) => {
    setName(service.name)
    setDescription(service.description || '')
    setDuration(service.duration_minutes)
    setBuffer(service.buffer_minutes)
    setPrice(service.price?.toString() || '')
    setEditingService(service)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const { error } = await supabase.from('services').delete().eq('id', id)

      if (error) throw error
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Error deleting service')
    }
  }

  if (loading) {
    return <div>Loading services...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">
            Manage your service offerings and pricing
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          {showForm ? 'Cancel' : 'Add Service'}
        </button>
      </div>

      {/* Service Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingService ? 'Edit Service' : 'New Service'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 30-minute Consultation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe what this service includes..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  required
                  min="5"
                  step="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buffer (minutes)
                </label>
                <input
                  type="number"
                  value={buffer}
                  onChange={(e) => setBuffer(parseInt(e.target.value))}
                  min="0"
                  step="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (optional)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                {editingService ? 'Update Service' : 'Create Service'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
          <div className="text-5xl mb-4">⚙️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No services yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first service to get started with appointments
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Add Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-gray-600 text-sm mt-1">
                      {service.description}
                    </p>
                  )}
                </div>
                {service.price && (
                  <div className="text-lg font-bold text-indigo-600">
                    ${service.price.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>⏱️ {service.duration_minutes} min</span>
                {service.buffer_minutes > 0 && (
                  <span>🔄 +{service.buffer_minutes} min buffer</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
