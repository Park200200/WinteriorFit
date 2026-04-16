import { create } from 'zustand'
import type { User } from '../types/user'
import { getItem, setItem, removeItem } from '../utils/storage'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: getItem<User | null>('ws_user', null),
  isAuthenticated: !!localStorage.getItem('ws_user'),

  login: (user) => {
    setItem('ws_user', user)
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    removeItem('ws_user')
    set({ user: null, isAuthenticated: false })
  },

  updateUser: (updates) => set((state) => {
    if (!state.user) return state
    const updated = { ...state.user, ...updates }
    setItem('ws_user', updated)
    return { user: updated }
  }),
}))
