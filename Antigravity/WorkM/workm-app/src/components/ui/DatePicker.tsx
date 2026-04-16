import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '../../utils/cn'

interface DatePickerProps {
  value: string          // yyyy-MM-dd
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

export function DatePicker({ value, onChange, placeholder = '날짜를 선택하세요', className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // 현재 표시 중인 달
  const today = new Date()
  const parsed = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())

  // value 변경 시 뷰 동기화
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  // 위치 계산
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const calH = 340
      const spaceBelow = window.innerHeight - rect.bottom
      const goUp = spaceBelow < calH && rect.top > calH
      setPos({
        top: goUp ? rect.top - calH - 4 + window.scrollY : rect.bottom + 4 + window.scrollY,
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 300),
      })
    }
  }, [open])

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return
      if (calendarRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ESC 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // 달력 데이터 생성
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const prevDaysInMonth = new Date(viewYear, viewMonth, 0).getDate()
  const weeks: { day: number; current: boolean }[][] = []
  let week: { day: number; current: boolean }[] = []

  // 이전 달 날짜
  for (let i = firstDay - 1; i >= 0; i--) {
    week.push({ day: prevDaysInMonth - i, current: false })
  }
  // 이번 달 날짜
  for (let d = 1; d <= daysInMonth; d++) {
    week.push({ day: d, current: true })
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  // 다음 달 날짜
  if (week.length > 0) {
    let nextDay = 1
    while (week.length < 7) { week.push({ day: nextDay++, current: false }); }
    weeks.push(week)
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  const selectDate = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  const selectToday = () => {
    const t = new Date()
    setViewYear(t.getFullYear()); setViewMonth(t.getMonth())
    const m = String(t.getMonth() + 1).padStart(2, '0')
    const d = String(t.getDate()).padStart(2, '0')
    onChange(`${t.getFullYear()}-${m}-${d}`)
    setOpen(false)
  }

  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()

  const isSelected = (day: number) => {
    if (!parsed) return false
    return viewYear === parsed.getFullYear() && viewMonth === parsed.getMonth() && day === parsed.getDate()
  }

  const displayText = value ? value.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3') : ''

  return (
    <>
      {/* 트리거 */}
      <div
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border bg-[var(--bg-surface)] text-sm cursor-pointer transition-all',
          open ? 'border-primary-400 ring-2 ring-primary-200/50' : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
          className,
        )}
      >
        <Calendar size={14} className="text-[var(--text-muted)] shrink-0" />
        {displayText
          ? <span className="flex-1 text-[var(--text-primary)]">{displayText}</span>
          : <span className="flex-1 text-[var(--text-muted)]">{placeholder}</span>
        }
      </div>

      {/* 달력 (Portal) */}
      {open && createPortal(
        <div
          ref={calendarRef}
          className="fixed animate-scaleIn"
          style={{ top: pos.top, left: pos.left, zIndex: 99999 }}
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-4 w-[290px]">
            {/* 헤더: 년월 + 좌우 화살표 */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="w-8 h-8 rounded-xl hover:bg-[var(--bg-muted)] flex items-center justify-center cursor-pointer transition-colors">
                <ChevronLeft size={16} className="text-[var(--text-secondary)]" />
              </button>
              <span className="text-[13px] font-extrabold text-[var(--text-primary)] tracking-tight">
                {viewYear}년 {String(viewMonth + 1).padStart(2, '0')}월
              </span>
              <button onClick={nextMonth} className="w-8 h-8 rounded-xl hover:bg-[var(--bg-muted)] flex items-center justify-center cursor-pointer transition-colors">
                <ChevronRight size={16} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-1">
              {WEEK.map((w, i) => (
                <div
                  key={w}
                  className={cn(
                    'text-center text-[11px] font-bold py-1.5',
                    i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-[var(--text-muted)]',
                  )}
                >{w}</div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="space-y-0.5">
              {weeks.map((wk, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {wk.map((cell, di) => {
                    if (!cell.current) {
                      return (
                        <div key={di} className="w-full aspect-square flex items-center justify-center text-[12px] text-[var(--text-muted)]/30">
                          {cell.day}
                        </div>
                      )
                    }
                    const dayOfWeek = new Date(viewYear, viewMonth, cell.day).getDay()
                    const selected = isSelected(cell.day)
                    const todayMark = isToday(cell.day)
                    return (
                      <button
                        key={di}
                        onClick={() => selectDate(cell.day)}
                        className={cn(
                          'w-full aspect-square flex items-center justify-center text-[12px] font-medium rounded-xl cursor-pointer transition-all duration-150',
                          selected
                            ? 'bg-primary-500 text-white font-bold shadow-md shadow-primary-500/30'
                            : todayMark
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold ring-1 ring-primary-300/50'
                            : dayOfWeek === 0 ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : dayOfWeek === 6 ? 'text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]',
                        )}
                      >{cell.day}</button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* 하단 버튼 */}
            <div className="flex justify-between mt-3 pt-3 border-t border-[var(--border-default)]">
              <button
                onClick={() => { onChange(''); setOpen(false) }}
                className="px-3 py-1.5 text-[11px] font-bold text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-lg cursor-pointer transition-colors"
              >지우기</button>
              <button
                onClick={selectToday}
                className="px-3 py-1.5 text-[11px] font-bold text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg cursor-pointer transition-colors"
              >오늘</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
