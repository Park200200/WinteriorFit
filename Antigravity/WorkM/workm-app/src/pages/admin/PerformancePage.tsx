import { useState, useMemo } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { cn } from '../../utils/cn'
import { getItem } from '../../utils/storage'
import { BarChart3, TrendingUp, Trophy, Target, Users } from 'lucide-react'

/* ─────────────────────────────────────────────
   타입
   ───────────────────────────────────────────── */
interface TaskItem {
  id: number | string
  title: string
  status: string
  progress: number
  dueDate: string
  createdAt?: string
  assignerId?: number
  assigneeIds?: number[]
  assigneeId?: number
}

interface UserItem {
  id: number
  name: string
  dept?: string
  role?: string
  pos?: string
  color?: string
  avatar?: string
  email?: string
}

type PeriodKey = 'weekly' | 'monthly' | 'yearly'

const PERIOD_LABELS: Record<PeriodKey, string> = {
  weekly: '주간',
  monthly: '월간',
  yearly: '연간',
}

const MEDALS = ['🥇', '🥈', '🥉']

/* ─── 기간 필터 ─── */
function inPeriod(dateStr: string | undefined, period: PeriodKey, now: Date): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (period === 'weekly') {
    const ws = new Date(now)
    ws.setDate(now.getDate() - now.getDay())
    ws.setHours(0, 0, 0, 0)
    return d >= ws
  } else if (period === 'monthly') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  } else {
    return d.getFullYear() === now.getFullYear()
  }
}

/* ═══════════════════════════════════════════
   PerformancePage
   ═══════════════════════════════════════════ */
export function PerformancePage() {
  const [period, setPeriod] = useState<PeriodKey>('weekly')
  const now = new Date()

  const tasks = useMemo(() => getItem<TaskItem[]>('ws_tasks', []), [])
  const users = useMemo(() => getItem<UserItem[]>('ws_users', []), [])

  /* ── 직원별 통계 ── */
  const stats = useMemo(() => {
    return users.map(u => {
      const myTasks = tasks.filter(t => {
        const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
        return ids.includes(u.id)
      })
      const pTasks = myTasks.filter(t => inPeriod(t.dueDate, period, now) || inPeriod(t.createdAt, period, now))
      const all = pTasks.length > 0 ? pTasks : myTasks
      const total = all.length
      const done = all.filter(t => t.status === 'done').length
      const delay = all.filter(t => t.status === 'delay').length
      const prog = all.filter(t => t.status === 'progress').length
      const rate = total > 0 ? Math.round((done / total) * 100) : 0
      const avgP = total > 0 ? Math.round(all.reduce((a, t) => a + (t.progress || 0), 0) / total) : 0
      return { u, total, done, delay, prog, rate, avgP }
    }).sort((a, b) => b.rate - a.rate || b.done - a.done)
  }, [tasks, users, period])

  /* ── 전체 요약 통계 ── */
  const summary = useMemo(() => {
    const total = stats.reduce((a, s) => a + s.total, 0)
    const done = stats.reduce((a, s) => a + s.done, 0)
    const delay = stats.reduce((a, s) => a + s.delay, 0)
    const avgRate = stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.rate, 0) / stats.length) : 0
    return { total, done, delay, avgRate }
  }, [stats])

  const summaryCards = [
    { label: '팀 평균 달성률', value: `${summary.avgRate}%`, icon: TrendingUp, color: '#4f6ef7', bg: 'rgba(79,110,247,.12)' },
    { label: '전체 업무 수', value: summary.total, icon: Target, color: '#06b6d4', bg: 'rgba(6,182,212,.12)' },
    { label: '완료 업무', value: summary.done, icon: Trophy, color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
    { label: '지연 업무', value: summary.delay, icon: Users, color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
  ]

  return (
    <div className="animate-fadeIn">
      <PageHeader title="실적보기" subtitle="팀/개인별 업무 달성 현황을 분석합니다" />

      {/* ── 요약 카드 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {summaryCards.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 hover:border-[var(--border-strong)] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: card.bg, color: card.color }}
                >
                  <Icon size={17} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {card.value}
              </div>
              <div className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] mt-0.5">
                {card.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 메인 테이블 카드 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 md:px-5 py-3.5 border-b border-[var(--border-default)] flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <BarChart3 size={16} className="text-primary-500" />
            </div>
            <span className="text-[15px] font-extrabold text-[var(--text-primary)]">팀원별 업무 달성 현황</span>
            <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2.5 py-0.5 rounded-full">
              {PERIOD_LABELS[period]} 기준
            </span>
          </div>

          {/* 기간 스위치 */}
          <div className="flex gap-1 bg-[var(--bg-muted)] p-1 rounded-lg">
            {(['weekly', 'monthly', 'yearly'] as PeriodKey[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all',
                  period === p
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]',
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* 테이블 */}
        {stats.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm font-bold text-[var(--text-secondary)]">직원 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['순위', '직원', '달성률', '전체', '완료', '진행중', '지연', '평균진행률'].map((h, i) => (
                    <th
                      key={i}
                      className={cn(
                        'py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider',
                        i === 0 ? 'text-center w-[60px]' :
                        i === 1 ? 'text-left' :
                        i === 2 ? 'text-left min-w-[150px]' :
                        'text-center',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((s, idx) => {
                  const rank = idx + 1
                  const rateColor = s.rate >= 80 ? '#22c55e' : s.rate >= 50 ? '#f59e0b' : '#ef4444'
                  const rowBg = rank === 1
                    ? 'rgba(245,158,11,.07)'
                    : rank === 2
                      ? 'rgba(156,163,175,.05)'
                      : rank === 3
                        ? 'rgba(180,83,9,.05)'
                        : ''

                  return (
                    <tr
                      key={s.u.id}
                      className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors"
                      style={{ background: rowBg }}
                    >
                      {/* 순위 */}
                      <td className="py-3 px-3.5 text-center">
                        {rank <= 3 ? (
                          <span className="text-[17px]">{MEDALS[rank - 1]}</span>
                        ) : (
                          <span className="text-[13px] font-extrabold text-[var(--text-muted)]">{rank}위</span>
                        )}
                      </td>

                      {/* 직원 */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-extrabold shrink-0"
                            style={{ background: `linear-gradient(135deg, ${s.u.color || '#4f6ef7'}, #9747ff)` }}
                          >
                            {s.u.avatar || s.u.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-[var(--text-primary)]">{s.u.name}</div>
                            <div className="text-[11px] text-[var(--text-muted)]">
                              {s.u.role || ''}{s.u.dept ? ` · ${s.u.dept}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 달성률 */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-[7px] rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[120px]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${s.rate}%`, background: rateColor }}
                            />
                          </div>
                          <span
                            className="text-[13px] font-extrabold min-w-[34px] text-right"
                            style={{ color: rateColor }}
                          >
                            {s.rate}%
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">달성률</div>
                      </td>

                      {/* 전체 */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="text-[15px] font-extrabold text-primary-500">{s.total}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">전체</div>
                      </td>

                      {/* 완료 */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="text-[15px] font-extrabold text-success">{s.done}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">완료</div>
                      </td>

                      {/* 진행중 */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="text-[15px] font-extrabold text-[#06b6d4]">{s.prog}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">진행중</div>
                      </td>

                      {/* 지연 */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="text-[15px] font-extrabold text-danger">{s.delay}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">지연</div>
                      </td>

                      {/* 평균진행률 */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{s.avgP}%</div>
                        <div className="text-[10px] text-[var(--text-muted)]">평균진행률</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 개인별 미니 차트 카드 (모바일 대응) ── */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.slice(0, 6).map((s, idx) => {
          const rank = idx + 1
          const rateColor = s.rate >= 80 ? '#22c55e' : s.rate >= 50 ? '#f59e0b' : '#ef4444'
          return (
            <div
              key={s.u.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 hover:border-[var(--border-strong)] transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                {rank <= 3 && <span className="text-lg">{MEDALS[rank - 1]}</span>}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold shrink-0"
                  style={{ background: `linear-gradient(135deg, ${s.u.color || '#4f6ef7'}, #9747ff)` }}
                >
                  {s.u.avatar || s.u.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[var(--text-primary)] truncate">{s.u.name}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{s.u.dept} · {s.u.role}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-extrabold" style={{ color: rateColor }}>{s.rate}%</div>
                  <div className="text-[10px] text-[var(--text-muted)]">달성률</div>
                </div>
              </div>

              {/* 바 차트 */}
              <div className="space-y-1.5">
                {[
                  { label: '완료', value: s.done, total: s.total, color: '#22c55e' },
                  { label: '진행', value: s.prog, total: s.total, color: '#4f6ef7' },
                  { label: '지연', value: s.delay, total: s.total, color: '#ef4444' },
                ].map(bar => (
                  <div key={bar.label} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] w-6">{bar.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: bar.total > 0 ? `${(bar.value / bar.total) * 100}%` : '0%',
                          background: bar.color,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] w-4 text-right">{bar.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
