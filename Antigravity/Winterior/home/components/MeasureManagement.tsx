
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Search, Plus, Trash2, Edit3, Image as ImageIcon,
    Save, Hash, X, FileImage, Calendar, Clock, TrendingUp,
    Maximize2, Upload, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_MEASURE_IMAGES, MOCK_PARTNERS } from '../constants';
import { useAdminTheme } from './theme/AdminThemeContext';

// --- Types ---
interface MeasureItem {
    id: number | string;
    name?: string;           // 이미지 이름
    tags: string[];
    fileType: string;
    size: string;
    updatedAt: string;
    imageUrl?: string;
    suppliers?: string[];
}

const RECENT_TAGS = ['거실', '암막', '우드'];
const POPULAR_TAGS = ['화이트', '쉬폰', '전동', '호텔식', '차르르'];

const MeasureManagement: React.FC = () => {
    // --- Theme ---
    const { theme } = useAdminTheme();

    // --- State ---
    // Initialize with a shallow copy to ensure we have a mutable array reference
    const [items, setItems] = useState<MeasureItem[]>(() => [...MOCK_MEASURE_IMAGES]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<number | string | null>(null);

    // Delete Confirmation State
    const [deleteId, setDeleteId] = useState<number | string | null>(null);

    // Right Panel Edit State
    const [editTags, setEditTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [localImage, setLocalImage] = useState<string | null>(null);

    // Lightbox State
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Panel resize state
    const [panelWidth, setPanelWidth] = useState(60); // left panel %, default 60%
    const isDragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Name edit state
    const [editName, setEditName] = useState('');

    // Supplier Input State
    const [supplierInput, setSupplierInput] = useState('');
    const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
    const [showPartnerSuggestions, setShowPartnerSuggestions] = useState(false);
    const supplierInputRef = useRef<HTMLInputElement>(null);

    // Get all partner names from MOCK_PARTNERS
    const allPartnerNames = useMemo(() => {
        return MOCK_PARTNERS.map(p => p.partnerName);
    }, []);

    // --- Derived State ---
    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        return items.filter(item =>
            item.tags.some(tag => tag.includes(searchQuery)) ||
            item.fileType.includes(searchQuery)
        );
    }, [items, searchQuery]);

    // Find selected item safely
    const selectedItem = useMemo(() => {
        if (selectedId === null) return undefined;
        return items.find(i => i.id === selectedId);
    }, [items, selectedId]);

    // --- Effect: Sync selection to edit state ---
    useEffect(() => {
        if (selectedItem) {
            setEditTags([...selectedItem.tags]);
            setEditName(selectedItem.name || '');
            setTagInput('');
            setLocalImage(selectedItem.imageUrl || null);
            // Reset supplier input state
            setSupplierInput('');
            setSelectedPartner(null);
            setShowPartnerSuggestions(false);
        } else {
            setEditTags([]);
            setEditName('');
            setTagInput('');
            setLocalImage(null);
            setSupplierInput('');
            setSelectedPartner(null);
            setShowPartnerSuggestions(false);
        }
    }, [selectedItem]);

    // --- Resize Handlers ---
    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const newWidth = ((moveEvent.clientX - rect.left) / rect.width) * 100;
            // Clamp between 30% and 75%
            setPanelWidth(Math.min(75, Math.max(30, newWidth)));
        };

        const onMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, []);

    // --- Handlers: Grid & Actions ---
    const handleSelect = (id: number | string) => {
        setSelectedId(id);
    };

    // --- DELETE HANDLER (Initiates Modal) ---
    const handleDeleteClick = (targetId: number | string) => {
        setDeleteId(targetId);
    };

    // --- CONFIRM DELETE (Executes Logic) ---
    const executeDelete = () => {
        if (deleteId === null) return;

        console.group('Delete Operation');
        console.log('Target ID:', deleteId);

        // Remove from state with explicit filtering logic
        setItems((prevItems) => {
            const initialCount = prevItems.length;
            // String conversion ensures we catch both 1 and "1"
            const nextItems = prevItems.filter((item) => String(item.id) !== String(deleteId));

            console.log(`Items: ${initialCount} -> ${nextItems.length}`);

            if (initialCount === nextItems.length) {
                console.warn('Warning: No item was filtered out. Check ID matching.');
            }

            return nextItems;
        });

        // Clear selection if needed
        if (String(selectedId) === String(deleteId)) {
            console.log('Clearing selection');
            setSelectedId(null);
        }

        console.groupEnd();
        setDeleteId(null); // Close modal
    };

    const handleSave = () => {
        if (!selectedId) return;
        setItems(prev => prev.map(item =>
            item.id === selectedId
                ? {
                    ...item,
                    name: editName,
                    tags: editTags,
                    imageUrl: localImage || undefined,
                    updatedAt: new Date().toISOString().split('T')[0]
                }
                : item
        ));
        // Check if alert is available, otherwise log
        if (typeof window !== 'undefined' && window.alert) {
            // alert('성공적으로 저장되었습니다.'); // Optional: remove alert if it blocks too
        }
    };

    const handleAddItem = () => {
        const newId = Date.now(); // Numeric ID
        const newItem: MeasureItem = {
            id: newId,
            name: '',
            tags: [],
            fileType: 'png',
            size: '0x0',
            updatedAt: new Date().toISOString().split('T')[0],
            imageUrl: ''
        };
        setItems([newItem, ...items]);
        setSelectedId(newId);
    };

    // --- Handlers: Image Upload ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        e.target.value = '';
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    // --- Handlers: Tag Tokenizing Logic ---
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            const trimmed = tagInput.trim();
            if (trimmed) {
                if (!editTags.includes(trimmed)) {
                    setEditTags(prev => [...prev, trimmed]);
                }
                setTagInput('');
            }
        }
        if (e.key === 'Backspace' && tagInput === '' && editTags.length > 0) {
            setEditTags(prev => prev.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setEditTags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    // --- Handlers: Supplier Input Logic ---
    const filteredPartners = useMemo(() => {
        if (!supplierInput || selectedPartner) return [];
        return allPartnerNames.filter(partner =>
            partner.toLowerCase().includes(supplierInput.toLowerCase())
        );
    }, [supplierInput, selectedPartner, allPartnerNames]);

    const handleSupplierInputChange = (value: string) => {
        setSupplierInput(value);

        // If we have a selected partner and user is typing after '|'
        if (selectedPartner) {
            // User is typing the image name part
            return;
        }

        // Show suggestions when typing partner name
        setShowPartnerSuggestions(value.length > 0);
    };

    const handleSelectPartner = (partner: string) => {
        setSelectedPartner(partner);
        setSupplierInput(`${partner} | `);
        setShowPartnerSuggestions(false);
        // Focus back to input for image name entry
        setTimeout(() => supplierInputRef.current?.focus(), 0);
    };

    const handleSupplierKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Handle Enter to complete the supplier tag or select first suggestion
        if (e.key === 'Enter') {
            if (selectedPartner && supplierInput.includes('|')) {
                e.preventDefault();
                const parts = supplierInput.split('|');
                const imageName = parts[1]?.trim();

                if (imageName) {
                    const supplierTag = `${selectedPartner} || ${imageName}`;

                    // Add to items
                    setItems(prev => prev.map(item =>
                        item.id === selectedId
                            ? { ...item, suppliers: [...(item.suppliers || []), supplierTag] }
                            : item
                    ));

                    // Reset input
                    setSupplierInput('');
                    setSelectedPartner(null);
                }
            } else if (!selectedPartner && filteredPartners.length > 0) {
                // If user presses Enter while suggestions are shown, select first one
                e.preventDefault();
                handleSelectPartner(filteredPartners[0]);
            }
        }

        // Handle Backspace to remove last supplier or reset partner selection
        if (e.key === 'Backspace' && supplierInput === '') {
            if (selectedItem?.suppliers && selectedItem.suppliers.length > 0) {
                e.preventDefault();
                setItems(prev => prev.map(item =>
                    item.id === selectedId
                        ? { ...item, suppliers: item.suppliers?.slice(0, -1) }
                        : item
                ));
            }
        }

        // If backspace and we're at the '|' position, reset partner selection
        if (e.key === 'Backspace' && selectedPartner && supplierInput === `${selectedPartner} | `) {
            e.preventDefault();
            setSelectedPartner(null);
            setSupplierInput('');
        }
    };

    const removeSupplier = (index: number) => {
        setItems(prev => prev.map(item =>
            item.id === selectedId
                ? { ...item, suppliers: item.suppliers?.filter((_, i) => i !== index) }
                : item
        ));
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden font-sans" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)' }}>

            {/* 1. Header & Filter Area (Compact Single Line) */}
            <div className="flex-shrink-0 px-8 h-20 shadow-sm z-20 flex items-center justify-between gap-6" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>

                {/* Left: Title & Count */}
                <div className="flex items-center gap-3 min-w-fit">
                    <h1 className="text-2xl font-bold flex items-center gap-2 whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>
                        <FileImage style={{ color: 'var(--theme-primary)' }} />
                        실사 관리
                    </h1>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary-bg)' }}>
                        총 {filteredItems.length}개
                    </span>
                </div>

                {/* Center: Search Input */}
                <div className="flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--admin-text-sub)' }} />
                        <input
                            type="text"
                            placeholder="태그 또는 파일타입 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-[var(--theme-radius)] text-sm font-medium outline-none transition-all"
                            style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                            onFocus={e => (e.target.style.borderColor = 'var(--theme-primary)')}
                            onBlur={e => (e.target.style.borderColor = 'var(--admin-border)')}
                        />
                    </div>
                </div>

                {/* Right: Recommended Tags */}
                <div className="flex items-center justify-end gap-6 overflow-hidden">
                    {/* Recent */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase" style={{ color: 'var(--admin-text-sub)' }}>
                            <Clock size={12} /> 최근
                        </span>
                        <div className="flex gap-1.5">
                            {RECENT_TAGS.map(tag => (
                                <button key={tag} onClick={() => setSearchQuery(tag)} className="px-2.5 py-1 rounded-lg text-xs transition-colors font-medium whitespace-nowrap" style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-px h-4 flex-shrink-0 hidden xl:block" style={{ background: 'var(--admin-border)' }} />

                    {/* Popular */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase" style={{ color: 'var(--theme-primary)' }}>
                            <TrendingUp size={12} /> 인기
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                            {POPULAR_TAGS.map(tag => (
                                <button key={tag} onClick={() => setSearchQuery(tag)} className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary-text)', border: '1px solid var(--theme-primary-bg)' }}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Main Content (Split View) */}
            <div className="flex-1 flex overflow-hidden" ref={containerRef}>

                {/* LEFT: Grid List (dynamic width) */}
                <div className="relative flex flex-col min-w-0 flex-shrink-0" style={{ width: `${panelWidth}%`, borderRight: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>
                    <div className="flex items-center px-6 py-3 text-xs font-bold uppercase tracking-wider flex-shrink-0" style={{ background: 'var(--admin-grid-header)', borderBottom: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>
                        <div className="w-12 text-center flex-shrink-0">이미지</div>
                        <div className="w-28 flex-shrink-0 pl-2">이름</div>
                        <div className="flex-1 pl-2 min-w-0">검색 태그</div>
                        <div className="w-14 text-center flex-shrink-0">타입</div>
                        <div className="w-20 text-center flex-shrink-0">수정일</div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-2" style={{ color: 'var(--admin-text-sub)' }}>
                                <Search size={32} className="opacity-20" />
                                <p className="text-sm">검색 결과가 없습니다.</p>
                            </div>
                        ) : (
                            filteredItems.map((item, index) => {
                                const isSelected = selectedId === item.id;
                                return (
                                    <motion.div
                                        layoutId={`row-${item.id}`}
                                        key={item.id}
                                        onClick={() => handleSelect(item.id)}
                                        className="flex items-center px-4 py-2.5 cursor-pointer transition-colors group relative"
                                        style={{ borderBottom: '1px solid var(--admin-border)', background: isSelected ? 'var(--theme-primary-bg)' : 'var(--admin-list-bg)' }}
                                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--admin-list-hover)'; }}
                                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--admin-list-bg)'; }}
                                    >
                                        <div className="w-12 flex justify-center flex-shrink-0">
                                            {item.imageUrl ? (
                                                <div
                                                    className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 relative group/thumb cursor-zoom-in"
                                                    onClick={(e) => { e.stopPropagation(); setPreviewImage(item.imageUrl || null); }}
                                                >
                                                    <img src={item.imageUrl} alt="thumbnail" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Maximize2 size={12} className="text-white drop-shadow-md" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-border)' }}>
                                                    <ImageIcon size={16} />
                                                </div>
                                            )}
                                        </div>
                                        {/* 이름 컬럼 */}
                                        <div className="w-28 pl-2 pr-1 flex-shrink-0 min-w-0">
                                            <span className="text-xs font-medium truncate block" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)' }}>
                                                {item.name || <span style={{ color: 'var(--admin-border)' }}>-</span>}
                                            </span>
                                        </div>
                                        {/* 태그 컬럼 */}
                                        <div className="flex-1 pl-2 pr-2 min-w-0">
                                            <div className="flex flex-wrap gap-1">
                                                {item.tags.length > 0 ? item.tags.slice(0, 2).map((tag, idx) => (
                                                    <span key={idx} className="text-xs px-1.5 py-0.5 rounded-md font-medium truncate max-w-[80px]" style={isSelected ? { background: 'var(--theme-primary-bg)', color: 'var(--theme-primary-text)' } : { background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                                                        #{tag}
                                                    </span>
                                                )) : <span style={{ color: 'var(--admin-border)' }}>-</span>}
                                                {item.tags.length > 2 && (
                                                    <span className="text-xs flex items-center" style={{ color: 'var(--admin-text-sub)' }}>+{item.tags.length - 2}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-14 text-center text-xs font-mono uppercase flex-shrink-0" style={{ color: 'var(--admin-text-sub)' }}>
                                            {item.fileType}
                                        </div>
                                        <div className="w-20 text-center text-xs flex-shrink-0" style={{ color: 'var(--admin-text-sub)' }}>
                                            {item.updatedAt}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                    {/* RESIZE HANDLE (상품개요 동일 스타일) */}
                    <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-30 transition-colors"
                        style={{ background: 'transparent' }}
                        onMouseDown={handleResizeMouseDown}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    />
                </div>

                {/* RIGHT: Detail & Edit Panel (dynamic width) */}
                <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
                    {selectedItem ? (
                        <div className="flex flex-col h-full overflow-y-auto p-8">
                            {/* Header Actions */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                                    <Edit3 size={18} style={{ color: 'var(--admin-text-sub)' }} />
                                    상세 정보 편집
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ color: 'var(--admin-text-sub)' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-primary)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--theme-primary-bg)'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                        title="새 항목 추가"
                                    >
                                        <Plus size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(selectedItem.id);
                                        }}
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ color: 'var(--admin-text-sub)' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                        title="삭제"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="w-px h-8 mx-1" style={{ background: 'var(--admin-border)' }} />
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-1.5 text-white px-4 py-2 rounded-[var(--theme-radius)] text-sm font-bold shadow-md transition-transform active:scale-95"
                                        style={{ background: 'var(--theme-primary)' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
                                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
                                    >
                                        <Save size={16} /> 저장
                                    </button>
                                </div>
                            </div>

                            {/* Image Preview Area with Upload */}
                            <div className="p-3 shadow-sm mb-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--theme-radius)' }}>
                                <div
                                    className="h-36 rounded-[var(--theme-radius)] overflow-hidden relative group border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors"
                                    style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}
                                    onClick={triggerFileUpload}
                                >
                                    {localImage ? (
                                        <img
                                            src={localImage}
                                            alt="Preview"
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3" style={{ color: 'var(--admin-text-sub)' }}>
                                            <ImageIcon size={48} strokeWidth={1.5} />
                                            <span className="text-sm font-medium">이미지 업로드 (클릭)</span>
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        {localImage && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setPreviewImage(localImage); }}
                                                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-bold hover:bg-white/30 transition-colors flex items-center gap-2"
                                            >
                                                <Maximize2 size={16} /> 크게 보기
                                            </button>
                                        )}
                                        <button type="button" className="px-4 py-2 text-white rounded-lg text-sm font-bold transition-opacity flex items-center gap-2 shadow-lg" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}>
                                            <Upload size={16} /> {localImage ? '이미지 변경' : '이미지 선택'}
                                        </button>
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                <div className="mt-2 flex items-center justify-between text-xs px-1" style={{ color: 'var(--admin-text-sub)' }}>
                                    <span>{selectedItem.size} • {selectedItem.fileType.toUpperCase()}</span>
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {selectedItem.updatedAt}</span>
                                </div>

                                {/* 이름 입력 */}
                                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--admin-border)' }}>
                                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>
                                        이미지 이름
                                    </label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        placeholder="이름을 입력하세요..."
                                        className="w-full px-3 py-2 text-sm border rounded-[var(--theme-radius)] outline-none transition-all"
                                        style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                        onFocus={e => (e.target.style.borderColor = 'var(--theme-primary)')}
                                        onBlur={e => (e.target.style.borderColor = 'var(--admin-border)')}
                                    />
                                </div>
                            </div>

                            {/* Tag Input Field (Tokenizing) */}
                            <div className="shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--theme-radius)', marginBottom: '16px' }}>
                                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-grid-header)', borderRadius: `var(--theme-radius) var(--theme-radius) 0 0` }}>
                                    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                                        <Hash size={14} style={{ color: 'var(--theme-primary)' }} /> 검색 태그 관리
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--admin-text-sub)' }}>
                                        태그 입력 (Spacebar to Add)
                                    </label>

                                    {/* Tag Container */}
                                    <div
                                        className="w-full min-h-[48px] border p-2 flex flex-wrap gap-1.5 transition-all"
                                        style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', borderRadius: 'var(--theme-radius)' }}
                                        onClick={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--theme-primary)'; document.getElementById('tag-input')?.focus(); }}
                                        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--admin-border)'; }}
                                    >
                                        <AnimatePresence>
                                            {editTags.map((tag, idx) => (
                                                <motion.div
                                                    key={`${tag}-${idx}`}
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.8, opacity: 0 }}
                                                    className="flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-lg text-sm font-bold group"
                                                    style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary-text)', border: '1px solid var(--theme-primary-bg)' }}
                                                >
                                                    <span>{tag}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                                                        className="p-0.5 rounded-full transition-colors"
                                                        style={{ color: 'var(--theme-primary-text)' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        <input
                                            id="tag-input"
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1.5 px-1"
                                            style={{ color: 'var(--admin-text)' }}
                                            placeholder={editTags.length === 0 ? "태그를 입력하고 스페이스바를 누르세요" : ""}
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px]" style={{ color: 'var(--admin-text-sub)' }}>* 스페이스바 또는 Enter로 태그 추가, X 버튼으로 삭제</p>
                                </div>
                            </div>


                            {/* Photo Supplier Management */}
                            <div className="overflow-visible mt-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--theme-radius)' }}>
                                <div className="p-5" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-grid-header)' }}>
                                    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                                        <FileImage size={14} className="text-green-500" /> 실사공급업체
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--admin-text-sub)' }}>
                                        거래처명 입력 후 실사이미지명 입력 (Enter)
                                    </label>

                                    {/* Supplier Tag Container */}
                                    <div className="relative">
                                        <div
                                            className="w-full min-h-[52px] border rounded-[var(--theme-radius)] p-2 flex flex-wrap gap-2 transition-all"
                                            style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)' }}
                                            onClick={() => supplierInputRef.current?.focus()}
                                        >
                                            <AnimatePresence>
                                                {(selectedItem.suppliers || []).map((supplier: string, idx: number) => (
                                                    <motion.div
                                                        key={`${supplier}-${idx}`}
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.8, opacity: 0 }}
                                                        className="flex items-center gap-1 pl-3 pr-1 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-bold group border border-green-100"
                                                    >
                                                        <span>{supplier}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeSupplier(idx); }}
                                                            className="p-0.5 hover:bg-green-100 rounded-full text-green-400 hover:text-green-600 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>

                                            <input
                                                ref={supplierInputRef}
                                                type="text"
                                                value={supplierInput}
                                                onChange={(e) => handleSupplierInputChange(e.target.value)}
                                                onKeyDown={handleSupplierKeyDown}
                                                onFocus={() => !selectedPartner && supplierInput && setShowPartnerSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowPartnerSuggestions(false), 200)}
                                                className="flex-1 min-w-[200px] bg-transparent outline-none text-sm py-1.5 px-1"
                                                style={{ color: 'var(--admin-text)' }}
                                                placeholder={(selectedItem.suppliers || []).length === 0 ? "거래처명 입력..." : ""}
                                            />
                                        </div>

                                        {/* Partner Autocomplete Suggestions */}
                                        <AnimatePresence>
                                            {showPartnerSuggestions && filteredPartners.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl z-[100] max-h-48 overflow-y-auto"
                                                    style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
                                                >
                                                    {filteredPartners.map((partner, idx) => (
                                                        <div
                                                            key={idx}
                                                            onMouseDown={() => handleSelectPartner(partner)}
                                                            className="px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors"
                                                            style={{ color: 'var(--admin-text)', borderBottom: '1px solid var(--admin-border)' }}
                                                            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--admin-grid-header)'}
                                                            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                                                        >
                                                            {partner}
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <p className="mt-2 text-[11px]" style={{ color: 'var(--admin-text-sub)' }}>
                                        * 거래처명 선택 후 '|' 다음에 실사이미지명을 입력하세요.
                                    </p>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: 'var(--admin-text-sub)' }}>
                            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--admin-grid-header)' }}>
                                <ImageIcon size={32} className="opacity-30" />
                            </div>
                            <p className="font-medium text-sm">목록에서 항목을 선택하여 편집하세요.</p>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all active:scale-95"
                                style={{ background: 'var(--theme-primary)' }}
                                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
                                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
                            >
                                <Plus size={16} /> 새 이미지 추가
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {previewImage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                            onClick={() => setPreviewImage(null)}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center pointer-events-none"
                        >
                            <img
                                src={previewImage}
                                alt="Full Preview"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto"
                            />

                            {/* Close Button */}
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full pointer-events-auto transition-colors z-50 backdrop-blur-md"
                            >
                                <X size={24} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DELETE CONFIRMATION MODAL (Custom) */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setDeleteId(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="shadow-2xl p-6 w-full max-w-sm relative z-10 text-center"
                            style={{ background: 'var(--admin-modal-bg)', borderRadius: 'var(--theme-radius)', border: '1px solid var(--admin-border)' }}
                        >
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--admin-text)' }}>항목 삭제</h3>
                            <p className="text-sm mb-6" style={{ color: 'var(--admin-text-sub)' }}>정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 py-3 font-bold text-sm transition-colors"
                                    style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text)', borderRadius: 'var(--theme-radius)' }}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={executeDelete}
                                    className="flex-1 py-3 bg-red-600 text-white font-bold text-sm shadow-lg transition-colors"
                                    style={{ borderRadius: 'var(--theme-radius)' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
                                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
                                >
                                    삭제하기
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div >
    );
};

export default MeasureManagement;
