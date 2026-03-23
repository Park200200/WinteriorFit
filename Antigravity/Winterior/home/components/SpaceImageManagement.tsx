
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Search, Plus, Trash2, Edit3, Image as ImageIcon,
    Save, Hash, X, Clock, TrendingUp,
    Maximize2, Upload, AlertTriangle, Layers, LayoutTemplate,
    Scan, Sparkles, ZoomIn, ZoomOut, Loader2, Check, Grid, Ruler
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_SPACE_IMAGES } from '../constants';
import {
    saveFileHandle, loadFileHandle, removeFileHandle,
    readFileAsUrl, pickImageFile, isFileSystemAccessSupported,
    saveThumbnail, loadAllThumbnails, removeThumbnail
} from '../utils/fileHandleStorage';
import { useAdminTheme } from './theme/AdminThemeContext';

const SPACE_ITEMS_STORAGE_KEY = 'winterior_space_items_v2'; // v2: base64 직접 저장

// MOCK ID → imageUrl 빠른 조회 맵
const MOCK_IMAGE_URL_MAP: Record<string | number, string> = {};
MOCK_SPACE_IMAGES.forEach(m => { if (m.imageUrl) MOCK_IMAGE_URL_MAP[m.id] = m.imageUrl; });

// base64(data:) 이미지 여부 판별
const isDataUrl = (url?: string) => !!url && url.startsWith('data:');

// Canvas를 이용해 이미지 압축 (최대 1200px, JPEG 0.8)
const compressImage = (dataUrl: string, maxW = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > maxW) {
                height = Math.round(height * maxW / width);
                width = maxW;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(dataUrl); return; }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
};

// items 저장 (메타데이터만, 주시: base64 이미지는 IndexedDB에 저장)
const saveSpaceItems = (items: SpaceItem[]) => {
    // base64 (data:) 는 localStorage에 저장하지 않음 (IndexedDB에 저장됨)
    const metaOnly = items.map(item => ({
        ...item,
        imageUrl: isDataUrl(item.imageUrl) ? undefined : item.imageUrl,
    }));
    try {
        localStorage.setItem(SPACE_ITEMS_STORAGE_KEY, JSON.stringify(metaOnly));
    } catch {
        // 용량 초과 시에도 MOCK URL만 남기고 재시도
        try {
            const slim = metaOnly.map(item => ({
                ...item,
                imageUrl: undefined,
            }));
            localStorage.setItem(SPACE_ITEMS_STORAGE_KEY, JSON.stringify(slim));
        } catch { }
    }
};

// items 로드
const loadSpaceItems = (): SpaceItem[] => {
    try {
        const saved = localStorage.getItem(SPACE_ITEMS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // imageUrl이 없으면 MOCK 맵에서 보완
                // blob: URL은 만료되었을 수 있지만, 로드시 유지 (단, img 메케는 onError로 처리)
                return parsed.map((item: SpaceItem) => ({
                    ...item,
                    imageUrl: item.imageUrl || MOCK_IMAGE_URL_MAP[item.id] || undefined,
                }));
            }
        }
    } catch { }
    return [...MOCK_SPACE_IMAGES];
};


// --- Types ---
type ProductType = '커튼' | '블라인드' | '기타';

const PRODUCT_COLORS: Record<ProductType, { stroke: string; fill: string; badge: string; label: string }> = {
    '커튼': { stroke: '#8B5CF6', fill: 'rgba(139,92,246,0.18)', badge: 'bg-purple-600', label: 'text-purple-300' },
    '블라인드': { stroke: '#F59E0B', fill: 'rgba(245,158,11,0.18)', badge: 'bg-amber-600', label: 'text-amber-300' },
    '기타': { stroke: '#6B7280', fill: 'rgba(107,114,128,0.18)', badge: 'bg-gray-600', label: 'text-gray-300' },
};

interface InstallationArea {
    id: string;
    name: string;
    points: { x: number; y: number }[];
    width: string;
    height: string;
    productType: ProductType;  // 커튼 / 블라인드 / 기타
    aiSuggested?: boolean;     // AI가 자동 제안한 영역
}

interface SpaceItem {
    id: number | string;
    tags: string[];
    fileType: string;
    size: string;
    updatedAt: string;
    imageUrl?: string;       // 표시용 URL (ObjectURL 또는 MOCK URL)
    imageFileName?: string;  // 원본 파일명 (표시용)
    hasFileHandle?: boolean; // IndexedDB에 파일 핸들 저장 여부
    installationAreas?: InstallationArea[];
}

interface Point {
    x: number;
    y: number;
}

const RECENT_TAGS = ['거실', '침실', '오피스'];
const POPULAR_TAGS = ['화이트', '통창', '우드', '모던', '호텔식'];

const SpaceImageManagement: React.FC = () => {
    // --- Theme ---
    const { theme } = useAdminTheme();
    const dark = theme.darkMode;

    // --- State ---
    const [items, setItems] = useState<SpaceItem[]>(() => loadSpaceItems());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<number | string | null>(null);

    // Delete State
    const [deleteId, setDeleteId] = useState<number | string | null>(null);

    // Right Panel Edit State
    const [editTags, setEditTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [localImage, setLocalImage] = useState<string | null>(null);

    // --- Detail Modal State ---
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Multiple Installation Areas State
    const [areas, setAreas] = useState<InstallationArea[]>([]);
    const [activeAreaId, setActiveAreaId] = useState<string | null>(null);

    // AI Detection State
    const [isAiDetecting, setIsAiDetecting] = useState(false);
    const [detectionComplete, setDetectionComplete] = useState(false);

    // Zoom & Pan State
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });

    // Dragging State for Points
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Resize Panel State (상품개요 동일 패턴) ---
    const [panelWidth, setPanelWidth] = useState(60); // %
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(60);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        startXRef.current = e.clientX;
        startWidthRef.current = panelWidth;
        setIsResizing(true);
    }, [panelWidth]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!isResizing || !containerRef.current) return;
            const containerW = containerRef.current.getBoundingClientRect().width;
            const dx = e.clientX - startXRef.current;
            const newPct = startWidthRef.current + (dx / containerW) * 100;
            if (newPct > 25 && newPct < 75) setPanelWidth(newPct);
        };
        const onUp = () => setIsResizing(false);
        if (isResizing) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isResizing]);

    // --- Derived State ---
    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        return items.filter(item =>
            item.tags.some(tag => tag.includes(searchQuery)) ||
            item.fileType.includes(searchQuery)
        );
    }, [items, searchQuery]);

    const selectedItem = useMemo(() => {
        if (selectedId === null) return undefined;
        return items.find(i => i.id === selectedId);
    }, [items, selectedId]);

    // --- localStorage 자동 저장 (초기 마운트 시 스킵) ---
    const isFirstRun = useRef(true);
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        saveSpaceItems(items);
    }, [items]);

    // 마운트 시: IndexedDB에서 모든 썸네일 로드 → items.imageUrl 적용
    useEffect(() => {
        loadAllThumbnails().then(thumbnails => {
            const keys = Object.keys(thumbnails);
            if (keys.length === 0) return;
            setItems(prev => prev.map(item => {
                const key = String(item.id);
                // imageUrl이 없거나 base64가 아닐 때만 IndexedDB 썸네일로 보완
                if (!isDataUrl(item.imageUrl) && thumbnails[key]) {
                    return { ...item, imageUrl: thumbnails[key] };
                }
                return item;
            }));
        });
    }, []); // 마운트 1회만 실행

    // 항목 선택 시: FileHandle이 있으면 IndexedDB에서 복원해 imageUrl 설정
    useEffect(() => {
        if (!selectedItem) {
            setEditTags([]);
            setTagInput('');
            setLocalImage(null);
            return;
        }
        setEditTags([...selectedItem.tags]);
        setTagInput('');

        if (selectedItem.hasFileHandle) {
            // IndexedDB에서 파일 핸들 복원 → ObjectURL 생성
            loadFileHandle(selectedItem.id).then(async (handle) => {
                if (handle) {
                    const url = await readFileAsUrl(handle);
                    setLocalImage(url || selectedItem.imageUrl || null);
                    if (url) {
                        // 파일핸들 복원에 성공하면 → 썸네일 base64 생성 후 영속 저장
                        // (blob: URL은 세션 종료 시 만료되므로 base64로 변환)
                        try {
                            const thumb = await compressImage(url, 400, 0.62);
                            setItems(prev => prev.map(it =>
                                it.id === selectedItem.id ? { ...it, imageUrl: thumb } : it
                            ));
                        } catch {
                            // base64 변환 실패 시 ObjectURL은 세션 중만 유효
                            setItems(prev => prev.map(it =>
                                it.id === selectedItem.id ? { ...it, imageUrl: url } : it
                            ));
                        }
                    }
                } else {
                    setLocalImage(selectedItem.imageUrl || null);
                }
            });
        } else {
            setLocalImage(selectedItem.imageUrl || null);
        }
    }, [selectedItem?.id]); // id만 의존 (무한루프 방지)

    // --- AI Detection: 커튼/블라인드 최적 영역 자동 제안 ---
    const detectWindowArea = async () => {
        setIsAiDetecting(true);
        setDetectionComplete(false);
        setAreas([]);
        setActiveAreaId(null);

        // 스캔 애니메이션 시간
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 공간 이미지의 태그 힌트 기반으로 현실적인 창문 위치 시뮬레이션
        // 실제 AI 연동 시 이 부분을 API 호출로 교체
        const suggestions: InstallationArea[] = [
            {
                id: `area-ai-${Date.now()}-1`,
                name: '창문 1',
                aiSuggested: true,
                productType: '블라인드',
                points: [
                    { x: 12, y: 10 },
                    { x: 45, y: 10 },
                    { x: 45, y: 72 },
                    { x: 12, y: 72 },
                ],
                width: '2.4',
                height: '1.8',
            },
            {
                id: `area-ai-${Date.now()}-2`,
                name: '창문 2',
                aiSuggested: true,
                productType: '커튼',
                points: [
                    { x: 55, y: 10 },
                    { x: 88, y: 10 },
                    { x: 88, y: 72 },
                    { x: 55, y: 72 },
                ],
                width: '3.2',
                height: '2.1',
            },
        ];

        // 태그에 '통창'/'오션뷰'/'스튜디오' 있으면 창문 3개 제안
        const item = items.find(i => i.id === selectedId);
        const hasLargeWindow = item?.tags.some(t => ['통창', '오션뷰', '스튜디오', '숲뷰', '전망', '뷰'].includes(t));
        if (hasLargeWindow) {
            suggestions.splice(0, 2, {
                id: `area-ai-${Date.now()}-full`,
                name: '통창 전면',
                aiSuggested: true,
                productType: '커튼',
                points: [
                    { x: 8, y: 8 },
                    { x: 92, y: 8 },
                    { x: 92, y: 78 },
                    { x: 8, y: 78 },
                ],
                width: '5.8',
                height: '2.6',
            });
        }

        setAreas(suggestions);
        setActiveAreaId(suggestions[0].id);
        setIsAiDetecting(false);
        setDetectionComplete(true);
    };

    // Trigger Detection OR Load Saved Data on Modal Open
    useEffect(() => {
        if (isDetailModalOpen && localImage) {
            setTransform({ scale: 1, x: 0, y: 0 }); // Reset Zoom

            if (selectedItem && selectedItem.installationAreas && selectedItem.installationAreas.length > 0) {
                // Restore saved areas
                setAreas(JSON.parse(JSON.stringify(selectedItem.installationAreas)));
                setActiveAreaId(selectedItem.installationAreas[0].id);
                setDetectionComplete(true);
                setIsAiDetecting(false);
            } else {
                // No saved areas, start detection
                setAreas([]);
                setActiveAreaId(null);
                detectWindowArea();
            }
        }
    }, [isDetailModalOpen, localImage]); // Keep deps minimal, selectedItem access via closure is intended

    // --- Area Management Handlers ---
    const handleAddArea = () => {
        const newId = `area-${Date.now()}`;
        const offset = areas.length * 6;
        const newArea: InstallationArea = {
            id: newId,
            name: `창문 ${areas.length + 1}`,
            aiSuggested: false,
            productType: '블라인드',
            points: [
                { x: 20 + offset, y: 20 + offset },
                { x: 50 + offset, y: 20 + offset },
                { x: 50 + offset, y: 65 + offset },
                { x: 20 + offset, y: 65 + offset },
            ],
            width: '2.0',
            height: '1.5',
        };
        setAreas(prev => [...prev, newArea]);
        setActiveAreaId(newId);
    };

    const handleUpdateProductType = (id: string, type: ProductType) => {
        setAreas(prev => prev.map(a => a.id === id ? { ...a, productType: type } : a));
    };

    const handleUpdateAreaName = (id: string, name: string) => {
        setAreas(prev => prev.map(a => a.id === id ? { ...a, name } : a));
    };
    const handleDeleteArea = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setAreas(prev => {
            const next = prev.filter(a => a.id !== id);
            if (activeAreaId === id) {
                setActiveAreaId(next.length > 0 ? next[next.length - 1].id : null);
            }
            return next;
        });
    };

    const handleUpdateAreaDim = (id: string, field: 'width' | 'height', value: string) => {
        setAreas(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const handleApplySettings = () => {
        // Save current areas to the selected item
        if (selectedId) {
            setItems(prev => prev.map(item =>
                item.id === selectedId
                    ? { ...item, installationAreas: areas }
                    : item
            ));
        }
        setIsDetailModalOpen(false);
        alert(`${areas.length}개의 설치 영역이 저장되었습니다.`);
    };

    // --- Handlers: Grid & Actions ---
    const handleSelect = (id: number | string) => setSelectedId(id);
    const handleDeleteClick = (id: number | string) => setDeleteId(id);

    const executeDelete = () => {
        if (deleteId === null) return;
        setItems(prev => prev.filter(item => String(item.id) !== String(deleteId)));
        if (String(selectedId) === String(deleteId)) setSelectedId(null);
        // IndexedDB에서 파일 핸들도 제거
        removeFileHandle(deleteId);
        setDeleteId(null);
    };

    const handleSave = () => {
        if (!selectedId) return;
        setItems(prev => prev.map(item =>
            item.id === selectedId
                ? { ...item, tags: editTags, imageUrl: localImage || undefined, updatedAt: new Date().toISOString().split('T')[0] }
                : item
        ));
        alert('저장되었습니다.');
    };

    const handleAddItem = () => {
        const newId = Date.now();
        const newItem: SpaceItem = {
            id: newId, tags: [], fileType: 'jpg', size: '0x0', updatedAt: new Date().toISOString().split('T')[0], imageUrl: ''
        };
        setItems([newItem, ...items]);
        setSelectedId(newId);
    };

    // 이미지 선택 → base64 압축 저장 (단순하고 신뢰성 있는 방식)
    const handlePickImage = () => {
        if (!selectedId) return;
        fileInputRef.current?.click();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedId) return;

        const currentSelectedId = selectedId; // 클로저 안에서 안정적으로 참조
        const reader = new FileReader();
        reader.onloadend = async () => {
            const raw = reader.result as string;
            if (!raw) return;

            // 400px 썸네일 + 1200px 미리보기 동시 압축
            const [thumbnail, preview] = await Promise.all([
                compressImage(raw, 400, 0.65),  // 리스트 표시용 (소형)
                compressImage(raw, 1200, 0.85), // 상세 뷰 표시용 (대형)
            ]);

            // ✅ IndexedDB에 썸네일 영구 저장 (localStorage 용량 절약)
            await saveThumbnail(currentSelectedId, thumbnail);

            setLocalImage(preview); // 상세 뷰에서 고화질 표시
            setItems(prev => prev.map(item =>
                item.id === currentSelectedId ? {
                    ...item,
                    imageUrl: thumbnail,    // 현재 세션 표시용 (saveSpaceItems에서 localStorage에는 제외됨)
                    imageFileName: file.name,
                    hasFileHandle: false,
                    size: `${Math.round(file.size / 1024)}KB`,
                    fileType: 'JPG',
                    updatedAt: new Date().toISOString().split('T')[0],
                } : item
            ));
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // input 초기화 (같은 파일 재선택 가능)
    };


    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            const trimmed = tagInput.trim();
            if (trimmed && !editTags.includes(trimmed)) {
                setEditTags(prev => [...prev, trimmed]);
            }
            setTagInput('');
        }
        if (e.key === 'Backspace' && tagInput === '' && editTags.length > 0) {
            setEditTags(prev => prev.slice(0, -1));
        }
    };

    // --- Detail Modal Interaction Handlers ---

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.2, transform.scale + delta), 5);
        setTransform(prev => ({ ...prev, scale: newScale }));
    };

    const handleZoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.2, 5) }));
    const handleZoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.2, 0.2) }));

    const handleMouseDownViewport = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.drag-point')) return;
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    };

    const handleMouseDownPoint = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingPointIndex(index);
    };

    const handleMouseMoveGlobal = (e: React.MouseEvent) => {
        // Pan Logic
        if (isPanning) {
            setTransform(prev => ({
                ...prev,
                x: e.clientX - panStartRef.current.x,
                y: e.clientY - panStartRef.current.y
            }));
            return;
        }

        // Point Drag Logic (Only active area)
        if (draggingPointIndex !== null && imageContainerRef.current && activeAreaId) {
            const rect = imageContainerRef.current.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const relativeX = e.clientX - rect.left;
            const relativeY = e.clientY - rect.top;

            const x = (relativeX / rect.width) * 100;
            const y = (relativeY / rect.height) * 100;

            setAreas(prev => prev.map(area => {
                if (area.id === activeAreaId) {
                    const newPoints = [...area.points];
                    newPoints[draggingPointIndex] = { x, y };
                    return { ...area, points: newPoints };
                }
                return area;
            }));
        }
    };

    const handleMouseUpGlobal = () => {
        setIsPanning(false);
        setDraggingPointIndex(null);
    };

    // Helper
    const getPolygonPoints = (pts: Point[]) => {
        return pts.map(p => `${p.x},${p.y}`).join(' ');
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden font-sans" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)' }}>

            {/* 1. Header */}
            <div className="flex-shrink-0 px-8 h-20 shadow-sm z-20 flex items-center justify-between gap-6" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
                <div className="flex items-center gap-3 min-w-fit">
                    <h1 className="text-2xl font-bold flex items-center gap-2 whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>
                        <LayoutTemplate style={{ color: 'var(--theme-primary)' }} />
                        공간이미지 관리
                    </h1>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary-bg)' }}>
                        총 {filteredItems.length}개
                    </span>
                </div>
                <div className="flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--admin-text-sub)' }} />
                        <input
                            type="text"
                            placeholder="공간명 태그 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-[var(--theme-radius)] text-sm font-medium outline-none transition-all"
                            style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                            onFocus={e => (e.target.style.borderColor = 'var(--theme-primary)')}
                            onBlur={e => (e.target.style.borderColor = 'var(--admin-border)')}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-6 overflow-hidden">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase" style={{ color: 'var(--admin-text-sub)' }}><Clock size={12} /> 최근</span>
                        <div className="flex gap-1.5">{RECENT_TAGS.map(tag => <button key={tag} onClick={() => setSearchQuery(tag)} className="px-2.5 py-1 rounded-lg text-xs transition-colors font-medium" style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>#{tag}</button>)}</div>
                    </div>
                    <div className="w-px h-4 flex-shrink-0 hidden xl:block" style={{ background: 'var(--admin-border)' }} />
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase" style={{ color: 'var(--theme-primary)' }}><TrendingUp size={12} /> 인기</span>
                        <div className="flex gap-1.5 flex-wrap">{POPULAR_TAGS.map(tag => <button key={tag} onClick={() => setSearchQuery(tag)} className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary-text)', border: '1px solid var(--theme-primary-bg)' }}>{tag}</button>)}</div>
                    </div>
                </div>
            </div>

            {/* 2. Main Content */}
            <div className="flex-1 flex overflow-hidden" ref={containerRef}>

                {/* Left Grid (resizable) */}
                <div className="flex flex-col flex-shrink-0 relative" style={{ width: `${panelWidth}%`, background: 'var(--admin-surface)' }}>
                    <div className="flex items-center px-6 py-3 text-xs font-bold uppercase tracking-wider" style={{ background: 'var(--admin-grid-header)', borderBottom: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>
                        <div className="w-16 text-center">이미지</div><div className="flex-1 pl-4">태그</div><div className="w-20 text-center">타입</div><div className="w-24 text-center">사이즈</div><div className="w-28 text-center">수정일</div>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-2" style={{ color: 'var(--admin-text-sub)' }}><Search size={32} className="opacity-20" /><p className="text-sm">검색 결과가 없습니다.</p></div>
                        ) : (
                            filteredItems.map((item, index) => {
                                const isSelected = selectedId === item.id;
                                return (
                                    <div key={item.id} onClick={() => handleSelect(item.id)} className="flex items-center px-6 py-3 cursor-pointer transition-colors group" style={{ borderBottom: '1px solid var(--admin-border)', background: isSelected ? 'var(--theme-primary-bg)' : 'var(--admin-list-bg)' }} onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--admin-list-hover)'; }} onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--admin-list-bg)'; }}>
                                        <div className="w-16 flex justify-center">
                                            {item.imageUrl ? (
                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 relative">
                                                    <img
                                                        src={item.imageUrl}
                                                        alt="th"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            // blob: 만료 또는 로드 실패 시 플레이스홀더로 교체
                                                            const parent = (e.target as HTMLElement).parentElement;
                                                            if (parent) {
                                                                (e.target as HTMLElement).style.display = 'none';
                                                                const ph = document.createElement('div');
                                                                ph.className = 'w-full h-full flex items-center justify-center bg-gray-100';
                                                                ph.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>`;
                                                                parent.appendChild(ph);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ) : item.hasFileHandle ? (
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center" title={item.imageFileName || '로컬 파일'}>
                                                    <ImageIcon size={16} className="text-blue-400" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <ImageIcon size={16} className="text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 pl-4 pr-4 min-w-0"><div className="flex flex-wrap gap-1.5">{item.tags.length > 0 ? item.tags.slice(0, 3).map((t, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-md font-medium truncate" style={isSelected ? { background: 'var(--theme-primary-bg)', color: 'var(--theme-primary-text)' } : { background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>#{t}</span>) : <span style={{ color: 'var(--admin-border)' }}>-</span>}</div></div>
                                        <div className="w-20 text-center text-xs font-mono uppercase" style={{ color: 'var(--admin-text-sub)' }}>{item.fileType}</div>
                                        <div className="w-24 text-center"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: 'var(--admin-text-sub)', background: 'var(--admin-grid-header)' }}>{item.size}</span></div>
                                        <div className="w-28 text-center text-xs" style={{ color: 'var(--admin-text-sub)' }}>{item.updatedAt}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {/* RESIZE HANDLE (상품개요 동일 스타일) */}
                    <div
                        onMouseDown={handleResizeMouseDown}
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-30 transition-colors"
                        style={{ background: 'transparent', borderRight: '1px solid var(--admin-border)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    />
                </div>

                {/* Right Detail Panel (flex-1) */}
                <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--admin-bg)', borderLeft: '1px solid var(--admin-border)' }}>
                    {selectedItem ? (
                        <div className="flex flex-col h-full overflow-y-auto p-8">
                            {/* Header Actions */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}><Edit3 size={18} style={{ color: 'var(--admin-text-sub)' }} /> 상세 정보 편집</h2>
                                <div className="flex gap-2">
                                    <button onClick={handleAddItem} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-primary)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--theme-primary-bg)'; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}><Plus size={18} /></button>
                                    <button onClick={() => handleDeleteClick(selectedItem.id)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}><Trash2 size={18} /></button>
                                    <div className="w-px h-8 mx-1" style={{ background: 'var(--admin-border)' }} />
                                    <button onClick={handleSave} className="flex items-center gap-1.5 text-white px-4 py-2 rounded-[var(--theme-radius)] text-sm font-bold shadow-md transition-transform active:scale-95" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}><Save size={16} /> 저장</button>
                                </div>
                            </div>

                            {/* Image Preview Area */}
                            <div className="p-4 shadow-sm mb-6" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--theme-radius)' }}>
                                <div className="aspect-video rounded-xl overflow-hidden relative group border-2 border-dashed flex items-center justify-center transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                                    {localImage ? <img src={localImage} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className="flex flex-col items-center gap-3" style={{ color: 'var(--admin-text-sub)' }}><ImageIcon size={48} strokeWidth={1.5} /><span className="text-sm font-medium">이미지 없음</span></div>}

                                    {/* Hover Overlay Buttons */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                        {localImage && (
                                            <button onClick={() => setIsDetailModalOpen(true)} className="px-5 py-2.5 bg-white text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg">
                                                <Scan size={16} /> 설치상세 설정 (AI)
                                            </button>
                                        )}
                                        <button onClick={handlePickImage} className="px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-lg">
                                            <Upload size={16} /> 이미지 선택
                                        </button>
                                    </div>
                                    {/* 폴백용 숨겨진 input (File System Access 미지원 환경) */}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>
                                {/* 로컬 파일명 표시 */}
                                {selectedItem?.imageFileName && (
                                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 truncate">
                                        <span>📁</span>
                                        <span className="truncate font-mono">{selectedItem.imageFileName}</span>
                                        {selectedItem.hasFileHandle && (
                                            <span className="ml-auto flex-shrink-0 text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full border border-green-200">로컬참조</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Tag Input */}
                            <div className="shadow-sm overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--theme-radius)' }}>
                                <div className="p-5" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-grid-header)' }}><h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}><Hash size={14} style={{ color: 'var(--theme-primary)' }} /> 공간 태그 관리</h3></div>
                                <div className="p-6">
                                    <div className="w-full min-h-[52px] border rounded-[var(--theme-radius)] p-2 flex flex-wrap gap-2 transition-all" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)' }} onClick={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--theme-primary)'; document.getElementById('tag-input')?.focus(); }} onBlur={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--admin-border)'; }}>
                                        {editTags.map((tag, idx) => (
                                            <div key={idx} className="flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-lg text-sm font-bold group" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary-text)', border: '1px solid var(--theme-primary-bg)' }}>
                                                <span>{tag}</span><button onClick={(e) => { e.stopPropagation(); setEditTags(prev => prev.filter(t => t !== tag)); }} className="p-0.5 rounded-full transition-colors" style={{ color: 'var(--theme-primary-text)' }}><X size={14} /></button>
                                            </div>
                                        ))}
                                        <input id="tag-input" type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1.5 px-1" style={{ color: 'var(--admin-text)' }} placeholder={editTags.length === 0 ? "태그 입력 (Space)" : ""} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: 'var(--admin-text-sub)' }}>
                            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--admin-grid-header)' }}><ImageIcon size={32} className="opacity-30" /></div>
                            <p className="font-medium text-sm">목록에서 공간 이미지를 선택하세요.</p>
                            <button onClick={handleAddItem} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transition-transform active:scale-95" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}><Plus size={16} /> 새 이미지 추가</button>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Detail Installation Modal (Full Screen) */}
            <AnimatePresence>
                {isDetailModalOpen && localImage && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col"
                        onWheel={handleWheel} // Capture wheel on modal container
                    >
                        {/* Modal Header */}
                        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
                            <div className="pointer-events-auto flex items-center gap-3">
                                <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                                    {isAiDetecting ? <Loader2 className="animate-spin text-blue-400" size={16} /> : <Scan className="text-green-400" size={16} />}
                                    {isAiDetecting ? "AI 창문 분석 중..." : detectionComplete ? "AI 창문 인식 완료" : "공간 설치 상세 설정"}
                                </div>
                                {/* Zoom Controls */}
                                <div className="flex bg-black/50 backdrop-blur-md rounded-lg overflow-hidden border border-white/10">
                                    <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/20 transition-colors"><ZoomOut size={18} /></button>
                                    <span className="px-2 flex items-center text-xs font-mono font-bold text-white border-x border-white/10">{Math.round(transform.scale * 100)}%</span>
                                    <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/20 transition-colors"><ZoomIn size={18} /></button>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="pointer-events-auto p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* AI Scanning Effect Overlay */}
                        <AnimatePresence>
                            {isAiDetecting && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center"
                                >
                                    <div className="w-full h-1 bg-green-400/50 shadow-[0_0_20px_rgba(74,222,128,0.8)] absolute top-0 animate-[scan_1.5s_ease-in-out_infinite]" />
                                    <div className="text-white font-bold text-2xl drop-shadow-lg flex flex-col items-center gap-2">
                                        <Sparkles className="animate-pulse text-yellow-300" size={48} />
                                        Analyzing...
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Main Canvas Viewport */}
                        <div
                            className={`flex-1 relative overflow-hidden flex items-center justify-center bg-neutral-900 ${isPanning ? 'cursor-grabbing' : draggingPointIndex !== null ? 'cursor-none' : 'cursor-grab'}`}
                            onMouseDown={handleMouseDownViewport}
                            onMouseMove={handleMouseMoveGlobal}
                            onMouseUp={handleMouseUpGlobal}
                            onMouseLeave={handleMouseUpGlobal}
                        >
                            {/* Transformed Content Wrapper */}
                            <div
                                ref={imageContainerRef}
                                style={{
                                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                                    transformOrigin: 'center center',
                                    transition: isPanning || draggingPointIndex !== null ? 'none' : 'transform 0.1s ease-out'
                                }}
                                className="relative max-w-none max-h-none inline-block select-none"
                            >
                                <img src={localImage} alt="Full" className="max-w-[80vw] max-h-[80vh] object-contain pointer-events-none select-none shadow-2xl" />

                                {/* SVG Overlay - 커튼/블라인드 타입별 색상 코딩 */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {areas.map((area) => {
                                        const isActive = area.id === activeAreaId;
                                        const color = PRODUCT_COLORS[area.productType || '기타'];
                                        return (
                                            <g key={area.id} onClick={() => setActiveAreaId(area.id)} className="pointer-events-auto cursor-pointer">
                                                <polygon
                                                    points={getPolygonPoints(area.points)}
                                                    fill={isActive ? color.fill : 'rgba(0,0,0,0.08)'}
                                                    stroke={isActive ? color.stroke : 'rgba(255,255,255,0.3)'}
                                                    strokeWidth={isActive ? 2.5 / transform.scale : 1.5 / transform.scale}
                                                    strokeDasharray={`${5 / transform.scale},${3 / transform.scale}`}
                                                    vectorEffect="non-scaling-stroke"
                                                    className="transition-all duration-300 ease-out"
                                                />
                                                {/* 영역 라벨 표시 */}
                                                <text
                                                    x={(area.points[0].x + area.points[1].x) / 2}
                                                    y={area.points[0].y - 1.5}
                                                    textAnchor="middle"
                                                    fontSize={`${3 / transform.scale}`}
                                                    fill={color.stroke}
                                                    fontWeight="bold"
                                                    className="pointer-events-none select-none"
                                                >
                                                    {area.name} ({area.productType})
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>

                                {/* Draggable Points - 타입 색상으로 표시 */}
                                {activeAreaId && (() => {
                                    const activeArea = areas.find(a => a.id === activeAreaId);
                                    if (!activeArea) return null;
                                    const ptColor = PRODUCT_COLORS[activeArea.productType || '기타'].stroke;
                                    return activeArea.points.map((p, idx) => (
                                        <div
                                            key={idx}
                                            onMouseDown={(e) => handleMouseDownPoint(idx, e)}
                                            className="absolute z-50 cursor-move flex items-center justify-center hover:scale-125 transition-transform drag-point"
                                            style={{
                                                left: `${p.x}%`,
                                                top: `${p.y}%`,
                                                width: '22px',
                                                height: '22px',
                                                transform: `translate(-50%, -50%) scale(${1 / transform.scale})`
                                            }}
                                        >
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
                                                <circle cx="12" cy="12" r="10" stroke={ptColor} strokeWidth="2.5" fill="rgba(0,0,0,0.6)" />
                                                <circle cx="12" cy="12" r="4" fill={ptColor} />
                                                <line x1="12" y1="1" x2="12" y2="7" stroke={ptColor} strokeWidth="2" strokeLinecap="round" />
                                                <line x1="12" y1="17" x2="12" y2="23" stroke={ptColor} strokeWidth="2" strokeLinecap="round" />
                                                <line x1="1" y1="12" x2="7" y2="12" stroke={ptColor} strokeWidth="2" strokeLinecap="round" />
                                                <line x1="17" y1="12" x2="23" y2="12" stroke={ptColor} strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Bottom-Left Control Panel */}
                        <div className="absolute bottom-6 left-6 z-50 flex flex-col gap-3 w-[320px]">
                            <div className="bg-black/85 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">

                                {/* Title Bar */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Layers size={14} className="text-blue-400" />
                                        설치 영역
                                        <span className="text-[10px] text-gray-400 font-normal ml-1">({areas.length}개 감지)</span>
                                    </h3>
                                    <div className="flex gap-2">
                                        {/* AI 재감지 */}
                                        <button
                                            onClick={() => { setDetectionComplete(false); detectWindowArea(); }}
                                            disabled={isAiDetecting}
                                            className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 rounded-lg text-emerald-400 transition-colors text-[10px] flex items-center gap-1"
                                            title="AI 재감지"
                                        >
                                            <Sparkles size={12} />
                                        </button>
                                        <button
                                            onClick={handleAddArea}
                                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                                            title="영역 직접 추가"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        <button
                                            onClick={handleApplySettings}
                                            className="px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-opacity flex items-center gap-1"
                                            style={{ background: 'var(--theme-primary)' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'}
                                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
                                        >
                                            <Check size={12} /> 적용
                                        </button>
                                    </div>
                                </div>

                                {/* Areas List */}
                                <div className="max-h-72 overflow-y-auto p-2 space-y-1.5 scrollbar-hide">
                                    {areas.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-xs">
                                            <Sparkles className="mx-auto mb-2 text-gray-600" size={18} />
                                            AI 분석 주인과 기다려주세요...
                                        </div>
                                    ) : (
                                        areas.map((area) => {
                                            const isActive = area.id === activeAreaId;
                                            const color = PRODUCT_COLORS[area.productType || '기타'];
                                            return (
                                                <div
                                                    key={area.id}
                                                    onClick={() => setActiveAreaId(area.id)}
                                                    className={`flex flex-col gap-2 p-2.5 rounded-xl border transition-all cursor-pointer group
                                                        ${isActive ? 'bg-white/8 border-white/20' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                                                >
                                                    {/* 영역 헤더 */}
                                                    <div className="flex items-center gap-2">
                                                        {/* 타입 색상 도트 */}
                                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color.stroke }} />
                                                        {/* 영역명 직접 편집 */}
                                                        <input
                                                            type="text"
                                                            value={area.name}
                                                            onChange={(e) => { e.stopPropagation(); handleUpdateAreaName(area.id, e.target.value); }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={`flex-1 bg-transparent text-xs font-bold outline-none border-b border-transparent focus:border-white/30 transition-colors ${isActive ? color.label : 'text-gray-400'}`}
                                                        />
                                                        {area.aiSuggested && (
                                                            <span className="text-[9px] bg-emerald-600/30 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 flex-shrink-0">
                                                                AI
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDeleteArea(area.id, e)}
                                                            className="p-1 text-gray-600 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>

                                                    {/* 커튼/블라인드 타입 토글 */}
                                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                        {(['커튼', '블라인드', '기타'] as ProductType[]).map(type => (
                                                            <button
                                                                key={type}
                                                                onClick={() => handleUpdateProductType(area.id, type)}
                                                                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all
                                                                    ${area.productType === type
                                                                        ? `${PRODUCT_COLORS[type].badge} text-white`
                                                                        : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                                            >
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* 치수 입력 */}
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="text"
                                                                value={area.width}
                                                                onChange={(e) => handleUpdateAreaDim(area.id, 'width', e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-right outline-none focus:border-blue-500/60"
                                                            />
                                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-500">W(m)</span>
                                                        </div>
                                                        <span className="text-gray-600 text-[10px] flex-shrink-0">×</span>
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="text"
                                                                value={area.height}
                                                                onChange={(e) => handleUpdateAreaDim(area.id, 'height', e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-right outline-none focus:border-blue-500/60"
                                                            />
                                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-500">H(m)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Instructions Toast */}
                        <div className="absolute bottom-8 right-8 bg-black/60 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 text-white max-w-sm pointer-events-none select-none">
                            <h4 className="text-sm font-bold mb-1 flex items-center gap-2 text-yellow-400"><AlertTriangle size={16} /> 사용 방법</h4>
                            <ul className="text-xs text-gray-300 leading-relaxed list-disc list-inside space-y-1">
                                <li><strong>휠 스크롤:</strong> 이미지 확대/축소</li>
                                <li><strong>배경 드래그:</strong> 이미지 이동 (확대 시)</li>
                                <li><strong>포인트 드래그:</strong> 선택된 영역 조절</li>
                            </ul>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="shadow-2xl p-6 w-full max-w-sm relative z-10 text-center" style={{ background: 'var(--admin-modal-bg)', borderRadius: 'var(--theme-radius)', border: '1px solid var(--admin-border)' }}>
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--admin-text)' }}>항목 삭제</h3>
                            <p className="text-sm mb-6" style={{ color: 'var(--admin-text-sub)' }}>정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 font-bold text-sm transition-colors" style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text)', borderRadius: 'var(--theme-radius)' }}>취소</button>
                                <button onClick={executeDelete} className="flex-1 py-3 bg-red-600 text-white font-bold text-sm shadow-lg transition-colors" style={{ borderRadius: 'var(--theme-radius)' }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}>삭제하기</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Tailwind Animation for Scan Effect */}
            <style>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>

        </div>
    );
};

export default SpaceImageManagement;
