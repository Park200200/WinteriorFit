import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { cn } from '../../utils/cn'
import { getItem, setItem } from '../../utils/storage'
import { useThemeStore } from '../../stores/themeStore'
import { setAccentColor, getAccentColor } from '../../utils/accentColor'
import { Sun, Moon, LogOut, Check, Plus, X } from 'lucide-react'

/* ── 타입 ── */
interface UserItem {
  id: number; name: string; color?: string; avatar?: string
  dept?: string; role?: string; pos?: string; email?: string; status?: string
}
interface TaskItem {
  id: number; assigneeIds?: number[]; assigneeId?: number; assignerId?: number; status: string
}

/* ── 알림 항목 ── */
const notifItems = [
  { id: 'n1', label: '신규 업무 지시 알림', desc: '업무를 할당받으면 즉시 알림' },
  { id: 'n2', label: '마감 D-3 사전 알림', desc: '마감 3일 전 자동 알림' },
  { id: 'n3', label: '상태 변경 알림', desc: '담당 업무 상태 변경 시 알림' },
  { id: 'n4', label: '지시 결과 알림', desc: '업무 지시 완료 후 즉시 알림' },
  { id: 'n5', label: '완료 보고 알림', desc: '지시한 업무가 완료되면 알림' },
]

/* ── 모서리 곡률 프리셋 ── */
const radiusPresets = [
  { key: 'sharp',  label: '직각',   px: '0px',   sm: 0,  md: 0,  lg: 0,  xl: 0 },
  { key: 'slight', label: '약간',   px: '4px',   sm: 3,  md: 4,  lg: 6,  xl: 8 },
  { key: 'normal', label: '보통',   px: '8px',   sm: 6,  md: 10, lg: 16, xl: 20 },
  { key: 'round',  label: '둥글게', px: '16px',  sm: 10, md: 16, lg: 22, xl: 28 },
  { key: 'pill',   label: 'Pill',   px: '999px', sm: 20, md: 30, lg: 40, xl: 999 },
]

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notif' | 'theme'>('profile')

  /* 유저 데이터 */
  const users = getItem<UserItem[]>('ws_users', [])
  const currentUser = users[0] || { id: 0, name: '사용자', color: '#4f6ef7', dept: '-', role: '-', email: '-', status: '재직' }

  /* 업무 통계 */
  const tasks = getItem<TaskItem[]>('ws_tasks', [])
  const myTasks = tasks.filter(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : [])
    return ids.includes(currentUser.id)
  })
  const doneCnt = myTasks.filter(t => t.status === 'done').length
  const instrCnt = tasks.filter(t => t.assignerId === currentUser.id).length

  /* 알림 설정 */
  const [notifs, setNotifs] = useState<Record<string, boolean>>(() => {
    const saved = getItem<Record<string, boolean>>('ws_notif_settings', {})
    const defaults: Record<string, boolean> = {}
    notifItems.forEach(n => { defaults[n.id] = saved[n.id] !== undefined ? saved[n.id] : true })
    return defaults
  })
  const toggleNotif = (id: string) => {
    const updated = { ...notifs, [id]: !notifs[id] }
    setNotifs(updated)
    setItem('ws_notif_settings', updated)
  }

  /* 테마 설정 */
  const themeStore = useThemeStore()
  const theme = themeStore.theme
  const applyTheme = (t: string) => {
    themeStore.set(t as 'light' | 'dark')
  }

  /* 강조색(주컬러) — 전체 Primary 팔레트를 동적으로 생성 */
  const defaultAccents = ['#4f6ef7', '#9747ff', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']
  const [accents, setAccents] = useState<string[]>(() => getItem('ws_accents', defaultAccents))
  const [currentAccent, setCurrentAccentState] = useState(() => getAccentColor())
  const applyAccent = (c: string) => {
    setCurrentAccentState(c)
    setItem('ws_accents', accents)
    setAccentColor(c) // 전체 primary 팔레트 + CSS 변수 즉시 적용
  }
  const addAccent = (c: string) => {
    if (accents.includes(c)) return
    const updated = [...accents, c]
    setAccents(updated)
    setItem('ws_accents', updated)
    applyAccent(c)
  }
  const deleteAccent = (c: string) => {
    if (accents.length <= 1) return
    const updated = accents.filter(x => x !== c)
    setAccents(updated)
    setItem('ws_accents', updated)
    if (currentAccent === c) applyAccent(updated[0])
  }

  /* 모서리 곡률 */
  const [radiusKey, setRadiusKey] = useState(() => {
    const saved = getItem<{ key: string }>('ws_border_radius', { key: 'normal' })
    return saved.key
  })
  const applyRadius = (preset: typeof radiusPresets[0]) => {
    setRadiusKey(preset.key)
    const root = document.documentElement
    root.style.setProperty('--radius-sm', preset.sm + 'px')
    root.style.setProperty('--radius-md', preset.md + 'px')
    root.style.setProperty('--radius-lg', preset.lg + 'px')
    root.style.setProperty('--radius-xl', preset.xl + 'px')
    setItem('ws_border_radius', { key: preset.key, sm: preset.sm + 'px', md: preset.md + 'px', lg: preset.lg + 'px', xl: preset.xl + 'px' })
  }

  const tabs = [
    { key: 'profile' as const, label: '프로필 설정' },
    { key: 'notif' as const, label: '알림 설정' },
    { key: 'theme' as const, label: 'UI 테마' },
  ]

  return (
    <div className="animate-fadeIn">
      <PageHeader title="개인설정" subtitle="프로필 및 알림을 설정합니다" />

      <div className="grid md:grid-cols-[320px_1fr] gap-4">
        {/* ── 좌측: 프로필 카드 ── */}
        <Card className="p-6 text-center">
          <div className="mx-auto mb-4">
            <Avatar name={currentUser.name} color={currentUser.color} size="lg" />
          </div>
          <div className="text-lg font-extrabold text-[var(--text-primary)] mb-1">{currentUser.name}</div>
          <div className="text-[12px] text-[var(--text-secondary)] mb-0.5">
            {currentUser.dept} · {currentUser.role}{currentUser.pos ? ` | ${currentUser.pos}` : ''}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mb-5">{currentUser.email}</div>

          {/* 통계 */}
          <div className="flex justify-center gap-0 mb-5">
            <div className="text-center px-5 border-r border-[var(--border-default)]">
              <div className="text-xl font-extrabold text-primary-500">{myTasks.length}</div>
              <div className="text-[10px] text-[var(--text-muted)]">담당 업무</div>
            </div>
            <div className="text-center px-5 border-r border-[var(--border-default)]">
              <div className="text-xl font-extrabold text-green-500">{doneCnt}</div>
              <div className="text-[10px] text-[var(--text-muted)]">완료</div>
            </div>
            <div className="text-center px-5">
              <div className="text-xl font-extrabold text-primary-500">{instrCnt}</div>
              <div className="text-[10px] text-[var(--text-muted)]">지시</div>
            </div>
          </div>

          <Button className="w-full" icon={<LogOut size={15} />}>로그아웃</Button>
        </Card>

        {/* ── 우측: 탭 콘텐츠 ── */}
        <Card className="p-0 overflow-hidden">
          {/* 탭 바 */}
          <div className="flex border-b border-[var(--border-default)]">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 py-3 text-xs font-bold transition-all cursor-pointer',
                  activeTab === tab.key
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                )}
              >{tab.label}</button>
            ))}
          </div>

          <div className="p-5">
            {/* ═════ 프로필 설정 ═════ */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="이름" value={currentUser.name} />
                  <FieldRow label="부서" value={currentUser.dept || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="직급" value={currentUser.role || '-'} />
                  <FieldRow label="직책" value={currentUser.pos || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="이메일" value={currentUser.email || '-'} />
                  <FieldRow label="상태" value={currentUser.status || '재직'} />
                </div>
                <Button>저장</Button>
              </div>
            )}

            {/* ═════ 알림 설정 ═════ */}
            {activeTab === 'notif' && (
              <div className="space-y-0">
                {notifItems.map(n => (
                  <div key={n.id} className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0">
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--text-primary)]">{n.label}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{n.desc}</div>
                    </div>
                    <button
                      onClick={() => toggleNotif(n.id)}
                      className={cn(
                        'relative w-[42px] h-[24px] rounded-full transition-colors cursor-pointer shrink-0',
                        notifs[n.id] ? 'bg-primary-500' : 'bg-[var(--bg-subtle)]',
                      )}
                    >
                      <span className={cn(
                        'absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full transition-all shadow-sm',
                        notifs[n.id] ? 'left-[20px]' : 'left-[2px]',
                      )} />
                    </button>
                  </div>
                ))}
                <Button className="mt-4">설정 저장</Button>
              </div>
            )}

            {/* ═════ UI 테마 ═════ */}
            {activeTab === 'theme' && (
              <div className="space-y-5">
                {/* 테마 선택 */}
                <div>
                  <div className="text-[12px] font-bold text-[var(--text-secondary)] mb-3">UI 테마 선택</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => applyTheme('light')}
                      className={cn(
                        'p-5 rounded-xl border-2 cursor-pointer transition-all text-left',
                        theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-[var(--border-default)] hover:border-primary-300',
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                        <Sun size={18} className="text-amber-500" />
                      </div>
                      <div className="text-[13px] font-bold text-[var(--text-primary)]">라이트 모드</div>
                      <div className="text-[11px] text-[var(--text-muted)]">밝고 깔끔한 테마</div>
                    </button>
                    <button
                      onClick={() => applyTheme('dark')}
                      className={cn(
                        'p-5 rounded-xl border-2 cursor-pointer transition-all text-left',
                        theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-[var(--border-default)] hover:border-primary-300',
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                        <Moon size={18} className="text-purple-500" />
                      </div>
                      <div className="text-[13px] font-bold text-[var(--text-primary)]">다크 모드</div>
                      <div className="text-[11px] text-[var(--text-muted)]">눈이 편한 어두운 테마</div>
                    </button>
                  </div>
                </div>

                {/* 강조색 설정 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-4">
                  <div className="text-[12px] font-bold text-[var(--text-secondary)] mb-3">강조색 설정</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {accents.map(c => (
                      <div key={c} className="relative group">
                        <button
                          onClick={() => applyAccent(c)}
                          className={cn(
                            'w-8 h-8 rounded-full cursor-pointer transition-all flex items-center justify-center',
                            currentAccent === c ? 'ring-2 ring-offset-2 ring-[var(--text-primary)]' : 'hover:scale-110',
                          )}
                          style={{ background: c }}
                        >
                          {currentAccent === c && <Check size={14} className="text-white" />}
                        </button>
                        {accents.length > 1 && (
                          <button
                            onClick={() => deleteAccent(c)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white items-center justify-center text-[9px] hidden group-hover:flex cursor-pointer"
                          ><X size={9} /></button>
                        )}
                      </div>
                    ))}
                    <label className="w-8 h-8 rounded-full border-2 border-dashed border-[var(--border-default)] flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                      <Plus size={14} className="text-[var(--text-muted)]" />
                      <input type="color" className="hidden" onChange={e => addAccent(e.target.value)} />
                    </label>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-2">색상에 마우스를 올려 삭제할 수 있습니다.</div>
                </div>

                {/* 모서리 곡률 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-4">
                  <div className="text-[12px] font-bold text-[var(--text-secondary)] mb-3">모서리 곡률 (Border Radius)</div>
                  <div className="flex gap-2 flex-wrap">
                    {radiusPresets.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => applyRadius(opt)}
                        className={cn(
                          'flex-1 min-w-[64px] flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 cursor-pointer transition-all',
                          radiusKey === opt.key
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-[var(--border-default)] hover:border-primary-300',
                        )}
                      >
                        <div
                          className="w-9 h-9"
                          style={{
                            border: `2px solid ${radiusKey === opt.key ? 'var(--accent-blue,#4f6ef7)' : 'var(--border-default)'}`,
                            background: 'var(--bg-surface)',
                            borderRadius: opt.key === 'pill' ? '999px' : opt.md + 'px',
                          }}
                        />
                        <div className="text-center">
                          <div className="text-[11px] font-bold text-[var(--text-primary)]">{opt.label}</div>
                          <div className="text-[9px] text-[var(--text-muted)]">({opt.px})</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 디자인 시스템 컬러 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-4">
                  <div className="text-[12px] font-bold text-[var(--text-secondary)] mb-3">🎨 디자인 시스템 컬러</div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 mb-3">
                    {(['50','100','200','300','400','500','600','700','800','900'] as const).map(shade => (
                      <button
                        key={shade}
                        onClick={() => {
                          const v = getComputedStyle(document.documentElement).getPropertyValue(`--color-primary-${shade}`).trim()
                          if (v) navigator.clipboard?.writeText(v)
                        }}
                        className="group cursor-pointer"
                        title={`Primary ${shade} — 클릭하여 복사`}
                      >
                        <div
                          className="w-full aspect-square rounded-lg shadow-sm transition-transform group-hover:scale-110"
                          style={{ background: `var(--color-primary-${shade})` }}
                        />
                        <div className="text-[8px] font-bold text-[var(--text-muted)] text-center mt-1">{shade}</div>
                      </button>
                    ))}
                  </div>
                  {/* 시멘틱 컬러 */}
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[
                      { label: 'Success', color: 'var(--color-success)', hex: '#22c55e' },
                      { label: 'Warning', color: 'var(--color-warning)', hex: '#f59e0b' },
                      { label: 'Danger',  color: 'var(--color-danger)',  hex: '#ef4444' },
                      { label: 'Info',    color: 'var(--color-info)',    hex: '#3b82f6' },
                    ].map(c => (
                      <div key={c.label} className="text-center">
                        <div className="w-full h-8 rounded-lg shadow-sm" style={{ background: c.color }} />
                        <div className="text-[9px] font-bold text-[var(--text-muted)] mt-1">{c.label}</div>
                        <div className="text-[8px] text-[var(--text-muted)]">{c.hex}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-3">색상 칩을 클릭하면 HEX 코드가 클립보드에 복사됩니다.</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* 읽기 전용 필드 */
function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">{label}</label>
      <input
        value={value}
        readOnly
        className="w-full px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] text-[13px] text-[var(--text-primary)] outline-none"
      />
    </div>
  )
}
