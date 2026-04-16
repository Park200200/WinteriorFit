import { type ReactNode, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  subtitle?: string
  maxWidth?: string
  showClose?: boolean
}

export function Modal({
  open,
  onClose,
  children,
  title,
  subtitle,
  maxWidth = 'max-w-lg',
  showClose = true,
}: ModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" />

      {/* 모달 본체 */}
      <div
        className={cn(
          'relative w-full bg-[var(--bg-surface)] rounded-t-2xl md:rounded-2xl shadow-xl',
          'border border-[var(--border-default)]',
          'flex flex-col h-[95vh] md:h-auto md:max-h-[90vh]',
          'animate-scaleIn',
          maxWidth,
        )}
      >
        {/* 헤더 */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
            <div>
              {title && (
                <h2 className="text-base font-extrabold text-[var(--text-primary)]">{title}</h2>
              )}
              {subtitle && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── 모달 내부 영역 서브 컴포넌트 ── */
export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-3 border-t border-[var(--border-default)] flex items-center justify-end gap-2', className)}>
      {children}
    </div>
  )
}
