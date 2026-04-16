import { useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../utils/storage'
import {
  Plus, X, Save, Trash2, Edit3, Rss, Heart, Eye, ExternalLink,
  Search, LayoutGrid, List, ChevronDown,
} from 'lucide-react'

/* ── 타입 ── */
interface ContentItem {
  id: string; type: 'news'|'blog'|'youtube'|'website'
  title: string; url: string; summary: string; img: string
  tags: string[]; likes: number; views: number; regDate: string
}

const STORAGE_KEY = 'chub_items'
const TYPE_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  news:    { emoji: '📰', label: '뉴스',     color: '#3b82f6' },
  blog:    { emoji: '✍️', label: '블로그',   color: '#10b981' },
  youtube: { emoji: '🎬', label: '유튜브',   color: '#ef4444' },
  website: { emoji: '🌐', label: '웹사이트', color: '#8b5cf6' },
}

/* ── 샘플 데이터 ── */
const SAMPLE: ContentItem[] = [
  { id:'s1', type:'news', title:'AI 반도체 시장, 2026년 사상 최대 성장', url:'https://example.com/news1', summary:'글로벌 AI 반도체 시장이 전년 대비 42% 성장하며 사상 최대 규모를 기록했습니다.', img:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=480&h=280&fit=crop', tags:['AI','반도체','시장'], likes:245, views:8930, regDate:'2026-04-10' },
  { id:'s2', type:'blog', title:'React 19의 새로운 기능 총정리', url:'https://example.com/blog1', summary:'React 19에서 추가된 Server Components, Actions 등 핵심 기능을 자세히 살펴봅니다.', img:'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=480&h=280&fit=crop', tags:['React','프론트엔드'], likes:189, views:6200, regDate:'2026-04-08' },
  { id:'s3', type:'youtube', title:'Next.js 15 완벽 가이드 - 1시간 마스터', url:'https://youtube.com/watch1', summary:'Next.js 15의 App Router, Server Actions를 실습과 함께 배워봅니다.', img:'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=480&h=280&fit=crop', tags:['Next.js','튜토리얼'], likes:423, views:15200, regDate:'2026-04-05' },
  { id:'s4', type:'website', title:'Vercel – 프론트엔드 배포 플랫폼', url:'https://vercel.com', summary:'Next.js 공식 호스팅 플랫폼. 글로벌 CDN과 서버리스 환경을 제공합니다.', img:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=480&h=280&fit=crop', tags:['Vercel','배포','호스팅'], likes:312, views:11400, regDate:'2026-04-02' },
  { id:'s5', type:'news', title:'애플, 자체 AI 칩 M5 공개 임박', url:'https://example.com/news2', summary:'애플이 M5 칩에 자체 AI 가속기를 탑재할 것이라는 보도가 나왔습니다.', img:'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=480&h=280&fit=crop', tags:['애플','M5','AI'], likes:178, views:7650, regDate:'2026-03-28' },
  { id:'s6', type:'blog', title:'TypeScript 5.5 실전 팁 10가지', url:'https://example.com/blog2', summary:'TypeScript 5.5에서 달라진 점과 실전에서 바로 활용 가능한 팁을 소개합니다.', img:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=480&h=280&fit=crop', tags:['TypeScript','팁'], likes:156, views:4800, regDate:'2026-03-25' },
]

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors'

/* ══════════════════════════════════════
   컨텐츠관리 (콘텐츠 허브)
   ══════════════════════════════════════ */
export function HpContentMgmt() {
  const [items, setItems] = useState<ContentItem[]>(() => {
    const saved = getItem<ContentItem[]>(STORAGE_KEY, null)
    return saved || SAMPLE
  })
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'card'|'list'>('card')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [detailId, setDetailId] = useState<string|null>(null)

  /* ── 폼 상태 ── */
  const [form, setForm] = useState({ type:'news' as string, title:'', url:'', summary:'', img:'', tags:'' as string, likes:0, views:0 })
  const [tagInput, setTagInput] = useState('')

  const persist = useCallback((list: ContentItem[]) => {
    setItems(list)
    setItem(STORAGE_KEY, list)
  }, [])

  /* ── 필터/검색 ── */
  const filtered = useMemo(() => {
    let list = items
    if (filter !== 'all') list = list.filter(it => it.type === filter)
    if (search) {
      const kw = search.toLowerCase()
      list = list.filter(it => (it.title + ' ' + it.tags.join(' ') + ' ' + it.summary + ' ' + it.url).toLowerCase().includes(kw))
    }
    return list.sort((a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime())
  }, [items, filter, search])

  /* ── 모달 열기 (추가/수정) ── */
  const openAdd = () => {
    setEditId(null)
    setForm({ type:'news', title:'', url:'', summary:'', img:'', tags:'', likes:0, views:0 })
    setTagInput('')
    setShowModal(true)
  }

  const openEdit = (id: string) => {
    const it = items.find(x => x.id === id)
    if (!it) return
    setEditId(id)
    setForm({ type:it.type, title:it.title, url:it.url, summary:it.summary, img:it.img, tags:it.tags.join(','), likes:it.likes, views:it.views })
    setTagInput('')
    setDetailId(null)
    setShowModal(true)
  }

  /* ── 저장 ── */
  const save = () => {
    if (!form.title.trim()) { alert('제목을 입력하세요'); return }
    const allTags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const now = new Date().toISOString().slice(0,10)
    if (editId) {
      persist(items.map(it => it.id === editId ? { ...it, ...form, type: form.type as ContentItem['type'], tags: allTags } : it))
    } else {
      const newItem: ContentItem = { id: 'c' + Date.now(), ...form, type: form.type as ContentItem['type'], tags: allTags, regDate: now }
      persist([newItem, ...items])
    }
    setShowModal(false)
  }

  /* ── 삭제 ── */
  const deleteItem = (id: string) => {
    if (!confirm('이 콘텐츠를 삭제하시겠습니까?')) return
    persist(items.filter(x => x.id !== id))
    setDetailId(null)
  }

  /* ── 태그 입력 ── */
  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    const existing = form.tags ? form.tags.split(',').filter(Boolean) : []
    if (!existing.includes(t)) {
      setForm(f => ({ ...f, tags: [...existing, t].join(',') }))
    }
    setTagInput('')
  }

  /* ── 상세 데이터 ── */
  const detailItem = detailId ? items.find(x => x.id === detailId) : null

  return (
    <div className="animate-fadeIn">
      {/* ═══ 헤더 ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            <Rss size={18} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-[var(--text-primary)]">콘텐츠 허브</div>
            <div className="text-[11.5px] text-[var(--text-muted)]">뉴스 · 블로그 · 유튜브 · 웹사이트 통합 관리</div>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3b82f6] text-white text-[13px] font-bold cursor-pointer border-none hover:bg-[#2563eb] transition-colors">
          <Plus size={14} /> 콘텐츠 추가
        </button>
      </div>

      {/* ═══ 필터 탭 ═══ */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {[{ key:'all', label:'전체' }, ...Object.entries(TYPE_INFO).map(([k,v]) => ({ key:k, label:`${v.emoji} ${v.label}` }))].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-4 py-1.5 rounded-full text-[12px] font-bold cursor-pointer transition-all border-none"
            style={{
              background: filter === f.key ? '#3b82f6' : 'transparent',
              border: `1.5px solid ${filter === f.key ? '#3b82f6' : 'var(--border-default)'}`,
              color: filter === f.key ? '#fff' : 'var(--text-secondary)',
            }}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[12px] text-[var(--text-muted)]">총 {filtered.length}개의 콘텐츠</span>
      </div>

      {/* ═══ 검색 + 보기 전환 ═══ */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="검색..."
            className={`${inputCls} !pl-9`} />
        </div>
        <div className="flex items-center border border-[var(--border-default)] rounded-lg overflow-hidden">
          {(['card','list'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className="p-2 border-none cursor-pointer transition-colors"
              style={{ background: viewMode === m ? '#3b82f6' : 'transparent', color: viewMode === m ? '#fff' : 'var(--text-muted)' }}>
              {m === 'card' ? <LayoutGrid size={14} /> : <List size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ 콘텐츠 그리드/리스트 ═══ */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-[var(--text-muted)]">
          <div className="text-5xl mb-3">📭</div>
          <div className="text-sm font-bold">콘텐츠가 없습니다</div>
          <div className="text-[12px] mt-1">새 콘텐츠를 추가하거나 필터를 변경해보세요</div>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))' }}>
          {filtered.map(it => {
            const ti = TYPE_INFO[it.type]
            return (
              <div key={it.id} onClick={() => setDetailId(it.id)}
                className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] cursor-pointer overflow-hidden flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ ['--hover-border' as any]: ti.color }}>
                {it.img && (
                  <div className="w-full aspect-video overflow-hidden bg-[var(--bg-muted)]">
                    <img src={it.img} alt="" className="w-full h-full object-cover transition-transform hover:scale-105" loading="lazy" />
                  </div>
                )}
                <div className="p-3.5 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{ti.emoji}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md text-white" style={{ background: ti.color }}>{it.type}</span>
                  </div>
                  <div className="text-[13.5px] font-bold text-[var(--text-primary)] line-clamp-2">{it.title}</div>
                  <div className="text-[11.5px] text-[var(--text-muted)] line-clamp-2">{it.summary}</div>
                  <div className="flex flex-wrap gap-1">
                    {it.tags.slice(0,3).map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-500">#{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex gap-2.5 text-[11px] text-[var(--text-muted)]">
                      <span>♥ {it.likes}</span><span>👁 {it.views}</span>
                    </div>
                    <span className="text-[10.5px] text-[var(--text-muted)]">{it.regDate}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(it => {
            const ti = TYPE_INFO[it.type]
            return (
              <div key={it.id} onClick={() => setDetailId(it.id)}
                className="grid items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors"
                style={{ gridTemplateColumns: it.img ? '64px 40px 1fr auto' : '40px 1fr auto' }}>
                {it.img && (
                  <div className="w-16 h-11 rounded-lg overflow-hidden bg-[var(--bg-muted)]">
                    <img src={it.img} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="text-center text-lg">{ti.emoji}</div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{it.title}</div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">{it.summary}</div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="text-[10.5px] text-[var(--text-muted)]">♥ {it.likes}  👁 {it.views}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{it.regDate}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ 추가/수정 모달 ═══ */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/55 z-[9999] flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl p-6 w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="text-base font-extrabold text-[var(--text-primary)]">{editId ? '콘텐츠 수정' : '콘텐츠 추가'}</div>
              <button onClick={() => setShowModal(false)} className="text-xl text-[var(--text-muted)] cursor-pointer bg-transparent border-none">×</button>
            </div>

            {/* 종류 */}
            <div className="mb-3.5">
              <label className="text-[12px] font-bold text-[var(--text-muted)] block mb-1.5">종류</label>
              <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
                className={inputCls}>
                {Object.entries(TYPE_INFO).map(([k,v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
            </div>

            {/* 제목 */}
            <div className="mb-3.5">
              <label className="text-[12px] font-bold text-[var(--text-muted)] block mb-1.5">제목</label>
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="제목 입력" className={inputCls} />
            </div>

            {/* URL */}
            <div className="mb-3.5">
              <label className="text-[12px] font-bold text-[var(--text-muted)] block mb-1.5">URL</label>
              <input value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))} placeholder="https://..." className={inputCls} />
            </div>

            {/* 이미지 URL */}
            <div className="mb-3.5">
              <label className="text-[12px] font-bold text-[var(--text-muted)] block mb-1.5">이미지 URL</label>
              <input value={form.img} onChange={e => setForm(f => ({...f, img: e.target.value}))} placeholder="이미지 URL을 붙여넣기" className={inputCls} />
              {form.img && (
                <div className="mt-2 relative w-full aspect-video rounded-xl overflow-hidden bg-[var(--bg-muted)]">
                  <img src={form.img} className="w-full h-full object-cover" />
                  <button onClick={() => setForm(f => ({...f, img:''}))}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-sm cursor-pointer flex items-center justify-center border-none">✕</button>
                </div>
              )}
            </div>

            {/* 요약 */}
            <div className="mb-3.5">
              <label className="text-[12px] font-bold text-[var(--text-muted)] block mb-1.5">요약</label>
              <textarea value={form.summary} onChange={e => setForm(f => ({...f, summary: e.target.value}))} rows={3} placeholder="간단한 설명"
                className={`${inputCls} resize-none`} />
            </div>

            {/* 태그 */}
            <div className="mb-3.5">
              <label className="text-[12px] font-bold text-[var(--text-muted)] block mb-1.5">
                태그 <span className="font-normal text-[10.5px]">(Enter로 추가)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 items-center min-h-[40px] p-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-surface)]">
                {form.tags.split(',').filter(Boolean).map((t,i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold bg-blue-500/10 text-blue-500 cursor-pointer"
                    onClick={() => setForm(f => ({...f, tags: f.tags.split(',').filter(x => x !== t).join(',')}))}>
                    {t} <span className="opacity-60">×</span>
                  </span>
                ))}
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addTag() } }}
                  placeholder="태그 입력 후 Enter" className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm text-[var(--text-primary)]" />
              </div>
            </div>

            {/* 좋아요 / 조회수 */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-[12px] font-bold text-[var(--text-muted)] block mb-1.5">♥ 좋아요</label>
                <input type="number" min={0} value={form.likes} onChange={e => setForm(f => ({...f, likes: parseInt(e.target.value)||0}))} className={inputCls} />
              </div>
              <div>
                <label className="text-[12px] font-bold text-[var(--text-muted)] block mb-1.5">👁 조회수</label>
                <input type="number" min={0} value={form.views} onChange={e => setForm(f => ({...f, views: parseInt(e.target.value)||0}))} className={inputCls} />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] text-[13px] font-bold cursor-pointer">취소</button>
              <button onClick={save}
                className="px-6 py-2.5 rounded-lg bg-[#3b82f6] text-white text-[13px] font-bold cursor-pointer border-none hover:bg-[#2563eb] transition-colors">
                {editId ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ═══ 상세보기 모달 ═══ */}
      {detailItem && createPortal(
        <div className="fixed inset-0 bg-black/55 z-[9999] flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setDetailId(null) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* 상단 액션 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TYPE_INFO[detailItem.type]?.emoji}</span>
                  <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg text-white" style={{ background: TYPE_INFO[detailItem.type]?.color }}>
                    {detailItem.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(detailItem.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)] text-[12px] font-bold cursor-pointer">
                    <Edit3 size={13} /> 수정
                  </button>
                  <button onClick={() => deleteItem(detailItem.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300/30 bg-red-500/5 text-red-500 text-[12px] font-bold cursor-pointer">
                    <Trash2 size={13} /> 삭제
                  </button>
                  <button onClick={() => setDetailId(null)}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] text-base cursor-pointer">✕</button>
                </div>
              </div>

              {/* 이미지 */}
              {detailItem.img && (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 bg-[var(--bg-muted)]">
                  <img src={detailItem.img} className="w-full h-full object-cover" />
                </div>
              )}

              {/* 제목 */}
              <div className="text-xl font-extrabold text-[var(--text-primary)] mb-2.5 leading-snug">{detailItem.title}</div>

              {/* 요약 */}
              <div className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed mb-3.5">{detailItem.summary}</div>

              {/* 태그 */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {detailItem.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-xl text-[11.5px] font-bold bg-blue-500/10 text-blue-500">#{t}</span>
                ))}
              </div>

              {/* 정보 테이블 */}
              <div className="border border-[var(--border-default)] rounded-xl overflow-hidden mb-4">
                <table className="w-full text-[13px] border-collapse">
                  <tbody>
                    {[
                      ['종류', `${TYPE_INFO[detailItem.type]?.emoji} ${detailItem.type.toUpperCase()}`],
                      ['등록일', detailItem.regDate],
                      ['URL', detailItem.url],
                      ['조회수', `👁 ${detailItem.views}`],
                      ['좋아요', `♥ ${detailItem.likes}`],
                    ].map(([label, val], i) => (
                      <tr key={i} className="border-b border-[var(--border-default)] last:border-b-0">
                        <td className="px-3.5 py-2.5 font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] w-24">{label}</td>
                        <td className="px-3.5 py-2.5 text-[var(--text-primary)]">
                          {label === 'URL' ? <a href={val as string} target="_blank" rel="noopener" className="text-blue-500 no-underline break-all">{val}</a> : val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 하단 액션 */}
              <div className="flex gap-2.5">
                <a href={detailItem.url} target="_blank" rel="noopener"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#3b82f6] text-white text-[13px] font-bold no-underline">
                  <ExternalLink size={13} /> 원문 보기
                </a>
                <button onClick={() => {
                  const updated = items.map(it => it.id === detailItem.id ? { ...it, likes: it.likes + 1 } : it)
                  persist(updated)
                  setDetailId(detailItem.id) // refresh
                }}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] text-[13px] font-bold cursor-pointer">
                  ♥ 좋아요
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  )
}
