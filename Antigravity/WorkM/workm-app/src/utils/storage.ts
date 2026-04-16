/**
 * localStorage 안전 래퍼 — 기존 WorkM 데이터 호환
 */

export function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`[storage] Failed to set "${key}"`, e)
  }
}

export function removeItem(key: string): void {
  localStorage.removeItem(key)
}
