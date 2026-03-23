
import React, { useState, useMemo, useCallback } from 'react';
import {
    Search, Link2, Unlink, ChevronRight, ChevronDown, GitBranch,
    AlertCircle, CheckCircle2, ArrowLeftRight, Building2,
    Box, Folder, Tags, Package, Palette, Settings, Sliders, Calendar, MapPin, Users,
    Star, Circle, Hexagon, Triangle, Heart, Globe, Cloud, Zap, Anchor,
    Briefcase, Flag, Bookmark, Tag, Smile, FileText, Layers, Grid, Network, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProductContext } from './ProductContext';
import { usePartnerContext } from '../PartnerContext';
import { NodeData } from '../types';
import { useAdminTheme } from './theme/AdminThemeContext';

// ─── 아이콘 맵 ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
    Box, Folder, Tags, Package, Palette, Settings, Sliders, Calendar, MapPin, Users,
    Star, Circle, Hexagon, Triangle, Heart, Globe, Cloud, Zap, Anchor,
    Briefcase, Flag, Bookmark, Tag, Smile, FileText, Layers, Grid, Network, List
};

const DEFAULT_NODE_TYPES = [
    { id: 'root', label: '루트', icon: 'Network', color: 'text-gray-900 bg-gray-100 border-gray-600' },
    { id: 'category', label: '분류', icon: 'Folder', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'species', label: '상품종', icon: 'Tags', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'product', label: '상품', icon: 'Package', color: 'text-green-600 bg-green-50 border-green-200' },
    { id: 'color', label: '상품칼라', icon: 'Palette', color: 'text-pink-600 bg-pink-50 border-pink-200' },
    { id: 'system', label: '시스템', icon: 'Settings', color: 'text-gray-600 bg-gray-50 border-gray-200' },
    { id: 'item', label: '항목', icon: 'List', color: 'text-lime-600 bg-lime-50 border-lime-200' },
    { id: 'option', label: '옵션', icon: 'Sliders', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'date', label: '년월일시', icon: 'Calendar', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { id: 'address', label: '주소', icon: 'MapPin', color: 'text-red-600 bg-red-50 border-red-200' },
];

const getNodeTypeInfo = (node: NodeData) => {
    if (node.type === 'ROOT') return DEFAULT_NODE_TYPES[0];
    let typeDef = node.attributes?.nodeType
        ? DEFAULT_NODE_TYPES.find(t => t.id === node.attributes!.nodeType)
        : undefined;
    if (!typeDef) {
        if (node.type === 'CATEGORY') typeDef = DEFAULT_NODE_TYPES[1];
        else typeDef = DEFAULT_NODE_TYPES[3];
    }
    return typeDef || DEFAULT_NODE_TYPES[3];
};

type NodeLinkMap = Record<string, string>;
const LINK_STORAGE_KEY = 'winterior_node_links_v1';
const loadLinks = (): NodeLinkMap => {
    try { const s = localStorage.getItem(LINK_STORAGE_KEY); return s ? JSON.parse(s) : {}; } catch { return {}; }
};
const saveLinks = (links: NodeLinkMap) => {
    try { localStorage.setItem(LINK_STORAGE_KEY, JSON.stringify(links)); } catch { }
};
const getNodePath = (nodes: Record<string, NodeData>, nodeId: string): string => {
    const parts: string[] = [];
    let current: NodeData | undefined = nodes[nodeId];
    while (current) {
        parts.unshift(current.label);
        if (!current.parentId) break;
        current = nodes[current.parentId];
    }
    return parts.join(' > ');
};

// ─── 트리 아이템 ───────────────────────────────────────────────────────────────
interface TreeItemProps {
    nodeId: string;
    nodes: Record<string, NodeData>;
    depth: number;
    selectedId: string | null;
    onSelect: (id: string) => void;
    linkedNodeIds: Set<string>;
    highlightId?: string | null;
    autoExpandId?: string | null;
}

const TreeItem: React.FC<TreeItemProps> = ({
    nodeId, nodes, depth, selectedId, onSelect, linkedNodeIds, highlightId, autoExpandId
}) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const hasChildren = !!(node.childrenIds && node.childrenIds.length > 0);
    const isLinked = linkedNodeIds.has(nodeId);
    const isSelected = selectedId === nodeId;
    const isHighlighted = highlightId === nodeId;

    const hasTargetDescendant = useMemo(() => {
        if (!autoExpandId) return false;
        const check = (id: string, visited = new Set<string>()): boolean => {
            if (visited.has(id)) return false;
            visited.add(id);
            if (id === autoExpandId) return true;
            const n = nodes[id];
            return !!(n?.childrenIds?.some(cId => check(cId, visited)));
        };
        return check(nodeId);
    }, [autoExpandId, nodeId, nodes]);

    const [isExpanded, setIsExpanded] = useState(() => depth < 1 || hasTargetDescendant);

    React.useEffect(() => {
        if (hasTargetDescendant) setIsExpanded(true);
    }, [hasTargetDescendant]);

    const typeInfo = getNodeTypeInfo(node);
    const IconComp = ICON_MAP[typeInfo.icon] || Box;

    // 테마 적용 스타일 계산
    const rowStyle: React.CSSProperties = isSelected
        ? { background: 'var(--theme-primary-bg)', borderLeft: '4px solid var(--theme-primary)', borderBottomColor: 'var(--admin-border)', color: 'var(--theme-primary)', fontWeight: 700 }
        : isHighlighted
            ? { background: 'var(--admin-bg)', borderLeft: '4px solid transparent', borderBottomColor: 'var(--admin-border)', color: 'var(--admin-text)' }
            : { borderLeft: '4px solid transparent', borderBottomColor: 'var(--admin-border)', background: 'transparent', color: 'var(--admin-text)' };

    return (
        <div>
            <div
                onClick={() => { onSelect(nodeId); if (hasChildren) setIsExpanded(e => !e); }}
                className="flex items-center gap-1.5 py-2.5 px-2 cursor-pointer transition-colors select-none border-b w-full"
                style={{ paddingLeft: `${depth * 16 + 6}px`, ...rowStyle }}
                onMouseEnter={e => { if (!isSelected && !isHighlighted) e.currentTarget.style.background = 'var(--admin-bg)'; }}
                onMouseLeave={e => { if (!isSelected && !isHighlighted) e.currentTarget.style.background = 'transparent'; }}
            >
                <span className="flex-shrink-0 w-4 h-4" style={{ color: 'var(--admin-text-muted)' }}>
                    {hasChildren
                        ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)
                        : <span className="w-3.5 h-3.5 inline-block" />
                    }
                </span>

                <span className={`flex-shrink-0 p-0.5 rounded border text-[11px] ${typeInfo.color}`}>
                    <IconComp size={11} />
                </span>

                <span
                    className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${isLinked ? 'bg-emerald-500' : 'bg-red-400'}`}
                    title={isLinked ? '연결됨' : '미연결'}
                />

                <span className="text-sm truncate flex-1">{node.label}</span>

                {isLinked && (
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-bold border border-emerald-100 flex-shrink-0">
                        연결
                    </span>
                )}
                {isSelected && <div className="w-2 h-2 rounded-full flex-shrink-0 ml-1" style={{ background: 'var(--theme-primary)' }} />}
            </div>

            <AnimatePresence>
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        {node.childrenIds!.map(childId => (
                            <TreeItem
                                key={childId}
                                nodeId={childId}
                                nodes={nodes}
                                depth={depth + 1}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                linkedNodeIds={linkedNodeIds}
                                highlightId={highlightId}
                                autoExpandId={autoExpandId}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const TreeNodeLinker: React.FC = () => {
    const { nodes } = useProductContext();
    const { partners } = usePartnerContext();
    const { theme } = useAdminTheme();

    const [links, setLinks] = useState<NodeLinkMap>(loadLinks);
    const [partnerSearch, setPartnerSearch] = useState('');
    const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
    const [selectedPartnerNode, setSelectedPartnerNode] = useState<string | null>(null);
    const [selectedAdminNode, setSelectedAdminNode] = useState<string | null>(null);

    const filteredPartners = useMemo(() =>
        partners.filter(p =>
            p.partnerName.toLowerCase().includes(partnerSearch.toLowerCase()) ||
            p.partnerCode?.toLowerCase().includes(partnerSearch.toLowerCase())
        ),
        [partners, partnerSearch]
    );

    const handlePartnerClick = useCallback((partnerId: string) => {
        setExpandedPartnerId(prev => prev === partnerId ? null : partnerId);
        setSelectedPartnerNode(null);
    }, []);

    const getPartnerRootNodes = useCallback((partnerId: string): NodeData[] => {
        return (Object.values(nodes) as NodeData[])
            .filter(n => n.type === 'ROOT' && n.attributes?.partnerId === partnerId)
            .sort((a, b) => {
                const aIsMain = a.id.startsWith('root-partner-');
                const bIsMain = b.id.startsWith('root-partner-');
                if (aIsMain && !bIsMain) return -1;
                if (!aIsMain && bIsMain) return 1;
                return (a.label || '').localeCompare(b.label || '');
            });
    }, [nodes]);

    const linkedPartnerNodeIds = useMemo(() => new Set(Object.keys(links)), [links]);
    const linkedAdminNodeIds = useMemo(() => new Set(Object.values(links)), [links]);

    const highlightedAdminNodeId = useMemo(() =>
        selectedPartnerNode ? (links[selectedPartnerNode] || null) : null,
        [selectedPartnerNode, links]
    );

    const highlightedPartnerNodeId = useMemo(() =>
        selectedAdminNode
            ? (Object.entries(links).find(([, v]) => v === selectedAdminNode)?.[0] || null)
            : null,
        [selectedAdminNode, links]
    );

    const isCurrentPairLinked = useMemo(() =>
        !!(selectedPartnerNode && selectedAdminNode && links[selectedPartnerNode] === selectedAdminNode),
        [selectedPartnerNode, selectedAdminNode, links]
    );

    const handleLink = useCallback(() => {
        if (!selectedPartnerNode || !selectedAdminNode) return;
        const updated = { ...links, [selectedPartnerNode]: selectedAdminNode };
        setLinks(updated);
        saveLinks(updated);
    }, [selectedPartnerNode, selectedAdminNode, links]);

    const handleUnlink = useCallback(() => {
        if (!selectedPartnerNode) return;
        const updated = { ...links };
        delete updated[selectedPartnerNode];
        setLinks(updated);
        saveLinks(updated);
    }, [selectedPartnerNode, links]);

    const partnerNodePath = selectedPartnerNode ? getNodePath(nodes, selectedPartnerNode) : null;
    const adminNodePath = selectedAdminNode ? getNodePath(nodes, selectedAdminNode) : null;
    const existingLinkForAdmin = selectedAdminNode
        ? (Object.entries(links).find(([, v]) => v === selectedAdminNode)?.[0] || null)
        : null;

    const adminRootNodes = useMemo(() =>
        (Object.values(nodes) as NodeData[])
            .filter(n => n.type === 'ROOT' && !n.attributes?.partnerId)
            .sort((a, b) => a.id === 'root' ? -1 : 1),
        [nodes]
    );

    return (
        <div className="flex flex-col h-full overflow-hidden font-sans" style={{ background: 'var(--admin-bg)' }}>

            {/* 헤더 */}
            <div id="tree-linker-header" className="flex-shrink-0 border-b px-8 h-20 shadow-sm z-20 flex items-center justify-between gap-4"
                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="flex items-center gap-4 min-w-fit">
                    <GitBranch style={{ color: 'var(--theme-primary)' }} className="shrink-0" size={28} />
                    <h1 className="text-2xl font-bold whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>트리 연결 관리</h1>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                        연결 {Object.keys(links).length}개
                    </span>
                </div>
            </div>

            {/* 본문 3열 */}
            <div className="flex-1 flex overflow-hidden">

                {/* ── 좌측: 거래처 목록 + 아코디언 트리 ── */}
                <div className="w-[38%] flex flex-col border-r overflow-hidden"
                    style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>

                    {/* 검색 */}
                    <div className="flex-shrink-0 p-3 border-b" style={{ borderColor: 'var(--admin-border)' }}>
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--admin-text-muted)' }} />
                            <input
                                type="text"
                                value={partnerSearch}
                                onChange={e => setPartnerSearch(e.target.value)}
                                placeholder="거래처명 검색..."
                                className="w-full pl-7 pr-3 py-1.5 border rounded-lg text-xs outline-none transition-colors"
                                style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                            />
                        </div>
                    </div>

                    {/* 거래처 + 트리 아코디언 */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {filteredPartners.length === 0 && (
                            <div className="text-xs text-center py-8" style={{ color: 'var(--admin-text-muted)' }}>검색 결과 없음</div>
                        )}
                        {filteredPartners.map(partner => {
                            const isOpen = expandedPartnerId === partner.id;
                            const partnerRootNodes = getPartnerRootNodes(partner.id);
                            const hasAnyTree = partnerRootNodes.length > 0;

                            return (
                                <div key={partner.id} className="border-b" style={{ borderColor: 'var(--admin-border)' }}>
                                    {/* 거래처 행 */}
                                    <button
                                        onClick={() => handlePartnerClick(partner.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
                                        style={isOpen
                                            ? { background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }
                                            : { background: 'transparent', color: 'var(--admin-text)' }}
                                        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--admin-bg)'; }}
                                        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <span className="flex-shrink-0 p-1 rounded-md border transition-all"
                                            style={isOpen
                                                ? { background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' }
                                                : { background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}>
                                            <Building2 size={13} />
                                        </span>

                                        <span className="flex-1 text-xs font-medium truncate">{partner.partnerName}</span>

                                        {!hasAnyTree && (
                                            <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--admin-text-muted)' }}>트리없음</span>
                                        )}

                                        <span className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                                            style={{ color: 'var(--admin-text-muted)' }}>
                                            <ChevronRight size={13} />
                                        </span>
                                    </button>

                                    {/* 트리 아코디언 */}
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="overflow-hidden"
                                                style={{ background: 'var(--admin-bg)' }}
                                            >
                                                {!hasAnyTree ? (
                                                    <div className="flex items-center gap-2 px-6 py-3 text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                                                        <AlertCircle size={13} />
                                                        트리가 아직 생성되지 않았습니다
                                                    </div>
                                                ) : (
                                                    <div className="px-2 py-1.5 space-y-2">
                                                        {partnerRootNodes.map(rootNode => (
                                                            <div key={rootNode.id}>
                                                                <div className="flex items-center gap-1 px-1 py-0.5 mb-0.5">
                                                                    <span className={`p-0.5 rounded border ${DEFAULT_NODE_TYPES[0].color}`}>
                                                                        <Network size={10} />
                                                                    </span>
                                                                    <span className="text-[10px] font-bold truncate" style={{ color: 'var(--admin-text-muted)' }}>
                                                                        {rootNode.label || '트리'}
                                                                    </span>
                                                                </div>
                                                                {rootNode.childrenIds?.map(childId => (
                                                                    <TreeItem
                                                                        key={childId}
                                                                        nodeId={childId}
                                                                        nodes={nodes}
                                                                        depth={0}
                                                                        selectedId={selectedPartnerNode}
                                                                        onSelect={setSelectedPartnerNode}
                                                                        linkedNodeIds={linkedPartnerNodeIds}
                                                                        highlightId={highlightedPartnerNodeId}
                                                                        autoExpandId={highlightedPartnerNodeId}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── 가운데: 연결 컨트롤 ── */}
                <div className="w-56 flex-shrink-0 flex flex-col border-r p-3 gap-3 overflow-y-auto scrollbar-hide"
                    style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>

                    <div className="text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5"
                        style={{ color: 'var(--admin-text-muted)' }}>
                        <ArrowLeftRight size={12} />
                        연결 관리
                    </div>

                    {/* 거래처 노드 경로 */}
                    <div className="rounded-xl p-2.5 shadow-sm border"
                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                        <div className="text-[9px] font-bold uppercase mb-1.5 flex items-center gap-1" style={{ color: 'var(--admin-text-muted)' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            거래처 노드
                        </div>
                        {partnerNodePath
                            ? <p className="text-[11px] font-medium leading-relaxed break-words" style={{ color: 'var(--admin-text)' }}>{partnerNodePath}</p>
                            : <p className="text-[11px] italic" style={{ color: 'var(--admin-text-muted)' }}>노드를 선택하세요</p>
                        }
                        {selectedPartnerNode && links[selectedPartnerNode] && (
                            <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: 'var(--admin-border)' }}>
                                <p className="text-[9px] text-emerald-600 font-bold">✓ 연결됨</p>
                                <p className="text-[9px] truncate" style={{ color: 'var(--admin-text-muted)' }}>{getNodePath(nodes, links[selectedPartnerNode])}</p>
                            </div>
                        )}
                    </div>

                    {/* 연결/해지 버튼 */}
                    <div className="flex flex-col items-center gap-2">
                        <AnimatePresence mode="wait">
                            {isCurrentPairLinked ? (
                                <motion.button
                                    key="unlink"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={handleUnlink}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all"
                                >
                                    <Unlink size={14} />
                                    연결 해지
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="link"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={handleLink}
                                    disabled={!selectedPartnerNode || !selectedAdminNode}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all"
                                    style={selectedPartnerNode && selectedAdminNode
                                        ? { background: 'var(--theme-primary)', color: 'white' }
                                        : { background: 'var(--admin-bg)', color: 'var(--admin-text-muted)', cursor: 'not-allowed' }}
                                >
                                    <Link2 size={14} />
                                    연결
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {isCurrentPairLinked && (
                            <div className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 size={12} />
                                <span className="text-[10px] font-bold">연결된 상태</span>
                            </div>
                        )}
                    </div>

                    {/* 관리자 노드 경로 */}
                    <div className="rounded-xl p-2.5 shadow-sm border"
                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                        <div className="text-[9px] font-bold uppercase mb-1.5 flex items-center gap-1" style={{ color: 'var(--admin-text-muted)' }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--theme-primary)' }} />
                            관리자 노드
                        </div>
                        {adminNodePath
                            ? <p className="text-[11px] font-medium leading-relaxed break-words" style={{ color: 'var(--admin-text)' }}>{adminNodePath}</p>
                            : <p className="text-[11px] italic" style={{ color: 'var(--admin-text-muted)' }}>노드를 선택하세요</p>
                        }
                        {existingLinkForAdmin && (
                            <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: 'var(--admin-border)' }}>
                                <p className="text-[9px] text-emerald-600 font-bold">✓ 연결됨</p>
                                <p className="text-[9px] truncate" style={{ color: 'var(--admin-text-muted)' }}>{getNodePath(nodes, existingLinkForAdmin)}</p>
                            </div>
                        )}
                    </div>

                    {/* 연결 목록 요약 */}
                    {Object.keys(links).length > 0 && (
                        <div className="flex-1">
                            <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--admin-text-muted)' }}>
                                연결 목록 ({Object.keys(links).length})
                            </div>
                            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
                                {Object.entries(links).map(([pId, aId]) => (
                                    <div key={pId} className="flex items-center gap-1 text-[9px] rounded-lg px-2 py-1 border"
                                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                        <span className="text-red-400 truncate max-w-[60px]">{nodes[pId]?.label || pId}</span>
                                        <Link2 size={8} className="flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
                                        <span className="truncate max-w-[60px]" style={{ color: 'var(--theme-primary)' }}>{nodes[aId]?.label || aId}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 우측: 총괄관리사 전체 트리 ── */}
                <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--admin-surface)' }}>
                    <div className="flex-shrink-0 px-4 py-3 border-b" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--admin-text-muted)' }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--theme-primary)' }} />
                            총괄관리사 트리 (기본설정)
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                        {adminRootNodes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--admin-text-muted)' }}>
                                <AlertCircle size={28} strokeWidth={1} />
                                <p className="text-xs">트리 데이터 없음</p>
                            </div>
                        ) : (
                            adminRootNodes.map(rootNode => (
                                <div key={rootNode.id} className="mb-3">
                                    <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
                                        <span className={`p-0.5 rounded border text-[11px] ${DEFAULT_NODE_TYPES[0].color}`}>
                                            <Network size={11} />
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)' }}>
                                            {rootNode.label || '상품 트리'}
                                        </span>
                                    </div>
                                    {rootNode.childrenIds?.map(childId => (
                                        <TreeItem
                                            key={childId}
                                            nodeId={childId}
                                            nodes={nodes}
                                            depth={0}
                                            selectedId={selectedAdminNode}
                                            onSelect={setSelectedAdminNode}
                                            linkedNodeIds={linkedAdminNodeIds}
                                            highlightId={highlightedAdminNodeId}
                                            autoExpandId={highlightedAdminNodeId}
                                        />
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TreeNodeLinker;
