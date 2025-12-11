'use client'

interface TimeSlot {
  time: string
  start_time: string
  end_time: string
}

interface TimeSlotPickerProps {
  date: string
  slots: TimeSlot[]
  onSelectSlot: (slot: TimeSlot) => void
  loading?: boolean
}

export default function TimeSlotPicker({ date, slots, onSelectSlot, loading }: TimeSlotPickerProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
    const morning: TimeSlot[] = []
    const afternoon: TimeSlot[] = []
    const evening: TimeSlot[] = []

    slots.forEach((slot) => {
      const hour = new Date(slot.start_time).getHours()
      if (hour < 12) {
        morning.push(slot)
      } else if (hour < 17) {
        afternoon.push(slot)
      } else {
        evening.push(slot)
      }
    })

    return { morning, afternoon, evening }
  }

  const { morning, afternoon, evening } = groupSlotsByPeriod(slots)

  const SlotButton = ({ slot }: { slot: TimeSlot }) => (
    <button
      onClick={() => onSelectSlot(slot)}
      disabled={loading}
      className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
    >
      {slot.time}
    </button>
  )

  const SlotGroup = ({ title, slots, icon }: { title: string; slots: TimeSlot[]; icon: string }) => {
    if (slots.length === 0) return null

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{icon}</span>
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
          <span className="text-xs text-gray-500">({slots.length} available)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot, idx) => (
            <SlotButton key={idx} slot={slot} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl p-4 my-2 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-indigo-200">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Select a Time Slot</h3>
          <p className="text-sm text-gray-600">{formatDate(date)}</p>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-gray-600 text-sm">No available slots for this date</p>
          <p className="text-gray-500 text-xs mt-1">Try selecting another date</p>
        </div>
      ) : (
        <div className="space-y-1">
          <SlotGroup title="Morning" slots={morning} icon="🌅" />
          <SlotGroup title="Afternoon" slots={afternoon} icon="☀️" />
          <SlotGroup title="Evening" slots={evening} icon="🌙" />
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-indigo-100">
        <p className="text-xs text-gray-500 text-center">
          Click a time slot to proceed with booking
        </p>
      </div>
    </div>
  )
}
