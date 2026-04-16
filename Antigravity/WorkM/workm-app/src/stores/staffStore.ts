import { create } from 'zustand'
import { getItem, setItem } from '../utils/storage'

export interface Staff {
  id: number
  name: string
  dept: string
  rank?: string
  position?: string
  email?: string
  phone?: string
  birthday?: string
  hiredAt?: string
  resignedAt?: string | null
  address?: string
  loginId?: string
  pw?: string
  status?: string
  note?: string
  color?: string
  avatar?: string
  photo?: string
  role?: string
  approverType?: string
  sealImg?: string
}

interface StaffStore {
  staff: Staff[]
  add: (s: Omit<Staff, 'id'>) => void
  update: (id: number, data: Partial<Staff>) => void
  remove: (id: number) => void
}

export const useStaffStore = create<StaffStore>((set) => ({
  staff: getItem<Staff[]>('ws_users', []),

  add: (data) => set((s) => {
    const newStaff = { ...data, id: Date.now() } as Staff
    const updated = [...s.staff, newStaff]
    setItem('ws_users', updated)
    return { staff: updated }
  }),

  update: (id, data) => set((s) => {
    const updated = s.staff.map(u => u.id === id ? { ...u, ...data } : u)
    setItem('ws_users', updated)
    return { staff: updated }
  }),

  remove: (id) => set((s) => {
    const updated = s.staff.filter(u => u.id !== id)
    setItem('ws_users', updated)
    return { staff: updated }
  }),
}))
