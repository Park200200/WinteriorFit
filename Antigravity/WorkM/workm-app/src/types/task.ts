/** 업무 */
export interface Task {
  id: number | string
  title: string
  description?: string
  status: 'pending' | 'active' | 'done' | 'delay' | string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  dueDate: string
  startDate?: string
  createdAt: string
  assignerId?: string | number
  assigneeIds?: (string | number)[]
  isImportant?: boolean
  isSchedule?: boolean
  importance?: string
  processTags?: string[]
  reportContent?: string
  attachments?: TaskAttachment[]
  history?: TaskHistoryEntry[]
  score?: number
}

export interface TaskAttachment {
  name: string
  uploaderId?: string | number
  uploaderName?: string
  url?: string
  _instrFile?: boolean
}

export interface TaskHistoryEntry {
  date: string
  type: string
  content: string
  progress?: number
  icon?: string
  color?: string
}
