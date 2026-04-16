import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind 클래스명을 안전하게 병합 (조건부 + 충돌 해결)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
