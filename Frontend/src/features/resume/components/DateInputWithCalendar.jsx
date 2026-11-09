import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// Generate year options from currentYear + 10 down to 1960
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR + 10 - 1960 + 1 },
  (_, i) => CURRENT_YEAR + 10 - i
)

/**
 * Parses user text string to extract year, month, and day if present.
 */
const parseInitialDate = (val) => {
  const now = new Date()
  let y = now.getFullYear()
  let m = now.getMonth()
  let d = now.getDate()

  if (typeof val === 'string' && val.trim()) {
    // 4-digit year match (1900 - 2099)
    const yearMatch = val.match(/\b(19\d\d|20\d\d)\b/)
    if (yearMatch) {
      y = parseInt(yearMatch[1], 10)
    }

    // Month match by short or full name
    MONTHS_SHORT.forEach((mon, idx) => {
      if (new RegExp(`\\b${mon}`, 'i').test(val)) {
        m = idx
      }
    })

    // Day match (1-31)
    const dayMatch = val.match(/\b([1-9]|[12]\d|3[01])\b/)
    if (dayMatch && (!yearMatch || dayMatch[1] !== yearMatch[1])) {
      d = parseInt(dayMatch[1], 10)
    }
  }

  return { y, m, d }
}

const DateInputWithCalendar = ({
  value = '',
  onChange,
  placeholder = 'Select or type date...',
  disabled = false,
  className = '',
  align = 'left' // 'left' | 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [effectiveAlign, setEffectiveAlign] = useState(align)

  const initial = parseInitialDate(value)
  const [selectedYear, setSelectedYear] = useState(initial.y)
  const [selectedMonth, setSelectedMonth] = useState(initial.m)

  const containerRef = useRef(null)

  // Re-sync calendar view to current value and compute placement when opening
  useEffect(() => {
    if (isOpen) {
      const parsed = parseInitialDate(value)
      setSelectedYear(parsed.y)
      setSelectedMonth(parsed.m)

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const popoverWidth = 275
        // If explicit align is right, or if extending right would go off-screen, align to right edge
        if (align === 'right' || rect.left + popoverWidth > window.innerWidth - 24) {
          setEffectiveAlign('right')
        } else {
          setEffectiveAlign('left')
        }
      }
    }
  }, [isOpen, value, align])

  // Click outside to dismiss popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Stepper handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  // Selection handlers
  const handleSelectDay = (day) => {
    const formatted = `${MONTHS_SHORT[selectedMonth]} ${day}, ${selectedYear}`
    onChange(formatted)
    setIsOpen(false)
  }

  const handleSelectMonthOnly = () => {
    const formatted = `${MONTHS_SHORT[selectedMonth]} ${selectedYear}`
    onChange(formatted)
    setIsOpen(false)
  }

  const handleQuickPresent = () => {
    onChange('Present')
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
  }

  // Days in selected month calculation
  const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const startDay = new Date(selectedYear, selectedMonth, 1).getDay()

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === selectedYear && today.getMonth() === selectedMonth

  return (
    <div className={`rc-date-input-wrap ${className}`} ref={containerRef}>
      {/* Direct text input: User can freely type anything */}
      <input
        type="text"
        className="rc-date-text-input"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Interactive calendar button */}
      <button
        type="button"
        className={`rc-date-cal-btn ${isOpen ? 'active' : ''}`}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Open calendar picker"
        aria-label="Pick date from calendar"
      >
        <Calendar size={15} />
      </button>

      {/* Standard Calendar Popover */}
      {isOpen && !disabled && (
        <div className={`rc-calendar-popover ${effectiveAlign === 'right' ? 'align-right' : ''}`}>
          {/* Header: Month & Year Select Dropdowns with Navigation Arrows */}
          <div className="rc-cal-header">
            <button
              type="button"
              className="rc-cal-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="rc-cal-selects">
              <select
                className="rc-cal-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                aria-label="Select month"
              >
                {MONTHS_FULL.map((mon, idx) => (
                  <option key={mon} value={idx}>
                    {mon}
                  </option>
                ))}
              </select>

              <select
                className="rc-cal-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Select year"
              >
                {YEAR_OPTIONS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="rc-cal-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Standard Days Grid */}
          <div className="rc-cal-days-grid">
            <div className="rc-cal-weekdays">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="rc-cal-days">
              {Array.from({ length: startDay }).map((_, i) => (
                <span key={`empty-${i}`} className="rc-cal-day-cell empty" />
              ))}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
                const dayStr = `${MONTHS_SHORT[selectedMonth]} ${d}, ${selectedYear}`
                const isSelected = value.trim() === dayStr
                const isToday = isCurrentMonth && today.getDate() === d

                return (
                  <button
                    key={d}
                    type="button"
                    className={`rc-cal-day-cell ${isSelected ? 'selected' : ''} ${
                      isToday ? 'today' : ''
                    }`}
                    onClick={() => handleSelectDay(d)}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer Quick Shortcuts */}
          <div className="rc-cal-footer">
            <button
              type="button"
              className="rc-cal-quick-btn"
              onClick={handleSelectMonthOnly}
              title={`Use ${MONTHS_SHORT[selectedMonth]} ${selectedYear}`}
            >
              {MONTHS_SHORT[selectedMonth]} {selectedYear}
            </button>
            <button
              type="button"
              className="rc-cal-quick-btn"
              onClick={handleQuickPresent}
              title="Set as Present"
            >
              Present
            </button>
            <button
              type="button"
              className="rc-cal-quick-btn clear"
              onClick={handleClear}
              title="Clear date"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateInputWithCalendar
