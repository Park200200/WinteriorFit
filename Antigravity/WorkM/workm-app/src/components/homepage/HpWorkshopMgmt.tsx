import { useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../utils/storage'
import {
  FileText, RefreshCw, X, Trash2, Clipboard, ListChecks,
  Store, Tent, Building2, CheckCircle2, FileCheck, PartyPopper, XCircle,
} from 'lucide-react'

/* ── 타입 ── */
type WsType = 'franchise' | 'workshop' | 'venue'
interface WsItem {
  id: string; type: WsType; regDate: string; status: string
  groupName: string; manager: string; phone: string; email?: string
  memo: string
  // 워크샵 전용
  checkin?: string; checkout?: string; headcount?: number
  extras?: string; inquiry?: string
  // 대관 전용
  venueDate?: string; startTime?: string; endTime?: string
  // 공통
  prepList?: string[]
}

const STORAGE_KEY = 'ws_items'
const TYPE_MAP: Record<WsType, { label: string; icon: any; color: string }> = {
  franchise: { label: '가맹점', icon: Store, color: '#ec4899' },
  workshop:  { label: '워크샵', icon: Tent, color: '#f59e0b' },
  venue:     { label: '대관',   icon: Building2, color: '#6366f1' },
}
const STATUS_LIST = ['접수완료', '계약준비', '계약완료', '신청취소']
const STATUS_ICON: Record<string, any> = { '접수완료': CheckCircle2, '계약준비': FileCheck, '계약완료': PartyPopper, '신청취소': XCircle }
const STATUS_COLOR: Record<string, string> = { '접수완료':'#22c55e', '계약준비':'#f59e0b', '계약완료':'#3b82f6', '신청취소':'#ef4444' }

const SAMPLE: WsItem[] = [
  // 가맹점 10건
  { id:'fr001', type:'franchise', regDate:'2026-04-15', groupName:'서울 강남구 역삼동 가맹 신청', manager:'김민준', phone:'010-1234-5678', email:'kim@test.com', memo:'강남구 역삼동 오피스 상권 내 가맹점 개설 희망', status:'접수완료' },
  { id:'fr002', type:'franchise', regDate:'2026-04-14', groupName:'부산 해운대구 가맹 신청', manager:'이수진', phone:'010-5678-1234', email:'lee@test.com', memo:'해운대 관광 상권에서 가맹점 운영 희망', status:'계약준비' },
  { id:'fr003', type:'franchise', regDate:'2026-04-13', groupName:'대전 유성구 가맹 문의', manager:'박지훈', phone:'010-3456-7890', email:'park@daejeon.kr', memo:'대전 과학기술단지 인근 가맹점 개설 문의', status:'계약완료' },
  { id:'fr004', type:'franchise', regDate:'2026-04-12', groupName:'인천 송도국제도시 가맹 신청', manager:'최예린', phone:'010-7890-1234', email:'choi@songdo.com', memo:'송도 신도시 아파트 단지 내 가맹점 희망', status:'접수완료' },
  { id:'fr005', type:'franchise', regDate:'2026-04-11', groupName:'경기 판교 테크노밸리 가맹 문의', manager:'정우성', phone:'010-2345-6789', email:'jung@pangyo.kr', memo:'판교 IT기업 밀집 지역 가맹 문의', status:'계약준비' },
  { id:'fr006', type:'franchise', regDate:'2026-04-10', groupName:'광주 동구 충장로 가맹 신청', manager:'한소희', phone:'010-8901-2345', email:'han@gwangju.com', memo:'충장로 상권 내 가맹점 개설 희망', status:'접수완료' },
  { id:'fr007', type:'franchise', regDate:'2026-04-09', groupName:'대구 수성구 가맹 문의', manager:'오태민', phone:'010-6789-0123', email:'oh@daegu.kr', memo:'수성못 상권 인근 가맹 문의', status:'신청취소' },
  { id:'fr008', type:'franchise', regDate:'2026-04-08', groupName:'제주 서귀포시 가맹 신청', manager:'강하늘', phone:'010-4567-8901', email:'kang@jeju.com', memo:'관광지 인근 가맹점 개설 문의', status:'계약완료' },
  { id:'fr009', type:'franchise', regDate:'2026-04-07', groupName:'세종시 나성동 가맹 신청', manager:'윤서준', phone:'010-0123-4567', email:'yoon@sejong.kr', memo:'세종시 신규 상권 가맹점 개설 희망', status:'접수완료' },
  { id:'fr010', type:'franchise', regDate:'2026-04-06', groupName:'울산 남구 삼산동 가맹 문의', manager:'임하은', phone:'010-3210-9876', email:'lim@ulsan.com', memo:'삼산동 중심상권 가맹 문의', status:'신청취소' },
  // 워크샵 10건
  { id:'ws001', type:'workshop', regDate:'2026-04-02', groupName:'(주)한국테크솔루션', manager:'김철수', phone:'010-1234-5678', email:'kim@techsolution.co.kr', checkin:'2026-05-10', checkout:'2026-05-12', headcount:45, extras:'빔프로젝터 2대, 마이크 세트 3개, 화이트보드', inquiry:'주차 공간 확보 가능한지 확인 부탁드립니다', memo:'1박2일 전략 워크샵', status:'접수완료' },
  { id:'ws002', type:'workshop', regDate:'2026-04-03', groupName:'서울대학교 경영대학원 동문회', manager:'이영희', phone:'010-9876-5432', email:'lee@snuaaa.org', checkin:'2026-05-20', checkout:'2026-05-21', headcount:120, extras:'현수막 제작 의뢰, 포토존 설치', inquiry:'단체 식사 메뉴 사전 협의 요청드립니다', memo:'당일 세미나 행사', status:'계약준비' },
  { id:'ws003', type:'workshop', regDate:'2026-04-05', groupName:'그린에너지㎀', manager:'박민준', phone:'010-5555-2222', email:'park@greenenergy.kr', checkin:'2026-06-01', checkout:'2026-06-03', headcount:30, extras:'팀빌딩 프로그램 포함, 레크리에이션 강사 필요', inquiry:'', memo:'2박3일 팀빌딩', status:'계약완료' },
  { id:'ws004', type:'workshop', regDate:'2026-04-06', groupName:'하나은행 강남지점 영업팀', manager:'정수연', phone:'010-7777-3333', email:'jung@hana.com', checkin:'2026-05-28', checkout:'2026-05-30', headcount:36, extras:'노트북 36대 준비, 인터넷 와이파이 필수', inquiry:'교육 자료 사전 인쇄 가능한지 문의드립니다', memo:'2박3일 역량강화 교육', status:'접수완료' },
  { id:'ws005', type:'workshop', regDate:'2026-04-07', groupName:'CJ ENM 개발팀', manager:'최민호', phone:'010-2222-8888', email:'choi@cjenm.com', checkin:'2026-06-07', checkout:'2026-06-08', headcount:55, extras:'스크린 2개, 포스트잇 다량, 마커 세트', inquiry:'채식 메뉴 옵션 포함 여부 확인 바랍니다', memo:'1박2일 창의혁신 워크샵', status:'계약준비' },
  { id:'ws006', type:'workshop', regDate:'2026-04-08', groupName:'삼성SDS 클라우드사업부', manager:'윤지현', phone:'010-6666-1111', email:'yoon@samsung.com', checkin:'2026-07-01', checkout:'2026-07-03', headcount:80, extras:'회의실 4개 분리 사용 요청, 스탠딩 테이블 필요', inquiry:'세금계산서 발행 및 법인카드 결제 가능 여부', memo:'2박3일 하반기 전략 수립', status:'접수완료' },
  { id:'ws007', type:'workshop', regDate:'2026-04-09', groupName:'제주항공 객실승무원팀', manager:'강은지', phone:'010-4444-9999', email:'kang@jejuair.net', checkin:'2026-06-20', checkout:'2026-06-22', headcount:42, extras:'요가 매트 50개, 음악 스피커', inquiry:'조기 체크인 가능한지 문의드립니다', memo:'2박3일 힘링 워크샵', status:'계약완료' },
  { id:'ws008', type:'workshop', regDate:'2026-04-10', groupName:'LG화학 연구소 팀장급', manager:'이준혁', phone:'010-3838-7474', email:'lee@lgchem.com', checkin:'2026-08-10', checkout:'2026-08-12', headcount:25, extras:'프리미엄 객실 요청, 회의실 전용 사용', inquiry:'법인 계약서 별도 작성 요청', memo:'1박2일 리더십 칠프', status:'계약준비' },
  { id:'ws009', type:'workshop', regDate:'2026-04-11', groupName:'현대자동차 인재개발팀', manager:'오세훈', phone:'010-1010-2020', email:'oh@hyundai.com', checkin:'2026-09-05', checkout:'2026-09-07', headcount:100, extras:'강당 사용, 대형 스크린, 동시통역 장비', inquiry:'외국인 임원 참석 예정, 통역 서비스 연계 가능한지 확인', memo:'2박3일 글로벌 리더십 포럼', status:'접수완료' },
  { id:'ws010', type:'workshop', regDate:'2026-04-12', groupName:'스타트업코리아 협회', manager:'배수진', phone:'010-5050-6060', email:'bae@startupkorea.org', checkin:'2026-05-15', checkout:'2026-05-16', headcount:60, extras:'네트워킹 공간 야외 설치, 포토부스', inquiry:'우천 시 대관 장소 변경 가능 여부 확인 바랍니다', memo:'당일 IR 피칭 행사', status:'신청취소' },
  // 대관 10건
  { id:'ve001', type:'venue', regDate:'2026-04-04', groupName:'강남구청 체육문화팀', manager:'최지영', phone:'010-3333-7777', email:'choi@gangnam.go.kr', venueDate:'2026-04-25', startTime:'09:00', endTime:'18:00', headcount:60, extras:'', inquiry:'예산 상한 내 견적 요청드립니다', memo:'체험행사', status:'신청취소' },
  { id:'ve002', type:'venue', regDate:'2026-04-06', groupName:'미래교육재단', manager:'정수호', phone:'010-8888-4444', email:'jung@fedu.or.kr', venueDate:'2026-06-15', startTime:'10:00', endTime:'17:00', headcount:80, extras:'강사 섭외 요청, 강의 기자재 일체', inquiry:'세금계산서 발행 요청', memo:'교원 연수', status:'접수완료' },
  { id:'ve003', type:'venue', regDate:'2026-04-08', groupName:'K-컴처 페스티벌 조직위', manager:'임수아', phone:'010-7070-8080', email:'lim@kculture.org', venueDate:'2026-07-19', startTime:'14:00', endTime:'22:00', headcount:200, extras:'야외 무대 설치, 음향·조명 장비 별도 반입', inquiry:'주변 주차장 협조 요청 가능한지 문의', memo:'문화축제', status:'계약준비' },
  { id:'ve004', type:'venue', regDate:'2026-04-10', groupName:'웨딩컴쳐㎀', manager:'한미래', phone:'010-9090-1010', email:'han@weddingculture.com', venueDate:'2026-08-22', startTime:'11:00', endTime:'20:00', headcount:150, extras:'꽃 장식 반입 가능 여부, 뷔페 케이터링 협의', inquiry:'사진 촬영팀 5명 사전 방문 요청', memo:'야외 웨딩', status:'계약완료' },
  { id:'ve005', type:'venue', regDate:'2026-04-13', groupName:'서울시립교향악단', manager:'조현우', phone:'010-2020-3030', email:'cho@spo.or.kr', venueDate:'2026-09-20', startTime:'18:00', endTime:'21:00', headcount:300, extras:'피아노 조율 요청, 악기 반입 동선 확인', inquiry:'관객석 배치 도면 사전 협의 필요', memo:'정기 연주회', status:'접수완료' },
  { id:'ve006', type:'venue', regDate:'2026-04-14', groupName:'넥슨코리아 게임사업본부', manager:'류성민', phone:'010-1122-3344', email:'ryu@nexon.co.kr', venueDate:'2026-10-05', startTime:'10:00', endTime:'19:00', headcount:180, extras:'대형 LED 스크린 2개, 게임 시연 장비 반입', inquiry:'케이터링 업체 별도 섭외 예정, 반입 일정 사전 조율 요청', memo:'신작 론칭 쇼케이스', status:'계약준비' },
  { id:'ve007', type:'venue', regDate:'2026-04-15', groupName:'이화여자대학교 졸업준비위원회', manager:'강소희', phone:'010-4455-6677', email:'kang@ewha.ac.kr', venueDate:'2026-08-30', startTime:'13:00', endTime:'18:00', headcount:400, extras:'포토월 설치, 드레스코드 안내 현수막', inquiry:'주차장 이용 가능 대수 확인 및 발렛 서비스 여부 문의', memo:'졸업 축하 파티', status:'접수완료' },
  { id:'ve008', type:'venue', regDate:'2026-04-16', groupName:'한국인공지능학회', manager:'김태욱', phone:'010-7788-9900', email:'kim@kaia.re.kr', venueDate:'2026-11-15', startTime:'09:00', endTime:'18:00', headcount:250, extras:'동시통역 부스 2개, 포스터 전시 공간', inquiry:'Wi-Fi 가용 대역폭 확인', memo:'AI 국제 포럼', status:'계약완료' },
  { id:'ve009', type:'venue', regDate:'2026-04-17', groupName:'마포구청 생활체육과', manager:'박은정', phone:'010-5566-7788', email:'park@mapo.go.kr', venueDate:'2026-05-25', startTime:'08:00', endTime:'17:00', headcount:500, extras:'운동장 라인 페인팅, 텐트 20개, 음향 장비', inquiry:'우천 시 대체 실내 공간 확보 가능 여부 확인 요망', memo:'구민 체육대회', status:'신청취소' },
  { id:'ve010', type:'venue', regDate:'2026-04-18', groupName:'㎀모아엔터테인먼트', manager:'정하늘', phone:'010-9911-2233', email:'jung@moaent.com', venueDate:'2026-12-24', startTime:'19:00', endTime:'23:00', headcount:120, extras:'조명 디자인 연출팀 별도 방문 예정, 무대 설치', inquiry:'크리스마스 특별 요금 적용 여부 문의', memo:'크리스마스 갈라 콘서트', status:'계약준비' },
]

const PREP_SUGGESTIONS = ['프로젝터','화이트보드','마이크','음향시스템','의자 추가','테이블','명찰','다과','주차권','와이파이 안내','출입증','현수막']

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors'

export function HpWorkshopMgmt() {
  const [items, setItems] = useState<WsItem[]>(() => getItem<WsItem[]>(STORAGE_KEY, null) || SAMPLE)
  const [type, setType] = useState<WsType>('franchise')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailId, setDetailId] = useState<string|null>(null)
  const [prepModal, setPrepModal] = useState<string|null>(null) // itemId
  const [prepInput, setPrepInput] = useState('')

  const persist = useCallback((list: WsItem[]) => { setItems(list); setItem(STORAGE_KEY, list) }, [])

  const filtered = useMemo(() => {
    let list = items.filter(it => it.type === type)
    if (statusFilter) list = list.filter(it => it.status === statusFilter)
    return list.sort((a,b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime())
  }, [items, type, statusFilter])

  /* 통계 */
  const stats = useMemo(() => {
    const typItems = items.filter(it => it.type === type)
    const m: Record<string,number> = {}
    STATUS_LIST.forEach(s => { m[s] = typItems.filter(it => it.status === s).length })
    return m
  }, [items, type])

  const detailItem = detailId ? items.find(x => x.id === detailId) : null
  const saveStatus = (id: string, status: string) => { persist(items.map(it => it.id === id ? { ...it, status } : it)) }
  const deleteItem = (id: string) => { if (!confirm('삭제하시겠습니까?')) return; persist(items.filter(x => x.id !== id)); setDetailId(null) }

  /* 준비물 */
  const addPrep = (id: string, item: string) => {
    if (!item.trim()) return
    persist(items.map(it => {
      if (it.id !== id) return it
      const list = [...(it.prepList || [])]
      if (!list.includes(item.trim())) list.push(item.trim())
      return { ...it, prepList: list }
    }))
    setPrepInput('')
  }
  const removePrep = (id: string, idx: number) => {
    persist(items.map(it => {
      if (it.id !== id) return it
      return { ...it, prepList: (it.prepList || []).filter((_,i) => i !== idx) }
    }))
  }
  const clearAllPrep = (id: string) => { persist(items.map(it => it.id === id ? { ...it, prepList: [] } : it)) }
  const prepItem = prepModal ? items.find(x => x.id === prepModal) : null

  return (
    <div className="animate-fadeIn">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-4 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#ec4899,#db2777)' }}>
              <FileText size={18} className="text-white" />
            </div>
            <div className="text-[17px] font-extrabold text-[var(--text-primary)]">신청서 관리</div>
          </div>
          {/* 타입 스위치 */}
          <div className="flex bg-[var(--bg-muted)] rounded-[10px] p-[3px] gap-0.5 border border-[var(--border-default)]">
            {(Object.keys(TYPE_MAP) as WsType[]).map(k => {
              const active = type === k
              return (
                <button key={k} onClick={() => { setType(k); setStatusFilter('') }}
                  className="px-4 py-1.5 rounded-lg text-[12px] cursor-pointer border-none transition-all flex items-center gap-1.5"
                  style={{ fontWeight: active ? 700 : 600, background: active ? `linear-gradient(135deg,${TYPE_MAP[k].color},${TYPE_MAP[k].color}dd)` : 'transparent', color: active ? '#fff' : 'var(--text-muted)', boxShadow: active ? `0 2px 6px ${TYPE_MAP[k].color}50` : 'none' }}>
                  {(() => { const Icon = TYPE_MAP[k].icon; return <Icon size={13}/> })()} {TYPE_MAP[k].label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-[34px] px-2.5 border border-[var(--border-default)] rounded-lg text-[12px] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none">
            <option value="">전체 상태</option>
            {STATUS_LIST.map(s => { const SIcon = STATUS_ICON[s]; return <option key={s} value={s}>{s}</option> })}
          </select>
          <button onClick={() => persist([...items])}
            className="h-[34px] px-3.5 flex items-center gap-1.5 border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-lg text-[12px] font-semibold cursor-pointer">
            <RefreshCw size={13}/> 새로고침
          </button>
        </div>
      </div>

      {/* 통계 배지 + 준비물관리 */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex gap-2.5 flex-wrap">
          {STATUS_LIST.map(s => (
            <button key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all"
              style={{ borderColor: statusFilter === s ? STATUS_COLOR[s] : 'var(--border-default)', background: statusFilter === s ? `${STATUS_COLOR[s]}12` : 'var(--bg-surface)' }}>
              {(() => { const SIcon = STATUS_ICON[s]; return <SIcon size={14} style={{ color: STATUS_COLOR[s] }}/> })()}
              <span className="text-[12px] font-bold" style={{ color: statusFilter === s ? STATUS_COLOR[s] : 'var(--text-secondary)' }}>{s}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold text-white" style={{ background: STATUS_COLOR[s] }}>{stats[s]}</span>
            </button>
          ))}
        </div>
        {type !== 'franchise' && (
          <button onClick={() => {
            const sel = filtered[0]
            if (sel) setPrepModal(sel.id)
          }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#6366f1] bg-[rgba(99,102,241,.06)] text-[#6366f1] text-[12px] font-bold cursor-pointer hover:bg-[rgba(99,102,241,.12)] transition-colors">
            <ListChecks size={14}/> 준비물관리
          </button>
        )}
      </div>

      {/* 테이블 */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-[var(--text-muted)]">
          <div className="text-4xl mb-3"><Clipboard size={40} className="mx-auto text-[var(--text-muted)] opacity-40"/></div>
          <div className="text-sm font-bold">접수된 신청서가 없습니다</div>
          <div className="text-[12px] mt-1">신청이 들어오면 이곳에 표시됩니다</div>
        </div>
      ) : (
        <div className="border border-[var(--border-default)] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout:'auto', whiteSpace:'nowrap' }}>
            <thead>
              <tr className="border-b-2 border-[var(--border-default)]">
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-[var(--text-muted)]">상태</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-[var(--text-muted)]">단체/기관명</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-[var(--text-muted)]">담당자</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-[var(--text-muted)]">연락처</th>
                {type === 'workshop' && <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)]">체크인</th>}
                {type === 'workshop' && <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)]">체크아웃</th>}
                {type === 'venue' && <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)]">행사일</th>}
                {type === 'venue' && <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)]">시간</th>}
                {type !== 'franchise' && <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)]">인원</th>}
                <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)]">신청일</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id} onClick={() => setDetailId(it.id)}
                  className="border-b border-[var(--border-default)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white" style={{ background: STATUS_COLOR[it.status]||'#888' }}>
                      {it.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-bold text-[var(--text-primary)]">{it.groupName}</td>
                  <td className="px-3 py-2.5 text-[12px] text-[var(--text-secondary)] font-semibold">{it.manager}</td>
                  <td className="px-3 py-2.5 text-[12px] text-[var(--text-muted)]">{it.phone}</td>
                  {type === 'workshop' && <td className="px-3 py-2.5 text-center text-[11px] text-[var(--text-muted)]">{it.checkin||'-'}</td>}
                  {type === 'workshop' && <td className="px-3 py-2.5 text-center text-[11px] text-[var(--text-muted)]">{it.checkout||'-'}</td>}
                  {type === 'venue' && <td className="px-3 py-2.5 text-center text-[11px] text-[var(--text-muted)]">{it.venueDate||'-'}</td>}
                  {type === 'venue' && <td className="px-3 py-2.5 text-center text-[11px] text-[var(--text-muted)]">{it.startTime && it.endTime ? `${it.startTime}~${it.endTime}` : '-'}</td>}
                  {type !== 'franchise' && <td className="px-3 py-2.5 text-center text-[11px] text-[var(--text-muted)]">{it.headcount||'-'}</td>}
                  <td className="px-3 py-2.5 text-center text-[11px] text-[var(--text-muted)]">{it.regDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 상세 모달 */}
      {detailItem && createPortal(
        <div className="fixed inset-0 bg-black/55 z-[3000] flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setDetailId(null) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl w-[580px] max-w-[96vw] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 */}
            <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-center justify-between sticky top-0 bg-[var(--bg-surface)] z-10 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:`linear-gradient(135deg,${TYPE_MAP[detailItem.type].color},${TYPE_MAP[detailItem.type].color}dd)` }}>
                  <Clipboard size={15} className="text-white"/>
                </div>
                <div className="text-base font-extrabold text-[var(--text-primary)]">
                  {detailItem.type === 'franchise' ? '신청서 상세리스트' : detailItem.groupName}
                </div>
              </div>
              <button onClick={() => setDetailId(null)} className="w-7 h-7 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer border-none">×</button>
            </div>

            {detailItem.type === 'franchise' ? (
              /* ── 가맹점 전용 상세 리스트 ── */
              <>
                <div className="overflow-y-auto flex-1 p-6 space-y-0">
                  {/* 상태 뱃지 */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[12px] font-bold text-[var(--text-muted)]">현재 상태</span>
                    <span className="px-3 py-1 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1" style={{ background: STATUS_COLOR[detailItem.status]||'#888' }}>
                      {(() => { const SIcon = STATUS_ICON[detailItem.status]; return SIcon ? <SIcon size={12}/> : null })()}
                      {detailItem.status}
                    </span>
                  </div>
                  {/* 리스트 항목 */}
                  <div className="border border-[var(--border-default)] rounded-xl overflow-hidden">
                    {[
                      { label: '신청인', value: detailItem.manager || '-' },
                      { label: '전화번호', value: detailItem.phone || '-' },
                      { label: '이메일', value: detailItem.email || '-' },
                      { label: '신청지역', value: detailItem.groupName || '-' },
                      { label: '비고', value: detailItem.memo || '-' },
                    ].map((row, i) => (
                      <div key={i} className="flex border-b border-[var(--border-default)] last:border-b-0">
                        <div className="w-[100px] shrink-0 px-4 py-3.5 bg-[var(--bg-muted)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center">
                          {row.label}
                        </div>
                        <div className="flex-1 px-4 py-3.5 text-[14px] font-semibold text-[var(--text-primary)]">
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 푸터: 상태변경 */}
                <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-muted)] rounded-b-2xl flex items-center gap-2.5 flex-wrap">
                  <span className="text-[12px] font-bold text-[var(--text-muted)]">상태 변경</span>
                  <select value={detailItem.status} onChange={e => saveStatus(detailItem.id, e.target.value)}
                    className="h-[34px] px-3 border border-[var(--border-default)] rounded-lg text-[12px] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none font-semibold">
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => saveStatus(detailItem.id, detailItem.status)}
                    className="h-[34px] px-4 rounded-lg text-white text-[12px] font-bold cursor-pointer border-none" style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)' }}>저장</button>
                  <div className="ml-auto">
                    <button onClick={() => deleteItem(detailItem.id)}
                      className="h-[34px] px-3.5 rounded-lg bg-red-500/10 border border-red-300/20 text-red-500 text-[12px] font-bold cursor-pointer">삭제</button>
                  </div>
                </div>
              </>
            ) : (
              /* ── 워크샵/대관 기존 상세 UI ── */
              <>
                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                  {/* 현재 상태 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-[var(--text-muted)]">현재 상태</span>
                    <span className="px-3 py-1 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1" style={{ background: STATUS_COLOR[detailItem.status]||'#888' }}>
                      {(() => { const SIcon = STATUS_ICON[detailItem.status]; return SIcon ? <SIcon size={12}/> : null })()}
                      {detailItem.status}
                    </span>
                  </div>

                  {/* 기본 정보 카드 */}
                  <div className="border border-[var(--border-default)] rounded-xl p-5 bg-[var(--bg-muted)/30]">
                    <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">단체명</div>
                    <div className="text-[15px] font-extrabold text-[var(--text-primary)] mb-4">{detailItem.groupName}</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <div className="text-[11px] font-bold text-[var(--text-muted)]">담당자</div>
                        <div className="text-[14px] font-bold text-[var(--text-primary)]">{detailItem.manager}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-[var(--text-muted)]">담당자 연락처</div>
                        <div className="text-[14px] font-bold text-[var(--text-primary)]">{detailItem.phone}</div>
                      </div>
                      {detailItem.email && (
                        <div className="col-span-2">
                          <div className="text-[11px] font-bold text-[var(--text-muted)]">담당자 이메일</div>
                          <div className="text-[14px] font-bold text-[var(--text-primary)]">{detailItem.email}</div>
                        </div>
                      )}
                      {detailItem.type === 'workshop' && (
                        <>
                          <div>
                            <div className="text-[11px] font-bold text-[var(--text-muted)]">체크인</div>
                            <div className="text-[14px] font-bold text-[var(--text-primary)]">{detailItem.checkin||'-'}</div>
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-[var(--text-muted)]">체크아웃</div>
                            <div className="text-[14px] font-bold text-[var(--text-primary)]">{detailItem.checkout||'-'}</div>
                          </div>
                        </>
                      )}
                      {detailItem.type === 'venue' && (
                        <>
                          <div>
                            <div className="text-[11px] font-bold text-[var(--text-muted)]">행사일</div>
                            <div className="text-[14px] font-bold text-[var(--text-primary)]">{detailItem.venueDate||'-'}</div>
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-[var(--text-muted)]">시간</div>
                            <div className="text-[14px] font-bold text-[var(--text-primary)]">{detailItem.startTime||''}~{detailItem.endTime||''}</div>
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <div className="text-[11px] font-bold text-[var(--text-muted)]">총 인원</div>
                        <div className="text-[14px] font-extrabold text-[var(--text-primary)]">{detailItem.headcount||'-'}명</div>
                      </div>
                    </div>
                  </div>

                  {/* 추가 준비사항 */}
                  {detailItem.extras && (
                    <div className="border border-[var(--border-default)] rounded-xl p-4 bg-[rgba(99,102,241,0.03)]">
                      <div className="text-[11px] font-bold text-[#6366f1] uppercase tracking-wider mb-2">추가 준비사항</div>
                      <div className="text-[13.5px] text-[var(--text-primary)] leading-relaxed">{detailItem.extras}</div>
                    </div>
                  )}

                  {/* 기타 문의사항 */}
                  {detailItem.inquiry && (
                    <div className="border border-[var(--border-default)] rounded-xl p-4 bg-[rgba(239,68,68,0.03)]">
                      <div className="text-[11px] font-bold text-[#ef4444] uppercase tracking-wider mb-2">기타 문의사항</div>
                      <div className="text-[13.5px] text-[var(--text-primary)] leading-relaxed">{detailItem.inquiry}</div>
                    </div>
                  )}

                  {/* 메모 */}
                  {detailItem.memo && (
                    <div className="border border-[var(--border-default)] rounded-xl p-4">
                      <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">메모</div>
                      <div className="text-[13.5px] text-[var(--text-primary)] leading-relaxed">{detailItem.memo}</div>
                    </div>
                  )}
                </div>
                {/* 푸터 */}
                <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-muted)] rounded-b-2xl flex items-center gap-2.5 flex-wrap">
                  <span className="text-[12px] font-bold text-[var(--text-muted)]">상태 변경</span>
                  <select value={detailItem.status} onChange={e => saveStatus(detailItem.id, e.target.value)}
                    className="h-[34px] px-3 border border-[var(--border-default)] rounded-lg text-[12px] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none font-semibold">
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => saveStatus(detailItem.id, detailItem.status)}
                    className="h-[34px] px-4 rounded-lg text-white text-[12px] font-bold cursor-pointer border-none" style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)' }}>저장</button>
                  <div className="ml-auto">
                    <button onClick={() => deleteItem(detailItem.id)}
                      className="h-[34px] px-3.5 rounded-lg bg-red-500/10 border border-red-300/20 text-red-500 text-[12px] font-bold cursor-pointer">삭제</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 준비물 모달 */}
      {prepItem && createPortal(
        <div className="fixed inset-0 bg-black/55 z-[3100] flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setPrepModal(null) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl w-[540px] max-w-[96vw] max-h-[88vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                  <ListChecks size={15} className="text-white"/>
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-[var(--text-primary)]">준비물관리</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{prepItem.groupName} · {prepItem.checkin || prepItem.venueDate || ''}</div>
                </div>
              </div>
              <button onClick={() => setPrepModal(null)} className="w-7 h-7 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer border-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* 추가 */}
              <div>
                <div className="text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">준비물 추가</div>
                <div className="flex gap-2">
                  <input value={prepInput} onChange={e => setPrepInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addPrep(prepItem.id, prepInput) }}
                    placeholder="항목 입력 후 Enter" className={`${inputCls} flex-1`} />
                  <button onClick={() => addPrep(prepItem.id, prepInput)}
                    className="px-3 py-2 rounded-lg bg-[#6366f1] text-white text-[12px] font-bold cursor-pointer border-none">추가</button>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1.5">Enter 키로 항목을 추가하세요</div>
                {/* 제안 */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PREP_SUGGESTIONS.filter(s => !(prepItem.prepList||[]).includes(s)).slice(0,8).map(s => (
                    <button key={s} onClick={() => addPrep(prepItem.id, s)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)] cursor-pointer hover:bg-[#6366f120] hover:text-[#6366f1] hover:border-[#6366f1] transition-colors">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* 현재 목록 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">현재 준비물 목록</span>
                  <button onClick={() => clearAllPrep(prepItem.id)} className="text-[11px] text-red-500 bg-transparent border-none cursor-pointer font-semibold">전체 삭제</button>
                </div>
                <div className="min-h-[80px] p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-default)]">
                  {(!prepItem.prepList || prepItem.prepList.length === 0) ? (
                    <div className="text-center text-[12px] text-[var(--text-muted)] py-2">준비물을 추가하세요</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {prepItem.prepList.map((p, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[12px] font-bold text-[var(--text-primary)]">
                          {p}
                          <button onClick={() => removePrep(prepItem.id, i)} className="text-[var(--text-muted)] cursor-pointer bg-transparent border-none hover:text-red-500"><X size={12}/></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-muted)] rounded-b-2xl flex gap-2.5 justify-end">
              <button onClick={() => setPrepModal(null)} className="px-5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-[13px] font-semibold cursor-pointer">닫기</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
