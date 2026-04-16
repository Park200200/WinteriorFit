import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { cn } from '../../utils/cn'
import { HpBasicSettings } from '../../components/homepage/HpBasicSettings'
import { HpMenuReg } from '../../components/homepage/HpMenuReg'
import { HpContentMgmt } from '../../components/homepage/HpContentMgmt'
import { HpBoardMgmt } from '../../components/homepage/HpBoardMgmt'
import { HpMediaMgmt } from '../../components/homepage/HpMediaMgmt'
import { HpTermsMgmt } from '../../components/homepage/HpTermsMgmt'
import { HpWorkshopMgmt } from '../../components/homepage/HpWorkshopMgmt'
import {
  Settings2, MenuSquare, LayoutPanelLeft, ClipboardList, Film,
  ScrollText, FileText, Globe,
} from 'lucide-react'

/* ─── 서브 페이지 정의 (레거시 homepageNav 매칭) ── */
const SUB_PAGES = [
  { key: 'basic',     label: '기본설정',          icon: Settings2,        emoji: '⚙️',  desc: '홈페이지 기본 테마, 색상, 로고를 설정합니다' },
  { key: 'menu',      label: '메뉴등록',          icon: MenuSquare,       emoji: '📋',  desc: '메뉴 구조와 서브메뉴를 관리합니다' },
  { key: 'content',   label: '컨텐츠관리',        icon: LayoutPanelLeft,  emoji: '📰',  desc: '뉴스, 블로그, 유튜브, 웹사이트 콘텐츠를 관리합니다' },
  { key: 'board',     label: '게시판관리',        icon: ClipboardList,    emoji: '💬',  desc: '게시판을 생성하고 관리합니다' },
  { key: 'media',     label: '미디어자료',        icon: Film,             emoji: '🖼️',  desc: '이미지, 동영상 미디어를 관리합니다' },
  { key: 'terms',     label: '약관관리',          icon: ScrollText,       emoji: '📜',  desc: '이용약관, 개인정보처리방침을 관리합니다' },
  { key: 'workshop',  label: '신청서', icon: FileText,        emoji: '📝',  desc: '워크샵/대관 신청서를 관리합니다' },
]

/* ═══════════════════════════════════════════
   HomepageMgmtPage
   ═══════════════════════════════════════════ */
export function HomepageMgmtPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSub = searchParams.get('tab') || 'basic'
  const setActiveSub = (tab: string) => setSearchParams({ tab })
  const currentPage = SUB_PAGES.find(s => s.key === activeSub) || SUB_PAGES[0]

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="홈페이지"
        subtitle={currentPage.label}
      >
        <a
          href="/website"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:border-primary-400 hover:text-primary-500 transition-all cursor-pointer"
        >
          <Globe size={13} /> 홈페이지 열기
        </a>
      </PageHeader>

      {/* ── 서브 탭 네비게이션 (더 이상 모바일에 표시하지 않음 — 하단 바 사용) ── */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 mb-5 hidden">
        {SUB_PAGES.map(sp => {
          const Icon = sp.icon
          const isActive = activeSub === sp.key
          return (
            <button
              key={sp.key}
              onClick={() => setActiveSub(sp.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11.5px] font-bold whitespace-nowrap cursor-pointer transition-all border shrink-0',
                isActive
                  ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                  : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]',
              )}
            >
              <Icon size={13} />
              {sp.label}
            </button>
          )
        })}
      </div>

      {/* ── 서브 페이지 콘텐츠 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-default)]">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <currentPage.icon size={18} className="text-primary-500" />
          </div>
          <div>
            <div className="text-base font-extrabold text-[var(--text-primary)]">{currentPage.label}</div>
            <div className="text-[11px] text-[var(--text-muted)]">{currentPage.desc}</div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-5">
          {activeSub === 'basic' && <HpBasicSettings />}
          {activeSub === 'menu' && <HpMenuReg />}
          {activeSub === 'content' && <HpContentMgmt />}
          {activeSub === 'board' && <HpBoardMgmt />}
          {activeSub === 'media' && <HpMediaMgmt />}
          {activeSub === 'terms' && <HpTermsMgmt />}
          {activeSub === 'workshop' && <HpWorkshopMgmt />}
          {!['basic','menu','content','board','media','terms','workshop'].includes(activeSub) && (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">{currentPage.emoji}</p>
              <p className="text-base font-bold text-[var(--text-primary)]">{currentPage.label}</p>
              <p className="text-[12px] text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                {currentPage.desc}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-4 bg-[var(--bg-muted)] inline-block px-4 py-1.5 rounded-full">
                구현 예정
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
