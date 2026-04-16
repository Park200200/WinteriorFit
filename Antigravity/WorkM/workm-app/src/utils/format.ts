/**
 * 날짜, 숫자, 전화번호 등 포맷팅 유틸
 */

/** 숫자 → 천 단위 콤마 */
export function formatNumber(n: number | string): string {
  const num = typeof n === 'string' ? parseFloat(n.replace(/,/g, '')) : n
  if (isNaN(num)) return '0'
  return num.toLocaleString('ko-KR')
}

/** 숫자 0-패딩 */
export function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

/** Date → YYYY.MM.DD (요일) */
export function formatDate(date: Date): string {
  const days = ['일','월','화','수','목','금','토']
  return `${date.getFullYear()}.${pad(date.getMonth()+1)}.${pad(date.getDate())} (${days[date.getDay()]})`
}

/** Date → HH:MM */
export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Date → HH:MM:SS */
export function formatTimeFull(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 전화번호 자동 하이픈 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0,3)}-${digits.slice(3)}`
  return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`
}

/** D-Day 계산 */
export function getDday(dueDate: string): number {
  const due = new Date(dueDate)
  due.setHours(0,0,0,0)
  const today = new Date()
  today.setHours(0,0,0,0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
