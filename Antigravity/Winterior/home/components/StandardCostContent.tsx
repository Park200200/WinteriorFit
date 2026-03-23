import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scroll, Scissors, Hammer, Ruler,
    Edit3, X, LayoutGrid, Layers, Grid,
    ArrowRight, Maximize, CheckCircle2, Plus, Trash2, Calculator, Check, BoxSelect, Save, Box, Settings, Database, FileText,
    Image as ImageIcon, Video, UploadCloud, Film
} from 'lucide-react';
import { NodeData, UserRole } from '../types';
import { CostTab, SidebarMode, FabricCostItem, GridSizeItem, CuttingCostItem, MeasureCostItem, PartCostItem, BomItem } from './StandardCost.types';
import { CATEGORY_OPTIONS, MEASURE_CATEGORY_OPTIONS, MEASURE_UNIT_OPTIONS, parseNumber } from './StandardCost.helpers';
import { useStandardCostCalculations } from './StandardCost.hooks';
import MindMapSystem from './MindMapSystem';
import { useAdminTheme } from './theme/AdminThemeContext';

interface StandardCostContentProps {
    activeTab: CostTab;
    setActiveTab: (tab: CostTab) => void;
    selectedNodeId: string | null;
    nodes: Record<string, NodeData>;
    costLabel: string;

    // Data & Selection
    linkedSystemCategory: NodeData | null;
    assemblyPaths: string[];
    currentRootId: string;

    // Selection State
    expandedAssemblyNodes: Set<string>;
    toggleAssemblyNode: (id: string) => void;

    // Calculations Hook Return
    calculations: ReturnType<typeof useStandardCostCalculations>;
    getAssemblySystemChildren: (nid: string) => NodeData[];
    role?: UserRole;
    sidebarMode?: SidebarMode;
    referenceCuttingPrice: number;
}

const TABS: { id: CostTab; label: string; icon: React.ElementType }[] = [
    { id: 'FABRIC', label: '원단', icon: Scroll },
    { id: 'CUTTING', label: '제단', icon: Scissors },
    { id: 'ASSEMBLY', label: '조립', icon: Hammer },
    { id: 'MEASURE', label: '실사', icon: Ruler },
];

const StandardCostContent: React.FC<StandardCostContentProps> = ({
    activeTab, setActiveTab, selectedNodeId, nodes, costLabel,
    linkedSystemCategory, assemblyPaths, currentRootId,
    expandedAssemblyNodes, toggleAssemblyNode,
    calculations, getAssemblySystemChildren,
    role, sidebarMode = 'PRODUCT',
    referenceCuttingPrice
}) => {
    const { theme } = useAdminTheme();
    const {
        fabricCosts, editForm, setEditForm, handleFormChange, startNewEntry, saveEntry, deleteEntry, editEntry,
        cuttingCosts, cuttingEditForm, setCuttingEditForm, handleCuttingFormChange, startNewCuttingEntry, saveCuttingEntry, deleteCuttingEntry, editCuttingEntry,
        measureCosts, measureEditForm, setMeasureEditForm, measureFormUnit, measureFormPrices,
        handleMeasureUnitChange, handleMeasurePriceChange, startNewMeasureEntry, saveMeasureEntry, deleteMeasureEntry, editMeasureEntry,
        assemblyCosts, handleAssemblyPriceChange, handleAssemblyUnitChange, handleAssemblyBomChange, saveAssemblyEntry,
        partsCosts, partsEditForm, setPartsEditForm, handlePartsFormChange, startNewPartsEntry, savePartsEntry, deletePartsEntry, editPartsEntry,
        getProductWidths
    } = calculations;

    const [assemblySubTab, setAssemblySubTab] = useState<'PARTS' | 'PRODUCTION'>('PARTS');
    const [bomModalNodeId, setBomModalNodeId] = useState<string | null>(null);
    const [editingBomList, setEditingBomList] = useState<BomItem[]>([]);

    // Content Modal State
    const [contentModalNodeId, setContentModalNodeId] = useState<string | null>(null);
    const [editingContents, setEditingContents] = useState<{ id: string, type: 'IMAGE' | 'VIDEO', url: string, name: string }[]>([]);

    const openBomModal = (nodeId: string) => {
        setBomModalNodeId(nodeId);
        setEditingBomList(assemblyCosts[nodeId]?.bomList || []);
    };

    const closeBomModal = () => {
        setBomModalNodeId(null);
        setEditingBomList([]);
    };

    const saveBomModal = () => {
        if (bomModalNodeId) {
            handleAssemblyBomChange(bomModalNodeId, editingBomList);
        }
        closeBomModal();
    };

    const addBomRow = () => {
        setEditingBomList(prev => [
            ...prev,
            { id: `bom-${Date.now()}`, partId: '', usageUnit: 'ea', usageQty: '1', extraFormula: '' }
        ]);
    };

    const deleteBomRow = (id: string) => {
        setEditingBomList(prev => prev.filter(item => item.id !== id));
    };

    const updateBomRow = (id: string, field: keyof BomItem, value: string) => {
        setEditingBomList(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    // --- Content Modal Handlers ---
    const openContentModal = (nodeId: string) => {
        setContentModalNodeId(nodeId);
        // localStorage에서 기존 컨텐츠 불러오기
        try {
            const saved = localStorage.getItem(`content_media_${nodeId}`);
            if (saved) {
                setEditingContents(JSON.parse(saved));
            } else {
                setEditingContents([]);
            }
        } catch {
            setEditingContents([]);
        }
    };

    const closeContentModal = () => {
        setContentModalNodeId(null);
        setEditingContents([]);
    };

    const saveContentModal = () => {
        if (contentModalNodeId) {
            // localStorage에 저장
            try {
                localStorage.setItem(`content_media_${contentModalNodeId}`, JSON.stringify(editingContents));
                console.log(`Saved ${editingContents.length} contents for node ${contentModalNodeId}`);
            } catch (err) {
                console.error('Failed to save contents:', err);
                alert('저장에 실패했습니다. 파일 용량이 너무 클 수 있습니다.');
                return;
            }
        }
        closeContentModal();
    };

    const contentFileInputRef = useRef<HTMLInputElement>(null);

    const handleContentFileSelect = () => {
        contentFileInputRef.current?.click();
    };

    const handleContentFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file: File) => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            if (!isImage && !isVideo) return;

            // 50MB 제한
            if (file.size > 50 * 1024 * 1024) {
                alert(`${file.name}은(는) 50MB를 초과합니다.`);
                return;
            }

            if (isImage) {
                // 이미지: Canvas로 리사이즈 & 압축하여 localStorage 용량 절약
                const img = new Image();
                const objectUrl = URL.createObjectURL(file);
                img.onload = () => {
                    const MAX_SIZE = 400;
                    let w = img.width, h = img.height;
                    if (w > MAX_SIZE || h > MAX_SIZE) {
                        if (w > h) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE; }
                        else { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, w, h);
                    const compressedUrl = canvas.toDataURL('image/jpeg', 0.6);
                    URL.revokeObjectURL(objectUrl);

                    const newContent = {
                        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        type: 'IMAGE' as 'IMAGE' | 'VIDEO',
                        url: compressedUrl,
                        name: file.name
                    };
                    setEditingContents(prev => [...prev, newContent]);
                };
                img.src = objectUrl;
            } else {
                // 동영상: URL만 저장 (미리보기용, 용량 절약)
                const newContent = {
                    id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    type: 'VIDEO' as 'IMAGE' | 'VIDEO',
                    url: '',
                    name: file.name
                };
                setEditingContents(prev => [...prev, newContent]);
            }
        });

        // 같은 파일 재선택 가능하도록 초기화
        e.target.value = '';
    };

    const removeContent = (id: string) => {
        setEditingContents(prev => prev.filter(c => c.id !== id));
    };

    // Track rendered nodes to prevent infinite recursion
    const renderedAssemblyNids = useMemo(() => new Set<string>(), [activeTab, linkedSystemCategory]);

    // Reference Variables: referenceCuttingPrice is passed as prop from StandardCost.tsx
    // It is dynamically calculated as the average of cuttingCosts standardPrice values.

    const renderAssemblyNode = (nid: string, hierarchy: boolean[] = [], isLast: boolean = false) => {
        // Simple recursion check
        if (hierarchy.length > 20) return null; // Safety break

        const node = nodes[nid];
        if (!node) return null;

        // Get technical system children
        const children = getAssemblySystemChildren(nid);
        const isLeaf = children.length === 0;
        const isExpanded = expandedAssemblyNodes.has(nid);

        // Use the system definition for the label/info
        const systemNode = node.attributes?.originalSourceId ? nodes[node.attributes.originalSourceId] || node : node;

        const depth = hierarchy.length > 0 ? hierarchy.length - 1 : 0;

        return (
            <div key={`${nid}-${hierarchy.join(',')}`} className="flex flex-col relative">
                {/* Node Row */}
                <div className={`flex items-stretch gap-0 transition-all border-b border-gray-50/50 hover:bg-gray-50 ${isLeaf ? 'bg-white' : ''}`}>

                    {/* Indentation / Tree Lines */}
                    {hierarchy.length > 0 && (
                        <div className="flex-shrink-0 flex text-gray-300 select-none self-stretch">
                            {hierarchy.map((isLastAncestor, idx) => {
                                const isCurrentNodeLevel = idx === hierarchy.length - 1;

                                if (isCurrentNodeLevel) {
                                    return (
                                        <div key={idx} className="w-6 relative">
                                            {/* Vertical line from top to middle */}
                                            <div className="absolute left-1/2 top-0 bottom-1/2 w-px bg-gray-300 -ml-px" />
                                            {/* If NOT last, vertical line continues down */}
                                            {!isLast && (
                                                <div className="absolute left-1/2 top-1/2 bottom-0 w-px bg-gray-300 -ml-px" />
                                            )}
                                            {/* Horizontal line to right */}
                                            <div className="absolute left-1/2 top-1/2 right-0 h-px bg-gray-300 -mt-px" />
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div key={idx} className="w-6 relative">
                                            {!isLastAncestor && (
                                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 -ml-px" />
                                            )}
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 flex items-center py-2 pr-4 relative group">
                        {/* Folder/Item Icon */}
                        <div className="mr-3 text-gray-400 relative z-10">
                            {isLeaf ? (
                                <div className="w-5 h-5 bg-blue-50 text-blue-500 rounded-md flex items-center justify-center">
                                    <Grid size={12} />
                                </div>
                            ) : (
                                <button
                                    onClick={() => toggleAssemblyNode(nid)}
                                    className="w-5 h-5 hover:bg-gray-200 rounded-md flex items-center justify-center transition-colors focus:outline-none"
                                >
                                    <Layers size={14} className={isExpanded ? 'text-blue-500' : 'text-gray-400'} />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`text-sm tracking-tight ${isLeaf ? 'font-bold text-gray-700' : 'font-semibold text-gray-600'}`}>
                                    {systemNode.label}
                                </span>
                                {!isLeaf && (
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 rounded-full font-bold">
                                        {children.length}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Input Area (모든 노드에 단위/금액 입력) */}
                        <div className="flex items-center gap-3">
                            {/* 컨텐츠등록 Button */}
                            {(() => {
                                let hasContent = false;
                                try {
                                    const saved = localStorage.getItem(`content_media_${systemNode.id}`);
                                    if (saved) { const arr = JSON.parse(saved); hasContent = Array.isArray(arr) && arr.length > 0; }
                                } catch { }
                                return (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openContentModal(systemNode.id);
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${hasContent
                                            ? 'bg-white border-purple-200 text-purple-600 hover:bg-purple-50'
                                            : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        <FileText size={12} /> 컨텐츠등록
                                    </button>
                                );
                            })()}

                            {/* BOM Button */}
                            <button
                                onClick={() => openBomModal(systemNode.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${(assemblyCosts[systemNode.id]?.bomList && assemblyCosts[systemNode.id].bomList!.length > 0)
                                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <Database size={12} />
                                BOM{assemblyCosts[systemNode.id]?.bomList?.length ? ` (${assemblyCosts[systemNode.id].bomList!.length})` : ''}
                            </button>

                            {/* Unit Select */}
                            <div className="relative">
                                <select
                                    value={assemblyCosts[systemNode.id]?.unit || '개'}
                                    onChange={(e) => handleAssemblyUnitChange(systemNode.id, e.target.value)}
                                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg pl-3 pr-7 py-1.5 focus:border-blue-500 focus:bg-white outline-none cursor-pointer"
                                >
                                    <option value="개">개</option>
                                    <option value="set">set</option>
                                    <option value="m">m</option>
                                    <option value="ea">ea</option>
                                    <option value="항">항</option>
                                    <option value="cm">cm</option>
                                    <option value="가로길이">가로</option>
                                    <option value="세로길이">세로</option>
                                    <option value="㎡">㎡</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <Grid size={10} />
                                </div>
                            </div>

                            {/* Price Input */}
                            <div className="relative w-32">
                                <input
                                    type="text"
                                    value={assemblyCosts[systemNode.id]?.price || ''}
                                    onChange={(e) => handleAssemblyPriceChange(systemNode.id, e.target.value)}
                                    placeholder="0"
                                    className={`w-full bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-sm font-bold text-right placeholder:text-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all ${assemblyCosts[systemNode.id]?.price ? 'text-blue-600 border-blue-200' : 'text-gray-600'}`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">원</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Children Recursive Render */}
                <AnimatePresence>
                    {isExpanded && children.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-col">
                                {children.map((child, idx) => {
                                    const nextHierarchy = [...hierarchy, idx === children.length - 1];
                                    return renderAssemblyNode(child.id, nextHierarchy, idx === children.length - 1);
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-[500px]" style={{ background: 'var(--admin-bg)' }}>
            {selectedNodeId ? (
                <div className="flex flex-col h-full overflow-y-auto scrollbar-hide p-8">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200/60">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl shadow-sm border flex items-center justify-center ring-1 ring-black/5"
                                style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', borderColor: 'var(--admin-border)' }}>
                                {activeTab === 'FABRIC' && <Scroll size={28} strokeWidth={1.5} />}
                                {activeTab === 'CUTTING' && <Scissors size={28} strokeWidth={1.5} />}
                                {activeTab === 'ASSEMBLY' && <Hammer size={28} strokeWidth={1.5} />}
                                {activeTab === 'MEASURE' && <Ruler size={28} strokeWidth={1.5} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--admin-text)' }}>
                                    {activeTab === 'FABRIC' && `원단${costLabel} 설정`}
                                    {activeTab === 'CUTTING' && `제단${costLabel} 설정`}
                                    {activeTab === 'ASSEMBLY' && '조립비 설정'}
                                    {activeTab === 'MEASURE' && `실사${costLabel} 설정`}
                                </h2>
                                <p className="text-sm font-bold mt-1 flex items-center gap-2" style={{ color: 'var(--admin-text-muted)' }}>
                                    {activeTab === 'ASSEMBLY' ? (
                                        <span className="px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                                            style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }}>
                                            <LayoutGrid size={14} />
                                            {linkedSystemCategory ? linkedSystemCategory.label : nodes[selectedNodeId]?.label}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--admin-text-sub)' }}>{nodes[selectedNodeId]?.label}</span>
                                    )}
                                    {activeTab === 'MEASURE' && measureCosts.length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <CheckCircle2 size={12} strokeWidth={3} />
                                            실사가능
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Cost Tabs - 원단/제단/실사/조립 */}
                        <div id="cost-tabs" className="p-1.5 rounded-2xl flex gap-1 shadow-inner border"
                            style={{ background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                            {activeTab === 'ASSEMBLY' ? (
                                <>
                                    <button
                                        onClick={() => setAssemblySubTab('PARTS')}
                                        className={`relative px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2.5 transition-all duration-300 z-10`}
                                        style={assemblySubTab === 'PARTS' ? { color: 'var(--theme-primary)' } : { color: 'var(--admin-text-muted)' }}
                                    >
                                        {assemblySubTab === 'PARTS' && <motion.div layoutId="subtab-active" className="absolute inset-0 rounded-xl shadow-md border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                                        <Box size={16} strokeWidth={2.5} className="relative z-10" />
                                        <span className="relative z-10">부품</span>
                                    </button>
                                    <button
                                        onClick={() => setAssemblySubTab('PRODUCTION')}
                                        className={`relative px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2.5 transition-all duration-300 z-10`}
                                        style={assemblySubTab === 'PRODUCTION' ? { color: 'var(--theme-primary)' } : { color: 'var(--admin-text-muted)' }}
                                    >
                                        {assemblySubTab === 'PRODUCTION' && <motion.div layoutId="subtab-active" className="absolute inset-0 rounded-xl shadow-md border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                                        <Hammer size={16} strokeWidth={2.5} className="relative z-10" />
                                        <span className="relative z-10">제작</span>
                                    </button>
                                </>
                            ) : (
                                TABS.filter(tab => {
                                    if ((role === UserRole.MANUFACTURER || role === UserRole.ADMIN || role === UserRole.FABRIC_SUPPLIER || role === UserRole.DISTRIBUTOR) && tab.id === 'ASSEMBLY') return false;
                                    return true;
                                }).map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            id={`tab-${tab.id}`}
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`relative px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2.5 transition-all duration-300 z-10`}
                                            style={isActive ? { color: 'var(--theme-primary)' } : { color: 'var(--admin-text-muted)' }}
                                        >
                                            {isActive && <motion.div layoutId="cost-tab-active" className="absolute inset-0 rounded-xl shadow-md border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                                            <Icon size={16} strokeWidth={2.5} className="relative z-10" />
                                            <span className="relative z-10">{tab.label}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ================= FABRIC TAB ================= */}
                    {activeTab === 'FABRIC' && (
                        <div className="space-y-6">
                            <AnimatePresence>
                                {editForm ? (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                                        className="rounded-2xl p-6 shadow-sm border ring-4"
                                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--theme-primary)', boxShadow: 'inset 0 0 0 4px var(--theme-primary-bg)' }}>
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: 'var(--admin-border)' }}><h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}><Edit3 size={16} style={{ color: 'var(--theme-primary)' }} />{fabricCosts.find(c => c.id === editForm.id) ? '원가 정보 수정' : `${costLabel} 등록`}</h3><button onClick={() => setEditForm(null)} style={{ color: 'var(--admin-text-muted)' }}><X size={18} /></button></div>
                                        <div className="grid grid-cols-2 gap-5 mb-6">
                                            <div className="col-span-2">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">구분 (Category)</label>
                                                <div className="flex p-1 rounded-xl" style={{ background: 'var(--admin-bg)' }}>{CATEGORY_OPTIONS.map((opt) => (<button key={opt.id} onClick={() => handleFormChange('category', opt.id)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all`} style={editForm.category === opt.id ? { background: 'var(--theme-primary)', color: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: 'var(--admin-text-muted)' }}><opt.icon size={14} />{opt.label}</button>))}</div>
                                            </div>
                                            {editForm.category === 'SLAT' ? (
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-400 normal-case block mb-1.5">슬랫폭과 높이 (mm)</label>
                                                    <div className="flex items-center w-full rounded-xl px-4 py-2.5 transition-colors border" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}
                                                        onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                                                        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) e.currentTarget.style.borderColor = 'var(--admin-border)'; }}>
                                                        <input type="text" value={editForm.width} onChange={(e) => handleFormChange('width', e.target.value)} className="w-1/2 bg-transparent text-sm font-medium outline-none text-center" style={{ color: 'var(--admin-text)' }} placeholder="폭" /><span className="text-gray-300 mx-2">x</span><input type="text" value={editForm.height || ''} onChange={(e) => handleFormChange('height', e.target.value)} className="w-1/2 bg-transparent text-sm font-medium outline-none text-center" style={{ color: 'var(--admin-text)' }} placeholder="높이" />
                                                    </div>
                                                </div>
                                            ) : editForm.category === 'GRID' ? (
                                                // GRID 카테고리: 복수 가로/세로/표준원가
                                                <div className="col-span-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase">규격 목록 (가로 x 세로 x 표준원가)</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFormChange('gridItems', [
                                                                ...(editForm.gridItems || []),
                                                                { id: `gi-${Date.now()}`, width: '', height: '', price: '' }
                                                            ] as any)}
                                                            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                                                            style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                                        >
                                                            <Plus size={13} /> 항목 추가
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {(!editForm.gridItems || editForm.gridItems.length === 0) ? (
                                                            <div className="text-center py-6 text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-xl">
                                                                규격 항목을 추가해주세요.
                                                            </div>
                                                        ) : (
                                                            (editForm.gridItems as GridSizeItem[]).map((gi, idx) => (
                                                                <div key={gi.id} className="flex items-center gap-2 rounded-xl px-3 py-2 border" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                                                                    <span className="text-[10px] font-bold text-gray-400 w-5 text-center flex-shrink-0">{idx + 1}</span>
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <div className="flex-1 min-w-0">
                                                                            <label className="text-[9px] text-gray-400 font-bold uppercase block mb-0.5">가로 (cm)</label>
                                                                            <input
                                                                                type="number"
                                                                                step="0.1"
                                                                                value={gi.width}
                                                                                onChange={(e) => {
                                                                                    const updated = (editForm.gridItems as GridSizeItem[]).map(g =>
                                                                                        g.id === gi.id ? { ...g, width: e.target.value } : g
                                                                                    );
                                                                                    handleFormChange('gridItems', updated as any);
                                                                                }}
                                                                                className="w-full rounded-lg px-3 py-1.5 text-sm font-bold outline-none border transition-colors"
                                                                                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                                                                placeholder="100.0"
                                                                                onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                                                                                onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                                                                            />
                                                                        </div>
                                                                        <span className="text-gray-300 font-bold flex-shrink-0 mt-3">x</span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <label className="text-[9px] text-gray-400 font-bold uppercase block mb-0.5">세로 (cm)</label>
                                                                            <input
                                                                                type="number"
                                                                                step="0.1"
                                                                                value={gi.height}
                                                                                onChange={(e) => {
                                                                                    const updated = (editForm.gridItems as GridSizeItem[]).map(g =>
                                                                                        g.id === gi.id ? { ...g, height: e.target.value } : g
                                                                                    );
                                                                                    handleFormChange('gridItems', updated as any);
                                                                                }}
                                                                                className="w-full rounded-lg px-3 py-1.5 text-sm font-bold outline-none border transition-colors"
                                                                                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                                                                placeholder="200.0"
                                                                                onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                                                                                onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                                                                            />
                                                                        </div>
                                                                        <span className="text-gray-300 font-bold flex-shrink-0 mt-3">=</span>
                                                                        <div className="flex-[1.5] min-w-0">
                                                                            <label className="text-[9px] text-gray-400 font-bold uppercase block mb-0.5">표준원가 (원)</label>
                                                                            <input
                                                                                type="text"
                                                                                value={gi.price}
                                                                                onChange={(e) => {
                                                                                    const raw = e.target.value.replace(/,/g, '');
                                                                                    const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                                                                                    const updated = (editForm.gridItems as GridSizeItem[]).map(g =>
                                                                                        g.id === gi.id ? { ...g, price: formatted } : g
                                                                                    );
                                                                                    handleFormChange('gridItems', updated as any);
                                                                                }}
                                                                                className="w-full rounded-lg px-3 py-1.5 text-sm font-bold outline-none border transition-colors"
                                                                                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                                                                placeholder="10,000"
                                                                                onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                                                                                onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated = (editForm.gridItems as GridSizeItem[]).filter(g => g.id !== gi.id);
                                                                            handleFormChange('gridItems', updated as any);
                                                                        }}
                                                                        className="flex-shrink-0 mt-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div><label className="text-[11px] font-bold text-gray-400 normal-case block mb-1.5">원단 폭 (cm)</label><input type="text" value={editForm.width} onChange={(e) => handleFormChange('width', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none border transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="280" onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'} /></div>
                                            )}
                                            {/* 표준 롤 길이 - GRID 카테고리 제외 */}
                                            {editForm.category !== 'GRID' && (
                                                <div>
                                                    <label className={`text-[11px] font-bold text-gray-700 ${editForm.category === 'SLAT' ? '' : 'font-bold'} block mb-1.5`}>
                                                        {editForm.category === 'SLAT' ? '제작길이 로스(mm)' : '표준 롤 길이'}
                                                    </label>
                                                    <div className="flex items-center w-full rounded-xl overflow-hidden border" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}
                                                        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                                        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--admin-border)')}>
                                                        <input
                                                            type="text"
                                                            value={editForm.rollLength}
                                                            onChange={(e) => handleFormChange('rollLength', e.target.value)}
                                                            className="flex-1 bg-transparent px-4 py-2.5 text-sm font-medium outline-none"
                                                            placeholder={editForm.category === 'SLAT' ? '0' : (editForm.lengthUnit === 'm' ? '50' : '55')}
                                                        />
                                                        {editForm.category !== 'SLAT' && (
                                                            <div className="flex border-l border-gray-200">
                                                                <button onClick={() => handleFormChange('lengthUnit', 'm')} className={`px-3 py-2.5 text-xs font-bold transition-all`} style={editForm.lengthUnit === 'm' ? { background: 'var(--theme-primary)', color: 'white' } : { color: 'var(--admin-text-muted)', background: 'var(--admin-bg)' }}>m</button>
                                                                <button onClick={() => handleFormChange('lengthUnit', 'yd')} className={`px-3 py-2.5 text-xs font-bold transition-all border-l`} style={{ borderColor: 'var(--admin-border)', ...(editForm.lengthUnit === 'yd' ? { background: 'var(--theme-primary)', color: 'white' } : { color: 'var(--admin-text-muted)', background: 'var(--admin-bg)' }) }}>yd</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {editForm.category !== 'GRID' && (editForm.category === 'ROLL' ? (
                                                <>
                                                    {/* 롤 / 길이(m) 표준원가 - 한 박스에 두 값 */}
                                                    <div className="col-span-2">
                                                        <label className="text-[11px] font-bold text-gray-700 block mb-1.5">롤 / 길이({editForm.lengthUnit}) 표준원가 (원)</label>
                                                        <div className="flex items-center w-full rounded-xl overflow-hidden border" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}
                                                            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                                            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--admin-border)')}>
                                                            <input
                                                                type="text"
                                                                value={editForm.rollPrice}
                                                                onChange={(e) => handleFormChange('rollPrice', e.target.value)}
                                                                className="flex-1 bg-transparent px-4 py-3 text-sm font-bold outline-none"
                                                                style={{ color: 'var(--admin-text)' }}
                                                                placeholder="500,000"
                                                            />
                                                            <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
                                                            <div className="flex items-center flex-1 px-4 py-3 gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={editForm.meterPrice}
                                                                    onChange={(e) => handleFormChange('meterPrice', e.target.value)}
                                                                    className="w-full bg-transparent text-sm font-bold outline-none"
                                                                    style={{ color: 'var(--admin-text)' }}
                                                                    placeholder="10,000"
                                                                />
                                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">/ {editForm.lengthUnit}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 절단 / 길이(m) 표준원가 - 한 박스에 두 값 */}
                                                    <div className="col-span-2">
                                                        <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
                                                            <span className="px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>
                                                                <Scissors size={11} /> 절단 / 길이({editForm.lengthUnit}) 표준원가 (원)
                                                            </span>
                                                        </label>
                                                        <div className="flex items-center w-full rounded-xl overflow-hidden border" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}
                                                            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                                            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--admin-border)')}>
                                                            <input
                                                                type="text"
                                                                value={editForm.cuttingPrice || ''}
                                                                onChange={(e) => handleFormChange('cuttingPrice', e.target.value)}
                                                                className="flex-1 bg-transparent px-4 py-3 text-sm font-bold outline-none"
                                                                style={{ color: 'var(--admin-text)' }}
                                                                placeholder="3,000"
                                                            />
                                                            <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
                                                            <div className="flex items-center flex-1 px-4 py-3 gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={editForm.cuttingMeterPrice ? Number(editForm.cuttingMeterPrice.replace(/,/g, '')).toLocaleString() : ''}
                                                                    onChange={(e) => handleFormChange('cuttingMeterPrice', e.target.value.replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
                                                                    className="w-full bg-transparent text-sm font-bold outline-none"
                                                                    style={{ color: 'var(--admin-text)' }}
                                                                    placeholder="11,000"
                                                                />
                                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">/ {editForm.lengthUnit}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">{editForm.category === 'SLAT' ? '슬랫 단가 (원)' : '단가 (원)'}</label>
                                                    <input type="text" value={editForm.rollPrice} onChange={(e) => handleFormChange('rollPrice', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none border transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder={editForm.category === 'SLAT' ? "5,000" : "150,000"} onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'} />
                                                    <div className="mt-3">
                                                        <label className="text-[11px] font-bold normal-case flex items-center gap-1 mb-1.5" style={{ color: 'var(--theme-primary)' }}>
                                                            <Calculator size={12} /> {editForm.category === 'SLAT' ? `길이(m당) 단가` : `${editForm.lengthUnit}당 단가`}
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <input type="text" value={editForm.meterPrice} onChange={(e) => handleFormChange('meterPrice', e.target.value)} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold outline-none border transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="0" onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'} />
                                                            {editForm.category === 'SLAT' && (() => {
                                                                const h = parseFloat(editForm.height || '0');
                                                                const loss = parseFloat(editForm.rollLength || '0');
                                                                const net = h - loss;
                                                                if (net > 0) {
                                                                    const count = Math.round(1000 / net);
                                                                    return (
                                                                        <span className="whitespace-nowrap text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl">
                                                                            / {count} <span className="text-[11px] font-normal text-indigo-400">(Slat)</span>
                                                                        </span>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t mt-6" style={{ borderColor: 'var(--admin-border)' }}>{fabricCosts.find(c => c.id === editForm.id) ? (<button type="button" onClick={(e) => { e.preventDefault(); deleteEntry(editForm.id); }} className="flex items-center gap-1.5 text-red-500 hover:text-red-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"><Trash2 size={16} /> 삭제</button>) : <div />}<div className="flex justify-end gap-2"><button onClick={() => setEditForm(null)} className="px-4 py-2 text-sm font-bold rounded-lg transition-colors" style={{ color: 'var(--admin-text-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-bg)'} onMouseLeave={e => e.currentTarget.style.background = ''}>취소</button><button onClick={saveEntry} className="px-6 py-2 text-white text-sm font-bold rounded-lg shadow-md transition-transform active:scale-95" style={{ background: 'var(--theme-primary)' }}>저장완료</button></div></div>
                                    </motion.div>
                                ) : (<motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={startNewEntry}
                                    className="w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 font-bold transition-all"
                                    style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; e.currentTarget.style.color = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--theme-primary-bg)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = ''; }}
                                ><Plus size={20} /> 새 원가 정보 등록</motion.button>)}
                            </AnimatePresence>
                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="divide-y divide-gray-100">
                                    {fabricCosts.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 text-sm">등록된 원가 정보가 없습니다.</div>
                                    ) : (
                                        fabricCosts.map((item) => (
                                            <div key={item.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                {item.category === 'GRID' ? (
                                                    /* GRID: 가로/세로/표준원가 테이블 형태 */
                                                    <div className="px-6 py-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[9px] text-gray-400 font-medium">구분</span>
                                                                <span className="text-[10px] font-bold px-2 py-1 rounded-md border bg-orange-50 text-orange-600 border-orange-100">규격</span>
                                                                <span className="text-[11px] text-gray-400 font-medium">{(item.gridItems || []).length}개 규격</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => editEntry(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={15} /></button>
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); deleteEntry(item.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                                            </div>
                                                        </div>
                                                        {(item.gridItems && item.gridItems.length > 0) ? (
                                                            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="border-b border-gray-200 bg-gray-100/50">
                                                                            <th className="text-[10px] font-bold text-gray-400 uppercase text-center px-4 py-2 w-8">#</th>
                                                                            <th className="text-[10px] font-bold text-gray-400 uppercase text-right px-4 py-2">\uac00\ub85c (cm)</th>
                                                                            <th className="text-[10px] font-bold text-gray-400 uppercase text-right px-4 py-2">\uc138\ub85c (cm)</th>
                                                                            <th className="text-[10px] font-bold text-blue-400 uppercase text-right px-4 py-2">\ud45c\uc900\uc6d0\uac00</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {item.gridItems.map((gi, idx) => (
                                                                            <tr key={gi.id} className="hover:bg-white transition-colors">
                                                                                <td className="text-[10px] text-gray-400 text-center px-4 py-2">{idx + 1}</td>
                                                                                <td className="font-bold text-gray-700 text-right px-4 py-2 font-mono">{parseFloat(gi.width).toFixed(1)}</td>
                                                                                <td className="font-bold text-gray-700 text-right px-4 py-2 font-mono">{parseFloat(gi.height).toFixed(1)}</td>
                                                                                <td className="font-bold text-blue-600 text-right px-4 py-2 font-mono">{Number((gi.price || '').replace(/,/g, '')).toLocaleString()}<span className="text-[10px] font-normal text-blue-300 ml-0.5">\uc6d0</span></td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-3 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">\ub4f1\ub85d\ub41c \uaddc\uaca9\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* ROLL / SLAT: 기존 레이아웃 */
                                                    <div className="px-6 py-4 flex items-center">
                                                        <div className="w-24 flex-shrink-0 flex flex-col justify-center">
                                                            <span className="text-[9px] text-gray-400 font-medium mb-0.5 block">구분</span>
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border w-fit ${item.category === 'ROLL' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                                {item.category === 'ROLL' ? '롤' : '슬랫'}
                                                            </span>
                                                        </div>
                                                        <div className="w-24 text-left flex flex-col justify-center">
                                                            <span className="text-[9px] text-gray-400 font-medium mb-0.5">{item.category === 'SLAT' ? '폭 | 높이' : '폭(cm)'}</span>
                                                            <span className="text-sm font-bold text-gray-700">{item.category === 'SLAT' ? `${item.width}${item.height ? ` | ${item.height}` : ''}` : item.width}</span>
                                                        </div>
                                                        <div className="flex-[2] pl-4 flex flex-col justify-center border-l border-gray-100 border-dashed">
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] text-gray-400 font-medium mb-0.5 block">표준 단가</span>
                                                                    <span className="text-sm text-gray-700 font-mono font-medium">{Number((item.rollPrice || '').replace(/,/g, '')).toLocaleString()}원</span>
                                                                </div>
                                                                <div className="w-px h-8 bg-gray-100 mx-2" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] text-gray-400 font-medium mb-0.5 block">표준 길이</span>
                                                                    <span className="text-sm text-gray-700 font-mono">{item.rollLength} <span className="text-[10px] text-gray-400 normal-case">{item.lengthUnit}</span></span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-[1.5] text-right flex items-center justify-end gap-6 pr-4">
                                                            {item.category === 'ROLL' && item.cuttingPrice && (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[9px] text-gray-400 font-medium mb-0.5 block normal-case">절단 m 단가</span>
                                                                    <span className="text-sm font-bold text-gray-600 font-mono">
                                                                        {Number(item.cuttingPrice.replace(/,/g, '')).toLocaleString()} <span className="text-[10px] font-normal text-gray-400 normal-case">/m</span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[9px] text-blue-300 font-medium mb-0.5 block normal-case">
                                                                    {item.category === 'ROLL' ? '롤단위 m 단가' : '표준원가'}
                                                                </span>
                                                                <span className="text-sm font-bold text-blue-600 font-mono">
                                                                    {item.meterPrice} <span className="text-[10px] font-normal text-blue-300 normal-case">/{item.lengthUnit}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-20 flex justify-center gap-2 pl-4 border-l border-gray-100 border-dashed">
                                                            <button onClick={() => editEntry(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); deleteEntry(item.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ================= CUTTING TAB ================= */}
                    {activeTab === 'CUTTING' && (
                        <div className="space-y-6">
                            <AnimatePresence>
                                {cuttingEditForm ? (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                                        className="rounded-2xl p-6 shadow-sm border ring-4"
                                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--theme-primary)', boxShadow: 'inset 0 0 0 4px var(--theme-primary-bg)' }}>
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: 'var(--admin-border)' }}><h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}><Edit3 size={16} style={{ color: 'var(--theme-primary)' }} />{cuttingCosts.find(c => c.id === cuttingEditForm.id) ? '제단원단 원가 수정' : '제단원단 원가등록'}</h3><button onClick={() => setCuttingEditForm(null)} style={{ color: 'var(--admin-text-muted)' }}><X size={18} /></button></div>
                                        <div className="grid grid-cols-2 gap-5 mb-6">
                                            <div className="col-span-2">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">단가 기준 (Unit)</label>
                                                <div className="flex p-1 rounded-xl" style={{ background: 'var(--admin-bg)' }}>
                                                    <button onClick={() => handleCuttingFormChange('unit', 'SQM')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all`} style={(!cuttingEditForm.unit || cuttingEditForm.unit === 'SQM') ? { background: 'var(--theme-primary)', color: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: 'var(--admin-text-muted)' }}>㎡ (헤베)</button>
                                                    <button onClick={() => handleCuttingFormChange('unit', 'WIDTH')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all`} style={cuttingEditForm.unit === 'WIDTH' ? { background: 'var(--theme-primary)', color: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: 'var(--admin-text-muted)' }}>폭 (Width)</button>
                                                </div>
                                            </div>
                                            {cuttingEditForm.unit === 'WIDTH' ? (
                                                <div className="col-span-2">
                                                    <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">기준폭 (Standard Width)</label>
                                                    <div className="relative">
                                                        <input type="text" value={cuttingEditForm.standardWidth || '180'} onChange={(e) => handleCuttingFormChange('standardWidth', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none border transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="180" onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'} />
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none normal-case">cm</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="col-span-2"><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">단가 기준 (기본㎡)</label><input type="text" value={cuttingEditForm.basicArea} onChange={(e) => handleCuttingFormChange('basicArea', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none border transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="1.5 (최소 평배)" onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'} /></div>
                                            )}
                                            <div className="col-span-2 md:col-span-1"><label className="text-[11px] font-bold text-gray-400 normal-case block mb-1.5">가로 범위 (cm)</label><div className="flex items-center gap-2"><input type="text" value={cuttingEditForm.minWidth} onChange={(e) => handleCuttingFormChange('minWidth', e.target.value)} className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium outline-none border placeholder:text-gray-300 transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="최소" onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'} /><ArrowRight size={14} className="text-gray-300" /><input type="text" value={cuttingEditForm.maxWidth} onChange={(e) => handleCuttingFormChange('maxWidth', e.target.value)} className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium outline-none border placeholder:text-gray-300 transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="최대" onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'} /></div></div>
                                            <div className="col-span-2 md:col-span-1"><label className="text-[11px] font-bold text-gray-400 normal-case block mb-1.5">세로 범위 (cm)</label><div className="flex items-center gap-2"><input type="text" value={cuttingEditForm.minHeight} onChange={(e) => handleCuttingFormChange('minHeight', e.target.value)} className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium outline-none border placeholder:text-gray-300 transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="최소" onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'} /><ArrowRight size={14} className="text-gray-300" /><input type="text" value={cuttingEditForm.maxHeight} onChange={(e) => handleCuttingFormChange('maxHeight', e.target.value)} className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium outline-none border placeholder:text-gray-300 transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="최대" onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'} /></div></div>
                                            <div className="col-span-2"><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--theme-primary)' }}>표준원가 (원)</label><input type="text" value={cuttingEditForm.standardPrice} onChange={(e) => handleCuttingFormChange('standardPrice', e.target.value)} className="w-full rounded-xl px-4 py-3 text-lg font-bold outline-none text-right" style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)' }} placeholder="0" /></div>
                                        </div>
                                        <div className="flex justify-end gap-2"><button onClick={() => setCuttingEditForm(null)} className="px-4 py-2 text-sm font-bold rounded-lg transition-colors" style={{ color: 'var(--admin-text-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-bg)'} onMouseLeave={e => e.currentTarget.style.background = ''}>취소</button><button onClick={saveCuttingEntry} className="px-6 py-2 text-white text-sm font-bold rounded-lg shadow-md transition-transform active:scale-95" style={{ background: 'var(--theme-primary)' }}>저장완료</button></div>
                                    </motion.div>
                                ) : (<motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={startNewCuttingEntry}
                                    className="w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 font-bold transition-all"
                                    style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; e.currentTarget.style.color = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--theme-primary-bg)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = ''; }}
                                ><Plus size={20} /> 제단원단 원가등록</motion.button>)}
                            </AnimatePresence>
                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"><div className="divide-y divide-gray-100">{cuttingCosts.length === 0 ? (<div className="p-8 text-center text-gray-400 text-sm">등록된 제단비 정보가 없습니다.</div>) : (cuttingCosts.map((item) => (<div key={item.id} className="px-6 py-4 flex items-center hover:bg-gray-50 transition-colors"><div className="w-24 flex-shrink-0 flex flex-col justify-center border-r border-gray-100 border-dashed pr-4 mr-4"><span className="text-[9px] text-gray-400 font-medium mb-0.5 block">{item.unit === 'WIDTH' ? '기준폭(cm)' : '기본 ㎡'}</span><span className="text-sm font-bold text-gray-700">{item.unit === 'WIDTH' ? (item.standardWidth || '-') : (item.basicArea || '-')}</span></div><div className="flex-1 flex flex-col justify-center gap-1"><div className="flex items-center gap-2 text-xs text-gray-600"><Maximize size={12} className="text-gray-400" /><span className="text-gray-400 w-8">가로:</span> <span className="font-mono font-medium">{item.minWidth || '0'}</span><ArrowRight size={10} className="text-gray-300" /><span className="font-mono font-medium">{item.maxWidth || '∞'}</span></div><div className="flex items-center gap-2 text-xs text-gray-600"><Maximize size={12} className="text-gray-400 rotate-90" /><span className="text-gray-400 w-8">세로:</span> <span className="font-mono font-medium">{item.minHeight || '0'}</span><ArrowRight size={10} className="text-gray-300" /><span className="font-mono font-medium">{item.maxHeight || '∞'}</span></div></div><div className="w-32 text-right flex flex-col items-end justify-center pl-4 border-l border-gray-100 border-dashed"><span className="text-[9px] text-blue-400 font-medium mb-0.5 block">표준원가</span><span className="text-sm font-bold text-blue-600 font-mono">{Number((item.standardPrice || '').replace(/,/g, '')).toLocaleString()}원</span></div><div className="w-20 flex justify-center gap-2 ml-4"><button onClick={() => editCuttingEntry(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16} /></button><button onClick={() => deleteCuttingEntry(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div></div>)))}</div></div>
                        </div>
                    )}

                    {/* ================= MEASURE TAB ================= */}
                    {activeTab === 'MEASURE' && (
                        <div className="space-y-6">
                            <AnimatePresence>
                                {measureEditForm ? (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                                        className="rounded-2xl p-6 shadow-sm border ring-4"
                                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--theme-primary)', boxShadow: 'inset 0 0 0 4px var(--theme-primary-bg)' }}>
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: 'var(--admin-border)' }}><h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}><Edit3 size={16} style={{ color: 'var(--theme-primary)' }} /> 선택 상품 표준원가와 실사가능 제품설정</h3><button onClick={() => setMeasureEditForm(null)} style={{ color: 'var(--admin-text-muted)' }}><X size={18} /></button></div>
                                        <div className="mb-6"><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">단위 선택 (Unit)</label><div className="flex p-1 rounded-xl" style={{ background: 'var(--admin-bg)' }}>{MEASURE_UNIT_OPTIONS.map((opt) => (<button key={opt.id} onClick={() => handleMeasureUnitChange(opt.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all`} style={measureFormUnit === opt.id ? { background: 'var(--theme-primary)', color: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: 'var(--admin-text-muted)' }}><opt.icon size={14} />{opt.label}</button>))}</div><p className="text-center text-[12px] text-gray-500 mt-2">선택한 단위에 대해 4가지 구분별 표준원가를 설정할 수 있습니다.</p></div>
                                        <div className="h-px bg-gray-100 mb-6" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            {MEASURE_CATEGORY_OPTIONS.map((cat) => (<div key={cat.id} className="p-3 border rounded-xl transition-colors" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}><div className="flex items-center gap-2 mb-2"><div className="p-1.5 border rounded-lg" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}><cat.icon size={14} /></div><span className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>{cat.label}</span></div>
                                                {measureFormUnit === 'CUTTING_LINK' ? (<div className="flex items-center gap-2"><div className="relative flex-1"><input type="text" value={measureFormPrices[cat.id] || ''} onChange={(e) => handleMeasurePriceChange(cat.id, e.target.value)} className="w-full border rounded-lg pl-3 pr-8 py-2 text-sm font-bold text-right outline-none" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="0" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span></div><div className="px-3 py-2 rounded-lg min-w-[80px] text-right" style={{ background: 'var(--theme-primary-bg)' }}><span className="text-xs font-bold" style={{ color: 'var(--theme-primary)' }}>{Math.round(referenceCuttingPrice * (parseNumber(measureFormPrices[cat.id] || '0') / 100)).toLocaleString()}</span></div></div>) : (<div className="relative"><input type="text" value={measureFormPrices[cat.id] || ''} onChange={(e) => handleMeasurePriceChange(cat.id, e.target.value)} className="w-full border rounded-lg pl-3 pr-8 py-2 text-sm font-bold text-right outline-none" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="0" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span></div>)}</div>))}
                                        </div>
                                        <div className="flex justify-end gap-2"><button onClick={() => setMeasureEditForm(null)} className="px-4 py-2 text-sm font-bold rounded-lg transition-colors" style={{ color: 'var(--admin-text-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-bg)'} onMouseLeave={e => e.currentTarget.style.background = ''}>취소</button><button onClick={saveMeasureEntry} className="px-6 py-2 text-white text-sm font-bold rounded-lg shadow-md transition-transform active:scale-95" style={{ background: 'var(--theme-primary)' }}>저장완료</button></div>
                                    </motion.div>
                                ) : (<motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={startNewMeasureEntry}
                                    className="w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 font-bold transition-all"
                                    style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; e.currentTarget.style.color = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--theme-primary-bg)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = ''; }}
                                ><Plus size={20} /> 새 실사비 등록</motion.button>)}
                            </AnimatePresence>
                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"><div className="divide-y divide-gray-100">{measureCosts.length === 0 ? (<div className="p-8 text-center text-gray-400 text-sm">등록된 실사비 정보가 없습니다.</div>) : (measureCosts.map((item) => { const unitInfo = MEASURE_UNIT_OPTIONS.find(u => u.id === item.unit); const categoryInfo = MEASURE_CATEGORY_OPTIONS.find(c => c.id === item.category); let displayPrice = item.standardPrice || ''; let suffix = ''; if (item.unit === 'CUTTING_LINK') { const percentage = parseNumber(displayPrice); const calcPrice = Math.round(referenceCuttingPrice * (percentage / 100)); displayPrice = calcPrice.toLocaleString(); suffix = ` (${percentage}%)`; } else { displayPrice = Number(displayPrice.replace(/,/g, '')).toLocaleString(); } return (<div key={item.id} className="px-6 py-4 flex items-center hover:bg-gray-50 transition-colors"><div className="flex-1 flex items-center gap-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.unit === 'SQM' ? 'bg-blue-50 border-blue-100 text-blue-500' : item.unit === 'CUTTING_LINK' ? 'bg-purple-50 border-purple-100 text-purple-500' : 'bg-orange-50 border-orange-100 text-orange-500'}`}>{unitInfo && <unitInfo.icon size={20} />}</div><div><span className="text-[9px] text-gray-400 font-medium mb-0.5 block uppercase">{unitInfo?.label}</span><span className="text-sm font-bold text-gray-700">{categoryInfo?.label}</span></div></div><div className="w-32 text-right flex flex-col items-end justify-center pl-4 border-l border-gray-100 border-dashed"><span className="text-[9px] text-blue-400 font-medium mb-0.5 block">표준원가</span><span className="text-sm font-bold text-blue-600 font-mono">{displayPrice} <span className="text-[10px] text-gray-400 font-normal">{suffix}</span>{item.unit !== 'CUTTING_LINK' && '원'}</span></div><div className="w-20 flex justify-center gap-2 ml-4"><button onClick={() => editMeasureEntry(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16} /></button><button onClick={() => deleteMeasureEntry(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div></div>); }))}</div></div>
                        </div>
                    )}

                    {/* ================= ASSEMBLY TAB (IMPLEMENTED) ================= */}
                    {activeTab === 'ASSEMBLY' && (
                        <div className="flex-1 flex flex-col min-h-0 space-y-6">
                            {assemblySubTab === 'PARTS' ? (
                                <>
                                    <AnimatePresence>
                                        {partsEditForm ? (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 ring-4 ring-blue-50/50">
                                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Edit3 size={16} className="text-blue-500" />{partsCosts.find(c => c.id === partsEditForm.id) ? '부품 정보 수정' : '새 부품 등록'}</h3><button onClick={() => setPartsEditForm(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                    <div className="col-span-2 md:col-span-4"><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">부품명</label><input type="text" value={partsEditForm.name} onChange={(e) => handlePartsFormChange('name', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="부품명 입력" /></div>
                                                    <div className="col-span-2 md:col-span-4"><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">규격</label><input type="text" value={partsEditForm.spec} onChange={(e) => handlePartsFormChange('spec', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="규격 입력" /></div>
                                                    <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">사용단위</label><input type="text" value={partsEditForm.usageUnit} onChange={(e) => handlePartsFormChange('usageUnit', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="예: 개, m" /></div>
                                                    <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">사용량</label><input type="text" value={partsEditForm.usageQty} onChange={(e) => handlePartsFormChange('usageQty', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="1" /></div>
                                                    <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">재고단위</label><input type="text" value={partsEditForm.inventoryUnit} onChange={(e) => handlePartsFormChange('inventoryUnit', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="예: 개, 박스" /></div>
                                                    <div><label className="text-[11px] font-bold text-blue-600 uppercase block mb-1.5">원가 (원)</label><input type="text" value={partsEditForm.cost} onChange={(e) => handlePartsFormChange('cost', e.target.value)} className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-700 focus:border-blue-500 outline-none text-right" placeholder="0" /></div>
                                                    {/* 작업지시서 OK/NO 토글 스위치 */}
                                                    <div className="col-span-2 md:col-span-4">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase block mb-2">작업지시서</label>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePartsFormChange('workOrderType', partsEditForm.workOrderType === 'OK' ? 'NO' : 'OK')}
                                                                className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${partsEditForm.workOrderType === 'OK'
                                                                    ? 'bg-blue-500 border-blue-500'
                                                                    : 'bg-gray-200 border-gray-200'
                                                                    }`}
                                                            >
                                                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${partsEditForm.workOrderType === 'OK' ? 'translate-x-7' : 'translate-x-0'
                                                                    }`} />
                                                            </button>
                                                            <span className={`text-sm font-extrabold tracking-wide transition-colors duration-200 ${partsEditForm.workOrderType === 'OK' ? 'text-blue-600' : 'text-gray-400'
                                                                }`}>
                                                                {partsEditForm.workOrderType === 'OK' ? 'OK' : 'NO'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* 작지설명: OK일 때만 활성화 */}
                                                    <div className={`col-span-2 md:col-span-4 transition-opacity duration-200 ${partsEditForm.workOrderType === 'OK' ? 'opacity-100' : 'opacity-40 pointer-events-none'
                                                        }`}>
                                                        <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">작지설명</label>
                                                        <input
                                                            type="text"
                                                            value={partsEditForm.workOrderDesc || ''}
                                                            onChange={(e) => handlePartsFormChange('workOrderDesc', e.target.value)}
                                                            disabled={partsEditForm.workOrderType !== 'OK'}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all ${partsEditForm.workOrderType === 'OK'
                                                                ? 'bg-gray-50 border border-gray-200 focus:border-blue-500'
                                                                : 'bg-gray-100 border border-gray-200 cursor-not-allowed text-gray-400'
                                                                }`}
                                                            placeholder={partsEditForm.workOrderType === 'OK' ? '작업지시 내용을 입력하세요' : '작업지시서 OK일 때 입력 가능'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">{partsCosts.find(c => c.id === partsEditForm.id) ? (<button type="button" onClick={() => deletePartsEntry(partsEditForm.id)} className="flex items-center gap-1.5 text-red-500 hover:text-red-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"><Trash2 size={16} /> 삭제</button>) : <div />}<div className="flex justify-end gap-2"><button onClick={() => setPartsEditForm(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">취소</button><button onClick={savePartsEntry} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition-transform active:scale-95">저장완료</button></div></div>
                                            </motion.div>
                                        ) : (<motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={startNewPartsEntry} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"><Plus size={20} /> 새 부품 등록</motion.button>)}
                                    </AnimatePresence>
                                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium">부품명</th>
                                                    <th className="px-6 py-3 font-medium">규격</th>
                                                    <th className="px-6 py-3 font-medium">사용단위</th>
                                                    <th className="px-6 py-3 font-medium">사용량</th>
                                                    <th className="px-6 py-3 font-medium">재고단위</th>
                                                    <th className="px-6 py-3 font-medium text-right">원가</th>
                                                    <th className="px-6 py-3 font-medium text-center w-20 "><Settings size={14} className="mx-auto" /></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {partsCosts.length === 0 ? (
                                                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">등록된 부품 데이터가 없습니다.</td></tr>
                                                ) : (
                                                    partsCosts.map((part) => (
                                                        <tr key={part.id} className="hover:bg-gray-50 transition-colors group">
                                                            <td className="px-6 py-3.5 font-bold text-gray-800">{part.name}</td>
                                                            <td className="px-6 py-3.5 text-gray-500 text-xs">{part.spec}</td>
                                                            <td className="px-6 py-3.5 text-gray-500 font-medium">{part.usageUnit}</td>
                                                            <td className="px-6 py-3.5 text-gray-500 font-mono">{part.usageQty}</td>
                                                            <td className="px-6 py-3.5 text-gray-500 font-medium">{part.inventoryUnit}</td>
                                                            <td className="px-6 py-3.5 font-mono text-blue-600 font-bold text-right">{Number((part.cost || '').replace(/,/g, '')).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal ml-0.5">원</span></td>
                                                            <td className="px-6 py-3.5">
                                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => editPartsEntry(part)} className="p-1.5 hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-blue-600 rounded-lg shadow-sm transition-all"><Edit3 size={14} /></button>
                                                                    <button onClick={() => deletePartsEntry(part.id)} className="p-1.5 hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-red-600 rounded-lg shadow-sm transition-all"><Trash2 size={14} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
                                    <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Layers size={16} className="text-gray-500" />
                                            <h3 className="text-sm font-bold text-gray-700">시스템 별 조립 옵션 리스트 {linkedSystemCategory?.label && `(${linkedSystemCategory.label})`}</h3>
                                        </div>
                                        <button
                                            onClick={saveAssemblyEntry}
                                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                        >
                                            <Save size={14} /> 설정 저장
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                                        {(!linkedSystemCategory) ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                                                <Hammer size={32} className="opacity-20" />
                                                <p className="text-sm">해당 상품에 연결된 시스템 설정이 없습니다.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-3">
                                                    {(() => {
                                                        const rootChildren = getAssemblySystemChildren(linkedSystemCategory.id);
                                                        if (rootChildren.length === 0) return <div className="text-gray-400 text-sm p-4">하위 항목이 없습니다.</div>;
                                                        return rootChildren.map((child, index) => (
                                                            <div key={child.id} className="bg-gray-50/50 border border-gray-100 rounded-xl overflow-hidden">
                                                                {renderAssemblyNode(child.id, [], false)}
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            ) : (
                activeTab === 'ASSEMBLY' ? (
                    <div className="flex-1 relative bg-gray-50 overflow-hidden">
                        <MindMapSystem forcedRootId={currentRootId} isInspectorActive={true} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <BoxSelect size={40} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">좌측 목록에서 상품을 선택하세요.</p>
                    </div>
                )
            )}

            {/* BOM Modal */}
            <AnimatePresence>
                {bomModalNodeId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-3xl flex flex-col h-[80vh] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <Database size={20} className="text-blue-500" /> BOM (Bill of Materials) 설정
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        <span className="font-bold text-gray-600">{nodes[bomModalNodeId]?.label}</span>에 필요한 부품 목록을 구성합니다.
                                    </p>
                                </div>
                                <button onClick={closeBomModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-auto p-6 bg-gray-50">
                                {editingBomList.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-70">
                                        <Database size={48} className="text-gray-300" />
                                        <p className="text-sm font-medium">등록된 BOM 항목이 없습니다.</p>
                                        <button onClick={addBomRow} className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm">
                                            <Plus size={16} /> 첫 번째 BOM 항목 추가
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {editingBomList.map((bom, idx) => (
                                            <div key={bom.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm group">
                                                <div className="w-6 text-center text-[10px] font-bold text-gray-400 bg-gray-100 rounded-md py-1">{idx + 1}</div>

                                                <div className="flex-[2] min-w-0 relative">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">부품 선택</label>
                                                    <select
                                                        value={bom.partId}
                                                        onChange={(e) => updateBomRow(bom.id, 'partId', e.target.value)}
                                                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg pl-3 pr-8 py-2 focus:border-blue-500 focus:bg-white outline-none cursor-pointer"
                                                    >
                                                        <option value="">부품을 선택하세요</option>
                                                        {partsCosts.map(part => (
                                                            <option key={part.id} value={part.id}>{part.name} ({part.spec})</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-[26px] pointer-events-none text-gray-400"><Grid size={12} /></div>
                                                </div>

                                                <div className="flex-1 min-w-[80px] relative">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">사용단위</label>
                                                    <select
                                                        value={bom.usageUnit}
                                                        onChange={(e) => updateBomRow(bom.id, 'usageUnit', e.target.value)}
                                                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-sm font-medium focus:border-blue-500 outline-none cursor-pointer"
                                                    >
                                                        <option value="cm">cm</option>
                                                        <option value="m">m</option>
                                                        <option value="ea">ea</option>
                                                        <option value="set">set</option>
                                                        <option value="㎡">㎡</option>
                                                    </select>
                                                    <div className="absolute right-2 top-[26px] pointer-events-none text-gray-400"><Grid size={12} /></div>
                                                </div>

                                                <div className="flex-[1.5] min-w-[100px] relative">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">사용량</label>
                                                    <select
                                                        value={bom.usageQty}
                                                        onChange={(e) => updateBomRow(bom.id, 'usageQty', e.target.value)}
                                                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-sm font-bold focus:border-blue-500 outline-none text-gray-700 cursor-pointer"
                                                    >
                                                        <option value="가로길이">가로길이</option>
                                                        <option value="세로길이">세로길이</option>
                                                        <option value="1">1</option>
                                                        <option value="입력수량">입력수량</option>
                                                        <option value="㎡">㎡</option>
                                                    </select>
                                                    <div className="absolute right-2 top-[26px] pointer-events-none text-gray-400"><Grid size={12} /></div>
                                                </div>

                                                <div className="flex-[1.5] min-w-[100px]">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">추가수식</label>
                                                    <input
                                                        type="text"
                                                        value={bom.extraFormula || ''}
                                                        onChange={(e) => updateBomRow(bom.id, 'extraFormula', e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:border-blue-500 outline-none"
                                                        placeholder="예: *1.2"
                                                    />
                                                </div>

                                                <div className="flex flex-col items-end pt-4 ml-2">
                                                    <button onClick={() => deleteBomRow(bom.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <button onClick={addBomRow} className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all font-bold text-sm">
                                            <Plus size={16} /> BOM 항목 추가
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center">
                                <div className="text-xs text-gray-500">
                                    총 <span className="font-bold text-blue-600">{editingBomList.length}</span>개의 BOM 항목
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={closeBomModal} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                                        취소
                                    </button>
                                    <button onClick={saveBomModal} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-2">
                                        <Check size={16} /> 적용하기
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Content (Media) Registration Modal */}
            <AnimatePresence>
                {contentModalNodeId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-3xl flex flex-col h-[70vh] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <FileText size={20} className="text-purple-500" /> 컨텐츠 등록 관리
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        <span className="font-bold text-gray-600">{nodes[contentModalNodeId]?.label}</span>에 대한 다중 이미지 및 동영상을 관리합니다.
                                    </p>
                                </div>
                                <button onClick={closeContentModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-auto p-6 bg-gray-50 flex flex-col gap-6">
                                {/* Upload Area */}
                                <input
                                    ref={contentFileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,video/mp4"
                                    multiple
                                    className="hidden"
                                    onChange={handleContentFilesChange}
                                />
                                <div
                                    className="border-2 border-dashed border-gray-300 hover:border-purple-400 bg-white rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-purple-50 group"
                                    onClick={handleContentFileSelect}
                                >
                                    <div className="w-16 h-16 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <UploadCloud size={32} />
                                    </div>
                                    <h4 className="text-gray-700 font-bold mb-1">클릭하여 파일 업로드</h4>
                                    <p className="text-gray-400 text-xs text-center">
                                        이미지 (JPG, PNG) 및 동영상 (MP4) 파일을 선택하세요.<br />
                                        최대 50MB까지 업로드 가능합니다.
                                    </p>
                                </div>

                                {/* Content List */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Film size={16} className="text-gray-500" /> 등록된 컨텐츠 목폭
                                        <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{editingContents.length}</span>
                                    </h4>

                                    {editingContents.length === 0 ? (
                                        <div className="text-center py-8 bg-white rounded-xl border border-gray-100 text-gray-400 text-sm">
                                            등록된 미디어 파일이 없습니다.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            <AnimatePresence>
                                                {editingContents.map((content) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        key={content.id}
                                                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm group relative"
                                                    >
                                                        {/* Preview Thumbnail Area */}
                                                        <div className="h-32 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                                                            {content.type === 'IMAGE' && content.url ? (
                                                                <img src={content.url} alt={content.name} className="w-full h-full object-cover" />
                                                            ) : content.type === 'VIDEO' && content.url ? (
                                                                <video src={content.url} className="w-full h-full object-cover" muted />
                                                            ) : content.type === 'IMAGE' ? (
                                                                <ImageIcon size={32} className="text-gray-300" />
                                                            ) : (
                                                                <Video size={32} className="text-gray-300" />
                                                            )}
                                                            {/* Delete Button Overlay */}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); removeContent(content.id); }}
                                                                    className="bg-white text-red-500 hover:bg-red-50 p-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* File Info */}
                                                        <div className="p-3 border-t border-gray-100">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${content.type === 'IMAGE' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                                    {content.type === 'IMAGE' ? '이미지' : '동영상'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs font-semibold text-gray-700 truncate w-full" title={content.name}>
                                                                {content.name}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end items-center gap-2">
                                <button onClick={closeContentModal} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                                    취소
                                </button>
                                <button onClick={saveContentModal} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-2">
                                    <Check size={16} /> 설정 저장
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StandardCostContent;
