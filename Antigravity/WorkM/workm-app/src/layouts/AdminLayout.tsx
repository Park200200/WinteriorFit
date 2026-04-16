import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/common/Sidebar'
import { Header } from '../components/common/Header'
import { MobileTabBar } from '../components/common/MobileTabBar'
import { MobileDrawer } from '../components/common/MobileDrawer'
import { cn } from '../utils/cn'

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* 데스크탑 사이드바 */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* 메인 영역 */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          collapsed ? 'md:ml-[68px]' : 'md:ml-[240px]',
        )}
      >
        <Header />
        <main className="flex-1 px-4 py-4 md:px-5 md:py-5 overflow-x-hidden pb-20 md:pb-5">
          <Outlet />
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <MobileTabBar />

      {/* 모바일 더보기 드로어 */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
