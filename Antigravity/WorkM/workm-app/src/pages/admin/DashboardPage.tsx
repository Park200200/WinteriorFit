import { useState, useMemo, useRef, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { InstructionModal, DailyReportModal, ScheduleModal, ProgressReportModal } from '../../components/modals/DashboardModals'

import { Avatar } from '../../components/ui/Avatar'
import { EmptyState } from '../../components/common/EmptyState'
import { cn } from '../../utils/cn'
import { getItem } from '../../utils/storage'
import { renderIcon } from '../../utils/iconMap'
import { getDday } from '../../utils/format'
import {
  ClipboardList, PlayCircle, AlertTriangle, Zap, CheckCircle2,
  ChevronDown, ChevronUp, Star, Send as SendIcon, Download, Calendar as CalIcon,
  AlertCircle, MessageSquare, FileText, Lightbulb, ArrowRight,
} from 'lucide-react'
import { setItem as setStorageItem } from '../../utils/storage'
import { formatDate } from '../../utils/format'

/* ─────────────────────────────────────────────
   타입
   ───────────────────────────────────────────── */
interface TaskItem {
  id: number | string
  title: string
  desc?: string
  description?: string
  status: string
  priority?: string
  progress: number
  dueDate: string
  createdAt?: string
  startedAt?: string | null
  assignerId?: number
  assigneeIds?: number[]
  assigneeId?: number
  isImportant?: boolean
  isSchedule?: boolean
  team?: string
  importance?: string
  history?: Array<{ date: string; event: string; detail: string; icon?: string; color?: string }>
}

interface UserItem {
  id: number
  name: string
  color?: string
  avatar?: string
  dept?: string
  rank?: string
  role?: string
  position?: string
}

interface ChatMessage {
  id: number
  senderId: number
  text: string
  time: string
}

/* ─────────────────────────────────────────────
   유틸
   ───────────────────────────────────────────── */
function getStatusLabel(s: string) {
  return { waiting: '대기', progress: '진행중', delay: '지연', done: '완료' }[s] || s
}

function getStatusColor(s: string) {
  return { waiting: '#9ca3af', progress: '#06b6d4', delay: '#ef4444', done: '#22c55e' }[s] || '#4f6ef7'
}

function getDdayBadge(dueDate: string) {
  const d = getDday(dueDate)
  if (d < 0) return { cls: 'text-danger bg-red-50 dark:bg-red-900/20', label: `D+${Math.abs(d)} 지연` }
  if (d === 0) return { cls: 'text-danger bg-red-50 dark:bg-red-900/20 font-bold', label: 'D-DAY' }
  if (d <= 2) return { cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', label: `D-${d}` }
  if (d <= 7) return { cls: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20', label: `D-${d}` }
  return { cls: 'text-[var(--text-muted)] bg-[var(--bg-muted)]', label: `D-${d}` }
}

/* ─────────────────────────────────────────────
   대시보드 메인
   ───────────────────────────────────────────── */
export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [refreshKey, setRefreshKey] = useState(0)
  const tasks = useMemo(() => getItem<TaskItem[]>('ws_tasks', []), [refreshKey])
  const users = getItem<UserItem[]>('ws_users', [])

  // 출퇴근 데이터 (모바일 위젯용)
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const pad2 = (n: number) => String(n).padStart(2, '0')
  const todayKey = `ws_attendance_${now.toISOString().slice(0, 10)}`
  const attendData = getItem<{ checkInRaw: string | null }>(todayKey, { checkInRaw: null })
  const attendCheckIn = attendData.checkInRaw || '--:--'
  const attendNowTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
  const attendWorkTime = useMemo(() => {
    if (!attendData.checkInRaw) return '--:--'
    const [h, m] = attendData.checkInRaw.split(':').map(Number)
    const cin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
    const diff = now.getTime() - cin.getTime()
    if (diff < 0) return '00:00'
    const totalMin = Math.floor(diff / 60000)
    return `${pad2(Math.floor(totalMin / 60))}:${pad2(totalMin % 60)}`
  }, [attendData.checkInRaw, now])

  const myId = user?.id ? Number(user.id) : null

  // 내가 지시한 업무 (스케줄 제외)
  const assignedByMe = useMemo(() =>
    tasks.filter(t => t.assignerId === myId && !t.isSchedule),
    [tasks, myId]
  )

  // 내가 지시받은 업무
  const assignedToMe = useMemo(() =>
    tasks.filter(t => {
      const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
      return ids.some(id => id === myId)
    }).sort((a, b) => {
      const po: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (po[a.priority || 'medium'] || 1) - (po[b.priority || 'medium'] || 1)
    }),
    [tasks, myId]
  )

  // 내가 기획한 내업무 (스케줄)
  const scheduleByMe = useMemo(() =>
    tasks.filter(t => t.isSchedule || (!t.assignerId && !t.assigneeId && !(t.assigneeIds?.length))),
    [tasks]
  )

  // 오늘 마감 업무
  const dueTodayTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tasks.filter(t => {
      const d = new Date(t.dueDate)
      d.setHours(0, 0, 0, 0)
      return d.getTime() === today.getTime() && t.status !== 'done'
    })
  }, [tasks])

  // 통계
  const delayCount = tasks.filter(t => t.status === 'delay').length
  const doneCount = tasks.filter(t => t.status === 'done').length
  const progressCount = tasks.filter(t => t.status === 'progress').length

  const stats = [
    { label: '전체 업무', value: tasks.length, icon: ClipboardList, color: '#4f6ef7', bg: 'rgba(79,110,247,.12)', sub: '이번달 업무 현황', subColor: '#22c55e' },
    { label: '진행 중', value: progressCount, icon: PlayCircle, color: '#06b6d4', bg: 'rgba(6,182,212,.12)', sub: '현재 수행 업무', subColor: '#4f6ef7' },
    { label: '지연 업무', value: delayCount, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,.12)', sub: delayCount > 0 ? '즉시 조치 필요' : '정상 범위', subColor: delayCount > 0 ? '#ef4444' : '#22c55e' },
    { label: 'D-Day 업무', value: dueTodayTasks.length, icon: Zap, color: '#f59e0b', bg: 'rgba(245,158,11,.12)', sub: dueTodayTasks.length > 0 ? '오늘 마감!' : '없음', subColor: dueTodayTasks.length > 0 ? '#f59e0b' : '#22c55e' },
    { label: '완료 업무', value: doneCount, icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,.12)', sub: '이번달 누적', subColor: '#22c55e' },
  ]

  // 아코디언 상태
  const [openSection, setOpenSection] = useState('byMe')

  const sections = [
    { key: 'byMe', color: '#4f6ef7', icon: SendIcon, title: '내가 지시한 리스트', count: assignedByMe.length },
    { key: 'received', color: '#9747ff', icon: Download, title: '내가 지시받은 업무', count: assignedToMe.length },
    { key: 'schedule', color: '#06b6d4', icon: CalIcon, title: '내가 기획한 내업무', count: scheduleByMe.length },
    { key: 'dueToday', color: '#ef4444', icon: AlertCircle, title: '오늘이 마감인 업무', count: dueTodayTasks.length },
  ]

  // 간트 차트용 데이터
  const ganttTasks = useMemo(() =>
    tasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 6),
    [tasks]
  )

  // 채팅
  const [chatInput, setChatInput] = useState('')
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [instrOpen, setInstrOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [activeTaskChannel, setActiveTaskChannel] = useState<TaskItem | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [progressTask, setProgressTask] = useState<any>(null)
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const mobileChatBodyRef = useRef<HTMLDivElement>(null)

  // 채팅 채널 키: 업무별 또는 전체
  const chatKey = activeTaskChannel ? `ws_messages_task_${activeTaskChannel.id}` : 'ws_messages'
  const messages = getItem<ChatMessage[]>(chatKey, [])

  // 활성 채널의 관련 멤버 (본인 제외)
  const channelMembers = useMemo(() => {
    if (!activeTaskChannel) return users.filter(u => u.id !== myId).slice(0, 5)
    const ids = new Set<number>()
    if (activeTaskChannel.assignerId) ids.add(activeTaskChannel.assignerId)
    if (activeTaskChannel.assigneeIds) activeTaskChannel.assigneeIds.forEach(id => ids.add(id))
    if (activeTaskChannel.assigneeId) ids.add(activeTaskChannel.assigneeId as number)
    ids.delete(myId || 0)
    return users.filter(u => ids.has(u.id))
  }, [activeTaskChannel, users, myId])

  const channelTitle = activeTaskChannel
    ? `${activeTaskChannel.title} 메시지 채널`
    : '실시간 메시지 채널'

  const sendMessage = () => {
    if (!chatInput.trim() || !myId) return
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    const newMsg: ChatMessage = { id: Date.now(), senderId: myId, text: chatInput.trim(), time: timeStr }
    const updated = [...messages, newMsg]
    setStorageItem(chatKey, updated)
    setChatInput('')
    setRefreshKey(k => k + 1)
    // 스크롤
    setTimeout(() => {
      if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }, 50)
  }

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    if (mobileChatBodyRef.current) mobileChatBodyRef.current.scrollTop = mobileChatBodyRef.current.scrollHeight
  }, [mobileChatOpen])

  return (
    <div className="animate-fadeIn">
      {/* ── 대시보드 헤더 ── */}
      <div className="mb-4 md:mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-3">
            {user && (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary-400/20 to-primary-600/20 border border-primary-200/50 dark:border-primary-800/50 flex items-center justify-center shrink-0">
                <Avatar name={user.name} color={user.color} size="sm" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-extrabold text-[var(--text-primary)]">
                  {user?.name || '-'}
                </h1>
                {/* 직급 배지 */}
                {(user as UserItem)?.rank && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                    {(user as UserItem).rank}님
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-[var(--text-muted)]">
                오늘도 좋은 하루 되세요!
              </p>
            </div>
          </div>

          {/* 오른쪽: 출퇴근 위젯(모바일) + 날짜 + 액션 버튼 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 모바일 출퇴근 위젯 */}
            <div className="flex lg:hidden items-center gap-0.5 bg-[var(--bg-muted)] rounded-xl px-1 py-0.5 border border-[var(--border-default)]">
              <div className="flex flex-col items-center px-2 py-1">
                <span className="text-[8px] font-bold text-[var(--text-muted)]">출근</span>
                <span className="text-[11px] font-extrabold text-green-600 dark:text-green-400 tabular-nums">{attendCheckIn}</span>
              </div>
              <div className="flex flex-col items-center px-2 py-1">
                <span className="text-[8px] font-bold text-[var(--text-muted)]">현재</span>
                <span className="text-[11px] font-extrabold text-[var(--text-primary)] tabular-nums">{attendNowTime}</span>
              </div>
              <div className="flex flex-col items-center px-2 py-1">
                <span className="text-[8px] font-bold text-[var(--text-muted)]">근무</span>
                <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">{attendWorkTime}</span>
              </div>
              <button className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center cursor-pointer">
                <ArrowRight size={13} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* 날짜 표시 (모바일에서도 보임) */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-[var(--text-muted)] font-semibold">
            {formatDate(new Date())}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setInstrOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:border-primary-400 hover:text-primary-500 transition-all cursor-pointer">
              <FileText size={13} /> 지시사항
            </button>
            <button onClick={() => setReportOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:border-primary-400 hover:text-primary-500 transition-all cursor-pointer">
              <ClipboardList size={13} /> 일보작성
            </button>
            <button onClick={() => setScheduleOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 transition-colors shadow-sm cursor-pointer">
              <Lightbulb size={13} /> 내가기획
            </button>
          </div>
        </div>
      </div>

      {/* ── 5개 통계 카드 ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mb-5">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 md:p-4 hover:border-[var(--border-strong)] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: s.bg, color: s.color }}
                >
                  <Icon size={17} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">{s.value}</div>
              <div className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] mt-0.5">{s.label}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: s.subColor }}>{s.sub}</div>
            </div>
          )
        })}
      </div>

      {/* ── 간트 차트 ── */}
      <GanttChart tasks={ganttTasks} users={users} />

      {/* ── 메인 그리드: 채팅 + 아코디언 (2컬럼) ── */}
      <div className="mt-4 md:mt-5 grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-3">
        {/* 채팅 위젯 (데스크톱만) */}
        <div className="hidden lg:flex bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl flex-col h-[500px] lg:h-[600px]">
          {/* 채팅 헤더 */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-default)] shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <MessageSquare size={14} className="text-primary-500" />
            </div>
            <span className="text-[13px] font-bold text-[var(--text-primary)] truncate flex-1 min-w-0">{channelTitle}</span>
            {activeTaskChannel && (
              <button onClick={() => setActiveTaskChannel(null)}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >전체채널</button>
            )}
            {/* 멤버 아바타 */}
            <div className="flex items-center shrink-0">
              {channelMembers.map((u, i) => (
                <div
                  key={u.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white border-2 border-[var(--bg-surface)] shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${u.color || '#4f6ef7'}, #9747ff)`,
                    marginLeft: i > 0 ? '-8px' : '0',
                    zIndex: 5 - i,
                  }}
                  title={u.name}
                >
                  {u.avatar || u.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>

          {/* 채팅 바디 */}
          <div ref={chatBodyRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">
                메시지가 없습니다
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === myId
                const sender = users.find(u => u.id === m.senderId)
                return (
                  <div key={m.id} className={cn('flex gap-2', isMe && 'flex-row-reverse')}>
                    {!isMe && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, ${sender?.color || '#9747ff'}, #4f6ef7)` }}
                      >
                        {sender?.avatar || sender?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className={cn('max-w-[75%]', isMe && 'items-end')}>
                      {!isMe && (
                        <div className="text-[10px] font-bold text-[var(--text-muted)] mb-0.5">{sender?.name || '알수없음'}</div>
                      )}
                      <div className={cn('flex items-end gap-1.5', isMe && 'flex-row-reverse')}>
                        <div
                          className={cn(
                            'px-3 py-2 rounded-2xl text-[12.5px] leading-snug',
                            isMe
                              ? 'bg-primary-500 text-white rounded-br-sm'
                              : 'bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-bl-sm',
                          )}
                        >
                          {m.text}
                        </div>
                        <span className="text-[9px] text-[var(--text-muted)] shrink-0">{m.time}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 채팅 입력 */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[var(--border-default)] shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 text-sm bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <button
              onClick={sendMessage}
              className="w-8 h-8 rounded-lg bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer"
            >
              <SendIcon size={14} />
            </button>
          </div>
        </div>

        {/* 아코디언 */}
        <div className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            const isOpen = openSection === section.key
            return (
              <div
                key={section.key}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden transition-all"
              >
                {/* 아코디언 헤드 */}
                <button
                  onClick={() => setOpenSection(isOpen ? '' : section.key)}
                  className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--bg-muted)] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${section.color}18` }}
                    >
                      <Icon size={14} style={{ color: section.color }} />
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{section.title}</span>
                    <span
                      className={cn(
                        'text-[10px] font-bold rounded-md px-1.5 py-0.5',
                        section.key === 'dueToday' && section.count > 0
                          ? 'bg-red-50 dark:bg-red-900/20 text-danger'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
                      )}
                    >
                      {section.count}건
                    </span>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                </button>

                {/* 아코디언 바디 */}
                {isOpen && (
                  <div className="border-t border-[var(--border-default)] animate-fadeIn">
                    {section.key === 'byMe' && (
                      <TaskTable tasks={assignedByMe} users={users} type="byMe" onEdit={(id) => { setEditTaskId(String(id)); setInstrOpen(true) }} onChat={(t) => setActiveTaskChannel(t)} onProgress={(t) => setProgressTask(t)} />
                    )}
                    {section.key === 'received' && (
                      <TaskTable tasks={assignedToMe} users={users} type="received" onEdit={(id) => { setEditTaskId(String(id)); setInstrOpen(true) }} onChat={(t) => setActiveTaskChannel(t)} onProgress={(t) => setProgressTask(t)} />
                    )}
                    {section.key === 'schedule' && (
                      <TaskTable tasks={scheduleByMe} users={users} type="schedule" onEdit={(id) => { setEditTaskId(String(id)); setInstrOpen(true) }} onChat={(t) => setActiveTaskChannel(t)} onProgress={(t) => setProgressTask(t)} />
                    )}
                    {section.key === 'dueToday' && (
                      <TaskTable tasks={dueTodayTasks} users={users} type="dueToday" onEdit={(id) => { setEditTaskId(String(id)); setInstrOpen(true) }} onChat={(t) => setActiveTaskChannel(t)} onProgress={(t) => setProgressTask(t)} />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 모바일 채팅 FAB ── */}
      <button
        onClick={() => setMobileChatOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
      >
        <MessageSquare size={22} />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {messages.length > 9 ? '9+' : messages.length}
          </span>
        )}
      </button>

      {/* ── 모바일 채팅 팝업 ── */}
      {mobileChatOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex flex-col bg-[var(--bg-surface)] animate-slideUp">
          {/* 팝업 헤더 */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-default)] shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <MessageSquare size={14} className="text-primary-500" />
            </div>
            <span className="text-[13px] font-bold text-[var(--text-primary)] flex-1 truncate">{channelTitle}</span>
            {activeTaskChannel && (
              <button onClick={() => setActiveTaskChannel(null)}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer mr-1">전체</button>
            )}
            <button
              onClick={() => setMobileChatOpen(false)}
              className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* 팝업 바디 */}
          <div ref={mobileChatBodyRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">
                메시지가 없습니다
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === myId
                const sender = users.find(u => u.id === m.senderId)
                return (
                  <div key={m.id} className={cn('flex gap-2', isMe && 'flex-row-reverse')}>
                    {!isMe && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, ${sender?.color || '#9747ff'}, #4f6ef7)` }}
                      >
                        {sender?.avatar || sender?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className={cn('max-w-[75%]', isMe && 'items-end')}>
                      {!isMe && (
                        <div className="text-[10px] font-bold text-[var(--text-muted)] mb-0.5">{sender?.name || '알수없음'}</div>
                      )}
                      <div className={cn('flex items-end gap-1.5', isMe && 'flex-row-reverse')}>
                        <div
                          className={cn(
                            'px-3 py-2 rounded-2xl text-[12.5px] leading-snug',
                            isMe
                              ? 'bg-primary-500 text-white rounded-br-sm'
                              : 'bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-bl-sm',
                          )}
                        >
                          {m.text}
                        </div>
                        <span className="text-[9px] text-[var(--text-muted)] shrink-0">{m.time}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 팝업 입력 */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[var(--border-default)] shrink-0 safe-area-bottom">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 text-sm bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <button
              onClick={sendMessage}
              className="w-10 h-10 rounded-xl bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer"
            >
              <SendIcon size={16} />
            </button>
          </div>
        </div>
      )}
      {/* ── 모달들 ── */}
      <InstructionModal open={instrOpen} editTaskId={editTaskId} onClose={() => { setInstrOpen(false); setEditTaskId(null); setRefreshKey(k => k + 1) }} />
      <DailyReportModal open={reportOpen} onClose={() => { setReportOpen(false); setRefreshKey(k => k + 1) }} />
      <ScheduleModal open={scheduleOpen} onClose={() => { setScheduleOpen(false); setRefreshKey(k => k + 1) }} />
      <ProgressReportModal open={!!progressTask} task={progressTask} onClose={() => { setProgressTask(null); setRefreshKey(k => k + 1) }} />
    </div>
  )
}

/* ─────────────────────────────────────────────
   간트 차트
   ───────────────────────────────────────────── */
function GanttChart({ tasks, users }: { tasks: TaskItem[]; users: UserItem[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalDays = window.innerWidth >= 1100 ? 14 : window.innerWidth >= 800 ? 10 : 7
  const daysForward = 1
  const daysBack = totalDays - 1 - daysForward

  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - daysBack)

  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return d
  })

  const todayOffset = ((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100
  const getUser = (id?: number) => users.find(u => u.id === id)

  if (tasks.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-default)]">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <CalIcon size={14} className="text-amber-600" />
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)]">미완료 내업무 리스트</span>
          <span className="text-[10px] font-bold bg-[var(--bg-muted)] text-[var(--text-muted)] rounded-md px-1.5 py-0.5">0건</span>
        </div>
        <div className="py-8 text-center">
          <div className="text-2xl mb-2">📭</div>
          <div className="text-sm text-[var(--text-muted)]">진행 중인 업무가 없습니다</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-default)]">
        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <CalIcon size={14} className="text-amber-600" />
        </div>
        <span className="text-sm font-bold text-[var(--text-primary)]">
          {window.innerWidth <= 767 ? '미완료 내업무 리스트' : '마감일 기준 미완료 나의 업무 차트'}
        </span>
        <span className="text-[10px] font-bold bg-[var(--bg-muted)] text-[var(--text-muted)] rounded-md px-1.5 py-0.5">
          {tasks.length}건
        </span>
        <span className="text-[10px] text-[var(--text-muted)] ml-0.5">&gt;</span>
        <span className="ml-auto text-[11px] text-[var(--text-muted)]">마감일 기준 정렬</span>
      </div>

      {/* 간트 테이블 */}
      <div className="overflow-x-auto">
        {/* 날짜 헤더 */}
        <div className="flex min-w-[600px]">
          <div className="w-[200px] shrink-0 px-3 py-2 text-[10px] font-bold text-[var(--text-muted)] uppercase border-b border-[var(--border-default)]">
            업무
          </div>
          <div className="flex-1 flex border-b border-[var(--border-default)]">
            {days.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString()
              return (
                <div
                  key={i}
                  className={cn(
                    'flex-1 text-center py-2 text-[10px] font-semibold',
                    isToday ? 'text-primary-500 font-bold bg-primary-50/50 dark:bg-primary-900/10' : 'text-[var(--text-muted)]',
                  )}
                >
                  {d.getMonth() + 1}/{d.getDate()}
                </div>
              )
            })}
          </div>
        </div>

        {/* 행 */}
        {tasks.map((t) => {
          const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
          const assignee = getUser(ids[0])
          const dd = getDdayBadge(t.dueDate)
          const due = new Date(t.dueDate)
          due.setHours(0, 0, 0, 0)
          const started = new Date(t.startedAt || t.createdAt || '')
          started.setHours(0, 0, 0, 0)

          const barStart = Math.max(0, ((started.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100)
          const barEnd = Math.min(100, ((due.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100 + (1 / totalDays * 100))
          const barWidth = Math.max(3, barEnd - barStart)

          const barColor = t.status === 'delay'
            ? '#ef4444'
            : t.status === 'done'
              ? '#22c55e'
              : getDday(t.dueDate) <= 2 ? '#f59e0b' : '#4f6ef7'

          return (
            <div key={t.id} className="flex min-w-[600px] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">
              {/* 업무 정보 */}
              <div className="w-[200px] shrink-0 px-3 py-2 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-1.5">
                  {t.isImportant && <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />}
                  <span className="text-[12px] font-bold text-[var(--text-primary)] truncate">{t.title}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-[var(--text-muted)]">{assignee?.name || '-'}</span>
                  <span className={cn('text-[9px] font-bold px-1 py-0.5 rounded', dd.cls)}>{dd.label}</span>
                </div>
              </div>

              {/* 바 영역 */}
              <div className="flex-1 relative border-b border-[var(--border-default)] py-2">
                {/* 오늘선 */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-primary-400 z-10"
                  style={{ left: `${todayOffset}%` }}
                />
                {/* 바 */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{
                    left: `${barStart}%`,
                    width: `${barWidth}%`,
                    background: `linear-gradient(135deg, ${barColor}, ${barColor}cc)`,
                    minWidth: '20px',
                  }}
                >
                  {barWidth > 8 ? `${t.progress}%` : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   테이블 기반 업무 목록 (기존 동일 레이아웃)
   ───────────────────────────────────────────── */
function TaskTable({
  tasks,
  users,
  type,
  onEdit,
  onChat,
  onProgress,
}: {
  tasks: TaskItem[]
  users: UserItem[]
  type: 'byMe' | 'received' | 'schedule' | 'dueToday'
  onEdit?: (taskId: number) => void
  onChat?: (task: TaskItem) => void
  onProgress?: (task: TaskItem) => void
}) {
  const getUser = (id?: number) => users.find(u => u.id === id)
  const importances = getItem<Array<{ id: number; name: string; icon?: string; color?: string }>>('ws_instr_importances', [])
  const instrList = getItem<Array<Record<string, unknown>>>('ws_instructions', [])

  if (tasks.length === 0) {
    const emojis = { byMe: '📭', received: '✨', schedule: '📅', dueToday: '🎉' }
    const texts = { byMe: '지시한 업무가 없습니다', received: '지시받은 업무가 없습니다', schedule: '계획된 내업무가 없습니다', dueToday: '오늘 마감인 업무가 없습니다!' }
    return <div className="p-6"><EmptyState emoji={emojis[type]} title={texts[type]} /></div>
  }

  // 테이블 열 설정
  const headers =
    type === 'byMe'
      ? ['업무명', '담당(수신)자', '상태', '진행률', '마감일', '중요도']
      : ['업무명', '지시(기획)자', '상태', '진행률', '마감일', '업무중요도']

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--border-default)]">
            {headers.map((h, i) => (
              <th key={i} className={cn(
                'px-3 py-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap',
                i === 0 && 'w-[25%]',
              )}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const dd = getDdayBadge(t.dueDate)
            const barColor = t.status === 'done' ? '#22c55e' : t.status === 'delay' ? '#ef4444' : '#4f6ef7'

            // 지시/수신자
            const ids = type === 'byMe'
              ? (Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []))
              : [t.assignerId || 0]
            const personUser = getUser(ids[0])

            // 중요도
            const instrRecord = instrList.find((i: Record<string, unknown>) =>
              i.id === t.id || i.id === Number(t.id) || i.taskId === String(t.id)
            )
            const impStr = (instrRecord?.importance as string) || t.importance || ''
            const impNames = impStr ? impStr.split(',').map(s => s.trim()).filter(Boolean) : []

            return (
              <tr
                key={t.id}
                onClick={() => onProgress?.(t)}
                className="border-b border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                {/* 업무명 */}
                <td className="px-3 py-2.5 w-[25%]">
                  <div className="flex items-center gap-1.5">
                    {impNames.length > 0 ? impNames.map((name) => {
                      const imp = importances.find(i => i.name === name)
                      return imp?.icon ? (
                        <span key={name} title={name} className="shrink-0" style={{ color: imp.color || '#9ca3af' }}>
                          {renderIcon(imp.icon, 14)}
                        </span>
                      ) : null
                    }) : null}
                    {t.isImportant && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                    {type === 'dueToday' && <AlertCircle size={12} className="text-danger shrink-0" />}
                    <span
                      className={cn(
                        'text-[12.5px] font-semibold truncate hover:underline hover:text-primary-500 cursor-pointer transition-colors',
                        type === 'dueToday' ? 'text-danger' : 'text-[var(--text-primary)]',
                      )}>
                      {t.title}
                    </span>
                  </div>
                  {t.team && <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{t.team}</div>}
                </td>

                {/* 담당자 아바타 */}
                <td className="px-3 py-2.5">
                  {personUser ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar name={personUser.name} color={personUser.color} size="xs" />
                      <span className="text-[11px] text-[var(--text-muted)] hidden lg:inline">{personUser.name}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)]">-</span>
                  )}
                </td>

                {/* 상태 */}
                <td className="px-3 py-2.5">
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-md inline-flex items-center"
                    style={{
                      background: `${getStatusColor(t.status)}18`,
                      color: getStatusColor(t.status),
                      borderLeft: `2.5px solid ${getStatusColor(t.status)}`,
                    }}
                  >
                    {getStatusLabel(t.status)}
                  </span>
                </td>

                {/* 진행률 */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5 group">
                    <div className="w-[60px] h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden shrink-0 group-hover:h-2.5 transition-all">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${t.progress}%`, background: barColor }}
                      />
                    </div>
                    <span className="text-[10.5px] font-bold text-[var(--text-primary)] min-w-[28px] text-right group-hover:text-primary-500 transition-colors">
                      {t.progress}%
                    </span>
                  </div>
                </td>

                {/* 마감일 */}
                <td className="px-3 py-2.5">
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', dd.cls)}>
                    {dd.label}
                  </span>
                </td>

                {/* 중요도 */}
                <td className="px-3 py-2.5">
                  <div className="flex gap-1 items-center">
                    {impNames.length > 0 ? impNames.map((name) => {
                      const imp = importances.find(i => i.name === name)
                      const c = imp?.color || '#9ca3af'
                      return (
                        <span
                          key={name}
                          title={name}
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: `${c}18`,
                            border: `1.5px solid ${c}`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                        </span>
                      )
                    }) : (
                      <span className="text-[11px] text-[var(--text-muted)]">-</span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
