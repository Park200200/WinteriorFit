
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useProductContext } from './ProductContext';
import { NodeData } from '../types';
import {
    Sparkles, Search, ChevronRight, Box, Link2,
    CheckCircle2, Plus, Image as ImageIcon, X, Trash2, GripVertical,
    Palette, Film, Check, Layers, LayoutTemplate, Loader2, Play, Maximize2,
    Smartphone, Tablet, Monitor, RefreshCw, Maximize, AlertCircle, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_SPACE_IMAGES } from '../constants';
import { generateWithImagen3, isImagen3Configured, type Imagen3Options } from '../utils/imagen3';
import { useAdminTheme } from './theme/AdminThemeContext';

// 공간관리에서 저장한 데이터 로드 (winterior_space_items_v2 우선, 없으면 MOCK)
const SPACE_STORAGE_KEY = 'winterior_space_items_v2';
const loadAllSpaceImages = () => {
    try {
        const saved = localStorage.getItem(SPACE_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch { }
    return [...MOCK_SPACE_IMAGES];
};

// 한국어 공간 태그 → 영어 공간명 매핑
const SPACE_TAG_MAP: Record<string, string> = {
    '거실': 'living room', '침실': 'bedroom', '주방': 'kitchen', '욕실': 'bathroom',
    '서재': 'study room', '사무실': 'office', '카페': 'cafe', '식당': 'dining room',
    '아이방': "children's room", '드레스룸': 'dressing room', '회의실': 'conference room',
    'living': 'living room', 'bedroom': 'bedroom', 'office': 'office',
};
const translateSpaceTags = (tags: string[]): string[] =>
    tags.map(t => SPACE_TAG_MAP[t.trim()] || SPACE_TAG_MAP[t.trim().toLowerCase()] || t).filter(Boolean);

// Pollinations.ai 로 실제 AI 이미지 URL 생성 (API 키 불필요, 무료)
const buildPollinationsUrl = ({
    promptText,
    spaceTags,
    productLabel,
    colorLabel,
    colorHex,
    featureTexts,
    materialTexts,
    guideText,
    spaceImageUrl,
    seed,
}: {
    promptText: string;
    spaceTags: string[];
    productLabel: string;
    colorLabel: string;
    colorHex?: string;
    featureTexts?: string[];
    materialTexts?: string[];
    guideText?: string;
    spaceImageUrl?: string;
    seed?: number;
}): string => {
    const spaceNames = translateSpaceTags(spaceTags).slice(0, 2);
    const spaceCtx = spaceNames.length > 0 ? spaceNames.join(' and ') : 'interior room';

    // 상품명 → 영어 제품 타입 추론
    const productType = productLabel.includes('블라인드') || productLabel.toLowerCase().includes('blind')
        ? 'window blind' : productLabel.includes('커튼') || productLabel.toLowerCase().includes('curtain')
            ? 'curtain' : productLabel.includes('버티컬') ? 'vertical blind'
                : productLabel.includes('우드') || productLabel.toLowerCase().includes('wood') ? 'wood blind'
                    : productLabel.includes('롤') ? 'roller blind' : 'window treatment';

    // 칼라 hex → 색상 설명 (컬러가 이미지에 반영되도록)
    const colorDesc = colorLabel
        ? `${colorLabel} colored`
        : colorHex ? `${colorHex} colored` : '';

    // 특징/재질을 짧게 요약
    const featureSummary = (featureTexts || []).slice(0, 2).map(f => f.substring(0, 40)).join(', ');
    const materialSummary = (materialTexts || []).slice(0, 2).map(m => m.substring(0, 30)).join(', ');

    const parts = [
        // 유저 가이드 최우선
        guideText?.trim() || '',
        // 핵심: 어떤 제품이 어떤 공간에 설치되어 있는지
        `${colorDesc} ${productType} installed on window in ${spaceCtx}`,
        // 이미지/동영상 프롬프트 텍스트
        promptText && promptText !== 'modern curtain interior design' ? promptText : '',
        // 상품 특징/재질
        featureSummary || '',
        materialSummary || '',
        // 품질 관련 키워드
        'photorealistic, professional interior photography, high quality, 4k, window dressing, natural lighting',
    ].filter(Boolean).join(', ');

    const s = seed ?? Math.floor(Math.random() * 9999999);
    const baseUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(parts)}`;
    const params = new URLSearchParams({
        width: '768',
        height: '512',
        nologo: 'true',
        seed: String(s),
        model: 'flux',
    });
    // 공간 이미지가 있으면 참조 이미지로 전달 (pollinations image reference)
    if (spaceImageUrl && !spaceImageUrl.startsWith('data:') && !spaceImageUrl.startsWith('blob:')) {
        params.set('image', spaceImageUrl);
        params.set('strength', '0.45'); // 배경 유지 강도
    }
    return `${baseUrl}?${params.toString()}`;
};


interface GeneratedAsset {
    id: string;
    spaceId: number | string;
    spaceImage: string;          // 콤과 공간 이미지 (fallback)
    generatedImageUrl?: string;  // Pollinations AI 생성 이미지 URL
    styleName: string;
    styleId: string;
    promptText?: string;         // 사용된 프롬프트 전체
    productLabel?: string;
    colorLabel?: string;
    type: 'IMAGE' | 'VIDEO';
    createdAt: string;
}

// AI 이미지 로딩 상태를 처리하는 컴포넌트
const ImageWithLoader: React.FC<{
    primarySrc?: string;
    fallbackSrc?: string;
    type: 'IMAGE' | 'VIDEO';
    className?: string;
    onStatusChange?: (status: 'loading' | 'loaded' | 'error') => void;
}> = ({ primarySrc, fallbackSrc, type, className = '', onStatusChange }) => {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [src, setSrc] = useState(primarySrc || fallbackSrc || '');

    const updateStatus = (s: 'loading' | 'loaded' | 'error') => {
        setStatus(s);
        onStatusChange?.(s);
    };

    // primarySrc 변경 시 초기화
    useEffect(() => {
        const newSrc = primarySrc || fallbackSrc || '';
        setSrc(newSrc);
        updateStatus(newSrc ? 'loading' : 'error');
    }, [primarySrc, fallbackSrc]);

    if (!src || status === 'error') {
        return (
            <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-1 ${className}`}>
                {type === 'VIDEO'
                    ? <Film size={18} className="text-purple-400 opacity-60" />
                    : <ImageIcon size={18} className="text-blue-400 opacity-60" />
                }
                <span className="text-[8px] text-gray-400">AI 생성</span>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full ${className}`}>
            {status === 'loading' && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-10">
                    <Loader2 size={16} className="text-blue-400 animate-spin" />
                </div>
            )}
            <img
                src={src}
                alt="AI generated"
                className="w-full h-full object-cover"
                onLoad={() => updateStatus('loaded')}
                onError={() => {
                    if (src === primarySrc && fallbackSrc && fallbackSrc !== primarySrc) {
                        setSrc(fallbackSrc);
                        updateStatus('loading');
                    } else {
                        updateStatus('error');
                    }
                }}
                style={{ opacity: status === 'loaded' ? 1 : 0 }}
            />
        </div>
    );
};

// 썸네일 아이템 - 이미지 로딩 완료 전까지 클릭 방지
const ThumbnailItem: React.FC<{
    asset: GeneratedAsset;
    isGlobalGenerating: boolean;
    onPreview: (asset: GeneratedAsset) => void;
    onDelete: (colorId: string, assetId: string) => void;
    colorId: string;
}> = ({ asset, isGlobalGenerating, onPreview, onDelete, colorId }) => {
    const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const isLoading = imgStatus === 'loading';
    const isBlocked = isGlobalGenerating || isLoading;

    return (
        <div
            className={`group relative flex-shrink-0 ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ width: '72px' }}
            title={isBlocked ? (isGlobalGenerating ? '생성 완료 후 확인 가능합니다' : '이미지 로딩 중...') : `${asset.type === 'VIDEO' ? '🎬동영상' : '🖼️이미지'} · ${asset.styleName}`}
        >
            <div
                className={`relative rounded-xl overflow-hidden border shadow-sm transition-all duration-200 ${isBlocked ? 'border-gray-200 opacity-70 pointer-events-none' : 'border-gray-200 hover:shadow-lg hover:-translate-y-0.5'}`}
                style={{ width: '72px', height: '72px' }}
                onClick={() => !isBlocked && onPreview(asset)}
            >
                <ImageWithLoader
                    primarySrc={asset.generatedImageUrl}
                    fallbackSrc={asset.spaceImage || undefined}
                    type={asset.type}
                    onStatusChange={setImgStatus}
                />
                {/* 로딩 중 오버레이 */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="bg-white/80 rounded-full p-1">
                            <Loader2 size={14} className="text-blue-500 animate-spin" />
                        </div>
                    </div>
                )}
                {!isBlocked && <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />}
                {/* 타입 아이콘 */}
                <div className={`absolute bottom-1.5 left-1.5 rounded-md p-1 shadow-md ${asset.type === 'VIDEO' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    {asset.type === 'VIDEO' ? <Film size={10} className="text-white" /> : <ImageIcon size={10} className="text-white" />}
                </div>
                {/* 동영상 플레이 */}
                {asset.type === 'VIDEO' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-70">
                        <div className="bg-black/40 rounded-full p-1.5">
                            <Play size={12} className="text-white fill-white" />
                        </div>
                    </div>
                )}
                {/* 확대 호버 / 삭제 (로딩 완료 & 전체 생성 중 아닐 때만) */}
                {!isBlocked && (
                    <>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1">
                                <Maximize2 size={12} className="text-white" />
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(colorId, asset.id); }}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md z-20"
                        >
                            <X size={9} strokeWidth={3} />
                        </button>
                    </>
                )}
            </div>
            <p className="text-[9px] text-gray-400 truncate mt-1 text-center leading-tight">{asset.styleName}</p>
        </div>
    );
};


const AiContentsManagement: React.FC = () => {
    const { nodes, setNodes } = useProductContext();
    const { theme } = useAdminTheme();
    const rootId = 'root';

    // ... (Category Logic & Grid Data Logic remain exactly the same) ...
    // (Assuming standard implementation for brevity - copy from previous file content if needed, but focusing on the header change)
    const isCategoryLike = useCallback((n: NodeData | undefined) => {
        if (!n) return false;
        return n.type === 'CATEGORY' || n.type === 'REFERENCE' || n.attributes?.nodeType === 'category';
    }, []);

    const categories = useMemo(() => {
        const rootNode = nodes[rootId];
        if (!rootNode) return [];

        const realChildren = rootNode.childrenIds.map(id => nodes[id]).filter(Boolean);
        const virtualChildren = (rootNode.sourceIds || []).flatMap(srcId => {
            const src = nodes[srcId];
            return src ? src.childrenIds.map(id => nodes[id]).filter(Boolean) : [];
        });
        return [...realChildren, ...virtualChildren];
    }, [nodes, rootId]);

    const [activeCategoryId, setActiveCategoryId] = useState<string>('');
    const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    useEffect(() => {
        if (!activeCategoryId && categories.length > 0) {
            setActiveCategoryId(categories[0].id);
        } else if (categories.length === 0) {
            setActiveCategoryId('');
        }
    }, [categories, activeCategoryId]);

    const subCategories = useMemo(() => {
        if (!activeCategoryId) return [];
        const node = nodes[activeCategoryId];
        if (!node) return [];
        const realSubs = node.childrenIds.map(id => nodes[id]).filter(isCategoryLike);
        const virtualSubs = (node.sourceIds || []).flatMap(srcId => {
            const src = nodes[srcId];
            return src ? src.childrenIds.map(id => nodes[id]).filter(isCategoryLike) : [];
        });
        return [...realSubs, ...virtualSubs];
    }, [nodes, activeCategoryId, isCategoryLike]);

    useEffect(() => {
        if (activeCategoryId && subCategories.length > 0) {
            setSelectedSubIds(subCategories.map(sub => sub.id));
        } else {
            setSelectedSubIds([]);
        }
    }, [activeCategoryId, subCategories]);

    const gridData = useMemo(() => {
        if (!activeCategoryId) return [];
        const rows: { id: string; path: string; node: NodeData }[] = [];
        const traverse = (nodeId: string, pathStr: string) => {
            const node = nodes[nodeId];
            if (!node) return;
            const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;
            const attributes = node.attributes || {};
            const nodeType = attributes.nodeType;
            let isProductRow = false;
            if (nodeType === 'product') {
                isProductRow = true;
            } else if (nodeType === 'color' || attributes.color || nodeType === 'option') {
                return;
            } else if (node.type === 'CATEGORY' || node.type === 'ROOT' || nodeType === 'category' || nodeType === 'species' || nodeType === 'item' || node.type === 'REFERENCE') {
                // Continue
            } else {
                const children = node.childrenIds.map(id => nodes[id]).filter(Boolean);
                const hasColorChildren = children.some(c => c.attributes?.nodeType === 'color' || c.attributes?.color);
                if (hasColorChildren || children.length === 0) {
                    isProductRow = true;
                }
            }
            if (isProductRow) {
                if (!searchQuery || currentPath.toLowerCase().includes(searchQuery.toLowerCase())) {
                    rows.push({ id: node.id, path: currentPath, node });
                }
                return;
            }
            if (node.childrenIds.length > 0) {
                node.childrenIds.forEach(childId => traverse(childId, currentPath));
            }
            if (node.sourceIds && node.sourceIds.length > 0) {
                node.sourceIds.forEach(srcId => {
                    const src = nodes[srcId];
                    if (src && src.childrenIds) {
                        src.childrenIds.forEach(childId => traverse(childId, currentPath));
                    }
                });
            }
        };
        let targetIds: string[] = [];
        if (subCategories.length > 0) {
            targetIds = selectedSubIds;
        } else {
            targetIds = nodes[activeCategoryId]?.childrenIds || [];
            const activeNode = nodes[activeCategoryId];
            if (activeNode && activeNode.sourceIds) {
                const virtualTargets = activeNode.sourceIds.flatMap(srcId => nodes[srcId]?.childrenIds || []);
                targetIds = [...targetIds, ...virtualTargets];
            }
        }
        targetIds.forEach(childId => traverse(childId, ''));
        return rows;
    }, [nodes, activeCategoryId, selectedSubIds, subCategories, searchQuery]);

    // 공간관리 저장 데이터 (사용자 추가 이미지 포함)
    const [spaceImages, setSpaceImages] = useState<any[]>(() => loadAllSpaceImages());

    // 마운트 시: IndexedDB thumbnails 스토어에서 모든 썸네일 로드 → spaceImages에 적용
    useEffect(() => {
        import('../utils/fileHandleStorage').then(({ loadAllThumbnails }) => {
            loadAllThumbnails().then(thumbnails => {
                const keys = Object.keys(thumbnails);
                if (keys.length === 0) return;
                setSpaceImages(prev => prev.map((img: any) => {
                    const key = String(img.id);
                    // imageUrl 없는 항목만 IndexedDB 썸네일로 보완
                    if (!img.imageUrl && thumbnails[key]) {
                        return { ...img, imageUrl: thumbnails[key] };
                    }
                    return img;
                }));
            });
        });
    }, []); // 마운트시 1회

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imageSearchQuery, setImageSearchQuery] = useState('');
    const [tempSelectedImageId, setTempSelectedImageId] = useState<number | string | null>(null);
    const [installationSpaces, setInstallationSpaces] = useState<any[]>([]);
    const [activeSpaceId, setActiveSpaceId] = useState<string | number | null>(null);
    const [styleCards, setStyleCards] = useState<any[]>([]);
    const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
    const [selectedMediaTypes, setSelectedMediaTypes] = useState<('IMAGE' | 'VIDEO')[]>(['IMAGE']);
    const [generatedContentMap, setGeneratedContentMap] = useState<Record<string, GeneratedAsset[]>>({});
    const [checkedColorIds, setCheckedColorIds] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewAsset, setPreviewAsset] = useState<GeneratedAsset | null>(null);
    const [guideText, setGuideText] = useState<string>(() => {
        try { return localStorage.getItem('ai_guide_text') || ''; } catch { return ''; }
    });
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [guideInput, setGuideInput] = useState('');

    // guideText 변경 시 localStorage 자동 저장
    useEffect(() => {
        try { localStorage.setItem('ai_guide_text', guideText); } catch { }
    }, [guideText]);

    // 예시 키워드 (관리 가능 태그)
    const DEFAULT_EXAMPLES = ['modern minimalist', 'warm cozy lighting', 'scandinavian style',
        'luxury premium', 'natural wood texture', 'clean white space', 'dramatic shadow', 'golden hour sunlight'];
    const [guideExamples, setGuideExamples] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('ai_guide_examples');
            if (saved) { const arr = JSON.parse(saved); if (Array.isArray(arr) && arr.length > 0) return arr; }
        } catch { }
        return DEFAULT_EXAMPLES;
    });
    const [exampleInput, setExampleInput] = useState('');
    const [editingExIdx, setEditingExIdx] = useState<number | null>(null);
    const [editingExVal, setEditingExVal] = useState('');

    const saveExamples = (arr: string[]) => {
        setGuideExamples(arr);
        try { localStorage.setItem('ai_guide_examples', JSON.stringify(arr)); } catch { }
    };
    const addExample = () => {
        const v = exampleInput.trim();
        if (!v || guideExamples.includes(v)) { setExampleInput(''); return; }
        saveExamples([...guideExamples, v]);
        setExampleInput('');
    };
    const removeExample = (idx: number) => saveExamples(guideExamples.filter((_, i) => i !== idx));
    const startEditExample = (idx: number) => { setEditingExIdx(idx); setEditingExVal(guideExamples[idx]); };
    const confirmEditExample = () => {
        if (editingExIdx === null) return;
        const v = editingExVal.trim();
        if (!v) { setEditingExIdx(null); return; }
        const next = [...guideExamples];
        next[editingExIdx] = v;
        saveExamples(next);
        setEditingExIdx(null);
    };

    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

    // New State for Main Tabs
    const [activeMainTab, setActiveMainTab] = useState<'SPACE' | 'IMAGE_PROMPT' | 'VIDEO_PROMPT' | 'COLOR'>('SPACE');
    const [speciesPrompts, setSpeciesPrompts] = useState<{ image: any[], video: any[] }>({ image: [], video: [] });
    const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
    const [activeSpaceIds, setActiveSpaceIds] = useState<number[]>([]);

    // ... (Effects: Load Spaces & Styles - same as before) ...
    useEffect(() => {
        if (selectedNodeId && nodes[selectedNodeId]) {
            const node = nodes[selectedNodeId];
            const attr = node.attributes || {};

            // 1. Load Style Cards (Legacy but kept for compatibility or fallback)
            try {
                if (attr.style_cards) {
                    const cards = JSON.parse(attr.style_cards);
                    setStyleCards(cards);
                    if (cards.length > 0) setSelectedStyleIds([cards[0].id]);
                    else setSelectedStyleIds([]);
                } else { setStyleCards([]); setSelectedStyleIds([]); }
            } catch (e) { setStyleCards([]); setSelectedStyleIds([]); }

            // 2. Load Installation Spaces
            try {
                if (attr.ai_installation_spaces) {
                    const savedSpaces = JSON.parse(attr.ai_installation_spaces);
                    setInstallationSpaces(savedSpaces);
                    if (attr.ai_active_space_id && savedSpaces.some((s: any) => s.id == attr.ai_active_space_id)) {
                        setActiveSpaceIds([attr.ai_active_space_id]);
                    } else if (savedSpaces.length > 0) {
                        setActiveSpaceIds([savedSpaces[0].id]);
                    } else { setActiveSpaceIds([]); }
                } else { setInstallationSpaces([]); setActiveSpaceIds([]); }
            } catch (e) { setInstallationSpaces([]); setActiveSpaceId(null); }

            // 3. Find Parent Species and Load Prompts
            let currentId = selectedNodeId;
            let foundSpeciesId = null;
            const visited = new Set<string>();

            // Simple upward traversal
            while (currentId && !visited.has(currentId)) {
                visited.add(currentId);
                const currentNode = nodes[currentId];
                if (currentNode?.attributes?.nodeType === 'species') {
                    foundSpeciesId = currentId;
                    break;
                }
                // Try to find parent by childrenIds relationship (not direct in this data structure, but nodes are indexed)
                // In this app, paths are often built during traversal. Let's find any node that has this child.
                const parentId = Object.keys(nodes).find(key => nodes[key].childrenIds.includes(currentId));
                if (!parentId) break;
                currentId = parentId;
            }

            if (foundSpeciesId) {
                const sNode = nodes[foundSpeciesId];
                const sAttr = sNode.attributes || {};
                try {
                    const imgP = sAttr.image_prompts ? JSON.parse(sAttr.image_prompts) : [];
                    const vidP = sAttr.video_prompts ? JSON.parse(sAttr.video_prompts) : [];
                    setSpeciesPrompts({ image: imgP, video: vidP });
                } catch (e) { setSpeciesPrompts({ image: [], video: [] }); }
            } else {
                setSpeciesPrompts({ image: [], video: [] });
            }

            setGeneratedContentMap({});
            setCheckedColorIds([]);
            setSelectedPromptIds([]);
            setActiveMainTab('SPACE');
        } else {
            setStyleCards([]); setSelectedStyleIds([]); setInstallationSpaces([]); setActiveSpaceIds([]); setGeneratedContentMap({}); setCheckedColorIds([]); setSpeciesPrompts({ image: [], video: [] });
        }
    }, [selectedNodeId]);

    const productColors = useMemo(() => {
        if (!selectedNodeId) return [];
        const node = nodes[selectedNodeId];
        if (!node) return [];
        return node.childrenIds
            .map(id => nodes[id])
            .filter(n => n && (n.attributes?.nodeType === 'color' || n.attributes?.color))
            .map(n => ({ id: n.id, label: n.label, color: n.attributes?.color || '#000000' }));
    }, [selectedNodeId, nodes]);

    const filteredImages = useMemo(() => {
        if (!imageSearchQuery) return spaceImages;
        return spaceImages.filter(img => img.tags.some((tag: string) => tag.includes(imageSearchQuery)) || img.fileType?.includes(imageSearchQuery));
    }, [imageSearchQuery, spaceImages]);

    // ... (Handlers: updateNodeSpaces, handleAddSpace, etc. - same as before) ...
    const updateNodeSpaces = (nodeId: string, spaces: any[], newActiveId: string | number | null) => {
        setNodes(prev => ({ ...prev, [nodeId]: { ...prev[nodeId], attributes: { ...prev[nodeId].attributes, ai_installation_spaces: JSON.stringify(spaces), ai_active_space_id: String(newActiveId) } } }));
    };
    const handleAddSpace = () => { setImageSearchQuery(''); setTempSelectedImageId(null); setIsImageModalOpen(true); };
    const handleApplyImage = () => {
        if (tempSelectedImageId) {
            const img = spaceImages.find((i: any) => String(i.id) === String(tempSelectedImageId)) as any;
            if (img) {
                const imgId = img.id as string | number;
                // blob: URL은 세션 만료 후 무효 → 저장 제외
                const safeImageUrl = (img.imageUrl && !img.imageUrl.startsWith('blob:'))
                    ? img.imageUrl
                    : undefined;
                const spaceData = { ...img, imageUrl: safeImageUrl };
                if (!installationSpaces.some((s: any) => s.id === imgId)) {
                    const newSpaces = [...installationSpaces, spaceData];
                    setInstallationSpaces(newSpaces);
                    const newActiveIds = Array.from(new Set([...activeSpaceIds, imgId]));
                    setActiveSpaceIds(newActiveIds as number[]);
                    if (selectedNodeId) updateNodeSpaces(selectedNodeId, newSpaces, newActiveIds[0] ?? null);
                } else {
                    const newActiveIds = Array.from(new Set([...activeSpaceIds, imgId]));
                    setActiveSpaceIds(newActiveIds as number[]);
                    if (selectedNodeId) updateNodeSpaces(selectedNodeId, installationSpaces, newActiveIds[0] ?? null);
                }
            }
        }
        setIsImageModalOpen(false);
    };
    const handleRemoveSpace = (id: number | string) => {
        const newSpaces = installationSpaces.filter(s => s.id !== id);
        setInstallationSpaces(newSpaces);
        const newActiveIds = activeSpaceIds.filter(sid => sid !== id);
        setActiveSpaceIds(newActiveIds);
        if (selectedNodeId) updateNodeSpaces(selectedNodeId, newSpaces, newActiveIds);
    };
    const handleSelectSpace = (id: number) => {
        const nextIds = activeSpaceIds.includes(id)
            ? activeSpaceIds.filter(sid => sid !== id)
            : [...activeSpaceIds, id];
        setActiveSpaceIds(nextIds);
        if (selectedNodeId) updateNodeSpaces(selectedNodeId, installationSpaces, nextIds);
    }
    const toggleStyle = (id: string) => { setSelectedStyleIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]); };
    const toggleMediaType = (type: 'IMAGE' | 'VIDEO') => { setSelectedMediaTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]); };
    const toggleColorCheck = (colorId: string) => { setCheckedColorIds(prev => prev.includes(colorId) ? prev.filter(id => id !== colorId) : [...prev, colorId]); };
    const toggleAllColors = () => { if (checkedColorIds.length === productColors.length) { setCheckedColorIds([]); } else { setCheckedColorIds(productColors.map(c => c.id)); } };
    const handleGenerateContent = async () => {
        // 사전 검증
        if (activeSpaceIds.length === 0) {
            setActiveMainTab('SPACE');
            alert('설치 공간을 최소 1개 이상 선택해주세요.');
            return;
        }
        // 칼라 미선택 시 전체 칼라 자동 선택
        const targetColorIds = checkedColorIds.length > 0
            ? checkedColorIds
            : productColors.map(c => c.id);

        if (targetColorIds.length === 0) {
            setActiveMainTab('COLOR');
            alert('목록에 칼라가 없습니다. 먼저 칼라를 등록해주세요.');
            return;
        }

        const selectedImagePrompts = speciesPrompts.image.filter(p => selectedPromptIds.includes(p.id));
        const selectedVideoPrompts = speciesPrompts.video.filter(p => selectedPromptIds.includes(p.id));

        // 이미지/동영상 프롬프트 중 하나도 선택 안 했으면 기본 생성
        const hasImageWork = selectedImagePrompts.length > 0 || selectedVideoPrompts.length === 0;
        const hasVideoWork = selectedVideoPrompts.length > 0;

        setIsGenerating(true);
        // 생성 대상 칼라 ID를 checkedColorIds에도 반영 (isColorGenerating UI 표시용)
        setCheckedColorIds(targetColorIds);

        // React가 로딩 UI를 먼저 렌더링하도록 대기
        await new Promise(resolve => setTimeout(resolve, 100));

        // Imagen 3 API 설정 여부 확인
        // TODO: Imagen3 API 엔드포인트 확인 후 활성화
        // const useImagen3 = isImagen3Configured();
        const useImagen3 = false; // 현재 Pollinations 사용

        // 생성 대기 딜레이
        const totalWork = (selectedImagePrompts.length + selectedVideoPrompts.length || 1) * activeSpaceIds.length;
        await new Promise(resolve => setTimeout(resolve, Math.min(800 + totalWork * 300, 3000)));

        const newMap = { ...generatedContentMap };

        // 프롬프트 빌더 (Pollinations fallback용)
        const buildPromptText = (opts: {
            promptText: string; spaceTags: string[]; productLabel: string;
            colorLabel: string; colorHex: string; featureTexts: string[];
            materialTexts: string[]; spaceImageUrl?: string;
        }) => buildPollinationsUrl({ ...opts, guideText: guideText || undefined, seed: Math.floor(Math.random() * 9999999) });

        // Imagen 3 프롬프트 빌더 (자연어, 한국어/영어 혼용 OK)
        const buildImagen3Prompt = (opts: {
            promptText: string; spaceTags: string[]; productLabel: string;
            colorLabel: string; colorHex: string; featureTexts: string[]; materialTexts: string[];
        }) => {
            const spaceNames = translateSpaceTags(opts.spaceTags).slice(0, 2).join(' and ') || 'interior room';
            const productType = opts.productLabel.includes('블라인드') ? 'window blind'
                : opts.productLabel.includes('커튼') ? 'curtain'
                    : opts.productLabel.includes('롤') ? 'roller blind'
                        : opts.productLabel.includes('버티컬') ? 'vertical blind'
                            : 'window treatment';
            const colorPart = opts.colorLabel ? `${opts.colorLabel} colored` : '';
            const features = opts.featureTexts.slice(0, 2).join(', ');
            const materials = opts.materialTexts.slice(0, 1).join(', ');
            return [
                guideText?.trim() || '',
                `${colorPart} ${productType} professionally installed on window in a ${spaceNames}`,
                opts.promptText && opts.promptText.length > 3 ? opts.promptText : '',
                features, materials,
                'photorealistic, professional interior photography, 4k, natural lighting, high detail',
                'NO people, NO text, NO watermark',
            ].filter(Boolean).join(', ');
        };

        // 비동기 생성 태스크 수집
        const generationTasks: Promise<void>[] = [];

        // 선택된 공간 직접 필터링 (ID 타입 불일치로 인한 skip 방지)
        const selectedSpaces = installationSpaces.length > 0
            ? installationSpaces.filter(s => activeSpaceIds.some(id => String(s.id) === String(id)))
            : [];
        // fallback: activeSpaceIds 매칭 실패해도 전체 spaces 사용
        const spacesToUse = selectedSpaces.length > 0 ? selectedSpaces : installationSpaces;

        for (const colorId of targetColorIds) {
            const existingAssets = newMap[colorId] || [];
            const newAssets: GeneratedAsset[] = [];

            for (const space of spacesToUse) {

                const spaceTags: string[] = space.tags || [];
                const productNode = nodes[selectedNodeId!];
                const productLabel = productNode?.label || '커튼';
                const colorInfo = productColors.find(c => c.id === colorId);
                const colorLabel = colorInfo?.label || '';
                const colorHex = colorInfo?.color || '';

                // 상품 개요/재질 추출
                let summaryNode = productNode;
                const parentId = Object.keys(nodes).find(k => nodes[k].childrenIds.includes(selectedNodeId!));
                if (parentId && nodes[parentId]) summaryNode = nodes[parentId];

                const summaryFeatures: any[] = (() => {
                    try { return summaryNode?.attributes?.summary_features ? JSON.parse(summaryNode.attributes.summary_features) : []; } catch { return []; }
                })();
                const materialEntries: any[] = (() => {
                    try { return summaryNode?.attributes?.material_entries ? JSON.parse(summaryNode.attributes.material_entries) : []; } catch { return []; }
                })();
                const featureTexts = summaryFeatures.map((f: any) => [f.label, f.description].filter(Boolean).join(': ')).filter(Boolean);
                const materialTexts = materialEntries.map((m: any) => m.description || '').filter(Boolean);
                // 공간 이미지 (Imagen 3는 base64도 직접 전달 가능!)
                const spaceImageForImagen = space.imageUrl && !space.imageUrl.startsWith('blob:') ? space.imageUrl : undefined;
                const spaceImageUrl = space.imageUrl && space.imageUrl.startsWith('http') ? space.imageUrl : undefined;

                const commonOpts = { spaceTags, productLabel, colorLabel, colorHex, featureTexts, materialTexts };

                // --- IMAGE 생성 ---
                if (hasImageWork) {
                    const imgPrompts = selectedImagePrompts.length > 0
                        ? selectedImagePrompts
                        : [{ id: 'default-img', text: '' }];

                    for (const [pi, prompt] of imgPrompts.entries()) {
                        const assetId = `gen-img-${colorId}-${space.id}-${prompt.id}-${Date.now()}-${pi}`;
                        const baseAsset: Omit<GeneratedAsset, 'generatedImageUrl'> = {
                            id: assetId,
                            spaceId: space.id,
                            spaceImage: space.imageUrl || '',
                            styleName: prompt.text.length > 18 ? prompt.text.substring(0, 18) + '…' : prompt.text || '기본',
                            styleId: prompt.id,
                            promptText: prompt.text,
                            productLabel,
                            colorLabel,
                            type: 'IMAGE',
                            createdAt: new Date().toISOString(),
                        };

                        if (useImagen3) {
                            // Imagen 3: 실제 API 호출 (비동기)
                            const task = generateWithImagen3({
                                prompt: buildImagen3Prompt({ promptText: prompt.text, ...commonOpts }),
                                referenceImageBase64: spaceImageForImagen,
                                aspectRatio: '16:9',
                            }).then(result => {
                                newAssets.push({ ...baseAsset, generatedImageUrl: result.imageDataUrl });
                            }).catch(err => {
                                console.warn('Imagen 3 오류, Pollinations fallback:', err);
                                // 실패 시 Pollinations fallback
                                const fallbackUrl = buildPromptText({ promptText: prompt.text, ...commonOpts, spaceImageUrl });
                                newAssets.push({ ...baseAsset, generatedImageUrl: fallbackUrl });
                            });
                            generationTasks.push(task);
                        } else {
                            // Pollinations fallback
                            const aiUrl = buildPromptText({ promptText: prompt.text, ...commonOpts, spaceImageUrl });
                            newAssets.push({ ...baseAsset, generatedImageUrl: aiUrl });
                        }
                    }
                }

                // --- VIDEO 생성 ---
                if (hasVideoWork) {
                    for (const [pi, prompt] of selectedVideoPrompts.entries()) {
                        const assetId = `gen-vid-${colorId}-${space.id}-${prompt.id}-${Date.now()}-${pi}`;
                        const baseAsset: Omit<GeneratedAsset, 'generatedImageUrl'> = {
                            id: assetId,
                            spaceId: space.id,
                            spaceImage: space.imageUrl || '',
                            styleName: prompt.text.length > 18 ? prompt.text.substring(0, 18) + '…' : prompt.text || '기본',
                            styleId: prompt.id,
                            promptText: prompt.text,
                            productLabel,
                            colorLabel,
                            type: 'VIDEO',
                            createdAt: new Date().toISOString(),
                        };

                        if (useImagen3) {
                            const task = generateWithImagen3({
                                prompt: buildImagen3Prompt({ promptText: prompt.text, ...commonOpts }),
                                referenceImageBase64: spaceImageForImagen,
                                aspectRatio: '16:9',
                            }).then(result => {
                                newAssets.push({ ...baseAsset, generatedImageUrl: result.imageDataUrl });
                            }).catch(err => {
                                const fallbackUrl = buildPromptText({ promptText: prompt.text, ...commonOpts, spaceImageUrl });
                                newAssets.push({ ...baseAsset, generatedImageUrl: fallbackUrl });
                            });
                            generationTasks.push(task);
                        } else {
                            const aiUrl = buildPromptText({ promptText: prompt.text, ...commonOpts, spaceImageUrl });
                            newAssets.push({ ...baseAsset, generatedImageUrl: aiUrl });
                        }
                    }
                }
            }

            // Imagen 3: 모든 비동기 완료 후 상태 업데이트
            if (useImagen3) {
                await Promise.allSettled(generationTasks);
            }

            newMap[colorId] = [...existingAssets, ...newAssets];
        }

        setGeneratedContentMap(newMap);
        setIsGenerating(false);
        setCheckedColorIds([]);
        setActiveMainTab('COLOR');
    };
    const clearGeneratedContent = (colorId?: string, assetId?: string) => {
        if (assetId && colorId) {
            const newMap = { ...generatedContentMap };
            newMap[colorId] = newMap[colorId].filter(a => a.id !== assetId);
            if (newMap[colorId].length === 0) delete newMap[colorId];
            setGeneratedContentMap(newMap);
        } else if (colorId) {
            const newMap = { ...generatedContentMap };
            delete newMap[colorId];
            setGeneratedContentMap(newMap);
        } else {
            if (confirm("모든 생성된 컨텐츠를 삭제하시겠습니까?")) { setGeneratedContentMap({}); }
        }
    };

    // --- Resizable Layout ---
    const [sidebarWidth, setSidebarWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((mouseMoveEvent: MouseEvent) => { if (isResizing && sidebarRef.current) { const newWidth = mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left; if (newWidth > 300 && newWidth < 800) setSidebarWidth(newWidth); } }, [isResizing]);
    useEffect(() => { if (isResizing) { window.addEventListener("mousemove", resize); window.addEventListener("mouseup", stopResizing); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; } else { document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto'; } return () => { window.removeEventListener("mousemove", resize); window.removeEventListener("mouseup", stopResizing); document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto'; }; }, [isResizing, resize, stopResizing]);

    return (
        <div className="flex-1 w-full flex flex-col h-full overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
            {/* 1. HEADER */}
            <div className="flex-shrink-0 border-b px-8 h-20 shadow-sm z-20 flex items-center justify-between relative gap-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="flex items-center gap-3 relative z-30 min-w-fit pr-4" style={{ background: 'var(--admin-surface)' }}>
                    <h1 className="text-2xl font-bold flex items-center gap-2 whitespace-nowrap" style={{ color: 'var(--admin-text)' }}><Sparkles style={{ color: 'var(--theme-primary)' }} /> Ai컨텐츠 관리</h1>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary-bg)' }}>총 {gridData.length}개</span>
                </div>
                <div className="flex-1 max-w-xl mx-auto"><div className="relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--admin-text-sub)' }} /><input type="text" placeholder="상품명 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-2.5 border rounded-xl text-sm font-medium placeholder:text-gray outline-none transition-all" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} onFocus={e => (e.target.style.borderColor = 'var(--theme-primary)')} onBlur={e => (e.target.style.borderColor = 'var(--admin-border)')} /></div></div>
                <div className="flex items-center gap-4 justify-end min-w-0">
                    <div className="flex p-1.5 rounded-xl shadow-inner border flex-shrink-0" style={{ background: 'var(--admin-grid-header)', borderColor: 'var(--admin-border)' }}>
                        {categories.map((cat) => (
                            <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setSelectedNodeId(null); }}
                                className="relative px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap z-10 flex items-center gap-1"
                                style={activeCategoryId === cat.id
                                    ? { background: 'var(--admin-surface)', color: 'var(--theme-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                                    : { color: 'var(--admin-text-sub)', background: 'transparent' }}
                            >
                                {cat.sourceIds && cat.sourceIds.length > 0 && <Link2 size={12} className="opacity-50" />}
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. MAIN SPLIT VIEW */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* LEFT: Product List (상품개요 스타일) */}
                <div ref={sidebarRef} style={{ width: sidebarWidth, background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }} className="flex flex-col z-10 flex-shrink-0 relative">
                    <div className="px-4 py-3 border-b flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ background: 'var(--admin-grid-header)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}>
                        상품 경로 (Product Path)
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {gridData.length === 0 ? (
                            <div className="p-8 text-center text-sm flex flex-col items-center gap-2" style={{ color: 'var(--admin-text-sub)' }}><Box size={32} className="opacity-20" /><p>표시할 상품이 없습니다.</p></div>
                        ) : (
                            gridData.map((row) => {
                                const isSelected = selectedNodeId === row.id;
                                return (
                                    <button
                                        key={row.id}
                                        onClick={() => setSelectedNodeId(row.id)}
                                        className="w-full text-left px-4 py-3 border-b transition-colors relative"
                                        style={isSelected
                                            ? { background: 'var(--theme-primary-bg)', borderLeft: '4px solid var(--theme-primary)', borderBottomColor: 'var(--admin-border)' }
                                            : { borderLeft: '4px solid transparent', borderBottomColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium truncate pr-2"
                                                style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)', fontWeight: isSelected ? '700' : '500' }}>
                                                {row.path}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {/* RESIZE HANDLE (상품개요 동일 스타일) */}
                    <div
                        onMouseDown={startResizing}
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-30 transition-colors"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    />
                </div>

                {/* RIGHT: AI Content Detail */}
                <div className="flex-1 flex flex-col h-full overflow-hidden min-w-[500px]" style={{ background: 'var(--admin-bg)' }}>
                    {selectedNodeId ? (
                        <div className="flex flex-col h-full overflow-y-auto scrollbar-hide p-8">

                            {/* Detail Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--admin-text)' }}>Ai컨텐츠 상세설정</h2>
                                    <span className="px-2 py-0.5 text-xs font-bold rounded-md" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>{nodes[selectedNodeId]?.label}</span>
                                </div>
                            </div>

                            {/* Main Tabs and Generate Button */}
                            <div className="flex items-center justify-between mb-8 p-2 rounded-2xl shadow-sm border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                <div className="flex p-1 rounded-xl" style={{ background: 'var(--admin-grid-header)' }}>
                                    <button onClick={() => setActiveMainTab('SPACE')} className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                        style={activeMainTab === 'SPACE' ? { background: 'var(--admin-surface)', color: 'var(--theme-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : { color: 'var(--admin-text-sub)', background: 'transparent' }}>
                                        <Layers size={16} /> 공간
                                        {installationSpaces.length > 0 && (
                                            <span className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-1" style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                                                {installationSpaces.length}
                                            </span>
                                        )}
                                        {activeSpaceIds.length > 0 && activeSpaceIds.length < installationSpaces.length && (
                                            <span className="text-[9px]" style={{ color: 'var(--theme-primary)' }}>({activeSpaceIds.length}선택)</span>
                                        )}
                                    </button>
                                    <button onClick={() => setActiveMainTab('IMAGE_PROMPT')} className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                        style={activeMainTab === 'IMAGE_PROMPT' ? { background: 'var(--admin-surface)', color: 'var(--theme-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : { color: 'var(--admin-text-sub)', background: 'transparent' }}>
                                        <ImageIcon size={16} /> 생성이미지
                                        {speciesPrompts.image.filter(p => selectedPromptIds.includes(p.id)).length > 0 && <span className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-1" style={{ background: 'var(--theme-primary)', color: '#fff' }}>{speciesPrompts.image.filter(p => selectedPromptIds.includes(p.id)).length}</span>}
                                    </button>
                                    <button onClick={() => setActiveMainTab('VIDEO_PROMPT')} className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                        style={activeMainTab === 'VIDEO_PROMPT' ? { background: 'var(--admin-surface)', color: 'var(--theme-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : { color: 'var(--admin-text-sub)', background: 'transparent' }}>
                                        <Film size={16} /> 생성동영상
                                        {speciesPrompts.video.filter(p => selectedPromptIds.includes(p.id)).length > 0 && <span className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-1" style={{ background: 'var(--theme-primary)', color: '#fff' }}>{speciesPrompts.video.filter(p => selectedPromptIds.includes(p.id)).length}</span>}
                                    </button>
                                    <button onClick={() => setActiveMainTab('COLOR')} className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                        style={activeMainTab === 'COLOR' ? { background: 'var(--admin-surface)', color: 'var(--theme-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : { color: 'var(--admin-text-sub)', background: 'transparent' }}>
                                        <Palette size={16} /> 칼라
                                        {checkedColorIds.length > 0 && <span className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-1" style={{ background: 'var(--theme-primary)', color: '#fff' }}>{checkedColorIds.length}</span>}
                                    </button>
                                </div>
                                {/* AI 가이드 버튼 + 컨텐츠 생성 버튼 묶음 */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setGuideInput(guideText); setIsGuideModalOpen(true); }}
                                        title="AI 가이드 설정"
                                        className="relative p-2.5 rounded-xl border-2 transition-all"
                                        style={guideText.trim()
                                            ? { borderColor: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }
                                            : { borderColor: 'var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text-sub)' }}
                                    >
                                        <Sparkles size={18} />
                                        {guideText.trim() && (
                                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: 'var(--theme-primary)' }} />
                                        )}
                                    </button>
                                    <button
                                        onClick={handleGenerateContent}
                                        disabled={isGenerating}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95"
                                        style={isGenerating ? { background: 'var(--admin-border)', cursor: 'not-allowed' } : { background: 'var(--theme-primary)' }}
                                        onMouseEnter={e => { if (!isGenerating) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                                    >
                                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                        {isGenerating ? '생성 중...' : '컨텐츠 생성'}
                                        {!isGenerating && activeSpaceIds.length > 0 && checkedColorIds.length > 0 && (
                                            <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                                                {activeSpaceIds.length}공간 × {checkedColorIds.length}칼라
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 space-y-8 pb-32">
                                <AnimatePresence mode="wait">
                                    {activeMainTab === 'SPACE' && (
                                        <motion.div
                                            key="space-tab"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="rounded-2xl p-8 shadow-sm border"
                                            style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>설치 공간 선택</h3>
                                                    <p className="text-xs mt-1" style={{ color: 'var(--admin-text-sub)' }}>Ai 컨텐츠가 합성될 배경 공간을 선택하세요.</p>
                                                </div>
                                                <button onClick={handleAddSpace} className="flex items-center gap-1.5 text-white px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 font-bold text-sm" style={{ background: 'var(--theme-primary)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                                                    <Plus size={16} /> 공간 추가
                                                </button>
                                            </div>

                                            {installationSpaces.length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                                    {installationSpaces.map((space) => {
                                                        const isActive = activeSpaceIds.includes(space.id);
                                                        return (
                                                            <div
                                                                key={space.id}
                                                                onClick={() => handleSelectSpace(space.id)}
                                                                className="relative group cursor-pointer transition-all rounded-2xl p-1.5"
                                                                style={isActive ? { background: 'var(--theme-primary-bg)', boxShadow: '0 0 0 2px var(--theme-primary)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' } : { background: 'transparent' }}
                                                                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--admin-grid-header)'; }}
                                                                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                                                            >
                                                                <div className="aspect-[4/3] rounded-xl overflow-hidden border relative" style={{ background: 'var(--admin-grid-header)', borderColor: 'var(--admin-border)' }}>
                                                                    {space.imageUrl && !space.imageUrl.startsWith('blob:') ? (
                                                                        <img
                                                                            src={space.imageUrl}
                                                                            alt="space"
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                                const p = (e.target as HTMLElement).parentElement;
                                                                                if (p && !p.querySelector('.img-ph')) {
                                                                                    const d = document.createElement('div');
                                                                                    d.className = 'img-ph w-full h-full flex items-center justify-center text-gray-300';
                                                                                    d.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>';
                                                                                    p.appendChild(d);
                                                                                }
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                                                                            <ImageIcon size={28} strokeWidth={1.5} />
                                                                            <span className="text-[9px] font-medium text-gray-400">
                                                                                {(space as any).imageFileName || '이미지 없음'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveSpace(space.id); }}
                                                                        className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                    {isActive && (
                                                                        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}>
                                                                            <div className="text-white rounded-full p-2 shadow-xl ring-4 ring-white" style={{ background: 'var(--theme-primary)' }}>
                                                                                <Check size={20} strokeWidth={4} />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="mt-3 px-1">
                                                                    <p className="text-xs font-bold truncate" style={{ color: isActive ? 'var(--theme-primary)' : 'var(--admin-text)' }}>공간 #{space.id}</p>
                                                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-sub)' }}>{space.tags?.slice(0, 2).join(', ')}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-4" style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)', opacity: 0.5 }}>
                                                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--admin-grid-header)' }}>
                                                        <Layers size={32} className="opacity-20" />
                                                    </div>
                                                    <p className="text-sm font-medium">등록된 설치 공간이 없습니다.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {(activeMainTab === 'IMAGE_PROMPT' || activeMainTab === 'VIDEO_PROMPT') && (
                                        <motion.div
                                            key="prompt-tab"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="rounded-2xl p-8 shadow-sm border"
                                            style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
                                        >
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>
                                                    {activeMainTab === 'IMAGE_PROMPT' ? '이미지 생성 프롬프트 선택' : '동영상 생성 프롬프트 선택'}
                                                </h3>
                                                <p className="text-xs mt-1" style={{ color: 'var(--admin-text-sub)' }}>기본관리 {'>'} 상품개요에서 설정한 프롬프트 목록입니다.</p>
                                            </div>

                                            <div className="space-y-4">
                                                {(activeMainTab === 'IMAGE_PROMPT' ? speciesPrompts.image : speciesPrompts.video).length > 0 ? (
                                                    (activeMainTab === 'IMAGE_PROMPT' ? speciesPrompts.image : speciesPrompts.video).map((prompt, idx) => (
                                                        <div
                                                            key={prompt.id}
                                                            onClick={() => setSelectedPromptIds(prev => prev.includes(prompt.id) ? prev.filter(pid => pid !== prompt.id) : [...prev, prompt.id])}
                                                            className="p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4"
                                                            style={selectedPromptIds.includes(prompt.id)
                                                                ? { borderColor: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
                                                                : { borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}
                                                        >
                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                                                                style={selectedPromptIds.includes(prompt.id) ? { background: 'var(--theme-primary)', color: '#fff' } : { background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--admin-text)' }}>{prompt.text}</p>
                                                            </div>
                                                            {selectedPromptIds.includes(prompt.id) && <CheckCircle2 size={20} style={{ color: 'var(--theme-primary)' }} />}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-4" style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)', opacity: 0.5 }}>
                                                        <Sparkles size={32} className="opacity-20" />
                                                        <p className="text-sm font-medium">등록된 프롬프트가 없습니다. 상품개요에서 먼저 설정해주세요.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeMainTab === 'COLOR' && (
                                        <motion.div
                                            key="color-tab"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="rounded-2xl p-8 shadow-sm border"
                                            style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>칼라 선택 (복수 선택 가능)</h3>
                                                    <p className="text-xs mt-1" style={{ color: 'var(--admin-text-sub)' }}>컨텐츠를 생성할 상품의 칼라를 선택하세요.</p>
                                                </div>
                                                <button onClick={toggleAllColors} className="text-xs font-bold hover:underline" style={{ color: 'var(--theme-primary)' }}>
                                                    {checkedColorIds.length === productColors.length ? '전체 해제' : '전체 선택'}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {productColors.map((color) => {
                                                    const isChecked = checkedColorIds.includes(color.id);
                                                    return (
                                                        <div
                                                            key={color.id}
                                                            onClick={() => toggleColorCheck(color.id)}
                                                            className="p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3"
                                                            style={isChecked
                                                                ? { borderColor: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }
                                                                : { borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}
                                                        >
                                                            <div className="w-5 h-5 rounded border flex items-center justify-center transition-colors"
                                                                style={isChecked ? { background: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : { background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)' }}>
                                                                {isChecked && <Check size={14} className="text-white" strokeWidth={4} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold truncate" style={{ color: 'var(--admin-text)' }}>{color.label}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {productColors.length === 0 && (
                                                    <div className="col-span-full py-12 text-center text-gray-400 italic text-sm">등록된 칼라가 없습니다.</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Bottom Generated Result Section */}
                                <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                    <div className="px-8 py-5 border-b flex justify-between items-center" style={{ background: 'var(--admin-grid-header)', borderColor: 'var(--admin-border)' }}>
                                        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                                            <Sparkles size={18} style={{ color: 'var(--theme-primary)' }} /> 칼라별 생성컨텐츠
                                        </h3>
                                    </div>

                                    <div className="divide-y divide-gray-100">
                                        {productColors.length === 0 && (
                                            <div className="py-24 flex flex-col items-center justify-center text-gray-300 gap-4">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <Palette size={40} className="opacity-10" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-gray-400">등록된 칼라가 없습니다.</p>
                                                    <p className="text-xs text-gray-300 mt-1">먼저 칼라를 등록해주세요.</p>
                                                </div>
                                            </div>
                                        )}

                                        {productColors.map((color) => {
                                            const assets = generatedContentMap[color.id] || [];
                                            const imageAssets = assets.filter(a => a.type === 'IMAGE');
                                            const videoAssets = assets.filter(a => a.type === 'VIDEO');
                                            const isColorGenerating = isGenerating && checkedColorIds.includes(color.id);
                                            return (
                                                <div key={color.id} className="p-6 flex items-start gap-6 hover:bg-gray-50/30 transition-colors">
                                                    {/* Color Info Column */}
                                                    <div className="w-36 flex-shrink-0 flex flex-col gap-2">
                                                        <p className="text-sm font-black text-gray-800 truncate">{color.label}</p>
                                                        {assets.length > 0 && (
                                                            <div className="flex flex-col gap-1">
                                                                {videoAssets.length > 0 && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Film size={11} className="text-purple-500" />
                                                                        <span className="text-[10px] font-bold text-purple-600">동영상 {videoAssets.length}개</span>
                                                                    </div>
                                                                )}
                                                                {imageAssets.length > 0 && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <ImageIcon size={11} className="text-blue-500" />
                                                                        <span className="text-[10px] font-bold text-blue-600">이미지 {imageAssets.length}개</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {isColorGenerating && (
                                                            <div className="flex items-center gap-1 text-[10px] text-blue-500">
                                                                <Loader2 size={10} className="animate-spin" /> 생성 중...
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Content Grid */}
                                                    <div className="flex-1">
                                                        {isColorGenerating ? (
                                                            <div className="h-[72px] flex items-center gap-3">
                                                                {[0, 1, 2].map(i => (
                                                                    <div key={i} className="w-[72px] h-[72px] rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                                                                ))}
                                                            </div>
                                                        ) : assets.length > 0 ? (
                                                            <div className="flex flex-wrap gap-3">
                                                                {assets.map((asset) => (
                                                                    <ThumbnailItem
                                                                        key={asset.id}
                                                                        asset={asset}
                                                                        isGlobalGenerating={isGenerating}
                                                                        onPreview={setPreviewAsset}
                                                                        onDelete={clearGeneratedContent}
                                                                        colorId={color.id}
                                                                    />
                                                                ))}
                                                                {/* 신규 생성 중 플레이스홀더 (기존 + 신규 동시 표시) */}
                                                                {isColorGenerating && [0, 1].map(i => (
                                                                    <div key={`new-${i}`} className="flex-shrink-0" style={{ width: '72px' }}>
                                                                        <div className="rounded-xl overflow-hidden border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 animate-pulse flex items-center justify-center" style={{ width: '72px', height: '72px' }}>
                                                                            <Loader2 size={18} className="text-blue-400 animate-spin" />
                                                                        </div>
                                                                        <p className="text-[9px] text-blue-400 truncate mt-1 text-center">생성 중...</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="h-[72px] flex items-center text-gray-200 text-xs italic gap-2">
                                                                <LayoutTemplate size={14} className="opacity-30" />
                                                                생성된 컨텐츠 없음
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {productColors.length > 0 && Object.keys(generatedContentMap).length === 0 && (
                                            <div className="py-16 flex flex-col items-center justify-center text-gray-300 gap-3">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <Sparkles size={32} className="opacity-10" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-gray-400">아직 생성된 컨텐츠가 없습니다.</p>
                                                    <p className="text-xs text-gray-300 mt-1">위의 탭에서 조건을 선택하고 생성해 보세요.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                            <CheckCircle2 size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">좌측 목록에서 상품을 선택해주세요.</p>
                        </div>
                    )}
                </div>
            </div>
            {/* AI 가이드 입력 모달 */}
            <AnimatePresence>
                {isGuideModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIsGuideModalOpen(false)}
                        />
                        <motion.div initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 16 }}
                            className="rounded-3xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
                            style={{ background: 'var(--admin-surface)' }}
                        >
                            {/* Header */}
                            <div className="px-8 pt-7 pb-5 flex-shrink-0" style={{ background: 'var(--theme-primary)' }}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                                                <Sparkles size={18} className="text-white" />
                                            </div>
                                            <h3 className="text-xl font-black text-white">AI 생성 가이드</h3>
                                        </div>
                                        <p className="text-xs mt-1" style={{ opacity: 0.75, color: '#fff' }}>이 가이드는 모든 프롬프트 생성 시 우선 적용됩니다.</p>
                                    </div>
                                    <button onClick={() => setIsGuideModalOpen(false)}
                                        className="text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors mt-1">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Body - 스크롤 가능 */}
                            <div className="px-8 py-6 overflow-y-auto flex-1 scrollbar-hide" style={{ background: 'var(--admin-surface)' }}>
                                {/* 가이드 텍스트 입력 (2배 이상 크게) */}
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--admin-text)' }}>가이드 텍스트</label>
                                <textarea
                                    value={guideInput}
                                    onChange={(e) => setGuideInput(e.target.value)}
                                    placeholder={"예: modern minimalist style, warm lighting, cozy atmosphere\n쉼표로 구분하여 여러 키워드를 자유롭게 입력하세요."}
                                    className="w-full h-72 px-4 py-3.5 border-2 rounded-2xl text-sm placeholder:text-gray-300 outline-none transition-all resize-none leading-relaxed"
                                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                    onFocus={e => (e.target.style.borderColor = 'var(--theme-primary)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--admin-border)')}
                                    autoFocus
                                />
                                <p className="text-[11px] mt-2 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}>
                                    <span style={{ color: 'var(--theme-primary)' }}>✦</span>
                                    영어 키워드를 사용하면 AI가 더 정확하게 인식합니다.
                                </p>

                                {/* 예시 키워드 태그 관리 */}
                                <div className="mt-5">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <p className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>예시 키워드 <span className="font-normal" style={{ color: 'var(--admin-text-sub)' }}>(클릭: 추가 · 더블클릭: 수정 · ✕: 삭제)</span></p>
                                        <button
                                            onClick={() => saveExamples(DEFAULT_EXAMPLES)}
                                            className="text-[10px] font-medium transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--theme-primary)')}
                                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--admin-text-sub)')}
                                        >입력 예시 초기화</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {guideExamples.map((ex, idx) => (
                                            editingExIdx === idx ? (
                                                <div key={idx} className="flex items-center gap-1">
                                                    <input
                                                        autoFocus
                                                        value={editingExVal}
                                                        onChange={(e) => setEditingExVal(e.target.value)}
                                                        onBlur={confirmEditExample}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') confirmEditExample();
                                                            if (e.key === 'Escape') setEditingExIdx(null);
                                                        }}
                                                        className="px-2 py-1 text-xs border-2 border-purple-400 rounded-full outline-none bg-white text-purple-700 w-36"
                                                    />
                                                </div>
                                            ) : (
                                                <div key={idx} className="flex items-center gap-0.5 px-3 py-1.5 rounded-full border group cursor-pointer transition-all"
                                                    style={{ background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)', opacity: 0.8 }}
                                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}>
                                                    <span
                                                        className="text-xs font-medium"
                                                        style={{ color: 'var(--theme-primary)' }}
                                                        onClick={() => setGuideInput(prev => prev.trim() ? `${prev.trim()}, ${ex}` : ex)}
                                                        onDoubleClick={() => startEditExample(idx)}
                                                        title="클릭: 입력창에 추가  더블클릭: 수정"
                                                    >
                                                        + {ex}
                                                    </span>
                                                    <button
                                                        onClick={() => removeExample(idx)}
                                                        className="ml-1 opacity-0 group-hover:opacity-100 transition-all hover:text-red-400"
                                                        style={{ color: 'var(--theme-primary)' }}
                                                        title="삭제"
                                                    >
                                                        <X size={11} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    {/* 새 키워드 추가 인풋 */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={exampleInput}
                                            onChange={(e) => setExampleInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') addExample(); }}
                                            placeholder="새 키워드 입력 후 Enter 또는 추가"
                                            className="flex-1 px-3 py-2 text-xs border-2 rounded-xl outline-none transition-all placeholder:text-gray-300"
                                            style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                            onFocus={e => (e.target.style.borderColor = 'var(--theme-primary)')}
                                            onBlur={e => (e.target.style.borderColor = 'var(--admin-border)')}
                                        />
                                        <button
                                            onClick={addExample}
                                            className="px-3 py-2 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                                            style={{ background: 'var(--theme-primary)' }}
                                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                        >
                                            <Plus size={12} /> 추가
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 pb-7 pt-4 border-t flex gap-3 flex-shrink-0" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                                <button onClick={() => setGuideInput('')}
                                    className="flex-1 py-3 rounded-2xl font-bold text-sm transition-colors"
                                    style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                                    비우기
                                </button>
                                <button
                                    onClick={() => { setGuideText(guideInput.trim()); setIsGuideModalOpen(false); }}
                                    className="flex-[2] py-3 text-white rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    style={{ background: 'var(--theme-primary)' }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                >
                                    <Sparkles size={16} />
                                    가이드 적용하기
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Just ensuring the Preview Modal renders */}
            <AnimatePresence>
                {isImageModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsImageModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden relative z-10">
                            {/* ... Modal content ... */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white"><h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><ImageIcon className="text-blue-600" size={20} /> 공간 이미지 선택</h3><button onClick={() => setIsImageModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={20} /></button></div>
                            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                                <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" placeholder="이미지 태그 또는 타입 검색..." value={imageSearchQuery} onChange={(e) => setImageSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 border rounded-xl text-sm font-medium outline-none transition-all" autoFocus />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                                    {filteredImages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                                            <Search size={32} className="opacity-20" />
                                            <p className="text-sm">검색 결과가 없습니다.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {filteredImages.map((img) => {
                                                const isSelected = tempSelectedImageId === img.id;
                                                const isAlreadyAdded = installationSpaces.some(s => s.id === img.id);
                                                // blob: URL은 만료됐으므로 undefined로 처리
                                                const validImageUrl = img.imageUrl?.startsWith('blob:') ? undefined : img.imageUrl;
                                                const hasLocalFile = (img as any).hasFileHandle;
                                                return (
                                                    <div
                                                        key={img.id}
                                                        onClick={() => !isAlreadyAdded && setTempSelectedImageId(img.id)}
                                                        onDoubleClick={() => !isAlreadyAdded && handleApplyImage()}
                                                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'} ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                    >
                                                        {validImageUrl ? (
                                                            <img src={validImageUrl} alt="preview" className="w-full h-full object-cover"
                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${hasLocalFile ? 'bg-blue-50' : 'bg-gray-100'}`}>
                                                                {hasLocalFile ? (
                                                                    <>
                                                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                                                            <ImageIcon size={20} className="text-blue-500" />
                                                                        </div>
                                                                        <p className="text-[9px] text-blue-500 font-bold text-center px-1 leading-tight">
                                                                            {(img as any).imageFileName || '로컬 파일'}
                                                                        </p>
                                                                        <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">로컬</span>
                                                                    </>
                                                                ) : (
                                                                    <ImageIcon size={24} className="text-gray-300" />
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className={`absolute inset-0 bg-black/10 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                            {isSelected && <CheckCircle2 size={32} className="text-blue-500 drop-shadow-md bg-white rounded-full" />}
                                                            {isAlreadyAdded && <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">이미 추가됨</span>}
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-[10px] p-1.5 truncate backdrop-blur-sm">
                                                            {img.tags.join(', ')}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3"><button onClick={() => setIsImageModalOpen(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors">취소</button><button onClick={handleApplyImage} disabled={!tempSelectedImageId} className={`px-6 py-2.5 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${tempSelectedImageId ? 'bg-blue-600 hover:bg-blue-700 active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}><CheckCircle2 size={16} /> 추가하기</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {previewAsset && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setPreviewAsset(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center pointer-events-none">
                            {(() => {
                                const previewSrc = previewAsset.generatedImageUrl || previewAsset.spaceImage;
                                // 로딩/에러 상태를 관리하는 컴포넌트
                                const PreviewImg = () => {
                                    const [imgStatus, setImgStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');
                                    return previewAsset.type === 'VIDEO' ? (
                                        <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
                                            {imgStatus === 'loading' && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                                                    <Loader2 size={48} className="text-white/50 animate-spin" />
                                                    <p className="text-white/40 text-sm">AI 이미지 생성 중...</p>
                                                </div>
                                            )}
                                            {imgStatus === 'error' && (
                                                <div className="flex flex-col items-center justify-center gap-4 pointer-events-auto">
                                                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                                                        <Film size={40} className="text-white/40" />
                                                    </div>
                                                    <p className="text-white/50 text-sm">이미지를 불러올 수 없습니다.</p>
                                                    <p className="text-white/30 text-xs">AI 생성 서버가 느릴 수 있습니다. 잠시 후 다시 시도해주세요.</p>
                                                    {previewSrc && (
                                                        <a href={previewSrc} target="_blank" rel="noreferrer"
                                                            className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 text-xs rounded-xl transition-colors">
                                                            새 탭에서 열기 ↗
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {previewSrc && (
                                                <img src={previewSrc} alt="Full Preview"
                                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                                    style={{ opacity: imgStatus === 'loaded' ? 1 : 0, transition: 'opacity 0.3s' }}
                                                    onLoad={() => setImgStatus('loaded')}
                                                    onError={() => setImgStatus('error')}
                                                />
                                            )}
                                            {imgStatus !== 'error' && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                                    style={{ opacity: imgStatus === 'loaded' ? 1 : 0, transition: 'opacity 0.3s' }}>
                                                    <div className="bg-black/50 rounded-full p-4 backdrop-blur-md">
                                                        <Play size={48} className="text-white fill-white ml-2" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative flex items-center justify-center w-full h-full pointer-events-auto">
                                            {imgStatus === 'loading' && (
                                                <div className="absolute flex flex-col items-center justify-center gap-4">
                                                    <Loader2 size={48} className="text-white/50 animate-spin" />
                                                    <p className="text-white/40 text-sm">AI 이미지 생성 중...</p>
                                                </div>
                                            )}
                                            {imgStatus === 'error' && (
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                                                        <ImageIcon size={40} className="text-white/40" />
                                                    </div>
                                                    <p className="text-white/50 text-sm">이미지를 불러올 수 없습니다.</p>
                                                    <p className="text-white/30 text-xs">AI 생성 서버가 느릴 수 있습니다. 잠시 후 다시 시도해주세요.</p>
                                                    {previewSrc && (
                                                        <a href={previewSrc} target="_blank" rel="noreferrer"
                                                            className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 text-xs rounded-xl transition-colors">
                                                            새 탭에서 열기 ↗
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {previewSrc && (
                                                <img src={previewSrc} alt="Full Preview"
                                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                                    style={{ opacity: imgStatus === 'loaded' ? 1 : 0, transition: 'opacity 0.3s' }}
                                                    onLoad={() => setImgStatus('loaded')}
                                                    onError={() => setImgStatus('error')}
                                                />
                                            )}
                                        </div>
                                    );
                                };
                                return <PreviewImg />;
                            })()}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-4 pointer-events-auto max-w-2xl">
                                {previewAsset.productLabel && (
                                    <>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-gray-400">상품</span>
                                            <span className="font-bold text-sm">{previewAsset.productLabel}</span>
                                        </div>
                                        <div className="w-px h-8 bg-white/20" />
                                    </>
                                )}
                                {previewAsset.colorLabel && (
                                    <>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-gray-400">칼라</span>
                                            <span className="font-bold text-sm">{previewAsset.colorLabel}</span>
                                        </div>
                                        <div className="w-px h-8 bg-white/20" />
                                    </>
                                )}
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-[10px] text-gray-400">프롬프트</span>
                                    <span className="font-medium text-xs truncate">{previewAsset.promptText || previewAsset.styleName}</span>
                                </div>
                                <div className="w-px h-8 bg-white/20" />
                                <div className="flex flex-col items-center flex-shrink-0">
                                    <span className="text-[10px] text-gray-400">타입</span>
                                    <span className="font-bold text-sm">{previewAsset.type === 'VIDEO' ? '🎬 동영상' : '🖼️ 이미지'}</span>
                                </div>
                            </div>
                            <button onClick={() => setPreviewAsset(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full pointer-events-auto transition-colors"><X size={24} /></button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AiContentsManagement;
