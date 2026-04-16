import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  icon?: ReactNode
  emoji?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, emoji, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {emoji && <span className="text-4xl mb-3">{emoji}</span>}
      {icon && <div className="mb-3 text-[var(--text-muted)]">{icon}</div>}
      <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-1">{title}</h3>
      {description && <p className="text-xs text-[var(--text-muted)] max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
