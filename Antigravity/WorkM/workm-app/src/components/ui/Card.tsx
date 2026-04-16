import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, padding = true, hover, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]',
        'shadow-xs transition-all duration-200',
        padding && 'p-5',
        hover && 'hover:shadow-md hover:border-[var(--border-strong)] cursor-pointer',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/* ── Card Sub-components ── */
export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-extrabold text-[var(--text-primary)]', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>
}
