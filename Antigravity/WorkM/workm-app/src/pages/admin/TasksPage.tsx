import { useState, useMemo, useRef, useCallback } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

import { Avatar } from '../../components/ui/Avatar'
import { Modal, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { EmptyState } from '../../components/common/EmptyState'
import { cn } from '../../utils/cn'
import { getItem, setItem } from '../../utils/storage'

import { Star, UserPlus, Settings2, Plus, Check, X, Pencil, Trash2 } from 'lucide-react'
import { DatePicker } from '../../components/ui/DatePicker'

/* ── 타입 ── */
interface TaskItem {
  id: number; title: string; status: string; priority?: string
  progress: number; dueDate: string; startDate?: string; assignerId?: number
  assigneeIds?: number[]; assigneeId?: number
  isImportant?: boolean; team?: string; score?: number
  desc?: string; detailIds?: number[]; resultIds?: number[]; stepIds?: number[]
}
interface UserItem {
  id: number; name: string; color?: string; avatar?: string
  role?: string; dept?: string; status?: string
}

function getStatusLabel(s: string) {
  return { waiting: '대기', progress: '진행중', delay: '지연', done: '완료' }[s] || s
}
function getStatusColor(s: string) {
  return { waiting: '#9ca3af', progress: '#06b6d4', delay: '#ef4444', done: '#22c55e' }[s] || '#4f6ef7'
}

export function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => getItem<TaskItem[]>('ws_tasks', []))
  const users = getItem<UserItem[]>('ws_users', [])
  const [viewMode, setViewMode] = useState<'assignment' | 'list'>('assignment')
  const [assignMode, setAssignMode] = useState<'task' | 'staff' | 'team'>('task')
  const tabRef = useRef<HTMLDivElement>(null)

  /* 모달 상태 */
  const [assignTaskId, setAssignTaskId] = useState<number | null>(null)
  const [assignUserId, setAssignUserId] = useState<number | null>(null)
  const [assignTeamName, setAssignTeamName] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [editTaskId, setEditTaskId] = useState<number | null>(null)

  /* 업무추가 폼 */
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [selDetails, setSelDetails] = useState<number[]>([])
  const [selResults, setSelResults] = useState<number[]>([])
  const [selSteps, setSelSteps] = useState<number[]>([])

  /* 기타설정 데이터 */
  const detailTasks = getItem<{ id: number; name: string }[]>('ws_detail_tasks', [])
  const taskResults = getItem<{ id: number; name: string; icon?: string; color?: string }[]>('ws_task_results', [])
  const reportTypes = getItem<{ id: number; label: string; icon?: string; color?: string }[]>('ws_report_types', [])

  const openNewTaskModal = () => {
    setEditTaskId(null)
    setNewTitle(''); setNewDesc(''); setNewStartDate(''); setNewDueDate('')
    setSelDetails([]); setSelResults([]); setSelSteps([])
    setShowNewTask(true)
  }
  const openEditTaskModal = (taskId: number) => {
    const t = tasks.find(x => x.id === taskId)
    if (!t) return
    setEditTaskId(taskId)
    setNewTitle(t.title); setNewDesc(t.desc || '')
    setNewStartDate(t.startDate || ''); setNewDueDate(t.dueDate || '')
    setSelDetails(t.detailIds || []); setSelResults(t.resultIds || []); setSelSteps(t.stepIds || [])
    setShowNewTask(true)
  }
  const saveNewTask = () => {
    if (!newTitle.trim()) return
    if (editTaskId) {
      const newTasks = tasks.map(t => t.id !== editTaskId ? t : {
        ...t, title: newTitle.trim(), desc: newDesc,
        startDate: newStartDate, dueDate: newDueDate,
        detailIds: selDetails, resultIds: selResults, stepIds: selSteps,
      })
      updateTasks(newTasks)
    } else {
      const newTask: TaskItem = {
        id: Date.now(), title: newTitle.trim(), status: 'waiting', progress: 0,
        startDate: newStartDate, dueDate: newDueDate, team: '', assigneeIds: [], desc: newDesc,
        detailIds: selDetails, resultIds: selResults, stepIds: selSteps,
      }
      updateTasks([...tasks, newTask])
    }
    setShowNewTask(false)
  }
  const deleteTask = (taskId: number) => {
    updateTasks(tasks.filter(t => t.id !== taskId))
  }

  const getUser = (id?: number) => users.find(u => u.id === id)

  /* 업무 업데이트 헬퍼 */
  const updateTasks = useCallback((newTasks: TaskItem[]) => {
    setTasks(newTasks)
    setItem('ws_tasks', newTasks)
  }, [])

  /* 담당직원 토글 */
  const toggleAssignee = useCallback((taskId: number, userId: number) => {
    const newTasks = tasks.map(t => {
      if (t.id !== taskId) return t
      const ids = Array.isArray(t.assigneeIds) ? [...t.assigneeIds] : (t.assigneeId ? [t.assigneeId] : [])
      const idx = ids.indexOf(userId)
      if (idx >= 0) ids.splice(idx, 1)
      else ids.push(userId)
      return { ...t, assigneeIds: ids }
    })
    updateTasks(newTasks)
  }, [tasks, updateTasks])



  /* 모달 대상 */
  const assignTask = tasks.find(t => t.id === assignTaskId)
  const assignUser = users.find(u => u.id === assignUserId)
  const userTasks = assignUserId ? tasks.filter(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
    return ids.includes(assignUserId)
  }) : []

  return (
    <div className="animate-fadeIn">
      {/* ── 헤더 ── */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="flex-1">
          <PageHeader
            title={viewMode === 'assignment' ? '업무배정' : '업무목록'}
            subtitle={viewMode === 'assignment'
              ? '내 담당 업무 배정 현황을 확인하세요.'
              : '전체 업무 목록 및 현황을 확인하세요.'}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--bg-muted)] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('assignment')}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                viewMode === 'assignment'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)]',
              )}
            >업무분장</button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)]',
              )}
            >업무목록</button>
          </div>
          <Button size="md" icon={<Plus size={14} />} onClick={openNewTaskModal}>새 업무</Button>
        </div>
      </div>

      {/* ── 업무분장 모드: 서브 필터 ── */}
      {viewMode === 'assignment' && (
        <div className="flex gap-1.5 mb-4" ref={tabRef}>
          {(['task', 'staff', 'team'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setAssignMode(mode)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer',
                assignMode === mode
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]',
              )}
            >
              {{ task: '업무별', staff: '직원별', team: '팀별' }[mode]}
            </button>
          ))}
        </div>
      )}


      {/* ── 컨텐츠 ── */}
      {viewMode === 'assignment' ? (
        assignMode === 'task'
          ? <AssignByTask tasks={tasks} getUser={getUser} onManage={setAssignTaskId} />
          : assignMode === 'staff'
          ? <AssignByStaff tasks={tasks} users={users} onManage={setAssignUserId} />
          : <AssignByTeam tasks={tasks} getUser={getUser} onManage={setAssignTeamName} />
      ) : (
        <TaskListView tasks={tasks} getUser={getUser} detailTasks={detailTasks} taskResults={taskResults} reportTypes={reportTypes} onEdit={openEditTaskModal} onDelete={deleteTask} />
      )}

      {/* ══════ 업무별 담당직원 배정 모달 ══════ */}
      <Modal
        open={assignTaskId !== null}
        onClose={() => setAssignTaskId(null)}
        title="담당 직원 배정"
      >
        <ModalBody>
          {assignTask && (
            <div className="space-y-4">
              {/* 업무 정보 */}
              <div className="bg-[var(--bg-muted)] rounded-xl p-3">
                <div className="font-bold text-sm text-[var(--text-primary)]">{assignTask.title}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{assignTask.team || ''}</div>
              </div>

              {/* 선택 카운트 */}
              <div className="text-right text-[11px] text-[var(--text-muted)]">
                선택됨 <strong className="text-primary-500">
                  {(Array.isArray(assignTask.assigneeIds) ? assignTask.assigneeIds : []).length}
                </strong>명
              </div>

              {/* 직원 목록 */}
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {users.map(u => {
                  const ids = Array.isArray(assignTask.assigneeIds) ? assignTask.assigneeIds : []
                  const isSelected = ids.includes(u.id)
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleAssignee(assignTask.id, u.id)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all',
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                          : 'hover:bg-[var(--bg-muted)] border border-transparent',
                      )}
                    >
                      <Avatar name={u.name} color={u.color} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px] text-[var(--text-primary)]">{u.name}</div>
                        <div className="text-[10.5px] text-[var(--text-muted)]">{u.role || ''} · {u.dept || ''}</div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setAssignTaskId(null)}>닫기</Button>
        </ModalFooter>
      </Modal>

      {/* ══════ 직원별 업무 배정 관리 모달 ══════ */}
      <Modal
        open={assignUserId !== null}
        onClose={() => setAssignUserId(null)}
        title="업무 배정 관리"
      >
        <ModalBody>
          {assignUser && (
            <div className="space-y-4">
              {/* 직원 정보 */}
              <div className="flex items-center gap-3 bg-[var(--bg-muted)] rounded-xl p-3">
                <Avatar name={assignUser.name} color={assignUser.color} size="md" />
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">{assignUser.name}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{assignUser.role || ''} · {assignUser.dept || ''}</div>
                </div>
                <span className="ml-auto text-xs font-bold text-primary-500">{userTasks.length}건 배정</span>
              </div>

              {/* 전체 업무 토글 리스트 */}
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {tasks.map(t => {
                  const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
                  const isAssigned = ids.includes(assignUser.id)
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleAssignee(t.id, assignUser.id)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all',
                        isAssigned
                          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                          : 'hover:bg-[var(--bg-muted)] border border-transparent',
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px] text-[var(--text-primary)]">{t.title}</div>
                        <div className="text-[10.5px] text-[var(--text-muted)]">{t.team || ''}</div>
                      </div>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: `${getStatusColor(t.status)}18`, color: getStatusColor(t.status) }}
                      >{getStatusLabel(t.status)}</span>
                      {isAssigned && (
                        <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setAssignUserId(null)}>닫기</Button>
        </ModalFooter>
      </Modal>

      {/* ══════ 팀별 업무배정 관리 모달 ══════ */}
      <Modal
        open={assignTeamName !== null}
        onClose={() => setAssignTeamName(null)}
        title="팀별 업무배정 관리"
      >
        <ModalBody>
          {assignTeamName && (() => {
            const selectedCount = tasks.filter(t => t.team === assignTeamName).length
            return (
              <div className="space-y-4">
                {/* 팀명 헤더 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Settings2 size={16} className="text-primary-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)]">팀명</div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">{assignTeamName}</div>
                  </div>
                </div>

                {/* 배정 안내 */}
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span>업무 배정 <span className="text-[var(--text-secondary)]">(체크하여 팀에 배정)</span></span>
                  <span className="text-primary-500 font-bold">선택됨 {selectedCount}건</span>
                </div>

                {/* 전체 업무 토글 리스트 */}
                <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
                  {tasks.map(t => {
                    const isAssigned = t.team === assignTeamName
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          const newTasks = tasks.map(task => {
                            if (task.id !== t.id) return task
                            return { ...task, team: isAssigned ? '' : assignTeamName }
                          })
                          updateTasks(newTasks)
                        }}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all border',
                          isAssigned
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                            : 'hover:bg-[var(--bg-muted)] border-[var(--border-default)]',
                        )}
                      >
                        {/* 체크박스 */}
                        <div className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                          isAssigned
                            ? 'bg-primary-500 border-primary-500'
                            : 'border-[var(--border-default)]',
                        )}>
                          {isAssigned && <Check size={13} className="text-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[13px] text-[var(--text-primary)]">{t.title}</div>
                          <div className="text-[10.5px] text-[var(--text-muted)]">{t.team || '미배정'}</div>
                        </div>

                        {/* 우측 체크 원형 */}
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all',
                          isAssigned
                            ? 'bg-primary-500'
                            : 'bg-[var(--bg-subtle)]',
                        )}>
                          {isAssigned && <Check size={14} className="text-white" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setAssignTeamName(null)}>취소</Button>
          <Button onClick={() => setAssignTeamName(null)}>저장</Button>
        </ModalFooter>
      </Modal>

      {/* ══════ 업무추가/수정 모달 ══════ */}
      <Modal open={showNewTask} onClose={() => setShowNewTask(false)} title={editTaskId ? '업무수정' : '업무추가'}>
        <ModalBody>
          <div className="space-y-5">
            {/* 업무제목 */}
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">업무제목</label>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="업무 제목을 입력하세요"
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 transition-all"
              />
            </div>

            {/* 업무설명 */}
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">업무설명</label>
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="업무 설명을 입력하세요"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 transition-all resize-none"
              />
            </div>

            {/* 업무시작일 / 계획완료일 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">업무시작일</label>
                <DatePicker value={newStartDate} onChange={setNewStartDate} placeholder="날짜를 선택하세요" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">계획완료일</label>
                <DatePicker value={newDueDate} onChange={setNewDueDate} placeholder="날짜를 선택하세요" />
              </div>
            </div>

            {/* 세부업무 (복수선택) */}
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">
                세부업무 <span className="text-primary-500 font-normal">({selDetails.length}개 선택)</span>
              </label>
              <div className="space-y-1 max-h-[150px] overflow-y-auto border border-[var(--border-default)] rounded-xl p-2">
                {detailTasks.length > 0 ? detailTasks.map(d => {
                  const sel = selDetails.includes(d.id)
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelDetails(sel ? selDetails.filter(x => x !== d.id) : [...selDetails, d.id])}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all',
                        sel ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-[var(--bg-muted)]',
                      )}
                    >
                      <div className={cn(
                        'w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0',
                        sel ? 'bg-primary-500 border-primary-500' : 'border-[var(--border-default)]',
                      )}>
                        {sel && <Check size={11} className="text-white" />}
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--text-primary)]">{d.name}</span>
                    </div>
                  )
                }) : <div className="text-[11px] text-[var(--text-muted)] text-center py-2">기타설정에서 상세업무를 추가하세요</div>}
              </div>
            </div>

            {/* 예상결과물 (복수선택) */}
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">
                예상결과물 <span className="text-primary-500 font-normal">({selResults.length}개 선택)</span>
              </label>
              <div className="space-y-1 max-h-[150px] overflow-y-auto border border-[var(--border-default)] rounded-xl p-2">
                {taskResults.length > 0 ? taskResults.map(r => {
                  const sel = selResults.includes(r.id)
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelResults(sel ? selResults.filter(x => x !== r.id) : [...selResults, r.id])}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all',
                        sel ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-[var(--bg-muted)]',
                      )}
                    >
                      <div className={cn(
                        'w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0',
                        sel ? 'bg-primary-500 border-primary-500' : 'border-[var(--border-default)]',
                      )}>
                        {sel && <Check size={11} className="text-white" />}
                      </div>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: r.color || '#6b7280' }}
                      >
                        <span className="text-[8px] text-white font-bold">{r.name?.charAt(0)}</span>
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--text-primary)]">{r.name}</span>
                    </div>
                  )
                }) : <div className="text-[11px] text-[var(--text-muted)] text-center py-2">기타설정에서 예상결과물을 추가하세요</div>}
              </div>
            </div>

            {/* 진행순서 (순서대로 선택) */}
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">
                진행순서 <span className="text-primary-500 font-normal">({selSteps.length}개 선택 · 클릭하여 순서대로 추가, 중복 가능)</span>
              </label>
              {/* 선택된 순서 표시 */}
              {selSteps.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selSteps.map((sid, idx) => {
                    const rt = reportTypes.find(r => r.id === sid)
                    return (
                      <div key={`step-${idx}`} className="flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-bold text-primary-500 w-4 text-center">{idx + 1}</span>
                        <span className="text-[11px] font-semibold text-[var(--text-primary)]">{rt?.label || ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelSteps(selSteps.filter((_, i) => i !== idx)) }}
                          className="ml-0.5 text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                        ><X size={11} /></button>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="space-y-1 max-h-[150px] overflow-y-auto border border-[var(--border-default)] rounded-xl p-2">
                {reportTypes.length > 0 ? reportTypes.map(r => {
                  const count = selSteps.filter(x => x === r.id).length
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelSteps([...selSteps, r.id])}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all',
                        count > 0 ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-[var(--bg-muted)]',
                      )}
                    >
                      {count > 0 ? (
                        <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-white font-bold">{count}</span>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[var(--border-default)] shrink-0" />
                      )}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: r.color || '#6b7280' }}
                      >
                        <span className="text-[8px] text-white font-bold">{r.label?.charAt(0)}</span>
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--text-primary)]">{r.label}</span>
                    </div>
                  )
                }) : <div className="text-[11px] text-[var(--text-muted)] text-center py-2">기타설정에서 진행절차를 추가하세요</div>}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowNewTask(false)}>취소</Button>
          <Button onClick={saveNewTask}>저장</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

/* ══════════════════════════════════════════════
   업무별 배정 뷰
   ══════════════════════════════════════════════ */
function AssignByTask({ tasks, getUser, onManage }: {
  tasks: TaskItem[]
  getUser: (id?: number) => UserItem | undefined
  onManage: (taskId: number) => void
}) {
  if (!tasks.length) return <Card><EmptyState emoji="📋" title="등록된 업무가 없습니다" /></Card>

  return (
    <Card className="p-0 overflow-hidden">
      {/* 데스크탑 테이블 */}
      <div className="hidden md:block">
        <table className="w-full text-left">
          <colgroup>
            <col style={{ width: '40%' }} />
            <col />
            <col style={{ width: 90 }} />
            <col style={{ width: 80 }} />
          </colgroup>
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">업무명</th>
              <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">담당 직원</th>
              <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">점수</th>
              <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => {
              const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
              const assignees = ids.map(id => getUser(id)).filter(Boolean) as UserItem[]
              return (
                <tr key={t.id} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-[13.5px] text-[var(--text-primary)]">{t.title}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{t.team || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    {assignees.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {assignees.map(u => (
                          <div key={u.id} className="flex items-center gap-1.5 bg-[var(--bg-muted)] rounded-full pl-0.5 pr-2.5 py-0.5">
                            <Avatar name={u.name} color={u.color} size="xs" />
                            <span className="text-[11px] font-semibold text-[var(--text-primary)]">{u.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)]">미배정</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-primary-500">
                      {t.score || 0}<span className="text-[10px] font-normal text-[var(--text-muted)] ml-0.5">pt</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onManage(t.id)}
                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-[var(--text-muted)] hover:text-primary-500 cursor-pointer transition-colors"
                      title="담당 직원 지정"
                    >
                      <UserPlus size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="md:hidden divide-y divide-[var(--border-default)]">
        {tasks.map(t => {
          const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
          const assignees = ids.map(id => getUser(id)).filter(Boolean) as UserItem[]
          const prog = Math.min(100, Math.max(0, t.progress || 0))
          const progColor = prog >= 80 ? '#22c55e' : prog >= 40 ? '#4f6ef7' : '#f59e0b'
          return (
            <div key={t.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[var(--text-primary)]">{t.title}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{t.team || ''}</div>
                </div>
                <span className="text-xs font-bold text-primary-500 shrink-0">{t.score || 0}<span className="text-[10px] font-normal ml-0.5">pt</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {assignees.length > 0 ? assignees.map(u => (
                    <div key={u.id} className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-full pl-0.5 pr-2 py-0.5">
                      <Avatar name={u.name} color={u.color} size="xs" />
                      <span className="text-[10px] font-semibold">{u.name}</span>
                    </div>
                  )) : <span className="text-[10px] text-[var(--text-muted)]">미배정</span>}
                </div>
                <button
                  onClick={() => onManage(t.id)}
                  className="p-1.5 rounded-lg text-primary-500 bg-primary-50 dark:bg-primary-900/20 cursor-pointer text-[10px] font-bold flex items-center gap-1 shrink-0"
                >
                  <UserPlus size={12} /> 배정
                </button>
              </div>
              {prog > 0 && (
                <div className="w-full h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${prog}%`, background: progColor }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ══════════════════════════════════════════════
   직원별 배정 뷰
   ══════════════════════════════════════════════ */
function AssignByStaff({ tasks, users, onManage }: {
  tasks: TaskItem[]; users: UserItem[]
  onManage: (userId: number) => void
}) {
  if (!users.length) return <Card><EmptyState emoji="👤" title="등록된 직원이 없습니다" /></Card>

  return (
    <Card className="p-0 overflow-hidden">
      <div className="hidden md:block">
        <table className="w-full text-left">
          <colgroup>
            <col style={{ width: 260 }} />
            <col />
            <col style={{ width: 80 }} />
          </colgroup>
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">직원 정보</th>
              <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">배정 업무</th>
              <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const myTasks = tasks.filter(t => {
                const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
                return ids.includes(u.id)
              })
              return (
                <tr key={u.id} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} color={u.color} size="sm" />
                      <div>
                        <div className="font-bold text-[13px] text-[var(--text-primary)]">{u.name}</div>
                        <div className="text-[10.5px] text-[var(--text-muted)]">{u.role || ''} · {u.dept || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {myTasks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {myTasks.map(t => (
                          <span key={t.id} className="text-[10px] font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-md">{t.title}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)]">배정된 업무 없음</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onManage(u.id)}
                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-[var(--text-muted)] hover:text-primary-500 cursor-pointer transition-colors"
                      title="업무 배정 관리"
                    >
                      <Settings2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="md:hidden divide-y divide-[var(--border-default)]">
        {users.map(u => {
          const myTasks = tasks.filter(t => {
            const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
            return ids.includes(u.id)
          })
          const doneCnt = myTasks.filter(t => t.status === 'done').length
          const prog = myTasks.length > 0 ? Math.round(doneCnt / myTasks.length * 100) : 0
          const progColor = prog >= 80 ? '#22c55e' : prog >= 40 ? '#4f6ef7' : '#f59e0b'
          return (
            <div key={u.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.name} color={u.color} size="sm" />
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">{u.name}</div>
                    <div className="text-[10.5px] text-[var(--text-muted)]">{u.role || ''} · {u.dept || ''}</div>
                  </div>
                </div>
                <button
                  onClick={() => onManage(u.id)}
                  className="p-1.5 rounded-lg text-primary-500 bg-primary-50 dark:bg-primary-900/20 cursor-pointer text-[10px] font-bold flex items-center gap-1"
                >
                  <Settings2 size={12} /> 관리
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {myTasks.length > 0 ? myTasks.slice(0, 5).map(t => (
                  <span key={t.id} className="text-[10px] font-semibold bg-[var(--bg-muted)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md">{t.title}</span>
                )) : <span className="text-[10px] text-[var(--text-muted)]">배정된 업무 없음</span>}
                {myTasks.length > 5 && <span className="text-[10px] text-[var(--text-muted)]">+{myTasks.length - 5}</span>}
              </div>
              {myTasks.length > 0 && (
                <div className="w-full h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${prog}%`, background: progColor }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ══════════════════════════════════════════════
   팀별 배정 뷰
   ══════════════════════════════════════════════ */
function AssignByTeam({ tasks, getUser, onManage }: { tasks: TaskItem[]; getUser: (id?: number) => UserItem | undefined; onManage: (teamName: string) => void }) {
  /* 부서 목록에서 팀 그룹화 */
  const departments = getItem<{ id: number; name: string }[]>('ws_departments', [])
  const users = getItem<UserItem[]>('ws_users', [])

  const byTeam = useMemo(() => {
    const teamNames = departments.length > 0
      ? departments.map(d => d.name)
      : [...new Set(tasks.map(t => t.team || '미배정'))]

    return teamNames.map(team => {
      const teamTasks = tasks.filter(t => t.team === team)
      const memberIds = new Set<number>()
      teamTasks.forEach(t => {
        const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
        ids.forEach(id => memberIds.add(id))
      })
      // 부서 소속 직원도 추가
      users.filter(u => u.dept === team).forEach(u => memberIds.add(u.id))
      const members = Array.from(memberIds).map(id => getUser(id)).filter(Boolean) as UserItem[]
      return { team, tasks: teamTasks, members }
    })
  }, [tasks, departments, users, getUser])

  if (!byTeam.length) return <Card><EmptyState emoji="🏢" title="팀별 업무가 없습니다" /></Card>

  return (
    <Card className="p-0 overflow-hidden">
      {/* 데스크탑 테이블 */}
      <div className="hidden md:block">
        <table className="w-full text-left">
          <colgroup>
            <col style={{ width: 200 }} />
            <col />
            <col style={{ width: 80 }} />
          </colgroup>
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">팀 정보</th>
              <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">배정 업무</th>
              <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody>
            {byTeam.map(({ team, tasks: teamTasks, members }) => (
              <tr key={team} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-bold text-[13.5px] text-[var(--text-primary)]">{team}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex -space-x-1.5">
                      {members.slice(0, 4).map(u => (
                        <Avatar key={u.id} name={u.name} color={u.color} size="xs" className="ring-2 ring-[var(--bg-surface)]" />
                      ))}
                    </div>
                    <span className="text-[10.5px] text-[var(--text-muted)]">{members.length}명</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {teamTasks.length > 0 ? (
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {teamTasks.map(t => (
                          <span key={t.id} className="text-[10.5px] font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-md">{t.title}</span>
                        ))}
                      </div>
                      <div className="text-[10.5px] text-[var(--text-muted)] mt-1">{teamTasks.length}건</div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)]">배정된 업무 없음</span>
                      <div className="text-[10.5px] text-[var(--text-muted)] mt-1">0건</div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onManage(team)}
                    className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-[var(--text-muted)] hover:text-primary-500 cursor-pointer transition-colors"
                    title="팀별 업무 관리"
                  >
                    <Settings2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="md:hidden divide-y divide-[var(--border-default)]">
        {byTeam.map(({ team, tasks: teamTasks, members }) => (
          <div key={team} className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-[var(--text-primary)]">{team}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex -space-x-1.5">
                    {members.slice(0, 3).map(u => (
                      <Avatar key={u.id} name={u.name} color={u.color} size="xs" className="ring-2 ring-[var(--bg-surface)]" />
                    ))}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">{members.length}명</span>
                </div>
              </div>
              <span className="text-xs font-bold text-primary-500">{teamTasks.length}<span className="text-[10px] font-normal text-[var(--text-muted)] ml-0.5">건</span></span>
            </div>
            <div className="flex flex-wrap gap-1">
              {teamTasks.length > 0 ? teamTasks.map(t => (
                <span key={t.id} className="text-[10px] font-semibold bg-[var(--bg-muted)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md">{t.title}</span>
              )) : <span className="text-[10px] text-[var(--text-muted)]">배정된 업무 없음</span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ══════════════════════════════════════════════
   업무목록 뷰
   ══════════════════════════════════════════════ */
function TaskListView({ tasks, getUser, detailTasks, taskResults, reportTypes, onEdit, onDelete }: {
  tasks: TaskItem[]
  getUser: (id?: number) => UserItem | undefined
  detailTasks: { id: number; name: string }[]
  taskResults: { id: number; name: string; icon?: string; color?: string }[]
  reportTypes: { id: number; label: string; icon?: string; color?: string }[]
  onEdit: (taskId: number) => void
  onDelete: (taskId: number) => void
}) {
  if (!tasks.length) return <Card><EmptyState emoji="📋" title="등록된 업무가 없습니다" /></Card>

  return (
    <div className="space-y-2">
      {tasks.map(t => {
        const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
        const assignees = ids.map(id => getUser(id)).filter(Boolean) as UserItem[]
        const details = (t.detailIds || []).map(id => detailTasks.find(d => d.id === id)).filter(Boolean) as { id: number; name: string }[]
        const results = (t.resultIds || []).map(id => taskResults.find(r => r.id === id)).filter(Boolean) as { id: number; name: string; color?: string }[]
        const steps = (t.stepIds || []).map(id => reportTypes.find(r => r.id === id)).filter(Boolean) as { id: number; label: string; color?: string }[]

        return (
          <Card key={t.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {t.isImportant && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                  <span className="font-bold text-[14px] text-[var(--text-primary)]">{t.title}</span>
                </div>
                {t.desc && <div className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{t.desc}</div>}
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0"
                style={{ background: `${getStatusColor(t.status)}18`, color: getStatusColor(t.status) }}
              >{getStatusLabel(t.status)}</span>
              <div className="flex gap-1 shrink-0 ml-1">
                <button onClick={() => onEdit(t.id)} className="p-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-[var(--text-muted)] hover:text-primary-500 cursor-pointer transition-colors" title="수정"><Pencil size={13} /></button>
                <button onClick={() => { if (confirm('이 업무를 삭제하시겠습니까?')) onDelete(t.id) }} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 cursor-pointer transition-colors" title="삭제"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-2.5">
              {t.team && <span className="text-[10px] font-semibold bg-[var(--bg-muted)] text-[var(--text-muted)] px-2 py-0.5 rounded-md">{t.team}</span>}
              {assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  {assignees.map(u => (
                    <div key={u.id} className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-full pl-0.5 pr-2 py-0.5">
                      <Avatar name={u.name} color={u.color} size="xs" />
                      <span className="text-[10px] font-semibold">{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {details.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">세부업무</div>
                <div className="flex flex-wrap gap-1">
                  {details.map(d => (
                    <span key={d.id} className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">{d.name}</span>
                  ))}
                </div>
              </div>
            )}
            {results.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">예상결과물</div>
                <div className="flex flex-wrap gap-1">
                  {results.map(r => (
                    <span key={r.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: `${r.color || '#6b7280'}18`, color: r.color || '#6b7280' }}>{r.name}</span>
                  ))}
                </div>
              </div>
            )}
            {steps.length > 0 && (
              <div>
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">진행순서</div>
                <div className="flex flex-wrap gap-1 items-center">
                  {steps.map((s, idx) => (
                    <div key={s.id} className="flex items-center gap-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1" style={{ background: `${s.color || '#6b7280'}18`, color: s.color || '#6b7280' }}>
                        <span className="text-[9px] font-bold">{idx + 1}.</span>
                        {s.label}
                      </span>
                      {idx < steps.length - 1 && <span className="text-[10px] text-[var(--text-muted)]">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
