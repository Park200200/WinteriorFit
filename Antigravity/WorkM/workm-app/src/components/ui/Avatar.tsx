import { cn } from '../../utils/cn'

interface AvatarProps {
  name: string
  color?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
}

export function Avatar({ name, color = '#4f6ef7', size = 'md', className }: AvatarProps) {
  const initial = name.charAt(0)
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-extrabold text-white shrink-0',
        sizeClasses[size],
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -30)})` }}
      title={name}
    >
      {initial}
    </div>
  )
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
