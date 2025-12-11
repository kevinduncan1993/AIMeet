'use client'

import { useState } from 'react'

interface DatePickerProps {
  onSelectDate: (date: string) => void
  loading?: boolean
  minDaysAhead?: number
  maxDaysAhead?: number
}

export default function DatePicker({
  onSelectDate,
  loading,
  minDaysAhead = 0,
  maxDaysAhead = 30
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Generate array of dates for the calendar
  const generateCalendarDates = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    const startDay = firstDayOfMonth.getDay() // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate()

    const dates: (Date | null)[] = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      dates.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
    }

    return dates
  }

  const isDateSelectable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const minDate = new Date(today)
    minDate.setDate(today.getDate() + minDaysAhead)

    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + maxDaysAhead)

    return date >= minDate && date <= maxDate
  }

  const handleDateClick = (date: Date) => {
    if (!isDateSelectable(date) || loading) return

    const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD format
    onSelectDate(dateString)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const calendarDates = generateCalendarDates()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl p-4 my-2 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-indigo-200">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Select a Date</h3>
          <p className="text-sm text-gray-600">Choose your preferred appointment date</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          disabled={loading}
          className="p-2 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h4 className="text-lg font-semibold text-gray-900">{monthName}</h4>
        <button
          onClick={goToNextMonth}
          disabled={loading}
          className="p-2 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDates.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const isToday = date.getTime() === today.getTime()
          const isSelectable = isDateSelectable(date)
          const isPast = date < today

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!isSelectable || loading}
              className={`
                aspect-square rounded-lg text-sm font-medium transition-all
                ${isSelectable
                  ? 'bg-white hover:bg-indigo-50 hover:border-indigo-500 hover:scale-105 cursor-pointer border-2 border-gray-200 text-gray-900'
                  : isPast
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                }
                ${isToday && isSelectable ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
                ${loading ? 'opacity-50' : ''}
              `}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-white border-2 border-indigo-500"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-50 border border-gray-100"></div>
          <span>Unavailable</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">
        Select a date to view available time slots
      </p>
    </div>
  )
}
