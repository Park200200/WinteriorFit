import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-6 flex-wrap gap-3', className)}>
      <div>
        <h1 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
