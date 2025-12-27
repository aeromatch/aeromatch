'use client'

import { useState, useMemo } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface DateRange {
  id?: string
  start: Date
  end: Date
}

interface AvailabilityCalendarProps {
  selectedRanges: DateRange[]
  onRangeSelect: (range: { start: Date; end: Date }) => void
  onRangeDelete?: (id: string) => void
  minDate?: Date
  mode?: 'select' | 'view'
}

export function AvailabilityCalendar({
  selectedRanges,
  onRangeSelect,
  onRangeDelete,
  minDate = new Date(),
  mode = 'select'
}: AvailabilityCalendarProps) {
  const { t, language } = useLanguage()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

  const monthNames = language === 'es' 
    ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const dayNames = language === 'es'
    ? ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Adjust for Monday start
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6
    
    const days: (Date | null)[] = []
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startOffset; i++) {
      days.push(null)
    }
    
    // Add month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }, [currentMonth])

  const isDateInRange = (date: Date, range: DateRange) => {
    const d = date.getTime()
    return d >= range.start.getTime() && d <= range.end.getTime()
  }

  const isDateSelected = (date: Date) => {
    return selectedRanges.some(range => isDateInRange(date, range))
  }

  const isDateStart = (date: Date) => {
    return selectedRanges.some(range => 
      date.toDateString() === range.start.toDateString()
    )
  }

  const isDateEnd = (date: Date) => {
    return selectedRanges.some(range => 
      date.toDateString() === range.end.toDateString()
    )
  }

  const isInPreviewRange = (date: Date) => {
    if (!selectionStart || !hoveredDate) return false
    const start = selectionStart < hoveredDate ? selectionStart : hoveredDate
    const end = selectionStart < hoveredDate ? hoveredDate : selectionStart
    const d = date.getTime()
    return d >= start.getTime() && d <= end.getTime()
  }

  const isDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const handleDayClick = (date: Date) => {
    if (mode === 'view' || isDisabled(date)) return

    if (!selectionStart) {
      // First click - start selection
      setSelectionStart(date)
    } else {
      // Second click - complete selection
      const start = selectionStart < date ? selectionStart : date
      const end = selectionStart < date ? date : selectionStart
      onRangeSelect({ start, end })
      setSelectionStart(null)
      setHoveredDate(null)
    }
  }

  const handleDayHover = (date: Date) => {
    if (selectionStart && !isDisabled(date)) {
      setHoveredDate(date)
    }
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const getDayClassName = (date: Date) => {
    if (isDisabled(date)) return 'calendar-day-disabled'
    
    const isStart = isDateStart(date)
    const isEnd = isDateEnd(date)
    const isInRange = isDateSelected(date)
    const isPreview = isInPreviewRange(date)
    const isToday = date.toDateString() === new Date().toDateString()
    const isSelectionStartDate = selectionStart?.toDateString() === date.toDateString()

    if (isStart || isEnd || isSelectionStartDate) {
      return 'calendar-day-selected'
    }

    if (isInRange) {
      return 'calendar-day-in-range'
    }

    if (isPreview) {
      return 'calendar-day-in-range opacity-60'
    }

    if (isToday) {
      return 'calendar-day-today'
    }

    return 'calendar-day'
  }

  // Quick presets
  const applyPreset = (days: number) => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setDate(end.getDate() + days)
    end.setHours(0, 0, 0, 0)
    onRangeSelect({ start, end })
  }

  return (
    <div className="space-y-4">
      {/* Quick Presets */}
      {mode === 'select' && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => applyPreset(30)}
            className="chip hover:chip-selected"
          >
            {t.availability.presets.next30}
          </button>
          <button
            onClick={() => applyPreset(90)}
            className="chip hover:chip-selected"
          >
            {t.availability.presets.next90}
          </button>
        </div>
      )}

      {/* Selection hint */}
      {mode === 'select' && selectionStart && (
        <div className="text-sm text-gold-400 mb-2">
          {language === 'es' 
            ? `Inicio: ${selectionStart.toLocaleDateString('es-ES')} — Selecciona fecha de fin`
            : `Start: ${selectionStart.toLocaleDateString('en-GB')} — Select end date`
          }
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="btn-ghost p-2"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button
          onClick={nextMonth}
          className="btn-ghost p-2"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-steel-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => (
          <div key={index} className="aspect-square flex items-center justify-center">
            {date ? (
              <button
                onClick={() => handleDayClick(date)}
                onMouseEnter={() => handleDayHover(date)}
                onMouseLeave={() => !selectionStart && setHoveredDate(null)}
                className={getDayClassName(date)}
                disabled={isDisabled(date)}
              >
                {date.getDate()}
              </button>
            ) : (
              <div className="w-10 h-10" />
            )}
          </div>
        ))}
      </div>

      {/* Selected ranges list */}
      {selectedRanges.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium text-steel-400">
            {t.availability.activePeriods} ({selectedRanges.length})
          </h4>
          {selectedRanges.map((range, index) => (
            <div
              key={range.id || index}
              className="flex items-center justify-between p-3 bg-navy-800/50 rounded-lg border border-gold-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gold-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-white">
                    {range.start.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                    {' → '}
                    {range.end.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', { 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-steel-500">
                    {Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} {language === 'es' ? 'días' : 'days'}
                  </p>
                </div>
              </div>
              {onRangeDelete && range.id && (
                <button
                  onClick={() => onRangeDelete(range.id!)}
                  className="btn-ghost text-error-400 hover:text-error-300 p-2"
                  aria-label={t.common.delete}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

