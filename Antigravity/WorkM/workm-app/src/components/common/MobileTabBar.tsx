import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
import {
  Home, BarChart3, Users, SlidersHorizontal,
  TrendingUp, Calendar, BarChart2,
  User, Calculator, Globe,
  Building2, Contact, Sliders, Briefcase,
  LayoutDashboard, PieChart, FileCheck,
  TrendingDown, BookOpen, ScrollText, Landmark,
  CreditCard, ArrowDownCircle, ArrowUpCircle, ContactRound,
  Settings2, Menu, Grid3X3,
  LayoutPanelLeft, ClipboardList, Film, FileText,
} from 'lucide-react'

/* ═══════════════════════════════════════════
   기본 4탭 메뉴 (내책상 | 진행 | 담당 | 설정)
   ═══════════════════════════════════════════ */
const DEFAULT_TABS = [
  { id: 'dashboard', label: '내책상', icon: Home, page: '/', drawer: null },
  { id: '_jinhaeng', label: '진행',   icon: BarChart3, page: null, drawer: 'jinhaeng' },
  { id: '_damdang',  label: '담당',   icon: User, page: null, drawer: 'damdang' },
  { id: '_settings', label: '설정',   icon: SlidersHorizontal, page: null, drawer: 'settings' },
]

const DEFAULT_DRAWER: Record<string, { icon: React.ElementType; label: string; color: string; bg: string; path: string }[]> = {
  jinhaeng: [
    { icon: TrendingUp, label: '진행현황', color: '#4f6ef7', bg: 'rgba(79,110,247,.12)', path: '/progress' },
    { icon: Calendar,   label: '일정보기', color: '#22c55e', bg: 'rgba(34,197,94,.12)',  path: '/schedule' },
    { icon: BarChart2,  label: '실적보기', color: '#f59e0b', bg: 'rgba(245,158,11,.12)', path: '/performance' },
  ],
  damdang: [
    { icon: User,       label: '내의정보', color: '#4f6ef7', bg: 'rgba(79,110,247,.12)', path: '/profile' },
    { icon: Calculator, label: '회계관리', color: '#f59e0b', bg: 'rgba(245,158,11,.12)', path: '/accounting' },
    { icon: Globe,      label: '홈페이지', color: '#22c55e', bg: 'rgba(34,197,94,.12)',  path: '/homepage' },
  ],
  settings: [
    { icon: Building2, label: '본사정보', color: '#4f6ef7', bg: 'rgba(79,110,247,.12)', path: '/hq-info' },
    { icon: Contact,   label: '직원관리', color: '#9747ff', bg: 'rgba(151,71,255,.12)', path: '/staff' },
    { icon: Sliders,   label: '기타설정', color: '#06b6d4', bg: 'rgba(6,182,212,.12)',  path: '/settings' },
    { icon: Briefcase, label: '업무분장', color: '#8b5cf6', bg: 'rgba(139,92,246,.12)', path: '/tasks' },
  ],
}

/* ═══════════════════════════════════════════
   회계 전용 4탭 (기본 | 설정 | 경리 | 내책상)
   ═══════════════════════════════════════════ */
const ACCT_TABS = [
  { id: '_acct_basic',  label: '기본',   icon: BarChart3, page: null, drawer: 'acct_basic' },
  { id: '_acct_config', label: '설정',   icon: SlidersHorizontal, page: null, drawer: 'acct_config' },
  { id: '_acct_ledger', label: '경리',   icon: Calculator, page: null, drawer: 'acct_ledger' },
  { id: 'dashboard',    label: '내책상', icon: Home, page: '/', drawer: null },
]

const ACCT_DRAWER: Record<string, { icon: React.ElementType; label: string; color: string; bg: string; tab: string }[]> = {
  acct_basic: [
    { icon: LayoutDashboard, label: '기본현황', color: '#4f6ef7', bg: 'rgba(79,110,247,.12)', tab: 'overview' },
    { icon: ScrollText,      label: '회계현황', color: '#22c55e', bg: 'rgba(34,197,94,.12)',  tab: 'reports' },
    { icon: ContactRound,    label: '거래처관리', color: '#6366f1', bg: 'rgba(99,102,241,.12)', tab: 'vendors' },
  ],
  acct_config: [
    { icon: PieChart,  label: '예산설정', color: '#f59e0b', bg: 'rgba(245,158,11,.12)', tab: 'budget' },
    { icon: Landmark,  label: '기초잔액', color: '#8b5cf6', bg: 'rgba(139,92,246,.12)', tab: 'balance' },
  ],
  acct_ledger: [
    { icon: FileCheck,       label: '품의하기',  color: '#06b6d4', bg: 'rgba(6,182,212,.12)',  tab: 'approval' },
    { icon: CreditCard,      label: '지출하기',  color: '#ef4444', bg: 'rgba(239,68,68,.12)',  tab: 'expense' },
    { icon: ArrowDownCircle, label: '입금전표',  color: '#22c55e', bg: 'rgba(34,197,94,.12)',  tab: 'income' },
    { icon: ArrowUpCircle,   label: '출금전표',  color: '#f97316', bg: 'rgba(249,115,22,.12)', tab: 'withdrawal' },
    { icon: BookOpen,        label: '전표장부',  color: '#4f6ef7', bg: 'rgba(79,110,247,.12)', tab: 'payment' },
  ],
}

/* ═══════════════════════════════════════════
   홈페이지 전용 4탭 (메인페이지 | 서브페이지 | 추가페이지 | 내책상)
   ═══════════════════════════════════════════ */
const HP_TABS = [
  { id: '_hp_main', label: '메인페이지', icon: Settings2, page: null, drawer: 'hp_main' },
  { id: '_hp_sub',  label: '서브페이지', icon: Menu, page: null, drawer: 'hp_sub' },
  { id: '_hp_more', label: '추가페이지', icon: Grid3X3, page: null, drawer: 'hp_more' },
  { id: 'dashboard', label: '내책상', icon: Home, page: '/', drawer: null },
]

const HP_DRAWER: Record<string, { icon: React.ElementType; label: string; color: string; bg: string; hpTab: string }[]> = {
  hp_main: [
    { icon: Settings2, label: '기본설정', color: '#4f6ef7', bg: 'rgba(79,110,247,.12)', hpTab: 'basic' },
  ],
  hp_sub: [
    { icon: Menu, label: '메뉴등록', color: '#22c55e', bg: 'rgba(34,197,94,.12)', hpTab: 'menu' },
  ],
  hp_more: [
    { icon: LayoutPanelLeft, label: '컨텐츠관리', color: '#6366f1', bg: 'rgba(99,102,241,.12)',  hpTab: 'content' },
    { icon: Film,            label: '미디어관리', color: '#f59e0b', bg: 'rgba(245,158,11,.12)',  hpTab: 'media' },
    { icon: ClipboardList,   label: '게시판관리', color: '#06b6d4', bg: 'rgba(6,182,212,.12)',   hpTab: 'board' },
    { icon: FileText,        label: '약관페이지', color: '#8b5cf6', bg: 'rgba(139,92,246,.12)',  hpTab: 'terms' },
    { icon: ScrollText,      label: '신청서',     color: '#ef4444', bg: 'rgba(239,68,68,.12)',  hpTab: 'workshop' },
  ],
}

/* ═══════════════════════════════════════════
   경로 → 부모 탭 매핑
   ═══════════════════════════════════════════ */
const PAGE_TO_TAB: Record<string, string> = {
  '/': 'dashboard',
  '/progress': '_jinhaeng', '/schedule': '_jinhaeng', '/performance': '_jinhaeng',
  '/profile': '_damdang', '/accounting': '_damdang', '/homepage': '_damdang',
  '/hq-info': '_settings', '/staff': '_settings', '/settings': '_settings', '/tasks': '_settings',
}

export function MobileTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null)
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  const isAcctMode = location.pathname === '/accounting'
  const isHpMode = location.pathname === '/homepage'

  /* ── 모드 결정 ── */
  const mode = isAcctMode ? 'accounting' : isHpMode ? 'homepage' : 'default'
  const tabs = mode === 'accounting' ? ACCT_TABS : mode === 'homepage' ? HP_TABS : DEFAULT_TABS

  /* ── 탭 활성화 판별 ── */
  const getActiveTabId = () => {
    if (sheetOpen && activeTabId) return activeTabId
    if (mode === 'default') return PAGE_TO_TAB[location.pathname] || 'dashboard'
    // 회계/홈페이지 모드에서는 첫 탭이 기본
    return tabs[0].id
  }

  const currentActiveTab = getActiveTabId()

  /* ── 드로어 아이템 렌더링 ── */
  const renderDrawerItems = () => {
    if (!activeDrawer) return null

    if (mode === 'accounting') {
      const items = ACCT_DRAWER[activeDrawer] || []
      return items.map(item => {
        const Icon = item.icon
        return (
          <button
            key={item.tab}
            onClick={() => {
              setSheetOpen(false)
              navigate(`/accounting?tab=${item.tab}`)
            }}
            className="flex flex-col items-center gap-2 cursor-pointer transition-all"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: item.bg }}
            >
              <Icon size={22} style={{ color: item.color }} />
            </div>
            <span className="text-[12px] font-bold" style={{ color: item.color }}>
              {item.label}
            </span>
          </button>
        )
      })
    }

    if (mode === 'homepage') {
      const items = HP_DRAWER[activeDrawer] || []
      // hp_main, hp_sub는 항목 1개뿐이므로 바로 이동
      if (items.length === 1) {
        navigate(`/homepage?tab=${items[0].hpTab}`)
        setSheetOpen(false)
        return null
      }
      return items.map(item => {
        const Icon = item.icon
        return (
          <button
            key={item.hpTab}
            onClick={() => {
              setSheetOpen(false)
              navigate(`/homepage?tab=${item.hpTab}`)
            }}
            className="flex flex-col items-center gap-2 cursor-pointer transition-all"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: item.bg }}
            >
              <Icon size={22} style={{ color: item.color }} />
            </div>
            <span className="text-[12px] font-bold" style={{ color: item.color }}>
              {item.label}
            </span>
          </button>
        )
      })
    }

    // 기본 모드
    const items = DEFAULT_DRAWER[activeDrawer] || []
    return items.map(item => {
      const Icon = item.icon
      const isActive = location.pathname === item.path
      return (
        <button
          key={item.path}
          onClick={() => {
            setSheetOpen(false)
            navigate(item.path)
          }}
          className={cn('flex flex-col items-center gap-2 cursor-pointer transition-all', isActive && 'scale-105')}
        >
          <div
            className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-all', isActive && 'shadow-lg')}
            style={{ background: item.bg, border: `2px solid ${isActive ? item.color : 'transparent'}` }}
          >
            <Icon size={22} style={{ color: item.color }} />
          </div>
          <span className="text-[12px] font-bold" style={{ color: isActive ? item.color : 'var(--text-secondary)' }}>
            {item.label}
          </span>
        </button>
      )
    })
  }

  const handleTabClick = (tab: typeof tabs[number]) => {
    if (tab.page) {
      setSheetOpen(false)
      navigate(tab.page)
    } else if (tab.drawer) {
      if (sheetOpen && activeDrawer === tab.drawer) {
        setSheetOpen(false)
      } else {
        setActiveDrawer(tab.drawer)
        setActiveTabId(tab.id)
        setSheetOpen(true)
      }
    }
  }

  return (
    <>
      {/* 바텀시트 오버레이 */}
      {sheetOpen && (
        <div
          className="md:hidden fixed top-0 left-0 right-0 bottom-14 z-[45] bg-black/30"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* 바텀시트 */}
      {sheetOpen && (
        <div className="md:hidden fixed left-0 right-0 bottom-14 z-[46] bg-[var(--bg-surface)] rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] border-t border-[var(--border-default)] animate-slideUp">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[var(--border-default)]" />
          </div>
          <div className="px-5 py-2">
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {mode === 'accounting' ? '회계 메뉴' : mode === 'homepage' ? '솔루션 리스트' : '빠른 메뉴'}
            </span>
          </div>
          <div className="flex items-center justify-center gap-5 px-5 pt-2 pb-5 flex-wrap">
            {renderDrawerItems()}
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-surface)] border-t border-[var(--border-default)] safe-area-bottom">
        <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = currentActiveTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 gap-0.5 relative cursor-pointer',
                  'transition-colors duration-150 active:scale-95',
                  active ? 'text-primary-500' : 'text-[var(--text-muted)]',
                )}
              >
                {active && (
                  <span className="absolute top-0 w-8 h-0.5 rounded-full bg-primary-500" />
                )}
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn('text-[10px]', active ? 'font-bold' : 'font-medium')}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
