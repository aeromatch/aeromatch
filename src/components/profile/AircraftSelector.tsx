'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AIRCRAFT_CATALOG } from '@/lib/aircraftCatalog'

interface AircraftSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
}

export function AircraftSelector({ selected, onChange, disabled = false }: AircraftSelectorProps) {
  const { language } = useLanguage()
  const [expandedGroup, setExpandedGroup] = useState<string | null>('airbus')

  const toggleAircraft = (aircraft: string) => {
    if (disabled) return
    if (selected.includes(aircraft)) {
      onChange(selected.filter(a => a !== aircraft))
    } else {
      onChange([...selected, aircraft])
    }
  }

  const toggleGroup = (groupKey: string) => {
    setExpandedGroup(expandedGroup === groupKey ? null : groupKey)
  }

  const selectAllInGroup = (aircraft: string[]) => {
    if (disabled) return
    const newSelected = [...new Set([...selected, ...aircraft])]
    onChange(newSelected)
  }

  const getGroupLabel = (group: typeof AIRCRAFT_CATALOG[0]) => {
    return language === 'es' ? group.label.es : group.label.en
  }

  const getSelectedCountInGroup = (aircraft: string[]) => {
    return aircraft.filter(a => selected.includes(a)).length
  }

  return (
    <div className="space-y-3">
      {AIRCRAFT_CATALOG.map((group) => {
        const selectedInGroup = getSelectedCountInGroup(group.aircraft)
        const isExpanded = expandedGroup === group.key

        return (
          <div key={group.key} className="border border-steel-700/40 rounded-lg overflow-hidden">
            {/* Group Header */}
            <button
              type="button"
              onClick={() => toggleGroup(group.key)}
              className={`w-full px-4 py-3 flex items-center justify-between ${
                isExpanded ? 'bg-navy-800 border-b border-steel-700/40' : 'bg-navy-900'
              } hover:bg-navy-800 transition-colors`}
              disabled={disabled}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{group.icon}</span>
                <span className="font-medium text-white">{getGroupLabel(group)}</span>
                {selectedInGroup > 0 && (
                  <span className="chip-selected text-xs py-0.5 px-2">
                    {selectedInGroup}
                  </span>
                )}
              </div>
              <svg 
                className={`w-5 h-5 text-steel-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Group Aircraft */}
            {isExpanded && (
              <div className="p-4 bg-navy-900/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-steel-500">
                    {language === 'es' ? 'Selecciona los tipos que conoces' : 'Select the types you know'}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectAllInGroup(group.aircraft)}
                    className="text-xs text-gold-400 hover:text-gold-300"
                    disabled={disabled}
                  >
                    {language === 'es' ? 'Seleccionar todos' : 'Select all'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.aircraft.map((aircraft) => (
                    <button
                      key={aircraft}
                      type="button"
                      onClick={() => toggleAircraft(aircraft)}
                      className={selected.includes(aircraft) ? 'chip-selected' : 'chip-selectable'}
                      disabled={disabled}
                    >
                      {aircraft}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Selected summary */}
      {selected.length > 0 && (
        <div className="pt-4 border-t border-steel-700/40">
          <p className="text-sm text-steel-400 mb-2">
            {language === 'es' ? 'Seleccionados:' : 'Selected:'} {selected.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map((aircraft) => (
              <span key={aircraft} className="chip-blue text-xs">
                {aircraft}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => toggleAircraft(aircraft)}
                    className="ml-1.5 text-steel-400 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
