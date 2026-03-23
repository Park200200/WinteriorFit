import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem, UserRole } from '../types';
import { getMenusForRole, ROLE_CONFIGS } from '../constants';
import { ChevronLeft, ChevronRight, UserCircle2, ChevronDown, Download, Upload, X, Database, Users, Package, FileDown, FileUp } from 'lucide-react';
import { useProductContext } from './ProductContext';
import { usePartnerContext } from '../PartnerContext';
import { useAdminTheme } from './theme/AdminThemeContext';

interface SidebarProps {
  role: UserRole;
  currentPath: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  isInspectorActive?: boolean;
  onToggleInspector?: () => void;
}

const SIDEBAR_IDLE_TIMEOUT = 20000; // 20 seconds

const Sidebar: React.FC<SidebarProps> = ({ role, currentPath, onNavigate, onLogout, isInspectorActive, onToggleInspector }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isIdleHidden, setIsIdleHidden] = useState(false);
  // FABRIC_SUPPLIER는 기본현황 그룹을 기본으로 펼침
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(
    role === UserRole.FABRIC_SUPPLIER ? 'basic_overview' : null
  );
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const { nodes, setNodes } = useProductContext();
  const { partners, setPartners, standardCosts, setStandardCosts } = usePartnerContext();
  const { theme } = useAdminTheme(); // 테마 변경 시 즉시 리렌더링
  const [showBackupPopup, setShowBackupPopup] = useState(false);
  const [showRestorePopup, setShowRestorePopup] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string>('');
  // 접힌 상태의 아이콘 툴팁
  const [hoveredTooltip, setHoveredTooltip] = useState<{ label: string; badge?: number | string; isActive: boolean; y: number } | null>(null);

  // 메뉴별 스코프 매핑
  type BackupScope = 'partners' | 'products' | 'all';
  const getPageScope = (path: string): { scope: BackupScope; label: string } => {
    switch (path) {
      case 'partner_mgmt': case 'partners':
        return { scope: 'partners', label: '거래처 데이터' };
      case 'standard_product': case 'standard_cost': case 'purchase_settings':
      case 'sales_settings': case 'margin': case 'sales_price':
      case 'order_reception': case 'order_proc':
      case 'stock_in_reservation': case 'stock_in_confirmation': case 'stock_adjust':
        return { scope: 'products', label: '상품 데이터' };
      default:
        return { scope: 'all', label: '전체 데이터' };
    }
  };

  const currentPageScope = getPageScope(currentPath);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuItems = getMenusForRole(role);
  const roleConfig = ROLE_CONFIGS[role];

  // Enable Inspector for Admin and Fabric Supplier
  const canInspect = role === UserRole.ADMIN || role === UserRole.FABRIC_SUPPLIER;

  // Mobile check for initial state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Auto-hide Logic ---
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!isOpen) {
      idleTimerRef.current = setTimeout(() => {
        setIsIdleHidden(true);
      }, SIDEBAR_IDLE_TIMEOUT);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsIdleHidden(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    } else {
      resetIdleTimer();
      setExpandedMenuId(null);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen]);

  const handleRestore = () => {
    if (isIdleHidden) {
      setIsIdleHidden(false);
      resetIdleTimer();
    }
  };

  // --- 스코프별 백업 ---
  const handleScopedBackup = (scope: BackupScope) => {
    try {
      let backupData: any = { _meta: { scope, version: '2.0', timestamp: new Date().toISOString() } };
      const scopeNames: Record<BackupScope, string> = { partners: '거래처', products: '상품', all: '전체' };

      switch (scope) {
        case 'partners':
          backupData.partners = partners;
          backupData.standardCosts = standardCosts;
          break;
        case 'products':
          backupData.nodes = nodes;
          break;
        case 'all':
          backupData.partners = partners;
          backupData.standardCosts = standardCosts;
          backupData.nodes = nodes;
          break;
      }

      const dataStr = JSON.stringify(backupData);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      const sizeKB = Math.round(dataStr.length / 1024);
      const link = document.createElement('a');
      link.href = url;
      link.download = `winterior_${scopeNames[scope]}_${dateStr}_${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowBackupPopup(false);
      alert(`${scopeNames[scope]} 데이터 백업 완료! (${sizeKB}KB)`);
    } catch (e) {
      alert('백업 중 오류가 발생했습니다.');
    }
  };

  // --- 복구: 파일 선택창 열기 ---
  const handleDirectRestoreClick = () => {
    if (restoreInputRef.current) {
      restoreInputRef.current.value = '';
      restoreInputRef.current.click();
    }
    setShowRestorePopup(false);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object' || parsed === null) throw new Error('invalid');

        // 새 형식(스코프 메타데이터 포함) 감지
        if (parsed._meta && parsed._meta.scope) {
          const scope = parsed._meta.scope as BackupScope;
          const scopeNames: Record<string, string> = { partners: '거래처', products: '상품', all: '전체' };
          const scopeName = scopeNames[scope] || scope;
          const timestamp = parsed._meta.timestamp ? new Date(parsed._meta.timestamp).toLocaleString() : '알 수 없음';

          if (!window.confirm(`[${scopeName} 데이터] 백업 파일을 복구하시겠습니까?\n\n백업 시점: ${timestamp}\n범위: ${scopeName}\n\n해당 범위의 데이터만 덮어쓰며, 다른 데이터는 유지됩니다.`)) return;

          if (scope === 'partners' || scope === 'all') {
            if (parsed.partners) setPartners(parsed.partners);
            if (parsed.standardCosts) setStandardCosts(parsed.standardCosts);
          }
          if (scope === 'products' || scope === 'all') {
            if (parsed.nodes) setNodes(parsed.nodes);
          }
          alert(`${scopeName} 데이터가 성공적으로 복구되었습니다.`);
          setTimeout(() => window.location.reload(), 500);
        } else {
          // 구 형식(전체 nodes만 있는 형태) 호환
          if (!window.confirm('이전 형식의 백업 파일입니다.\n상품 데이터를 전체 복구하시겠습니까?\n(복구 후 자동 새로고침됩니다)')) return;
          setNodes(parsed);
          setTimeout(() => window.location.reload(), 800);
        }
      } catch {
        alert('올바르지 않은 백업 파일입니다.');
      }
    };
    reader.readAsText(file);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuClick = (item: MenuItem) => {
    if (!isOpen && isIdleHidden && item.isPersistent) {
      handleRestore();
      return;
    }

    if (item.action === 'LOGOUT') {
      onLogout();
      return;
    }

    if (item.subItems && item.subItems.length > 0) {
      if (!isOpen) setIsOpen(true);
      setExpandedMenuId(expandedMenuId === item.id ? null : item.id);
      return;
    }

    // Toggle Logic: If clicking the active menu, deselect it (go to empty state)
    if (currentPath === item.id) {
      onNavigate('');
    } else {
      onNavigate(item.id);
    }
  };

  const handleInspectorClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!onToggleInspector) return;

    // Logic: 
    // 1. If we are NOT on this page, go there AND ensure inspector is ON.
    // 2. If we ARE on this page, toggle inspector ON/OFF.
    const isCurrentPage = currentPath === itemId || (itemId === 'dashboard' && currentPath === '');

    if (!isCurrentPage) {
      onNavigate(itemId);
      if (!isInspectorActive) {
        onToggleInspector();
      }
    } else {
      onToggleInspector();
    }
  };

  const renderUserInfo = () => {
    if (role === UserRole.GUEST) return null;

    return (
      <motion.div
        id="sidebar-user-info"
        className={`mb-6 p-3 rounded-2xl flex flex-col items-center gap-2 transition-all duration-500 border border-transparent
        ${isOpen ? 'bg-gradient-to-b from-gray-50 to-white shadow-sm border-gray-100' : 'bg-transparent'}
        ${isIdleHidden && !isOpen ? 'opacity-0' : 'opacity-100'}
        `}
        layout
      >
        <div className="relative group cursor-pointer">
          <div className={`rounded-full p-0.5 border-2 ${isOpen ? 'border-gray-200' : 'border-transparent'}`}>
            <UserCircle2 size={isOpen ? 40 : 28} className="text-gray-400" />
          </div>
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${roleConfig.color} shadow-sm z-10`}></div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.9 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.9 }}
              className="text-center w-full"
            >
              <p className="font-bold text-gray-800 text-sm truncate">김관리</p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 text-white shadow-sm ${roleConfig.color}`}>
                {roleConfig.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // --- LOCAL PARTICLE SYSTEM FOR SIDEBAR ---
  const InteractiveParticleBackground = ({ variant = 'light', count = 15, connectionDistance = 80 }: { variant?: 'light' | 'dark', count?: number, connectionDistance?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<any[]>([]);
    const mouseState = useRef({ x: -1000, y: -1000, isClicking: false });

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;

      const initParticles = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        particlesRef.current = Array.from({ length: count }, () => {
          const speedScale = Math.random() * 0.5 + 0.5;
          return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.5 * speedScale,
            vy: (Math.random() - 0.5) * 1.5 * speedScale,
            size: Math.random() * (variant === 'light' ? 1.5 : 2.5) + 0.5,
            baseSpeed: speedScale,
            alpha: Math.random() * 0.3 + 0.1,
            mass: Math.random() * 0.5 + 0.5
          };
        });
      };

      const animate = () => {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { width, height } = canvas;
        const pColor = variant === 'light' ? '255, 255, 255' : '37, 99, 235';

        const time = Date.now() * 0.001;
        const windX = Math.sin(time * 0.5) * 0.08;
        const windY = Math.cos(time * 0.3) * 0.08;

        particlesRef.current.forEach((p, i) => {
          p.vx += windX;
          p.vy += windY;
          p.x += p.vx;
          p.y += p.vy;

          const dx = mouseState.current.x - p.x;
          const dy = mouseState.current.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const interactionRadius = 200;

          if (d < interactionRadius && d > 10) {
            if (mouseState.current.isClicking) {
              const force = Math.pow((interactionRadius - d) / interactionRadius, 3);
              const push = (15 / p.mass) * force;
              p.vx -= (dx / d) * push;
              p.vy -= (dy / d) * push;
            } else {
              const force = Math.pow((interactionRadius - d) / interactionRadius, 2);
              const pull = (0.3 / p.mass) * force;
              p.vx += (dx / d) * pull;
              p.vy += (dy / d) * pull;
            }
          }

          p.vx *= 0.98;
          p.vy *= 0.98;

          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;

          if (connectionDistance > 0) {
            for (let j = i + 1; j < particlesRef.current.length; j++) {
              const p2 = particlesRef.current[j];
              const dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
              if (dist < connectionDistance) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${pColor}, ${(1 - dist / connectionDistance) * 0.12})`;
                ctx.lineWidth = 0.4;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pColor}, ${p.alpha})`;
          ctx.fill();
        });

        animationFrameId = requestAnimationFrame(animate);
      };

      initParticles();
      animate();
      return () => cancelAnimationFrame(animationFrameId);
    }, [variant, count, connectionDistance]);

    return (
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-60">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    );
  };

  // Removed ai_contents from promo page logic to keep sidebar background consistent as per user request
  const isPromoPage = currentPath === 'ai_catalog';

  return (
    <>
    {/* Fixed 전역 툴팁 — 접힌 사이드바 아이콘 호버 시 표시 */}
    {!isOpen && hoveredTooltip && (
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{ left: 76 + 12, top: hoveredTooltip.y, transform: 'translateY(-50%)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
          style={{
            background: 'var(--admin-surface)',
            border: `1px solid ${hoveredTooltip.isActive ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
            color: hoveredTooltip.isActive ? 'var(--theme-primary)' : 'var(--admin-text)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {/* 왼쪽 삼각형 화살표 */}
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight: `5px solid ${hoveredTooltip.isActive ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
            }}
          />
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 translate-x-[1px] w-0 h-0"
            style={{
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
              borderRight: `4px solid var(--admin-surface)`,
            }}
          />
          {hoveredTooltip.label}
          {hoveredTooltip.badge && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-red-500 rounded-full">
              {hoveredTooltip.badge}
            </span>
          )}
        </div>
      </div>
    )}
    <motion.div
      id="sidebar-container"
      className={`h-screen flex flex-col z-40 relative flex-shrink-0 transition-all duration-500
        ${isIdleHidden && !isOpen
          ? 'bg-transparent shadow-none border-r border-transparent'
          : isPromoPage
            ? 'bg-white/10 backdrop-blur-[40px] shadow-[4px_0_32px_rgba(0,0,0,0.15)] border-r border-white/20'
            : 'backdrop-blur-xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r'
        }
      `}
      style={(!isIdleHidden || isOpen) && !isPromoPage ? { background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' } : undefined}
      initial={false}
      animate={{
        width: isOpen ? 240 : 76
      }}
      transition={{ type: "spring", stiffness: 250, damping: 25 }}
      onMouseEnter={() => {
        if (!isOpen && !isIdleHidden) resetIdleTimer();
      }}
    >
      {/* BACKGROUND PARTICLE FOR PROMO PAGE */}
      {isPromoPage && !isIdleHidden && <InteractiveParticleBackground variant="light" count={12} connectionDistance={60} />}
      {/* 1. Header: Brand Logo — 항상 표시 */}
      <div id="sidebar-header" className="h-20 flex items-center justify-center transition-all duration-500 relative pointer-events-auto">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={isOpen ? undefined : handleRestore}
        >
          <div className={`w-9 h-9 bg-gradient-to-br transition-all duration-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 ${isPromoPage ? 'from-blue-400 to-indigo-500 shadow-blue-500/40' : 'from-blue-600 to-indigo-600 shadow-blue-500/20'}`}>
            W
          </div>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`font-bold text-lg tracking-tight transition-colors duration-500 ${isPromoPage ? 'text-white drop-shadow-md' : 'text-gray-800'}`}
            >
              Winterior<span className={isPromoPage ? 'text-blue-200' : 'text-blue-600'}>Fit</span>
            </motion.span>
          )}
        </div>
      </div>

      {/* 2. Sidebar Toggle Button */}
      <div className={`absolute top-8 -right-3 z-50 pointer-events-auto transition-opacity duration-300 ${isIdleHidden && !isOpen ? 'opacity-0' : 'opacity-100'}`}>
        <motion.button
          id="sidebar-toggle-btn"
          onClick={handleToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-6 h-6 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="Toggle Sidebar"
        >
          {isOpen ? <ChevronLeft size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
        </motion.button>
      </div>

      {/* 3. Content Area */}
      <div className={`flex-1 overflow-y-auto scrollbar-hide py-2 px-3 flex flex-col items-center pointer-events-auto transition-opacity duration-500
          ${isIdleHidden && !isOpen ? 'pointer-events-none' : ''} 
      `} style={{ overflowX: 'visible' }}>
        {/* User Info Section */}
        {renderUserInfo()}

        {/* Menu List */}
        <div className="space-y-1.5 flex-1 w-full">
          {menuItems.map((item) => {
            if (item.isBottomFixed) return null;

            const isSelfActive = currentPath === item.id || (item.id === 'dashboard' && currentPath === '') || (item.id === 'basic_overview' && currentPath === '');
            const isChildActive = item.subItems?.some(sub => sub.id === currentPath || (sub.id === 'dashboard' && currentPath === '')) ?? false;
            // Only consider active if currentPath is NOT empty, or if we are strictly handling default dashboard
            const isActive = currentPath !== '' && (isSelfActive || isChildActive) || (currentPath === '' && (isSelfActive || isChildActive));

            const isVisibleInIdle = !isIdleHidden || item.isPersistent;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenuId === item.id;

            return (
              <div key={item.id} className="w-full relative">


                <motion.button
                  id={`menu-item-${item.id}`}
                  onClick={() => handleMenuClick(item)}
                  className={`group/btn flex items-center w-full rounded-xl transition-all duration-300 relative overflow-visible
                      ${isOpen ? 'px-4 py-3 justify-start gap-3' : 'justify-center py-3 aspect-square'}
                      ${isActive
                      ? isPromoPage ? 'text-blue-300 font-bold bg-white/20 shadow-lg border border-white/20' : 'font-bold shadow-sm'
                      : isPromoPage ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'hover:brightness-95'}
                      ${!isVisibleInIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                    `}
                  style={(!isPromoPage && isActive) ? { color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }
                    : (!isPromoPage && !isActive) ? { color: 'var(--admin-text-sub)' } : undefined}
                  whileHover={{ scale: isOpen ? 1.02 : 1.1 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={e => {
                    if (!isOpen) {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setHoveredTooltip({ label: item.label, badge: item.badge, isActive, y: rect.top + rect.height / 2 });
                    }
                  }}
                  onMouseLeave={() => setHoveredTooltip(null)}
                >
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    <item.icon
                      size={isOpen ? 20 : 22}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-colors duration-150 ${isActive ? isPromoPage ? 'text-blue-300' : '' : isPromoPage ? 'text-white/50 group-hover/btn:text-white' : 'text-gray-400'}`}
                      style={isActive && !isPromoPage ? { color: 'var(--theme-primary)' } : undefined}
                      onMouseEnter={e => { if (!isActive && !isPromoPage) (e.currentTarget as SVGElement).style.color = 'var(--theme-primary)'; }}
                      onMouseLeave={e => { if (!isActive && !isPromoPage) (e.currentTarget as SVGElement).style.color = ''; }}
                    />
                    {/* Notification Badge */}
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-red-500 rounded-full border border-white shadow-sm z-20">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Label (Expanded) */}
                  {isOpen && (
                    <>
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-sm z-10 flex-1 text-left truncate"
                      >
                        {item.label}
                      </motion.span>

                      {hasSubItems && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          className="text-gray-300 group-hover/btn:text-gray-500 ml-1"
                        >
                          <ChevronDown size={14} />
                        </motion.div>
                      )}
                    </>
                  )}

                </motion.button>

                {/* Sub-menu rendering */}
                <AnimatePresence>
                  {hasSubItems && isExpanded && isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden w-full pl-9 pr-2 space-y-1 mt-1"
                    >
                      {item.subItems!.map((sub) => {
                        const isSubActive = currentPath === sub.id;
                        return (
                          <button
                            id={`submenu-item-${sub.id}`}
                            key={sub.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentPath === sub.id) {
                                onNavigate(''); // Toggle Off Submenu
                              } else {
                                onNavigate(sub.id);
                              }
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all relative group/sub
                                          ${isSubActive
                                ? 'font-bold'
                                : 'hover:brightness-95'}`}
                            style={isSubActive
                              ? { color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }
                              : { color: 'var(--admin-text-sub)' }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: isSubActive ? 'var(--theme-primary)' : '#d1d5db' }} />
                            <span className="whitespace-nowrap flex-1 text-left">{sub.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Area */}
      <div className={`p-4 text-center relative pointer-events-auto transition-opacity duration-300 flex flex-col gap-2 ${isIdleHidden && !isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

        {/* 백업 / 복구 버튼 2개 */}
        {isOpen && (
          <div className="relative">
            <div className="flex gap-2">
              <button
                onClick={() => { setShowBackupPopup(!showBackupPopup); setShowRestorePopup(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors border border-blue-100 hover:border-blue-300"
                title="데이터 백업"
              >
                <Download size={13} />
                <span>백업</span>
              </button>
              <button
                onClick={() => { setShowRestorePopup(!showRestorePopup); setShowBackupPopup(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors border border-amber-100 hover:border-amber-300"
                title="데이터 복구"
              >
                <Upload size={13} />
                <span>복구</span>
              </button>
            </div>

            {/* 백업 팝업 */}
            <AnimatePresence>
              {showBackupPopup && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><FileDown size={14} className="text-blue-500" />백업 범위 선택</span>
                    <button onClick={() => setShowBackupPopup(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                  </div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => handleScopedBackup('partners')}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                    >
                      <Users size={16} className="text-emerald-500" />
                      <div>
                        <div className="text-xs font-bold text-gray-700 group-hover:text-blue-600">거래처 데이터</div>
                        <div className="text-[10px] text-gray-400">거래처 목록 + 표준원가 설정</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleScopedBackup('products')}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                    >
                      <Package size={16} className="text-purple-500" />
                      <div>
                        <div className="text-xs font-bold text-gray-700 group-hover:text-blue-600">상품 데이터</div>
                        <div className="text-[10px] text-gray-400">상품/원가/판매단가/시스템 설정</div>
                      </div>
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => handleScopedBackup('all')}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-amber-50 transition-colors text-left group"
                    >
                      <Database size={16} className="text-amber-500" />
                      <div>
                        <div className="text-xs font-bold text-gray-700 group-hover:text-amber-600">전체 데이터</div>
                        <div className="text-[10px] text-gray-400">거래처 + 상품 모든 데이터</div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 복구 팝업 */}
            <AnimatePresence>
              {showRestorePopup && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><FileUp size={14} className="text-amber-500" />백업 파일 복구</span>
                    <button onClick={() => setShowRestorePopup(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      백업 파일(.json)을 선택하면, 파일에 포함된 데이터 범위를 자동 감지하여 해당 범위만 복구합니다.
                    </p>
                    <button
                      onClick={handleDirectRestoreClick}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs transition-colors border border-amber-200"
                    >
                      <Upload size={14} />
                      <span>백업 파일 선택</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {isOpen && <p className="text-[10px] text-gray-300 font-medium">v1.2.0 (Stable)</p>}
      </div>

      {/* 복구용 숨김 파일 Input */}
      <input
        ref={restoreInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleRestoreFile}
      />
    </motion.div>
    </>
  );
};

export default Sidebar;
