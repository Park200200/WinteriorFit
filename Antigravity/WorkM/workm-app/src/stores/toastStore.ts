import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (type: ToastType, message: string, duration?: number) => void
  remove: (id: string) => void
  clear: () => void
}

let toastCounter = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  add: (type, message, duration = 3000) => {
    const id = `toast-${++toastCounter}-${Date.now()}`
    const toast: Toast = { id, type, message, duration }
    set((s) => ({ toasts: [...s.toasts, toast] }))

    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
  },

  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))
