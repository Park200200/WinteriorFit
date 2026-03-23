
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useProductContext } from './ProductContext';
import { NodeData, UserRole } from '../types';
import {
    LayoutGrid, ChevronRight, Image as ImageIcon,
    Plus, Trash2, Save, ClipboardList, Settings, Sparkles, Video
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminTheme } from './theme/AdminThemeContext';

interface ProductImage {
    id: string;
    url: string;
}

interface ProductFeature {
    id: string;
    label: string;
    description: string;
}

interface MaterialEntry {
    id: string;
    imageUrl: string;
    description: string;
}

interface PromptEntry {
    id: string;
    label: string;
    text: string;
}

// FeatureRow: 항목명 + 설명 인라인 편집 컴포넌트
const FeatureRow: React.FC<{
    feature: ProductFeature;
    dark: boolean;
    onUpdate: (id: string, key: 'label' | 'description', value: string) => void;
    onRemove: (id: string) => void;
}> = ({ feature, dark, onUpdate, onRemove }) => {
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFocus = () => {
        setIsEditing(true);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const len = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(len, len);
            }
        }, 0);
    };

    const autoResize = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    return (
        <div className="flex items-start gap-2 group">
            <input
                type="text"
                value={feature.label}
                onChange={(e) => onUpdate(feature.id, 'label', e.target.value)}
                placeholder="항목명"
                className="w-28 flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none transition-all mt-0.5"
                style={{
                    background: 'var(--theme-primary-bg)',
                    border: '1px solid var(--theme-primary)',
                    color: 'var(--theme-primary-text)',
                }}
            />
            <div className="flex-1 relative min-w-0">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={feature.description}
                        onChange={(e) => { onUpdate(feature.id, 'description', e.target.value); autoResize(); }}
                        onBlur={() => setIsEditing(false)}
                        onFocus={autoResize}
                        placeholder="특징 내용을 입력하세요... (줄바꿈 가능)"
                        rows={2}
                        className="w-full pl-4 pr-10 py-2 rounded-xl text-sm focus:outline-none transition-all resize-none overflow-hidden shadow-sm leading-relaxed"
                        style={{
                            background: 'var(--admin-input-bg)',
                            border: '1px solid var(--theme-primary)',
                            color: dark ? '#f1f5f9' : '#1e293b',
                            minHeight: '38px',
                        }}
                    />
                ) : (
                    <div
                        onClick={handleFocus}
                        title={feature.description || '클릭하여 입력'}
                        className="w-full pl-4 pr-10 py-2 rounded-xl text-sm font-medium cursor-text transition-all leading-relaxed truncate"
                        style={{
                            background: dark ? '#0f172a' : '#f8fafc',
                            border: '1px solid var(--admin-border)',
                            color: dark ? '#cbd5e1' : '#374151',
                            minHeight: '38px',
                            lineHeight: '22px',
                        }}
                    >
                        {feature.description
                            ? <span className="block truncate">{feature.description.replace(/\n/g, ' ')}</span>
                            : <span style={{ color: 'var(--admin-text-sub)', opacity: 0.5 }}>특징 내용을 입력하세요...</span>
                        }
                    </div>
                )}
                <button
                    onClick={() => onRemove(feature.id)}
                    className="absolute right-3 top-2 hover:text-red-500 transition-colors z-10"
                    style={{ color: 'var(--admin-text-sub)' }}
                >
                    <Trash2 size={15} />
                </button>
            </div>
        </div>
    );
};

// PromptRow: 프롬프트 인라인 편집 컴포넌트
const PromptRow: React.FC<{
    prompt: PromptEntry;
    mode: 'IMAGE' | 'VIDEO';
    dark: boolean;
    onUpdate: (id: string, key: 'label' | 'text', value: string) => void;
    onRemove: (id: string) => void;
}> = ({ prompt, mode, dark, onUpdate, onRemove }) => {
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFocus = () => {
        setIsEditing(true);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const len = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(len, len);
                autoResize();
            }
        }, 0);
    };

    const autoResize = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    return (
        <div className="flex items-start gap-2 group">
            <input
                type="text"
                value={prompt.label}
                onChange={(e) => onUpdate(prompt.id, 'label', e.target.value)}
                placeholder="항목명"
                className="w-28 flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none transition-all mt-0.5"
                style={{
                    background: 'var(--theme-primary-bg)',
                    border: '1px solid var(--theme-primary)',
                    color: 'var(--theme-primary-text)',
                }}
            />
            <div className="flex-1 relative min-w-0">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={prompt.text}
                        onChange={(e) => { onUpdate(prompt.id, 'text', e.target.value); autoResize(); }}
                        onBlur={() => setIsEditing(false)}
                        onFocus={autoResize}
                        placeholder={`${mode === 'IMAGE' ? '이미지' : '동영상'} 생성 프롬프트를 입력하세요...`}
                        rows={2}
                        className="w-full pl-4 pr-10 py-2 rounded-xl text-sm focus:outline-none transition-all resize-none overflow-hidden shadow-sm leading-relaxed"
                        style={{
                            background: 'var(--admin-input-bg)',
                            border: '1px solid var(--theme-primary)',
                            color: dark ? '#f1f5f9' : '#1e293b',
                            minHeight: '38px',
                        }}
                    />
                ) : (
                    <div
                        onClick={handleFocus}
                        title={prompt.text || '클릭하여 입력'}
                        className="w-full pl-4 pr-10 py-2 rounded-xl text-sm font-medium cursor-text transition-all leading-relaxed"
                        style={{
                            background: dark ? '#0f172a' : '#f8fafc',
                            border: '1px solid var(--admin-border)',
                            color: dark ? '#cbd5e1' : '#374151',
                            minHeight: '38px',
                            lineHeight: '22px',
                        }}
                    >
                        {prompt.text
                            ? <span className="block truncate">{prompt.text.replace(/\n/g, ' ')}</span>
                            : <span style={{ color: 'var(--admin-text-sub)', opacity: 0.5 }}>{mode === 'IMAGE' ? '이미지' : '동영상'} 생성 프롬프트를 입력하세요...</span>
                        }
                    </div>
                )}
                <button
                    onClick={() => onRemove(prompt.id)}
                    className="absolute right-3 top-2 hover:text-red-500 transition-colors z-10"
                    style={{ color: 'var(--admin-text-sub)' }}
                >
                    <Trash2 size={15} />
                </button>
            </div>
        </div>
    );
};

const ProductSummary: React.FC<{ role?: UserRole }> = ({ role }) => {
    const { nodes, setNodes } = useProductContext();
    const { theme } = useAdminTheme();
    const dark = theme.darkMode;

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'IMAGE' | 'FEATURE'>('IMAGE');
    const [promptMode, setPromptMode] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
    const [sidebarWidth, setSidebarWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [images, setImages] = useState<ProductImage[]>([]);
    const [features, setFeatures] = useState<ProductFeature[]>([]);
    const [materials, setMaterials] = useState<MaterialEntry[]>([]);
    const [imagePrompts, setImagePrompts] = useState<PromptEntry[]>([]);
    const [videoPrompts, setVideoPrompts] = useState<PromptEntry[]>([]);

    useEffect(() => {
        if (selectedNodeId && nodes[selectedNodeId]) {
            const node = nodes[selectedNodeId];
            const parseAttr = (key: string, fallback: any) => {
                try { return node.attributes?.[key] ? JSON.parse(node.attributes[key]) : fallback; }
                catch (e) { return fallback; }
            };
            setImages(parseAttr('summary_images', []));
            setFeatures(parseAttr('summary_features', []));
            setMaterials(parseAttr('material_entries', []));
            setImagePrompts(parseAttr('image_prompts', []));
            setVideoPrompts(parseAttr('video_prompts', []));
        } else {
            setImages([]); setFeatures([]); setMaterials([]);
            setImagePrompts([]); setVideoPrompts([]);
        }
    }, [selectedNodeId, nodes]);

    const gridData = useMemo(() => {
        const rows: { id: string; path: string; label: string; node: NodeData }[] = [];
        const visitedIds = new Set<string>();
        const traverse = (nodeId: string, pathStr: string) => {
            if (visitedIds.has(nodeId)) return;
            visitedIds.add(nodeId);
            const node = nodes[nodeId];
            if (!node) return;
            const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;
            const nodeType = node.attributes?.nodeType;
            if (nodeType === 'color' || node.attributes?.color || nodeType === 'option') return;
            if (nodeType === 'species' || nodeType === 'product') { rows.push({ id: node.id, path: currentPath, label: node.label, node }); return; }
            if (node.type === 'ROOT' || node.type === 'CATEGORY' || node.type === 'REFERENCE' || nodeType === 'category' || nodeType === 'species' || nodeType === 'item' || nodeType === 'system') {
                if (node.childrenIds) node.childrenIds.forEach(childId => traverse(childId, currentPath));
                return;
            }
            const children = (node.childrenIds || []).map(id => nodes[id]).filter(Boolean);
            const hasColorChildren = children.some((c: NodeData) => c.attributes?.nodeType === 'color' || c.attributes?.color);
            if (hasColorChildren || children.length === 0) { rows.push({ id: node.id, path: currentPath, label: node.label, node }); }
            else { node.childrenIds?.forEach(childId => traverse(childId, currentPath)); }
        };
        const rootNode = nodes['root'];
        if (rootNode?.childrenIds) rootNode.childrenIds.forEach(id => traverse(id, ''));
        return rows;
    }, [nodes]);

    useEffect(() => {
        if (gridData.length > 0 && !selectedNodeId) setSelectedNodeId(gridData[0].id);
    }, [gridData, selectedNodeId]);

    const handleSave = () => {
        if (!selectedNodeId) return;
        setNodes(prev => ({
            ...prev,
            [selectedNodeId]: {
                ...prev[selectedNodeId],
                attributes: {
                    ...prev[selectedNodeId].attributes,
                    summary_images: JSON.stringify(images),
                    summary_features: JSON.stringify(features),
                    material_entries: JSON.stringify(materials),
                    image_prompts: JSON.stringify(imagePrompts),
                    video_prompts: JSON.stringify(videoPrompts)
                }
            }
        }));
        alert('저장되었습니다.');
    };

    const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setImages(prev => [...prev, { id: `img-${Date.now()}`, url: ev.target?.result as string }]);
        reader.readAsDataURL(file);
    };
    const removeImage = (id: string) => setImages(prev => prev.filter(img => img.id !== id));
    const addFeature = () => setFeatures(prev => [...prev, { id: `feat-${Date.now()}`, label: '', description: '' }]);
    const removeFeature = (id: string) => setFeatures(prev => prev.filter(f => f.id !== id));
    const updateFeature = (id: string, key: 'label' | 'description', value: string) => setFeatures(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
    const addMaterial = () => setMaterials(prev => [...prev, { id: `mat-${Date.now()}`, imageUrl: '', description: '' }]);
    const removeMaterial = (id: string) => setMaterials(prev => prev.filter(m => m.id !== id));
    const updateMaterial = (id: string, key: keyof MaterialEntry, value: string) => setMaterials(prev => prev.map(m => m.id === id ? { ...m, [key]: value } : m));
    const handleMaterialImgUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => updateMaterial(id, 'imageUrl', ev.target?.result as string);
        reader.readAsDataURL(file);
    };
    const addPrompt = () => {
        const newP = { id: `p-${Date.now()}`, label: '', text: '' };
        if (promptMode === 'IMAGE') setImagePrompts(prev => [...prev, newP]);
        else setVideoPrompts(prev => [...prev, newP]);
    };
    const removePrompt = (id: string) => {
        if (promptMode === 'IMAGE') setImagePrompts(prev => prev.filter(p => p.id !== id));
        else setVideoPrompts(prev => prev.filter(p => p.id !== id));
    };
    const updatePrompt = (id: string, key: 'label' | 'text', value: string) => {
        if (promptMode === 'IMAGE') setImagePrompts(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));
        else setVideoPrompts(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));
    };

    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing && sidebarRef.current) {
            const newWidth = mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left;
            if (newWidth > 300 && newWidth < 800) setSidebarWidth(newWidth);
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        }
        return () => { window.removeEventListener("mousemove", resize); window.removeEventListener("mouseup", stopResizing); };
    }, [isResizing, resize, stopResizing]);

    // 공통 카드 스타일
    const cardStyle = { background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' };
    const headerBg = { background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)' };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden font-sans" style={{ background: 'var(--admin-bg)' }}>
            {/* Header */}
            <header id="product-summary-header" className="flex-shrink-0 border-b px-8 h-20 shadow-sm z-20 flex items-center justify-between gap-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="flex items-center gap-4 min-w-fit">
                    <ClipboardList style={{ color: 'var(--theme-primary)' }} className="shrink-0" size={28} />
                    <h1 className="text-2xl font-bold whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>상품개요</h1>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                        총 {gridData.length}개
                    </span>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 text-white flex-shrink-0"
                    style={{ background: 'var(--theme-primary)' }}
                >
                    <Save size={16} /> 저장하기
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left: Product List */}
                <div
                    ref={sidebarRef}
                    className="flex-shrink-0 flex flex-col overflow-hidden relative"
                    style={{ width: sidebarWidth, background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}
                >
                    <div className="p-4 flex items-center justify-between" style={{ background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)' }}>
                        <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-sub)' }}>
                            <LayoutGrid size={15} /> 상품종류 리스트
                        </h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>
                            {gridData.length}건
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                        {gridData.map((item) => {
                            const isActive = selectedNodeId === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedNodeId(item.id)}
                                    className="w-full text-left px-4 py-3 border-b transition-colors relative"
                                    style={isActive
                                        ? { background: 'var(--theme-primary-bg)', borderLeft: '4px solid var(--theme-primary)', borderBottomColor: 'var(--admin-border)' }
                                        : { borderLeft: '4px solid transparent', borderBottomColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}
                                >
                                    <div className="flex justify-between items-start mb-0.5">
                                        <span className="font-bold text-sm truncate pr-2"
                                            style={{ color: isActive ? 'var(--theme-primary)' : 'var(--admin-text)' }}>
                                            {item.label}
                                        </span>
                                        {isActive && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--theme-primary)' }} />}
                                    </div>
                                    <p className="text-[10px] truncate" style={{ color: 'var(--admin-text-sub)' }}>
                                        {item.path}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    <div onMouseDown={startResizing} className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-30 transition-colors"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    />
                </div>

                {/* Right: Content Area */}
                <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide" style={{ background: 'var(--admin-bg)' }}>
                    {selectedNodeId ? (
                        <div className="max-w-5xl mx-auto space-y-8">

                            {/* 1. 이미지 / 특징 카드 */}
                            <section className="rounded-3xl overflow-hidden shadow-sm" style={cardStyle}>
                                <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                    <div className="flex items-center gap-6">
                                        <h2 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>상품 이미지 리스트</h2>
                                        <div className="flex p-1 rounded-2xl" style={{ background: 'var(--admin-bg)' }}>
                                            {(['IMAGE', 'FEATURE'] as const).map((tab) => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setActiveTab(tab)}
                                                    className="px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                                    style={activeTab === tab ? {
                                                        background: 'var(--theme-primary-bg)',
                                                        color: 'var(--theme-primary)',
                                                        border: '1px solid var(--theme-primary)',
                                                    } : { color: 'var(--admin-text-sub)', border: '1px solid transparent' }}
                                                >
                                                    {tab === 'IMAGE' ? <><ImageIcon size={14} /> 이미지</> : <><ClipboardList size={14} /> 특징</>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => activeTab === 'IMAGE' ? imageInputRef.current?.click() : addFeature()}
                                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
                                        style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}
                                    >
                                        <Plus size={16} /> {activeTab === 'IMAGE' ? '이미지 등록' : '특징 추가'}
                                    </button>
                                    <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={addImage} />
                                </div>

                                <div className="p-8">
                                    {activeTab === 'IMAGE' ? (
                                        <div className="flex flex-wrap gap-5">
                                            {images.map(img => (
                                                <div key={img.id} className="relative group w-[150px] h-[150px] rounded-2xl overflow-hidden shadow-sm transition-all hover:scale-105 hover:shadow-md"
                                                    style={{ border: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                                                    <img src={img.url} alt="product" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button onClick={() => removeImage(img.id)} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => imageInputRef.current?.click()}
                                                className="w-[150px] h-[150px] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group"
                                                style={{ border: '2px dashed var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text-sub)' }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--theme-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--theme-primary)'; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--admin-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--admin-text-sub)'; }}
                                            >
                                                <div className="p-3 rounded-full" style={{ background: 'var(--admin-bg)' }}><Plus size={24} /></div>
                                                <span className="text-xs font-bold">새 이미지</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {features.map((f) => (
                                                <FeatureRow key={f.id} feature={f} dark={dark} onUpdate={updateFeature} onRemove={removeFeature} />
                                            ))}
                                            {features.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--admin-text-sub)', opacity: 0.4 }}>
                                                    <ClipboardList size={40} strokeWidth={1} />
                                                    <p className="text-sm font-medium">등록된 특징이 없습니다.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 2. 재질 설정 카드 */}
                            <section className="rounded-3xl overflow-hidden shadow-sm" style={cardStyle}>
                                <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                    <h2 className="text-lg font-bold flex items-center gap-3" style={{ color: 'var(--admin-text)' }}>
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                                            style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>
                                            <Settings size={20} />
                                        </div>
                                        상품 재질 설정
                                    </h2>
                                    <button onClick={addMaterial}
                                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
                                        style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>
                                        <Plus size={16} /> 재질 추가
                                    </button>
                                </div>
                                <div className="p-8 space-y-6">
                                    {materials.map((mat, idx) => (
                                        <div key={mat.id} className="flex gap-6 p-6 rounded-3xl relative group/mat"
                                            style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
                                            <div className="w-[150px] h-[150px] flex-shrink-0 rounded-2xl overflow-hidden relative shadow-sm group/img"
                                                style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                                {mat.imageUrl ? (
                                                    <img src={mat.imageUrl} alt="mat" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: 'var(--admin-text-sub)', opacity: 0.4 }}>
                                                        <ImageIcon size={30} strokeWidth={1} />
                                                        <span className="text-[10px] font-bold">이미지 없음</span>
                                                    </div>
                                                )}
                                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMaterialImgUpload(mat.id, e)} />
                                                    <div className="p-2 bg-white rounded-full text-slate-700 shadow-xl"><Plus size={18} /></div>
                                                </label>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black px-3 py-1 rounded-full"
                                                        style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>
                                                        MATERIAL {idx + 1}
                                                    </span>
                                                    <button onClick={() => removeMaterial(mat.id)} className="p-1.5 hover:text-red-500 transition-colors"
                                                        style={{ color: 'var(--admin-text-sub)' }}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                <textarea
                                                    value={mat.description}
                                                    onChange={(e) => updateMaterial(mat.id, 'description', e.target.value)}
                                                    placeholder="재질에 대한 설명을 입력하세요..."
                                                    className="flex-1 w-full p-4 rounded-2xl text-sm focus:outline-none transition-all resize-none shadow-sm"
                                                    style={{
                                                        background: 'var(--admin-input-bg)',
                                                        border: '1px solid var(--admin-border)',
                                                        color: 'var(--admin-text)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {materials.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-3xl"
                                            style={{ color: 'var(--admin-text-sub)', opacity: 0.4, border: '2px dashed var(--admin-border)' }}>
                                            <Settings size={40} strokeWidth={1} />
                                            <p className="text-sm font-medium">등록된 재질 설정이 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 3. 생성프롬프트 카드 */}
                            <section className="rounded-3xl overflow-hidden shadow-sm mb-12" style={cardStyle}>
                                <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                    <div className="flex items-center gap-6">
                                        <h2 className="text-lg font-bold flex items-center gap-3" style={{ color: 'var(--admin-text)' }}>
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                                                style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>
                                                <Sparkles size={20} />
                                            </div>
                                            생성프롬프트
                                        </h2>
                                        <div className="flex p-1 rounded-2xl" style={{ background: 'var(--admin-bg)' }}>
                                            {(['IMAGE', 'VIDEO'] as const).map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setPromptMode(mode)}
                                                    className="px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                                    style={promptMode === mode ? {
                                                        background: 'var(--admin-surface)',
                                                        color: 'var(--theme-primary)',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                    } : { color: 'var(--admin-text-sub)' }}
                                                >
                                                    {mode === 'IMAGE' ? <><ImageIcon size={14} /> 이미지</> : <><Video size={14} /> 동영상</>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={addPrompt}
                                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
                                        style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>
                                        <Plus size={16} /> 프롬프트 추가
                                    </button>
                                </div>
                                <div className="p-8 space-y-2.5">
                                    {(promptMode === 'IMAGE' ? imagePrompts : videoPrompts).map((p) => (
                                        <PromptRow key={p.id} prompt={p} mode={promptMode} dark={dark} onUpdate={updatePrompt} onRemove={removePrompt} />
                                    ))}
                                    {(promptMode === 'IMAGE' ? imagePrompts : videoPrompts).length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--admin-text-sub)', opacity: 0.4 }}>
                                            {promptMode === 'IMAGE' ? <ImageIcon size={40} strokeWidth={1} /> : <Video size={40} strokeWidth={1} />}
                                            <p className="text-sm font-medium">등록된 {promptMode === 'IMAGE' ? '이미지' : '동영상'} 프롬프트가 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-6" style={{ color: 'var(--admin-text-sub)', opacity: 0.3 }}>
                            <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                                <LayoutGrid size={100} strokeWidth={0.5} />
                            </motion.div>
                            <div className="text-center" style={{ opacity: 1 }}>
                                <p className="text-xl font-bold" style={{ color: 'var(--admin-text-sub)' }}>관리할 상품종류를 선택해 주세요</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--admin-text-sub)', opacity: 0.6 }}>좌측 리스트에서 상품을 선택하면 세부 설정을 시작할 수 있습니다.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductSummary;
