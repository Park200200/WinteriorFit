import { useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../utils/storage'
import {
  Plus, X, Save, Trash2, Edit3, ClipboardList, Eye, User, Calendar,
  MessageSquare,
} from 'lucide-react'

/* ── 타입 ── */
interface Reply { author: string; content: string; date: string }
interface BoardItem {
  id: string; cat: string; title: string; content: string
  author: string; regDate: string; views: number
  replies?: Reply[]
  // 공통 옵션
  img?: string; imgCap?: string; pwd?: string; featured?: boolean
  // FAQ 전용
  ans?: string; ansImg?: string; ansImgCap?: string

}

const STORAGE_KEY = 'board_items'

const CAT_MAP: Record<string,string> = {
  all:'전체', notice:'📢 공지사항', news:'📰 뉴스', free:'💬 자유게시판',
  qna:'❓ Q&A', faq:'📋 FAQ'
}
const CAT_COLOR: Record<string,string> = {
  notice:'#ef4444', news:'#4f6ef7', free:'#f59e0b', qna:'#8b5cf6', faq:'#06b6d4'
}
const CAT_KEYS = Object.keys(CAT_MAP).filter(k => k !== 'all')

/* ── 샘플 데이터 ── */
const SAMPLE: BoardItem[] = [
  { id:'b1', cat:'notice', title:'2026년 봄 신제품 출시 안내', content:'2026 봄 시즌 블라인드 및 커튼 전 라인업이 새롭게 출시됩니다. 자세한 사항은 홈페이지에서 확인하세요.', author:'관리자', regDate:'2026-04-10', views:512 },
  { id:'b2', cat:'notice', title:'고객센터 운영시간 변경 안내', content:'4월부터 고객센터 운영시간이 09:00~18:00으로 변경됩니다.', author:'관리자', regDate:'2026-04-08', views:328 },
  { id:'b3', cat:'notice', title:'시스템 점검 안내 (4/15)', content:'4월 15일 02:00~06:00 서버 정기점검이 예정되어 있습니다.', author:'관리자', regDate:'2026-04-06', views:245 },
  { id:'b4', cat:'news', title:'윈테리어핏, 2026 서울 리빙페어 참가', content:'2026 서울 리빙디자인페어에 참가하여 신제품을 선보입니다.', author:'언론팀', regDate:'2026-04-09', views:423 },
  { id:'b5', cat:'news', title:'친환경 원단 인증 획득', content:'당사 커튼 원단이 KC 친환경 인증을 획득하였습니다.', author:'언론팀', regDate:'2026-04-05', views:387 },
  { id:'b6', cat:'free', title:'거실 블라인드 추천 부탁드려요', content:'25평대 아파트 거실에 어울리는 블라인드 추천 부탁드립니다.', author:'행복한집', regDate:'2026-04-07', views:156 },
  { id:'b7', cat:'free', title:'시공 후기 공유합니다', content:'지난주 시공 받았는데 정말 만족합니다. 친절한 설치기사님 감사해요!', author:'인테리어러', regDate:'2026-04-04', views:234 },
  { id:'b8', cat:'qna', title:'블라인드 설치 높이는 어떻게 측정하나요?', content:'창문 안쪽 높이를 기준으로 측정하시면 됩니다.', author:'고객센터', regDate:'2026-04-04', views:412, replies:[{author:'관리자', content:'창프레임 내부 상단에서 하단까지 측정하시면 됩니다.', date:'2026-04-05'}] },
  { id:'b9', cat:'qna', title:'A/S 신청은 어디서 하나요?', content:'홈페이지 문의하기 또는 고객센터 전화(010-6381-2233)로 가능합니다.', author:'고객센터', regDate:'2026-04-02', views:387 },
  { id:'b10', cat:'faq', title:'방문 견적은 무료인가요?', content:'네, 방문 견적은 완전 무료입니다.', author:'관리자', regDate:'2026-01-10', views:892 },
  { id:'b11', cat:'faq', title:'설치까지 걸리는 기간은?', content:'견적 확정 후 통상 3~7 영업일 이내에 설치 완료됩니다.', author:'관리자', regDate:'2026-01-10', views:754 },

]

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors'

/* ══════════════════════════════════════ */
export function HpBoardMgmt() {
  const [items, setItems] = useState<BoardItem[]>(() => getItem<BoardItem[]>(STORAGE_KEY, null) || SAMPLE)
  const [cat, setCat] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [detailId, setDetailId] = useState<string|null>(null)

  /* 폼 상태 */
  const [form, setForm] = useState({
    cat:'notice', title:'', content:'', author:'관리자',
    img:'', imgCap:'', pwd:'', featured:false,
    ans:'', ansImg:'', ansImgCap:'',
  })
  const [replyInput, setReplyInput] = useState('')

  const persist = useCallback((list: BoardItem[]) => { setItems(list); setItem(STORAGE_KEY, list) }, [])

  /* 필터 */
  const filtered = useMemo(() => {
    let list = items
    if (cat !== 'all') list = list.filter(i => i.cat === cat)
    return list.sort((a,b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime())
  }, [items, cat])

  /* 모달 열기 */
  const openAdd = () => {
    setEditId(null)
    setForm({ cat: cat !== 'all' ? cat : 'notice', title:'', content:'', author:'관리자', img:'', imgCap:'', pwd:'', featured:false, ans:'', ansImg:'', ansImgCap:'', views:'0' })
    setShowModal(true)
  }
  const openEdit = (id: string) => {
    const it = items.find(x => x.id === id)
    if (!it) return
    setEditId(id)
    setForm({ cat:it.cat, title:it.title, content:it.content, author:it.author, img:it.img||'', imgCap:it.imgCap||'', pwd:it.pwd||'', featured:!!it.featured, ans:it.ans||'', ansImg:it.ansImg||'', ansImgCap:it.ansImgCap||'', views:String(it.views||0) })
    setDetailId(null)
    setShowModal(true)
  }

  /* 저장 */
  const save = () => {
    const fc = form.cat
    if (!form.title.trim()) { alert('제목을 입력하세요'); return }
    const now = new Date().toISOString().slice(0,10)
    const base: any = { ...form }
    // FAQ: 작성자 = 관리자
    if (fc === 'faq') base.author = '관리자'
    if (editId) {
      persist(items.map(it => it.id === editId ? { ...it, ...base, views: parseInt(form.views)||0 } : it))
    } else {
      const newItem: BoardItem = { id:'b'+Date.now(), ...base, regDate:now, views:0, replies:[] }
      persist([newItem, ...items])
    }
    setShowModal(false)
  }

  /* 삭제 */
  const deleteItem = (id: string) => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return
    persist(items.filter(x => x.id !== id))
    setDetailId(null)
  }

  /* 답변 추가 (Q&A) */
  const addReply = (id: string) => {
    if (!replyInput.trim()) return
    const now = new Date().toISOString().slice(0,10)
    persist(items.map(it => {
      if (it.id !== id) return it
      return { ...it, replies: [...(it.replies||[]), { author:'관리자', content:replyInput.trim(), date:now }] }
    }))
    setReplyInput('')
  }

  /* 답변 삭제 */
  const deleteReply = (itemId: string, replyIdx: number) => {
    persist(items.map(it => {
      if (it.id !== itemId) return it
      return { ...it, replies: (it.replies||[]).filter((_,i) => i !== replyIdx) }
    }))
  }



  const detailItem = detailId ? items.find(x => x.id === detailId) : null

  return (
    <div className="animate-fadeIn">
      {/* ═══ 헤더 ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>
            <ClipboardList size={18} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-[var(--text-primary)]">게시판 관리</div>
            <div className="text-[11.5px] text-[var(--text-muted)]">공지사항 · 뉴스 · 자유게시판 · Q&A · FAQ 관리</div>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold cursor-pointer border-none transition-colors"
          style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>
          <Plus size={14} /> 게시글 작성
        </button>
      </div>

      {/* ═══ 카테고리 탭 ═══ */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4 pb-3.5 border-b border-[var(--border-default)]">
        <div className="flex gap-1.5 flex-1 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
          {Object.entries(CAT_MAP).map(([k,label]) => (
            <button key={k} onClick={() => setCat(k)}
              className="px-4 py-1.5 rounded-full text-[12px] font-bold cursor-pointer transition-all whitespace-nowrap shrink-0 border-none"
              style={{
                background: cat === k ? '#22c55e' : 'transparent',
                border: `1.5px solid ${cat === k ? '#22c55e' : 'var(--border-default)'}`,
                color: cat === k ? '#fff' : 'var(--text-secondary)',
              }}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-[var(--text-muted)] whitespace-nowrap shrink-0">총 {filtered.length}건</span>
      </div>

      {/* ═══ 게시글 목록 테이블 ═══ */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-[var(--text-muted)]">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-sm font-bold">등록된 게시글이 없습니다</div>
        </div>
      ) : (
        <div className="border border-[var(--border-default)] rounded-xl overflow-hidden">
          <table className="w-full border-collapse" style={{ tableLayout:'fixed' }}>
            <thead>
              <tr className="border-b-2 border-[var(--border-default)]">
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-[var(--text-muted)] w-24">카테고리</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-[var(--text-muted)]">제목</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)] w-[70px]">작성자</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)] w-[90px]">날짜</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)] w-[60px]">조회</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id} onClick={() => setDetailId(it.id)}
                  className="border-b border-[var(--border-default)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white" style={{ background: CAT_COLOR[it.cat]||'#888' }}>
                      {(CAT_MAP[it.cat]||it.cat).replace(/^[^\s]+ /, '')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-bold text-[var(--text-primary)] truncate">
                    {it.title}
                    {it.cat === 'qna' && (it.replies?.length || 0) > 0 && (
                      <span className="ml-1.5 text-[10px] font-bold text-[#8b5cf6]">[답변 {it.replies!.length}]</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-[12px] text-[var(--text-muted)]">{it.author}</td>
                  <td className="px-3 py-2.5 text-center text-[11px] text-[var(--text-muted)]">{it.regDate}</td>
                  <td className="px-3 py-2.5 text-center text-[11px] text-[var(--text-muted)]">{it.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 작성/수정 모달 ═══ */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/55 z-[3000] flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl w-[560px] max-w-[96vw] max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 */}
            <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="text-base font-extrabold text-[var(--text-primary)]">
                {editId
                  ? `편집: ${(CAT_MAP[form.cat]||'').replace(/^[^\s]+ /,'')}`
                  : ({notice:'📢 공지사항 작성', news:'📰 뉴스 작성', free:'💬 자유게시판 작성', qna:'❓ Q&A 작성', faq:'📋 FAQ 등록'} as any)[form.cat] || '게시글 작성'
                }
              </div>
              <button onClick={() => setShowModal(false)} className="text-xl text-[var(--text-muted)] cursor-pointer bg-transparent border-none">×</button>
            </div>
            {/* 카테고리 */}
            <div className="px-5 py-3 border-b border-[var(--border-default)]">
              <select value={form.cat} onChange={e => setForm(f => ({...f, cat: e.target.value}))} disabled={!!editId} className={inputCls}>
                {CAT_KEYS.map(k => <option key={k} value={k}>{CAT_MAP[k]}</option>)}
              </select>
            </div>
            {/* ═══ 카테고리별 필드 ═══ */}
            <div className="overflow-y-auto flex-1 p-5 space-y-3">

              {/* ── 공지/뉴스/자유/Q&A ── */}
              {['notice','news','free','qna'].includes(form.cat) && (
                <>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">작성자</label>
                    <input value={form.author} onChange={e => setForm(f => ({...f, author: e.target.value}))} placeholder="이름 또는 닉네임" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">제목</label>
                    <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="제목을 입력하세요" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">내용</label>
                    <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} rows={5} placeholder="내용을 입력하세요..." className={`${inputCls} resize-vertical`} />
                  </div>
                  {/* Q&A 제외: 사진/비밀번호/상단노출 */}
                  {form.cat !== 'qna' && (
                    <>
                      <div>
                        <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">사진 첨부 <span className="font-normal">(선택)</span></label>
                        <input value={form.img} onChange={e => setForm(f => ({...f, img: e.target.value}))} placeholder="이미지 URL 또는 파일 선택" className={inputCls} />
                        <input value={form.imgCap} onChange={e => setForm(f => ({...f, imgCap: e.target.value}))} placeholder="사진 아래 설명 텍스트" className={`${inputCls} mt-1.5`} />
                      </div>
                      <div>
                        <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">비밀번호</label>
                        <input type="password" value={form.pwd} onChange={e => setForm(f => ({...f, pwd: e.target.value}))} placeholder="삭제 시 사용할 비밀번호" className={inputCls} />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[var(--text-secondary)] font-bold select-none">
                        <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({...f, featured: e.target.checked}))} className="w-4 h-4 cursor-pointer" style={{ accentColor:'#22c55e' }} />
                        상단 노출 (공지 상단에 고정)
                      </label>
                    </>
                  )}
                </>
              )}

              {/* ── FAQ ── */}
              {form.cat === 'faq' && (
                <>
                  <div className="text-[12px] font-bold text-[#4f6ef7] pb-2 border-b-2 border-[#4f6ef720] mb-1">Q (질문)</div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">질문 제목</label>
                    <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="자주 묻는 질문 제목" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">질문 내용</label>
                    <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} rows={3} placeholder="질문 내용을 입력하세요..." className={`${inputCls} resize-vertical`} />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">Q 사진 <span className="font-normal">(선택)</span></label>
                    <input value={form.img} onChange={e => setForm(f => ({...f, img: e.target.value}))} placeholder="이미지 URL 또는 파일 선택" className={inputCls} />
                    <input value={form.imgCap} onChange={e => setForm(f => ({...f, imgCap: e.target.value}))} placeholder="사진 아래 설명 텍스트" className={`${inputCls} mt-1.5`} />
                  </div>
                  <div className="text-[12px] font-bold text-[#22c55e] pt-2 pb-2 border-b-2 border-[#22c55e20] mb-1">A (답변)</div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">답변 내용</label>
                    <textarea value={form.ans} onChange={e => setForm(f => ({...f, ans: e.target.value}))} rows={3} placeholder="답변 내용을 입력하세요..." className={`${inputCls} resize-vertical`} />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">A 사진 <span className="font-normal">(선택)</span></label>
                    <input value={form.ansImg} onChange={e => setForm(f => ({...f, ansImg: e.target.value}))} placeholder="이미지 URL 또는 파일 선택" className={inputCls} />
                    <input value={form.ansImgCap} onChange={e => setForm(f => ({...f, ansImgCap: e.target.value}))} placeholder="사진 아래 설명 텍스트" className={`${inputCls} mt-1.5`} />
                  </div>
                </>
              )}



              {/* ── 조회수 (수정 시) ── */}
              {editId && (
                <div>
                  <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1 flex items-center gap-1"><Eye size={12}/> 조회수</label>
                  <input type="number" min="0" value={form.views} onChange={e => setForm(f => ({...f, views: e.target.value}))} placeholder="0" className={inputCls} />
                </div>
              )}
            </div>
            {/* 버튼 */}
            <div className="px-5 py-4 border-t border-[var(--border-default)] flex justify-end gap-2.5">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] text-[13px] font-bold cursor-pointer">취소</button>
              <button onClick={save}
                className="px-6 py-2.5 rounded-lg text-white text-[13px] font-bold cursor-pointer border-none"
                style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                {editId ? '저장' : '등록'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ 상세보기 모달 ═══ */}
      {detailItem && createPortal(
        <div className="fixed inset-0 bg-black/55 z-[3000] flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setDetailId(null) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl w-[660px] max-w-[95vw] max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 */}
            <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-start gap-3.5">
              <div className="flex-1 min-w-0">
                <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white mb-2" style={{ background: CAT_COLOR[detailItem.cat]||'#888' }}>
                  {CAT_MAP[detailItem.cat]}
                </span>
                <div className="text-lg font-extrabold text-[var(--text-primary)] leading-snug break-words">{detailItem.title}</div>
              </div>
              <button onClick={() => setDetailId(null)} className="text-xl text-[var(--text-muted)] cursor-pointer bg-transparent border-none shrink-0">×</button>
            </div>
            {/* 메타 */}
            <div className="px-6 py-3 border-b border-[var(--border-default)] flex gap-5 flex-wrap">
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]"><User size={13}/> {detailItem.author}</div>
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]"><Calendar size={13}/> {detailItem.regDate}</div>
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]"><Eye size={13}/> 조회 {detailItem.views}</div>
              <div className="flex items-center gap-1.5 ml-auto">
                <button onClick={() => openEdit(detailItem.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)] text-[12px] font-bold cursor-pointer"><Edit3 size={12}/> 수정</button>
                <button onClick={() => deleteItem(detailItem.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300/30 bg-red-500/5 text-red-500 text-[12px] font-bold cursor-pointer"><Trash2 size={12}/> 삭제</button>
              </div>
            </div>
            {/* 본문 */}
            <div className="overflow-y-auto flex-1 flex flex-col">
              <div className="p-6">
                <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap min-h-[100px]">{detailItem.content}</div>
              </div>



              {/* Q&A 답변 섹션 */}
              {detailItem.cat === 'qna' && (
                <div className="border-t-2 border-[var(--border-default)] bg-[var(--bg-muted)] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={15} className="text-[#8b5cf6]" />
                    <span className="text-[13px] font-extrabold text-[var(--text-primary)]">관리자 답변</span>
                    <span className="text-[11px] font-bold bg-[#8b5cf620] text-[#8b5cf6] px-2 py-0.5 rounded-full">{detailItem.replies?.length||0}</span>
                  </div>
                  {/* 기존 답변 목록 */}
                  <div className="space-y-2.5 mb-4">
                    {(detailItem.replies||[]).map((r,ri) => (
                      <div key={ri} className="bg-[var(--bg-surface)] rounded-xl p-3.5 border border-[var(--border-default)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#8b5cf6]">{r.author}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">{r.date}</span>
                          </div>
                          <button onClick={() => deleteReply(detailItem.id, ri)}
                            className="text-[var(--text-muted)] cursor-pointer bg-transparent border-none hover:text-red-500"><X size={13}/></button>
                        </div>
                        <div className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">{r.content}</div>
                      </div>
                    ))}
                  </div>
                  {/* 새 답변 입력 */}
                  <div className="border-t-2 border-[#8b5cf630] pt-3.5">
                    <div className="text-[11px] font-extrabold text-[#8b5cf6] mb-2">✏️ 답변 등록</div>
                    <div className="bg-[var(--bg-surface)] rounded-xl border border-[#8b5cf640] overflow-hidden">
                      <textarea value={replyInput} onChange={e => setReplyInput(e.target.value)} rows={3} placeholder="답변을 입력하세요..."
                        className="w-full p-3 text-sm bg-transparent text-[var(--text-primary)] resize-none outline-none border-none" />
                      <div className="flex justify-end px-3 pb-3">
                        <button onClick={() => addReply(detailItem.id)}
                          className="px-4 py-1.5 rounded-lg text-white text-[12px] font-bold cursor-pointer border-none"
                          style={{ background:'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                          답변 등록
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
