import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import { getItem, setItem } from '../../utils/storage'
import { useAuthStore } from '../../stores/authStore'
import { DatePicker } from '../ui/DatePicker'
import { Avatar } from '../ui/Avatar'
import { renderIcon } from '../../utils/iconMap'
import {
  X, Megaphone, Briefcase, Users, Layers, Paperclip, Upload,
  CalendarCheck, Calendar, Award, Flag, Activity, FileText,
  ClipboardCheck, ListOrdered, Send, Clock, BarChart2, Trash2,
  FileSpreadsheet, Image as ImageIcon, Film, File, Pencil,
} from 'lucide-react'

interface TaskItem {
  id: number; title: string; status?: string; assigneeIds?: number[];
  assignerId?: number; dueDate: string; startDate?: string;
  isSchedule?: boolean; isImportant?: boolean; progress?: number;
  desc?: string; stepIds?: number[];
  [key: string]: unknown
}
interface UserItem { id: number; name: string; dept?: string; rank?: string; color?: string }

/* ═══════════════════════════════════════════
   지시사항 등록 모달
   ═══════════════════════════════════════════ */
export function InstructionModal({ open, editTaskId, onClose }: { open: boolean; editTaskId?: string | null; onClose: () => void }) {
  const currentUser = useAuthStore(s => s.user)
  const myId = currentUser?.id ? Number(currentUser.id) : null
  const tasks = getItem<TaskItem[]>('ws_tasks', [])
  const users = getItem<UserItem[]>('ws_users', [])
  const taskResults = getItem<Array<{ id: number; name: string; icon?: string; color?: string }>>('ws_task_results', [])
  const reportTypes = getItem<Array<{ id: number; name?: string; label?: string }>>('ws_report_types', [])
  const importances = getItem<Array<{ id: number; name: string; icon?: string; color?: string }>>('ws_instr_importances', [])
  const statuses = getItem<Array<{ id: number; name: string; color?: string }>>('ws_task_statuses', [])
  const detailTasks = getItem<Array<{ id: number; name: string }>>('ws_detail_tasks', [])

  const [selectedTask, setSelectedTask] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([])
  const [nature, setNature] = useState<'일일업무' | '기간업무'>('일일업무')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [scoreMin, setScoreMin] = useState('')
  const [scoreMax, setScoreMax] = useState('')
  const [selectedImportances, setSelectedImportances] = useState<string[]>([])
  const [status, setStatus] = useState('')
  const [content, setContent] = useState('')
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [selectedProcedure, setSelectedProcedure] = useState<string[]>([])
  const [selectedDetails, setSelectedDetails] = useState<number[]>([])
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number; type: string; dataUrl?: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [taskSearch, setTaskSearch] = useState('')
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [taskPopup, setTaskPopup] = useState(false)
  const [assigneePopup, setAssigneePopup] = useState(false)

  const filteredTasks = useMemo(() =>
    tasks.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase())),
    [tasks, taskSearch]
  )
  const isNewTask = !selectedTask && newTaskTitle.trim().length > 0
  const filteredUsers = useMemo(() =>
    users.filter(u => u.name.includes(assigneeSearch)),
    [users, assigneeSearch]
  )

  const toggleImportance = (name: string) => {
    setSelectedImportances(prev =>
      prev.includes(name) ? [] : [name]
    )
  }
  const toggleResult = (name: string) => {
    setSelectedResults(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }
  const toggleDetail = (id: number) => {
    setSelectedDetails(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    )
  }
  const addProcedure = (name: string) => {
    setSelectedProcedure(prev => [...prev, name])
  }
  const removeProcedureAt = (idx: number) => {
    setSelectedProcedure(prev => prev.filter((_, i) => i !== idx))
  }
  const toggleAssignee = (id: number) => {
    setSelectedAssignees(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    )
  }

  // 업무 선택 시 해당 업무의 모든 연관 데이터 불러오기
  const selectTask = (taskId: string) => {
    setSelectedTask(taskId)
    setNewTaskTitle(tasks.find(t => String(t.id) === taskId)?.title || '')
    setTaskPopup(false)
    const task = tasks.find(t => String(t.id) === taskId)
    if (task) {
      // 업무설명
      if (task.desc) setContent(task.desc)
      // 진행순서 (stepIds → name 배열)
      if (task.stepIds && task.stepIds.length > 0) {
        const names = task.stepIds
          .map((sid: number) => { const r = reportTypes.find(r => r.id === sid); return r?.name || r?.label })
          .filter(Boolean) as string[]
        setSelectedProcedure(names)
      } else {
        setSelectedProcedure([])
      }
      // 세부업무
      const dIds = (task.detailIds as number[]) || []
      setSelectedDetails(dIds)
      // 결과물
      if (task.resultIds) {
        const rNames = (task.resultIds as number[])
          .map(rid => taskResults.find(r => r.id === rid)?.name)
          .filter(Boolean) as string[]
        setSelectedResults(rNames)
      }
      // 날짜
      if (task.startDate) setStartDate(task.startDate as string)
      if (task.dueDate) setDueDate(task.dueDate)
      // 담당자
      if (task.assigneeIds && task.assigneeIds.length > 0) {
        setSelectedAssignees(task.assigneeIds)
      }
      // instruction 에서 중요도/상태 복원
      const instrList = getItem<Array<Record<string, unknown>>>('ws_instructions', [])
      const instr = instrList.find(i => i.taskId === taskId || i.taskId === String(task.id))
      if (instr) {
        if (instr.importance) {
          const impNames = String(instr.importance).split(',').map(s => s.trim()).filter(Boolean)
          setSelectedImportances(impNames)
        }
        if (instr.status) setStatus(String(instr.status))
      }
    }
  }

  // editTaskId가 있으면 자동으로 해당 업무 로드
  useEffect(() => {
    if (open && editTaskId) {
      selectTask(editTaskId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editTaskId])

  // 새 업무명 입력 시 기존 선택 해제
  const handleTaskInput = (value: string) => {
    setNewTaskTitle(value)
    setTaskSearch(value)
    // 기존 업무와 정확히 일치하는지 확인
    const matched = tasks.find(t => t.title === value)
    if (matched) {
      setSelectedTask(String(matched.id))
    } else {
      setSelectedTask('')
    }
  }

  const handleSave = () => {
    if ((!selectedTask && !newTaskTitle.trim()) || selectedAssignees.length === 0 || !dueDate || !content.trim()) {
      alert('필수 항목(업무, 담당자, 완료일, 업무설명)을 입력해주세요.')
      return
    }

    let taskId = selectedTask

    // 새 업무인 경우 업무목록에 추가
    if (!selectedTask && newTaskTitle.trim()) {
      const allTasks = getItem<TaskItem[]>('ws_tasks', [])
      const newId = Date.now()
      const stepIds = selectedProcedure
        .map(pName => reportTypes.find(r => (r.name || r.label) === pName)?.id)
        .filter(Boolean) as number[]
      const newTask: TaskItem = {
        id: newId,
        title: newTaskTitle.trim(),
        status: 'waiting',
        dueDate,
        startDate,
        progress: 0,
        assignerId: myId || undefined,
        assigneeIds: selectedAssignees,
        desc: content,
        stepIds,
        detailIds: selectedDetails,
      }
      setItem('ws_tasks', [...allTasks, newTask])
      taskId = String(newId)
    }

    const now = new Date().toISOString()
    const newInstr = {
      id: Date.now(),
      taskId: taskId,
      assigneeIds: selectedAssignees,
      nature,
      startDate,
      dueDate,
      scoreMin: Number(scoreMin) || 0,
      scoreMax: Number(scoreMax) || 100,
      importance: selectedImportances.join(','),
      status: status || 'pending',
      content,
      results: selectedResults,
      procedure: selectedProcedure.join(' → '),
      attachments: attachments.map(a => ({ name: a.name, size: a.size, type: a.type })),
      createdAt: now,
    }
    const instrList = getItem<unknown[]>('ws_instructions', [])
    setItem('ws_instructions', [...instrList, newInstr])

    // 기존 업무의 assignerId/assigneeIds/desc/stepIds 동기화
    if (selectedTask) {
      const allTasks = getItem<TaskItem[]>('ws_tasks', [])
      const updatedTasks = allTasks.map(t => {
        if (String(t.id) !== selectedTask) return t
        const newStepIds = selectedProcedure
          .map(pName => reportTypes.find(r => (r.name || r.label) === pName)?.id)
          .filter(Boolean) as number[]
        return {
          ...t,
          desc: content,
          stepIds: newStepIds,
          detailIds: selectedDetails,
          assignerId: myId || t.assignerId,
          assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : t.assigneeIds,
          dueDate: dueDate || t.dueDate,
          startDate: startDate || t.startDate,
        }
      })
      setItem('ws_tasks', updatedTasks)
    }

    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-end md:items-center justify-center md:p-4 animate-fadeIn" onClick={onClose}>
      <div
        className="bg-[var(--bg-surface)] rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-[580px] h-[95vh] md:h-auto md:max-h-[92vh] flex flex-col animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-default)] shrink-0">
          <div className="w-8 h-8 rounded-[10px] bg-primary-500 shadow-md flex items-center justify-center">
            <Megaphone size={15} className="text-white" />
          </div>
          <span className="text-sm font-extrabold text-[var(--text-primary)]">지시사항 등록</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* 업무선택 + 담당자선택 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 업무 선택 (콤보박스: 기존 선택 또는 새 업무 입력) */}
            <div className="relative">
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <Briefcase size={12} /> 업무 선택 *
                {isNewTask && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">+ 새 업무</span>}
              </label>
              <input
                value={newTaskTitle}
                onChange={e => handleTaskInput(e.target.value)}
                onFocus={() => { setTaskPopup(true); setAssigneePopup(false) }}
                placeholder="업무를 검색하거나 새 업무명을 입력하세요"
                className={cn(
                  'w-full min-h-[40px] px-3 py-2 rounded-[10px] border bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] font-semibold outline-none transition-colors',
                  isNewTask ? 'border-emerald-400 focus:border-emerald-500' : 'border-[var(--border-default)] focus:border-primary-400'
                )}
              />
              {taskPopup && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 p-2 max-h-[240px] overflow-hidden">
                  <div className="max-h-[200px] overflow-y-auto flex flex-col gap-0.5">
                    {filteredTasks.map(t => (
                      <button key={t.id} onClick={() => selectTask(String(t.id))}
                        className={cn('text-left text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors',
                          String(t.id) === selectedTask ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}>
                        {t.title}
                      </button>
                    ))}
                    {filteredTasks.length === 0 && newTaskTitle.trim() && (
                      <div className="text-center text-xs py-3 space-y-1">
                        <div className="text-emerald-500 font-bold">✨ "{newTaskTitle.trim()}"</div>
                        <div className="text-[var(--text-muted)]">새 업무로 등록됩니다</div>
                      </div>
                    )}
                    {filteredTasks.length === 0 && !newTaskTitle.trim() && (
                      <div className="text-center text-xs text-[var(--text-muted)] py-3">업무가 없습니다</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 담당자 선택 */}
            <div className="relative">
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <Users size={12} /> 수신(협업)자 선택 *
              </label>
              <div
                onClick={() => { setAssigneePopup(!assigneePopup); setTaskPopup(false) }}
                className="min-h-[40px] px-3 py-2 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 transition-colors flex flex-wrap gap-1"
              >
                {selectedAssignees.length > 0
                  ? selectedAssignees.map(id => {
                      const u = users.find(u => u.id === id)
                      return <span key={id} className="text-[11px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-md">{u?.name}</span>
                    })
                  : <span className="text-sm text-[var(--text-muted)]">담당자를 선택하세요</span>
                }
              </div>
              {assigneePopup && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 p-2 max-h-[240px] overflow-hidden">
                  <input value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)} placeholder="협조자 검색..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] mb-1.5 outline-none focus:border-primary-400" />
                  <div className="max-h-[180px] overflow-y-auto flex flex-col gap-0.5">
                    {filteredUsers.map(u => (
                      <button key={u.id} onClick={() => toggleAssignee(u.id)}
                        className={cn('text-left text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between',
                          selectedAssignees.includes(u.id) ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}>
                        <span>{u.name} <span className="text-[10px] text-[var(--text-muted)]">{u.dept} {u.rank}</span></span>
                        {selectedAssignees.includes(u.id) && <span className="text-primary-500">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 업무성격 + 첨부파일 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <Layers size={12} /> 업무성격
              </label>
              <div className="flex gap-2">
                <button onClick={() => setNature('일일업무')}
                  className={cn('flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold cursor-pointer transition-all border',
                    nature === '일일업무' ? 'bg-primary-500 text-white border-primary-500' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-default)]')}>
                  <Clock size={13} /> 일일업무
                </button>
                <button onClick={() => setNature('기간업무')}
                  className={cn('flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold cursor-pointer transition-all border',
                    nature === '기간업무' ? 'bg-primary-500 text-white border-primary-500' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-default)]')}>
                  <BarChart2 size={13} /> 기간업무
                </button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <Paperclip size={12} /> 첨부파일
                {attachments.length > 0 && <span className="text-[9px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">{attachments.length}개</span>}
              </label>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
                const files = e.target.files
                if (!files) return
                Array.from(files).forEach(file => {
                  const reader = new FileReader()
                  reader.onload = () => {
                    setAttachments(prev => [...prev, {
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      dataUrl: reader.result as string,
                    }])
                  }
                  reader.readAsDataURL(file)
                })
                e.target.value = ''
              }} />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-[10px] border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 transition-colors flex items-center gap-2 text-xs text-[var(--text-secondary)]"
              >
                <Upload size={14} className="opacity-60" /> 파일 선택 (여러 개 가능)
              </div>
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((f, i) => {
                    const ext = f.name.split('.').pop()?.toLowerCase() || ''
                    const isImage = ['jpg','jpeg','png','gif','webp','svg'].includes(ext)
                    const isVideo = ['mp4','webm','mov','avi'].includes(ext)
                    const isExcel = ['xls','xlsx','csv'].includes(ext)
                    const IconComp = isImage ? ImageIcon : isVideo ? Film : isExcel ? FileSpreadsheet : File
                    const sizeStr = f.size < 1024 ? `${f.size}B` : f.size < 1048576 ? `${(f.size/1024).toFixed(1)}KB` : `${(f.size/1048576).toFixed(1)}MB`
                    return (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] group">
                        <IconComp size={14} className="text-[var(--text-muted)] shrink-0" />
                        <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate flex-1">{f.name}</span>
                        <span className="text-[9px] text-[var(--text-muted)] shrink-0">{sizeStr}</span>
                        <button onClick={(e) => { e.stopPropagation(); setAttachments(prev => prev.filter((_, j) => j !== i)) }}
                          className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 시작일 + 완료일 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <CalendarCheck size={12} /> 업무시작일
              </label>
              <DatePicker value={startDate} onChange={setStartDate} placeholder="날짜를 선택하세요" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <Calendar size={12} /> 완료 계획일 *
              </label>
              <DatePicker value={dueDate} onChange={setDueDate} placeholder="날짜를 선택하세요" />
            </div>
          </div>

          {/* 배점 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <Award size={12} /> 업무성공 배점
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input type="number" value={scoreMin} onChange={e => setScoreMin(e.target.value)} placeholder="0"
                  className="w-full px-3 py-2 pr-8 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] text-sm text-right outline-none focus:border-primary-400" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">에서</span>
              </div>
              <span className="text-[var(--text-muted)]">~</span>
              <div className="relative flex-1">
                <input type="number" value={scoreMax} onChange={e => setScoreMax(e.target.value)} placeholder="100"
                  className="w-full px-3 py-2 pr-8 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] text-sm text-right outline-none focus:border-primary-400" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">까지</span>
              </div>
            </div>
          </div>

          {/* 중요도 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <Flag size={12} /> 중요도
            </label>
            <div className="flex flex-wrap gap-1.5 px-3 py-2 min-h-[40px] border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] items-center">
              {importances.length > 0 ? importances.map(imp => (
                <button key={imp.id} onClick={() => toggleImportance(imp.name)}
                  className={cn('flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border',
                    selectedImportances.includes(imp.name)
                      ? 'text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent'
                  )}
                  style={selectedImportances.includes(imp.name) ? { background: imp.color || '#4f6ef7', borderColor: imp.color || '#4f6ef7' } : {}}>
                  {imp.icon && <span className="opacity-90">{renderIcon(imp.icon, 13)}</span>}
                  {imp.name}
                </button>
              )) : <span className="text-[11px] text-[var(--text-muted)]">기타설정에서 중요도를 등록하세요</span>}
            </div>
          </div>

          {/* 현재상태 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <Activity size={12} /> 현재상태
            </label>
            <div className="flex flex-wrap gap-1.5 px-3 py-2 min-h-[42px] border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] items-center">
              {statuses.length > 0 ? statuses.map(s => (
                <button key={s.id} onClick={() => setStatus(s.name)}
                  className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border',
                    status === s.name ? 'text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent'
                  )}
                  style={status === s.name ? { background: s.color || '#4f6ef7', borderColor: s.color || '#4f6ef7' } : {}}>
                  {s.name}
                </button>
              )) : <span className="text-[11px] text-[var(--text-muted)]">기타설정에서 상태를 등록하세요</span>}
            </div>
          </div>

          {/* 세부업무 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <Layers size={12} /> 세부업무
              {selectedDetails.length > 0 && <span className="text-[9px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">{selectedDetails.length}개</span>}
            </label>
            <div className="flex flex-wrap gap-1.5 px-3 py-2 min-h-[42px] border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] items-center">
              {detailTasks.length > 0 ? detailTasks.map(d => (
                <button key={d.id} onClick={() => toggleDetail(d.id)}
                  className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border',
                    selectedDetails.includes(d.id) ? 'bg-indigo-500 text-white border-indigo-500' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent')}>
                  {d.name}
                </button>
              )) : <span className="text-[11px] text-[var(--text-muted)]">기타설정에서 상세업무를 등록하세요</span>}
            </div>
          </div>

          {/* 업무설명 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <FileText size={12} /> 업무설명 *
            </label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
              placeholder="업무 내용을 상세히 입력하세요..."
              className="w-full px-3 py-2.5 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] text-sm outline-none focus:border-primary-400 resize-y min-h-[90px] leading-relaxed" />
          </div>

          {/* 예상결과물 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <ClipboardCheck size={12} /> 예상결과물
            </label>
            <div className="flex flex-wrap gap-1.5 px-3 py-2 min-h-[44px] border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] items-center">
              {taskResults.map(r => (
                <button key={r.id} onClick={() => toggleResult(r.name)}
                  className={cn('flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border',
                    selectedResults.includes(r.name) ? 'bg-primary-500 text-white border-primary-500' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent')}>
                  {r.icon && <span className="opacity-90">{renderIcon(r.icon, 13)}</span>}
                  {r.name}
                </button>
              ))}
              {taskResults.length === 0 && <span className="text-[11px] text-[var(--text-muted)]">기타설정에서 결과 유형을 등록하세요</span>}
            </div>
          </div>

          {/* 진행순서 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <ListOrdered size={12} /> 진행순서
            </label>
            <div className="border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] px-3 py-2 min-h-[44px] mb-2">
              <div className="flex flex-wrap gap-1.5 items-center min-h-[28px]">
                {selectedProcedure.length > 0
                  ? selectedProcedure.map((name, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-md">
                        {i + 1}. {name}
                        <button onClick={() => removeProcedureAt(i)} className="text-primary-400 hover:text-danger ml-0.5 cursor-pointer">×</button>
                      </span>
                    ))
                  : <span className="text-[11px] text-[var(--text-muted)]">아래 목록에서 더블클릭으로 순서 추가</span>
                }
              </div>
            </div>
            <div className="border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] px-3 py-2 min-h-[44px]">
              <div className="flex flex-wrap gap-1.5 items-center">
                {reportTypes.map(r => (
                  <button key={r.id} onDoubleClick={() => addProcedure((r.name || r.label) as string)}
                    className="text-[11px] font-semibold text-[var(--text-secondary)] px-2.5 py-1 rounded-full border border-[var(--border-default)] cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-300 transition-colors">
                    {r.name || r.label}
                  </button>
                ))}
                {reportTypes.length === 0 && <span className="text-[11px] text-[var(--text-muted)]">기타설정에서 보고 유형을 등록하세요</span>}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)] shrink-0">
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
            <X size={13} /> 닫기
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 cursor-pointer transition-colors shadow-sm">
            <Send size={13} /> 저장
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ═══════════════════════════════════════════
   일보작성 모달 (이전 버전 UI 1:1)
   ═══════════════════════════════════════════ */
export function DailyReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tasks = getItem<TaskItem[]>('ws_tasks', [])
  const users = getItem<UserItem[]>('ws_users', [])
  const detailTasks = getItem<Array<{ id: number; name: string }>>('ws_detail_tasks', [])
  const importances = getItem<Array<{ id: number; name: string; icon?: string; color?: string }>>('ws_instr_importances', [])
  const statuses = getItem<Array<{ id: number; name: string; color?: string }>>('ws_task_statuses', [])
  const currentUser = useAuthStore(s => s.user)
  const myId = currentUser?.id ? Number(currentUser.id) : 0

  const now = new Date()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dateStrKo = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${dayNames[now.getDay()]})`
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  // 스케줄 클릭 → 진행보고서 모달
  const [progressTask, setProgressTask] = useState<TaskItem | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // 오늘 날짜 문자열 (yyyy-mm-dd)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // 특정 업무에 오늘 히스토리가 있는지 확인
  const hasTodayHistory = (taskId: number | string) => {
    const key = `ws_progress_history_${taskId}`
    const hist = getItem<Array<{ reportedAt: string }>>(key, [])
    return hist.some(h => h.reportedAt && h.reportedAt.substring(0, 10) === todayStr)
  }

  const todayTasks = useMemo(() =>
    tasks.filter(t => {
      const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : []
      return (ids.includes(myId) || t.assignerId === myId) && t.status !== 'done'
    }),
    [tasks, myId, refreshKey]
  )

  const getUser = (id?: number) => users.find(u => u.id === id)

  // 실행보고 폼
  const [showExecForm, setShowExecForm] = useState(false)
  const [execTask, setExecTask] = useState('')
  const [execTaskInput, setExecTaskInput] = useState('')
  const [showTaskDropdown, setShowTaskDropdown] = useState(false)
  const [execContent, setExecContent] = useState('')
  const [execImp, setExecImp] = useState('')
  const [execStatus, setExecStatus] = useState('')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [execList, setExecList] = useState<Array<{
    task: string; content: string; imp: string; status: string; date: string; time: string
  }>>([])

  const filteredDetailTasks = useMemo(() => {
    if (!execTaskInput.trim()) return detailTasks
    const q = execTaskInput.toLowerCase()
    return detailTasks.filter(d => d.name.toLowerCase().includes(q))
  }, [detailTasks, execTaskInput])

  const selectDetailTask = (name: string) => {
    setExecTask(name)
    setExecTaskInput(name)
    setShowTaskDropdown(false)
  }

  const handleTaskInputChange = (val: string) => {
    setExecTaskInput(val)
    setExecTask(val)
    setShowTaskDropdown(true)
  }

  const finalizeTaskName = () => {
    setShowTaskDropdown(false)
    if (execTaskInput.trim() && !detailTasks.find(d => d.name === execTaskInput.trim())) {
      const newId = detailTasks.length > 0 ? Math.max(...detailTasks.map(d => d.id)) + 1 : 1
      const updated = [...detailTasks, { id: newId, name: execTaskInput.trim() }]
      setItem('ws_detail_tasks', updated)
    }
  }

  const addExecReport = () => {
    if (!execTask.trim()) return
    finalizeTaskName()
    const entry = {
      task: execTask, content: execContent, imp: execImp, status: execStatus,
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    }
    if (editIdx !== null) {
      setExecList(prev => prev.map((item, i) => i === editIdx ? entry : item))
      setEditIdx(null)
    } else {
      setExecList(prev => [...prev, entry])
    }
    setShowExecForm(false)
    setExecTask(''); setExecTaskInput(''); setExecContent(''); setExecImp(''); setExecStatus('')
  }

  const editExec = (idx: number) => {
    const item = execList[idx]
    setExecTask(item.task); setExecTaskInput(item.task)
    setExecContent(item.content); setExecImp(item.imp); setExecStatus(item.status)
    setEditIdx(idx); setShowExecForm(true)
  }

  const deleteExec = (idx: number) => {
    setExecList(prev => prev.filter((_, i) => i !== idx))
  }

  const getStatusBadge = (status: string) => {
    const custom = statuses.find(s => s.name === status)
    if (custom) return { label: custom.name, color: custom.color || '#4f6ef7' }
    const map: Record<string, { label: string; color: string }> = {
      waiting: { label: '대기', color: '#6b7280' }, pending: { label: '대기', color: '#6b7280' },
      progress: { label: '진행중', color: '#4f6ef7' }, delay: { label: '지연', color: '#ef4444' },
      done: { label: '완료', color: '#22c55e' },
    }
    return map[status] || { label: status, color: '#6b7280' }
  }

  const getImpBadge = (name: string) => {
    const imp = importances.find(i => i.name === name)
    return imp ? { label: imp.name, color: imp.color || '#f59e0b', icon: imp.icon } : null
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-end md:items-center justify-center md:p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[var(--bg-surface)] rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-[980px] h-[95vh] md:h-auto md:max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-default)] shrink-0">
          <ClipboardCheck size={18} className="text-primary-500" />
          <span className="text-sm font-extrabold text-[var(--text-primary)]">일보작성</span>
          <span className="text-[12px] font-semibold text-[var(--text-muted)] bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-lg px-2.5 py-0.5">{timeStr}</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer"><X size={18} /></button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* ① 금일 스케줄 리스트 */}
          <div className="bg-[var(--bg-muted)] rounded-[10px] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck size={15} className="text-primary-500" />
                <span className="text-[13px] font-extrabold text-[var(--text-secondary)]">금일 스케줄 리스트</span>
                <span className="text-[11px] bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full px-2 py-0.5 font-bold">{todayTasks.length}건</span>
              </div>
              <span className="text-[12px] text-[var(--text-muted)] font-semibold">{dateStrKo}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px] min-w-[800px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    <th className="text-left py-2 px-2 font-bold text-[var(--text-muted)] min-w-[140px]">업무명</th>
                    <th className="text-left py-2 px-2 font-bold text-[var(--text-muted)]">지시자</th>
                    <th className="text-left py-2 px-2 font-bold text-[var(--text-muted)]">협업자</th>
                    <th className="text-left py-2 px-2 font-bold text-[var(--text-muted)]">지시일</th>
                    <th className="text-center py-2 px-2 font-bold text-[var(--text-muted)]">D-DAY</th>
                    <th className="text-center py-2 px-2 font-bold text-[var(--text-muted)]">진행율</th>
                    <th className="text-center py-2 px-2 font-bold text-[var(--text-muted)]">상태</th>
                    <th className="text-center py-2 px-2 font-bold text-[var(--text-muted)]">중요도</th>
                    <th className="text-center py-2 px-2 font-bold text-[var(--text-muted)]">보고</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTasks.length > 0 ? todayTasks.map(t => {
                    const stB = getStatusBadge(t.status || 'waiting')
                    const dDiff = Math.ceil((new Date(t.dueDate).getTime() - now.getTime()) / 86400000)
                    return (
                      <tr key={t.id} onClick={() => setProgressTask(t)}
                        className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer">
                        <td className="py-2.5 px-2 font-bold text-[var(--text-primary)]">{t.title}</td>
                        <td className="py-2.5 px-2 text-[var(--text-secondary)]">{getUser(t.assignerId)?.name || '-'}</td>
                        <td className="py-2.5 px-2 text-[var(--text-secondary)]">{(t.assigneeIds || []).map(id => getUser(id)?.name).filter(Boolean).join(', ') || '-'}</td>
                        <td className="py-2.5 px-2 text-[var(--text-muted)]">{(t as any).startDate || '-'}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={cn('text-[10px] font-bold', dDiff < 0 ? 'text-red-500' : dDiff <= 3 ? 'text-amber-500' : 'text-[var(--text-muted)]')}>
                            {dDiff < 0 ? `D+${Math.abs(dDiff)}` : dDiff === 0 ? 'D-DAY' : `D-${dDiff}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-[var(--text-primary)] font-bold">{t.progress || 0}%</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-0.5"
                            style={{ background: stB.color + '18', color: stB.color, borderLeft: `2px solid ${stB.color}` }}>✦ {stB.label}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {t.importance ? <span className="text-[10px] font-bold" style={{ color: getImpBadge(t.importance as string)?.color || '#f59e0b' }}>{String(t.importance)}</span> : <span className="text-[var(--text-muted)]">-</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {hasTodayHistory(t.id) ? (
                            <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">OK</span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">NO</span>
                          )}
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr><td colSpan={9} className="text-center py-10">
                      <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                        <span className="text-sm">금일 담당 업무가 없습니다</span>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ② 금일 일반업무 실행 보고 리스트 */}
          <div className="bg-[var(--bg-muted)] rounded-[10px] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-primary-500" />
                <span className="text-[13px] font-extrabold text-[var(--text-secondary)]">금일 일반업무 실행 보고 리스트</span>
                <span className="text-[11px] bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full px-2 py-0.5 font-bold">{execList.length}건</span>
              </div>
              <button onClick={() => { setShowExecForm(!showExecForm); setEditIdx(null); setExecTask(''); setExecTaskInput(''); setExecContent(''); setExecImp(''); setExecStatus('') }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold cursor-pointer hover:bg-primary-600 transition-colors">+ 업무보고</button>
            </div>

            {showExecForm && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[10px] p-4 mb-3">
                <div className="text-[12.5px] font-extrabold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
                  <FileText size={13} className="text-primary-500" /> {editIdx !== null ? '업무보고 수정' : '업무보고 등록'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {/* 업무명 - 상세업무 콤보박스 */}
                  <div className="relative">
                    <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">업무명 *</label>
                    <input type="text" value={execTaskInput}
                      onChange={e => handleTaskInputChange(e.target.value)}
                      onFocus={() => setShowTaskDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTaskDropdown(false), 200)}
                      placeholder="상세업무를 검색하거나 새로 입력하세요"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] text-xs outline-none focus:border-primary-400" />
                    {showTaskDropdown && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg max-h-[160px] overflow-y-auto">
                        {filteredDetailTasks.length > 0 ? filteredDetailTasks.map(d => (
                          <button key={d.id} onMouseDown={e => { e.preventDefault(); selectDetailTask(d.name) }}
                            className={cn('w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg-muted)] cursor-pointer transition-colors',
                              execTask === d.name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'text-[var(--text-primary)]')}>
                            {d.name}
                          </button>
                        )) : (
                          <div className="px-3 py-2 text-xs text-[var(--text-muted)]">
                            {execTaskInput.trim() ? <span>📝 "<strong>{execTaskInput}</strong>" 새 업무로 추가됩니다</span> : '등록된 상세업무가 없습니다'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">실행내용</label>
                    <input type="text" value={execContent} onChange={e => setExecContent(e.target.value)} placeholder="실행 내용..."
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] text-xs outline-none focus:border-primary-400" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">중요도</label>
                    <div className="flex flex-wrap gap-1 px-2 py-1.5 min-h-[36px] border border-[var(--border-default)] rounded-lg bg-[var(--bg-muted)] items-center">
                      {importances.map(imp => (
                        <button key={imp.id} onClick={() => setExecImp(execImp === imp.name ? '' : imp.name)}
                          className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer border transition-all',
                            execImp === imp.name ? 'text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-default)]')}
                          style={execImp === imp.name ? { background: imp.color || '#4f6ef7' } : {}}>
                          {imp.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">진행상태</label>
                    <div className="flex flex-wrap gap-1 px-2 py-1.5 min-h-[36px] border border-[var(--border-default)] rounded-lg bg-[var(--bg-muted)] items-center">
                      {statuses.map(s => (
                        <button key={s.id} onClick={() => setExecStatus(execStatus === s.name ? '' : s.name)}
                          className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer border transition-all',
                            execStatus === s.name ? 'text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-default)]')}
                          style={execStatus === s.name ? { background: s.color || '#4f6ef7' } : {}}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowExecForm(false); setEditIdx(null) }}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] cursor-pointer">취소</button>
                  <button onClick={addExecReport}
                    className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[11px] font-bold cursor-pointer hover:bg-primary-600">{editIdx !== null ? '수정' : '등록'}</button>
                </div>
              </div>
            )}

            {/* 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px] min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    <th className="text-left py-2 px-2 font-bold text-[var(--text-muted)] min-w-[120px]">업무명</th>
                    <th className="text-left py-2 px-2 font-bold text-[var(--text-muted)]">실행내용</th>
                    <th className="text-center py-2 px-2 font-bold text-[var(--text-muted)]">중요도</th>
                    <th className="text-center py-2 px-2 font-bold text-[var(--text-muted)]">진행상태</th>
                    <th className="text-center py-2 px-2 font-bold text-[var(--text-muted)]">정부파일</th>
                    <th className="text-center py-2 px-2 font-bold text-[var(--text-muted)]">저장시간</th>
                    <th className="text-center py-2 px-2 font-bold text-[var(--text-muted)]">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {execList.length > 0 ? execList.map((item, i) => {
                    const impB = item.imp ? getImpBadge(item.imp) : null
                    const stB = item.status ? getStatusBadge(item.status) : null
                    return (
                      <tr key={i} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-surface)] transition-colors">
                        <td className="py-2.5 px-2 font-bold text-[var(--text-primary)]">{item.task}</td>
                        <td className="py-2.5 px-2 text-[var(--text-secondary)]">{item.content || '-'}</td>
                        <td className="py-2.5 px-2 text-center">
                          {impB ? <span className="text-[13px]" title={impB.label} style={{ color: impB.color }}>{impB.icon ? renderIcon(impB.icon, 15) : '●'}</span> : <span className="text-[var(--text-muted)]">-</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {stB ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-0.5" style={{ background: stB.color + '18', color: stB.color, borderLeft: `2px solid ${stB.color}` }}>✦ {stB.label}</span> : <span className="text-[var(--text-muted)]">-</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[var(--text-muted)]">-</td>
                        <td className="py-2.5 px-2 text-center text-[var(--text-secondary)] font-semibold">{item.time}</td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => editExec(i)} className="w-6 h-6 rounded flex items-center justify-center text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors"><Pencil size={12} /></button>
                            <button onClick={() => deleteExec(i)} className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr><td colSpan={7} className="text-center py-8 text-[var(--text-muted)] text-sm">등록된 업무보고가 없습니다</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)] shrink-0">
          <button onClick={onClose} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">닫기</button>
        </div>
      </div>

      {/* 스케줄 클릭 → 진행보고서 모달 */}
      {progressTask && (
        <ProgressReportModal
          open={!!progressTask}
          task={{ id: progressTask.id, title: progressTask.title, progress: progressTask.progress || 0, status: progressTask.status || 'waiting', dueDate: progressTask.dueDate, startDate: progressTask.startDate, desc: progressTask.desc, assigneeIds: progressTask.assigneeIds, assignerId: progressTask.assignerId }}
          onClose={() => { setProgressTask(null); setRefreshKey(k => k + 1) }}
        />
      )}
    </div>,
    document.body
  )
}


/* ═══════════════════════════════════════════
   내가 기획한 업무작성 모달 (지시사항 모달 UI 동일)
   ═══════════════════════════════════════════ */
export function ScheduleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentUser = useAuthStore(s => s.user)
  const myId = currentUser?.id ? Number(currentUser.id) : null
  const tasks = getItem<TaskItem[]>('ws_tasks', [])
  const taskResults = getItem<Array<{ id: number; name: string; icon?: string; color?: string }>>('ws_task_results', [])
  const reportTypes = getItem<Array<{ id: number; name?: string; label?: string }>>('ws_report_types', [])
  const importances = getItem<Array<{ id: number; name: string; icon?: string; color?: string }>>('ws_instr_importances', [])
  const statuses = getItem<Array<{ id: number; name: string; color?: string }>>('ws_task_statuses', [])
  const detailTasks = getItem<Array<{ id: number; name: string }>>('ws_detail_tasks', [])

  const [title, setTitle] = useState('')
  const [nature, setNature] = useState<'일일업무' | '기간업무'>('일일업무')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [scoreMin, setScoreMin] = useState('')
  const [scoreMax, setScoreMax] = useState('')
  const [selectedImportances, setSelectedImportances] = useState<string[]>([])
  const [status, setStatus] = useState('')
  const [content, setContent] = useState('')
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [selectedProcedure, setSelectedProcedure] = useState<string[]>([])
  const [selectedDetails, setSelectedDetails] = useState<number[]>([])
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number; type: string; dataUrl?: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 기존 업무 선택 지원
  const [taskSearch, setTaskSearch] = useState('')
  const [selectedTask, setSelectedTask] = useState('')
  const [taskPopup, setTaskPopup] = useState(false)
  const filteredTasks = useMemo(() =>
    tasks.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase())),
    [tasks, taskSearch]
  )
  const isNewTask = !selectedTask && title.trim().length > 0

  const toggleImportance = (name: string) => {
    setSelectedImportances(prev => prev.includes(name) ? [] : [name])
  }
  const toggleResult = (name: string) => {
    setSelectedResults(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }
  const toggleDetail = (id: number) => {
    setSelectedDetails(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id])
  }
  const addProcedure = (name: string) => {
    setSelectedProcedure(prev => [...prev, name])
  }
  const removeProcedureAt = (idx: number) => {
    setSelectedProcedure(prev => prev.filter((_, i) => i !== idx))
  }

  const handleTaskInput = (value: string) => {
    setTitle(value)
    setTaskSearch(value)
    const matched = tasks.find(t => t.title === value)
    if (matched) {
      setSelectedTask(String(matched.id))
    } else {
      setSelectedTask('')
    }
  }

  const selectTask = (taskId: string) => {
    setSelectedTask(taskId)
    const task = tasks.find(t => String(t.id) === taskId)
    if (task) {
      setTitle(task.title)
      if (task.desc) setContent(task.desc)
      if (task.startDate) setStartDate(task.startDate as string)
      if (task.dueDate) setDueDate(task.dueDate)
      if (task.stepIds && task.stepIds.length > 0) {
        const names = task.stepIds
          .map((sid: number) => { const r = reportTypes.find(r => r.id === sid); return r?.name || r?.label })
          .filter(Boolean) as string[]
        setSelectedProcedure(names)
      }
      const dIds = (task.detailIds as number[]) || []
      setSelectedDetails(dIds)
      if (task.resultIds) {
        const rNames = (task.resultIds as number[])
          .map(rid => taskResults.find(r => r.id === rid)?.name)
          .filter(Boolean) as string[]
        setSelectedResults(rNames)
      }
    }
    setTaskPopup(false)
  }

  const handleSave = () => {
    if (!title.trim() || !dueDate) {
      alert('업무명과 완료 계획일을 입력해주세요.')
      return
    }
    const now = new Date().toISOString()
    const stepIds = selectedProcedure
      .map(pName => reportTypes.find(r => (r.name || r.label) === pName)?.id)
      .filter(Boolean) as number[]
    const resultIds = selectedResults
      .map(rName => taskResults.find(r => r.name === rName)?.id)
      .filter(Boolean) as number[]

    if (selectedTask) {
      // 기존 업무 업데이트
      const allTasks = getItem<TaskItem[]>('ws_tasks', [])
      setItem('ws_tasks', allTasks.map(t => {
        if (String(t.id) !== selectedTask) return t
        return {
          ...t,
          title,
          desc: content,
          stepIds,
          detailIds: selectedDetails,
          resultIds,
          dueDate,
          startDate: startDate || t.startDate,
          status: status || t.status,
          isSchedule: true,
          importance: selectedImportances.join(','),
        }
      }))
    } else {
      // 새 업무 추가
      const allTasks = getItem<TaskItem[]>('ws_tasks', [])
      const newTask: TaskItem = {
        id: Date.now(),
        title,
        status: status || 'pending',
        assigneeIds: myId ? [myId] : [],
        assignerId: myId || undefined,
        dueDate,
        startDate: startDate || now.slice(0, 10),
        isSchedule: true,
        isImportant: selectedImportances.length > 0,
        progress: 0,
        desc: content,
        stepIds,
        detailIds: selectedDetails,
        resultIds,
      }
      setItem('ws_tasks', [...allTasks, newTask])
    }

    // 지시사항 데이터 저장
    const newInstr = {
      id: Date.now(),
      taskId: selectedTask || String(Date.now()),
      assigneeIds: myId ? [myId] : [],
      nature,
      startDate,
      dueDate,
      scoreMin: Number(scoreMin) || 0,
      scoreMax: Number(scoreMax) || 100,
      importance: selectedImportances.join(','),
      status: status || 'pending',
      content,
      results: selectedResults,
      procedure: selectedProcedure.join(' → '),
      attachments: attachments.map(a => ({ name: a.name, size: a.size, type: a.type })),
      createdAt: now,
    }
    const instrList = getItem<unknown[]>('ws_instructions', [])
    setItem('ws_instructions', [...instrList, newInstr])

    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-end md:items-center justify-center md:p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[var(--bg-surface)] rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-[580px] h-[95vh] md:h-auto md:max-h-[92vh] flex flex-col animate-scaleIn"
        onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-default)] shrink-0">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-amber-400 to-amber-600 shadow-md flex items-center justify-center">
            <Briefcase size={15} className="text-white" />
          </div>
          <span className="text-sm font-extrabold text-[var(--text-primary)]">내가 기획한 업무작성</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* 업무 선택 (콤보박스) */}
          <div className="relative">
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <Briefcase size={12} /> 업무명 *
              {isNewTask && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">+ 새 업무</span>}
            </label>
            <input
              value={title}
              onChange={e => handleTaskInput(e.target.value)}
              onFocus={() => setTaskPopup(true)}
              placeholder="업무를 검색하거나 새 업무명을 입력하세요"
              className={cn(
                'w-full min-h-[40px] px-3 py-2 rounded-[10px] border bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] font-semibold outline-none transition-colors',
                isNewTask ? 'border-emerald-400 focus:border-emerald-500' : 'border-[var(--border-default)] focus:border-primary-400'
              )}
            />
            {taskPopup && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 p-2 max-h-[240px] overflow-hidden">
                <div className="max-h-[200px] overflow-y-auto flex flex-col gap-0.5">
                  {filteredTasks.map(t => (
                    <button key={t.id} onClick={() => selectTask(String(t.id))}
                      className={cn('text-left text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors',
                        String(t.id) === selectedTask ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}>
                      {t.title}
                    </button>
                  ))}
                  {filteredTasks.length === 0 && title.trim() && (
                    <div className="text-center text-xs py-3 space-y-1">
                      <div className="text-emerald-500 font-bold">✨ "{title.trim()}"</div>
                      <div className="text-[var(--text-muted)]">새 업무로 등록됩니다</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 업무성격 + 첨부파일 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <Layers size={12} /> 업무성격
              </label>
              <div className="flex gap-2">
                <button onClick={() => setNature('일일업무')}
                  className={cn('flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold cursor-pointer transition-all border',
                    nature === '일일업무' ? 'bg-primary-500 text-white border-primary-500' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-default)]')}>
                  <Clock size={13} /> 일일업무
                </button>
                <button onClick={() => setNature('기간업무')}
                  className={cn('flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold cursor-pointer transition-all border',
                    nature === '기간업무' ? 'bg-primary-500 text-white border-primary-500' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-default)]')}>
                  <BarChart2 size={13} /> 기간업무
                </button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <Paperclip size={12} /> 첨부파일
                {attachments.length > 0 && <span className="text-[9px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">{attachments.length}개</span>}
              </label>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
                const files = e.target.files
                if (!files) return
                Array.from(files).forEach(file => {
                  const reader = new FileReader()
                  reader.onload = () => {
                    setAttachments(prev => [...prev, { name: file.name, size: file.size, type: file.type, dataUrl: reader.result as string }])
                  }
                  reader.readAsDataURL(file)
                })
                e.target.value = ''
              }} />
              <div onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-[10px] border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 transition-colors flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Upload size={14} className="opacity-60" /> 파일 선택 (여러 개 가능)
              </div>
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((f, i) => {
                    const ext = f.name.split('.').pop()?.toLowerCase() || ''
                    const isImage = ['jpg','jpeg','png','gif','webp','svg'].includes(ext)
                    const isVideo = ['mp4','webm','mov','avi'].includes(ext)
                    const isExcel = ['xls','xlsx','csv'].includes(ext)
                    const IconComp = isImage ? ImageIcon : isVideo ? Film : isExcel ? FileSpreadsheet : File
                    const sizeStr = f.size < 1024 ? `${f.size}B` : f.size < 1048576 ? `${(f.size/1024).toFixed(1)}KB` : `${(f.size/1048576).toFixed(1)}MB`
                    return (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] group">
                        <IconComp size={14} className="text-[var(--text-muted)] shrink-0" />
                        <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate flex-1">{f.name}</span>
                        <span className="text-[9px] text-[var(--text-muted)] shrink-0">{sizeStr}</span>
                        <button onClick={(e) => { e.stopPropagation(); setAttachments(prev => prev.filter((_, j) => j !== i)) }}
                          className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 시작일 + 완료일 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <CalendarCheck size={12} /> 업무시작일
              </label>
              <DatePicker value={startDate} onChange={setStartDate} placeholder="날짜를 선택하세요" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <Calendar size={12} /> 완료 계획일 *
              </label>
              <DatePicker value={dueDate} onChange={setDueDate} placeholder="날짜를 선택하세요" />
            </div>
          </div>

          {/* 배점 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <Award size={12} /> 업무성공 배점
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input type="number" value={scoreMin} onChange={e => setScoreMin(e.target.value)} placeholder="0"
                  className="w-full px-3 py-2 pr-8 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] text-sm text-right outline-none focus:border-primary-400" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">에서</span>
              </div>
              <span className="text-[var(--text-muted)]">~</span>
              <div className="relative flex-1">
                <input type="number" value={scoreMax} onChange={e => setScoreMax(e.target.value)} placeholder="100"
                  className="w-full px-3 py-2 pr-8 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] text-sm text-right outline-none focus:border-primary-400" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">까지</span>
              </div>
            </div>
          </div>

          {/* 중요도 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <Flag size={12} /> 중요도
            </label>
            <div className="flex flex-wrap gap-1.5 px-3 py-2 min-h-[40px] border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] items-center">
              {importances.length > 0 ? importances.map(imp => (
                <button key={imp.id} onClick={() => toggleImportance(imp.name)}
                  className={cn('flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border',
                    selectedImportances.includes(imp.name)
                      ? 'text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent'
                  )}
                  style={selectedImportances.includes(imp.name) ? { background: imp.color || '#4f6ef7', borderColor: imp.color || '#4f6ef7' } : {}}>
                  {imp.icon && <span className="opacity-90">{renderIcon(imp.icon, 13)}</span>}
                  {imp.name}
                </button>
              )) : <span className="text-[11px] text-[var(--text-muted)]">기타설정에서 중요도를 등록하세요</span>}
            </div>
          </div>

          {/* 현재상태 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <Activity size={12} /> 현재상태
            </label>
            <div className="flex flex-wrap gap-1.5 px-3 py-2 min-h-[42px] border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] items-center">
              {statuses.length > 0 ? statuses.map(s => (
                <button key={s.id} onClick={() => setStatus(s.name)}
                  className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border',
                    status === s.name ? 'text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent'
                  )}
                  style={status === s.name ? { background: s.color || '#4f6ef7', borderColor: s.color || '#4f6ef7' } : {}}>
                  {s.name}
                </button>
              )) : <span className="text-[11px] text-[var(--text-muted)]">기타설정에서 상태를 등록하세요</span>}
            </div>
          </div>

          {/* 세부업무 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <Layers size={12} /> 세부업무
              {selectedDetails.length > 0 && <span className="text-[9px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">{selectedDetails.length}개</span>}
            </label>
            <div className="flex flex-wrap gap-1.5 px-3 py-2 min-h-[42px] border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] items-center">
              {detailTasks.length > 0 ? detailTasks.map(d => (
                <button key={d.id} onClick={() => toggleDetail(d.id)}
                  className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border',
                    selectedDetails.includes(d.id) ? 'bg-indigo-500 text-white border-indigo-500' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent')}>
                  {d.name}
                </button>
              )) : <span className="text-[11px] text-[var(--text-muted)]">기타설정에서 상세업무를 등록하세요</span>}
            </div>
          </div>

          {/* 업무설명 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <FileText size={12} /> 업무설명
            </label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
              placeholder="업무 내용을 상세히 입력하세요..."
              className="w-full px-3 py-2.5 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] text-sm outline-none focus:border-primary-400 resize-y min-h-[90px] leading-relaxed" />
          </div>

          {/* 예상결과물 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <ClipboardCheck size={12} /> 예상결과물
            </label>
            <div className="flex flex-wrap gap-1.5 px-3 py-2 min-h-[44px] border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] items-center">
              {taskResults.map(r => (
                <button key={r.id} onClick={() => toggleResult(r.name)}
                  className={cn('flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border',
                    selectedResults.includes(r.name) ? 'bg-primary-500 text-white border-primary-500' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent')}>
                  {r.icon && <span className="opacity-90">{renderIcon(r.icon, 13)}</span>}
                  {r.name}
                </button>
              ))}
              {taskResults.length === 0 && <span className="text-[11px] text-[var(--text-muted)]">기타설정에서 결과 유형을 등록하세요</span>}
            </div>
          </div>

          {/* 진행순서 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
              <ListOrdered size={12} /> 진행순서
            </label>
            <div className="border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] px-3 py-2 min-h-[44px] mb-2">
              <div className="flex flex-wrap gap-1.5 items-center min-h-[28px]">
                {selectedProcedure.length > 0
                  ? selectedProcedure.map((name, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-md">
                        {i + 1}. {name}
                        <button onClick={() => removeProcedureAt(i)} className="text-primary-400 hover:text-danger ml-0.5 cursor-pointer">×</button>
                      </span>
                    ))
                  : <span className="text-[11px] text-[var(--text-muted)]">아래 목록에서 더블클릭으로 순서 추가</span>
                }
              </div>
            </div>
            <div className="border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] px-3 py-2 min-h-[44px]">
              <div className="flex flex-wrap gap-1.5 items-center">
                {reportTypes.map(r => (
                  <button key={r.id} onDoubleClick={() => addProcedure((r.name || r.label) as string)}
                    className="text-[11px] font-semibold text-[var(--text-secondary)] px-2.5 py-1 rounded-full border border-[var(--border-default)] cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-300 transition-colors">
                    {r.name || r.label}
                  </button>
                ))}
                {reportTypes.length === 0 && <span className="text-[11px] text-[var(--text-muted)]">기타설정에서 보고 유형을 등록하세요</span>}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)] shrink-0">
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
            <X size={13} /> 닫기
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 cursor-pointer transition-colors shadow-sm">
            <Send size={13} /> 저장
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
/* ═══════════════════════════════════════════
   진행보고서 작성 모달 (이전 버전 UI 1:1)
   ═══════════════════════════════════════════ */
interface ProgressReportProps {
  open: boolean
  task: { id: number | string; title: string; progress: number; status?: string; dueDate?: string; startDate?: string; stepIds?: number[]; desc?: string; assigneeIds?: number[]; assignerId?: number; [key: string]: unknown } | null
  onClose: () => void
  mode?: 'report' | 'view'
}

export function ProgressReportModal({ open, task, onClose, mode = 'report' }: ProgressReportProps) {
  const users = getItem<UserItem[]>('ws_users', [])
  const taskResults = getItem<Array<{ id: number; name: string; icon?: string; color?: string }>>('ws_task_results', [])
  const statuses = getItem<Array<{ id: number; name: string; color?: string }>>('ws_task_statuses', [])
  const currentUser = useAuthStore(s => s.user)
  const myId = currentUser?.id ? Number(currentUser.id) : 0

  const [progress, setProgress] = useState(0)
  const [historyOpen, setHistoryOpen] = useState(true)
  const [memo, setMemo] = useState('')
  const [reportStatus, setReportStatus] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number; type: string; dataUrl?: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const historyKey = task ? `ws_progress_history_${task.id}` : ''
  const history = getItem<Array<{ id: number; progress: number; memo: string; status: string; reportedBy: number; reportedAt: string }>>(historyKey, [])
  void refreshKey

  useEffect(() => {
    if (open && task) {
      setProgress(task.progress || 0)
      setMemo('')
      setReportStatus('')
      setAttachments([])
    }
  }, [open, task])

  if (!open || !task) return null

  const getUser = (id?: number) => users.find(u => u.id === id)
  const assigner = getUser(task.assignerId)
  const assignees = (task.assigneeIds || []).map(id => getUser(id)).filter(Boolean) as UserItem[]
  const barColor = progress >= 100 ? '#22c55e' : progress >= 50 ? '#4f6ef7' : '#f59e0b'
  const resultIds = (task.resultIds as number[]) || []
  const resultNames = resultIds.map(rid => taskResults.find(r => r.id === rid)).filter(Boolean)

  // D-day 계산
  const daysLeft = task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000) : null
  const ddayLabel = daysLeft !== null ? (daysLeft >= 0 ? `D-${daysLeft}` : `D+${Math.abs(daysLeft)} 지연`) : ''
  const ddayColor = daysLeft !== null && daysLeft < 0 ? '#ef4444' : '#6b7280'

  // 상태 라벨/색상 - 마지막 히스토리 상태 우선
  const statusName = (() => {
    // 마지막 히스토리 상태 먼저 확인
    if (history.length > 0) {
      const lastStatus = history[history.length - 1].status
      const found = statuses.find(st => st.name === lastStatus)
      if (found) return { name: found.name, color: found.color || '#4f6ef7' }
      if (lastStatus.includes('완료')) return { name: lastStatus, color: '#22c55e' }
      if (lastStatus.includes('진행')) return { name: lastStatus, color: '#4f6ef7' }
      return { name: lastStatus, color: '#6b7280' }
    }
    const s = task.status as string || ''
    const found = statuses.find(st => st.name === s)
    if (found) return { name: found.name, color: found.color || '#4f6ef7' }
    if (s === 'in_progress' || s === 'progress') return { name: '진행중', color: '#22c55e' }
    if (s === 'waiting' || s === 'pending') return { name: '대기', color: '#f59e0b' }
    if (s === 'done' || s === 'complete') return { name: '완료', color: '#22c55e' }
    return { name: s || '미지정', color: '#9ca3af' }
  })()

  // 이전 진행률 (히스토리에서)
  const prevProgress = history.length > 0 ? history[history.length - 1].progress : (task.progress || 0)
  const progressDiff = progress - prevProgress



  const getBadge = (s: string) => {
    if (s.includes('완료')) return { bg: '#dcfce7', color: '#16a34a' }
    if (s.includes('진행')) return { bg: '#dbeafe', color: '#2563eb' }
    if (s.includes('담당')) return { bg: '#fef3c7', color: '#d97706' }
    return { bg: '#f3f4f6', color: '#6b7280' }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 animate-fadeIn" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-[var(--bg-surface)] w-full max-w-[680px] rounded-2xl shadow-2xl border border-[var(--border-default)] flex flex-col max-h-[92vh] overflow-hidden animate-scaleIn">

        {/* ═══ 헤더 ═══ */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border-default)] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center"><FileText size={16} className="text-white" /></div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[14px] font-extrabold text-[var(--text-primary)] truncate">{task.title}</span>
            <span className="text-[11px] text-[var(--text-muted)]">:</span>
            <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{mode === 'view' ? '진행현황' : '진행보고서 작성'}</span>
            <span className="text-[11px] font-black text-white px-2 py-0.5 rounded-md" style={{ background: barColor }}>{progress}%</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center cursor-pointer"><X size={15} className="text-[var(--text-muted)]" /></button>
        </div>

        {/* ═══ 바디 ═══ */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── 지시자 및 업무명 ── */}
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><Activity size={11} /> 지시자 및 업무명</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${statusName.color}20`, color: statusName.color, border: `1px solid ${statusName.color}40` }}>
                  ✦ {statusName.name}
                </span>
                {ddayLabel && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${ddayColor}15`, color: ddayColor, border: `1px solid ${ddayColor}30` }}>
                    {ddayLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--text-primary)]">
              {assigner && <Avatar name={assigner.name} color={assigner.color} size="xs" />}
              <span className="text-emerald-700 dark:text-emerald-400">{assigner?.name || '미지정'}</span>
              <span className="text-emerald-500">→</span>
              <span className="font-extrabold">{task.title}</span>
            </div>

            {/* 정보 행 - 이전 버전과 동일 */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mt-3 text-[10.5px]">
              <div className="flex items-center gap-1 bg-white/60 dark:bg-white/5 px-2 py-1 rounded-md">
                <span className="text-[var(--text-muted)] font-bold">시작일</span>
                <span className="font-bold text-[var(--text-primary)]">{task.startDate || '-'}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/60 dark:bg-white/5 px-2 py-1 rounded-md">
                <span className="text-[var(--text-muted)] font-bold">마감일</span>
                <span className="font-bold text-[var(--text-primary)]">{task.dueDate || '-'}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/60 dark:bg-white/5 px-2 py-1 rounded-md">
                <span className="text-[var(--text-muted)] font-bold">진행율</span>
                <div className="w-[40px] h-1.5 rounded-full bg-white/80 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${progress}%`, background: barColor }} /></div>
                <span className="font-bold" style={{ color: barColor }}>{progress}%</span>
              </div>
              {resultNames.length > 0 && (
                <div className="flex items-center gap-1 bg-white/60 dark:bg-white/5 px-2 py-1 rounded-md">
                  <span className="text-[var(--text-muted)] font-bold">예상(산출물 결과 구조)</span>
                  <div className="flex gap-1">
                    {resultNames.map(r => r && (
                      <span key={r.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 border border-[var(--border-default)]" style={{ color: r.color || '#4f6ef7' }}>
                        {r.icon && renderIcon(r.icon, 10)} {r.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {assignees.length > 0 && (
                <div className="flex items-center gap-1 bg-white/60 dark:bg-white/5 px-2 py-1 rounded-md">
                  <span className="text-[var(--text-muted)] font-bold">담당자</span>
                  <div className="flex -space-x-1">{assignees.map(u => <Avatar key={u.id} name={u.name} color={u.color} size="xs" />)}</div>
                </div>
              )}
            </div>
          </div>

          {/* ── 지시내용 ── */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5"><Megaphone size={12} /> 지시내용</label>
            <div className="px-3.5 py-3 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-muted)] text-[12px] text-[var(--text-secondary)] leading-relaxed min-h-[56px]">
              {task.desc || '지시 내용이 없습니다.'}
            </div>
          </div>

          {/* ── 진행보고서 작성 폼 ── */}
          {mode === 'report' && (
          <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
            <div className="text-[12px] font-extrabold text-primary-700 dark:text-primary-400 mb-3 flex items-center gap-1.5">
              <Pencil size={13} /> 진행보고서 작성
            </div>

            {/* 진행률 설정 - 레거시 스타일 */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1">
                  <BarChart2 size={12} /> 진행률 설정
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-md border border-[var(--border-default)]">이전: {prevProgress}%</span>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md',
                    progressDiff > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
                    progressDiff < 0 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' :
                    'text-[var(--text-muted)] bg-[var(--bg-surface)]'
                  )}>{progressDiff >= 0 ? '+' : ''}{progressDiff}%</span>
                </div>
              </div>
              {/* 큰 프로그레스 바 */}
              <div
                className="relative w-full h-10 rounded-xl bg-[var(--bg-subtle)] overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100 / 5) * 5
                  setProgress(Math.max(0, Math.min(100, pct)))
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-xl flex items-center transition-all duration-200"
                  style={{ width: `${Math.max(progress, 8)}%`, background: `linear-gradient(135deg, ${barColor}, ${barColor}cc)` }}
                >
                  <span className="text-white text-[12px] font-extrabold pl-3 whitespace-nowrap drop-shadow-sm">현재 {progress}%</span>
                </div>
                {/* 드래그 핸들 */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white shadow-md border border-[var(--border-default)] flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
                  style={{ left: `calc(${progress}% - 12px)` }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    const bar = e.currentTarget.parentElement!
                    const onMove = (ev: MouseEvent) => {
                      const rect = bar.getBoundingClientRect()
                      const pct = Math.round(((ev.clientX - rect.left) / rect.width) * 100 / 5) * 5
                      setProgress(Math.max(0, Math.min(100, pct)))
                    }
                    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                    window.addEventListener('mousemove', onMove)
                    window.addEventListener('mouseup', onUp)
                  }}
                >
                  <span className="text-[10px] text-[var(--text-muted)] leading-none">≡</span>
                </div>
              </div>
            </div>

            {/* 상태 선택 */}
            <div className="mb-3">
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <Activity size={12} /> 진행상태
              </label>
              <div className="flex flex-wrap gap-1.5">
                {statuses.length > 0 ? statuses.map(s => (
                  <button key={s.id} onClick={() => setReportStatus(s.name)}
                    className={cn('text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-all border',
                      reportStatus === s.name ? 'text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent'
                    )}
                    style={reportStatus === s.name ? { background: s.color || '#4f6ef7', borderColor: s.color || '#4f6ef7' } : {}}>
                    {s.name}
                  </button>
                )) : (
                  <>
                    {[{ name: '진행중', color: '#4f6ef7' }, { name: '담당자 확인', color: '#f59e0b' }, { name: '완료', color: '#22c55e' }].map(s => (
                      <button key={s.name} onClick={() => setReportStatus(s.name)}
                        className={cn('text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-all border',
                          reportStatus === s.name ? 'text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent'
                        )}
                        style={reportStatus === s.name ? { background: s.color, borderColor: s.color } : {}}>
                        {s.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* 보고 내용 */}
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1.5">
                <FileText size={12} /> 보고 내용
              </label>
              <textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                rows={3}
                placeholder="진행 상황, 특이사항, 문제점 등을 입력하세요..."
                className="w-full px-3 py-2.5 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm outline-none focus:border-primary-400 resize-y min-h-[80px] leading-relaxed"
              />
            </div>
          </div>
          )}

          {/* ── 첨부파일 ── */}
          {mode === 'report' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1">
                <Paperclip size={12} /> 첨부파일
                {attachments.length > 0 && <span className="text-[9px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">{attachments.length}개</span>}
              </label>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
                const files = e.target.files
                if (!files) return
                Array.from(files).forEach(file => {
                  const reader = new FileReader()
                  reader.onload = () => {
                    setAttachments(prev => [...prev, {
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      dataUrl: reader.result as string,
                    }])
                  }
                  reader.readAsDataURL(file)
                })
                e.target.value = ''
              }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[11px] font-bold cursor-pointer hover:bg-primary-600 transition-colors"
              >
                <Upload size={12} /> 파일 추가
              </button>
            </div>
            <div className="rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-muted)] overflow-hidden">
              {attachments.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-[var(--text-muted)]">
                  등록된 첨부파일이 없습니다
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-default)]">
                  {attachments.map((f, i) => {
                    const ext = f.name.split('.').pop()?.toLowerCase() || ''
                    const isImage = ['jpg','jpeg','png','gif','webp','svg'].includes(ext)
                    const isVideo = ['mp4','webm','mov','avi'].includes(ext)
                    const isExcel = ['xls','xlsx','csv'].includes(ext)
                    const IconComp = isImage ? ImageIcon : isVideo ? Film : isExcel ? FileSpreadsheet : File
                    const sizeStr = f.size < 1024 ? `${f.size}B` : f.size < 1048576 ? `${(f.size/1024).toFixed(1)}KB` : `${(f.size/1048576).toFixed(1)}MB`
                    return (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--bg-surface)] transition-colors group">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: isImage ? '#dbeafe' : isVideo ? '#fce7f3' : isExcel ? '#dcfce7' : '#f3f4f6' }}>
                          <IconComp size={14} style={{ color: isImage ? '#3b82f6' : isVideo ? '#ec4899' : isExcel ? '#22c55e' : '#6b7280' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{f.name}</div>
                          <div className="text-[9px] text-[var(--text-muted)]">{sizeStr}</div>
                        </div>
                        <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          )}





          {/* ── 업무 히스토리 ── */}
          <div>
            <button onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)] cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors">
              <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                <Clock size={12} /> 업무 히스토리
                <span className="text-[9px] bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded font-bold">{history.length}건</span>
              </span>
              <span className="text-[var(--text-muted)]">{historyOpen ? '▲' : '▼'}</span>
            </button>
            {historyOpen && history.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-[200px] overflow-y-auto">
                {[...history].reverse().map(h => {
                  const reporter = getUser(h.reportedBy)
                  const d = new Date(h.reportedAt)
                  const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                  const b = getBadge(h.status)
                  return (
                    <div key={h.id} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
                      {reporter && <Avatar name={reporter.name} color={reporter.color} size="xs" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: b.bg, color: b.color }}>{h.status}</span>
                          {h.progress !== undefined && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-600">{h.progress}%</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5">{h.memo}</p>
                      </div>
                      <span className="text-[9px] text-[var(--text-muted)] shrink-0">{ds}</span>
                    </div>
                  )
                })}
              </div>
            )}
            {historyOpen && history.length === 0 && <div className="mt-2 text-center text-[11px] text-[var(--text-muted)] py-4">보고 이력이 없습니다</div>}
          </div>
        </div>

        {/* ═══ 푸터 ═══ */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)] shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">닫기</button>
          {mode === 'report' && (
          <button
            onClick={() => {
              if (!memo.trim()) { alert('보고 내용을 입력해주세요.'); return }
              // 히스토리 저장
              const newEntry = {
                id: Date.now(),
                progress,
                memo: memo.trim(),
                status: reportStatus || '진행중',
                reportedBy: myId,
                reportedAt: new Date().toISOString(),
              }
              const updated = [...history, newEntry]
              setItem(historyKey, updated)
              // 업무 진행률/상태 반영
              const allTasks = getItem<TaskItem[]>('ws_tasks', [])
              const updatedTasks = allTasks.map(t => {
                if (String(t.id) !== String(task.id)) return t
                return {
                  ...t,
                  progress,
                  status: progress >= 100 ? 'done' : reportStatus === '완료' ? 'done' : reportStatus === '진행중' ? 'progress' : t.status,
                }
              })
              setItem('ws_tasks', updatedTasks)
              setRefreshKey(k => k + 1)
              setMemo('')
              setReportStatus('')
              onClose()
            }}
            className="px-5 py-2 rounded-lg bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Send size={13} /> 보고서 저장
          </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
