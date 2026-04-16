import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Sun, Moon, Pencil, FileText, Pin, Lightbulb, MessageCircle, ClipboardList, Search, CheckCircle2, Send, AlertTriangle } from 'lucide-react'
import './homepage-view.css'

/* ══════════════════════════════════════════════
   HomepageView — 관리자 설정 기반 반응형 홈페이지
   localStorage 에서 설정을 읽어 동적 렌더링
   ══════════════════════════════════════════════ */

/* ── 타입 ── */
interface McItem { imgH: string; imgV: string; text1: string; text2: string; text3: string; url: string; blank: boolean }
interface McLine { type: 'image' | 'solution'; duration: number; items: McItem[]; solution: string }

/* 메뉴 등록 타입 */
interface SubRow { label: string; url: string; blank: boolean }
interface SubSet { name: string; type: 'image' | 'solution'; rows: SubRow[]; solutions: string[] }
interface MenuDetail { sets: SubSet[] }
interface MenuRegData { items: string[]; details: Record<number, MenuDetail> }

interface HpSettings {
  siteName: string; domain: string; email: string; phone: string
  logoTopH: string; logoTopV: string; logoBotH: string; logoBotV: string
  logoTopHW: string; logoTopVW: string; logoBotHW: string; logoBotVW: string
  rivetBg: string; rivetFontSize: number; rivetFontColor: string
  rivetFontWeight: number; rivetAlign: string; rivetTags: string[]
  menuBg: string; menuFc: string; menuFs: number; menuH: number
  menuOpacity: number; menuAlign: string; menuGap: number; menuFw: number
  menuItems: string[]
  mcLines: McLine[]
  footerBg: string; footerHeight: number; footerOpacity: number
  ftBg: string; ftFc: string; ftFs: number; ftHeight: number
  ftOpacity: number; ftAlign: string; ftText: string
  cpBg: string; cpFc: string; cpFs: number; cpHeight: number
  cpOpacity: number; cpAlign: string; cpText: string
}

function getLS<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb } catch { return fb }
}

const SOLUTION_LABELS: Record<string, string> = {
  '컨텐츠관리': '📰 컨텐츠 관리', '미디어관리': '🖼️ 미디어 관리',
  '개인정보처리방침': '🔒 개인정보처리방침', '게시물 게재 원칙': '📜 게시물 게재 원칙',
  '홈페이지 이용약관': '📋 홈페이지 이용약관', '공지사항': '📢 공지사항',
  '뉴스': '📰 뉴스', '자유게시판': '💬 자유게시판', 'Q&A': '❓ Q&A',
  'FAQ': '📋 FAQ', '가맹점신청': '🏪 가맹점 신청',
  '워크샵': '🏕️ 워크샵', '대관(교육관)': '🏛️ 대관',
  terms: '📋 이용약관', privacy: '🔒 개인정보 취급방침',
  content: '📰 컨텐츠관리', gallery: '🖼️ 미디어 자료',
  board: '💬 게시판', notice: '📢 공지사항', news: '📰 뉴스',
  qna: '❓ Q&A', faq: '📋 FAQ', franchise: '🏪 가맹점 신청',
  workshop: '🏕️ 워크샵', venue: '🏛️ 대관(교육관)',
}

interface SubItem { name: string; url: string; blank: boolean; isSolution?: boolean; solutionIds?: string[] }

/* ═══════════════════════════════════
   캐러셀 컴포넌트
   ═══════════════════════════════════ */
function Carousel({ items, duration }: { items: McItem[]; duration: number }) {
  const [cur, setCur] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const valid = items.filter(it => (it.imgH || '').length > 4 || (it.imgV || '').length > 4)

  const go = useCallback((n: number) => {
    setCur((n % valid.length + valid.length) % valid.length)
  }, [valid.length])

  useEffect(() => {
    if (valid.length <= 1) return
    timerRef.current = setInterval(() => setCur(p => (p + 1) % valid.length), duration * 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [valid.length, duration])

  if (!valid.length) return null

  return (
    <div className="hp-carousel" style={{ aspectRatio: '16/7', maxHeight: '75vh' }}>
      {valid.map((item, i) => {
        const hasH = (item.imgH || '').length > 4
        const hasV = (item.imgV || '').length > 4
        const hasText = item.text1 || item.text2 || item.text3
        const content = (
          <>
            {hasH && <img className="hp-cs-img-h" src={item.imgH} alt="" loading="lazy" />}
            {hasV && <img className="hp-cs-img-v" src={item.imgV} alt="" loading="lazy" />}
            {!hasH && !hasV && null}
            {hasText && (
              <div className="hp-cs-overlay">
                <div className="hp-cs-overlay-inner">
                  {item.text1 && <span className="hp-cs-tag">{item.text1}</span>}
                  {item.text2 && <div className="hp-cs-title">{item.text2}</div>}
                  {item.text3 && <div className="hp-cs-desc">{item.text3}</div>}
                </div>
              </div>
            )}
          </>
        )
        return (
          <div key={i} className={`hp-carousel-slide ${i === cur ? 'active' : ''}`}>
            {item.url ? (
              <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                target={item.blank ? '_blank' : '_self'} rel="noopener noreferrer" className="hp-cs-link">
                {content}
              </a>
            ) : content}
          </div>
        )
      })}
      {valid.length > 1 && (
        <>
          <button className="hp-carousel-arrow prev" onClick={() => go(cur - 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="hp-carousel-arrow next" onClick={() => go(cur + 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div className="hp-carousel-dots">
            {valid.map((_, i) => (
              <button key={i} className={`hp-carousel-dot ${i === cur ? 'active' : ''}`} onClick={() => go(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════ */
export function HomepageView() {
  const [s, setS] = useState<HpSettings | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuReg, setMenuReg] = useState<MenuRegData>({ items: [], details: {} })
  const [hoveredMenu, setHoveredMenu] = useState<number | null>(null)
  const [activeSolution, setActiveSolution] = useState<string | null>(null)
  const megaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const data = getLS<HpSettings | null>('hp_basic_settings', null)
    setS(data)
    setMenuReg(getLS<MenuRegData>('hp_menu_reg', { items: [], details: {} }))
    const saved = localStorage.getItem('hp_website_theme')
    if (saved === 'dark') setTheme('dark')
    document.title = data?.siteName ? `${data.siteName} - 홈페이지` : 'WorkM Homepage'
  }, [])

  /* 서브메뉴 헬퍼 */
  const getSubItems = (menuIdx: number): SubItem[] => {
    const detail = menuReg.details[menuIdx]
    if (!detail?.sets?.length) return []
    const subs: SubItem[] = []
    detail.sets.forEach(set => {
      if (set.type === 'solution' && set.solutions?.length) {
        // 솔루션형: 각 솔루션을 개별 서브메뉴로
        set.solutions.forEach(solId => {
          subs.push({
            name: set.name || (SOLUTION_LABELS[solId] || solId),
            url: '#',
            blank: false,
            isSolution: true,
            solutionIds: [solId],
          })
        })
      } else if (set.name) {
        subs.push({ name: set.name, url: set.rows?.[0]?.url || '#', blank: set.rows?.[0]?.blank || false })
      }
    })
    return subs
  }
  const hasAnySub = Object.keys(menuReg.details).some(k => (menuReg.details[Number(k)]?.sets?.length || 0) > 0)

  const showMega = (idx: number) => {
    if (megaTimerRef.current) clearTimeout(megaTimerRef.current)
    setHoveredMenu(idx)
  }
  const hideMega = () => {
    megaTimerRef.current = setTimeout(() => setHoveredMenu(null), 180)
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('hp_website_theme', next)
  }

  if (!s) return (
    <div className="hp-view" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚙️</div>
        <div style={{ fontSize:18, fontWeight:700 }}>홈페이지 설정이 없습니다</div>
        <div style={{ fontSize:14, color:'#94a3b8', marginTop:8 }}>관리자 패널에서 기본설정을 먼저 저장해주세요</div>
      </div>
    </div>
  )

  const menuItems = s.menuItems?.length ? s.menuItems : ['홈', '회사소개', '서비스', '포트폴리오', '공지사항', '문의하기']
  const menuBgRgba = (() => {
    const op = (s.menuOpacity ?? 100) / 100
    const hex = s.menuBg || '#ffffff'
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
    return `rgba(${r},${g},${b},${op})`
  })()

  const alignToJC = (a: string) => {
    if (a === 'left' || a === 'flex-start') return 'flex-start'
    if (a === 'right' || a === 'flex-end') return 'flex-end'
    if (a === 'space-between') return 'space-between'
    return 'center'
  }

  return (
    <div className="hp-view" data-hp-theme={theme}>

      {/* ═══ 1. 리벳 바 ═══ */}
      {s.rivetTags?.length > 0 && (
        <div className="hp-rivet hp-fade-in" style={{
          background: s.rivetBg || '#1e40af',
          color: s.rivetFontColor || '#fff',
          fontSize: `${s.rivetFontSize || 13}px`,
          fontWeight: s.rivetFontWeight || 400,
          justifyContent: alignToJC(s.rivetAlign),
        }}>
          {s.rivetTags.map((t, i) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              {i > 0 && <span className="hp-rivet-dot" />}
              <span>{t}</span>
            </span>
          ))}
        </div>
      )}

      {/* ═══ 2. 헤더 ═══ */}
      <header className="hp-header" ref={headerRef} style={{
        background: menuBgRgba,
        minHeight: `${s.menuH || 64}px`,
        top: s.rivetTags?.length > 0 ? '36px' : '0',
        backdropFilter: `blur(${Math.round((s.menuOpacity ?? 100) / 100 * 14)}px)`,
      }}>
        {/* 로고 */}
        <div className="hp-header-logo">
          {s.logoTopH ? (
            <img src={s.logoTopH} alt="Logo" className="hp-cs-img-h"
              style={s.logoTopHW ? { width:`${s.logoTopHW}px`, height:'auto', maxHeight:'44px' } : undefined} />
          ) : null}
          {s.logoTopV ? (
            <img src={s.logoTopV} alt="Logo" className="hp-cs-img-v"
              style={s.logoTopVW ? { width:`${s.logoTopVW}px`, height:'auto', maxHeight:'44px' } : undefined} />
          ) : null}
          {!s.logoTopH && !s.logoTopV && <span className="hp-logo-text">{s.siteName || 'WorkM'}</span>}
        </div>

        {/* 데스크탑 메뉴 */}
        <nav className="hp-header-nav" ref={navRef} style={{
          justifyContent: alignToJC(s.menuAlign),
          gap: `${s.menuGap || 28}px`,
        }}>
          {menuItems.map((name, i) => (
            <a key={i} href="#" style={{
              fontSize: `${s.menuFs || 15}px`,
              color: s.menuFc || '#1a1a2e',
              fontWeight: s.menuFw || 600,
            }}
              onMouseEnter={() => showMega(i)}
              onMouseLeave={hideMega}
            >{name}</a>
          ))}
        </nav>

        {/* 모바일 메뉴 버튼 */}
        <button className={`hp-mobile-btn ${drawerOpen ? 'active' : ''}`}
          onClick={() => setDrawerOpen(!drawerOpen)}>
          <span style={{ background: s.menuFc || '#1a1a2e' }} />
          <span style={{ background: s.menuFc || '#1a1a2e' }} />
          <span style={{ background: s.menuFc || '#1a1a2e' }} />
        </button>
      </header>

      {/* 메가메뉴 드롭다운 — 헤더 바로 아래 붙임 */}
      {hasAnySub && hoveredMenu !== null && (() => {
        // 각 메인메뉴 링크의 left 좌표 계산
        const navLinks = navRef.current?.querySelectorAll('a') || []
        const positions: number[] = []
        navLinks.forEach(a => { positions.push(a.getBoundingClientRect().left) })
        const maxSubs = Math.max(...menuItems.map((_, mi) => getSubItems(mi).length), 0)

        return (
          <div
            className="hp-mega-panel"
            style={{
              position: 'fixed',
              left: 0, right: 0,
              top: headerRef.current?.getBoundingClientRect().bottom ?? ((s.rivetTags?.length > 0 ? 36 : 0) + (s.menuH || 64)),
              background: menuBgRgba,
              backdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(128,128,128,.08)',
              boxShadow: '0 12px 40px rgba(0,0,0,.15)',
              zIndex: 88,
              minHeight: maxSubs * 30 + 32,
            }}
            onMouseEnter={() => showMega(hoveredMenu)}
            onMouseLeave={hideMega}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%', padding: '14px 0 18px' }}>
              {menuItems.map((_, mi) => {
                const subs = getSubItems(mi)
                if (!subs.length) return null
                const leftPos = positions[mi] ?? 0
                return (
                  <div key={mi} style={{
                    position: 'absolute',
                    top: 14,
                    left: leftPos,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    textAlign: 'left',
                  }}>
                    {subs.map((sub, si) => (
                      <a key={si} href={sub.isSolution ? undefined : (sub.url || '#')}
                        target={sub.blank ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        style={{
                          fontSize: `${Math.max((s.menuFs || 15) - 2, 12)}px`,
                          color: s.menuFc || '#1a1a2e',
                          fontWeight: 400,
                          opacity: .7,
                          padding: '5px 0',
                          transition: 'opacity .15s, padding-left .15s',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          cursor: 'pointer',
                        }}
                        onClick={sub.isSolution ? (e) => { e.preventDefault(); setActiveSolution(sub.solutionIds?.[0] || null); setHoveredMenu(null) } : undefined}
                        onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '1'; (e.target as HTMLElement).style.paddingLeft = '6px' }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '.7'; (e.target as HTMLElement).style.paddingLeft = '0' }}
                      >{sub.name}</a>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* 모바일 드로어 */}
      <div className={`hp-mobile-overlay ${drawerOpen ? 'active' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`hp-mobile-drawer ${drawerOpen ? 'active' : ''}`}>
        {menuItems.map((name, i) => {
          const subs = getSubItems(i)
          return (
            <div key={i}>
              <a href="#" onClick={() => setDrawerOpen(false)}>{name}</a>
              {subs.map((sub, si) => (
                <a key={si} href={sub.isSolution ? undefined : (sub.url || '#')}
                  target={sub.blank ? '_blank' : '_self'}
                  style={{ paddingLeft: 24, fontSize: 14, fontWeight: 400, opacity: .7, cursor: 'pointer' }}
                  onClick={() => { if (sub.isSolution) { setActiveSolution(sub.solutionIds?.[0] || null) } setDrawerOpen(false) }}
                >{sub.name}</a>
              ))}
            </div>
          )
        })}
      </div>

      {/* ═══ 3. 메인 컨텐츠 ═══ */}
      <main style={{ paddingTop: (s.rivetTags?.length > 0 ? 36 : 0) + (s.menuH || 64) }}>
        {activeSolution ? (
          <SolutionPage solId={activeSolution} siteName={s.siteName || 'WorkM'} onBack={() => setActiveSolution(null)} />
        ) : (!s.mcLines || s.mcLines.length === 0) ? (
          <div className="hp-hero hp-fade-in">
            <div>
              <h1>{s.siteName || 'WorkM'}</h1>
              <p>고객과 함께 성장하는 최고의 파트너</p>
            </div>
          </div>
        ) : (
          s.mcLines.map((line, i) => {
            if (line.type === 'image') {
              return <Carousel key={i} items={line.items || []} duration={line.duration || 5} />
            }
            return (
              <div key={i} className="hp-solution-section hp-fade-in"
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveSolution(line.solution)}
              >
                <h2>{SOLUTION_LABELS[line.solution] || line.solution || '솔루션'}</h2>
                <p style={{ fontSize: 14, opacity: .6 }}>클릭하여 상세 페이지로 이동</p>
              </div>
            )
          })
        )}
      </main>

      {/* ═══ 4. 푸터 ═══ */}
      {/* 하단 로고박스 */}
      <div className="hp-footer-logo" style={{
        background: s.footerBg || '#1a1a2e',
        height: `${s.footerHeight || 120}px`,
        opacity: (s.footerOpacity ?? 100) / 100,
      }}>
        {s.logoBotH && <img src={s.logoBotH} alt="" style={s.logoBotHW ? { width:`${s.logoBotHW}px`, height:'auto' } : undefined} />}
        {s.logoBotV && <img src={s.logoBotV} alt="" style={s.logoBotVW ? { width:`${s.logoBotVW}px`, height:'auto' } : undefined} />}
        {!s.logoBotH && !s.logoBotV && <span style={{ color:'rgba(255,255,255,.3)', fontSize:14 }}>하단 로고 미등록</span>}
      </div>

      {/* 하단 텍스트 */}
      <div className="hp-footer-text" style={{
        background: s.ftBg || '#0a0a1a',
        minHeight: `${s.ftHeight || 80}px`,
        opacity: (s.ftOpacity ?? 100) / 100,
        justifyContent: alignToJC(s.ftAlign),
      }}>
        <div style={{
          fontSize: `${s.ftFs || 12}px`,
          color: s.ftFc || '#64748b',
          textAlign: (s.ftAlign as any) || 'center',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {s.ftText || `© ${new Date().getFullYear()} ${s.siteName || 'WorkM'}. All rights reserved.`}
        </div>
      </div>

      {/* 카피라이트 */}
      <div className="hp-copyright" style={{
        background: s.cpBg || '#050510',
        minHeight: `${s.cpHeight || 48}px`,
        opacity: (s.cpOpacity ?? 100) / 100,
        justifyContent: alignToJC(s.cpAlign),
      }}>
        <div style={{
          fontSize: `${s.cpFs || 11}px`,
          color: s.cpFc || '#475569',
          textAlign: (s.cpAlign as any) || 'center',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {s.cpText || `© ${new Date().getFullYear()} ${s.siteName || 'WorkM'}. All rights reserved.`}
        </div>
      </div>

      {/* ═══ 테마 토글 ═══ */}
      <button className="hp-theme-btn" onClick={toggleTheme} title="테마 변경">
        {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════
   솔루션 페이지 컴포넌트
   ═══════════════════════════════════ */
function SolutionPage({ solId, siteName, onBack }: { solId: string; siteName: string; onBack: () => void }) {
  const title = SOLUTION_LABELS[solId] || solId
  // 솔루션별 색상
  const colorMap: Record<string, string> = {
    terms: '#6366f1', privacy: '#8b5cf6', content: '#2563eb',
    gallery: '#f59e0b', board: '#06b6d4', notice: '#ef4444',
    news: '#22c55e', qna: '#f97316', faq: '#14b8a6',
    franchise: '#ec4899', workshop: '#10b981', venue: '#7c3aed',
  }
  const accentColor = colorMap[solId] || '#6366f1'

  const renderContent = () => {
    switch (solId) {
      case 'terms': {
        const data = getLS<{ content?: string }>('hp_terms', {})
        return data.content
          ? <div style={{ lineHeight: 1.8, fontSize: 14 }} dangerouslySetInnerHTML={{ __html: data.content }} />
          : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>이용약관이 등록되지 않았습니다.</p>
      }
      case 'privacy': {
        const data = getLS<{ content?: string }>('hp_privacy', {})
        return data.content
          ? <div style={{ lineHeight: 1.8, fontSize: 14 }} dangerouslySetInnerHTML={{ __html: data.content }} />
          : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>개인정보 취급방침이 등록되지 않았습니다.</p>
      }
      case 'notice': case 'news': case 'board': case 'qna': case 'faq': {
        const catMap: Record<string, string> = { notice: 'notice', news: 'news', board: 'free', qna: 'qna', faq: 'faq' }
        return <BoardSolutionView cat={catMap[solId] || 'free'} accent={accentColor} solId={solId} />
      }
      case 'franchise': case 'workshop': case 'venue': {
        return <ApplicationSolutionView solId={solId} accent={accentColor} />
      }
      default:
        return <p style={{ color: '#94a3b8', textAlign: 'center', padding: '60px 0', fontSize: 14 }}>해당 솔루션 페이지를 준비 중입니다.</p>
    }
  }

  return (
    <div style={{ padding: '40px 20px', minHeight: 400 }} className="hp-fade-in">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* ═ 타이틀 박스: 컨러 폰트 + 박스 ═ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 28, paddingBottom: 18,
          borderBottom: `3px solid ${accentColor}`,
        }}>
          <button onClick={onBack} style={{
            padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', flexShrink: 0,
          }}>←</button>
          <h2 style={{
            fontSize: 20, fontWeight: 800, color: accentColor, margin: 0,
            letterSpacing: '-0.02em',
          }}>{title.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, '')}</h2>
        </div>
        {/* ═ 콘텐츠 ═ */}
        {renderContent()}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   게시판 솔루션 뷰 (쓰기 + 아코디언)
   ═══════════════════════════════════ */
function BoardSolutionView({ cat, accent, solId }: { cat: string; accent: string; solId: string }) {
  const [items, setItems] = useState<any[]>(() => {
    const all = getLS<any[]>('board_items', [])
    return all.filter((it: any) => it.cat === cat)
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showWrite, setShowWrite] = useState(false)
  const [wTitle, setWTitle] = useState('')
  const [wAuthor, setWAuthor] = useState('')
  const [wContent, setWContent] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const handleWrite = () => {
    if (!wTitle.trim()) return
    const newItem = {
      id: 'bp' + Date.now(),
      cat,
      title: wTitle.trim(),
      content: wContent.trim(),
      author: wAuthor.trim() || '방문자',
      regDate: new Date().toISOString().slice(0, 10),
      views: 0,
    }
    const allItems = getLS<any[]>('board_items', [])
    const updated = [newItem, ...allItems]
    localStorage.setItem('board_items', JSON.stringify(updated))
    setItems(updated.filter((it: any) => it.cat === cat))
    setWTitle(''); setWAuthor(''); setWContent('')
    setShowWrite(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', background: '#fff',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div>
      {/* 게시글 쓰기 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowWrite(!showWrite)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 18px', borderRadius: 10, border: 'none',
          background: accent, color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer',
        }}>
          <Pencil size={14} style={{display:'inline'}}/> 게시글 쓰기
        </button>
      </div>

      {/* 게시글 쓰기 폼 */}
      {showWrite && (
        <div style={{
          background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14,
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#334155' }}>
            <Pencil size={15} style={{display:'inline',marginRight:4}}/> 새 게시글 작성
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 3 }}>제목</label>
                <input value={wTitle} onChange={e => setWTitle(e.target.value)}
                  placeholder="제목을 입력하세요" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 3 }}>작성자</label>
                <input value={wAuthor} onChange={e => setWAuthor(e.target.value)}
                  placeholder="이름" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 3 }}>내용</label>
              <textarea value={wContent} onChange={e => setWContent(e.target.value)}
                rows={5} placeholder="내용을 입력하세요"
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowWrite(false)} style={{
                padding: '8px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>취소</button>
              <button onClick={handleWrite} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>등록</button>
            </div>
          </div>
        </div>
      )}

      {/* 게시글 리스트 (아코디언) */}
      {items.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>등록된 게시글이 없습니다.</p>
      ) : (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          {items.map((it: any, i: number) => {
            const isOpen = expandedId === it.id
            return (
              <div key={it.id || i}>
                {/* 헤더 행 */}
                <div
                  onClick={() => toggleExpand(it.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer', transition: 'background .15s',
                    background: isOpen ? '#f8fafc' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#fafbfc' }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${accent}18`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, fontSize: 14,
                  }}>
                    {it.featured ? <Pin size={14}/> : <FileText size={14}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                      {it.author || '관리자'} · {it.regDate || ''} · 조회 {it.views || 0}
                    </div>
                  </div>
                  <span style={{
                    color: '#94a3b8', fontSize: 18, flexShrink: 0,
                    transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                  }}>▾</span>
                </div>
                {/* 아코디언 본문 */}
                {isOpen && (
                  <div style={{
                    padding: '16px 20px 20px 60px',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#fcfcfd',
                    animation: 'hp-fade-in .25s ease',
                  }}>
                    <div style={{ fontSize: 14, lineHeight: 1.8, color: '#334155', whiteSpace: 'pre-wrap' }}>
                      {it.content || '(내용 없음)'}
                    </div>
                    {/* FAQ 답변 */}
                    {it.ans && (
                      <div style={{ marginTop: 14, padding: '12px 16px', background: `${accent}08`, borderRadius: 10, borderLeft: `3px solid ${accent}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 4, display:'flex', alignItems:'center', gap:4 }}><Lightbulb size={13}/> 답변</div>
                        <div style={{ fontSize: 13, lineHeight: 1.7, color: '#475569' }}>{it.ans}</div>
                      </div>
                    )}
                    {/* 댓글 */}
                    {it.replies?.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, display:'flex', alignItems:'center', gap:4 }}><MessageCircle size={13}/> 댓글 ({it.replies.length})</div>
                        {it.replies.map((r: any, ri: number) => (
                          <div key={ri} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                            <span style={{ fontWeight: 600, color: '#475569' }}>{r.author}</span>
                            <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 8 }}>{r.date}</span>
                            <div style={{ marginTop: 3, color: '#64748b', lineHeight: 1.6 }}>{r.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* 이미지 */}
                    {it.img && (
                      <div style={{ marginTop: 14 }}>
                        <img src={it.img} alt="" style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                        {it.imgCap && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{it.imgCap}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════
   신청서 솔루션 뷰 (작성 + 결과확인)
   ═══════════════════════════════════ */
function ApplicationSolutionView({ solId, accent }: { solId: string; accent: string }) {
  const typeMap: Record<string, string> = { franchise: 'franchise', workshop: 'workshop', venue: 'venue' }
  const labelMap: Record<string, string> = { franchise: '가맹점', workshop: '워크샵', venue: '대관' }
  const wsType = typeMap[solId] || 'workshop'
  const label = labelMap[solId] || '워크샵'

  const [tab, setTab] = useState<'write' | 'result'>('write')
  const [form, setForm] = useState({
    groupName: '', manager: '', phone: '', email: '',
    checkin: '', checkout: '', headcount: '',
    pwd: '', extras: [] as string[], inquiry: '',
  })
  const [resultPwd, setResultPwd] = useState('')
  const [resultName, setResultName] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const extraOptions = solId === 'workshop'
    ? ['명찰', '다과세트', '식당', '특강']
    : solId === 'venue'
      ? ['빔프로젝터', '마이크세트', '화이트보드', '다과']
      : ['인테리어 자문', '마케팅 지원', '시설 점검', '교육 프로그램']

  const toggleExtra = (e: string) => {
    setForm(f => ({
      ...f,
      extras: f.extras.includes(e) ? f.extras.filter(x => x !== e) : [...f.extras, e],
    }))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', background: '#fff',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: '#6366f1', display: 'block', marginBottom: 4,
  }

  const handleSubmit = () => {
    if (!form.groupName.trim() || !form.manager.trim() || !form.phone.trim()) {
      alert('필수 항목을 입력해주세요.'); return
    }
    const newItem = {
      id: 'app' + Date.now(), type: wsType,
      regDate: new Date().toISOString().slice(0, 10),
      status: '접수대기',
      groupName: form.groupName, manager: form.manager,
      phone: form.phone, email: form.email,
      checkin: form.checkin, checkout: form.checkout,
      headcount: parseInt(form.headcount) || 0,
      extras: form.extras.join(', '),
      inquiry: form.inquiry, memo: '',
      pwd: form.pwd,
    }
    const all = getLS<any[]>('ws_items', [])
    localStorage.setItem('ws_items', JSON.stringify([newItem, ...all]))
    setSubmitted(true)
    setForm({ groupName: '', manager: '', phone: '', email: '', checkin: '', checkout: '', headcount: '', pwd: '', extras: [], inquiry: '' })
  }

  const searchResults = () => {
    const all = getLS<any[]>('ws_items', [])
    const found = all.filter((it: any) =>
      it.type === wsType &&
      (resultName ? it.manager === resultName : true) &&
      (resultPwd ? it.pwd === resultPwd : true) &&
      (resultName || resultPwd)
    )
    setResults(found)
  }

  const STATUS_COLOR: Record<string, string> = { '접수대기': '#94a3b8', '접수완료': '#22c55e', '계약준비': '#f59e0b', '계약완료': '#3b82f6', '신청취소': '#ef4444' }

  return (
    <div>
      {/* 탭 */}
      <div style={{ display: 'flex', marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
        <button onClick={() => { setTab('write'); setSubmitted(false) }} style={{
          flex: 1, padding: '12px 0', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          background: tab === 'write' ? accent : '#fff',
          color: tab === 'write' ? '#fff' : '#64748b',
        }}><ClipboardList size={14} style={{display:'inline',marginRight:4}}/> 신청서 작성</button>
        <button onClick={() => setTab('result')} style={{
          flex: 1, padding: '12px 0', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          background: tab === 'result' ? accent : '#fff',
          color: tab === 'result' ? '#fff' : '#64748b',
        }}><Search size={14} style={{display:'inline',marginRight:4}}/> 신청결과 확인</button>
      </div>

      {tab === 'write' ? (
        submitted ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ marginBottom: 12 }}><CheckCircle2 size={48} color="#22c55e"/></div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>신청이 접수되었습니다</div>
            <p style={{ fontSize: 14, color: '#64748b' }}>접수 후 담당자가 2~3 영업일 내 연락드립니다.</p>
            <button onClick={() => setSubmitted(false)} style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none',
              background: accent, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>새 신청서 작성</button>
          </div>
        ) : (
          <div style={{ background: '#fafbfc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '24px 20px' }}>
            {solId === 'franchise' ? (
              /* ── 가맹점 전용 신청서 ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>신청인 *</label>
                  <input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))}
                    placeholder="신청인 이름 입력" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>전화번호 *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="010-0000-0000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>이메일</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="example@email.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>신청지역 *</label>
                  <input value={form.groupName} onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))}
                    placeholder="예: 서울 강남구 역삼동" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>기타문의</label>
                  <textarea value={form.inquiry} onChange={e => setForm(f => ({ ...f, inquiry: e.target.value }))}
                    rows={4} placeholder="추가 문의사항을 입력해 주세요."
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ background: '#fef3c7', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                  ⚠ <b>유의사항:</b> 접수 후 담당자가 2~3 영업일 내 연락드립니다.
                </div>
                <button onClick={handleSubmit} style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  background: accent, color: '#fff', fontWeight: 800, fontSize: 15,
                  cursor: 'pointer',
                }}>
                  가맹점 신청하기
                </button>
              </div>
            ) : (
              /* ── 워크샵/대관 신청서 ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* 단체명 */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>단체명 / 기업명 * <span style={{ fontWeight: 400, fontSize: 11, color: '#94a3b8' }}>(개인 신청 불가)</span></label>
                  <input value={form.groupName} onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))}
                    placeholder="단체명 또는 기업명 입력" style={inputStyle} />
                </div>
                {/* 체크인/체크아웃 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>{solId === 'venue' ? '이용일 *' : '체크인 *'}</label>
                    <input type="date" value={form.checkin} onChange={e => setForm(f => ({ ...f, checkin: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>{solId === 'venue' ? '이용종료일' : '체크아웃 *'}</label>
                    <input type="date" value={form.checkout} onChange={e => setForm(f => ({ ...f, checkout: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                {/* 연락처 / 인원 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>담당자 연락처 *</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="010-0000-0000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>참여 총 인원 *</label>
                    <input value={form.headcount} onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))}
                      placeholder="최소 10명" style={inputStyle} />
                  </div>
                </div>
                {/* 담당자 / 비밀번호 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>담당자 이름 *</label>
                    <input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))}
                      placeholder="신청인 이름 입력" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>접수확인용 비밀번호 *</label>
                    <input type="password" value={form.pwd} onChange={e => setForm(f => ({ ...f, pwd: e.target.value }))}
                      placeholder="4자리 이상 입력" style={inputStyle} />
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>접수 후 신청내역 확인시 사용됩니다</div>
                  </div>
                </div>
                {/* 추가 선택사항 */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>추가 선택사항 <span style={{ fontWeight: 400, fontSize: 11, color: '#94a3b8' }}>(옵션 · 복수 선택 가능)</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                    {extraOptions.map(e => (
                      <label key={e} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                        background: form.extras.includes(e) ? `${accent}10` : '#fff',
                        cursor: 'pointer', fontSize: 14,
                      }}>
                        <input type="checkbox" checked={form.extras.includes(e)} onChange={() => toggleExtra(e)}
                          style={{ accentColor: accent }} />
                        {e}
                      </label>
                    ))}
                  </div>
                </div>
                {/* 기타 문의 */}
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>기타 문의 / 견적 요청사항</label>
                  <textarea value={form.inquiry} onChange={e => setForm(f => ({ ...f, inquiry: e.target.value }))}
                    rows={4} placeholder="추가 요청사항이나 견적 문의사항을 입력해 주세요."
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                {/* 유의사항 */}
                <div style={{ background: '#fef3c7', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                  ⚠ <b>유의사항:</b> 본 신청서는 개인 신청이 불가하며 단체·기업·기관 단위로만 접수됩니다.<br />
                  접수 후 담당자가 2~3 영업일 내 연락드립니다.
                </div>
                {/* 신청 버튼 */}
                <button onClick={handleSubmit} style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  background: accent, color: '#fff', fontWeight: 800, fontSize: 15,
                  cursor: 'pointer',
                }}>
                  {label} 신청하기
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        /* ── 신청결과 확인 탭 ── */
        <div>
          <div style={{ background: '#fafbfc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 12, display:'flex', alignItems:'center', gap:5 }}><Search size={14}/> 신청내역 조회</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>담당자 이름</label>
                <input value={resultName} onChange={e => setResultName(e.target.value)}
                  placeholder="신청 시 입력한 이름" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>접수확인용 비밀번호</label>
                <input type="password" value={resultPwd} onChange={e => setResultPwd(e.target.value)}
                  placeholder="비밀번호 입력" style={inputStyle} />
              </div>
            </div>
            <button onClick={searchResults} style={{
              width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
              background: accent, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>조회하기</button>
          </div>

          {/* 결과 리스트 (아코디언) */}
          {results.length > 0 ? (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              {results.map((it: any) => {
                const isOpen = expandedId === it.id
                const sc = STATUS_COLOR[it.status] || '#94a3b8'
                return (
                  <div key={it.id}>
                    <div onClick={() => setExpandedId(isOpen ? null : it.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                      borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                      background: isOpen ? '#f8fafc' : 'transparent', transition: 'background .15s',
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><ClipboardList size={15} color={accent}/></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{it.groupName}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{it.manager} · {it.regDate}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sc, padding: '3px 10px', borderRadius: 20, background: `${sc}15` }}>{it.status}</span>
                      <span style={{ color: '#94a3b8', fontSize: 18, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '16px 20px 20px 60px', borderBottom: '1px solid #e2e8f0', background: '#fcfcfd', animation: 'hp-fade-in .25s ease' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px', fontSize: 13 }}>
                          {[
                            ['상태', it.status],
                            ['신청일', it.regDate],
                            ['담당자', `${it.manager} / ${it.phone}`],
                            it.email && ['이메일', it.email],
                            it.checkin && ['체크인', it.checkin],
                            it.checkout && ['체크아웃', it.checkout],
                            it.headcount && ['인원', `${it.headcount}명`],
                            it.extras && ['추가사항', it.extras],
                            it.inquiry && ['문의사항', it.inquiry],
                            it.memo && ['메모', it.memo],
                          ].filter(Boolean).map((row: any, ri: number) => (
                            <React.Fragment key={ri}>
                              <span style={{ fontWeight: 700, color: '#64748b' }}>{row[0]}</span>
                              <span style={{ color: '#334155' }}>{row[1]}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px 0', fontSize: 14 }}>
              담당자 이름과 비밀번호로 조회해 주세요.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
