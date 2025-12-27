'use client'

import { useState, useMemo } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface CompactRangePickerProps {
  onRangeSelect: (range: { start: Date; end: Date }) => void
  saving?: boolean
  minDate?: Date
}

export function CompactRangePicker({
  onRangeSelect,
  saving = false,
  minDate = new Date()
}: CompactRangePickerProps) {
  const { t, language } = useLanguage()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

  const monthNames = language === 'es' 
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const monthNamesFull = language === 'es' 
    ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const dayNames = language === 'es'
    ? ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  // Generate calendar days for a specific month
  const generateMonthDays = (monthOffset: number) => {
    const targetMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1)
    const year = targetMonth.getFullYear()
    const month = targetMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6
    
    const days: (Date | null)[] = []
    
    for (let i = 0; i < startOffset; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return { days, month: targetMonth }
  }

  const month1 = useMemo(() => generateMonthDays(0), [currentMonth])
  const month2 = useMemo(() => generateMonthDays(1), [currentMonth])

  const isDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isInRange = (date: Date) => {
    if (!selectionStart) return false
    const end = selectionEnd || hoveredDate
    if (!end) return false
    
    const start = selectionStart < end ? selectionStart : end
    const endDate = selectionStart < end ? end : selectionStart
    const d = date.getTime()
    return d >= start.getTime() && d <= endDate.getTime()
  }

  const isRangeStart = (date: Date) => {
    return selectionStart?.toDateString() === date.toDateString()
  }

  const isRangeEnd = (date: Date) => {
    const end = selectionEnd || hoveredDate
    return end?.toDateString() === date.toDateString()
  }

  const handleDayClick = (date: Date) => {
    if (isDisabled(date)) return

    if (!selectionStart || (selectionStart && selectionEnd)) {
      // Start new selection
      setSelectionStart(date)
      setSelectionEnd(null)
    } else {
      // Complete selection
      if (date < selectionStart) {
        setSelectionEnd(selectionStart)
        setSelectionStart(date)
      } else {
        setSelectionEnd(date)
      }
    }
  }

  const handleConfirm = () => {
    if (selectionStart && selectionEnd) {
      onRangeSelect({ start: selectionStart, end: selectionEnd })
      setSelectionStart(null)
      setSelectionEnd(null)
    }
  }

  const handleClear = () => {
    setSelectionStart(null)
    setSelectionEnd(null)
  }

  const applyPreset = (days: number) => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setDate(end.getDate() + days)
    end.setHours(0, 0, 0, 0)
    setSelectionStart(start)
    setSelectionEnd(end)
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const getDayClassName = (date: Date) => {
    const baseClass = 'w-8 h-8 text-xs font-medium rounded-md transition-all flex items-center justify-center'
    
    if (isDisabled(date)) {
      return `${baseClass} text-steel-700 cursor-not-allowed`
    }
    
    const isStart = isRangeStart(date)
    const isEnd = isRangeEnd(date)
    const inRange = isInRange(date)
    const isToday = date.toDateString() === new Date().toDateString()

    if (isStart || isEnd) {
      return `${baseClass} bg-gold-500 text-navy-950 font-semibold cursor-pointer`
    }

    if (inRange) {
      return `${baseClass} bg-gold-500/20 text-gold-300 cursor-pointer`
    }

    if (isToday) {
      return `${baseClass} border border-gold-500/50 text-gold-400 cursor-pointer hover:bg-gold-500/10`
    }

    return `${baseClass} text-steel-300 cursor-pointer hover:bg-navy-700`
  }

  const renderMonth = (monthData: { days: (Date | null)[]; month: Date }) => (
    <div className="flex-1 min-w-0">
      <div className="text-center mb-3">
        <span className="text-sm font-medium text-white">
          {monthNamesFull[monthData.month.getMonth()]} {monthData.month.getFullYear()}
        </span>
      </div>
      
      {/* Day names */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames.map((day, i) => (
          <div key={i} className="text-center text-xs text-steel-600 py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {monthData.days.map((date, index) => (
          <div key={index} className="flex items-center justify-center">
            {date ? (
              <button
                onClick={() => handleDayClick(date)}
                onMouseEnter={() => !isDisabled(date) && setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                className={getDayClassName(date)}
                disabled={isDisabled(date)}
              >
                {date.getDate()}
              </button>
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => applyPreset(30)} className="chip hover:chip-selected text-xs">
          {t.availability.presets.next30}
        </button>
        <button onClick={() => applyPreset(90)} className="chip hover:chip-selected text-xs">
          {t.availability.presets.next90}
        </button>
        <button onClick={() => applyPreset(180)} className="chip hover:chip-selected text-xs">
          {t.availability.presets.next180}
        </button>
      </div>

      {/* Selection hint */}
      {selectionStart && !selectionEnd && (
        <div className="text-sm text-gold-400 bg-gold-500/10 border border-gold-500/20 rounded-lg px-3 py-2">
          {t.availability.selectEndDate}
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="btn-ghost p-2" aria-label={t.common.previous}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={nextMonth} className="btn-ghost p-2" aria-label={t.common.next}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Two Month Calendar - Desktop, One Month - Mobile */}
      <div className="hidden sm:flex gap-6">
        {renderMonth(month1)}
        {renderMonth(month2)}
      </div>
      
      <div className="sm:hidden">
        {renderMonth(month1)}
      </div>

      {/* Selected Range Summary + Confirm */}
      {selectionStart && selectionEnd && (
        <div className="bg-navy-800/50 border border-gold-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-steel-400">{t.availability.selectedRange}</p>
              <p className="text-white font-medium">
                {selectionStart.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', { 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric'
                })}
                {' — '}
                {selectionEnd.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', { 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xs text-steel-500 mt-1">
                {Math.ceil((selectionEnd.getTime() - selectionStart.getTime()) / (1000 * 60 * 60 * 24)) + 1} {t.availability.days}
              </p>
            </div>
            <button onClick={handleClear} className="btn-ghost text-sm">
              {t.common.clear}
            </button>
          </div>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="btn-primary-filled w-full"
          >
            {saving ? t.common.saving : t.availability.confirmRange}
          </button>
        </div>
      )}
    </div>
  )
}

