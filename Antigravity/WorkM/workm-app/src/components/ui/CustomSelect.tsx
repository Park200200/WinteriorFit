import { useState, useRef, useEffect, type ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

export interface SelectOption {
  value: string
  label: string | ReactNode
  disabled?: boolean
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = '— 선택 —',
  className,
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder

  /* 위치 계산 */
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const dropH = Math.min(options.length * 40 + 8, 280)
      const goUp = spaceBelow < dropH && rect.top > dropH

      setPos({
        top: goUp ? rect.top - dropH - 4 + window.scrollY : rect.bottom + 4 + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [open, options.length])

  /* 외부 클릭 닫기 */
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        listRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  /* ESC 닫기 */
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between gap-2',
          'px-3 py-2.5 rounded-lg border text-sm text-left transition-all',
          'bg-[var(--bg-surface)] text-[var(--text-primary)]',
          open
            ? 'border-[var(--border-focus)] shadow-[0_0_0_3px_rgba(79,110,247,0.12)]'
            : 'border-[var(--border-default)]',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-[var(--border-strong)]',
          className,
        )}
      >
        <span className={cn('truncate', !value && 'text-[var(--text-muted)]')}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-[var(--text-muted)] transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && createPortal(
        <div
          ref={listRef}
          className="fixed"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 99999,
          }}
        >
          <div
            className={cn(
              'bg-[var(--bg-surface)] border border-[var(--border-default)]',
              'rounded-xl shadow-xl overflow-hidden',
              'animate-scaleIn',
            )}
          >
            <div className="max-h-[260px] overflow-y-auto py-1">
              {options.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]',
                      opt.disabled && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected && <Check size={14} className="shrink-0 text-primary-500" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
