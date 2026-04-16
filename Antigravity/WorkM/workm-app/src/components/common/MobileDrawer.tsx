import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { Avatar } from '../ui/Avatar'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import {
  Info, Contact, SlidersHorizontal, Users, Settings,
  Globe, Calculator, User, LogOut,
  Moon, Sun, X,
} from 'lucide-react'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

const menuItems = [
  { section: '기본관리', items: [
    { path: '/hq-info', label: '본사정보', icon: Info, color: '#4f6ef7' },
    { path: '/staff', label: '직원관리', icon: Contact, color: '#9747ff' },
    { path: '/settings', label: '기타설정', icon: SlidersHorizontal, color: '#f59e0b' },
    { path: '/tasks', label: '업무분장', icon: Users, color: '#22c55e' },
  ]},
  { section: '업무', items: [
    { path: '/progress', label: '진행현황', icon: Settings, color: '#06b6d4' },
    { path: '/homepage', label: '홈페이지', icon: Globe, color: '#3b82f6' },
    { path: '/accounting', label: '회계관리', icon: Calculator, color: '#ec4899' },
  ]},
]

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggle: toggleTheme } = useThemeStore()

  return (
    <>
      {/* 백드롭 */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* 드로어 바텀시트 */}
      <div
        className={cn(
          'fixed left-0 right-0 bottom-0 z-[61] md:hidden',
          'bg-[var(--bg-surface)] rounded-t-3xl shadow-2xl',
          'transition-transform duration-300 ease-out',
          'max-h-[85vh] overflow-y-auto',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--bg-subtle)]" />
        </div>

        {/* 사용자 카드 + 닫기 */}
        <div className="flex items-center justify-between px-5 py-3">
          {user && (
            <div className="flex items-center gap-3">
              <Avatar name={user.name} color={user.color || '#4f6ef7'} size="md" />
              <div>
                <div className="text-sm font-extrabold text-[var(--text-primary)]">{user.name}</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {user.dept} · {user.rank || '사원'}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer active:scale-90 transition-transform"
          >
            <X size={16} />
          </button>
        </div>

        {/* 메뉴 그리드 */}
        {menuItems.map((section) => (
          <div key={section.section} className="px-5 mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              {section.section}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95',
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'bg-[var(--bg-muted)] hover:bg-[var(--bg-subtle)]',
                      )
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${item.color}18` }}
                    >
                      <Icon size={20} style={{ color: item.color }} />
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      {item.label}
                    </span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}

        {/* 하단 액션 */}
        <div className="px-5 pb-8 pt-2 border-t border-[var(--border-default)] flex gap-2">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--bg-muted)] text-sm font-semibold text-[var(--text-secondary)] active:scale-[.97] transition-transform"
          >
            <User size={16} /> 개인설정
          </NavLink>
          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer active:scale-90 transition-transform"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => { logout(); window.location.href = '/login' }}
            className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-danger cursor-pointer active:scale-90 transition-transform"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
