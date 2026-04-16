import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { PlaceholderPage } from './pages/admin/PlaceholderPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import { StaffPage } from './pages/admin/StaffPage'
import { ProgressPage } from './pages/admin/ProgressPage'
import { HQInfoPage } from './pages/admin/HQInfoPage'
import { TasksPage } from './pages/admin/TasksPage'
import { SchedulePage } from './pages/admin/SchedulePage'
import { PerformancePage } from './pages/admin/PerformancePage'
import { AccountingPage } from './pages/admin/AccountingPage'
import { HomepageMgmtPage } from './pages/admin/HomepageMgmtPage'
import { HomepageView } from './pages/website/HomepageView'
import { ProfilePage } from './pages/admin/ProfilePage'
import { ToastContainer } from './components/ui/Toast'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'

/* ── 인증 보호 라우트 ── */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated)
  if (!isAuth) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  // 초기 테마 적용
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* 로그인 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/website" element={<HomepageView />} />

        {/* 관리자 패널 */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="/hq-info" element={<HQInfoPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/homepage" element={<HomepageMgmtPage />} />
          <Route path="/accounting" element={<AccountingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
