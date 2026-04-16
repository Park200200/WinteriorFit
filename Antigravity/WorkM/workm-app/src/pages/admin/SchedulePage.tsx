import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { cn } from '../../utils/cn'
import { getItem } from '../../utils/storage'
import {
  ChevronLeft, ChevronRight, GripVertical,
  MoveHorizontal, MoveVertical,
} from 'lucide-react'

/* ─────────────────────────────────────────────
   타입
   ───────────────────────────────────────────── */
interface TaskItem {
  id: number | string
  title: string
  status: string
  progress: number
  dueDate: string
  startedAt?: string | null
  startDate?: string
  createdAt?: string
  taskNature?: string
}

/* ─── 상태 컬러 맵 ── */
const STATUS_COLOR: Record<string, string> = {
  done: '#22c55e', progress: '#4f6ef7', delay: '#ef4444',
  waiting: '#f59e0b', hold: '#8b5cf6', cancel: '#6b7280',
  fail: '#dc2626', edit: '#06b6d4', add: '#10b981',
}

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const DOW_LABELS = ['일','월','화','수','목','금','토']

/* 패딩 상수 */
const PAD_TOP = 10
const PAD_BOT = 10
const MIN_CW = 28
const MAX_CW = 160
const MIN_CH = 52
const MAX_CH = 220
const LABEL_W = 52

/* ─── 범례 아이템 ─── */
const LEGEND_ITEMS = [
  { label: '진행중', color: '#4f6ef7' },
  { label: '완료',   color: '#22c55e' },
  { label: '지연',   color: '#ef4444' },
  { label: '대기',   color: '#f59e0b' },
]

/* ─── 유틸 ─── */
function normalize(s?: string | null) {
  return s ? String(s).substring(0, 10) : null
}

function getTaskColor(status: string) {
  return STATUS_COLOR[status] || '#4f6ef7'
}

function getTasksForMonth(allTasks: TaskItem[], year: number, monthIdx: number) {
  const monthNum = monthIdx + 1
  const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`
  const lastDay = new Date(year, monthNum, 0).getDate()
  const monthEnd = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return allTasks.map(t => {
    const rawStart = normalize(t.startedAt) || normalize(t.startDate) || normalize(t.dueDate)
    const rawEnd = normalize(t.dueDate)
    if (!rawStart || !rawEnd) return null
    if (rawEnd < monthStart || rawStart > monthEnd) return null
    const sDate = rawStart > monthStart ? rawStart : monthStart
    const eDate = rawEnd < monthEnd ? rawEnd : monthEnd
    const startDay = parseInt(sDate.substring(8, 10)) || 1
    const endDay = parseInt(eDate.substring(8, 10)) || lastDay
    return { task: t, startDay, endDay, rawStart, rawEnd }
  }).filter(Boolean) as Array<{ task: TaskItem; startDay: number; endDay: number; rawStart: string; rawEnd: string }>
}

/* ═══════════════════════════════════════════
   SchedulePage 메인 컴포넌트
   ═══════════════════════════════════════════ */
export function SchedulePage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [cellW, setCellW] = useState(44)
  const [cellH, setCellH] = useState(68)
  const scrollRef = useRef<HTMLDivElement>(null)

  /* ── 업무 데이터 ── */
  const allTasks = useMemo(() => {
    const tasks = getItem<TaskItem[]>('ws_tasks', [])
    return tasks.filter(t => {
      const end = t.dueDate || null
      const start = t.startedAt || t.startDate || t.dueDate || null
      if (!end) return false
      const endYear = parseInt((end || '').substring(0, 4))
      const startYear = parseInt((start || end).substring(0, 4))
      return startYear <= year && endYear >= year
    })
  }, [year])

  /* ── 오늘 정보 ── */
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const thisYear = today.getFullYear()

  /* ── 드래그 스크롤 ── */
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0 })

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const t = e.target as HTMLElement
    if (t.closest('button, input, [data-knob]')) return
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      scrollX: scrollRef.current?.scrollLeft || 0,
      scrollY: scrollRef.current?.scrollTop || 0,
    }
    if (scrollRef.current) scrollRef.current.style.cursor = 'grabbing'
  }, [])

  const onDragMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current.dragging) return
    e.preventDefault()
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = dragState.current.scrollX - dx
      scrollRef.current.scrollTop = dragState.current.scrollY - dy
    }
  }, [])

  const onDragEnd = useCallback(() => {
    dragState.current.dragging = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }, [])

  /* ── 조이스틱 레버 컨트롤 ── */
  return (
    <div className="animate-fadeIn flex flex-col h-full">
      <PageHeader title="일정보기" subtitle="연간 업무 일정을 한눈에 확인합니다" />

      {/* 메인 컨테이너 */}
      <div className="flex-1 min-h-0 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden flex flex-col">
        {/* ── 컨트롤 바 ── */}
        <ControlBar
          year={year}
          cellW={cellW}
          cellH={cellH}
          onYearChange={setYear}
          onCellWChange={setCellW}
          onCellHChange={setCellH}
        />

        {/* ── 스크롤 영역 ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto select-none"
          style={{ cursor: 'grab' }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
        >
          <table
            className="border-collapse"
            style={{
              tableLayout: 'fixed',
              width: `${LABEL_W + cellW * 31}px`,
            }}
          >
            {/* ── 날짜 헤더 ── */}
            <thead>
              <tr className="sticky top-0 z-20" style={{ background: 'var(--bg-muted)' }}>
                <th
                  className="sticky left-0 z-30 text-[10px] font-bold text-[var(--text-muted)] text-center"
                  style={{
                    width: LABEL_W,
                    minWidth: LABEL_W,
                    background: 'var(--bg-muted)',
                    borderRight: '2px solid var(--border-default)',
                    borderBottom: '2px solid var(--border-default)',
                    padding: '5px 2px',
                  }}
                >
                  월 \ 일
                </th>
                {/* 헬퍼 th */}
                <th style={{ width: 0, minWidth: 0, maxWidth: 0, padding: 0, border: 'none', background: 'var(--bg-muted)' }} />
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                  const isToday = todayStr === `${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  return (
                    <th
                      key={d}
                      className="text-center"
                      style={{
                        width: cellW,
                        minWidth: cellW,
                        maxWidth: cellW,
                        fontSize: cellW >= 36 ? 11 : 9,
                        fontWeight: isToday ? 900 : 700,
                        padding: '5px 0',
                        borderRight: '1px solid var(--border-default)',
                        borderBottom: '2px solid var(--border-default)',
                        color: isToday ? '#4f6ef7' : 'var(--text-muted)',
                        background: isToday ? 'var(--bg-surface)' : 'var(--bg-muted)',
                        overflow: 'hidden',
                      }}
                    >
                      {d}
                    </th>
                  )
                })}
              </tr>
            </thead>

            {/* ── 12개월 행 ── */}
            <tbody>
              {MONTH_LABELS.map((mLabel, mi) => (
                <MonthRow
                  key={mi}
                  monthIdx={mi}
                  monthLabel={mLabel}
                  year={year}
                  thisYear={thisYear}
                  today={today}
                  todayStr={todayStr}
                  cellW={cellW}
                  cellH={cellH}
                  allTasks={allTasks}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   컨트롤 바
   ═══════════════════════════════════════════ */
function ControlBar({
  year, cellW, cellH,
  onYearChange, onCellWChange, onCellHChange,
}: {
  year: number; cellW: number; cellH: number
  onYearChange: (y: number) => void
  onCellWChange: (w: number) => void
  onCellHChange: (h: number) => void
}) {
  return (
    <div
      className="shrink-0 flex items-center justify-between gap-4 flex-wrap px-4 py-2.5"
      style={{
        borderBottom: '2px solid var(--border-default)',
        background: 'var(--bg-muted)',
      }}
    >
      {/* 왼쪽: 연도 네비게이션 + 범례 */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onYearChange(year - 1)}
          className="w-[30px] h-[30px] rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[17px] font-extrabold min-w-[72px] text-center text-[var(--text-primary)]">
          {year}년
        </span>
        <button
          onClick={() => onYearChange(new Date().getFullYear())}
          className="px-3 py-1 rounded-lg border border-primary-400 bg-transparent text-primary-500 text-xs font-bold cursor-pointer hover:bg-primary-500 hover:text-white transition-all"
        >
          현재
        </button>
        <button
          onClick={() => onYearChange(year + 1)}
          className="w-[30px] h-[30px] rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors"
        >
          <ChevronRight size={14} />
        </button>

        {/* 범례 */}
        <div className="flex items-center gap-2.5 ml-3 flex-wrap">
          {LEGEND_ITEMS.map(({ label, color }) => (
            <span key={label} className="inline-flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]">
              <span
                className="inline-block rounded-[3px]"
                style={{ width: 14, height: 8, background: color }}
              />
              {label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]">
            <span
              className="inline-block rounded-full"
              style={{ width: 8, height: 8, background: '#4f6ef7', boxShadow: '0 0 0 1.5px rgba(79,110,247,.33)' }}
            />
            일일업무
          </span>
        </div>
      </div>

      {/* 오른쪽: 열 너비 / 행 높이 조절 */}
      <div className="flex items-center gap-5 flex-wrap">
        <JogLever
          icon={<MoveHorizontal size={12} className="text-[var(--text-muted)]" />}
          label="열 너비"
          value={cellW}
          min={MIN_CW}
          max={MAX_CW}
          onChange={onCellWChange}
          gradient="linear-gradient(135deg, #4f6ef7, #9747ff)"
          shadow="rgba(79,110,247,.45)"
        />
        <JogLever
          icon={<MoveVertical size={12} className="text-[var(--text-muted)]" />}
          label="행 높이"
          value={cellH}
          min={MIN_CH}
          max={MAX_CH}
          onChange={onCellHChange}
          gradient="linear-gradient(135deg, #9747ff, #4f6ef7)"
          shadow="rgba(151,71,255,.45)"
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   조이스틱 레버 컴포넌트
   ═══════════════════════════════════════════ */
function JogLever({
  icon, label, value, min, max, onChange, gradient, shadow,
}: {
  icon: React.ReactNode
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  gradient: string
  shadow: string
}) {
  const TRACK_HALF = 37
  const STEP_MAX = 6
  const SPEED_EXP = 1.8
  const knobRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef({ active: false, offsetX: 0 })
  const valueRef = useRef(value)
  valueRef.current = value

  const updateKnobPos = useCallback((ox: number) => {
    if (!knobRef.current) return
    const clamped = Math.max(-TRACK_HALF, Math.min(TRACK_HALF, ox))
    knobRef.current.style.left = `calc(50% + ${clamped}px)`
  }, [])

  const snapBack = useCallback(() => {
    const st = stateRef.current
    st.offsetX *= 0.62
    updateKnobPos(st.offsetX)
    if (Math.abs(st.offsetX) > 0.5) {
      requestAnimationFrame(() => snapBack())
    } else {
      st.offsetX = 0
      updateKnobPos(0)
    }
  }, [updateKnobPos])

  const tickLoop = useCallback(() => {
    const st = stateRef.current
    if (!st.active) return
    const ratio = st.offsetX / TRACK_HALF
    const speed = Math.pow(Math.abs(ratio), SPEED_EXP) * Math.sign(ratio) * STEP_MAX
    if (Math.abs(speed) > 0.3) {
      const nv = Math.round(Math.max(min, Math.min(max, valueRef.current + speed)))
      if (nv !== valueRef.current) {
        onChange(nv)
      }
    }
    rafRef.current = setTimeout(tickLoop, 80)
  }, [min, max, onChange])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const st = stateRef.current
    st.active = true
    st.offsetX = 0
    const startX = e.clientX

    if (knobRef.current) knobRef.current.style.transition = 'box-shadow .15s'
    tickLoop()

    const onMove = (ev: MouseEvent) => {
      if (!st.active) return
      const dx = ev.clientX - startX
      st.offsetX = Math.max(-TRACK_HALF, Math.min(TRACK_HALF, dx))
      updateKnobPos(st.offsetX)
    }

    const onUp = () => {
      st.active = false
      if (rafRef.current) clearTimeout(rafRef.current)
      if (knobRef.current) knobRef.current.style.transition = 'left .35s cubic-bezier(.22,1,.36,1), box-shadow .15s'
      snapBack()
      setTimeout(() => {
        if (knobRef.current) knobRef.current.style.transition = 'box-shadow .15s'
      }, 400)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [tickLoop, snapBack, updateKnobPos])

  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
        {label} <b className="text-[var(--text-primary)]">{value}px</b>
      </span>
      {/* 트랙 */}
      <div
        className="relative flex items-center justify-center overflow-visible"
        style={{
          width: 80,
          height: 22,
          borderRadius: 11,
          background: 'var(--bg-subtle)',
          border: '1.5px solid var(--border-default)',
        }}
        title="좌우로 드래그하여 조절"
      >
        {/* 센터 라인 */}
        <div
          className="absolute"
          style={{
            left: '50%',
            top: 3,
            bottom: 3,
            width: 1.5,
            background: 'var(--border-default)',
            transform: 'translateX(-50%)',
            borderRadius: 2,
          }}
        />
        {/* 노브 */}
        <div
          ref={knobRef}
          data-knob
          className="absolute flex items-center justify-center"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: gradient,
            border: '2px solid #fff',
            boxShadow: `0 2px 8px ${shadow}`,
            cursor: 'col-resize',
            zIndex: 2,
            transition: 'box-shadow .15s',
          }}
          onMouseDown={onMouseDown}
        >
          <GripVertical size={10} className="text-white pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   월 행 렌더
   ═══════════════════════════════════════════ */
function MonthRow({
  monthIdx, monthLabel, year, thisYear, today, todayStr,
  cellW, cellH, allTasks,
}: {
  monthIdx: number
  monthLabel: string
  year: number
  thisYear: number
  today: Date
  todayStr: string
  cellW: number
  cellH: number
  allTasks: TaskItem[]
}) {
  const monthNum = monthIdx + 1
  const lastDate = new Date(year, monthNum, 0).getDate()
  const isCurrentMonth = monthNum === today.getMonth() + 1 && year === thisYear

  /* ── 이 월에 표시할 업무 ── */
  const monthTasks = useMemo(
    () => getTasksForMonth(allTasks, year, monthIdx),
    [allTasks, year, monthIdx],
  )

  /* ── 막대/도트 분리 ── */
  const { barTasks, dotTasks } = useMemo(() => {
    const bars: typeof monthTasks = []
    const dots: typeof monthTasks = []
    monthTasks.forEach(mt => {
      const isOneDay = (mt.rawStart === mt.rawEnd) || (mt.startDay === mt.endDay) || (mt.task.taskNature === '일일업무')
      if (isOneDay) dots.push(mt)
      else bars.push(mt)
    })
    return { barTasks: bars, dotTasks: dots }
  }, [monthTasks])

  /* ── 트랙 계산 ── */
  const dowH = cellW >= 28 ? 12 : 0
  const baseUsable = cellH - dowH
  const trackH = Math.min(22, Math.max(14, baseUsable / 3))

  const { maxTrack, trackAssignments } = useMemo(() => {
    if (barTasks.length === 0) return { maxTrack: 0, trackAssignments: new Map<number | string, number>() }
    const sorted = [...barTasks].sort((a, b) => a.startDay - b.startDay)
    const tracks: number[] = []
    let mx = 0
    const assignments = new Map<number | string, number>()
    sorted.forEach(({ task, startDay, endDay }) => {
      let tk = 0
      while (tracks[tk] !== undefined && tracks[tk] >= startDay) tk++
      tracks[tk] = endDay
      if (tk > mx) mx = tk
      assignments.set(task.id, tk)
    })
    return { maxTrack: mx, trackAssignments: assignments }
  }, [barTasks])

  const MIN_BAR_ROW_H = PAD_TOP + 16 + dowH + PAD_BOT
  const rowH = barTasks.length > 0
    ? Math.max(MIN_BAR_ROW_H, cellH, PAD_TOP + (maxTrack + 1) * trackH + dowH + PAD_BOT + 4)
    : cellH

  /* ── 도트 맵: day → dots ── */
  const dotMap = useMemo(() => {
    const map = new Map<number, typeof dotTasks>()
    dotTasks.forEach(dt => {
      const day = dt.task.taskNature === '일일업무'
        ? (parseInt((dt.rawEnd || '').substring(8)) || dt.endDay)
        : dt.endDay
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(dt)
    })
    return map
  }, [dotTasks])

  return (
    <tr style={{ position: 'relative' }}>
      {/* ── 월 라벨 (sticky) ── */}
      <td
        className="sticky left-0 z-10 text-center align-middle"
        style={{
          width: LABEL_W,
          minWidth: LABEL_W,
          height: rowH,
          background: isCurrentMonth ? 'rgba(79,110,247,.08)' : 'var(--bg-muted)',
          borderRight: '2px solid var(--border-default)',
          borderBottom: '1px solid var(--border-default)',
          padding: 0,
          overflow: 'visible',
        }}
      >
        <div
          className="text-xs"
          style={{
            fontWeight: isCurrentMonth ? 800 : 600,
            color: isCurrentMonth ? '#4f6ef7' : 'var(--text-secondary)',
          }}
        >
          {monthLabel}
          {isCurrentMonth && (
            <div
              className="mx-auto mt-0.5"
              style={{ width: 5, height: 5, borderRadius: '50%', background: '#4f6ef7' }}
            />
          )}
        </div>
      </td>

      {/* ── 헬퍼 td (bars 컨테이너) ── */}
      <td
        style={{
          width: 0, minWidth: 0, maxWidth: 0, padding: 0, border: 'none',
          overflow: 'visible', position: 'relative', height: rowH, zIndex: 4,
        }}
      >
        {barTasks
          .sort((a, b) => a.startDay - b.startDay)
          .map(({ task, startDay, endDay, rawStart, rawEnd }) => {
            const c = getTaskColor(task.status)
            const prog = task.progress || 0
            const track = trackAssignments.get(task.id) || 0
            const barLeft = (startDay - 1) * cellW
            const barWidth = Math.max((endDay - startDay + 1) * cellW - 4, cellW - 4)
            const barTop = PAD_TOP + track * trackH
            const barH = Math.max(0, Math.min(trackH - 2, (rowH - dowH - PAD_BOT) - barTop - 2))
            if (barH <= 0) return null

            const mStr = `${year}-${String(monthNum).padStart(2, '0')}`
            const borderL = rawStart.substring(0, 7) === mStr ? '6px' : '0px'
            const borderR = rawEnd.substring(0, 7) === mStr ? '6px' : '0px'

            return (
              <div
                key={task.id}
                title={`${task.title} (${rawStart} ~ ${rawEnd}) | ${prog}% | ${task.status}`}
                className="absolute flex items-center cursor-pointer group"
                style={{
                  left: barLeft,
                  top: barTop,
                  width: barWidth,
                  height: barH,
                  borderRadius: `${borderL} ${borderR} ${borderR} ${borderL}`,
                  background: `${c}22`,
                  border: `1.5px solid ${c}`,
                  overflow: 'hidden',
                  zIndex: 5,
                  boxShadow: `0 1px 4px ${c}44`,
                  transition: 'transform .1s, box-shadow .1s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'scaleY(1.08)'
                  el.style.boxShadow = `0 3px 10px ${c}66`
                  el.style.zIndex = '15'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = ''
                  el.style.boxShadow = `0 1px 4px ${c}44`
                  el.style.zIndex = '5'
                }}
              >
                {/* 진행률 배경 */}
                <div
                  className="absolute left-0 top-0 bottom-0 pointer-events-none"
                  style={{
                    width: `${prog}%`,
                    background: c,
                    opacity: 0.35,
                    borderRadius: `${borderL} 0 0 ${borderL}`,
                  }}
                />
                {/* 텍스트 */}
                <div className="relative z-[1] flex items-center gap-1 px-1.5 w-full overflow-hidden">
                  <span
                    className="font-bold whitespace-nowrap overflow-hidden text-ellipsis flex-1"
                    style={{ fontSize: '9.5px', color: c }}
                  >
                    {task.title}
                  </span>
                  <span
                    className="font-extrabold whitespace-nowrap shrink-0"
                    style={{ fontSize: '9px', color: c }}
                  >
                    {prog}%
                  </span>
                </div>
              </div>
            )
          })}
      </td>

      {/* ── 31개 날짜 셀 ── */}
      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
        const isValid = d <= lastDate
        const dt = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const dow = isValid ? new Date(year, monthIdx, d).getDay() : -1
        const isToday = dt === todayStr
        const isSun = dow === 0
        const isSat = dow === 6

        const bg = !isValid
          ? 'var(--bg-subtle)'
          : isToday
            ? 'var(--bg-surface)'
            : isSun
              ? 'rgba(239,68,68,.04)'
              : isSat
                ? 'rgba(79,110,247,.04)'
                : 'var(--bg-surface)'

        const dowColor = dow === 0 ? '#ef4444' : dow === 6 ? '#4f6ef7' : 'var(--text-muted)'
        const dots = isValid ? dotMap.get(d) : undefined
        const dotSize = Math.min(10, Math.max(7, cellW / 5))

        return (
          <td
            key={d}
            style={{
              width: cellW,
              minWidth: cellW,
              maxWidth: cellW,
              height: rowH,
              padding: 0,
              verticalAlign: 'top',
              background: bg,
              borderRight: '1px solid var(--border-default)',
              borderBottom: '1px solid var(--border-default)',
              position: 'relative',
              overflow: 'hidden',
              opacity: isValid ? 1 : 0.35,
            }}
          >
            {/* 도트 (일일업무) */}
            {dots && dots.map(({ task, rawEnd }) => {
              const c = getTaskColor(task.status)
              const prog = task.progress || 0
              return (
                <div
                  key={task.id}
                  title={`${task.title} (${rawEnd})${task.taskNature === '일일업무' ? ' | 일일업무' : ''} | ${prog}%`}
                  className="flex items-center gap-0.5 px-0.5 cursor-pointer hover:opacity-70 transition-opacity"
                  style={{ overflow: 'hidden', maxWidth: '100%', padding: '1px 3px' }}
                >
                  <span
                    className="shrink-0 inline-block rounded-full"
                    style={{
                      width: dotSize,
                      height: dotSize,
                      background: c,
                      boxShadow: `0 0 0 1.5px ${c}55`,
                    }}
                  />
                  <span
                    className="font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ fontSize: 9, color: c }}
                  >
                    {task.title}
                  </span>
                </div>
              )
            })}

            {/* 요일 라벨 */}
            {isValid && cellW >= 28 && (
              <div
                className="absolute left-0 right-0 text-center pointer-events-none"
                style={{
                  bottom: PAD_BOT,
                  fontSize: cellW >= 40 ? 9 : 7.5,
                  fontWeight: 800,
                  color: dowColor,
                  opacity: 0.75,
                  lineHeight: 1,
                  zIndex: 10,
                }}
              >
                {DOW_LABELS[dow]}
              </div>
            )}
          </td>
        )
      })}
    </tr>
  )
}
