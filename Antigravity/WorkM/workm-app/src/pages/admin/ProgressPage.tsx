import { useState, useMemo } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { ProgressReportModal } from '../../components/modals/DashboardModals'
import { cn } from '../../utils/cn'
import { getItem } from '../../utils/storage'
import {
  ChevronRight, Star, Search,
} from 'lucide-react'

interface TaskItem {
  id: number
  title: string
  desc?: string
  status: string
  priority?: string
  progress: number
  dueDate: string
  startDate?: string
  createdAt?: string
  assignerId?: number
  assigneeIds?: number[]
  isImportant?: boolean
  team?: string
  importance?: string
}

interface UserItem {
  id: number
  name: string
  dept?: string
  rank?: string
  color?: string
}

/* ─── 상태 맵 ─── */
const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  waiting:  { label: '대기',   color: '#6b7280', bg: '#6b728015' },
  pending:  { label: '대기',   color: '#6b7280', bg: '#6b728015' },
  progress: { label: '진행중', color: '#4f6ef7', bg: '#4f6ef715' },
  delay:    { label: '지연',   color: '#ef4444', bg: '#ef444415' },
  done:     { label: '완료',   color: '#22c55e', bg: '#22c55e15' },
}

/* ─── 우선순위 맵 ─── */
const priorityMap: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: '높음', color: '#ef4444', bg: '#ef444415' },
  medium: { label: '보통', color: '#f59e0b', bg: '#f59e0b15' },
  low:    { label: '낮음', color: '#6b7280', bg: '#6b728015' },
}

/* 상태 라벨 → key 매핑 */
function getStatusKey(status: string) {
  const map: Record<string, string> = {
    '대기': 'waiting', '준비': 'waiting', '시작': 'progress',
    '진행중': 'progress', '완료': 'done', '지연중': 'delay',
    '지연': 'delay', '일부완료': 'progress', '보류': 'waiting',
    '포기': 'done', '검토중': 'progress',
  }
  return map[status] || status
}

/* 진행률 바 색상 */
function getBarColor(status: string) {
  const k = getStatusKey(status)
  if (k === 'delay') return '#ef4444'
  if (k === 'done') return '#22c55e'
  return '#4f6ef7'
}

/* ─── 팀별 그룹 아바타 색상 ─── */
const teamColors = ['#4f6ef7', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444']
function getTeamColor(idx: number) {
  return teamColors[idx % teamColors.length]
}

export function ProgressPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tasks = useMemo(() => getItem<TaskItem[]>('ws_tasks', []), [refreshKey])
  const users = getItem<UserItem[]>('ws_users', [])
  const importances = getItem<Array<{ id: number; name: string; icon?: string; color?: string }>>('ws_instr_importances', [])
  const statuses = getItem<Array<{ id: number; name: string; color?: string }>>('ws_task_statuses', [])

  const getUserName = (id?: number) => users.find(u => u.id === id)?.name || '-'

  const getUserDept = (id?: number) => users.find(u => u.id === id)?.dept || ''

  /* ─── 필터 적용 ─── */
  const filtered = useMemo(() => {
    let list = [...tasks]
    if (statusFilter !== 'all') {
      list = list.filter(t => getStatusKey(t.status) === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.team || '').toLowerCase().includes(q) ||
        getUserName(t.assignerId).toLowerCase().includes(q)
      )
    }
    return list
  }, [tasks, statusFilter, search])

  /* ─── 상태별 카운트 ─── */
  const counts = useMemo(() => {
    const c = { all: tasks.length, progress: 0, waiting: 0, delay: 0, done: 0 }
    tasks.forEach(t => {
      const k = getStatusKey(t.status)
      if (k in c) (c as any)[k]++
    })
    return c
  }, [tasks])

  /* ─── 팀별 그룹 ─── */
  const grouped = useMemo(() => {
    const map = new Map<string, TaskItem[]>()
    filtered.forEach(t => {
      // 담당자들의 팀 추출
      const depts = new Set<string>()
      if (t.team) depts.add(t.team)
      ;(t.assigneeIds || []).forEach(id => {
        const d = getUserDept(id)
        if (d) depts.add(d)
      })
      if (t.assignerId) {
        const d = getUserDept(t.assignerId)
        if (d) depts.add(d)
      }
      const key = depts.size > 0 ? Array.from(depts).sort().join(', ') : '미배정'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    })
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  /* ─── 상태 뱃지 (ws_task_statuses 또는 기본) ─── */
  const getStatusBadge = (status: string) => {
    const custom = statuses.find(s => s.name === status)
    if (custom) {
      return { label: custom.name, color: custom.color || '#4f6ef7' }
    }
    const k = getStatusKey(status)
    const cfg = statusMap[k] || statusMap.waiting
    return { label: cfg.label, color: cfg.color }
  }

  /* ─── 우선순위 뱃지 (importances) ─── */
  const getPriorityBadge = (task: TaskItem) => {
    if (task.importance) {
      const imp = importances.find(i => i.name === task.importance)
      if (imp) return { label: imp.name, color: imp.color || '#f59e0b' }
    }
    const cfg = priorityMap[task.priority || 'medium'] || priorityMap.medium
    return { label: cfg.label, color: cfg.color }
  }

  /* ─── 필터 탭 ─── */
  const filterTabs = [
    { key: 'all',      label: '전체',   count: counts.all },
    { key: 'progress', label: '진행중', count: counts.progress },
    { key: 'waiting',  label: '대기',   count: counts.waiting },
    { key: 'delay',    label: '지연',   count: counts.delay },
    { key: 'done',     label: '완료',   count: counts.done },
  ]

  return (
    <div className="animate-fadeIn">
      <PageHeader title="진행현황" subtitle="팀 전체 업무 기준 및 담당자 관리" />

      {/* ─── 상단: 검색 + 필터 탭 ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        {/* 검색 */}
        <div className="relative w-full sm:w-[280px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="업무, 담당자, 팀 검색..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors"
          />
        </div>

        {/* 필터 탭 */}
        <div className="flex items-center gap-1 flex-wrap">
          {filterTabs.map(tab => {
            const isActive = statusFilter === tab.key
            const tabColor = tab.key === 'all' ? '#4f6ef7'
              : tab.key === 'progress' ? '#4f6ef7'
              : tab.key === 'waiting' ? '#f59e0b'
              : tab.key === 'delay' ? '#ef4444'
              : '#22c55e'
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(statusFilter === tab.key ? 'all' : tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all border',
                  isActive
                    ? 'text-white border-transparent'
                    : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]'
                )}
                style={isActive ? { background: tabColor, borderColor: tabColor } : {}}
              >
                {tab.label}
                <span className={cn(
                  'text-[10px] font-extrabold min-w-[18px] h-[18px] rounded-full flex items-center justify-center',
                  isActive ? 'bg-white/25 text-white' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                )}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── 팀별 그룹 + 테이블 ─── */}
      {grouped.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl py-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-bold text-[var(--text-secondary)]">업무가 없습니다</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">등록된 업무가 없거나 필터 조건에 맞는 업무가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([teamName, teamTasks], gi) => {
            const isCollapsed = collapsedGroups.has(teamName)
            const color = getTeamColor(gi)

            return (
              <div key={teamName} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                {/* 팀 헤더 */}
                <button
                  onClick={() => toggleGroup(teamName)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold shrink-0"
                    style={{ background: color }}
                  >
                    {teamName.charAt(0)}
                  </div>
                  <span className="text-[13px] font-extrabold text-[var(--text-primary)]">{teamName}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: color }}
                  >
                    {teamTasks.length}건
                  </span>
                  <ChevronRight
                    size={16}
                    className={cn(
                      'ml-auto text-[var(--text-muted)] transition-transform duration-200',
                      !isCollapsed && 'rotate-90'
                    )}
                  />
                </button>

                {/* 테이블 */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11.5px] min-w-[750px]">
                      <thead>
                        <tr className="border-t border-b border-[var(--border-default)] bg-[var(--bg-muted)]">
                          <th className="text-left py-2 px-4 font-bold text-[var(--text-muted)] w-[30%]">업무명</th>
                          <th className="text-left py-2 px-3 font-bold text-[var(--text-muted)]">지시자</th>
                          <th className="text-left py-2 px-3 font-bold text-[var(--text-muted)]">담당자</th>
                          <th className="text-left py-2 px-3 font-bold text-[var(--text-muted)]">우선순위</th>
                          <th className="text-left py-2 px-3 font-bold text-[var(--text-muted)]">상태</th>
                          <th className="text-left py-2 px-3 font-bold text-[var(--text-muted)] w-[20%]">진행률</th>
                          <th className="text-left py-2 px-3 font-bold text-[var(--text-muted)]">마감일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamTasks.map(task => {
                          const stBadge = getStatusBadge(task.status)
                          const prBadge = getPriorityBadge(task)
                          const barColor = getBarColor(task.status)


                          return (
                            <tr
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                            >
                              {/* 업무명 */}
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  {task.isImportant && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                                  <span className="font-bold text-[var(--text-primary)] truncate">{task.title}</span>
                                </div>
                              </td>

                              {/* 지시자 */}
                              <td className="py-2.5 px-3">
                                <span className="text-[var(--text-secondary)]">{getUserName(task.assignerId)}</span>
                              </td>

                              {/* 담당자 */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  {(task.assigneeIds || []).slice(0, 2).map(id => {
                                    const u = users.find(u => u.id === id)
                                    if (!u) return null
                                    return (
                                      <div key={id} className="flex items-center gap-1">
                                        <div
                                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                                          style={{ background: u.color || '#4f6ef7' }}
                                        >
                                          {u.name.charAt(0)}
                                        </div>
                                        <span className="text-[var(--text-secondary)]">{u.name}</span>
                                      </div>
                                    )
                                  })}
                                  {(task.assigneeIds || []).length > 2 && (
                                    <span className="text-[10px] text-[var(--text-muted)]">+{(task.assigneeIds || []).length - 2}</span>
                                  )}
                                  {(!task.assigneeIds || task.assigneeIds.length === 0) && (
                                    <span className="text-[var(--text-muted)]">-</span>
                                  )}
                                </div>
                              </td>

                              {/* 우선순위 */}
                              <td className="py-2.5 px-3">
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: prBadge.color + '18', color: prBadge.color }}
                                >
                                  {prBadge.label}
                                </span>
                              </td>

                              {/* 상태 */}
                              <td className="py-2.5 px-3">
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center"
                                  style={{
                                    background: stBadge.color + '18',
                                    color: stBadge.color,
                                    borderLeft: `2.5px solid ${stBadge.color}`,
                                  }}
                                >
                                  ✦ {stBadge.label}
                                </span>
                              </td>

                              {/* 진행률 */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[100px]">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${task.progress}%`, background: barColor }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-[var(--text-primary)] min-w-[28px] text-right">
                                    {task.progress}%
                                  </span>
                                </div>
                              </td>

                              {/* 마감일 */}
                              <td className="py-2.5 px-3">
                                <span className="text-[11px] text-[var(--text-secondary)]">{task.dueDate}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 진행보고서 모달 */}
      <ProgressReportModal
        open={!!selectedTask}
        task={selectedTask ? {
          id: selectedTask.id,
          title: selectedTask.title,
          progress: selectedTask.progress,
          status: selectedTask.status,
          dueDate: selectedTask.dueDate,
          startDate: selectedTask.startDate,
          desc: selectedTask.desc,
          assigneeIds: selectedTask.assigneeIds,
          assignerId: selectedTask.assignerId,
        } : null}
        onClose={() => { setSelectedTask(null); setRefreshKey(k => k + 1) }}
        mode="view"
      />
    </div>
  )
}
