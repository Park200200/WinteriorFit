import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, LayoutGrid, Settings, Folder, Palette, Box, Hammer } from 'lucide-react';
import { NodeData, UserRole } from '../types';
import { CostTab, SidebarMode } from './StandardCost.types';
import { useAdminTheme } from './theme/AdminThemeContext';

interface StandardCostSidebarProps {
    activeTab: CostTab;
    nodes: Record<string, NodeData>;
    currentRootId: string;
    gridData: { id: string; path: string; node: NodeData }[];
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;
    activeMenuId: string | null;
    setActiveMenuId: (id: string | null) => void;
    setIsTreePopupOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleOpenProductManagement: (id: string) => void;
    handleOpenColorManagement: (id: string) => void;
    role?: UserRole;
    sidebarMode?: SidebarMode;
    setSidebarMode?: (mode: SidebarMode) => void;
    // 리사이즈용
    sidebarWidth: number;
    onResizeStart: (e: React.MouseEvent) => void;
}

const StandardCostSidebar: React.FC<StandardCostSidebarProps> = ({
    activeTab,
    nodes,
    currentRootId,
    gridData,
    selectedNodeId,
    setSelectedNodeId,
    activeMenuId,
    setActiveMenuId,
    setIsTreePopupOpen,
    handleOpenProductManagement,
    handleOpenColorManagement,
    role,
    sidebarMode = 'PRODUCT',
    setSidebarMode,
    sidebarWidth,
    onResizeStart,
}) => {
    const { theme } = useAdminTheme();
    const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
    const settingsBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    // activeMenuId가 바뀔 때 버튼 위치 계산
    useEffect(() => {
        if (activeMenuId) {
            const btn = settingsBtnRefs.current[activeMenuId];
            if (btn) {
                const rect = btn.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
            }
        } else {
            setMenuPos(null);
        }
    }, [activeMenuId]);
    const showSidebarTabs = role === UserRole.MANUFACTURER || role === UserRole.ADMIN || role === UserRole.FABRIC_SUPPLIER || role === UserRole.DISTRIBUTOR;

    return (
        <div
            className="flex flex-col border-r z-10 flex-shrink-0 relative"
            style={{ width: sidebarWidth, borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}
        >
            {/* Sidebar Mode Tabs (Manufacturer only) */}
            {showSidebarTabs && (
                <div className="px-4 pt-4 pb-2 border-b" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                    <div className="p-1 rounded-xl flex gap-1 border" style={{ background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                        <button
                            onClick={() => setSidebarMode?.('PRODUCT')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all`}
                            style={sidebarMode === 'PRODUCT'
                                ? { background: 'var(--theme-primary)', color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }
                                : { color: 'var(--theme-primary)' }}
                        >
                            <Box size={14} />
                            상품
                        </button>
                        <button
                            onClick={() => setSidebarMode?.('ASSEMBLY')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all`}
                            style={sidebarMode === 'ASSEMBLY'
                                ? { background: 'var(--theme-primary)', color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }
                                : { color: 'var(--theme-primary)' }}
                        >
                            <Hammer size={14} />
                            조립
                        </button>
                    </div>
                </div>
            )}

            {/* Column Header - 상품개요 스타일 */}
            <div className="px-4 py-3 border-b flex items-center justify-between"
                style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                <h2 className="text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    style={{ color: 'var(--admin-text-sub)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--theme-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-text-sub)'}
                    onClick={() => setIsTreePopupOpen(prev => !prev)}>
                    <LayoutGrid size={15} />
                    {(showSidebarTabs && sidebarMode === 'ASSEMBLY') || (!showSidebarTabs && activeTab === 'ASSEMBLY')
                        ? `시스템 카테고리`
                        : `상품 리스트`
                    }
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>
                    {gridData.length}건
                </span>
            </div>

            {/* List Content - 상품개요 스타일 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-0">
                {gridData.length === 0 ? (
                    <div className="h-60 flex flex-col items-center justify-center gap-3 opacity-60" style={{ color: 'var(--admin-text-muted)' }}>
                        <Search size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
                        <p className="text-sm font-bold">검색 결과가 없습니다.</p>
                        <p className="text-xs text-center px-8">카테고리를 선택하거나 다른 검색어로 <br />시도해 보세요.</p>
                    </div>
                ) : (
                    gridData.map((row) => {
                        const isSelected = selectedNodeId === row.id;
                        const isMenuOpen = activeMenuId === row.id;
                        // hasCost 확인
                        let hasCost = false;
                        try {
                            const costKeys = ['cost_fabric_list', 'cost_cutting_list', 'cost_measure_list'];
                            for (const key of costKeys) {
                                if (row.node.attributes?.[key]) {
                                    const list = JSON.parse(row.node.attributes[key]);
                                    if (Array.isArray(list) && list.length > 0) { hasCost = true; break; }
                                }
                            }
                        } catch (e) { }
                        // 경로 분리: 마지막 항목은 타이틀, 나머지는 서브
                        const parts = row.path.split(' > ');
                        const rowTitle = parts[parts.length - 1];
                        const rowSub = parts.length > 1 ? parts.slice(0, -1).join(' > ') : '';

                        return (
                            <button
                                id={`grid-row-${row.id}`}
                                key={row.id}
                                onClick={() => setSelectedNodeId(row.id)}
                                className="w-full text-left px-4 py-3 border-b transition-colors relative group"
                                style={isSelected
                                    ? { background: 'var(--theme-primary-bg)', borderLeft: '4px solid var(--theme-primary)', borderBottomColor: 'var(--admin-border)' }
                                    : { borderLeft: '4px solid transparent', borderBottomColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}
                            >
                                <div className="flex justify-between items-start mb-0.5 pr-6">
                                    <span className="font-bold text-sm truncate pr-2 flex items-center gap-1.5"
                                        style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)' }}>
                                        {/* 원가 설정 여부 표시 */}
                                        {hasCost && (
                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--theme-primary)' }} />
                                        )}
                                        {rowTitle}
                                    </span>
                                    {isSelected && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--theme-primary)' }} />}
                                </div>
                                {rowSub && (
                                    <p className="text-[10px] truncate" style={{ color: 'var(--admin-text-sub)' }}>
                                        {rowSub}
                                    </p>
                                )}

                                {/* 설정 버튼 - ASSEMBLY 모드 제외 */}
                                {activeTab !== 'ASSEMBLY' && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            ref={el => { settingsBtnRefs.current[row.id] = el; }}
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : row.id); }}
                                            className="p-1.5 rounded-md transition-colors"
                                            style={{ color: 'var(--theme-primary)', background: (isMenuOpen || isSelected) ? 'var(--theme-primary-bg)' : 'transparent' }}
                                        >
                                            <Settings size={13} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>

            {/* 드롭다운 메뉴 - fixed 포지션으로 overflow 클리핑 방지 */}
            {activeMenuId && menuPos && (
                <div
                    className="fixed rounded-xl shadow-xl z-[200] min-w-[140px] overflow-hidden flex flex-col py-1 ring-1 ring-black/5"
                    style={{ top: menuPos.top, right: menuPos.right, background: 'var(--admin-surface)' }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenProductManagement(activeMenuId); }}
                        className="px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 transition-colors"
                        style={{ color: 'var(--admin-text)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary-bg)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--admin-text)'; }}
                    >
                        <Folder size={14} /> 상품관리
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenColorManagement(activeMenuId); }}
                        className="px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 transition-colors"
                        style={{ color: 'var(--admin-text)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary-bg)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--admin-text)'; }}
                    >
                        <Palette size={14} /> 칼라관리
                    </button>
                </div>
            )}

            {/* 리사이즈 핸들 */}
            <div
                onMouseDown={onResizeStart}
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-30 transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            />
        </div>
    );
};

export default StandardCostSidebar;
