import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../utils/storage'
import {
  Globe, Image, Megaphone, Navigation, LayoutGrid, LayoutTemplate,
  FileText, Copyright, Save, Upload, Plus, X, Eye,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Palette, Type, PaintBucket, Bold, Blend, Ruler, Tag, PencilLine,
  ChevronUp, ChevronDown, Link2, GripVertical,
  Timer, Monitor, Link, Image as ImageIcon,
} from 'lucide-react'

/* ── 타입 ── */
interface HpBasicData {
  /* 사이트 정보 */
  siteName: string; domain: string; email: string; phone: string
  /* 로고 */
  logoTopH: string; logoTopV: string; logoBotH: string; logoBotV: string
  logoTopHW: string; logoTopVW: string; logoBotHW: string; logoBotVW: string
  /* 로고 원본 비율 */
  logoTopHRatio: number; logoTopVRatio: number; logoBotHRatio: number; logoBotVRatio: number
  /* 리벳 */
  rivetBg: string; rivetFontSize: number; rivetFontColor: string
  rivetFontWeight: number; rivetAlign: string; rivetTags: string[]
  /* 메인메뉴 */
  menuBg: string; menuFc: string; menuFs: number; menuH: number
  menuOpacity: number; menuAlign: string; menuGap: number; menuFw: number
  menuItems: string[]
  /* 메인컨텐츠 */
  mcLines: McLine[]
  /* 하단 로고박스 */
  footerBg: string; footerHeight: number; footerOpacity: number
  /* 하단 텍스트 */
  ftBg: string; ftFc: string; ftFs: number; ftHeight: number
  ftOpacity: number; ftAlign: string; ftText: string
  /* 카피라이트 */
  cpBg: string; cpFc: string; cpFs: number; cpHeight: number
  cpOpacity: number; cpAlign: string; cpText: string
}

interface McItem { imgH: string; imgV: string; text1: string; text2: string; text3: string; url: string; blank: boolean }
interface McLine { type: 'image' | 'solution'; duration: number; items: McItem[]; solution: string }
const EMPTY_MC_ITEM: McItem = { imgH:'', imgV:'', text1:'', text2:'', text3:'', url:'', blank:false }
const SOLUTIONS = ['컨텐츠관리','미디어관리','개인정보처리방침','게시물 게재 원칙','홈페이지 이용약관','공지사항','뉴스','자유게시판','Q&A','FAQ','가맹점신청','워크샵','대관(교육관)']

const DEFAULT: HpBasicData = {
  siteName: '', domain: '', email: '', phone: '',
  logoTopH: '', logoTopV: '', logoBotH: '', logoBotV: '',
  logoTopHW: '', logoTopVW: '', logoBotHW: '', logoBotVW: '',
  logoTopHRatio: 1, logoTopVRatio: 1, logoBotHRatio: 1, logoBotVRatio: 1,
  rivetBg: '#1e40af', rivetFontSize: 13, rivetFontColor: '#ffffff',
  rivetFontWeight: 400, rivetAlign: 'center', rivetTags: [],
  menuBg: '#1e293b', menuFc: '#ffffff', menuFs: 15, menuH: 52,
  menuOpacity: 100, menuAlign: 'center', menuGap: 50, menuFw: 700,
  menuItems: [],
  mcLines: [],
  footerBg: '#1a1a2e', footerHeight: 120, footerOpacity: 100,
  ftBg: '#0a0a1a', ftFc: '#64748b', ftFs: 12, ftHeight: 80,
  ftOpacity: 100, ftAlign: 'center', ftText: '',
  cpBg: '#050510', cpFc: '#475569', cpFs: 11, cpHeight: 48,
  cpOpacity: 100, cpAlign: 'center', cpText: '',
}

const STORAGE_KEY = 'hp_basic_settings'

/* ── 공통 스타일 ── */
const cardCls = 'bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4'
const labelCls = 'text-[11px] font-bold text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5'
const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors'
const saveBtn = 'flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary-500 text-white text-[12px] font-bold cursor-pointer hover:bg-primary-600 transition-colors'

function SectionHeader({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div className="text-sm font-extrabold text-[var(--text-primary)]">{title}</div>
        <div className="text-[10.5px] text-[var(--text-muted)]">{desc}</div>
      </div>
    </div>
  )
}

/* ── ColorInput: 컬러피커 + hex 입력 ── */
function ColorInput({ value, onChange, accent }: { value: string; onChange: (v: string) => void; accent?: string }) {
  return (
    <div className="flex items-center gap-1.5 h-10 px-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)]">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-7 h-7 border-none rounded-md cursor-pointer p-0" style={{ background: 'none' }} />
      <input type="text" value={value} maxLength={7}
        onChange={e => { const v = e.target.value; onChange(v); }}
        className="flex-1 border-none outline-none bg-transparent text-[12px] text-[var(--text-secondary)] font-mono p-0 w-[60px]" />
    </div>
  )
}

/* ── JogLever: 조이스틱 레버 방식 (일정보기 동일) ── */
function RangeInput({ value, onChange, min, max, unit, accent }: { value: number; onChange: (v: number) => void; min: number; max: number; unit: string; accent?: string }) {
  const TRACK_HALF = 37
  const STEP_MAX = 6
  const SPEED_EXP = 1.8
  const knobRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef({ active: false, offsetX: 0 })
  const valueRef = useRef(value)
  valueRef.current = value

  const gradient = accent ? `linear-gradient(135deg, ${accent}, ${accent}88)` : 'linear-gradient(135deg, #4f6ef7, #9747ff)'
  const shadow = accent ? `${accent}77` : 'rgba(79,110,247,.45)'

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
      if (nv !== valueRef.current) onChange(nv)
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
      st.offsetX = Math.max(-TRACK_HALF, Math.min(TRACK_HALF, ev.clientX - startX))
      updateKnobPos(st.offsetX)
    }
    const onUp = () => {
      st.active = false
      if (rafRef.current) clearTimeout(rafRef.current)
      if (knobRef.current) knobRef.current.style.transition = 'left .35s cubic-bezier(.22,1,.36,1), box-shadow .15s'
      snapBack()
      setTimeout(() => { if (knobRef.current) knobRef.current.style.transition = 'box-shadow .15s' }, 400)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [tickLoop, snapBack, updateKnobPos])

  return (
    <div className="flex items-center gap-2 h-10 px-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)]">
      <span className="text-[12px] font-bold min-w-[36px]" style={{ color: accent || '#4f6ef7' }}>{value}{unit}</span>
      <div className="relative flex items-center justify-center overflow-visible" style={{ width: 80, height: 22, borderRadius: 11, background: 'var(--bg-subtle)', border: '1.5px solid var(--border-default)' }} title="좌우로 드래그하여 조절">
        <div className="absolute" style={{ left: '50%', top: 3, bottom: 3, width: 1.5, background: 'var(--border-default)', transform: 'translateX(-50%)', borderRadius: 2 }} />
        <div ref={knobRef} data-knob className="absolute flex items-center justify-center"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 26, height: 26, borderRadius: '50%', background: gradient, border: '2px solid #fff', boxShadow: `0 2px 8px ${shadow}`, cursor: 'col-resize', zIndex: 2, transition: 'box-shadow .15s' }}
          onMouseDown={onMouseDown}>
          <GripVertical size={10} className="text-white pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

/* ── AlignButtons ── */
function AlignButtons({ value, onChange, options, accent }: { value: string; onChange: (v: string) => void; options: { value: string; icon: any; title: string }[]; accent?: string }) {
  return (
    <div className="flex gap-1 h-10 px-1 items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)]">
      {options.map(o => {
        const Icon = o.icon
        const active = value === o.value
        return (
          <button key={o.value} onClick={() => onChange(o.value)} title={o.title}
            className="flex-1 py-1 rounded-md border-none cursor-pointer transition-all flex items-center justify-center"
            style={{ background: active ? (accent || '#4f6ef7') : 'transparent', color: active ? '#fff' : 'var(--text-secondary)' }}>
            <Icon size={14} />
          </button>
        )
      })}
    </div>
  )
}

/* ── FontWeightButtons ── */
function FontWeightButtons({ value, onChange, accent }: { value: number; onChange: (v: number) => void; accent?: string }) {
  const weights = [300, 400, 700, 900]
  return (
    <div className="flex gap-1 h-10 px-1 items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)]">
      {weights.map(w => {
        const active = value === w
        return (
          <button key={w} onClick={() => onChange(w)}
            className="flex-1 py-1 rounded-md border-none cursor-pointer transition-all text-[11px]"
            style={{ fontWeight: w, background: active ? (accent || '#4f6ef7') : 'transparent', color: active ? '#fff' : 'var(--text-secondary)' }}>
            가
          </button>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════ */
export function HpBasicSettings() {
  const [d, setD] = useState<HpBasicData>(() => ({ ...DEFAULT, ...getItem<Partial<HpBasicData>>(STORAGE_KEY, {}) }))
  const [toast, setToast] = useState<string|null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  const up = useCallback((patch: Partial<HpBasicData>) => setD(prev => ({ ...prev, ...patch })), [])
  const save = useCallback((section: string) => {
    setItem(STORAGE_KEY, d)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(`${section} 설정이 저장되었습니다`)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [d])

  /* ── 로고 업로드 핼퍼 ── */
  const handleLogo = (key: keyof HpBasicData, ratioKey: keyof HpBasicData, file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert('5MB 이하 파일만 업로드 가능합니다'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      const img = new window.Image()
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight
        up({ [key]: src, [ratioKey]: ratio } as any)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  const calcHeight = (widthStr: string, ratio: number) => {
    const w = parseInt(widthStr)
    if (!w || !ratio) return ''
    return String(Math.round(w / ratio))
  }

  /* ── 리벳 태그 ── */
  const [rivetInput, setRivetInput] = useState('')
  const addRivetTag = () => {
    const t = rivetInput.trim()
    if (!t) return
    up({ rivetTags: [...d.rivetTags, t] })
    setRivetInput('')
  }
  const removeRivetTag = (i: number) => up({ rivetTags: d.rivetTags.filter((_, idx) => idx !== i) })

  /* ── 메뉴 칩 ── */
  const [menuInput, setMenuInput] = useState('')
  const addMenu = () => {
    const t = menuInput.trim()
    if (!t) return
    up({ menuItems: [...d.menuItems, t] })
    setMenuInput('')
  }
  const removeMenu = (i: number) => up({ menuItems: d.menuItems.filter((_, idx) => idx !== i) })

  /* ── 메인 컨텐츠 라인 ── */
  const addMcLine = () => up({ mcLines: [...d.mcLines, { type:'image', duration:5, items:[], solution:'' }] })
  const updateMcLine = (i: number, patch: Partial<McLine>) => {
    const lines = [...d.mcLines]
    lines[i] = { ...lines[i], ...patch }
    up({ mcLines: lines })
  }
  const removeMcLine = (i: number) => up({ mcLines: d.mcLines.filter((_, idx) => idx !== i) })
  const addMcItem = (li: number) => {
    const lines = [...d.mcLines]
    lines[li] = { ...lines[li], items: [...lines[li].items, { ...EMPTY_MC_ITEM }] }
    up({ mcLines: lines })
  }
  const updateMcItem = (li: number, ji: number, patch: Partial<McItem>) => {
    const lines = [...d.mcLines]
    const items = [...lines[li].items]
    items[ji] = { ...items[ji], ...patch }
    lines[li] = { ...lines[li], items }
    up({ mcLines: lines })
  }
  const removeMcItem = (li: number, ji: number) => {
    const lines = [...d.mcLines]
    lines[li] = { ...lines[li], items: lines[li].items.filter((_, idx) => idx !== ji) }
    up({ mcLines: lines })
  }
  const handleMcFileUpload = (li: number, ji: number, field: 'imgH'|'imgV', files: FileList|null) => {
    if (!files || !files[0]) return
    const reader = new FileReader()
    reader.onload = (ev) => { updateMcItem(li, ji, { [field]: ev.target?.result as string }) }
    reader.readAsDataURL(files[0])
  }

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ═══ 1. 사이트 정보 ═══ */}
      <div className={cardCls}>
        <SectionHeader icon={Globe} title="사이트 정보" desc="홈페이지 기본 정보를 입력합니다" color="#4f6ef7" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div><label className={labelCls}>사이트명</label><input value={d.siteName} onChange={e => up({ siteName: e.target.value })} placeholder="예: (주)워크엠" className={inputCls} /></div>
          <div><label className={labelCls}>도메인</label><input value={d.domain} onChange={e => up({ domain: e.target.value })} placeholder="예: www.workm.kr" className={inputCls} /></div>
          <div><label className={labelCls}>대표 이메일</label><input value={d.email} onChange={e => up({ email: e.target.value })} placeholder="예: info@workm.kr" className={inputCls} /></div>
          <div><label className={labelCls}>대표 전화</label><input value={d.phone} onChange={e => up({ phone: e.target.value })} placeholder="예: 02-1234-5678" className={inputCls} /></div>
        </div>
        <div className="flex justify-end"><button onClick={() => save('사이트 정보')} className={saveBtn}><Save size={13} /> 저장</button></div>
      </div>

      {/* ═══ 2. 로고 등록 ═══ */}
      <div className={cardCls}>
        <SectionHeader icon={Image} title="로고 등록" desc="PNG, JPG, SVG 권장 (투명 배경 PNG 최적)" color="#f59e0b" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { k: 'logoTopH' as const, r: 'logoTopHRatio' as const, w: 'logoTopHW' as const, label: '상단로고 · 가로형', icon: ChevronUp, color: '#4f6ef7' },
            { k: 'logoTopV' as const, r: 'logoTopVRatio' as const, w: 'logoTopVW' as const, label: '상단로고 · 세로형', icon: ChevronUp, color: '#4f6ef7' },
            { k: 'logoBotH' as const, r: 'logoBotHRatio' as const, w: 'logoBotHW' as const, label: '하단로고 · 가로형', icon: ChevronDown, color: '#9747ff' },
            { k: 'logoBotV' as const, r: 'logoBotVRatio' as const, w: 'logoBotVW' as const, label: '하단로고 · 세로형', icon: ChevronDown, color: '#9747ff' },
          ]).map(logo => {
            const Icon = logo.icon
            const src = d[logo.k] as string
            const ratio = d[logo.r] as number
            const widthVal = d[logo.w] as string
            return (
              <div key={logo.k}>
                <div className="text-[11.5px] font-bold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <Icon size={12} style={{ color: logo.color }} />{logo.label}
                </div>
                <label className="cursor-pointer block">
                  <div className="w-full h-[90px] border-[1.5px] border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-muted)] flex flex-col items-center justify-center gap-1.5 transition-colors hover:border-primary-400 overflow-hidden">
                    {src ? (
                      <img src={src} alt={logo.label} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <>
                        <Upload size={18} className="opacity-35" />
                        <span className="text-[11px] text-[var(--text-muted)]">클릭하여 업로드</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleLogo(logo.k, logo.r, f) }} />
                </label>
                {src && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex-1 relative">
                      <input type="number" placeholder="가로(px)" value={widthVal}
                        onChange={e => up({ [logo.w]: e.target.value } as any)}
                        className="w-full h-8 px-2 pr-7 rounded-md border border-[var(--border-default)] bg-[var(--bg-muted)] text-[12px] outline-none" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">px</span>
                    </div>
                    <Link2 size={12} className="text-[var(--text-muted)] shrink-0" />
                    <div className="flex-1 relative">
                      <input type="text" readOnly placeholder="세로(자동)" value={calcHeight(widthVal, ratio)}
                        className="w-full h-8 px-2 pr-7 rounded-md border border-[var(--border-default)] bg-[var(--bg-muted)] text-[12px] text-[var(--text-muted)] outline-none cursor-default" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">px</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-end"><button onClick={() => save('로고')} className={saveBtn}><Save size={13} /> 저장</button></div>
      </div>

      {/* ═══ 3. 상단 리벳 설정 ═══ */}
      <div className={cardCls}>
        <SectionHeader icon={Megaphone} title="상단 리벳 설정" desc="홈페이지 상단 공지 띠 배너" color="#10b981" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div><label className={labelCls}><Palette size={11} /> 바탕 칼라</label><ColorInput value={d.rivetBg} onChange={v => up({ rivetBg: v })} /></div>
          <div><label className={labelCls}><Type size={11} /> 폰트 사이즈</label><RangeInput value={d.rivetFontSize} onChange={v => up({ rivetFontSize: v })} min={10} max={24} unit="px" accent="#10b981" /></div>
          <div><label className={labelCls}><PaintBucket size={11} /> 폰트 칼라</label><ColorInput value={d.rivetFontColor} onChange={v => up({ rivetFontColor: v })} /></div>
          <div><label className={labelCls}><Bold size={11} /> 폰트 굵기</label><FontWeightButtons value={d.rivetFontWeight} onChange={v => up({ rivetFontWeight: v })} accent="#10b981" /></div>
          <div><label className={labelCls}><AlignCenter size={11} /> 정렬</label>
            <AlignButtons value={d.rivetAlign} onChange={v => up({ rivetAlign: v })} accent="#10b981"
              options={[
                { value: 'left', icon: AlignLeft, title: '좌측' },
                { value: 'center', icon: AlignCenter, title: '중앙' },
                { value: 'right', icon: AlignRight, title: '우측' },
              ]} />
          </div>
        </div>
        {/* 태그 입력 */}
        <div>
          <label className={labelCls}><Tag size={11} /> 리벳 텍스트 <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">Enter 또는 + 버튼으로 추가</span></label>
          <div className="flex flex-wrap gap-2 items-center min-h-[46px] px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] cursor-text"
            onClick={() => document.getElementById('rivet_tag_inp')?.focus()}>
            {d.rivetTags.map((t, i) => (
              <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#10b98122] text-[#10b981] border border-[#10b981]">
                {t}
                <button onClick={e => { e.stopPropagation(); removeRivetTag(i) }} className="w-4 h-4 rounded-full bg-[#10b98133] flex items-center justify-center cursor-pointer hover:bg-[#10b98155]"><X size={10} /></button>
              </span>
            ))}
            <input id="rivet_tag_inp" value={rivetInput} onChange={e => setRivetInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRivetTag() } }}
              placeholder="공지 텍스트 입력..." className="flex-1 min-w-[140px] border-none outline-none bg-transparent text-[13px] text-[var(--text-primary)] py-0.5" />
            <button onClick={addRivetTag} className="w-6 h-6 rounded-md bg-[#10b981] text-white flex items-center justify-center cursor-pointer shrink-0"><Plus size={13} /></button>
          </div>
        </div>
        {/* 미리보기 */}
        <div>
          <label className={labelCls}><Eye size={11} /> 미리보기</label>
          <div className="w-full py-2 px-4 rounded-lg overflow-hidden whitespace-pre text-ellipsis transition-all"
            style={{
              background: d.rivetBg, color: d.rivetFontColor,
              fontSize: `${d.rivetFontSize}px`, fontWeight: d.rivetFontWeight,
              textAlign: d.rivetAlign as any,
            }}>
            {d.rivetTags.length > 0 ? d.rivetTags.join('  ·  ') : '공지 텍스트를 입력하세요'}
          </div>
        </div>
        <div className="flex justify-end"><button onClick={() => save('상단 리벳')} className={`${saveBtn} !bg-[#10b981] hover:!bg-[#059669]`}><Save size={13} /> 저장</button></div>
      </div>

      {/* ═══ 4. 메인메뉴 등록 ═══ */}
      <div className={cardCls}>
        <SectionHeader icon={Navigation} title="메인메뉴 등록" desc="홈페이지 상단 메인메뉴 구성" color="#6366f1" />
        {/* Row1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div><label className={labelCls}>배경 컬러</label><ColorInput value={d.menuBg} onChange={v => up({ menuBg: v })} /></div>
          <div><label className={labelCls}>폰트 컬러</label><ColorInput value={d.menuFc} onChange={v => up({ menuFc: v })} /></div>
          <div><label className={labelCls}>폰트 사이즈</label><RangeInput value={d.menuFs} onChange={v => up({ menuFs: v })} min={12} max={22} unit="px" accent="#6366f1" /></div>
          <div><label className={labelCls}>높이</label><RangeInput value={d.menuH} onChange={v => up({ menuH: v })} min={36} max={80} unit="px" accent="#6366f1" /></div>
        </div>
        {/* Row2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div><label className={labelCls}><Blend size={11} /> 배경 투명도</label><RangeInput value={d.menuOpacity} onChange={v => up({ menuOpacity: v })} min={0} max={100} unit="%" accent="#6366f1" /></div>
          <div><label className={labelCls}><AlignCenter size={11} /> 정렬</label>
            <AlignButtons value={d.menuAlign} onChange={v => up({ menuAlign: v })} accent="#6366f1"
              options={[
                { value: 'flex-start', icon: AlignLeft, title: '왼쪽' },
                { value: 'center', icon: AlignCenter, title: '가운데' },
                { value: 'flex-end', icon: AlignRight, title: '오른쪽' },
                { value: 'space-between', icon: AlignJustify, title: '균등배분' },
              ]} />
          </div>
          <div><label className={labelCls}>메뉴 간격</label><RangeInput value={d.menuGap} onChange={v => up({ menuGap: v })} min={10} max={100} unit="px" accent="#6366f1" /></div>
          <div><label className={labelCls}><Bold size={11} /> 폰트 굵기</label><FontWeightButtons value={d.menuFw} onChange={v => up({ menuFw: v })} accent="#6366f1" /></div>
        </div>
        {/* 메뉴명 칩 */}
        <div>
          <label className={labelCls}>메뉴명 등록</label>
          <div className="flex flex-wrap gap-2 items-center min-h-[36px] p-1.5 rounded-lg border-[1.5px] border-dashed border-[var(--border-default)] bg-[var(--bg-muted)]" style={{ gap: `${Math.min(d.menuGap / 5, 12)}px` }}>
            {d.menuItems.map((m, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-bold bg-[#6366f122] text-[#6366f1] border border-[#6366f1]">
                {m}
                <button onClick={() => removeMenu(i)} className="w-4 h-4 rounded-full bg-[#6366f133] flex items-center justify-center cursor-pointer hover:bg-[#6366f155]"><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input value={menuInput} onChange={e => setMenuInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMenu() } }}
              placeholder="메뉴명 입력 후 Enter 또는 + 버튼" className={`flex-1 ${inputCls}`} />
            <button onClick={addMenu} className="px-3.5 rounded-lg bg-[#6366f1] text-white text-[13px] font-bold cursor-pointer flex items-center gap-1.5 shrink-0">
              <Plus size={13} /> 추가
            </button>
          </div>
        </div>
        {/* 미리보기 */}
        <div>
          <label className={labelCls}>미리보기</label>
          <div className="px-5 rounded-xl flex-wrap flex items-center"
            style={{
              background: d.menuBg, opacity: d.menuOpacity / 100,
              minHeight: `${d.menuH}px`, justifyContent: d.menuAlign,
              gap: `${d.menuGap}px`,
            }}>
            {(d.menuItems.length > 0 ? d.menuItems : ['홈']).map((m, i) => (
              <span key={i} className="cursor-pointer"
                style={{ fontSize: `${d.menuFs}px`, color: d.menuFc, fontWeight: d.menuFw }}>
                {m}
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-end"><button onClick={() => save('메인메뉴')} className={`${saveBtn} !bg-[#6366f1] hover:!bg-[#4f47e5]`}><Save size={13} /> 저장</button></div>
      </div>

      {/* ═══ 5. 메인컨텐츠 등록 ═══ */}
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <SectionHeader icon={LayoutGrid} title="메인컨텐츠 등록" desc="홈페이지 메인 섹션 구성" color="#4f6ef7" />
          <button onClick={addMcLine} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4f6ef7] bg-[#4f6ef708] text-[#4f6ef7] text-[11.5px] font-bold cursor-pointer hover:bg-[#4f6ef718] transition-colors">
            <Plus size={12} /> 하위컨텐츠 추가
          </button>
        </div>
        {d.mcLines.length === 0 ? (
          <div className="text-center py-8">
            <LayoutGrid size={36} className="mx-auto text-[var(--text-muted)] opacity-30" />
            <p className="text-[12px] text-[var(--text-muted)] mt-2">+ 하위컨텐츠 추가 버튼으로 섹션을 구성하세요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {d.mcLines.map((line, i) => (
              <div key={i} className="border border-[var(--border-default)] rounded-xl overflow-hidden">
                {/* ── 라인 헤더 ── */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                  <span className="w-5 h-5 rounded-full bg-[#4f6ef7] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">{i+1}</span>
                  <span className="text-[12px] font-bold text-[var(--text-primary)]">컨텐츠 {i+1}라인</span>
                  {/* 이미지형/솔루션형 토글 */}
                  {(['image','solution'] as const).map(t => (
                    <button key={t} onClick={() => updateMcLine(i, { type: t })}
                      className="px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer border-none transition-all"
                      style={{ background: line.type===t?'#4f6ef7':'var(--bg-surface)', color: line.type===t?'#fff':'var(--text-muted)' }}>
                      {t==='image'?'이미지형':'솔루션형'}
                    </button>
                  ))}
                  {/* 전환 시간 */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[11px]">
                    <Timer size={11} className="text-[var(--text-muted)]"/>
                    <input type="number" min={1} max={30} value={line.duration||5} onChange={e => updateMcLine(i, { duration: parseInt(e.target.value)||5 })}
                      className="w-[35px] border-none bg-transparent text-[11px] font-bold text-center text-[var(--text-primary)] outline-none" />
                    <span className="text-[var(--text-muted)]">초</span>
                  </div>
                  <button onClick={() => removeMcLine(i)} className="ml-auto w-[22px] h-[22px] rounded-md bg-red-500/10 text-red-500 flex items-center justify-center cursor-pointer border-none hover:bg-red-500/20"><X size={12}/></button>
                </div>

                {/* ── 이미지형 본문 ── */}
                {line.type === 'image' && (
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={12} className="text-[var(--text-muted)]" />
                      <span className="text-[11px] font-bold text-[var(--text-secondary)]">이미지 & 텍스트 목록</span>
                      <span className="text-[10px] text-[var(--text-muted)]">가로·세로 이미지(반응형) + 텍스트 3줄</span>
                      <button onClick={() => addMcItem(i)} className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#4f6ef7] bg-[#4f6ef708] text-[#4f6ef7] text-[11px] font-bold cursor-pointer">
                        <Plus size={11}/> 항목 추가
                      </button>
                    </div>
                    {line.items.length === 0 ? (
                      <div className="py-6 text-center text-[12px] text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-muted)]">
                        + 항목 추가 버튼으로 항목을 추가하세요
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {line.items.map((item, j) => (
                          <div key={j} className="border border-[var(--border-default)] rounded-xl overflow-hidden bg-[var(--bg-muted)]">
                            {/* 항목 헤더 */}
                            <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
                              <span className="text-[11px] font-bold text-[var(--text-muted)]">항목 {j+1}</span>
                              <button onClick={() => removeMcItem(i, j)} className="w-[22px] h-[22px] rounded-md bg-red-500/10 text-red-500 flex items-center justify-center cursor-pointer border-none text-[13px] font-bold">×</button>
                            </div>
                            {/* 미리보기 */}
                            <div className="relative w-full min-h-[180px] bg-[#0a0a12] flex items-center justify-center overflow-hidden">
                              {(item.imgH || item.imgV) && (
                                <img src={item.imgH || item.imgV} className="absolute inset-0 w-full h-full object-cover opacity-55" />
                              )}
                              <div className="relative z-[1] text-center px-6 py-4">
                                {item.text1 && <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold mb-2">{item.text1}</div>}
                                <div className="text-white text-[18px] font-extrabold">{item.text2 || '제목을 입력하세요'}</div>
                                {item.text3 && <div className="text-white/70 text-[12px] mt-1">{item.text3}</div>}
                              </div>
                              {/* 가로/세로 전환 */}
                              <div className="absolute top-2 right-2 flex rounded-md overflow-hidden border border-white/25 shadow-lg z-[2]">
                                <button onClick={() => {}} className="px-2 py-1 text-[10px] font-bold bg-black/50 text-white border-none cursor-default flex items-center gap-1"><Monitor size={10}/> 가로</button>
                                <button onClick={() => {}} className="px-2 py-1 text-[10px] font-bold bg-black/30 text-white/70 border-none cursor-default flex items-center gap-1">세로</button>
                              </div>
                            </div>
                            {/* 입력 필드 */}
                            <div className="p-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><Monitor size={9}/> 가로 이미지 (PC)</label>
                                  <div className="flex gap-1">
                                    <input value={item.imgH} onChange={e => updateMcItem(i, j, { imgH: e.target.value })} placeholder="URL 또는 파일 업로드" className={`flex-1 ${inputCls} !text-[10.5px]`} />
                                    <label className="px-2 py-1 rounded-md bg-[var(--bg-muted)] border border-[var(--border-default)] text-[10px] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--bg-surface)] flex items-center">
                                      <input type="file" accept="image/*" className="hidden" onChange={e => handleMcFileUpload(i, j, 'imgH', e.target.files)} />
                                      📁
                                    </label>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1">📱 세로 이미지 (모바일)</label>
                                  <div className="flex gap-1">
                                    <input value={item.imgV} onChange={e => updateMcItem(i, j, { imgV: e.target.value })} placeholder="URL 또는 파일 업로드" className={`flex-1 ${inputCls} !text-[10.5px]`} />
                                    <label className="px-2 py-1 rounded-md bg-[var(--bg-muted)] border border-[var(--border-default)] text-[10px] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--bg-surface)] flex items-center">
                                      <input type="file" accept="image/*" className="hidden" onChange={e => handleMcFileUpload(i, j, 'imgV', e.target.files)} />
                                      📁
                                    </label>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><Type size={9}/> 텍스트 1 (태그)</label>
                                  <input value={item.text1} onChange={e => updateMcItem(i, j, { text1: e.target.value })} placeholder="태그" className={`${inputCls} !text-[10.5px]`} />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><Type size={9}/> 텍스트 2 (제목)</label>
                                  <input value={item.text2} onChange={e => updateMcItem(i, j, { text2: e.target.value })} placeholder="제목" className={`${inputCls} !text-[10.5px]`} />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><Type size={9}/> 텍스트 3 (설명)</label>
                                  <input value={item.text3} onChange={e => updateMcItem(i, j, { text3: e.target.value })} placeholder="설명" className={`${inputCls} !text-[10.5px]`} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-1 border-t border-dashed border-[var(--border-default)]">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 shrink-0"><Link size={10}/> 클릭URL</span>
                                <input value={item.url} onChange={e => updateMcItem(i, j, { url: e.target.value })} placeholder="https://example.com  (비워두면 클릭 비활성)" className={`flex-1 ${inputCls} !text-[10.5px]`} />
                                <label className="flex items-center gap-1 cursor-pointer text-[10px] text-[var(--text-muted)] whitespace-nowrap shrink-0 select-none">
                                  <input type="checkbox" checked={item.blank} onChange={e => updateMcItem(i, j, { blank: e.target.checked })} className="w-3.5 h-3.5 cursor-pointer" /> 새탭
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 솔루션형 본문 ── */}
                {line.type === 'solution' && (
                  <div className="p-3.5 flex flex-wrap gap-2">
                    {SOLUTIONS.map(s => (
                      <button key={s} onClick={() => updateMcLine(i, { solution: s })}
                        className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all"
                        style={{ border:`1.5px solid ${line.solution===s?'#4f6ef7':'var(--border-default)'}`, background:line.solution===s?'#4f6ef7':'var(--bg-surface)', color:line.solution===s?'#fff':'var(--text-secondary)' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={() => save('메인컨텐츠')} className={saveBtn}><Save size={13} /> 저장</button>
        </div>
      </div>

      {/* ═══ 6. 하단 로고박스 설정 ═══ */}
      <div className={cardCls}>
        <SectionHeader icon={LayoutTemplate} title="하단 로고박스 설정" desc="푸터 상단 로고 표시 영역 스타일" color="#ec4899" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className={labelCls}><Palette size={11} /> 바탕색</label><ColorInput value={d.footerBg} onChange={v => up({ footerBg: v })} /></div>
          <div><label className={labelCls}><Ruler size={11} /> 높이</label><RangeInput value={d.footerHeight} onChange={v => up({ footerHeight: v })} min={60} max={240} unit="px" accent="#ec4899" /></div>
          <div><label className={labelCls}><Blend size={11} /> 투명도</label><RangeInput value={d.footerOpacity} onChange={v => up({ footerOpacity: v })} min={10} max={100} unit="%" accent="#ec4899" /></div>
        </div>
        {/* 미리보기 */}
        <div>
          <label className={labelCls}><Eye size={11} /> 미리보기</label>
          <div className="w-full rounded-lg border border-[var(--border-default)] flex items-center justify-center gap-10 overflow-hidden transition-all"
            style={{ background: d.footerBg, height: `${d.footerHeight}px`, opacity: d.footerOpacity / 100 }}>
            <div className="flex flex-col items-center gap-1.5">
              {d.logoBotH ? <img src={d.logoBotH} className="max-h-[50px] object-contain" alt="" /> : (
                <div className="w-[120px] h-[50px] border-[1.5px] border-dashed border-white/25 rounded-md flex items-center justify-center">
                  <span className="text-[11px] text-white/40">하단로고 · 가로형</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-1.5">
              {d.logoBotV ? <img src={d.logoBotV} className="max-h-[80px] object-contain" alt="" /> : (
                <div className="w-[60px] h-[80px] border-[1.5px] border-dashed border-white/25 rounded-md flex items-center justify-center">
                  <span className="text-[11px] text-white/40 [writing-mode:vertical-rl]">하단로고 · 세로형</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end"><button onClick={() => save('하단 로고박스')} className={`${saveBtn} !bg-[#ec4899] hover:!bg-[#db2777]`}><Save size={13} /> 저장</button></div>
      </div>

      {/* ═══ 7. 하단 텍스트 설정 ═══ */}
      <div className={cardCls}>
        <SectionHeader icon={FileText} title="하단 텍스트 설정" desc="푸터 하단 저작권·안내 텍스트 영역" color="#fb923c" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div><label className={labelCls}><Palette size={11} /> 바탕색</label><ColorInput value={d.ftBg} onChange={v => up({ ftBg: v })} /></div>
          <div><label className={labelCls}><PaintBucket size={11} /> 폰트 칼라</label><ColorInput value={d.ftFc} onChange={v => up({ ftFc: v })} /></div>
          <div><label className={labelCls}><Ruler size={11} /> 높이</label><RangeInput value={d.ftHeight} onChange={v => up({ ftHeight: v })} min={40} max={200} unit="px" accent="#fb923c" /></div>
          <div><label className={labelCls}><Blend size={11} /> 투명도</label><RangeInput value={d.ftOpacity} onChange={v => up({ ftOpacity: v })} min={10} max={100} unit="%" accent="#fb923c" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={labelCls}><Type size={11} /> 폰트 사이즈</label><RangeInput value={d.ftFs} onChange={v => up({ ftFs: v })} min={9} max={20} unit="px" accent="#fb923c" /></div>
          <div><label className={labelCls}><AlignCenter size={11} /> 정렬</label>
            <AlignButtons value={d.ftAlign} onChange={v => up({ ftAlign: v })} accent="#fb923c"
              options={[
                { value: 'left', icon: AlignLeft, title: '좌측' },
                { value: 'center', icon: AlignCenter, title: '중앙' },
                { value: 'right', icon: AlignRight, title: '우측' },
              ]} />
          </div>
        </div>
        <div>
          <label className={labelCls}><PencilLine size={11} /> 하단 텍스트 <span className="font-normal text-[10px] text-[var(--text-muted)] ml-1">Enter로 줄바꿈</span></label>
          <textarea value={d.ftText} onChange={e => up({ ftText: e.target.value })} rows={4}
            placeholder={"© 2025 워크엠. All rights reserved.\n서울특별시 강남구 테헤란로 123\nTel: 02-1234-5678"}
            className={`${inputCls} resize-y leading-relaxed font-inherit`} />
        </div>
        <div>
          <label className={labelCls}><Eye size={11} /> 미리보기</label>
          <div className="w-full rounded-lg border border-[var(--border-default)] flex items-center px-6 overflow-hidden transition-all"
            style={{ background: d.ftBg, minHeight: `${d.ftHeight}px`, opacity: d.ftOpacity / 100, justifyContent: d.ftAlign === 'left' ? 'flex-start' : d.ftAlign === 'right' ? 'flex-end' : 'center' }}>
            <div style={{ fontSize: `${d.ftFs}px`, color: d.ftFc, textAlign: d.ftAlign as any, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {d.ftText || '© 2025 워크엠. All rights reserved.'}
            </div>
          </div>
        </div>
        <div className="flex justify-end"><button onClick={() => save('하단 텍스트')} className={`${saveBtn} !bg-[#fb923c] hover:!bg-[#ea580c]`}><Save size={13} /> 저장</button></div>
      </div>

      {/* ═══ 8. 하단 카피라이트 설정 ═══ */}
      <div className={cardCls}>
        <SectionHeader icon={Copyright} title="하단 카피라이트 설정" desc="저작권 표시 최하단 영역" color="#eab308" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div><label className={labelCls}><Palette size={11} /> 바탕색</label><ColorInput value={d.cpBg} onChange={v => up({ cpBg: v })} /></div>
          <div><label className={labelCls}><PaintBucket size={11} /> 폰트 칼라</label><ColorInput value={d.cpFc} onChange={v => up({ cpFc: v })} /></div>
          <div><label className={labelCls}><Ruler size={11} /> 높이</label><RangeInput value={d.cpHeight} onChange={v => up({ cpHeight: v })} min={30} max={120} unit="px" accent="#eab308" /></div>
          <div><label className={labelCls}><Blend size={11} /> 투명도</label><RangeInput value={d.cpOpacity} onChange={v => up({ cpOpacity: v })} min={10} max={100} unit="%" accent="#eab308" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={labelCls}><Type size={11} /> 폰트 사이즈</label><RangeInput value={d.cpFs} onChange={v => up({ cpFs: v })} min={9} max={16} unit="px" accent="#eab308" /></div>
          <div><label className={labelCls}><AlignCenter size={11} /> 정렬</label>
            <AlignButtons value={d.cpAlign} onChange={v => up({ cpAlign: v })} accent="#eab308"
              options={[
                { value: 'left', icon: AlignLeft, title: '좌측' },
                { value: 'center', icon: AlignCenter, title: '중앙' },
                { value: 'right', icon: AlignRight, title: '우측' },
              ]} />
          </div>
        </div>
        <div>
          <label className={labelCls}><PencilLine size={11} /> 카피라이트 텍스트 <span className="font-normal text-[10px] text-[var(--text-muted)] ml-1">Enter로 줄바꿈</span></label>
          <textarea value={d.cpText} onChange={e => up({ cpText: e.target.value })} rows={3}
            placeholder={"© 2025 워크엠(WorkM). All rights reserved.\n이 사이트의 모든 콘텐츠 및 데이터는 저작권법의 보호를 받습니다."}
            className={`${inputCls} resize-y leading-relaxed font-inherit`} />
        </div>
        <div>
          <label className={labelCls}><Eye size={11} /> 미리보기</label>
          <div className="w-full rounded-lg border border-[var(--border-default)] flex items-center px-6 overflow-hidden transition-all"
            style={{ background: d.cpBg, minHeight: `${d.cpHeight}px`, opacity: d.cpOpacity / 100, justifyContent: d.cpAlign === 'left' ? 'flex-start' : d.cpAlign === 'right' ? 'flex-end' : 'center' }}>
            <div style={{ fontSize: `${d.cpFs}px`, color: d.cpFc, textAlign: d.cpAlign as any, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {d.cpText || '© 2025 워크엠(WorkM). All rights reserved.'}
            </div>
          </div>
        </div>
        <div className="flex justify-end"><button onClick={() => save('카피라이트')} className={`${saveBtn} !bg-[#eab308] !text-black hover:!bg-[#ca8a04]`}><Save size={13} /> 저장</button></div>
      </div>

      {/* ── 토스트 메시지 ── */}
      {toast && createPortal(
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, animation: 'toastSlideUp 0.35s cubic-bezier(.22,1,.36,1)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 24px', borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            boxShadow: '0 8px 32px rgba(16,185,129,.35), 0 2px 8px rgba(0,0,0,.15)',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}>✓</span>
            {toast}
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
