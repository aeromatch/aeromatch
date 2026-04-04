'use client'

import { useState, useMemo } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AIRCRAFT_CATALOG, searchAircraft, ALL_AIRCRAFT } from '@/lib/aircraftCatalog'
import { SERIES_UI_ORDER, getVariantsForSeries } from '@/lib/aircraft-series'

interface AircraftMultiSelectProps {
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
  maxHeight?: string
}

export function AircraftMultiSelect({ 
  selected, 
  onChange, 
  disabled = false,
  maxHeight = '400px'
}: AircraftMultiSelectProps) {
  const { language } = useLanguage()
  const [expandedGroup, setExpandedGroup] = useState<string | null>('airbus')
  const [searchQuery, setSearchQuery] = useState('')

  const labels = {
    searchPlaceholder: language === 'es' ? 'Buscar aeronave...' : 'Search aircraft...',
    selectAll: language === 'es' ? 'Seleccionar todos' : 'Select all',
    clearAll: language === 'es' ? 'Limpiar todos' : 'Clear all',
    selected: language === 'es' ? 'Seleccionados' : 'Selected',
    selectTypes: language === 'es' ? 'Selecciona los tipos' : 'Select the types',
    seriesTitle: language === 'es' ? 'Series EASA (type rating)' : 'EASA series (type rating)',
    variantsToggle: language === 'es' ? 'Variantes específicas' : 'Specific variants',
  }

  const [showVariants, setShowVariants] = useState(false)

  const toggleSeries = (series: string) => {
    if (disabled) return
    const variants = getVariantsForSeries(series, ALL_AIRCRAFT)
    if (variants.length === 0) return
    const allIn = variants.every((v) => selected.includes(v))
    if (allIn) {
      onChange(selected.filter((s) => !variants.includes(s)))
    } else {
      onChange([...new Set([...selected, ...variants])])
    }
  }

  const seriesSelectionState = (series: string): 'none' | 'partial' | 'all' => {
    const variants = getVariantsForSeries(series, ALL_AIRCRAFT)
    if (variants.length === 0) return 'none'
    const n = variants.filter((v) => selected.includes(v)).length
    if (n === 0) return 'none'
    if (n === variants.length) return 'all'
    return 'partial'
  }

  // Filter aircraft by search
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    return searchAircraft(searchQuery)
  }, [searchQuery])

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

  const clearAllInGroup = (aircraft: string[]) => {
    if (disabled) return
    onChange(selected.filter(a => !aircraft.includes(a)))
  }

  const getGroupLabel = (group: typeof AIRCRAFT_CATALOG[0]) => {
    return language === 'es' ? group.label.es : group.label.en
  }

  const getSelectedCountInGroup = (aircraft: string[]) => {
    return aircraft.filter(a => selected.includes(a)).length
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <svg 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="input pl-10"
          disabled={disabled}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nivel 1 — series EASA */}
      {!filteredResults && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-steel-400">{labels.seriesTitle}</p>
          <div className="flex flex-wrap gap-2">
            {SERIES_UI_ORDER.map((series) => {
              const variants = getVariantsForSeries(series, ALL_AIRCRAFT)
              if (variants.length === 0) return null
              const st = seriesSelectionState(series)
              return (
                <button
                  key={series}
                  type="button"
                  onClick={() => toggleSeries(series)}
                  disabled={disabled}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    st === 'all'
                      ? 'bg-gold-500/20 border-gold-500/50 text-gold-200'
                      : st === 'partial'
                        ? 'bg-navy-800 border-amber-500/40 text-amber-200'
                        : 'bg-navy-900/80 border-steel-700/50 text-steel-300 hover:border-steel-600'
                  }`}
                >
                  {series}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Search Results */}
      {filteredResults && (
        <div className="border border-steel-700/40 rounded-lg p-4 bg-navy-900/50">
          <p className="text-xs text-steel-500 mb-3">
            {filteredResults.length} {language === 'es' ? 'resultados' : 'results'}
          </p>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {filteredResults.map((aircraft) => (
              <button
                key={aircraft}
                type="button"
                onClick={() => toggleAircraft(aircraft)}
                className={selected.includes(aircraft) ? 'chip-selected' : 'chip-blue-selectable'}
                disabled={disabled}
              >
                {aircraft}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nivel 2 — variantes por fabricante (colapsable) */}
      {!filteredResults && (
        <div className="border border-steel-700/40 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowVariants(!showVariants)}
            className="w-full px-4 py-3 flex items-center justify-between bg-navy-900 hover:bg-navy-800 text-left"
            disabled={disabled}
          >
            <span className="text-sm font-medium text-white">{labels.variantsToggle}</span>
            <svg
              className={`w-5 h-5 text-steel-400 transition-transform ${showVariants ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showVariants && (
            <div className="p-3 pt-0 space-y-2" style={{ maxHeight, overflowY: 'auto' }}>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-steel-500">{group.aircraft.length}</span>
                    <svg 
                      className={`w-5 h-5 text-steel-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Group Aircraft */}
                {isExpanded && (
                  <div className="p-4 bg-navy-900/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-steel-500">
                        {labels.selectTypes}
                      </span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => selectAllInGroup(group.aircraft)}
                          className="text-xs text-gold-400 hover:text-gold-300"
                          disabled={disabled}
                        >
                          {labels.selectAll}
                        </button>
                        {selectedInGroup > 0 && (
                          <button
                            type="button"
                            onClick={() => clearAllInGroup(group.aircraft)}
                            className="text-xs text-steel-400 hover:text-steel-300"
                            disabled={disabled}
                          >
                            {labels.clearAll}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.aircraft.map((aircraft) => (
                        <button
                          key={aircraft}
                          type="button"
                          onClick={() => toggleAircraft(aircraft)}
                          className={selected.includes(aircraft) ? 'chip-selected' : 'chip-blue-selectable'}
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
            </div>
          )}
        </div>
      )}

      {/* Selected summary */}
      {selected.length > 0 && (
        <div className="pt-4 border-t border-steel-700/40">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-steel-400">
              {labels.selected}: <span className="text-gold-400 font-medium">{selected.length}</span>
            </p>
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-error-400 hover:text-error-300"
              >
                {labels.clearAll}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
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

