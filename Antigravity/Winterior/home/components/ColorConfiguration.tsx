
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useProductContext } from './ProductContext';
import { NodeData } from '../types';
import {
    Palette, ChevronRight, Image as ImageIcon,
    Upload, Save, Search, GripVertical, Trash2, Maximize2, X, CheckCircle2, StickyNote,
    Sliders, Box, Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminTheme } from './theme/AdminThemeContext';

const ColorConfiguration: React.FC = () => {
    const { nodes, setNodes } = useProductContext();
    const { theme } = useAdminTheme();

    // --- 1. Category Logic ---
    const categories = useMemo(() => {
        const rootNode = nodes['root'];
        if (!rootNode) return [];
        return rootNode.childrenIds.map(id => nodes[id]).filter(Boolean);
    }, [nodes]);

    const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || '');
    const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!activeCategoryId && categories.length > 0) {
            setActiveCategoryId(categories[0].id);
        }
    }, [categories, activeCategoryId]);

    const subCategories = useMemo(() => {
        if (!activeCategoryId) return [];
        const node = nodes[activeCategoryId];
        if (!node) return [];
        return node.childrenIds.map(id => nodes[id]).filter(n => n && n.type === 'CATEGORY');
    }, [nodes, activeCategoryId]);

    useEffect(() => {
        if (activeCategoryId && subCategories.length > 0) {
            setSelectedSubIds(subCategories.map(sub => sub.id));
        } else {
            setSelectedSubIds([]);
        }
    }, [activeCategoryId, subCategories]);


    // --- 2. Grid Data ---
    const gridData = useMemo(() => {
        if (!activeCategoryId) return [];

        const rows: { id: string; path: string; node: NodeData }[] = [];

        const traverse = (nodeId: string, pathStr: string) => {
            const node = nodes[nodeId];
            if (!node) return;

            const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;
            const nodeType = node.attributes?.nodeType;
            const hasColorHex = !!node.attributes?.color;

            const parent = node.parentId ? nodes[node.parentId] : null;
            const parentIsProduct = parent?.attributes?.nodeType === 'product';

            let isColorNode = false;

            if (nodeType === 'color') {
                isColorNode = true;
            } else if (hasColorHex) {
                isColorNode = true;
            } else if (parentIsProduct && node.type === 'DATA' && nodeType !== 'category' && nodeType !== 'species') {
                isColorNode = true;
            }

            if (isColorNode) {
                const matchesSearch = !searchQuery || currentPath.toLowerCase().includes(searchQuery.toLowerCase());
                if (matchesSearch) {
                    rows.push({ id: node.id, path: currentPath, node: node });
                }
                return;
            }

            if (node.childrenIds.length > 0) {
                node.childrenIds.forEach(childId => traverse(childId, currentPath));
            }
        };

        let targetIds: string[] = [];
        if (subCategories.length > 0) {
            targetIds = selectedSubIds;
        } else {
            targetIds = nodes[activeCategoryId]?.childrenIds || [];
        }

        targetIds.forEach(childId => traverse(childId, ''));
        return rows;
    }, [nodes, activeCategoryId, selectedSubIds, subCategories, searchQuery]);


    // --- 3. Selection & Form State ---
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [formData, setFormData] = useState<{ label: string; swatchUrl: string; note: string }>({
        label: '', swatchUrl: '', note: ''
    });
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        if (gridData.length > 0) {
            const isSelectedValid = gridData.some(item => item.id === selectedNodeId);
            if (!isSelectedValid) {
                setSelectedNodeId(gridData[0].id);
            }
        } else {
            setSelectedNodeId(null);
        }
    }, [gridData, selectedNodeId]);

    useEffect(() => {
        if (selectedNodeId && nodes[selectedNodeId]) {
            const node = nodes[selectedNodeId];
            setFormData({
                label: node.label,
                swatchUrl: node.attributes?.swatchUrl || '',
                note: node.attributes?.note || ''
            });
        }
    }, [selectedNodeId, nodes]);


    // --- 4. Handlers ---
    const handleUpdate = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSwatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleUpdate('swatchUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!selectedNodeId) return;
        setNodes(prev => ({
            ...prev,
            [selectedNodeId]: {
                ...prev[selectedNodeId],
                label: formData.label,
                attributes: {
                    ...prev[selectedNodeId].attributes,
                    swatchUrl: formData.swatchUrl,
                    note: formData.note
                }
            }
        }));
        alert('칼라 정보가 저장되었습니다.');
    };


    // --- 5. Resizable Layout ---
    const [sidebarWidth, setSidebarWidth] = useState(380);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((e: MouseEvent) => {
        if (isResizing && sidebarRef.current) {
            const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
            if (newWidth > 240 && newWidth < 600) setSidebarWidth(newWidth);
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = 'auto';
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing, resize, stopResizing]);


    return (
        <div className="flex-1 w-full flex flex-col h-full overflow-hidden" style={{ background: 'var(--admin-bg)' }}>

            {/* 1. Header */}
            <div id="color-config-header" className="flex-shrink-0 border-b px-8 h-20 shadow-sm z-20 flex items-center justify-between relative gap-4"
                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>

                {/* Left: Icon + Title + Badge */}
                <div className="flex items-center gap-4 relative z-30 min-w-fit">
                    <Palette style={{ color: 'var(--theme-primary)' }} className="shrink-0" size={28} />
                    <h1 className="text-2xl font-bold whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>상품칼라</h1>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                        총 {gridData.length}개
                    </span>
                </div>

                {/* Center: Search */}
                <div className="flex-1 max-w-xl mx-auto">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="칼라명 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border rounded-xl text-sm font-medium outline-none transition-all shadow-inner focus:shadow-md"
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                        />
                    </div>
                </div>

                {/* Right: Category Tabs */}
                <div className="flex items-center gap-4 justify-end min-w-0">
                    <div className="flex items-center gap-3 justify-end min-w-0">
                        {/* Main category */}
                        <div className="flex bg-white p-1 rounded-full shadow-sm border border-gray-200 flex-shrink-0 gap-1 ring-1 ring-black/[0.03]">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategoryId(cat.id)}
                                    className={`relative px-5 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap z-10 flex items-center gap-1.5 ${activeCategoryId === cat.id
                                        ? 'text-white shadow-md'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                                    style={activeCategoryId === cat.id ? { background: 'var(--theme-primary)' } : {}}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />

                        {/* Sub category */}
                        <div className="flex bg-white p-1 rounded-full border border-gray-200 shadow-sm overflow-x-auto scrollbar-hide max-w-[300px] xl:max-w-[500px] flex-shrink-0 gap-1.5 ring-1 ring-black/[0.03]">
                            {subCategories.length > 0 ? subCategories.map((sub) => {
                                const isSelected = selectedSubIds.includes(sub.id);
                                return (
                                    <button
                                        key={sub.id}
                                        onClick={() => setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id])}
                                        className={`relative px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap z-10 flex-shrink-0 flex items-center gap-1.5 ${isSelected
                                            ? 'border shadow-sm'
                                            : 'text-gray-500 hover:text-gray-800 border border-transparent'}`}
                                        style={isSelected ? { color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' } : {}}
                                    >
                                        {sub.label}
                                    </button>
                                );
                            }) : (
                                <div className="px-4 py-1.5 text-xs font-bold text-gray-300 italic">하위 카테고리 없음</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Left: Color List */}
                <div
                    ref={sidebarRef}
                    style={{ width: sidebarWidth, background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}
                    className="flex flex-col z-10 flex-shrink-0 relative"
                >
                    {/* List Header - NO 삭제 */}
                    <div className="px-5 py-4 border-b flex items-center justify-between"
                        style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--theme-primary)', boxShadow: `0 0 8px var(--theme-primary)` }} />
                            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--admin-text-muted)' }}>
                                상품칼라 리스트
                            </span>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }}>
                            {gridData.length}건
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                        {gridData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Search size={48} strokeWidth={1} className="mb-4 opacity-20" style={{ color: 'var(--admin-text-muted)' }} />
                                <p className="text-sm font-bold" style={{ color: 'var(--admin-text-muted)' }}>검색 결과가 없습니다.</p>
                            </div>
                        ) : (
                            gridData.map((row) => {
                                const isSelected = selectedNodeId === row.id;
                                const parts = row.path.split(' > ');
                                const title = parts[parts.length - 1];
                                const subText = parts.slice(0, -1).join(' > ');

                                return (
                                    <button
                                        key={row.id}
                                        onClick={() => setSelectedNodeId(row.id)}
                                        className="w-full text-left px-4 py-3 border-b transition-colors relative"
                                        style={isSelected
                                            ? { background: 'var(--theme-primary-bg)', borderLeft: '4px solid var(--theme-primary)', borderBottomColor: 'var(--admin-border)' }
                                            : { borderLeft: '4px solid transparent', borderBottomColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}
                                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--admin-bg)'; }}
                                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'var(--admin-surface)'; }}
                                    >
                                        <div className="flex justify-between items-start mb-0.5 pr-2">
                                            <span className="font-bold text-sm truncate pr-2"
                                                style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)' }}>
                                                {title}
                                            </span>
                                            {isSelected && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--theme-primary)' }} />}
                                        </div>
                                        {subText && (
                                            <p className="text-[10px] truncate" style={{ color: 'var(--admin-text-muted)' }}>
                                                {subText}
                                            </p>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {/* RESIZE HANDLE (상품개요 동일 스타일: absolute, 투명→호버 시 테마색) */}
                    <div
                        onMouseDown={startResizing}
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-30 transition-colors"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    />
                </div>

                {/* Right: Details */}
                <div className="flex-1 p-10 overflow-hidden flex flex-col items-center" style={{ background: 'var(--admin-bg)' }}>
                    {selectedNodeId ? (
                        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-5 duration-500 flex-1 flex flex-col min-h-0">

                            <div className="rounded-[32px] shadow-sm border flex-1 flex flex-col overflow-hidden"
                                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>

                                {/* Card Header */}
                                <div className="px-10 py-6 border-b flex items-center justify-between"
                                    style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl shadow-sm border flex items-center justify-center"
                                            style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--theme-primary)' }}>
                                            <Sliders size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--admin-text)' }}>칼라 상세 설정</h2>
                                            <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>{selectedNodeId}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-3 text-white rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95"
                                        style={{ background: 'var(--theme-primary)' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        <Save size={18} /> 설정 저장하기
                                    </button>
                                </div>

                                {/* Card Body */}
                                <div className="p-10 flex-1 overflow-y-auto scrollbar-hide">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                                        {/* Left: Inputs */}
                                        <div className="space-y-8">
                                            <div className="group">
                                                <label className="text-[11px] font-black uppercase tracking-widest mb-2.5 block px-1"
                                                    style={{ color: 'var(--admin-text-muted)' }}>
                                                    칼라 명칭 <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.label}
                                                    onChange={(e) => handleUpdate('label', e.target.value)}
                                                    className="w-full border-2 rounded-3xl px-6 py-4 text-sm font-black outline-none transition-all"
                                                    style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--admin-surface)'; }}
                                                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.background = 'var(--admin-bg)'; }}
                                                    placeholder="거래처/공장용 칼라명을 입력하세요"
                                                />
                                            </div>

                                            <div className="group">
                                                <label className="text-[11px] font-black uppercase tracking-widest mb-2.5 block px-1 inline-flex items-center gap-2"
                                                    style={{ color: 'var(--admin-text-muted)' }}>
                                                    <StickyNote size={14} style={{ color: 'var(--admin-text-muted)' }} /> 비고 (메모)
                                                </label>
                                                <textarea
                                                    rows={6}
                                                    value={formData.note}
                                                    onChange={(e) => handleUpdate('note', e.target.value)}
                                                    className="w-full border-2 rounded-3xl px-6 py-5 text-sm font-medium outline-none resize-none leading-relaxed transition-all"
                                                    style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--admin-surface)'; }}
                                                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.background = 'var(--admin-bg)'; }}
                                                    placeholder="칼라에 대한 특이사항을 자유롭게 메모하세요"
                                                />
                                            </div>
                                        </div>

                                        {/* Right: Swatch Upload */}
                                        <div className="space-y-4 flex flex-col items-center">
                                            <label className="text-[11px] font-black uppercase tracking-widest self-start px-1"
                                                style={{ color: 'var(--admin-text-muted)' }}>스와치 이미지</label>

                                            <div className="relative group w-full aspect-square rounded-[48px] border-4 border-dashed overflow-hidden transition-all duration-500 cursor-pointer flex items-center justify-center p-2 shadow-inner"
                                                style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--theme-primary-bg)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.background = 'var(--admin-bg)'; }}>
                                                {formData.swatchUrl ? (
                                                    <div className="w-full h-full relative p-2">
                                                        <img
                                                            src={formData.swatchUrl}
                                                            alt="Swatch"
                                                            className="w-full h-full object-cover rounded-[36px] shadow-2xl"
                                                        />
                                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 p-8">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setPreviewImage(formData.swatchUrl); }}
                                                                className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90"
                                                            >
                                                                <Maximize2 size={24} />
                                                            </button>
                                                            <label className="w-14 h-14 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 cursor-pointer"
                                                                style={{ background: 'var(--theme-primary)' }}>
                                                                <Upload size={24} />
                                                                <input type="file" className="hidden" accept="image/*" onChange={handleSwatchUpload} />
                                                            </label>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleUpdate('swatchUrl', ''); }}
                                                                className="w-14 h-14 bg-red-500/80 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90"
                                                            >
                                                                <Trash2 size={24} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer group-hover:scale-105 transition-transform duration-500">
                                                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl transition-all duration-500"
                                                            style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>
                                                            <Upload size={36} />
                                                        </div>
                                                        <span className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--admin-text)' }}>스와치 등록</span>
                                                        <span className="text-[11px] mt-2 font-bold font-mono" style={{ color: 'var(--admin-text-muted)' }}>JPG / PNG / Max 5MB</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleSwatchUpload} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'var(--admin-text-muted)' }}>
                            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                                <Palette size={120} strokeWidth={0.5} className="mb-4 opacity-20" />
                            </motion.div>
                            <p className="text-xl font-black" style={{ color: 'var(--admin-text-muted)' }}>좌측 목록에서 칼라를 선택해주세요</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {previewImage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                            onClick={() => setPreviewImage(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative max-w-5xl max-h-full w-full h-full flex items-center justify-center pointer-events-none"
                        >
                            <img src={previewImage} alt="Full Preview" className="max-w-full max-h-full object-contain rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.5)] border-8 border-white/5 pointer-events-auto" />
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-0 -right-12 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full pointer-events-auto transition-all flex items-center justify-center active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ColorConfiguration;
