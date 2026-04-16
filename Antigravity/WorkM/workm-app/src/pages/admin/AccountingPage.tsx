import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { cn } from '../../utils/cn'
import { getItem, setItem } from '../../utils/storage'
import { formatNumber } from '../../utils/format'
import { AcctBalance } from '../../components/accounting/AcctBalance'
import { AcctReports } from '../../components/accounting/AcctReports'
import { useStaffStore } from '../../stores/staffStore'
import { CustomSelect } from '../../components/ui/CustomSelect'
import { DatePicker } from '../../components/ui/DatePicker'
import {
  LayoutDashboard, Wallet, FileCheck, ArrowDownCircle, ArrowUpCircle,
  BookOpen, PieChart, ScrollText, Settings2, ContactRound,
  TrendingDown, TrendingUp, Banknote, Clock,
  Plus, Edit3, Trash2, Save, X, Check, Ban,
} from 'lucide-react'

/* ─── 회계 시드 데이터 초기화 ── */
function initAccountingSeed() {
  if (localStorage.getItem('_acct_react_seed_v2')) return

  const uid = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
  const year = new Date().getFullYear()

  /* ── 예산 시드 (기존 데이터 없을 때만) ── */
  const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
  const budgets = getItem<BudgetItem[]>('acct_budgets', [])

  if (cats.length === 0 || budgets.length === 0) {
    const catDefs = [
      { name: '문화재청', bank: '기업은행 1010-1100-12', from: `${year}-01-01`, to: `${year}-12-31` },
      { name: '경주시청', bank: '농협은행 2020-2200-34', from: `${year}-01-01`, to: `${year}-12-31` },
      { name: '자체예산', bank: '국민은행 3030-3300-56', from: `${year}-01-01`, to: `${year}-12-31` },
    ]

    const itemSets = [
      [
        { item: '문화재 보수비', code: '5110', amt: 50000000 },
        { item: '발굴조사비', code: '5120', amt: 30000000 },
        { item: '전문인력 인건비', code: '5210', amt: 25000000 },
        { item: '장비 구입비', code: '5130', amt: 15000000 },
        { item: '안전관리비', code: '5140', amt: 8000000 },
      ],
      [
        { item: '유적정비비', code: '5110', amt: 40000000 },
        { item: '관광홍보비', code: '5320', amt: 20000000 },
        { item: '시설유지비', code: '5130', amt: 15000000 },
        { item: '조경공사비', code: '5120', amt: 12000000 },
        { item: '행사운영비', code: '5310', amt: 8000000 },
      ],
      [
        { item: '임직원 급여', code: '5210', amt: 60000000 },
        { item: '사무용품비', code: '5190', amt: 5000000 },
        { item: '통신비', code: '5340', amt: 3000000 },
        { item: '차량유지비', code: '5310', amt: 4000000 },
        { item: '복리후생비', code: '5350', amt: 6000000 },
      ],
    ]

    const newCats = [...cats]
    const newBudgets = [...budgets]

    catDefs.forEach((def, ci) => {
      const catId = uid()
      newCats.push({
        id: catId, name: def.name, year,
        bankInfo: def.bank, periodFrom: def.from, periodTo: def.to,
      })
      itemSets[ci].forEach(b => {
        newBudgets.push({
          id: uid(), catId, year,
          itemName: b.item, accountCode: b.code,
          amount: b.amt, spent: Math.round(b.amt * (Math.random() * 0.4)), memo: '',
        })
      })
    })

    setItem('acct_budget_cats', newCats)
    setItem('acct_budgets', newBudgets)
  }

  /* ── 거래처 샘플 10건 ── */
  if (getItem<any[]>('acct_vendors', []).length === 0) {
    const vendors = [
      { id: 1001, name: '(주)한국전자', zipCode: '06134', address1: '서울특별시 강남구 테헤란로 152', address2: '강남파이낸스센터 3층', phone: '02-555-1234', ceoName: '김대표', ceoPhone: '010-1111-2222', managerName: '박담당', managerPhone: '010-3333-4444', bizNo: '123-45-67890', bizType: '제조', bizCategory: '전자부품', invoiceEmail: 'tax@hankook.co.kr', memo: '주요 전자부품 공급처' },
      { id: 1002, name: '(주)서울건설', zipCode: '04536', address1: '서울특별시 중구 세종대로 110', address2: '2층 203호', phone: '02-777-5678', ceoName: '이건설', ceoPhone: '010-5555-6666', managerName: '최현장', managerPhone: '010-7777-8888', bizNo: '234-56-78901', bizType: '건설', bizCategory: '종합건설', invoiceEmail: 'bill@seoulcon.kr', memo: '문화재 보수공사 전문' },
      { id: 1003, name: '대한인쇄공사', zipCode: '07236', address1: '서울특별시 영등포구 여의대로 24', address2: '', phone: '02-333-9012', ceoName: '정인쇄', ceoPhone: '010-9999-0000', managerName: '한영업', managerPhone: '010-1234-5678', bizNo: '345-67-89012', bizType: '인쇄', bizCategory: '인쇄출판', invoiceEmail: 'invoice@daehanprint.com', memo: '보고서 인쇄 전문업체' },
      { id: 1004, name: '경주문화재연구원', zipCode: '38065', address1: '경상북도 경주시 알천북로 345', address2: '연구동 501호', phone: '054-772-3456', ceoName: '신연구', ceoPhone: '010-2345-6789', managerName: '유조사', managerPhone: '010-3456-7890', bizNo: '456-78-90123', bizType: '서비스', bizCategory: '학술연구', invoiceEmail: 'gyeongju@research.or.kr', memo: '발굴조사 용역 파트너' },
      { id: 1005, name: '(주)스마트오피스', zipCode: '13487', address1: '경기도 성남시 분당구 판교로 228', address2: '판교테크노밸리 A동', phone: '031-888-1111', ceoName: '오사무', ceoPhone: '010-4567-8901', managerName: '강사원', managerPhone: '010-5678-9012', bizNo: '567-89-01234', bizType: '도소매', bizCategory: '사무용품', invoiceEmail: 'smart@smartoffice.co.kr', memo: '사무용품 정기 공급' },
      { id: 1006, name: '한빛통신(주)', zipCode: '06164', address1: '서울특별시 강남구 삼성로 180', address2: '', phone: '02-444-2222', ceoName: '나통신', ceoPhone: '010-6789-0123', managerName: '문기술', managerPhone: '010-7890-1234', bizNo: '678-90-12345', bizType: '서비스', bizCategory: '통신서비스', invoiceEmail: 'billing@hanbit.net', memo: '인터넷/전화 서비스' },
      { id: 1007, name: '(주)그린조경', zipCode: '31116', address1: '충청남도 천안시 동남구 충절로 12', address2: '그린빌딩 2층', phone: '041-555-3333', ceoName: '초조경', ceoPhone: '010-8901-2345', managerName: '류원예', managerPhone: '010-9012-3456', bizNo: '789-01-23456', bizType: '서비스', bizCategory: '조경', invoiceEmail: 'green@greenland.kr', memo: '유적지 조경공사 전문' },
      { id: 1008, name: '세종법률사무소', zipCode: '04526', address1: '서울특별시 중구 남대문로 117', address2: '법조빌딩 15층', phone: '02-666-4444', ceoName: '변법률', ceoPhone: '010-0123-4567', managerName: '서변호', managerPhone: '010-1111-3333', bizNo: '890-12-34567', bizType: '서비스', bizCategory: '법률서비스', invoiceEmail: 'sejong@lawoffice.co.kr', memo: '법률자문 계약 업체' },
      { id: 1009, name: '(주)퍼스트카', zipCode: '16878', address1: '경기도 용인시 수지구 풍덕천로 67', address2: '', phone: '031-222-5555', ceoName: '차정비', ceoPhone: '010-2222-4444', managerName: '김정비', managerPhone: '010-3333-5555', bizNo: '901-23-45678', bizType: '서비스', bizCategory: '자동차정비', invoiceEmail: 'firstcar@firstcar.kr', memo: '법인차량 정비' },
      { id: 1010, name: '(주)맛나푸드', zipCode: '06037', address1: '서울특별시 강남구 봉은사로 317', address2: 'B1층', phone: '02-999-6666', ceoName: '맛대표', ceoPhone: '010-4444-6666', managerName: '이배달', managerPhone: '010-5555-7777', bizNo: '012-34-56789', bizType: '서비스', bizCategory: '식품외식', invoiceEmail: 'food@matnafood.com', memo: '행사용 케이터링' },
    ]
    setItem('acct_vendors', vendors)
  }

  /* ── 품의 샘플 10건 ── */
  if (getItem<any[]>('acct_approvals', []).length === 0) {
    const mm = (m: number) => String(m).padStart(2, '0')
    const approvals = [
      { id: 2001, title: 'Q1 사무용품 일괄 구매', amount: 1500000, date: `${year}-01-15`, status: 'approved', accountCode: '5190', description: '1분기 사무용품 일괄 구매 품의', applicant: 'admin', approver: '김지훈', createdAt: `${year}-01-14T09:00:00Z` },
      { id: 2002, title: '문화재 현장 안전장비 구입', amount: 3200000, date: `${year}-02-05`, status: 'approved', accountCode: '5140', description: '현장 안전모, 안전벨트 등 구입', applicant: 'admin', approver: '김지훈', createdAt: `${year}-02-04T10:00:00Z` },
      { id: 2003, title: '발굴조사 장비 임대', amount: 8500000, date: `${year}-02-20`, status: 'approved', accountCode: '5120', description: '3월 발굴조사 장비 임대 비용', applicant: 'admin', approver: '이수진', createdAt: `${year}-02-19T14:00:00Z` },
      { id: 2004, title: '보고서 인쇄비', amount: 2800000, date: `${year}-03-10`, status: 'pending', accountCode: '5190', description: '2025년도 연간보고서 인쇄', applicant: 'admin', approver: '박민수', createdAt: `${year}-03-09T11:00:00Z` },
      { id: 2005, title: '직원 역량강화 교육비', amount: 4500000, date: `${year}-03-25`, status: 'pending', accountCode: '5350', description: '문화재 복원기술 교육 수강료', applicant: 'admin', approver: '김지훈', createdAt: `${year}-03-24T09:30:00Z` },
      { id: 2006, title: '법인차량 정기정비', amount: 780000, date: `${year}-${mm(new Date().getMonth())}-05`, status: 'approved', accountCode: '5310', description: '법인차량 3대 정기정비', applicant: 'admin', approver: '정현수', createdAt: `${year}-${mm(new Date().getMonth())}-04T08:00:00Z` },
      { id: 2007, title: '유적지 조경공사', amount: 12000000, date: `${year}-${mm(new Date().getMonth())}-12`, status: 'pending', accountCode: '5120', description: '경주 유적지 봄 조경정비', applicant: 'admin', approver: '이수진', createdAt: `${year}-${mm(new Date().getMonth())}-11T10:00:00Z` },
      { id: 2008, title: '사무실 통신비 연간계약', amount: 3600000, date: `${year}-${mm(new Date().getMonth() + 1)}-01`, status: 'rejected', accountCode: '5340', description: '인터넷/전화 연간계약 갱신', applicant: 'admin', approver: '박민수', createdAt: `${year}-${mm(new Date().getMonth())}-28T15:00:00Z` },
      { id: 2009, title: '현장 드론 구입', amount: 5500000, date: `${year}-${mm(new Date().getMonth() + 1)}-10`, status: 'pending', accountCode: '5130', description: '항공촬영용 고성능 드론 2대', applicant: 'admin', approver: '최유리', createdAt: `${year}-${mm(new Date().getMonth() + 1)}-09T09:00:00Z` },
      { id: 2010, title: '행사장 케이터링', amount: 2200000, date: `${year}-${mm(new Date().getMonth() + 1)}-20`, status: 'pending', accountCode: '5310', description: '문화유산의 날 행사 케이터링', applicant: 'admin', approver: '한소희', createdAt: `${year}-${mm(new Date().getMonth() + 1)}-19T13:00:00Z` },
    ]
    setItem('acct_approvals', approvals)
  }

  /* ── 지출/입금/출금 샘플 각 10건 ── */
  if (getItem<any[]>('acct_cashflows', []).length === 0) {
    const cfs: any[] = []
    const vs: any[] = []
    let sid = 3001

    // 지출 10건
    const expenses = [
      { desc: '사무용품 구매 (복사지, 토너)', amt: 320000, date: `${year}-01-20`, counter: '(주)스마트오피스', method: '카드' },
      { desc: '현장작업자 안전장비', amt: 1500000, date: `${year}-02-08`, counter: '(주)한국전자', method: '계좌이체' },
      { desc: '3월 법인차량 유류비', amt: 450000, date: `${year}-03-15`, counter: '주유소', method: '법인카드' },
      { desc: '보고서 인쇄비 (300부)', amt: 1200000, date: `${year}-03-28`, counter: '대한인쇄공사', method: '계좌이체' },
      { desc: '사무실 인터넷 요금', amt: 88000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-05`, counter: '한빛통신(주)', method: '계좌이체' },
      { desc: '조경 유지보수비', amt: 3500000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-10`, counter: '(주)그린조경', method: '계좌이체' },
      { desc: '직원 간식비', amt: 150000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-12`, counter: '(주)맛나푸드', method: '법인카드' },
      { desc: '법률자문 수수료', amt: 2200000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-18`, counter: '세종법률사무소', method: '계좌이체' },
      { desc: '차량 정기검사비', amt: 350000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-02`, counter: '(주)퍼스트카', method: '카드' },
      { desc: '사무실 정수기 렌탈', amt: 55000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-05`, counter: '정수기렌탈', method: '계좌이체' },
    ]
    expenses.forEach(e => {
      const id = sid++
      cfs.push({ id, date: e.date, type: 'expense', amount: e.amt, description: e.desc, accountCode: '5110', counter: e.counter, method: e.method })
      vs.push({ id: sid++, date: e.date, type: 'expense', description: e.desc, createdAt: e.date + 'T09:00:00Z', entries: [
        { side: 'debit', accountCode: '5110', amount: e.amt },
        { side: 'credit', accountCode: e.method === '현금' ? '1010' : '1020', amount: e.amt },
      ]})
    })

    // 입금 10건
    const incomes = [
      { desc: '문화재청 1차 보조금', amt: 25000000, date: `${year}-01-10`, counter: '문화재청', method: '계좌이체' },
      { desc: '경주시 관광홍보 보조금', amt: 10000000, date: `${year}-02-01`, counter: '경주시청', method: '계좌이체' },
      { desc: '문화재청 2차 보조금', amt: 25000000, date: `${year}-03-05`, counter: '문화재청', method: '계좌이체' },
      { desc: '발굴조사 용역 수입', amt: 8000000, date: `${year}-03-20`, counter: '경주문화재연구원', method: '계좌이체' },
      { desc: '유적 입장료 수입', amt: 3200000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-01`, counter: '현장매표소', method: '현금' },
      { desc: '기념품 판매 수입', amt: 1500000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-08`, counter: '기념품샵', method: '카드' },
      { desc: '경주시 3차 보조금', amt: 10000000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-15`, counter: '경주시청', method: '계좌이체' },
      { desc: '교육 프로그램 참가비', amt: 2400000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-20`, counter: '교육참가자', method: '계좌이체' },
      { desc: '도서 판매 수입', amt: 850000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-03`, counter: '온라인서점', method: '계좌이체' },
      { desc: '문화재청 3차 보조금', amt: 20000000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10`, counter: '문화재청', method: '계좌이체' },
    ]
    incomes.forEach(e => {
      const id = sid++
      cfs.push({ id, date: e.date, type: 'income', amount: e.amt, description: e.desc, accountCode: '4030', counter: e.counter, method: e.method })
      vs.push({ id: sid++, date: e.date, type: 'income', description: e.desc, createdAt: e.date + 'T09:00:00Z', entries: [
        { side: 'debit', accountCode: e.method === '현금' ? '1010' : '1020', amount: e.amt },
        { side: 'credit', accountCode: '4030', amount: e.amt },
      ]})
    })

    // 출금 10건 (type: 'expense' + withdrawal 형태)
    const withdrawals = [
      { desc: '임직원 1월 급여', amt: 15000000, date: `${year}-01-25`, counter: '직원계좌', method: '계좌이체' },
      { desc: '임직원 2월 급여', amt: 15000000, date: `${year}-02-25`, counter: '직원계좌', method: '계좌이체' },
      { desc: '4대보험 납부', amt: 4800000, date: `${year}-02-28`, counter: '국민건강보험공단', method: '계좌이체' },
      { desc: '임직원 3월 급여', amt: 15000000, date: `${year}-03-25`, counter: '직원계좌', method: '계좌이체' },
      { desc: '퇴직연금 적립', amt: 3000000, date: `${year}-03-31`, counter: '퇴직연금운용사', method: '계좌이체' },
      { desc: '세금 납부 (부가세)', amt: 5500000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-10`, counter: '국세청', method: '계좌이체' },
      { desc: '임직원 ${new Date().getMonth() + 1}월 급여', amt: 15000000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-25`, counter: '직원계좌', method: '계좌이체' },
      { desc: '사무실 임대료', amt: 3300000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`, counter: '건물주', method: '계좌이체' },
      { desc: '4대보험 납부', amt: 4800000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-05`, counter: '국민건강보험공단', method: '계좌이체' },
      { desc: '관리비 납부', amt: 880000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10`, counter: '관리사무소', method: '계좌이체' },
    ]
    withdrawals.forEach(e => {
      const id = sid++
      cfs.push({ id, date: e.date, type: 'expense', amount: e.amt, description: e.desc, accountCode: '5210', counter: e.counter, method: e.method, isWithdrawal: true })
      vs.push({ id: sid++, date: e.date, type: 'expense', description: e.desc, createdAt: e.date + 'T09:00:00Z', entries: [
        { side: 'debit', accountCode: '5210', amount: e.amt },
        { side: 'credit', accountCode: '1020', amount: e.amt },
      ]})
    })

    setItem('acct_cashflows', cfs)
    setItem('acct_vouchers', vs)
  }

  localStorage.setItem('_acct_react_seed_v2', '1')
}

/* ─────────────────────────────────────────────
   타입
   ───────────────────────────────────────────── */
interface BudgetCat {
  id: string | number
  name: string
  year?: number
  bank?: string
  bankInfo?: string
  periodFrom?: string
  periodTo?: string
}

interface BudgetItem {
  id: string | number
  catId: string | number
  year?: number
  itemName: string
  accountCode?: string
  amount: number
  spent: number
  memo?: string
}

interface CashFlow {
  id: string | number
  type: 'income' | 'expense'
  amount: number
  date: string
  description?: string
  accountCode?: string
}

interface Approval {
  id: string | number
  status: string
  date?: string
  createdAt?: string
  accountCode?: string
  amount?: number
  title?: string
}

interface Voucher {
  id: string | number
  type?: string
  date?: string
  description?: string
  createdAt?: string
  entries?: Array<{ side: string; amount: number; accountCode?: string; account?: string }>
}

/* ─── 서브 페이지 정의 ── */
const SUB_PAGES = [
  { key: 'overview',   label: '기본현황',   icon: LayoutDashboard },
  { key: 'budget',     label: '예산설정',   icon: PieChart },
  { key: 'balance',    label: '기초잔액',   icon: Wallet },
  { key: 'approval',   label: '품의하기',   icon: FileCheck },
  { key: 'expense',    label: '지출하기',   icon: TrendingDown },
  { key: 'income',     label: '입금전표',   icon: TrendingUp },
  { key: 'withdrawal', label: '출금전표',   icon: ArrowUpCircle },
  { key: 'payment',    label: '전표장부',   icon: BookOpen },
  { key: 'reports',    label: '회계현황',   icon: ScrollText },
  { key: 'vendors',    label: '거래처관리',   icon: ContactRound },
]

/* ═══════════════════════════════════════════
   AccountingPage 메인
   ═══════════════════════════════════════════ */
export function AccountingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSub = searchParams.get('tab') || 'overview'
  const setActiveSub = (tab: string) => {
    const year = searchParams.get('year') || ''
    const params: Record<string, string> = { tab }
    if (year) params.year = year
    setSearchParams(params)
  }
  const currentYear = new Date().getFullYear()
  const year = parseInt(searchParams.get('year') || '') || currentYear

  useEffect(() => { initAccountingSeed() }, [])

  return (
    <div className="animate-fadeIn">
      {/* ── 모바일 연도 선택 (데스크탑은 헤더에 표시) ── */}
      <div className="mb-4 md:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1">
            <Clock size={12} /> 회계연도
          </span>
          {[currentYear + 1, currentYear, currentYear - 1].map(y => (
            <button
              key={y}
              onClick={() => {
                const tab = searchParams.get('tab') || 'overview'
                setSearchParams({ tab, year: String(y) })
              }}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all border',
                y === year
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:border-primary-400',
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>




      {/* ── 서브 페이지 렌더 ── */}
      {activeSub === 'overview' && <AcctOverview year={year} />}
      {activeSub === 'budget' && <AcctBudget year={year} />}
      {activeSub === 'balance' && <AcctBalance year={year} />}
      {activeSub === 'approval' && <AcctApproval year={year} />}
      {(activeSub === 'expense' || activeSub === 'income' || activeSub === 'withdrawal') && (
        <AcctVoucherEntry year={year} type={activeSub as 'expense' | 'income' | 'withdrawal'} />
      )}
      {activeSub === 'payment' && <AcctPaymentLedger year={year} />}
      {activeSub === 'reports' && <AcctReports year={year} />}
      {activeSub === 'vendors' && <AcctVendors />}
      {!['overview','budget','balance','approval','expense','income','withdrawal','payment','reports','vendors'].includes(activeSub) && (
        <AcctSubPlaceholder
          pageKey={activeSub}
          label={SUB_PAGES.find(s => s.key === activeSub)?.label || ''}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   기본현황 (Overview)
   ═══════════════════════════════════════════ */
function AcctOverview({ year }: { year: number }) {
  const budgetCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []), [])
  const budgets = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [])
  const cashflows = useMemo(() => getItem<CashFlow[]>('acct_cashflows', []), [])
  const approvals = useMemo(() => getItem<Approval[]>('acct_approvals', []), [])
  const vouchers = useMemo(() => getItem<Voucher[]>('acct_vouchers', []), [])

  const [selectedOverviewCatId, setSelectedOverviewCatId] = useState<string | number | null>(null)

  const isInYear = (dateStr?: string) => {
    if (!dateStr) return false
    return parseInt(String(dateStr).substring(0, 4)) === year
  }

  /* ── 연도별 필터 ── */
  const yearCats = budgetCats.filter(cat => {
    const catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear())
    return catYear === year
  })
  const yearCatIds = yearCats.map(c => c.id)
  const yearBudgets = budgets.filter(b => yearCatIds.includes(b.catId))
  const yearCashflows = cashflows.filter(cf => isInYear(cf.date))
  const yearApprovals = approvals.filter(a => isInYear(a.date || a.createdAt))
  const yearVouchers = vouchers.filter(v => isInYear(v.date))

  /* ── 선택 구분별 예산 필터 ── */
  const filteredBudgets = selectedOverviewCatId
    ? yearBudgets.filter(b => String(b.catId) === String(selectedOverviewCatId))
    : yearBudgets

  /* ── 통계 ── */
  const totalIncome = yearCashflows.filter(c => c.type === 'income').reduce((a, c) => a + (c.amount || 0), 0)
  const totalExpense = yearCashflows.filter(c => c.type === 'expense').reduce((a, c) => a + (c.amount || 0), 0)
  const balance = totalIncome - totalExpense
  const pendingCount = yearApprovals.filter(a => a.status === 'pending').length
  const totalBudgetAmt = filteredBudgets.reduce((a, b) => a + (b.amount || 0), 0)
  const totalBudgetSpent = filteredBudgets.reduce((a, b) => a + (b.spent || 0), 0)
  const budgetRate = totalBudgetAmt > 0 ? Math.round(totalBudgetSpent / totalBudgetAmt * 100) : 0

  const statCards = [
    { icon: ArrowDownCircle, label: '총 수입', value: `${formatNumber(totalIncome)}원`, color: '#22c55e' },
    { icon: ArrowUpCircle, label: '총 지출', value: `${formatNumber(totalExpense)}원`, color: '#ef4444' },
    { icon: Banknote, label: '잔액', value: `${formatNumber(balance)}원`, color: balance >= 0 ? '#4f6ef7' : '#ef4444' },
    { icon: FileCheck, label: '결재 대기', value: `${pendingCount}건`, color: '#f59e0b' },
  ]

  /* ── 최근 전표 5건 ── */
  const recentVouchers = [...yearVouchers]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5)

  /* ── 예산 소진율 TOP 5 ── */
  const budgetBars = filteredBudgets
    .map(b => ({
      name: b.itemName,
      pct: b.amount > 0 ? Math.round((b.spent || 0) / b.amount * 100) : 0,
      spent: b.spent || 0,
      amount: b.amount,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  /* ── 월별 수입/지출 (최근 6개월) ── */
  const monthData = useMemo(() => {
    const now = new Date()
    const data: Record<string, { income: number; expense: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      data[key] = { income: 0, expense: 0 }
    }
    yearCashflows.forEach(c => {
      const mk = c.date ? c.date.slice(0, 7) : ''
      if (data[mk]) {
        if (c.type === 'income') data[mk].income += (c.amount || 0)
        else data[mk].expense += (c.amount || 0)
      }
    })
    return data
  }, [yearCashflows])

  const maxMonthVal = Math.max(1, ...Object.values(monthData).map(d => Math.max(d.income, d.expense)))
  const tabColors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="space-y-4">
      {/* ── 통계 카드 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                style={{ background: `${card.color}22`, color: card.color }}
              >
                <Icon size={17} />
              </div>
              <div className="text-[11px] font-bold text-[var(--text-muted)]">{card.label}</div>
              <div className="text-lg font-extrabold" style={{ color: card.color }}>{card.value}</div>
            </div>
          )
        })}
      </div>

      {/* ── 예산 집행 현황 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-3">
          <PieChart size={16} className="text-primary-500" /> 예산 집행 현황
        </div>

        {/* ── 예산 구분별 탭 ── */}
        {yearCats.length > 0 && (
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedOverviewCatId(null)}
              className={cn(
                'text-[11px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer transition-all border whitespace-nowrap',
                selectedOverviewCatId === null
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'text-[var(--text-secondary)] border-[var(--border-default)] hover:border-primary-400 hover:text-primary-500'
              )}
            >
              전체
            </button>
            {yearCats.map((cat, idx) => {
              const isActive = String(selectedOverviewCatId) === String(cat.id)
              const tc = tabColors[idx % tabColors.length]
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedOverviewCatId(cat.id)}
                  className={cn(
                    'text-[11px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer transition-all border whitespace-nowrap',
                    isActive
                      ? 'text-white border-transparent'
                      : 'text-[var(--text-secondary)] border-[var(--border-default)] hover:border-primary-400 hover:text-primary-500'
                  )}
                  style={isActive ? { background: tc, borderColor: tc } : {}}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">총 편성 예산</div>
            <div className="text-base font-extrabold text-[var(--text-primary)]">{formatNumber(totalBudgetAmt)}원</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">총 집행액</div>
            <div className="text-base font-extrabold text-danger">{formatNumber(totalBudgetSpent)}원</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">잔여예산</div>
            <div className="text-base font-extrabold text-success">{formatNumber(totalBudgetAmt - totalBudgetSpent)}원</div>
          </div>
        </div>
        <div className="h-3.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, budgetRate)}%`,
              background: budgetRate > 100 ? '#ef4444' : budgetRate > 80 ? '#f59e0b' : '#4f6ef7',
            }}
          />
        </div>
        <div
          className="text-right text-xs font-bold mt-1"
          style={{ color: budgetRate > 100 ? '#ef4444' : 'var(--text-muted)' }}
        >
          {budgetRate}% 집행
        </div>
      </div>

      {/* ── 2칼럼: 월별 차트 + 예산 소진율 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 월별 차트 */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-4">
            <Settings2 size={16} className="text-primary-500" /> 월별 수입 · 지출
          </div>
          <div className="flex items-end justify-between gap-2 h-[140px]">
            {Object.entries(monthData).map(([key, d]) => {
              const ih = Math.max(4, (d.income / maxMonthVal) * 120)
              const eh = Math.max(4, (d.expense / maxMonthVal) * 120)
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 h-[120px]">
                    <div
                      className="w-3 rounded-t-sm transition-all duration-500"
                      style={{ height: ih, background: '#22c55e' }}
                      title={`수입 ${formatNumber(d.income)}원`}
                    />
                    <div
                      className="w-3 rounded-t-sm transition-all duration-500"
                      style={{ height: eh, background: '#ef4444' }}
                      title={`지출 ${formatNumber(d.expense)}원`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-[var(--text-muted)]">{key.slice(5)}월</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 justify-center mt-3">
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#22c55e' }} /> 수입
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#ef4444' }} /> 지출
            </span>
          </div>
        </div>

        {/* 예산 소진율 TOP 5 */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-4">
            <PieChart size={16} className="text-primary-500" /> 예산 소진율 TOP 5
          </div>
          {budgetBars.length === 0 ? (
            <EmptyState emoji="📊" title="등록된 예산이 없습니다" />
          ) : (
            <div className="space-y-3">
              {budgetBars.map((b, i) => {
                const color = b.pct > 100 ? '#ef4444' : b.pct > 80 ? '#f59e0b' : '#4f6ef7'
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-[var(--text-primary)] truncate">{b.name}</span>
                      <span className="font-extrabold" style={{ color }}>{b.pct}%{b.pct > 100 ? ' ⚠️' : ''}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, b.pct)}%`, background: color }}
                      />
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {formatNumber(b.spent)}원 / {formatNumber(b.amount)}원
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 최근 전표 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
          <ScrollText size={16} className="text-primary-500" />
          <span className="text-sm font-extrabold text-[var(--text-primary)]">최근 전표</span>
        </div>
        {recentVouchers.length === 0 ? (
          <div className="p-6">
            <EmptyState emoji="📋" title="등록된 전표가 없습니다" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['날짜', '유형', '적요', '차변', '대변'].map((h, i) => (
                    <th key={i} className="py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)] text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentVouchers.map(v => {
                  let ds = 0, cs = 0
                  ;(v.entries || []).forEach(e => {
                    if (e.side === 'debit') ds += e.amount
                    else cs += e.amount
                  })
                  const typeInfo = v.type === 'income'
                    ? { label: '입금', color: '#22c55e', bg: 'rgba(34,197,94,.1)' }
                    : v.type === 'expense'
                      ? { label: '출금', color: '#ef4444', bg: 'rgba(239,68,68,.1)' }
                      : { label: '대체', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' }
                  return (
                    <tr key={v.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{v.date || ''}</td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: typeInfo.bg, color: typeInfo.color }}
                        >
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-primary)] font-bold truncate max-w-[200px]">
                        {v.description || ''}
                      </td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(ds)}원</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-success text-right">{formatNumber(cs)}원</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  )
}

/* ═══════════════════════════════════════════
   예산설정 (Budget) — 레거시 매칭 CRUD
   ═══════════════════════════════════════════ */
function AcctBudget({ year }: { year: number }) {
  const [selectedCatId, setSelectedCatId] = useState<string | number | null>(null)
  const [refresh, setRefresh] = useState(0)

  /* ── 모달 상태 ── */
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catEditId, setCatEditId] = useState<string | number | null>(null)
  const [catForm, setCatForm] = useState({ name: '', bank: '', periodFrom: `${year}-01-01`, periodTo: `${year}-12-31` })

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetEditId, setBudgetEditId] = useState<number | null>(null)
  const [budgetForm, setBudgetForm] = useState({ itemName: '', accountCode: '', amount: '', memo: '' })
  const [itemNameSearch, setItemNameSearch] = useState('')
  const [itemNamePopup, setItemNamePopup] = useState(false)
  const [acctSearch, setAcctSearch] = useState('')
  const [acctPopup, setAcctPopup] = useState(false)

  /* ── 데이터 ── */
  const budgetCats = useMemo(() => {
    const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
    return cats.filter(cat => {
      const catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear())
      return catYear === year
    })
  }, [year, refresh])

  const budgets = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [refresh])
  const accounts = useMemo(() => getItem<{ code: string; name: string; type: string; group?: string }[]>('acct_accounts', []), [refresh])
  const expenseAccounts = accounts.filter(a => a.type === 'expense')
  const itemNameHistory = useMemo(() => getItem<string[]>('acct_itemName_history', []), [refresh])

  // 기타설정의 예산목과 동일: 히스토리 + 기존 예산 데이터의 itemName 합산
  const allItemNames = useMemo(() => {
    return Array.from(new Set([
      ...budgets.map(b => b.itemName).filter(Boolean),
      ...itemNameHistory.filter(Boolean),
    ])).sort()
  }, [budgets, itemNameHistory])

  // 필터링된 예산목 리스트
  const filteredItemNames = useMemo(() => {
    if (!itemNameSearch.trim()) return allItemNames
    const q = itemNameSearch.toLowerCase()
    return allItemNames.filter(n => n.toLowerCase().includes(q))
  }, [allItemNames, itemNameSearch])
  const isNewItemName = itemNameSearch.trim() && !allItemNames.includes(itemNameSearch.trim())

  // 필터링된 계정과목 리스트
  const filteredAccounts = useMemo(() => {
    if (!acctSearch.trim()) return accounts
    const q = acctSearch.toLowerCase()
    return accounts.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q))
  }, [accounts, acctSearch])

  const selCat = selectedCatId ? budgetCats.find(c => String(c.id) === String(selectedCatId)) : budgetCats[0]
  const filtered = selCat ? budgets.filter(b => String(b.catId) === String(selCat.id)) : []
  const totalAmt = filtered.reduce((a, b) => a + (b.amount || 0), 0)
  const totalSpent = filtered.reduce((a, b) => a + (b.spent || 0), 0)

  const colors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  /* ── 구분 CRUD ── */
  const openCatModal = (editId?: string | number) => {
    if (editId) {
      const c = getItem<BudgetCat[]>('acct_budget_cats', []).find(x => String(x.id) === String(editId))
      if (c) {
        setCatEditId(editId)
        setCatForm({ name: c.name || '', bank: c.bank || c.bankInfo || '', periodFrom: c.periodFrom || `${year}-01-01`, periodTo: c.periodTo || `${year}-12-31` })
      }
    } else {
      setCatEditId(null)
      setCatForm({ name: '', bank: '', periodFrom: `${year}-01-01`, periodTo: `${year}-12-31` })
    }
    setCatModalOpen(true)
  }

  const saveCat = () => {
    if (!catForm.name.trim()) return
    const all = getItem<BudgetCat[]>('acct_budget_cats', [])
    if (catEditId) {
      const updated = all.map(c => {
        if (String(c.id) !== String(catEditId)) return c
        const y = catForm.periodFrom ? parseInt(catForm.periodFrom.substring(0, 4)) : year
        return { ...c, name: catForm.name.trim(), bank: catForm.bank, bankInfo: catForm.bank, periodFrom: catForm.periodFrom, periodTo: catForm.periodTo, year: y }
      })
      localStorage.setItem('acct_budget_cats', JSON.stringify(updated))
    } else {
      const y = catForm.periodFrom ? parseInt(catForm.periodFrom.substring(0, 4)) : year
      const newCat: BudgetCat = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: catForm.name.trim(),
        bank: catForm.bank,
        bankInfo: catForm.bank,
        periodFrom: catForm.periodFrom,
        periodTo: catForm.periodTo,
        year: y,
      }
      all.push(newCat)
      localStorage.setItem('acct_budget_cats', JSON.stringify(all))
      setSelectedCatId(newCat.id)
    }
    setCatModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteCat = (id: string | number) => {
    if (!confirm('이 예산구분과 관련 예산항목을 모두 삭제하시겠습니까?')) return
    const sid = String(id)
    const cats = getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => String(c.id) !== sid)
    const bds = getItem<BudgetItem[]>('acct_budgets', []).filter(b => String(b.catId) !== sid)
    localStorage.setItem('acct_budget_cats', JSON.stringify(cats))
    localStorage.setItem('acct_budgets', JSON.stringify(bds))
    if (String(selectedCatId) === sid) setSelectedCatId(null)
    setRefresh(r => r + 1)
  }

  /* ── 예산항목 CRUD ── */
  const openBudgetModal = (editId?: number) => {
    if (editId) {
      const b = budgets.find(x => x.id === editId)
      if (b) {
        setBudgetEditId(editId)
        setBudgetForm({ itemName: b.itemName || '', accountCode: b.accountCode || '', amount: formatNumber(b.amount), memo: b.memo || '' })
      }
    } else {
      setBudgetEditId(null)
      setBudgetForm({ itemName: '', accountCode: '', amount: '', memo: '' })
    }
    setBudgetModalOpen(true)
    setItemNameSearch('')
    setItemNamePopup(false)
    setAcctSearch('')
    setAcctPopup(false)
  }

  const saveBudgetItem = () => {
    if (!budgetForm.itemName.trim()) return
    if (!budgetForm.accountCode) return
    const amt = parseInt(budgetForm.amount.replace(/,/g, '')) || 0
    if (amt <= 0) return
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    if (budgetEditId) {
      const updated = all.map(b => {
        if (b.id !== budgetEditId) return b
        return { ...b, itemName: budgetForm.itemName.trim(), accountCode: budgetForm.accountCode, amount: amt, memo: budgetForm.memo }
      })
      localStorage.setItem('acct_budgets', JSON.stringify(updated))
    } else {
      all.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        catId: selCat!.id,
        year,
        itemName: budgetForm.itemName.trim(),
        accountCode: budgetForm.accountCode,
        amount: amt,
        spent: 0,
        memo: budgetForm.memo,
      })
      localStorage.setItem('acct_budgets', JSON.stringify(all))
    }
    // 새 예산목이면 히스토리에 자동 추가
    const trimName = budgetForm.itemName.trim()
    const hist = getItem<string[]>('acct_itemName_history', [])
    if (!hist.includes(trimName)) {
      setItem('acct_itemName_history', [...hist, trimName])
    }

    setBudgetModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteBudgetItem = (id: number) => {
    if (!confirm('이 예산항목을 삭제하시겠습니까?')) return
    const bds = getItem<BudgetItem[]>('acct_budgets', []).filter(b => b.id !== id)
    localStorage.setItem('acct_budgets', JSON.stringify(bds))
    setRefresh(r => r + 1)
  }

  /* ── 금액 포맷 입력 ── */
  const handleAmountInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setBudgetForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  return (
    <div className="space-y-4">
      {/* ── 예산구분 관리 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
            <PieChart size={16} className="text-primary-500" /> 예산구분 관리
          </div>
          <button
            onClick={() => openCatModal()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-secondary)] hover:border-primary-400 hover:text-primary-500 transition-all cursor-pointer"
          >
            <Plus size={12} /> 구분 추가
          </button>
        </div>
        {budgetCats.length === 0 ? (
          <EmptyState emoji="📁" title={`${year}년 등록된 예산구분이 없습니다. "구분 추가" 버튼으로 먼저 등록하세요.`} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {budgetCats.map((cat, idx) => {
              const isActive = String(cat.id) === String(selCat?.id)
              const catBudgets = budgets.filter(b => String(b.catId) === String(cat.id))
              const amt = catBudgets.reduce((a, b) => a + (b.amount || 0), 0)
              const spent = catBudgets.reduce((a, b) => a + (b.spent || 0), 0)
              const pct = amt > 0 ? Math.round(spent / amt * 100) : 0
              const cc = colors[idx % colors.length]

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={cn(
                    'text-left rounded-xl border cursor-pointer transition-all overflow-hidden',
                    isActive
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]',
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-extrabold" style={{ color: isActive ? cc : 'var(--text-primary)' }}>
                        {cat.name}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${cc}22`, color: cc }}>
                          선택
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-1">🏦 {cat.bankInfo || cat.bank || '-'}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-2">📅 {cat.periodFrom || ''} ~ {cat.periodTo || ''}</div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[var(--text-secondary)]">{catBudgets.length}건</span>
                      <span className="font-bold">{formatNumber(amt)}원</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: pct > 100 ? '#ef4444' : cc }} />
                    </div>
                  </div>
                  {/* 수정 / 삭제 */}
                  <div className="flex border-t border-[var(--border-default)]">
                    <button
                      onClick={e => { e.stopPropagation(); openCatModal(cat.id) }}
                      className="flex-1 py-2 text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer border-r border-[var(--border-default)]"
                    >
                      수정
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteCat(cat.id) }}
                      className="flex-1 py-2 text-[11px] font-bold text-danger hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 예산항목 테이블 ── */}
      {selCat && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <ScrollText size={14} className="text-primary-500" />
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{selCat.name} — 예산항목</span>
              <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
                {filtered.length}건 · {formatNumber(totalAmt)}원
              </span>
            </div>
            <button
              onClick={() => openBudgetModal()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all cursor-pointer"
            >
              <Plus size={12} /> 예산 추가
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState emoji="💰" title="등록된 예산이 없습니다" />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">"예산 추가" 버튼을 눌러 등록하세요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--bg-muted)]">
                    {['예산항목', '계정코드', '편성액', '집행액', '잔여', '소진율', '관리'].map(h => (
                      <th key={h} className={cn("py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]", h === '관리' ? 'text-center w-[80px]' : 'text-left')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => {
                    const pct = b.amount > 0 ? Math.round((b.spent || 0) / b.amount * 100) : 0
                    const color = pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#4f6ef7'
                    return (
                      <tr key={b.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                        <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{b.itemName}</td>
                        <td className="py-2.5 px-3.5 text-[11px] text-[var(--text-muted)] font-mono">{b.accountCode || '-'}</td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)] text-right">{formatNumber(b.amount)}원</td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(b.spent || 0)}원</td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right" style={{ color: (b.amount - (b.spent || 0)) < 0 ? '#ef4444' : '#22c55e' }}>
                          {formatNumber(b.amount - (b.spent || 0))}원
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[80px]">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
                            </div>
                            <span className="text-[11px] font-extrabold" style={{ color }}>{pct}%</span>
                            {pct > 100 && <span className="text-[10px] text-danger font-bold">⚠️</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openBudgetModal(b.id as number)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-500 transition-all cursor-pointer"
                              title="수정"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => deleteBudgetItem(b.id as number)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-red-100 hover:text-danger transition-all cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--bg-muted)]">
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)]" colSpan={2}>합계</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)] text-right">{formatNumber(totalAmt)}원</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(totalSpent)}원</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-success text-right">{formatNumber(totalAmt - totalSpent)}원</td>
                    <td className="py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]">
                      {totalAmt > 0 ? Math.round(totalSpent / totalAmt * 100) : 0}%
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
         모달: 예산구분 추가/수정
         ═══════════════════════════════════════════ */}
      {catModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setCatModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[460px] mx-4 border border-[var(--border-default)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{catEditId ? '예산구분 수정' : '예산구분 추가'}</h3>
              <button onClick={() => setCatModalOpen(false)} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산구분명 *</label>
                <input
                  value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="예) 문화재청, 자체예산"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">통장정보</label>
                <input
                  value={catForm.bank}
                  onChange={e => setCatForm(f => ({ ...f, bank: e.target.value }))}
                  placeholder="예) 기업은행 10110-11001-12"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">시작일</label>
                  <DatePicker value={catForm.periodFrom} onChange={v => setCatForm(f => ({ ...f, periodFrom: v }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">종료일</label>
                  <DatePicker value={catForm.periodTo} onChange={v => setCatForm(f => ({ ...f, periodTo: v }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setCatModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={saveCat} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">저장</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ═══════════════════════════════════════════
         모달: 예산항목 추가/수정
         ═══════════════════════════════════════════ */}
      {budgetModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBudgetModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[460px] mx-4 border border-[var(--border-default)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{budgetEditId ? '예산 수정' : '예산 추가'}</h3>
              <button onClick={() => setBudgetModalOpen(false)} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* 예산목 - 검색 콤보박스 */}
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  예산목 *
                  {isNewItemName && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">+ 새 항목</span>}
                </label>
                <input
                  value={budgetForm.itemName}
                  onChange={e => {
                    setBudgetForm(f => ({ ...f, itemName: e.target.value }))
                    setItemNameSearch(e.target.value)
                    setItemNamePopup(true)
                    setAcctPopup(false)
                  }}
                  onFocus={() => { setItemNamePopup(true); setAcctPopup(false); setItemNameSearch(budgetForm.itemName) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (filteredItemNames.length > 0) {
                        const first = filteredItemNames[0]
                        setBudgetForm(f => ({ ...f, itemName: first }))
                        setItemNameSearch(first)
                      }
                      setItemNamePopup(false)
                    }
                  }}
                  placeholder="예산목을 검색하거나 새로 입력하세요"
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors',
                    isNewItemName ? 'border-emerald-400' : 'border-[var(--border-default)]'
                  )}
                  autoFocus
                />
                {itemNamePopup && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-[220px] overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto p-1.5">
                      {filteredItemNames.map(name => (
                        <button key={name}
                          onClick={() => {
                            setBudgetForm(f => ({ ...f, itemName: name }))
                            setItemNameSearch(name)
                            setItemNamePopup(false)
                          }}
                          className={cn('w-full text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer transition-colors',
                            budgetForm.itemName === name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}
                        >
                          {name}
                        </button>
                      ))}
                      {filteredItemNames.length === 0 && budgetForm.itemName.trim() && (
                        <div className="text-center text-xs py-3 space-y-1">
                          <div className="text-emerald-500 font-bold">✨ "{budgetForm.itemName.trim()}"</div>
                          <div className="text-[var(--text-muted)]">새 예산목으로 등록됩니다</div>
                        </div>
                      )}
                      {filteredItemNames.length === 0 && !budgetForm.itemName.trim() && (
                        <div className="text-center text-xs text-[var(--text-muted)] py-3">등록된 예산목이 없습니다</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 계정과목 - 검색 콤보박스 */}
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">계정과목 *</label>
                <div
                  onClick={() => { setAcctPopup(!acctPopup); setItemNamePopup(false) }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm cursor-pointer hover:border-primary-400 transition-colors min-h-[40px] flex items-center"
                >
                  {budgetForm.accountCode ? (
                    <span className="text-[var(--text-primary)] font-semibold">
                      <span className="text-primary-500 font-mono">{budgetForm.accountCode}</span>
                      {' '}{accounts.find(a => a.code === budgetForm.accountCode)?.name || ''}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">계정과목을 선택하세요</span>
                  )}
                </div>
                {acctPopup && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-[280px] overflow-hidden">
                    <div className="p-2 border-b border-[var(--border-default)]">
                      <input
                        value={acctSearch}
                        onChange={e => setAcctSearch(e.target.value)}
                        placeholder="코드 또는 이름으로 검색..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] outline-none focus:border-primary-400"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto p-1.5">
                      {filteredAccounts.map(a => (
                        <button key={a.code}
                          onClick={() => {
                            setBudgetForm(f => ({ ...f, accountCode: a.code }))
                            setAcctPopup(false)
                            setAcctSearch('')
                          }}
                          className={cn('w-full text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2',
                            budgetForm.accountCode === a.code ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}
                        >
                          <span className="font-mono text-primary-500 text-[11px] font-bold w-[40px] shrink-0">{a.code}</span>
                          <span className="flex-1">{a.name}</span>
                          <span className="text-[9px] text-[var(--text-muted)] shrink-0">{a.group || a.type}</span>
                        </button>
                      ))}
                      {filteredAccounts.length === 0 && (
                        <div className="text-center text-xs text-[var(--text-muted)] py-3">검색 결과가 없습니다</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">연간 예산액 (원) *</label>
                <input
                  value={budgetForm.amount}
                  onChange={e => handleAmountInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveBudgetItem() }}
                  placeholder="예) 50,000,000"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">메모</label>
                <input
                  value={budgetForm.memo}
                  onChange={e => setBudgetForm(f => ({ ...f, memo: e.target.value }))}
                  placeholder="예산 설명"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setBudgetModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={saveBudgetItem} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">저장</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

/* ═══════════════════════════════════════════
   품의 (Approval) — CRUD
   ═══════════════════════════════════════════ */
function AcctApproval({ year }: { year: number }) {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: 'admin', approver: '' })
  const staffList = useStaffStore(s => s.staff).filter(s => !s.resignedAt)

  /* 예산과목 목록 (예산구분 > 항목) */
  const budgetCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => c.year === year), [year, refresh])
  const budgetItems = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []).filter(b => b.year === year), [year, refresh])

  const approvals = useMemo(() => {
    const all = getItem<Approval[]>('acct_approvals', [])
    return all.filter(a => {
      const dateStr = a.date || a.createdAt
      return dateStr && parseInt(String(dateStr).substring(0, 4)) === year
    }).sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''))
  }, [year, refresh])

  const statusInfo: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '대기', color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
    approved: { label: '승인', color: '#22c55e', bg: 'rgba(34,197,94,.1)' },
    rejected: { label: '반려', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
    expensed: { label: '지출완료', color: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
    vouchered: { label: '전표완료', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
  }

  const counts = {
    all: approvals.length,
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
  }

  const handleAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const saveApproval = () => {
    if (!form.title.trim()) return alert('품의명을 입력해주세요')
    const amt = parseInt(form.amount.replace(/,/g, '')) || 0
    if (amt <= 0) return alert('금액을 입력해주세요')
    if (!form.approver) return alert('승인자를 선택해주세요')
    const all = getItem<Approval[]>('acct_approvals', [])
    all.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      title: form.title.trim(),
      amount: amt,
      date: form.date,
      status: 'pending',
      accountCode: form.accountCode,
      description: form.description,
      applicant: form.applicant,
      approver: form.approver,
      createdAt: new Date().toISOString(),
    })
    setItem('acct_approvals', all)
    setModalOpen(false)
    setForm({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: 'admin', approver: '' })
    setRefresh(r => r + 1)
  }

  const updateStatus = (id: string | number, status: string) => {
    const all = getItem<Approval[]>('acct_approvals', [])
    const updated = all.map(a => String(a.id) === String(id) ? { ...a, status } : a)
    setItem('acct_approvals', updated)
    setRefresh(r => r + 1)
  }

  const deleteApproval = (id: string | number) => {
    if (!confirm('이 품의를 삭제하시겠습니까?')) return
    const all = getItem<Approval[]>('acct_approvals', []).filter(a => String(a.id) !== String(id))
    setItem('acct_approvals', all)
    setRefresh(r => r + 1)
  }

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '전체', value: counts.all, color: '#4f6ef7' },
          { label: '대기', value: counts.pending, color: '#f59e0b' },
          { label: '승인', value: counts.approved, color: '#22c55e' },
          { label: '반려', value: counts.rejected, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 text-center">
            <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-bold text-[var(--text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 목록 */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <FileCheck size={14} className="text-primary-500" />
            <span className="text-sm font-extrabold text-[var(--text-primary)]">품의 목록</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all cursor-pointer"
          >
            <Plus size={13} /> 품의 등록
          </button>
        </div>
        {approvals.length === 0 ? (
          <div className="p-6"><EmptyState emoji="📋" title="등록된 품의가 없습니다" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['날짜', '제목', '금액', '상태', '관리'].map(h => (
                    <th key={h} className="py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)] text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvals.map(a => {
                  const si = statusInfo[a.status] || statusInfo.pending
                  return (
                    <tr key={a.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{a.date || a.createdAt || ''}</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{a.title || '-'}</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right text-[var(--text-primary)]">{formatNumber(a.amount || 0)}원</td>
                      <td className="py-2.5 px-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: si.bg, color: si.color }}>
                          {si.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1">
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(a.id, 'approved')} title="승인" className="p-1 rounded-md bg-[rgba(34,197,94,.1)] text-[#22c55e] hover:bg-[rgba(34,197,94,.2)] cursor-pointer transition-colors">
                                <Check size={12} />
                              </button>
                              <button onClick={() => updateStatus(a.id, 'rejected')} title="반려" className="p-1 rounded-md bg-[rgba(239,68,68,.1)] text-[#ef4444] hover:bg-[rgba(239,68,68,.2)] cursor-pointer transition-colors">
                                <Ban size={12} />
                              </button>
                            </>
                          )}
                          <button onClick={() => deleteApproval(a.id)} title="삭제" className="p-1 rounded-md bg-[rgba(239,68,68,.06)] text-[#ef4444] hover:bg-[rgba(239,68,68,.15)] cursor-pointer transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 품의 등록 모달 */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">품의 등록</span>
              <button onClick={() => setModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* 품의명 */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">품의명 *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예) 사무용품 구매" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
              {/* 예산과목 + 금액 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산과목 *</label>
                  <CustomSelect
                    value={form.accountCode}
                    onChange={v => setForm(f => ({ ...f, accountCode: v }))}
                    placeholder="— 선택 —"
                    options={[
                      { value: '', label: '— 선택 —' },
                      ...budgetCats.flatMap(cat =>
                        budgetItems.filter(b => b.catId === cat.id).map(b => ({
                          value: b.accountCode || b.itemName,
                          label: `${cat.name} > ${b.itemName}`,
                        }))
                      ),
                    ]}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">금액 (원) *</label>
                  <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none text-right font-bold" />
                </div>
              </div>
              {/* 신청자 + 승인자 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">신청자</label>
                  <input value={form.applicant} onChange={e => setForm(f => ({ ...f, applicant: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] outline-none" readOnly />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">승인자 *</label>
                  <CustomSelect
                    value={form.approver}
                    onChange={v => setForm(f => ({ ...f, approver: v }))}
                    placeholder="— 선택 —"
                    options={[
                      { value: '', label: '— 선택 —' },
                      ...staffList.map(s => ({
                        value: s.name,
                        label: `${s.name}${s.rank ? ` (${s.rank})` : ''}${s.dept ? ` - ${s.dept}` : ''}`,
                      })),
                    ]}
                  />
                </div>
              </div>
              {/* 사유/메모 */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">사유/메모</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="품의 사유를 입력해주세요" rows={3} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border-default)]">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
              <button onClick={saveApproval} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer">등록</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

/* ═══════════════════════════════════════════
   전표 입력 (지출/입금/출금) — CRUD
   ═══════════════════════════════════════════ */
function AcctVoucherEntry({ year, type }: { year: number; type: 'expense' | 'income' | 'withdrawal' }) {
  const [refresh, setRefresh] = useState(0)
  const typeLabels = { expense: '지출하기', income: '입금전표', withdrawal: '출금전표' }
  const typeEmojis = { expense: '💸', income: '💵', withdrawal: '🏧' }
  const typeColors = { expense: '#ef4444', income: '#22c55e', withdrawal: '#f59e0b' }
  const typeGrads = { expense: 'from-[#ef4444] to-[#dc2626]', income: 'from-[#22c55e] to-[#16a34a]', withdrawal: 'from-[#f59e0b] to-[#d97706]' }

  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ desc: '', amount: '', counter: '', method: type === 'income' ? '계좌이체' : '계좌이체', writeDate: today, tradeDate: today })
  const [counterSearch, setCounterSearch] = useState('')
  const [showCounterList, setShowCounterList] = useState(false)
  const counterRef = useRef<HTMLDivElement>(null)
  const [descMode, setDescMode] = useState<'select' | 'input'>('select')

  /* 예산목 목록 (기타설정의 예산목 데이터) */
  const budgetItemNames = useMemo(() => {
    const budgets: { itemName: string }[] = getItem('acct_budgets', [])
    const hist: string[] = getItem('acct_itemName_history', [])
    return Array.from(new Set([
      ...budgets.map(b => b.itemName).filter(Boolean),
      ...hist.filter(Boolean),
    ])).sort()
  }, [refresh])

  /* 거래처 리스트 (거래처관리 연동) */
  const vendorOptions = useMemo(() => {
    const vendors: { id: number; name: string }[] = getItem('acct_vendors', [])
    return vendors.map(v => ({ value: v.name, label: v.name }))
  }, [refresh])

  /* 거래처 드롭다운 외부 클릭 닫기 */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (counterRef.current && !counterRef.current.contains(e.target as Node)) setShowCounterList(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const cashflows = useMemo(() => {
    const all = getItem<CashFlow[]>('acct_cashflows', [])
    return all.filter(c => {
      if (!c.date) return false
      if (parseInt(c.date.substring(0, 4)) !== year) return false
      return c.type === type || (type === 'withdrawal' && c.type === 'expense')
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [year, type, refresh])

  const totalAmount = cashflows.reduce((a, c) => a + (c.amount || 0), 0)

  const handleAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const uid = () => Date.now() + Math.floor(Math.random() * 1000)

  const saveEntry = () => {
    if (!form.desc.trim()) { alert('내용을 입력하세요'); return }
    const amt = parseInt(form.amount.replace(/,/g, '')) || 0
    if (amt <= 0) { alert('금액을 입력하세요'); return }

    const cfId = uid()
    const vId = uid()

    // 전표 자동 생성
    const vouchers = getItem<Voucher[]>('acct_vouchers', [])
    let vEntries: { side: string; accountCode: string; amount: number }[]
    if (type === 'income') {
      const debitAcct = form.method === '현금' ? '1010' : '1020'
      vEntries = [
        { side: 'debit', accountCode: debitAcct, amount: amt },
        { side: 'credit', accountCode: '4030', amount: amt },
      ]
    } else {
      vEntries = [
        { side: 'debit', accountCode: '5110', amount: amt },
        { side: 'credit', accountCode: form.method === '현금' ? '1010' : '1020', amount: amt },
      ]
    }
    vouchers.push({
      id: vId, date: form.tradeDate, type: type === 'withdrawal' ? 'expense' : type,
      description: form.desc, entries: vEntries,
      createdAt: new Date().toISOString(),
    })
    setItem('acct_vouchers', vouchers)

    // 캐시플로 등록
    const cfs = getItem<CashFlow[]>('acct_cashflows', [])
    cfs.push({
      id: cfId, date: form.tradeDate, type: type === 'withdrawal' ? 'expense' : type,
      amount: amt, description: form.desc, accountCode: type === 'income' ? '4030' : '5110',
      counter: form.counter, writeDate: form.writeDate,
    })
    setItem('acct_cashflows', cfs)

    setForm({ desc: '', amount: '', counter: '', method: type === 'income' ? '계좌이체' : '계좌이체', writeDate: today, tradeDate: today })
    setCounterSearch('')
    setRefresh(r => r + 1)
  }

  const deleteEntry = (id: string | number) => {
    if (!confirm('삭제하시겠습니까?')) return
    const cfs = getItem<CashFlow[]>('acct_cashflows', []).filter(c => String(c.id) !== String(id))
    setItem('acct_cashflows', cfs)
    setRefresh(r => r + 1)
  }

  const methods = useMemo(() => {
    const stored: string[] = getItem('acct_payment_methods', ['계좌이체', '현금', '카드', '법인카드', '기타'])
    return stored.length > 0 ? stored : ['계좌이체', '현금', '카드', '법인카드', '기타']
  }, [refresh])

  return (
    <div className="space-y-4">
      {/* ── 등록 폼 ── */}
      <div className={`bg-gradient-to-r ${typeGrads[type]} rounded-2xl p-4 text-white`}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">{typeEmojis[type]}</div>
          <div>
            <div className="text-[17px] font-extrabold">간편 {typeLabels[type]}</div>
            <div className="text-[11.5px] opacity-85">{type === 'income' ? '입금' : '지출'} 내역을 입력하세요</div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">
              {type === 'income' ? '입금 내용' : '지출내용(예산목록)'} *
            </label>
            {type !== 'income' && budgetItemNames.length > 0 ? (
              <div className="relative">
                {descMode === 'select' ? (
                  <>
                    <CustomSelect
                      value={form.desc}
                      onChange={v => {
                        if (v === '__direct__') {
                          setDescMode('input')
                          setForm(f => ({ ...f, desc: '' }))
                        } else {
                          setForm(f => ({ ...f, desc: v }))
                        }
                      }}
                      placeholder="— 예산목 선택 —"
                      options={[
                        { value: '', label: '— 예산목 선택 —' },
                        ...budgetItemNames.map(name => ({ value: name, label: name })),
                        { value: '__direct__', label: '✏️ 직접 입력' },
                      ]}
                    />
                  </>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      value={form.desc}
                      onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                      placeholder="지출 내용을 직접 입력"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setDescMode('select'); setForm(f => ({ ...f, desc: '' })) }}
                      className="px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[10.5px] font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer whitespace-nowrap"
                    >
                      목록
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="예) 4월 매출" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            )}
          </div>
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">금액 (원) *</label>
            <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right focus:border-primary-500 outline-none" style={{ color: typeColors[type] }} />
          </div>
          <div ref={counterRef} className="relative">
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">거래처</label>
            <input
              value={counterSearch || form.counter}
              onChange={e => { setCounterSearch(e.target.value); setShowCounterList(true); setForm(f => ({ ...f, counter: '' })) }}
              onFocus={() => setShowCounterList(true)}
              placeholder="거래처명 검색..."
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
            />
            {showCounterList && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg">
                {vendorOptions
                  .filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase()))
                  .map((v, i) => (
                    <button key={i} onClick={() => { setForm(f => ({ ...f, counter: v.value })); setCounterSearch(''); setShowCounterList(false) }}
                      className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-none bg-transparent">
                      {v.label}
                    </button>
                  ))}
                {vendorOptions.filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase())).length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-[var(--text-muted)]">검색 결과가 없습니다</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '입금' : '지출'}수단</label>
            <CustomSelect
              value={form.method}
              onChange={v => setForm(f => ({ ...f, method: v }))}
              options={methods.map(m => ({ value: m, label: m }))}
            />
          </div>
          {type !== 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">전표작성일자</label>
            <DatePicker value={form.writeDate} onChange={v => setForm(f => ({ ...f, writeDate: v }))} />
          </div>
          )}
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">실제거래일자</label>
            <DatePicker value={form.tradeDate} onChange={v => setForm(f => ({ ...f, tradeDate: v }))} />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={saveEntry} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r ${typeGrads[type]}`}>
            <Save size={14} /> {type === 'income' ? '입금' : '지출'} 등록
          </button>
        </div>
      </div>

      {/* ── 내역 리스트 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <ScrollText size={14} className="text-primary-500" />
            <span className="text-sm font-extrabold text-[var(--text-primary)]">{type === 'income' ? '입금' : '지출'} 내역</span>
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{cashflows.length}건</span>
          </div>
          <span className="text-[13px] font-extrabold" style={{ color: typeColors[type] }}>{formatNumber(totalAmount)}원</span>
        </div>
        {cashflows.length === 0 ? (
          <div className="p-6"><EmptyState emoji={typeEmojis[type]} title={`등록된 ${type === 'income' ? '입금' : '지출'}이 없습니다`} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['날짜', '내용', '금액', '삭제'].map(h => (
                    <th key={h} className={cn('py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]', h === '금액' ? 'text-right' : h === '삭제' ? 'text-center w-[60px]' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashflows.map(c => (
                  <tr key={c.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{c.date || ''}</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{c.description || '-'}</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right" style={{ color: typeColors[type] }}>{formatNumber(c.amount || 0)}원</td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button onClick={() => deleteEntry(c.id)} className="p-1 rounded-md bg-[rgba(239,68,68,.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,.15)] cursor-pointer"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   전표장부 (Payment Ledger) — CRUD
   ═══════════════════════════════════════════ */
function AcctPaymentLedger({ year }: { year: number }) {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | number | null>(null)
  const [vmDate, setVmDate] = useState(new Date().toISOString().slice(0, 10))
  const [vmType, setVmType] = useState<'expense' | 'income' | 'transfer'>('expense')
  const [vmDesc, setVmDesc] = useState('')
  const [vmEntries, setVmEntries] = useState<{ side: string; accountCode: string; amount: string }[]>([
    { side: 'debit', accountCode: '', amount: '' },
    { side: 'credit', accountCode: '', amount: '' },
  ])

  const accounts = useMemo(() => getItem<{ code: string; name: string; type: string }[]>('acct_accounts', []), [])

  const vouchers = useMemo(() => {
    const all = getItem<Voucher[]>('acct_vouchers', [])
    return all.filter(v => v.date && parseInt(v.date.substring(0, 4)) === year)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [year, refresh])

  const incCnt = vouchers.filter(v => v.type === 'income').length
  const expCnt = vouchers.filter(v => v.type === 'expense').length
  const etcCnt = vouchers.length - incCnt - expCnt

  const openModal = (id?: string | number) => {
    if (id) {
      const v = getItem<Voucher[]>('acct_vouchers', []).find(x => String(x.id) === String(id))
      if (v) {
        setEditId(id)
        setVmDate(v.date || new Date().toISOString().slice(0, 10))
        setVmType((v.type as 'expense' | 'income' | 'transfer') || 'expense')
        setVmDesc(v.description || '')
        setVmEntries((v.entries || []).map(e => ({
          side: e.side,
          accountCode: e.accountCode || '',
          amount: e.amount ? formatNumber(e.amount) : '',
        })))
      }
    } else {
      setEditId(null)
      setVmDate(new Date().toISOString().slice(0, 10))
      setVmType('expense')
      setVmDesc('')
      setVmEntries([
        { side: 'debit', accountCode: '', amount: '' },
        { side: 'credit', accountCode: '', amount: '' },
      ])
    }
    setModalOpen(true)
  }

  const addEntry = () => setVmEntries(prev => [...prev, { side: 'debit', accountCode: '', amount: '' }])
  const removeEntry = (idx: number) => setVmEntries(prev => prev.filter((_, i) => i !== idx))

  const saveVoucher = () => {
    if (!vmDesc.trim()) { alert('적요를 입력하세요'); return }
    const entries = vmEntries
      .map(e => ({ side: e.side, accountCode: e.accountCode, amount: parseInt(e.amount.replace(/,/g, '')) || 0 }))
      .filter(e => e.accountCode && e.amount > 0)
    if (entries.length < 2) { alert('차변/대변 항목을 최소 2개 입력하세요'); return }

    const all = getItem<Voucher[]>('acct_vouchers', [])
    if (editId) {
      const updated = all.map(v => String(v.id) === String(editId)
        ? { ...v, date: vmDate, type: vmType, description: vmDesc, entries }
        : v
      )
      setItem('acct_vouchers', updated)
    } else {
      all.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: vmDate, type: vmType, description: vmDesc, entries,
        createdAt: new Date().toISOString(),
      })
      setItem('acct_vouchers', all)
    }
    setModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteVoucher = (id: string | number) => {
    if (!confirm('이 전표를 삭제하시겠습니까?')) return
    const all = getItem<Voucher[]>('acct_vouchers', []).filter(v => String(v.id) !== String(id))
    setItem('acct_vouchers', all)
    setRefresh(r => r + 1)
  }

  const typeColors: Record<string, string> = { income: '#22c55e', expense: '#ef4444', transfer: '#f59e0b' }
  const typeLabels: Record<string, string> = { income: '입금', expense: '출금', transfer: '대체' }
  const typeBgs: Record<string, string> = { income: 'rgba(34,197,94,.1)', expense: 'rgba(239,68,68,.1)', transfer: 'rgba(245,158,11,.1)' }

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="text-[17px] font-extrabold">전표장부</div>
              <div className="text-[11.5px] opacity-85">모든 전표 조회·수정 (회계담당자용)</div>
            </div>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-1.5 px-3.5 py-2 bg-white/20 border border-white/40 rounded-xl text-[13px] font-bold cursor-pointer hover:bg-white/30 transition-colors">
            <Plus size={14} /> 등록
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '총 전표', value: vouchers.length, bg: 'rgba(255,255,255,.18)' },
            { label: '입금', value: incCnt, bg: 'rgba(34,197,94,.2)' },
            { label: '출금', value: expCnt, bg: 'rgba(239,68,68,.2)' },
            { label: '대체', value: etcCnt, bg: 'rgba(245,158,11,.2)' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2 text-center" style={{ background: s.bg }}>
              <div className="text-[9px] opacity-80">{s.label}</div>
              <div className="text-[16px] font-extrabold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 전표 목록 */}
      {vouchers.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8">
          <EmptyState emoji="📒" title="등록된 전표가 없습니다" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {vouchers.map(v => {
            let ds = 0, cs = 0
            ;(v.entries || []).forEach(e => { if (e.side === 'debit') ds += e.amount; else cs += e.amount })
            const tc = typeColors[v.type || ''] || '#8b5cf6'
            const tl = typeLabels[v.type || ''] || '대체'
            const tb = typeBgs[v.type || ''] || 'rgba(139,92,246,.1)'
            return (
              <div key={v.id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden" style={{ borderLeft: `4px solid ${tc}` }}>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold">{v.date || ''}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tb, color: tc }}>{tl}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(v.id)} className="p-1 rounded-md bg-[rgba(79,110,247,.1)] text-[#4f6ef7] hover:bg-[rgba(79,110,247,.2)] cursor-pointer"><Edit3 size={12} /></button>
                    <button onClick={() => deleteVoucher(v.id)} className="p-1 rounded-md bg-[rgba(239,68,68,.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,.15)] cursor-pointer"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <div className="text-[14px] font-bold text-[var(--text-primary)] mb-2">{v.description || ''}</div>
                  <div className="bg-[var(--bg-muted)] rounded-lg p-2.5 space-y-1.5">
                    {(v.entries || []).map((e, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: e.side === 'debit' ? 'rgba(79,110,247,.12)' : 'rgba(239,68,68,.12)', color: e.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>
                            {e.side === 'debit' ? '차변' : '대변'}
                          </span>
                          <span className="text-[12px] text-[var(--text-secondary)]">{e.accountCode}</span>
                        </div>
                        <span className="text-[12px] font-bold" style={{ color: e.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>{formatNumber(e.amount)}원</span>
                      </div>
                    ))}
                    <div className="border-t border-[var(--border-default)] pt-1.5 flex justify-between">
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">합계</span>
                      <span className="text-[13px] font-extrabold" style={{ color: tc }}>{formatNumber(ds)}원</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 전표 등록/수정 모달 */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-[600px] mx-0 md:mx-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{editId ? '전표 수정' : '전표 등록'}</span>
              <button onClick={() => setModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">날짜 *</label>
                <DatePicker value={vmDate} onChange={setVmDate} />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">유형</label>
                <div className="flex gap-2">
                  {(['expense', 'income', 'transfer'] as const).map(t => {
                    const active = vmType === t
                    const c = typeColors[t] || '#4f6ef7'
                    return (
                      <button key={t} onClick={() => setVmType(t)} className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all border', active ? 'text-white' : 'text-[var(--text-muted)] border-[var(--border-default)] bg-[var(--bg-muted)]')} style={active ? { background: c, borderColor: c } : {}}>
                        {typeLabels[t] || t}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">적요 *</label>
                <input value={vmDesc} onChange={e => setVmDesc(e.target.value)} placeholder="거래 내용" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-2 block">차변 / 대변 항목</label>
                <div className="space-y-2">
                  {vmEntries.map((entry, idx) => (
                    <div key={idx} className="bg-[var(--bg-muted)] rounded-xl p-3 space-y-2 relative">
                      {idx >= 2 && (
                        <button onClick={() => removeEntry(idx)} className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded bg-[rgba(239,68,68,.1)] text-[#ef4444] cursor-pointer text-[10px]"><X size={10} /></button>
                      )}
                      <div className="flex gap-2">
                        <select value={entry.side} onChange={e => { const v = e.target.value; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, side: v } : en)) }} className="w-[80px] px-2 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold outline-none" style={{ color: entry.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>
                          <option value="debit">차변</option>
                          <option value="credit">대변</option>
                        </select>
                        <select value={entry.accountCode} onChange={e => { const v = e.target.value; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, accountCode: v } : en)) }} className="flex-1 px-2 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] outline-none">
                          <option value="">계정과목 선택</option>
                          {accounts.map(a => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}
                        </select>
                      </div>
                      <input value={entry.amount} onChange={e => { const digits = e.target.value.replace(/[^\d]/g, ''); const formatted = digits ? Number(digits).toLocaleString('ko-KR') : ''; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, amount: formatted } : en)) }} placeholder="금액" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right outline-none" />
                    </div>
                  ))}
                </div>
                <button onClick={addEntry} className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-[var(--border-default)] text-[13px] font-semibold text-[var(--text-muted)] cursor-pointer hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-1.5">
                  <Plus size={14} /> 항목 추가
                </button>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)]">취소</button>
              <button onClick={saveVoucher} className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md">저장</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

/* ═══════════════════════════════════════════
   서브 페이지 플레이스홀더
   ═══════════════════════════════════════════ */
function AcctSubPlaceholder({ pageKey, label }: { pageKey: string; label: string }) {
  const descriptions: Record<string, string> = {
    budget: '예산구분별 연간 예산을 설정하고 소진 현황을 확인합니다',
    balance: '회계연도 초기 잔액을 설정합니다',
    approval: '품의서를 작성하고 결재 상태를 관리합니다',
    expense: '지출 전표를 등록하고 관리합니다',
    income: '입금 전표를 등록하고 관리합니다',
    withdrawal: '출금 전표를 등록하고 관리합니다',
    payment: '전체 전표 장부를 조회합니다',
    reports: '수입·지출 현황을 분석합니다',
  }

  const emojis: Record<string, string> = {
    budget: '💰', balance: '🏦', approval: '📋', expense: '💸',
    income: '💵', withdrawal: '🏧', payment: '📒', reports: '📊',
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl py-16 text-center">
      <p className="text-4xl mb-3">{emojis[pageKey] || '🔧'}</p>
      <p className="text-base font-bold text-[var(--text-primary)]">{label}</p>
      <p className="text-[12px] text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
        {descriptions[pageKey] || '이 기능은 준비 중입니다.'}
      </p>
      <p className="text-[11px] text-[var(--text-muted)] mt-4 bg-[var(--bg-muted)] inline-block px-4 py-1.5 rounded-full">
        Phase 4에서 구현 예정
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════
   거래처관리 — CRUD
   ═══════════════════════════════════════════ */
interface Vendor {
  id: number
  /* 기본정보 */
  name: string
  zipCode?: string
  address1?: string      // 다음 API 주소
  address2?: string      // 상세주소
  phone?: string
  /* 연락처정보 */
  ceoName?: string
  ceoPhone?: string
  managerName?: string
  managerPhone?: string
  /* 사업자정보 */
  bizNo?: string
  bizType?: string       // 업태
  bizCategory?: string   // 업종
  invoiceEmail?: string  // 계산서이메일
  bizRegImage?: string   // 사업자등록증 base64
  /* 비고 */
  memo?: string
  /* 하위 호환 */
  address?: string
}

const EMPTY_VENDOR: Omit<Vendor, 'id'> = {
  name: '', zipCode: '', address1: '', address2: '', phone: '',
  ceoName: '', ceoPhone: '', managerName: '', managerPhone: '',
  bizNo: '', bizType: '', bizCategory: '', invoiceEmail: '', bizRegImage: '',
  memo: '',
}

/* 섹션 헤더 */
function SectionHeader({ icon, title, color }: { icon: string; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <span className="text-sm">{icon}</span>
      <span className="text-[12px] font-extrabold tracking-tight" style={{ color }}>{title}</span>
      <div className="flex-1 h-px bg-[var(--border-default)]" />
    </div>
  )
}

/* 필드 */
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"

/* 자동 하이픈 포맷터 */
function fmtPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.startsWith('02')) {
    if (d.length <= 2) return d
    if (d.length <= 6) return `${d.slice(0, 2)}-${d.slice(2)}`
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`
  }
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

function fmtBizNo(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

function AcctVendors() {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Omit<Vendor, 'id'>>(EMPTY_VENDOR)
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null)

  const vendors = useMemo(() => {
    const all = getItem<Vendor[]>('acct_vendors', [])
    if (!search.trim()) return all
    const q = search.trim().toLowerCase()
    return all.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.bizNo?.toLowerCase().includes(q) ||
      v.ceoName?.toLowerCase().includes(q) ||
      v.managerName?.toLowerCase().includes(q)
    )
  }, [refresh, search])

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY_VENDOR })
    setModalOpen(true)
  }

  const openEdit = (v: Vendor) => {
    setEditId(v.id)
    setForm({
      name: v.name, zipCode: v.zipCode || '', address1: v.address1 || v.address || '', address2: v.address2 || '', phone: v.phone || '',
      ceoName: v.ceoName || '', ceoPhone: v.ceoPhone || '',
      managerName: v.managerName || '', managerPhone: v.managerPhone || '',
      bizNo: v.bizNo || '', bizType: v.bizType || '', bizCategory: v.bizCategory || '',
      invoiceEmail: v.invoiceEmail || '', bizRegImage: v.bizRegImage || '', memo: v.memo || '',
    })
    setModalOpen(true)
  }

  const openView = (v: Vendor) => {
    setViewVendor(v)
    setViewOpen(true)
  }

  const saveVendor = () => {
    if (!form.name.trim()) { alert('거래처명을 입력하세요'); return }
    const all = getItem<Vendor[]>('acct_vendors', [])
    if (editId) {
      const updated = all.map(v => v.id === editId ? { ...v, ...form } : v)
      setItem('acct_vendors', updated)
    } else {
      all.push({ id: Date.now(), ...form })
      setItem('acct_vendors', all)
    }
    setModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteVendor = (id: number) => {
    if (!confirm('이 거래처를 삭제하시겠습니까?')) return
    const all = getItem<Vendor[]>('acct_vendors', []).filter(v => v.id !== id)
    setItem('acct_vendors', all)
    setRefresh(r => r + 1)
  }

  /* ── 등록/수정 폼 렌더 ── */
  const renderForm = () => (
    <div className="space-y-4">
      {/* 기본정보 */}
      <SectionHeader icon="🏢" title="기본정보" color="#4f6ef7" />
      <FormField label="거래처명" required>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예) (주)한국전자" className={inputCls} />
      </FormField>
      <FormField label="사업장주소">
        <div className="flex gap-2 mb-2">
          <input value={form.zipCode} readOnly placeholder="우편번호" className={`${inputCls} flex-1 bg-[var(--bg-muted)] cursor-default`} />
          <button
            type="button"
            onClick={() => {
              const daumPostcode = (window as any).daum?.Postcode
              if (!daumPostcode) { alert('우편번호 검색 서비스를 불러오는 중입니다...'); return }
              new daumPostcode({
                oncomplete: (data: any) => {
                  setForm(f => ({ ...f, zipCode: data.zonecode, address1: data.roadAddress || data.jibunAddress }))
                },
              }).open()
            }}
            className="px-3 py-2.5 rounded-lg bg-primary-500 text-white text-[11px] font-bold cursor-pointer shrink-0 hover:bg-primary-600 transition-colors"
          >🔍 우편번호 검색</button>
        </div>
        <input value={form.address1} readOnly placeholder="주소" className={`${inputCls} bg-[var(--bg-muted)] cursor-default mb-2`} />
        <input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} placeholder="상세주소를 입력하세요" className={inputCls} />
      </FormField>
      <FormField label="전화번호">
        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: fmtPhone(e.target.value) }))} placeholder="02-0000-0000" className={inputCls} maxLength={13} />
      </FormField>

      {/* 연락처정보 */}
      <SectionHeader icon="📞" title="연락처정보" color="#22c55e" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="대표자명">
          <input value={form.ceoName} onChange={e => setForm(f => ({ ...f, ceoName: e.target.value }))} placeholder="대표자명" className={inputCls} />
        </FormField>
        <FormField label="대표자연락처">
          <input value={form.ceoPhone} onChange={e => setForm(f => ({ ...f, ceoPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inputCls} maxLength={13} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="담당자명">
          <input value={form.managerName} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))} placeholder="담당자명" className={inputCls} />
        </FormField>
        <FormField label="담당자연락처">
          <input value={form.managerPhone} onChange={e => setForm(f => ({ ...f, managerPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inputCls} maxLength={13} />
        </FormField>
      </div>

      {/* 사업자정보 */}
      <SectionHeader icon="📋" title="사업자정보" color="#f59e0b" />
      <FormField label="사업자번호">
        <input value={form.bizNo} onChange={e => setForm(f => ({ ...f, bizNo: fmtBizNo(e.target.value) }))} placeholder="000-00-00000" className={inputCls} maxLength={12} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="업태">
          <input value={form.bizType} onChange={e => setForm(f => ({ ...f, bizType: e.target.value }))} placeholder="예) 제조, 서비스" className={inputCls} />
        </FormField>
        <FormField label="업종">
          <input value={form.bizCategory} onChange={e => setForm(f => ({ ...f, bizCategory: e.target.value }))} placeholder="예) 전자부품" className={inputCls} />
        </FormField>
      </div>
      <FormField label="계산서이메일">
        <input type="email" value={form.invoiceEmail} onChange={e => setForm(f => ({ ...f, invoiceEmail: e.target.value }))} placeholder="tax@example.com" className={inputCls} />
      </FormField>
      <FormField label="사업자등록증 첨부">
        <div className="space-y-2">
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 transition-colors">
            <span className="text-sm">📎</span>
            <span className="text-[12px] text-[var(--text-muted)]">{form.bizRegImage ? '파일 변경' : '파일 선택 (이미지/PDF)'}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 5 * 1024 * 1024) { alert('파일 크기는 5MB 이하로 제한됩니다'); return }
                const reader = new FileReader()
                reader.onload = () => setForm(f => ({ ...f, bizRegImage: reader.result as string }))
                reader.readAsDataURL(file)
              }}
            />
          </label>
          {form.bizRegImage && (
            <div className="relative group">
              {form.bizRegImage.startsWith('data:image') ? (
                <img src={form.bizRegImage} alt="사업자등록증" className="w-full max-h-[200px] object-contain rounded-lg border border-[var(--border-default)] bg-white" />
              ) : (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]">
                  📄 PDF 파일 첨부됨
                </div>
              )}
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, bizRegImage: '' }))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >✕</button>
            </div>
          )}
        </div>
      </FormField>

      {/* 비고 */}
      <SectionHeader icon="📝" title="비고" color="#8b5cf6" />
      <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="기타 참고 사항을 입력하세요" rows={3} className={`${inputCls} resize-none`} />
    </div>
  )

  /* ── 조회 렌더 ── */
  const renderView = (v: Vendor) => {
    const InfoRow = ({ label, value }: { label: string; value?: string }) => (
      <div className="flex items-start gap-2 py-1.5">
        <span className="text-[11px] font-bold text-[var(--text-muted)] w-24 shrink-0">{label}</span>
        <span className="text-[13px] text-[var(--text-primary)] flex-1">{value || '-'}</span>
      </div>
    )
    return (
      <div className="space-y-4">
        <SectionHeader icon="🏢" title="기본정보" color="#4f6ef7" />
        <InfoRow label="거래처명" value={v.name} />
        <InfoRow label="우편번호" value={v.zipCode} />
        <InfoRow label="주소" value={[v.address1 || v.address, v.address2].filter(Boolean).join(' ') || undefined} />
        <InfoRow label="전화번호" value={v.phone} />

        <SectionHeader icon="📞" title="연락처정보" color="#22c55e" />
        <div className="grid grid-cols-2 gap-x-4">
          <InfoRow label="대표자명" value={v.ceoName} />
          <InfoRow label="대표자연락처" value={v.ceoPhone} />
          <InfoRow label="담당자명" value={v.managerName} />
          <InfoRow label="담당자연락처" value={v.managerPhone} />
        </div>

        <SectionHeader icon="📋" title="사업자정보" color="#f59e0b" />
        <InfoRow label="사업자번호" value={v.bizNo} />
        <div className="grid grid-cols-2 gap-x-4">
          <InfoRow label="업태" value={v.bizType} />
          <InfoRow label="업종" value={v.bizCategory} />
        </div>
        <InfoRow label="계산서이메일" value={v.invoiceEmail} />
        {v.bizRegImage && (
          <div>
            <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">사업자등록증</span>
            {v.bizRegImage.startsWith('data:image') ? (
              <img src={v.bizRegImage} alt="사업자등록증" className="w-full max-h-[300px] object-contain rounded-xl border border-[var(--border-default)] bg-white cursor-pointer" onClick={() => window.open(v.bizRegImage, '_blank')} />
            ) : (
              <a href={v.bizRegImage} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm text-primary-500 font-semibold hover:underline">📄 사업자등록증 PDF 보기</a>
            )}
          </div>
        )}

        <SectionHeader icon="📝" title="비고" color="#8b5cf6" />
        <p className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">{v.memo || '-'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">🏢</div>
          <div>
            <div className="text-[17px] font-extrabold">거래처관리</div>
            <div className="text-[11.5px] opacity-85">거래처 정보를 등록하고 관리합니다</div>
          </div>
        </div>
      </div>

      {/* 검색 + 등록 버튼 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="거래처명, 사업자번호, 대표자, 담당자 검색..."
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none pl-9"
          />
          <ContactRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md shrink-0">
          <Plus size={14} /> 거래처 등록
        </button>
      </div>

      {/* 거래처 목록 */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <span className="text-sm font-extrabold text-[var(--text-primary)]">거래처 목록</span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{vendors.length}건</span>
        </div>
        {vendors.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">🏢</p>
            <p className="text-sm text-[var(--text-muted)]">등록된 거래처가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {vendors.map(v => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-muted)] transition-colors group cursor-pointer" onClick={() => openView(v)}>
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500 shrink-0">
                  <ContactRound size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-[var(--text-primary)] truncate">{v.name}</span>
                    {v.bizNo && <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded font-mono">{v.bizNo}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                    {v.ceoName && <span>대표: {v.ceoName}</span>}
                    {v.managerName && <span>담당: {v.managerName}</span>}
                    {v.phone && <span>☎ {v.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] cursor-pointer"><Edit3 size={13} /></button>
                  <button onClick={() => deleteVendor(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 등록/수정 모달 ── */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)] shrink-0">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{editId ? '거래처 수정' : '거래처 등록'}</span>
              <button onClick={() => setModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {renderForm()}
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[var(--border-default)] shrink-0">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)]">취소</button>
              <button onClick={saveVendor} className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md">
                {editId ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── 조회 모달 ── */}
      {viewOpen && viewVendor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setViewOpen(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)] shrink-0">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">거래처 상세</span>
              <button onClick={() => setViewOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {renderView(viewVendor)}
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[var(--border-default)] shrink-0">
              <button onClick={() => setViewOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)]">닫기</button>
              <button onClick={() => { setViewOpen(false); openEdit(viewVendor) }} className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md">수정</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
