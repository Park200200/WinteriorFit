import { useState, useCallback, useMemo } from 'react'
import { getItem, setItem } from '../../utils/storage'
import {
  Navigation, Plus, X, Save, Trash2, Edit3,
  ScrollText, ShieldCheck, LayoutPanelLeft, Image as ImageIcon,
  MessageSquare, Bell, Newspaper, HelpCircle, ClipboardList,
  Store, TentTree, Building2, Monitor,
} from 'lucide-react'

/* ── 타입 ── */
interface SubRow { label: string; url: string; blank: boolean; hImg: string; vImg: string }
interface SubSet {
  name: string
  type: 'image' | 'solution'
  rows: SubRow[]          // 이미지형일 때 사용
  solutions: string[]     // 솔루션형일 때 선택된 id 목록
}
interface MenuDetail { sets: SubSet[] }
interface MenuData {
  items: string[]
  details: Record<number, MenuDetail>
}

/* ── 솔루션 항목 목록 (레거시 동일) ── */
const SOLUTION_ITEMS: { id: string; label: string; icon: any }[] = [
  { id: 'terms',     label: '이용약관',          icon: ScrollText },
  { id: 'privacy',   label: '개인정보 취급방침',   icon: ShieldCheck },
  { id: 'content',   label: '컨텐츠관리',         icon: LayoutPanelLeft },
  { id: 'gallery',   label: '미디어 자료',         icon: ImageIcon },
  { id: 'board',     label: '게시판',             icon: MessageSquare },
  { id: 'notice',    label: '공지사항',            icon: Bell },
  { id: 'news',      label: '뉴스',               icon: Newspaper },
  { id: 'qna',       label: 'Q&A',                icon: HelpCircle },
  { id: 'faq',       label: 'FAQ',                icon: ClipboardList },
  { id: 'franchise', label: '가맹점 신청',         icon: Store },
  { id: 'workshop',  label: '워크샵',              icon: TentTree },
  { id: 'venue',     label: '대관(교육관)',         icon: Building2 },
]

const STORAGE_KEY = 'hp_menu_reg'

/* ── 공통 스타일 ── */
const cardCls = 'bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4'
const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors'
const btnSave = 'flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#6366f1] text-white text-[12px] font-bold cursor-pointer hover:bg-[#4f47e5] transition-colors'

/* ══════════════════════════════════════
   메뉴등록 메인 컴포넌트
   ══════════════════════════════════════ */
export function HpMenuReg() {
  const basicSettings = getItem<{ menuItems?: string[] }>('hp_basic_settings', {})
  const mainMenus: string[] = basicSettings.menuItems || []

  const [data, setData] = useState<MenuData>(() => getItem<MenuData>(STORAGE_KEY, { items: [], details: {} }))
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [addInput, setAddInput] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const menuChips = useMemo(() => {
    const s = new Set<string>()
    const list: string[] = []
    mainMenus.forEach(m => { if (!s.has(m)) { s.add(m); list.push(m) } })
    data.items.forEach(m => { if (!s.has(m)) { s.add(m); list.push(m) } })
    return list
  }, [mainMenus, data.items])

  /* ── 메뉴 추가 ── */
  const addMenu = useCallback(() => {
    const t = addInput.trim()
    if (!t) return
    setData(prev => ({ ...prev, items: [...prev.items, t] }))
    setAddInput('')
  }, [addInput])

  /* ── 칩 클릭 → 상세 ── */
  const openDetail = useCallback((idx: number) => {
    setActiveIdx(prev => prev === idx ? null : idx)
  }, [])

  /* ── 세트 CRUD ── */
  const getSets = (idx: number): SubSet[] => data.details[idx]?.sets || []

  const updateDetail = (menuIdx: number, fn: (d: MenuDetail) => MenuDetail) => {
    setData(prev => {
      const det = { ...prev.details }
      const existing = det[menuIdx] || { sets: [] }
      det[menuIdx] = fn(JSON.parse(JSON.stringify(existing)))
      return { ...prev, details: det }
    })
  }

  const addSet = (idx: number) => {
    updateDetail(idx, d => {
      d.sets.push({ name: '', type: 'image', rows: [], solutions: [] })
      return d
    })
  }

  const removeSet = (menuIdx: number, setIdx: number) => {
    updateDetail(menuIdx, d => {
      d.sets.splice(setIdx, 1)
      return d
    })
  }

  const updateSet = (menuIdx: number, setIdx: number, patch: Partial<SubSet>) => {
    updateDetail(menuIdx, d => {
      d.sets[setIdx] = { ...d.sets[setIdx], ...patch }
      return d
    })
  }

  /* ── 이미지형 행 CRUD ── */
  const addRow = (menuIdx: number, setIdx: number) => {
    updateDetail(menuIdx, d => {
      d.sets[setIdx].rows.push({ label: '', url: '', blank: false, hImg: '', vImg: '' })
      return d
    })
  }

  const updateRow = (menuIdx: number, setIdx: number, rowIdx: number, patch: Partial<SubRow>) => {
    updateDetail(menuIdx, d => {
      d.sets[setIdx].rows[rowIdx] = { ...d.sets[setIdx].rows[rowIdx], ...patch }
      return d
    })
  }

  const removeRow = (menuIdx: number, setIdx: number, rowIdx: number) => {
    updateDetail(menuIdx, d => {
      d.sets[setIdx].rows.splice(rowIdx, 1)
      return d
    })
  }

  /* ── 솔루션형 토글 ── */
  const toggleSolution = (menuIdx: number, setIdx: number, solId: string) => {
    updateDetail(menuIdx, d => {
      const arr = d.sets[setIdx].solutions || []
      const idx = arr.indexOf(solId)
      if (idx === -1) arr.push(solId)
      else arr.splice(idx, 1)
      d.sets[setIdx].solutions = arr
      return d
    })
  }

  /* ── 저장 ── */
  const saveDetail = (idx: number) => {
    setItem(STORAGE_KEY, data)
    setActiveIdx(null)
    alert(`"${menuChips[idx]}" 메뉴 상세가 저장되었습니다.`)
  }

  /* ── 활성 세트 ── */
  const activeSets = activeIdx !== null ? getSets(activeIdx) : []

  return (
    <div className="space-y-0 animate-fadeIn">

      {/* ═══ 메인메뉴 설정 현황 ═══ */}
      <div className={cardCls} style={{ borderBottomLeftRadius: activeIdx !== null ? 0 : undefined, borderBottomRightRadius: activeIdx !== null ? 0 : undefined }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,.12)' }}>
            <Navigation size={14} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <span className="text-[13px] font-bold text-[var(--text-primary)]">메인메뉴 설정 현황</span>
            <span className="text-[11px] text-[var(--text-muted)] ml-2">메뉴를 클릭하면 상세 등록 카드가 열립니다</span>
          </div>
        </div>

        {/* 칩 */}
        <div className="flex flex-wrap gap-2 items-center min-h-[36px]">
          {menuChips.length === 0 ? (
            <span className="text-[12px] text-[var(--text-muted)]">기본설정의 메인메뉴에 등록된 메뉴가 없습니다</span>
          ) : menuChips.map((name, i) => {
            const isActive = activeIdx === i
            const hasDetail = (data.details[i]?.sets?.length || 0) > 0
            return (
              <button key={`${name}-${i}`} onClick={() => openDetail(i)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold cursor-pointer transition-all select-none"
                style={{
                  background: isActive ? '#6366f1' : 'rgba(99,102,241,.1)',
                  border: `1.5px solid ${isActive ? '#6366f1' : 'rgba(99,102,241,.2)'}`,
                  color: isActive ? '#fff' : '#6366f1',
                  boxShadow: isActive ? '0 0 0 2px rgba(99,102,241,.35)' : 'none',
                }}
                title="클릭하여 상세 등록"
              >
                <span style={{ opacity: 0.6 }}>{i + 1}</span>
                <span style={{ opacity: 0.3, fontWeight: 400 }}>|</span>
                <span>{name}</span>
                {hasDetail && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ 상세 등록 카드 ═══ */}
      {activeIdx !== null && (
        <div className={`${cardCls} !rounded-t-none border-t border-dashed border-[var(--border-default)]`}>
          {/* 카드 헤더 */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,.12)' }}>
              <Edit3 size={14} style={{ color: '#6366f1' }} />
            </div>
            <span className="text-[13px] font-bold text-[var(--text-primary)]">
              "{menuChips[activeIdx]}" 메뉴 상세 등록
            </span>
            <button onClick={() => addSet(activeIdx)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#6366f1] bg-[rgba(99,102,241,.08)] text-[#6366f1] text-[11px] font-bold cursor-pointer hover:bg-[rgba(99,102,241,.18)] transition-colors ml-1">
              <Plus size={12} /> 서브메뉴 추가
            </button>
            <button onClick={() => setActiveIdx(null)}
              className="ml-auto w-6 h-6 rounded-md bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer border-none hover:bg-[var(--bg-subtle)]">
              <X size={13} />
            </button>
          </div>

          {/* 세트 목록 */}
          {activeSets.length === 0 ? (
            <div className="text-center py-6 border-[1.5px] border-dashed border-[var(--border-default)] rounded-xl">
              <span className="text-3xl">📋</span>
              <p className="text-[12px] text-[var(--text-muted)] mt-2">서브메뉴 추가 버튼으로 서브메뉴를 등록하세요</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSets.map((set, si) => (
                <SetCard
                  key={si}
                  set={set}
                  setIdx={si}
                  menuIdx={activeIdx}
                  menuName={menuChips[activeIdx]}
                  onUpdateSet={(p) => updateSet(activeIdx, si, p)}
                  onRemoveSet={() => removeSet(activeIdx, si)}
                  onAddRow={() => addRow(activeIdx, si)}
                  onUpdateRow={(ri, p) => updateRow(activeIdx, si, ri, p)}
                  onRemoveRow={(ri) => removeRow(activeIdx, si, ri)}
                  onToggleSolution={(id) => toggleSolution(activeIdx, si, id)}
                />
              ))}
            </div>
          )}

          {/* 저장 / 취소 */}
          <div className="flex justify-end gap-2">
            <button onClick={() => setActiveIdx(null)}
              className="px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)] text-[12px] cursor-pointer">취소</button>
            <button onClick={() => saveDetail(activeIdx)} className={btnSave}>
              <Save size={13} /> 저장
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   서브메뉴 세트 카드 (이미지형 / 솔루션형)
   ═══════════════════════════════════════ */
function SetCard({
  set, setIdx, menuIdx, menuName,
  onUpdateSet, onRemoveSet,
  onAddRow, onUpdateRow, onRemoveRow,
  onToggleSolution,
}: {
  set: SubSet; setIdx: number; menuIdx: number; menuName: string
  onUpdateSet: (p: Partial<SubSet>) => void
  onRemoveSet: () => void
  onAddRow: () => void
  onUpdateRow: (ri: number, p: Partial<SubRow>) => void
  onRemoveRow: (ri: number) => void
  onToggleSolution: (id: string) => void
}) {
  return (
    <div className="border border-[var(--border-default)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
      {/* 세트 헤더 */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,.15)' }}>
          <span className="text-[10px] font-extrabold text-[#6366f1]">{setIdx + 1}</span>
        </div>
        <span className="text-[12px] font-bold text-[var(--text-primary)]">서브메뉴 {setIdx + 1}</span>

        {/* ── 이미지형 / 솔루션형 스위치 ── */}
        <div className="flex items-center border border-[var(--border-default)] rounded-lg overflow-hidden ml-2">
          {(['image', 'solution'] as const).map(t => {
            const active = set.type === t
            return (
              <button key={t} onClick={() => onUpdateSet({ type: t })}
                className="px-3 py-1 text-[11px] border-none cursor-pointer transition-all whitespace-nowrap"
                style={{
                  fontWeight: active ? 700 : 500,
                  background: active ? '#6366f1' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                }}>
                {t === 'image' ? '이미지형' : '솔루션형'}
              </button>
            )
          })}
        </div>

        {/* 삭제 */}
        <button onClick={onRemoveSet}
          className="ml-auto w-6 h-6 rounded-md bg-red-500/10 text-red-500 flex items-center justify-center cursor-pointer border-none hover:bg-red-500/20 shrink-0">
          <X size={12} />
        </button>
      </div>

      {/* 세트 바디 */}
      <div className="p-3.5">
        {/* 서브메뉴명 */}
        <div className="mb-3">
          <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">서브메뉴명</label>
          <input value={set.name} onChange={e => onUpdateSet({ name: e.target.value })}
            placeholder="서브메뉴명을 입력하세요 (예: 인사말)"
            className={inputCls} />
        </div>

        {/* ── 이미지형 바디 ── */}
        {set.type === 'image' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                🖼 이미지 & 링크 목록
              </span>
              <button onClick={onAddRow}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-primary-400 bg-primary-50 dark:bg-primary-900/10 text-primary-500 text-[11px] font-bold cursor-pointer">
                <Plus size={11} /> 항목 추가
              </button>
            </div>
            <div className="border border-[var(--border-default)] rounded-lg min-h-[44px] overflow-hidden">
              {set.rows.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-[var(--text-muted)]">+ 항목 추가 버튼으로 행을 추가하세요</div>
              ) : set.rows.map((row, ri) => (
                <div key={ri} className="p-3.5 border-b border-[var(--border-default)] last:border-b-0 space-y-2.5">
                  {/* 가로 이미지 */}
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-muted)] mb-1">가로 이미지</div>
                    <input value={row.hImg||''} onChange={e => onUpdateRow(ri, { hImg: e.target.value })}
                      placeholder="URL 또는 파일" className="w-full px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] outline-none focus:border-[#6366f1]" />
                  </div>
                  {/* 세로 이미지 */}
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-muted)] mb-1">세로 이미지</div>
                    <input value={row.vImg||''} onChange={e => onUpdateRow(ri, { vImg: e.target.value })}
                      placeholder="URL 또는 파일" className="w-full px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] outline-none focus:border-[#6366f1]" />
                  </div>
                  {/* 링크 URL */}
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-muted)] mb-1">링크 URL</div>
                    <input value={row.url} onChange={e => onUpdateRow(ri, { url: e.target.value })}
                      placeholder="/page 또는 https://..." className="w-full px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] outline-none focus:border-[#6366f1]" />
                  </div>
                  {/* 하단: 새탭 + 삭제 */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[var(--text-secondary)] font-bold select-none">
                      <input type="checkbox" checked={row.blank} onChange={e => onUpdateRow(ri, { blank: e.target.checked })}
                        className="w-4 h-4 cursor-pointer" style={{ accentColor: '#6366f1' }} />
                      새 탭으로 열기
                    </label>
                    <button onClick={() => onRemoveRow(ri)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-[12px] font-bold cursor-pointer border-none hover:bg-red-500/20">
                      <Trash2 size={12} /> 삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 솔루션형 바디 ── */}
        {set.type === 'solution' && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Monitor size={11} className="text-[var(--text-secondary)]" />
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">솔루션 선택 (복수 선택 가능)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {SOLUTION_ITEMS.map(item => {
                const Icon = item.icon
                const selected = set.solutions?.includes(item.id)
                return (
                  <button key={item.id} onClick={() => onToggleSolution(item.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all select-none border-none"
                    style={{
                      border: `1.5px solid ${selected ? '#6366f1' : 'var(--border-default)'}`,
                      background: selected ? 'rgba(99,102,241,.08)' : 'var(--bg-muted)',
                    }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: selected ? 'rgba(99,102,241,.15)' : 'var(--bg-subtle)' }}>
                      <Icon size={13} style={{ color: selected ? '#6366f1' : 'var(--text-muted)' }} />
                    </div>
                    <span className="text-[11.5px] font-bold" style={{ color: selected ? '#6366f1' : 'var(--text-secondary)' }}>
                      {item.label}
                    </span>
                    {selected && <span className="ml-auto w-4 h-4 rounded-full bg-[#6366f1] text-white flex items-center justify-center text-[10px]">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
