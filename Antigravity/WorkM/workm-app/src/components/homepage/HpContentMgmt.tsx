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

/* ── 샘플 데이터 (카테고리별 8개 = 총 32개) ── */
const SAMPLE: ContentItem[] = [
  { id:'cn01', type:'news', title:'2026 상반기 실적 발표', url:'', summary:'전년 대비 35% 성장한 실적을 기록했습니다.', img:'https://picsum.photos/seed/news1/480/280', tags:['실적','경영'], likes:245, views:8930, regDate:'2026-04-15' },
  { id:'cn02', type:'news', title:'신규 지점 오픈 안내', url:'', summary:'강남 플래그십 스토어가 4월 20일 오픈합니다.', img:'https://picsum.photos/seed/news2/480/280', tags:['오픈','강남'], likes:189, views:6200, regDate:'2026-04-12' },
  { id:'cn03', type:'news', title:'ESG 경영 우수기업 선정', url:'', summary:'환경부 주관 ESG 경영 우수기업에 선정되었습니다.', img:'https://picsum.photos/seed/news3/480/280', tags:['ESG','수상'], likes:156, views:5400, regDate:'2026-04-10' },
  { id:'cn04', type:'news', title:'AI 기반 서비스 도입', url:'', summary:'인공지능 고객 응대 시스템을 전면 도입합니다.', img:'https://picsum.photos/seed/news4/480/280', tags:['AI','혁신'], likes:312, views:11400, regDate:'2026-04-08' },
  { id:'cn05', type:'news', title:'해외 시장 진출 MOU 체결', url:'', summary:'일본 파트너사와 전략적 MOU를 체결했습니다.', img:'https://picsum.photos/seed/news5/480/280', tags:['해외','MOU'], likes:134, views:4200, regDate:'2026-04-05' },
  { id:'cn06', type:'news', title:'직원 복지 정책 개편', url:'', summary:'유연근무제 확대 및 복지포인트를 상향합니다.', img:'https://picsum.photos/seed/news6/480/280', tags:['복지','인사'], likes:98, views:3800, regDate:'2026-04-03' },
  { id:'cn07', type:'news', title:'특허 기술 등록 완료', url:'', summary:'핵심 기술 3건에 대한 국내외 특허를 취득했습니다.', img:'https://picsum.photos/seed/news7/480/280', tags:['특허','기술'], likes:178, views:7650, regDate:'2026-04-01' },
  { id:'cn08', type:'news', title:'고객 만족도 1위 달성', url:'', summary:'업계 최초 3년 연속 고객 만족도 1위를 기록했습니다.', img:'https://picsum.photos/seed/news8/480/280', tags:['고객','만족도'], likes:267, views:9100, regDate:'2026-03-28' },
  { id:'cb01', type:'blog', title:'효과적인 팀 빌딩 방법 5가지', url:'', summary:'팀워크를 극대화하는 실전 노하우를 공유합니다.', img:'https://picsum.photos/seed/blog1/480/280', tags:['팀빌딩','경영'], likes:423, views:15200, regDate:'2026-04-14' },
  { id:'cb02', type:'blog', title:'2026 인테리어 트렌드 분석', url:'', summary:'올해 주목할 인테리어 디자인 트렌드를 분석했습니다.', img:'https://picsum.photos/seed/blog2/480/280', tags:['인테리어','트렌드'], likes:356, views:12800, regDate:'2026-04-11' },
  { id:'cb03', type:'blog', title:'원격 근무 생산성 높이는 팁', url:'', summary:'재택근무 환경에서 집중력을 유지하는 방법입니다.', img:'https://picsum.photos/seed/blog3/480/280', tags:['원격근무','생산성'], likes:234, views:8400, regDate:'2026-04-09' },
  { id:'cb04', type:'blog', title:'브랜딩 전략 수립 가이드', url:'', summary:'중소기업을 위한 실전 브랜딩 가이드입니다.', img:'https://picsum.photos/seed/blog4/480/280', tags:['브랜딩','마케팅'], likes:189, views:6700, regDate:'2026-04-07' },
  { id:'cb05', type:'blog', title:'건강한 사무실 환경 만들기', url:'', summary:'직장인 건강을 위한 사무실 환경 개선 팁입니다.', img:'https://picsum.photos/seed/blog5/480/280', tags:['건강','사무실'], likes:145, views:5300, regDate:'2026-04-04' },
  { id:'cb06', type:'blog', title:'디지털 마케팅 A to Z', url:'', summary:'입문자를 위한 디지털 마케팅 완벽 가이드입니다.', img:'https://picsum.photos/seed/blog6/480/280', tags:['디지털','마케팅'], likes:312, views:11000, regDate:'2026-04-02' },
  { id:'cb07', type:'blog', title:'고객 경험 혁신 사례', url:'', summary:'CX 혁신으로 매출 40%를 성장시킨 사례입니다.', img:'https://picsum.photos/seed/blog7/480/280', tags:['CX','혁신'], likes:278, views:9800, regDate:'2026-03-30' },
  { id:'cb08', type:'blog', title:'스타트업 성장 전략', url:'', summary:'빠르게 성장하는 스타트업의 공통 전략을 분석했습니다.', img:'https://picsum.photos/seed/blog8/480/280', tags:['스타트업','성장'], likes:201, views:7200, regDate:'2026-03-27' },
  { id:'cy01', type:'youtube', title:'회사 소개 영상', url:'https://youtube.com', summary:'우리 회사의 비전과 미션을 소개합니다.', img:'https://picsum.photos/seed/yt1/480/280', tags:['소개','회사'], likes:534, views:18900, regDate:'2026-04-13' },
  { id:'cy02', type:'youtube', title:'워크샵 현장 스케치', url:'https://youtube.com', summary:'2026 봄 워크샵 현장을 담았습니다.', img:'https://picsum.photos/seed/yt2/480/280', tags:['워크샵','현장'], likes:423, views:14500, regDate:'2026-04-10' },
  { id:'cy03', type:'youtube', title:'제품 사용법 튜토리얼', url:'https://youtube.com', summary:'신제품 사용법을 쉽게 알려드립니다.', img:'https://picsum.photos/seed/yt3/480/280', tags:['튜토리얼','제품'], likes:356, views:12300, regDate:'2026-04-08' },
  { id:'cy04', type:'youtube', title:'CEO 인터뷰', url:'https://youtube.com', summary:'대표이사가 말하는 회사의 미래 비전입니다.', img:'https://picsum.photos/seed/yt4/480/280', tags:['인터뷰','CEO'], likes:267, views:9400, regDate:'2026-04-06' },
  { id:'cy05', type:'youtube', title:'고객 후기 인터뷰', url:'https://youtube.com', summary:'실제 고객이 말하는 서비스 경험담입니다.', img:'https://picsum.photos/seed/yt5/480/280', tags:['고객후기'], likes:198, views:7100, regDate:'2026-04-03' },
  { id:'cy06', type:'youtube', title:'직원 일상 VLOG', url:'https://youtube.com', summary:'우리 직원들의 하루를 공개합니다.', img:'https://picsum.photos/seed/yt6/480/280', tags:['VLOG','직원'], likes:445, views:16200, regDate:'2026-04-01' },
  { id:'cy07', type:'youtube', title:'서비스 업데이트 소식', url:'https://youtube.com', summary:'3월 주요 업데이트 내용을 정리했습니다.', img:'https://picsum.photos/seed/yt7/480/280', tags:['업데이트'], likes:167, views:5800, regDate:'2026-03-29' },
  { id:'cy08', type:'youtube', title:'업계 트렌드 리뷰', url:'https://youtube.com', summary:'2026년 업계 트렌드를 영상으로 분석합니다.', img:'https://picsum.photos/seed/yt8/480/280', tags:['트렌드','리뷰'], likes:289, views:10500, regDate:'2026-03-26' },
  { id:'cw01', type:'website', title:'공식 홈페이지 리뉴얼', url:'https://example.com', summary:'새롭게 단장한 공식 홈페이지를 소개합니다.', img:'https://picsum.photos/seed/web1/480/280', tags:['홈페이지','리뉴얼'], likes:312, views:11400, regDate:'2026-04-14' },
  { id:'cw02', type:'website', title:'온라인 쇼핑몰 오픈', url:'https://example.com', summary:'공식 온라인 스토어가 오픈했습니다.', img:'https://picsum.photos/seed/web2/480/280', tags:['쇼핑몰','오픈'], likes:245, views:8900, regDate:'2026-04-11' },
  { id:'cw03', type:'website', title:'파트너 포털 안내', url:'https://example.com', summary:'협력사 전용 파트너 포털을 안내합니다.', img:'https://picsum.photos/seed/web3/480/280', tags:['파트너','포털'], likes:156, views:5600, regDate:'2026-04-09' },
  { id:'cw04', type:'website', title:'채용 페이지 업데이트', url:'https://example.com', summary:'2026년 하반기 채용 정보를 업데이트했습니다.', img:'https://picsum.photos/seed/web4/480/280', tags:['채용','커리어'], likes:198, views:7200, regDate:'2026-04-07' },
  { id:'cw05', type:'website', title:'고객 지원 센터', url:'https://example.com', summary:'FAQ와 1:1 문의를 이용할 수 있습니다.', img:'https://picsum.photos/seed/web5/480/280', tags:['고객지원','FAQ'], likes:134, views:4800, regDate:'2026-04-04' },
  { id:'cw06', type:'website', title:'IR 정보 페이지', url:'https://example.com', summary:'투자자를 위한 IR 자료를 공개합니다.', img:'https://picsum.photos/seed/web6/480/280', tags:['IR','투자'], likes:89, views:3200, regDate:'2026-04-02' },
  { id:'cw07', type:'website', title:'지속가능경영 보고서', url:'https://example.com', summary:'2025 지속가능경영 보고서를 발간했습니다.', img:'https://picsum.photos/seed/web7/480/280', tags:['ESG','보고서'], likes:167, views:6100, regDate:'2026-03-30' },
  { id:'cw08', type:'website', title:'이벤트 랜딩 페이지', url:'https://example.com', summary:'봄맞이 특별 이벤트 페이지를 오픈했습니다.', img:'https://picsum.photos/seed/web8/480/280', tags:['이벤트','프로모션'], likes:378, views:13500, regDate:'2026-03-27' },
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
