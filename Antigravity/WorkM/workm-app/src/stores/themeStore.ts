import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  toggle: () => void
  set: (theme: Theme) => void
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('ws_theme')
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: getInitialTheme(),
  toggle: () => set((s) => {
    const next = s.theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('ws_theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    return { theme: next }
  }),
  set: (theme) => {
    localStorage.setItem('ws_theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
}))
