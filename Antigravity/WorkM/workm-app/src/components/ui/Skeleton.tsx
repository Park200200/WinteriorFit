import { cn } from '../../utils/cn'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-[var(--bg-muted)]',
        'bg-gradient-to-r from-[var(--bg-muted)] via-[var(--bg-subtle)] to-[var(--bg-muted)]',
        'bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]',
        className,
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}
