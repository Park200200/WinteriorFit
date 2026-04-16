import { create } from 'zustand'
import { getItem, setItem } from '../utils/storage'

/* ── 공통 리스트 아이템 타입 ── */
export interface OrgItem {
  id: number
  name: string
  level?: number
  icon?: string
  color?: string
}

export interface TaskResult {
  id: number
  name: string
  icon?: string
  color?: string
}

export interface ReportType {
  id: number
  label: string
  icon: string
  color: string
}

export interface TaskStatus {
  id: number
  name: string
  icon: string
  color: string
}

/* ── Store 인터페이스 ── */
interface SettingsStore {
  departments: OrgItem[]
  ranks: OrgItem[]
  positions: OrgItem[]
  taskResults: TaskResult[]
  reportTypes: ReportType[]
  detailTasks: OrgItem[]
  instrImportances: OrgItem[]
  taskStatuses: TaskStatus[]

  // 부서
  addDept: (name: string) => void
  updateDept: (id: number, name: string) => void
  deleteDept: (id: number) => void

  // 직급
  addRank: (name: string) => void
  updateRank: (id: number, name: string) => void
  deleteRank: (id: number) => void

  // 직책
  addPos: (name: string) => void
  updatePos: (id: number, name: string) => void
  deletePos: (id: number) => void

  // 업무 결과
  addResult: (name: string, icon?: string, color?: string) => void
  updateResult: (id: number, name: string, icon?: string, color?: string) => void
  deleteResult: (id: number) => void

  // 진행보고 유형
  addReportType: (label: string, icon: string, color: string) => void
  updateReportType: (id: number, label: string, icon: string, color: string) => void
  deleteReportType: (id: number) => void

  // 상세업무
  addDetailTask: (name: string) => void
  updateDetailTask: (id: number, name: string) => void
  deleteDetailTask: (id: number) => void

  // 진행상태
  addTaskStatus: (name: string, icon: string, color: string) => void
  updateTaskStatus: (id: number, name: string, icon: string, color: string) => void
  deleteTaskStatus: (id: number) => void

  // 지시 중요도
  addImportance: (name: string, icon?: string, color?: string) => void
  updateImportance: (id: number, name: string, icon?: string, color?: string) => void
  deleteImportance: (id: number) => void

  // 순서 변경 (범용)
  reorderItems: (category: string, ids: number[]) => void
}

/* ── 헬퍼 ── */
function nextId(list: { id: number }[]): number {
  return list.length ? Math.max(...list.map(i => i.id)) + 1 : 1
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  departments:      getItem('ws_departments', []),
  ranks:            getItem('ws_ranks', []),
  positions:        getItem('ws_positions', []),
  taskResults:      getItem('ws_task_results', []),
  reportTypes:      getItem('ws_report_types', []),
  detailTasks:      getItem('ws_detail_tasks', []),
  instrImportances: getItem('ws_instr_importances', []),
  taskStatuses:     getItem('ws_task_statuses', []),

  // ── 부서 ──
  addDept: (name) => set((s) => {
    const updated = [...s.departments, { id: Date.now(), name }]
    setItem('ws_departments', updated)
    return { departments: updated }
  }),
  updateDept: (id, name) => set((s) => {
    const updated = s.departments.map(d => d.id === id ? { ...d, name } : d)
    setItem('ws_departments', updated)
    return { departments: updated }
  }),
  deleteDept: (id) => set((s) => {
    const updated = s.departments.filter(d => d.id !== id)
    setItem('ws_departments', updated)
    return { departments: updated }
  }),

  // ── 직급 ──
  addRank: (name) => set((s) => {
    const updated = [...s.ranks, { id: Date.now(), name }]
    setItem('ws_ranks', updated)
    return { ranks: updated }
  }),
  updateRank: (id, name) => set((s) => {
    const updated = s.ranks.map(r => r.id === id ? { ...r, name } : r)
    setItem('ws_ranks', updated)
    return { ranks: updated }
  }),
  deleteRank: (id) => set((s) => {
    const updated = s.ranks.filter(r => r.id !== id)
    setItem('ws_ranks', updated)
    return { ranks: updated }
  }),

  // ── 직책 ──
  addPos: (name) => set((s) => {
    const updated = [...s.positions, { id: Date.now(), name }]
    setItem('ws_positions', updated)
    return { positions: updated }
  }),
  updatePos: (id, name) => set((s) => {
    const updated = s.positions.map(p => p.id === id ? { ...p, name } : p)
    setItem('ws_positions', updated)
    return { positions: updated }
  }),
  deletePos: (id) => set((s) => {
    const updated = s.positions.filter(p => p.id !== id)
    setItem('ws_positions', updated)
    return { positions: updated }
  }),

  // ── 업무 결과 ──
  addResult: (name, icon, color) => set((s) => {
    const updated = [...s.taskResults, { id: nextId(s.taskResults), name, icon, color }]
    setItem('ws_task_results', updated)
    return { taskResults: updated }
  }),
  updateResult: (id, name, icon, color) => set((s) => {
    const updated = s.taskResults.map(r => r.id === id ? { ...r, name, icon, color } : r)
    setItem('ws_task_results', updated)
    return { taskResults: updated }
  }),
  deleteResult: (id) => set((s) => {
    const updated = s.taskResults.filter(r => r.id !== id)
    setItem('ws_task_results', updated)
    return { taskResults: updated }
  }),

  // ── 진행보고 유형 ──
  addReportType: (label, icon, color) => set((s) => {
    const updated = [...s.reportTypes, { id: nextId(s.reportTypes), label, icon, color }]
    setItem('ws_report_types', updated)
    return { reportTypes: updated }
  }),
  updateReportType: (id, label, icon, color) => set((s) => {
    const updated = s.reportTypes.map(r => r.id === id ? { ...r, label, icon, color } : r)
    setItem('ws_report_types', updated)
    return { reportTypes: updated }
  }),
  deleteReportType: (id) => set((s) => {
    const updated = s.reportTypes.filter(r => r.id !== id)
    setItem('ws_report_types', updated)
    return { reportTypes: updated }
  }),

  // ── 상세업무 ──
  addDetailTask: (name) => set((s) => {
    const updated = [...s.detailTasks, { id: Date.now(), name }]
    setItem('ws_detail_tasks', updated)
    return { detailTasks: updated }
  }),
  updateDetailTask: (id, name) => set((s) => {
    const updated = s.detailTasks.map(d => d.id === id ? { ...d, name } : d)
    setItem('ws_detail_tasks', updated)
    return { detailTasks: updated }
  }),
  deleteDetailTask: (id) => set((s) => {
    const updated = s.detailTasks.filter(d => d.id !== id)
    setItem('ws_detail_tasks', updated)
    return { detailTasks: updated }
  }),

  // ── 진행상태 ──
  addTaskStatus: (name, icon, color) => set((s) => {
    const updated = [...s.taskStatuses, { id: nextId(s.taskStatuses), name, icon, color }]
    setItem('ws_task_statuses', updated)
    return { taskStatuses: updated }
  }),
  updateTaskStatus: (id, name, icon, color) => set((s) => {
    const updated = s.taskStatuses.map(t => t.id === id ? { ...t, name, icon, color } : t)
    setItem('ws_task_statuses', updated)
    return { taskStatuses: updated }
  }),
  deleteTaskStatus: (id) => set((s) => {
    const updated = s.taskStatuses.filter(t => t.id !== id)
    setItem('ws_task_statuses', updated)
    return { taskStatuses: updated }
  }),

  // ── 지시 중요도 ──
  addImportance: (name, icon, color) => set((s) => {
    const updated = [...s.instrImportances, { id: nextId(s.instrImportances), name, icon, color }]
    setItem('ws_instr_importances', updated)
    return { instrImportances: updated }
  }),
  updateImportance: (id, name, icon, color) => set((s) => {
    const updated = s.instrImportances.map(i => i.id === id ? { ...i, name, icon, color } : i)
    setItem('ws_instr_importances', updated)
    return { instrImportances: updated }
  }),
  deleteImportance: (id) => set((s) => {
    const updated = s.instrImportances.filter(i => i.id !== id)
    setItem('ws_instr_importances', updated)
    return { instrImportances: updated }
  }),

  // ── 순서 변경 (범용) ──
  reorderItems: (category, ids) => set((s) => {
    const keyMap: Record<string, { stateKey: keyof SettingsStore; storageKey: string }> = {
      departments: { stateKey: 'departments', storageKey: 'ws_departments' },
      ranks: { stateKey: 'ranks', storageKey: 'ws_ranks' },
      positions: { stateKey: 'positions', storageKey: 'ws_positions' },
      taskResults: { stateKey: 'taskResults', storageKey: 'ws_task_results' },
      reportTypes: { stateKey: 'reportTypes', storageKey: 'ws_report_types' },
      detailTasks: { stateKey: 'detailTasks', storageKey: 'ws_detail_tasks' },
      instrImportances: { stateKey: 'instrImportances', storageKey: 'ws_instr_importances' },
      taskStatuses: { stateKey: 'taskStatuses', storageKey: 'ws_task_statuses' },
    }
    const cfg = keyMap[category]
    if (!cfg) return {}
    const list = s[cfg.stateKey] as { id: number }[]
    const reordered = ids.map(id => list.find(item => item.id === id)).filter(Boolean)
    setItem(cfg.storageKey, reordered)
    return { [cfg.stateKey]: reordered }
  }),
}))
