'use client'

interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number | null
}

interface ServicePickerProps {
  services: Service[]
  onSelectService: (serviceId: string, serviceName: string) => void
  loading?: boolean
}

export default function ServicePicker({ services, onSelectService, loading }: ServicePickerProps) {
  const formatPrice = (price: number | null) => {
    if (price === null) return 'Contact for pricing'
    return `$${price.toFixed(2)}`
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Select a Service</h3>
        <div className="space-y-2">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelectService(service.id, service.name)}
              disabled={loading}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-medium text-gray-900 group-hover:text-indigo-700">
                  {service.name}
                </h4>
                <span className="text-sm font-semibold text-indigo-600">
                  {formatPrice(service.price)}
                </span>
              </div>
              {service.description && (
                <p className="text-xs text-gray-600 mb-1">{service.description}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{service.duration_minutes} minutes</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
