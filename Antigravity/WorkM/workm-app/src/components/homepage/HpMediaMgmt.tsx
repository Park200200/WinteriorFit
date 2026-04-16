import { useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../utils/storage'
import {
  Plus, X, Trash2, Film, Search, LayoutGrid, List, Upload, UploadCloud,
  Image as ImageIcon, Video, LayoutDashboard, Heart, Eye,
  Grid3X3, AlignJustify, LayoutPanelTop, Columns3,
} from 'lucide-react'

/* ── 타입 ── */
interface MediaItem {
  id: string; mediaType: 'image'|'video'; title: string
  tags: string[]; desc: string; dataUrl: string; regDate: string
  likes?: number; views?: number
}

const STORAGE_KEY = 'med_items'

const SAMPLE: MediaItem[] = [
  { id:'ms01', mediaType:'image', title:'오로라 일몰', tags:['자연','풍경'], desc:'녹아내리는 오로라의 풍경.', dataUrl:'https://picsum.photos/seed/aurora1/1200/800', regDate:'2026-04-01' },
  { id:'ms02', mediaType:'image', title:'커피 한 잔', tags:['카페','일상'], desc:'스팀 아트가 담긴 라떼.', dataUrl:'https://picsum.photos/seed/coffee2/800/1200', regDate:'2026-04-01' },
  { id:'ms03', mediaType:'image', title:'도시의 야경', tags:['도시','야경'], desc:'서울 스카이라인 드론 사진.', dataUrl:'https://picsum.photos/seed/city3/1200/900', regDate:'2026-04-01' },
  { id:'ms04', mediaType:'image', title:'핑크 플라워', tags:['플라워','미니멀'], desc:'파스텔 톤의 플라워 디테일.', dataUrl:'https://picsum.photos/seed/flower4/600/600', regDate:'2026-03-30' },
  { id:'ms05', mediaType:'image', title:'에메랄드 호수', tags:['자연','호수'], desc:'에메랄드빛 호수 풍경.', dataUrl:'https://picsum.photos/seed/lake5/900/600', regDate:'2026-03-30' },
  { id:'ms06', mediaType:'image', title:'산업 공장 뷰', tags:['인더스트리얼'], desc:'공장 내부 시네마틱 라이트.', dataUrl:'https://picsum.photos/seed/factory6/1200/800', regDate:'2026-03-29' },
  { id:'ms07', mediaType:'image', title:'패션 포트레잇', tags:['패션','시즌'], desc:'시즌 컬렉션 포트레잇.', dataUrl:'https://picsum.photos/seed/fashion7/800/1100', regDate:'2026-03-28' },
  { id:'ms08', mediaType:'image', title:'은하수 하늘', tags:['우주','밤하늘'], desc:'은하수를 잡은 장노출 사진.', dataUrl:'https://picsum.photos/seed/space8/900/900', regDate:'2026-03-28' },
  { id:'ms09', mediaType:'image', title:'전통 한옥', tags:['한옥','전통'], desc:'기와 지붕의 전통 건축.', dataUrl:'https://picsum.photos/seed/hanok9/600/900', regDate:'2026-03-27' },
  { id:'ms10', mediaType:'image', title:'숲의 고요함', tags:['숲','하이킹'], desc:'빛과 그림자의 숲 풍경.', dataUrl:'https://picsum.photos/seed/forest10/1200/800', regDate:'2026-03-27' },
  { id:'ms11', mediaType:'image', title:'미니멀 인테리어', tags:['인테리어','사무실'], desc:'미니멀 사무실 인테리어.', dataUrl:'https://picsum.photos/seed/minimal11/900/600', regDate:'2026-03-26' },
  { id:'ms12', mediaType:'image', title:'황금 수확', tags:['농촌','가을'], desc:'풍성한 수확의 순간.', dataUrl:'https://picsum.photos/seed/harvest12/800/1200', regDate:'2026-03-25' },
]

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors'

export function HpMediaMgmt() {
  const [items, setItems] = useState<MediaItem[]>(() => getItem<MediaItem[]>(STORAGE_KEY, null) || SAMPLE)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'masonry'|'bento'|'grid'|'list'>('masonry')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [form, setForm] = useState({ title:'', desc:'', dataUrl:'', tags:'' as string, likes:'0', views:'0' })
  const [tagInput, setTagInput] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const persist = useCallback((list: MediaItem[]) => { setItems(list); setItem(STORAGE_KEY, list) }, [])

  const filtered = useMemo(() => {
    let list = items
    if (filter !== 'all') list = list.filter(it => it.mediaType === filter)
    if (search) { const kw = search.toLowerCase(); list = list.filter(it => (it.title + ' ' + it.tags.join(' ') + ' ' + it.desc).toLowerCase().includes(kw)) }
    return list.sort((a,b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime())
  }, [items, filter, search])

  const openAdd = () => { setEditId(null); setForm({ title:'', desc:'', dataUrl:'', tags:'', likes:'0', views:'0' }); setTagInput(''); setShowModal(true) }
  const openEdit = (id: string) => {
    const it = items.find(x => x.id === id)
    if (!it) return
    setEditId(id)
    setForm({ title:it.title, desc:it.desc, dataUrl:it.dataUrl, tags:it.tags.join(','), likes:String(it.likes||0), views:String(it.views||0) })
    setTagInput(''); setShowModal(true)
  }
  const save = () => {
    if (!form.title.trim()) { alert('제목을 입력하세요'); return }
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const mediaType = form.dataUrl.match(/\.(mp4|mov|webm|avi)/i) ? 'video' as const : 'image' as const
    if (editId) {
      persist(items.map(it => it.id === editId ? { ...it, title:form.title, desc:form.desc, dataUrl:form.dataUrl, tags, mediaType, likes:parseInt(form.likes)||0, views:parseInt(form.views)||0 } : it))
    } else {
      const newItem: MediaItem = { id:'m'+Date.now(), mediaType, title:form.title, desc:form.desc, dataUrl:form.dataUrl, tags, regDate:new Date().toISOString().slice(0,10), likes:parseInt(form.likes)||0, views:parseInt(form.views)||0 }
      persist([newItem, ...items])
    }
    setShowModal(false)
  }
  const deleteItem = (id: string) => { if (!confirm('삭제하시겠습니까?')) return; persist(items.filter(x => x.id !== id)) }
  const addTag = () => { const t = tagInput.trim(); if (!t) return; const exist = form.tags ? form.tags.split(',').filter(Boolean) : []; if (!exist.includes(t)) setForm(f => ({...f, tags:[...exist,t].join(',')})); setTagInput('') }

  /* 파일 업로드 핸들러 */
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setForm(f => ({ ...f, dataUrl: result, title: f.title || file.name.replace(/\.[^.]+$/, '') }))
    }
    reader.readAsDataURL(file)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="animate-fadeIn">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
            <Film size={18} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-[var(--text-primary)]">미디어자료 관리</div>
            <div className="text-[11.5px] text-[var(--text-muted)]">이미지 · 동영상 통합 관리</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[var(--border-default)] rounded-lg overflow-hidden">
            {([{k:'masonry' as const, icon:Columns3, tip:'메이슨리'},{k:'bento' as const, icon:LayoutPanelTop, tip:'벤토'},{k:'grid' as const, icon:Grid3X3, tip:'그리드'},{k:'list' as const, icon:AlignJustify, tip:'리스트'}]).map(m => (
              <button key={m.k} onClick={() => setViewMode(m.k)} title={m.tip} className="p-2 border-none cursor-pointer transition-colors"
                style={{ background: viewMode === m.k ? '#3b82f6' : 'transparent', color: viewMode === m.k ? '#fff' : 'var(--text-muted)' }}>
                <m.icon size={14}/>
              </button>
            ))}
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3b82f6] text-white text-[13px] font-bold cursor-pointer border-none">
            <Plus size={14}/> 미디어 추가
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-[400px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목, 태그 검색..." className={`${inputCls} !pl-9`} />
        </div>
        <div className="flex gap-1.5">
          {[{k:'all',l:'전체'},{k:'image',l:'🖼 이미지'},{k:'video',l:'🎬 동영상'}].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className="px-3.5 py-1.5 rounded-full text-[11.5px] font-bold cursor-pointer transition-all border-none"
              style={{ background:filter===f.k?'#3b82f6':'transparent', border:`1.5px solid ${filter===f.k?'#3b82f6':'var(--border-default)'}`, color:filter===f.k?'#fff':'var(--text-secondary)' }}>
              {f.l}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-[var(--text-muted)] ml-auto">총 {filtered.length}건</span>
      </div>

      {/* 그리드/리스트 */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-[var(--text-muted)]">
          <div className="text-5xl mb-3">🖼</div>
          <div className="text-sm font-bold">등록된 미디어가 없습니다</div>
        </div>
      ) : viewMode === 'masonry' ? (
        /* 메이슨리: 2컴럼 자연 높이 */
        <div className="gap-3" style={{ columns:'2 280px', columnGap:'12px' }}>
          {filtered.map(it => (
            <div key={it.id} onClick={() => openEdit(it.id)} className="mb-3 break-inside-avoid rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
              <div className="w-full overflow-hidden bg-[var(--bg-muted)] relative">
                <img src={it.dataUrl} alt="" className="w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                <button onClick={(e) => { e.stopPropagation(); deleteItem(it.id) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer border-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={12}/>
                </button>
                {it.mediaType === 'video' && <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">▶</div>}
              </div>
              <div className="p-3">
                <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{it.title}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{it.desc}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {it.tags.slice(0,3).map(t => <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-500">#{t}</span>)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">{it.regDate}</div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'bento' ? (
        /* 벤토: sizeHint 기반 다양한 크기 */
        <div className="grid gap-3" style={{ gridTemplateColumns:'repeat(4,1fr)', gridAutoRows:'160px' }}>
          {filtered.map((it, idx) => {
            const spans = [{ col:'span 2', row:'span 2' },{ col:'span 1', row:'span 1' },{ col:'span 1', row:'span 2' },{ col:'span 2', row:'span 1' },{ col:'span 1', row:'span 1' }]
            const s = spans[idx % spans.length]
            return (
              <div key={it.id} onClick={() => openEdit(it.id)}
                className="rounded-xl overflow-hidden relative group cursor-pointer transition-all hover:shadow-lg"
                style={{ gridColumn:s.col, gridRow:s.row }}>
                <img src={it.dataUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3">
                  <div className="text-[13px] font-bold text-white truncate">{it.title}</div>
                  <div className="flex gap-1 mt-1">
                    {it.tags.slice(0,2).map(t => <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 text-white">#{t}</span>)}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteItem(it.id) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer border-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={12}/>
                </button>
                {it.mediaType === 'video' && <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">▶</div>}
              </div>
            )
          })}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))' }}>
          {filtered.map(it => (
            <div key={it.id} onClick={() => openEdit(it.id)} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
              <div className="w-full aspect-square overflow-hidden bg-[var(--bg-muted)] relative">
                <img src={it.dataUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                <button onClick={(e) => { e.stopPropagation(); deleteItem(it.id) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer border-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={12}/>
                </button>
                {it.mediaType === 'video' && <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">▶</div>}
              </div>
              <div className="p-3">
                <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{it.title}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{it.desc}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {it.tags.slice(0,3).map(t => <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-500">#{t}</span>)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">{it.regDate}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(it => (
            <div key={it.id} onClick={() => openEdit(it.id)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--bg-muted)] shrink-0">
                <img src={it.dataUrl} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{it.title}</div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">{it.desc}</div>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">{it.regDate}</div>
              <button onClick={(e) => { e.stopPropagation(); deleteItem(it.id) }}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 cursor-pointer border-none hover:bg-red-500/20"><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      )}

      {/* 추가 모달 - 레거시 UI 일치 */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/55 z-[3000] flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl w-[560px] max-w-[96vw] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] shrink-0">
              <div className="flex items-center gap-2 text-base font-extrabold text-[var(--text-primary)]"><Upload size={18} className="text-blue-500"/> {editId ? '미디어 수정' : '미디어 추가'}</div>
              <button onClick={() => setShowModal(false)} className="w-[30px] h-[30px] rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer border-none text-[15px]">×</button>
            </div>
            {/* 본문 */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* 미디어 파일 업로드 */}
              <div>
                <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">미디어 파일 *</div>
                <div
                  onClick={() => document.getElementById('med-file-input')?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className="w-full min-h-[110px] flex flex-col items-center justify-center gap-1.5 cursor-pointer rounded-[14px] p-5 transition-colors"
                  style={{
                    border: `2px dashed ${dragOver ? '#3b82f6' : 'var(--border-default)'}`,
                    background: dragOver ? 'rgba(59,130,246,.06)' : 'var(--bg-muted)',
                  }}
                >
                  <UploadCloud size={30} className="text-[var(--text-muted)]" />
                  <div className="text-[13px] font-bold text-[var(--text-secondary)]">클릭 또는 드래그&드롭</div>
                  <div className="text-[11px] text-[var(--text-muted)] text-center">이미지(JPG·PNG·GIF·WebP) · 동영상(MP4·MOV·WebM) · <strong>여러 파일 동시 선택 가능</strong></div>
                </div>
                <input type="file" id="med-file-input" accept="image/*,video/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
                {form.dataUrl && (
                  <div className="mt-3 relative w-full aspect-video rounded-xl overflow-hidden bg-[var(--bg-muted)]">
                    <img src={form.dataUrl} className="w-full h-full object-cover" />
                    <button onClick={() => setForm(f => ({...f, dataUrl:''}))} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer border-none"><X size={12}/></button>
                  </div>
                )}
              </div>
              {/* 제목 */}
              <div>
                <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">제목 *</div>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="파일 제목을 입력하세요" className={inputCls} />
              </div>
              {/* 검색 태그 */}
              <div>
                <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">검색 태그 <span className="font-normal normal-case text-[10.5px]">(Enter 또는 Space로 추가 · 태그 클릭 시 수정)</span></div>
                <div onClick={() => document.getElementById('med-tag-inp')?.focus()}
                  className="flex flex-wrap gap-1.5 items-center min-h-[42px] px-2.5 py-1.5 border border-[var(--border-default)] rounded-[10px] bg-[var(--bg-muted)] cursor-text">
                  {form.tags.split(',').filter(Boolean).map((t,i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-500 cursor-pointer"
                      onClick={e => { e.stopPropagation(); setForm(f => ({...f, tags: f.tags.split(',').filter(x => x !== t).join(',')})) }}>{t} <span className="opacity-50">×</span></span>
                  ))}
                  <input id="med-tag-inp" value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); addTag() } }}
                    onBlur={addTag}
                    placeholder="태그 입력 후 Enter 또는 Space"
                    className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-[13px] text-[var(--text-primary)] px-1" />
                </div>
              </div>
              {/* 설명 */}
              <div>
                <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">설명</div>
                <textarea value={form.desc} onChange={e => setForm(f => ({...f, desc: e.target.value}))} rows={3} placeholder="파일에 대한 설명을 입력하세요" className={`${inputCls} resize-vertical`} />
              </div>
              {/* 좋아요 / 조회수 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1"><Heart size={11} className="text-red-400"/> 좋아요</div>
                  <input type="number" min="0" value={form.likes} onChange={e => setForm(f => ({...f, likes: e.target.value}))} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1"><Eye size={11}/> 조회수</div>
                  <input type="number" min="0" value={form.views} onChange={e => setForm(f => ({...f, views: e.target.value}))} placeholder="0" className={inputCls} />
                </div>
              </div>
            </div>
            {/* 푸터 */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-[var(--border-default)] shrink-0">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-[10px] border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] text-[13px] font-semibold cursor-pointer">취소</button>
              <button onClick={save} className="px-6 py-2.5 rounded-[10px] text-white text-[13px] font-bold cursor-pointer border-none" style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>저장</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
