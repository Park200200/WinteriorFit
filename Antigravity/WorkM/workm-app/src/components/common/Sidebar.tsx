import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { Avatar } from '../ui/Avatar'
import { useAuthStore } from '../../stores/authStore'
import {
  Home, Building2, Info, Contact, SlidersHorizontal, Users,
  Settings, Calendar, BarChart3, Briefcase, Globe, Calculator,
  ChevronDown, ArrowLeft,
  /* 회계 전용 아이콘 (레거시 매칭) */
  LayoutDashboard, Wallet, Landmark, FileCheck, CreditCard,
  ArrowDownCircle, ArrowUpCircle, ScrollText, ContactRound,
  /* 홈페이지 전용 아이콘 (레거시 매칭) */
  Settings2, MenuSquare, LayoutPanelLeft, ClipboardList, Film, FileText,
} from 'lucide-react'

interface NavEntry {
  path: string
  label: string
  icon: React.ElementType
  badge?: number
}

interface NavGroup {
  label: string
  icon: React.ElementType
  children: NavEntry[]
}

type NavItem = NavEntry | NavGroup

function isGroup(item: NavItem): item is NavGroup {
  return 'children' in item
}

/* ═══════════════════════════════════════════
   기본 사이드바 메뉴 (레거시와 동일)
   ═══════════════════════════════════════════ */
const mainNav: NavItem[] = [
  { path: '/', label: '나의책상', icon: Home },
  {
    label: '기본관리', icon: Building2,
    children: [
      { path: '/hq-info', label: '본사정보', icon: Info },
      { path: '/staff', label: '직원관리', icon: Contact },
      { path: '/settings', label: '기타설정', icon: SlidersHorizontal },
      { path: '/tasks', label: '업무분장', icon: Users },
    ],
  },
  { path: '/progress', label: '진행현황', icon: Settings },
]

const analyticsNav: NavItem[] = [
  { path: '/schedule', label: '일정보기', icon: Calendar },
  { path: '/performance', label: '실적보기', icon: BarChart3 },
]

const workNav: NavItem[] = [
  {
    label: '업무관리', icon: Briefcase,
    children: [
      { path: '/homepage', label: '홈페이지', icon: Globe },
      { path: '/accounting', label: '회계관리', icon: Calculator },
    ],
  },
]

/* ═══════════════════════════════════════════
   회계관리 전용 사이드바 메뉴 (레거시 acctNav 매칭)
   ═══════════════════════════════════════════ */
const acctNav: { tab: string; label: string; icon: React.ElementType }[] = [
  { tab: 'overview',   label: '기본현황',   icon: LayoutDashboard },
  { tab: 'budget',     label: '예산설정',   icon: Wallet },
  { tab: 'balance',    label: '기초잔액',   icon: Landmark },
  { tab: 'approval',   label: '품의하기',   icon: FileCheck },
  { tab: 'expense',    label: '지출하기',   icon: CreditCard },
  { tab: 'income',     label: '입금전표',   icon: ArrowDownCircle },
  { tab: 'withdrawal', label: '출금전표',   icon: ArrowUpCircle },
  { tab: 'payment',    label: '전표장부',   icon: ScrollText },
  { tab: 'reports',    label: '회계현황',   icon: BarChart3 },
  { tab: 'vendors',    label: '거래처관리',   icon: ContactRound },
]

/* ═══════════════════════════════════════════
   홈페이지 전용 사이드바 메뉴 (레거시 homepageNav 매칭)
   ═══════════════════════════════════════════ */
const hpNav: { tab: string; label: string; icon: React.ElementType }[] = [
  { tab: 'basic',    label: '기본설정',          icon: Settings2 },
  { tab: 'menu',     label: '메뉴등록',          icon: MenuSquare },
  { tab: 'content',  label: '컨텐츠관리',        icon: LayoutPanelLeft },
  { tab: 'board',    label: '게시판관리',        icon: ClipboardList },
  { tab: 'media',    label: '미디어자료',        icon: Film },
  { tab: 'terms',    label: '약관관리',          icon: ScrollText },
  { tab: 'workshop', label: '신청서', icon: FileText },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const navigate = useNavigate()

  const isAcctMode = location.pathname === '/accounting'
  const isHpMode = location.pathname === '/homepage'

  /* ═══════════════════════════════════════════
     회계관리 전용 사이드바
     ═══════════════════════════════════════════ */
  if (isAcctMode) {
    const currentTab = new URLSearchParams(location.search).get('tab') || 'overview'

    return (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col',
          'bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-[240px]',
          'max-md:hidden',
        )}
      >
        {/* 로고 */}
        <div
          className="flex items-center gap-3 px-4 h-16 shrink-0 cursor-pointer hover:bg-[var(--sidebar-hover)] transition-colors"
          onClick={onToggle}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
            W
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-fadeIn">
              <div className="text-sm font-extrabold text-[var(--sidebar-title)] tracking-tight">회계관리</div>
              <div className="text-[10px] text-[var(--sidebar-text)]">경리 시스템</div>
            </div>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          <SectionLabel collapsed={collapsed}>회계관리</SectionLabel>
          {acctNav.map((entry) => {
            const Icon = entry.icon
            const isActive = currentTab === entry.tab

            return (
              <button
                key={entry.tab}
                onClick={() => navigate(`/accounting?tab=${entry.tab}`)}
                className={cn(
                  'flex items-center gap-3 rounded-lg h-9 w-full transition-all duration-150 cursor-pointer',
                  collapsed ? 'justify-center px-0 mx-1' : 'px-3',
                  isActive
                    ? 'bg-primary-50 dark:bg-[var(--sidebar-active)]/15 text-[var(--sidebar-active)] font-bold'
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-title)]',
                )}
                title={collapsed ? entry.label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="text-[13px] truncate">{entry.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* 내 책상으로 */}
        <div className="border-t border-[var(--sidebar-border)] px-2.5 py-3 shrink-0">
          <button
            onClick={() => navigate('/')}
            className={cn(
              'flex items-center gap-3 rounded-lg h-10 w-full transition-all duration-150 cursor-pointer',
              'bg-primary-50 dark:bg-primary-900/20 text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/30 font-bold',
              collapsed ? 'justify-center px-0' : 'px-3',
            )}
            title={collapsed ? '내 책상으로' : undefined}
          >
            <ArrowLeft size={18} className="shrink-0" />
            {!collapsed && <span className="text-[13px]">내 책상으로</span>}
          </button>
        </div>
      </aside>
    )
  }

  /* ═══════════════════════════════════════════
     홈페이지 전용 사이드바
     ═══════════════════════════════════════════ */
  if (isHpMode) {
    const currentTab = new URLSearchParams(location.search).get('tab') || 'basic'

    return (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col',
          'bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-[240px]',
          'max-md:hidden',
        )}
      >
        {/* 로고 */}
        <div
          className="flex items-center gap-3 px-4 h-16 shrink-0 cursor-pointer hover:bg-[var(--sidebar-hover)] transition-colors"
          onClick={onToggle}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
            W
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-fadeIn">
              <div className="text-sm font-extrabold text-[var(--sidebar-title)] tracking-tight">홈페이지</div>
              <div className="text-[10px] text-[var(--sidebar-text)]">홈페이지 업무</div>
            </div>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          <SectionLabel collapsed={collapsed}>홈페이지 업무</SectionLabel>
          {hpNav.map((entry) => {
            const Icon = entry.icon
            const isActive = currentTab === entry.tab

            return (
              <button
                key={entry.tab}
                onClick={() => navigate(`/homepage?tab=${entry.tab}`)}
                className={cn(
                  'flex items-center gap-3 rounded-lg h-9 w-full transition-all duration-150 cursor-pointer',
                  collapsed ? 'justify-center px-0 mx-1' : 'px-3',
                  isActive
                    ? 'bg-primary-50 dark:bg-[var(--sidebar-active)]/15 text-[var(--sidebar-active)] font-bold'
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-title)]',
                )}
                title={collapsed ? entry.label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="text-[13px] truncate">{entry.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* 내 책상으로 */}
        <div className="border-t border-[var(--sidebar-border)] px-2.5 py-3 shrink-0">
          <button
            onClick={() => navigate('/')}
            className={cn(
              'flex items-center gap-3 rounded-lg h-10 w-full transition-all duration-150 cursor-pointer',
              'bg-primary-50 dark:bg-primary-900/20 text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/30 font-bold',
              collapsed ? 'justify-center px-0' : 'px-3',
            )}
            title={collapsed ? '내 책상으로' : undefined}
          >
            <ArrowLeft size={18} className="shrink-0" />
            {!collapsed && <span className="text-[13px]">내 책상으로</span>}
          </button>
        </div>
      </aside>
    )
  }

  /* ═══════════════════════════════════════════
     기본 사이드바
     ═══════════════════════════════════════════ */
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]',
        'max-md:hidden',
      )}
    >
      {/* 로고 */}
      <div
        className="flex items-center gap-3 px-4 h-16 shrink-0 cursor-pointer hover:bg-[var(--sidebar-hover)] transition-colors"
        onClick={onToggle}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
          W
        </div>
        {!collapsed && (
          <div className="overflow-hidden animate-fadeIn">
            <div className="text-sm font-extrabold text-[var(--sidebar-title)] tracking-tight">WorkM</div>
            <div className="text-[10px] text-[var(--sidebar-text)]">v3.0.0</div>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        <SectionLabel collapsed={collapsed}>Main</SectionLabel>
        {mainNav.map((item, i) => (
          <NavItemRenderer key={i} item={item} collapsed={collapsed} currentPath={location.pathname} />
        ))}

        <SectionLabel collapsed={collapsed}>Analytics</SectionLabel>
        {analyticsNav.map((item, i) => (
          <NavItemRenderer key={i} item={item} collapsed={collapsed} currentPath={location.pathname} />
        ))}

        <SectionLabel collapsed={collapsed}>Work</SectionLabel>
        {workNav.map((item, i) => (
          <NavItemRenderer key={i} item={item} collapsed={collapsed} currentPath={location.pathname} />
        ))}
      </nav>

      {/* 사용자 정보 */}
      {user && (
        <div className={cn(
          'border-t border-[var(--sidebar-border)] px-3 py-3 shrink-0',
          collapsed ? 'flex justify-center' : '',
        )}>
          <NavLink
            to="/profile"
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-2',
              'hover:bg-[var(--sidebar-hover)] transition-colors',
            )}
          >
            <Avatar name={user.name} color={user.color || '#4f6ef7'} size="sm" />
            {!collapsed && (
              <div className="min-w-0 animate-fadeIn">
                <div className="text-xs font-bold text-[var(--sidebar-title)] truncate">{user.name}</div>
                <div className="text-[10px] text-[var(--sidebar-text)] truncate">
                  {user.rank || user.position || '사원'}
                </div>
              </div>
            )}
          </NavLink>
        </div>
      )}
    </aside>
  )
}

/* ── 섹션 라벨 ── */
function SectionLabel({ children, collapsed }: { children: string; collapsed: boolean }) {
  if (collapsed) return <div className="h-px bg-[var(--sidebar-border)] my-2 mx-1" />
  return (
    <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--sidebar-text)] px-3 pt-4 pb-1.5">
      {children}
    </div>
  )
}

/* ── 네비게이션 아이템 렌더러 ── */
function NavItemRenderer({
  item,
  collapsed,
  currentPath,
}: {
  item: NavItem
  collapsed: boolean
  currentPath: string
}) {
  if (isGroup(item)) {
    return <NavGroupItem group={item} collapsed={collapsed} currentPath={currentPath} />
  }
  return <NavSingleItem entry={item} collapsed={collapsed} />
}

/* ── 단일 링크 ── */
function NavSingleItem({ entry, collapsed }: { entry: NavEntry; collapsed: boolean }) {
  const Icon = entry.icon
  return (
    <NavLink
      to={entry.path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg h-9 transition-all duration-150',
          collapsed ? 'justify-center px-0 mx-1' : 'px-3',
          isActive
            ? 'bg-primary-50 dark:bg-[var(--sidebar-active)]/15 text-[var(--sidebar-active)] font-bold'
            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-title)]',
        )
      }
      title={collapsed ? entry.label : undefined}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="text-[13px] truncate">{entry.label}</span>}
      {!collapsed && entry.badge !== undefined && entry.badge > 0 && (
        <span className="ml-auto text-[10px] font-bold bg-primary-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
          {entry.badge}
        </span>
      )}
    </NavLink>
  )
}

/* ── 서브메뉴 그룹 ── */
function NavGroupItem({
  group,
  collapsed,
  currentPath,
}: {
  group: NavGroup
  collapsed: boolean
  currentPath: string
}) {
  const hasActiveChild = group.children.some((c) => currentPath === c.path)
  const [expanded, setExpanded] = useState(hasActiveChild)
  const Icon = group.icon

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-3 rounded-lg h-9 w-full transition-all duration-150 cursor-pointer',
          collapsed ? 'justify-center px-0 mx-1' : 'px-3',
          hasActiveChild
            ? 'text-[var(--sidebar-title)]'
            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-title)]',
        )}
        title={collapsed ? group.label : undefined}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="text-[13px] truncate flex-1 text-left">{group.label}</span>
            <ChevronDown
              size={14}
              className={cn('shrink-0 transition-transform duration-200', expanded && 'rotate-180')}
            />
          </>
        )}
      </button>

      {!collapsed && expanded && (
        <div className="ml-4 pl-3 border-l border-[var(--sidebar-border)] mt-0.5 space-y-0.5 animate-fadeIn">
          {group.children.map((child) => (
            <NavSingleItem key={child.path} entry={child} collapsed={false} />
          ))}
        </div>
      )}
    </div>
  )
}
