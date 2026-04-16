import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Search, Bell, Moon, Sun, LogOut, User, Clock, ArrowRight, Timer, Calculator, Globe, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'

import { getItem, setItem } from '../../utils/storage'
import { useToastStore } from '../../stores/toastStore'



/* ── 출퇴근 기록 타입 ── */
interface AttendanceRecord {
  checkInRaw: string | null
  checkOutRaw: string | null
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggle: toggleTheme } = useThemeStore()
  const addToast = useToastStore((s) => s.add)
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [now, setNow] = useState(new Date())
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAcctMode = location.pathname === '/accounting'
  const isHpMode = location.pathname === '/homepage'

  /* ── 회계연도 (URL searchParams로 공유) ── */
  const currentYear = new Date().getFullYear()
  const acctYear = parseInt(searchParams.get('year') || '') || currentYear

  const setAcctYear = (y: number) => {
    const tab = searchParams.get('tab') || 'overview'
    setSearchParams({ tab, year: String(y) })
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 외부 클릭으로 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── 출퇴근 데이터 ──
  const todayKey = `ws_attendance_${now.toISOString().slice(0, 10)}`
  const attendance: AttendanceRecord = getItem(todayKey, { checkInRaw: null, checkOutRaw: null })

  // 최초 접속 시 자동 출근
  useEffect(() => {
    if (user && !attendance.checkInRaw) {
      const nowTime = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`
      setItem(todayKey, { ...attendance, checkInRaw: nowTime })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const checkInTime = attendance.checkInRaw || '--:--'

  // 근무시간 계산
  const workTime = useMemo(() => {
    if (!attendance.checkInRaw) return '--:--'
    const [h, m] = attendance.checkInRaw.split(':').map(Number)
    const cin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
    const diff = now.getTime() - cin.getTime()
    if (diff < 0) return '00:00'
    const totalMin = Math.floor(diff / 60000)
    return `${pad(Math.floor(totalMin / 60))}:${pad(totalMin % 60)}`
  }, [attendance.checkInRaw, now])

  // 퇴근 처리
  const handleCheckOut = () => {
    const outTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    setItem(todayKey, { ...attendance, checkOutRaw: outTime })
    addToast('success', `${user?.name}님, 오늘도 수고하셨습니다! 총 근무시간: ${workTime}`)
    setTimeout(() => {
      logout()
      window.location.href = '/login'
    }, 2000)
  }

  /* ══════════════════════════════════════════
     좌측 영역: 모드별 분기
     ══════════════════════════════════════════ */
  const renderLeft = () => {
    if (isAcctMode) {
      /* ── 회계관리 모드: 배지 + 회계연도 탭 ── */
      const years = [currentYear + 1, currentYear, currentYear - 1]
      return (
        <div className="flex items-center gap-2 min-w-0">
          {/* > 구분 아이콘 */}
          <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0 hidden md:block" />

          {/* 회계관리 배지 */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white shrink-0">
            <Calculator size={13} />
            <span className="text-[12px] font-bold">회계관리</span>
          </div>

          {/* 회계연도 탭 */}
          <div className="hidden md:flex items-center gap-1 bg-[var(--bg-muted)] rounded-lg px-1 py-0.5 border border-[var(--border-default)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] px-1.5">회계년도</span>
            {years.map(y => (
              <button
                key={y}
                onClick={() => setAcctYear(y)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all',
                  y === acctYear
                    ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )
    }
    if (isHpMode) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0 hidden md:block" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 text-white shrink-0">
            <Globe size={13} />
            <span className="text-[12px] font-bold">홈페이지</span>
          </div>
        </div>
      )
    }
    return (
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="업무, 담당자, 키워드 검색..."
          className={cn(
            'w-full pl-9 pr-4 py-2 rounded-lg text-sm',
            'bg-[var(--bg-muted)] border border-transparent',
            'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'focus:outline-none focus:border-primary-500 focus:bg-[var(--bg-surface)]',
            'transition-all duration-200',
          )}
        />
      </div>
    )
  }

  return (
    <header className="h-14 border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center gap-2 px-3 md:px-5 shrink-0 sticky top-0 z-30">
      {/* 좌측: 모드별 제목 또는 검색창 */}
      {renderLeft()}

      {/* ── 출퇴근 위젯 (데스크탑) ── */}
      <div className="hidden lg:flex items-center gap-0.5 bg-[var(--bg-muted)] rounded-xl px-1 py-0.5 border border-[var(--border-default)] mx-auto">
        {/* 출근시간 */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-muted)]">
          <ArrowRight size={11} className="text-green-500" />
          <span className="text-green-600 dark:text-green-400 font-extrabold">{checkInTime}</span>
        </div>
        {/* 현재시간 */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-muted)]">
          <Clock size={11} className="text-primary-500" />
          <span className="text-[var(--text-primary)] font-extrabold tabular-nums">
            {`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`}
          </span>
        </div>
        {/* 근무시간 */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-muted)]">
          <Timer size={11} className="text-amber-500" />
          <span className="text-amber-600 dark:text-amber-400 font-extrabold tabular-nums">{workTime}</span>
        </div>
        {/* 퇴근 버튼 */}
        <button
          onClick={handleCheckOut}
          className="ml-0.5 w-7 h-7 rounded-lg bg-primary-500 hover:bg-primary-600 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
          title="퇴근하기"
        >
          <ArrowRight size={13} className="text-white" />
        </button>
      </div>

      {/* 오른쪽: 액션 */}
      <div className="flex items-center gap-0.5 ml-auto" ref={dropdownRef}>
        {/* 테마 토글 */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title="테마 변경"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* 알림 */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
            className="p-2 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors relative cursor-pointer"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border border-[var(--bg-surface)]" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl animate-scaleIn z-50">
              <div className="px-4 py-3 border-b border-[var(--border-default)]">
                <span className="text-xs font-bold text-[var(--text-secondary)]">알림</span>
              </div>
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                새로운 알림이 없습니다
              </div>
            </div>
          )}
        </div>

        {/* 프로필 (모바일+데스크탑) */}
        {user && (
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            >
              <Avatar name={user.name} color={user.color} size="xs" />
              <span className="text-[11px] font-bold text-[var(--text-primary)] hidden md:inline">
                {user.name}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl animate-scaleIn z-50 overflow-hidden">
                <button
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                >
                  <User size={15} /> 개인설정
                </button>
                <div className="h-px bg-[var(--border-default)]" />
                <button
                  onClick={() => { logout(); window.location.href = '/login' }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  <LogOut size={15} /> 로그아웃
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
