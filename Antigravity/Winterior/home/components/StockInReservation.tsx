
import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, Plus, Calendar, User,
    Package, ChevronLeft, ChevronRight, Filter, Download,
    CheckCircle2, Box, MapPin, Truck, X, Save, Palette, Clock,
    ArrowRight, AlertCircle, Trash2, Edit3, Scissors, Printer, ScanBarcode, Zap
} from 'lucide-react';
import { useProductContext } from './ProductContext';
import { usePartnerContext } from '../PartnerContext';
import { NodeData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminTheme } from './theme/AdminThemeContext';

// --- Types ---
interface ReservationItem {
    id: string;
    expectedDate: string; // 입고 예정일
    partnerName: string;  // 거래처 (공급사)
    productName: string;  // 상품명
    colorName: string;    // 색상
    width: string;        // 규격 (New)
    quantity: number;     // 예정 수량
    actualQuantity?: number; // 실입고량 (Added)
    unit: string;         // 단위
    status: 'PENDING' | 'CONFIRMED' | 'DELAYED'; // 상태
    note: string;
}

interface LotItem {
    id: string;
    lotNo: string;
    quantity: number;
    grade: string;
    warehouse: string;
    note: string;
}

// --- Mock Data ---
const MOCK_RESERVATIONS: ReservationItem[] = []; // Initial empty, will be populated from Context

interface StockInReservationProps {
    rootId?: string;
}

const StockInReservation: React.FC<StockInReservationProps> = ({ rootId }) => {
    const { nodes } = useProductContext();
    const { partners } = usePartnerContext();
    const { theme } = useAdminTheme();

    // rootId 기반 필터: BFS로 childrenIds + sourceIds를 통한 가상 자식까지 모두 순회
    const treeNodeIds = useMemo(() => {
        if (!rootId || !nodes[rootId]) return null;
        const visited = new Set<string>();
        const queue = [rootId];
        while (queue.length > 0) {
            const id = queue.shift()!;
            if (visited.has(id)) continue;
            visited.add(id);
            const node = nodes[id];
            if (!node) continue;
            if (node.childrenIds) {
                node.childrenIds.forEach(childId => queue.push(childId));
            }
            if (node.sourceIds) {
                node.sourceIds.forEach(srcId => {
                    const srcNode = nodes[srcId];
                    if (srcNode) {
                        queue.push(srcId);
                        if (srcNode.childrenIds) {
                            srcNode.childrenIds.forEach(childId => queue.push(childId));
                        }
                    }
                });
            }
        }
        return visited;
    }, [rootId, nodes]);

    const isUnderRoot = (node: NodeData): boolean => {
        if (!treeNodeIds) return true;
        return treeNodeIds.has(node.id);
    };

    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<ReservationItem[]>([]);

    // Registration Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ReservationItem | null>(null);

    // Inspection Modal State
    const [isInspectionOpen, setIsInspectionOpen] = useState(false);
    const [inspectionItem, setInspectionItem] = useState<ReservationItem | null>(null);
    const [actualQty, setActualQty] = useState<number>(0);
    const [stdLength, setStdLength] = useState<number>(50);
    const [targetWarehouse, setTargetWarehouse] = useState<string>('A-01-01');
    const [generatedLots, setGeneratedLots] = useState<LotItem[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        partnerName: '',
        productName: '',
        colorName: '',
        width: '',
        quantity: '',
        unit: 'Roll',
        expectedDate: new Date().toISOString().split('T')[0],
        note: ''
    });

    // SKU Search State
    const [skuSearch, setSkuSearch] = useState('');
    const [isSkuDropdownOpen, setIsSkuDropdownOpen] = useState(false);
    const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

    // Date Picker State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [calViewDate, setCalViewDate] = useState(new Date());
    const [tempDate, setTempDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [buttonRect, setButtonRect] = useState<{ top: number; left: number; width: number } | null>(null);

    // --- Derived State ---
    // --- Derived State ---
    const formattedDateStr = useMemo(() => {
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        return `${y}. ${m}. ${d}`;
    }, [currentDate]);

    const relativeDateStr = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(currentDate);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "오늘";
        return diffDays > 0 ? `오늘 +${diffDays}` : `오늘 ${diffDays}`;
    }, [currentDate]);

    // -- Derived Data: Available SKUs (Matches StockAdjustment Logic) --
    const availableSkus = useMemo(() => {
        const items: { id: string; productName: string; colorName: string; width: string; category: string; unit: string }[] = [];

        Object.values(nodes).forEach((node) => {
            const dataNode = node as NodeData;
            if (dataNode.type !== 'DATA' || !dataNode.attributes) return;
            if (dataNode.attributes.nodeType !== 'product') return;
            if (!isUnderRoot(dataNode)) return;

            const parentNode = nodes[dataNode.parentId || ''];
            const displayProductName = parentNode ? `${parentNode.label} > ${dataNode.label}` : dataNode.label;
            const category = parentNode?.label || '-';

            // Parse Cost Items to find Width Labels (fabric + cutting)
            let costItems: any[] = [];
            try {
                const fabricParsed = JSON.parse(dataNode.attributes.cost_fabric_list || '[]');
                if (Array.isArray(fabricParsed)) costItems.push(...fabricParsed);
            } catch (e) { /* ignore */ }
            try {
                const cuttingParsed = JSON.parse(dataNode.attributes.cost_cutting_list || '[]');
                if (Array.isArray(cuttingParsed)) costItems.push(...cuttingParsed);
            } catch (e) { /* ignore */ }

            dataNode.childrenIds?.forEach(childId => {
                const colorNode = nodes[childId];
                if (!colorNode || colorNode.attributes?.nodeType !== 'color') return;

                let availableWidthIds: string[] = [];
                try {
                    const raw = colorNode.attributes?.availableWidths;
                    if (typeof raw === 'string') {
                        availableWidthIds = JSON.parse(raw);
                    } else if (Array.isArray(raw)) {
                        availableWidthIds = raw.map((r: any) => r.id || r);
                    }
                } catch (e) { /* console.error("Failed to parse availableWidths:", e); */ }

                if (availableWidthIds.length > 0) {
                    availableWidthIds.forEach(widthId => {
                        const costItem = costItems.find(c => c.id === widthId);

                        const widthLabel = costItem
                            ? (costItem.category === 'SLAT' ? `${costItem.width} (${costItem.height || '-'})` : costItem.width)
                            : `Size-${widthId}`;

                        const unit = costItem?.category === 'SLAT' ? 'ea' : 'Roll';

                        items.push({
                            id: `${dataNode.id}-${colorNode.id}-${widthId}`,
                            productName: displayProductName,
                            colorName: colorNode.label,
                            width: widthLabel,
                            category,
                            unit
                        });
                    });
                }
            });
        });
        return items;
    }, [nodes]);

    // -- Effect: Generate Mock Data from Available SKUs --
    useEffect(() => {
        if (availableSkus.length > 0 && items.length === 0) {
            const newMocks = Array.from({ length: 15 }).map((_, i) => {
                const randomSku = availableSkus[Math.floor(Math.random() * availableSkus.length)];
                return {
                    id: `res-${Date.now()}-${i}`,
                    expectedDate: '2024-05-25',
                    partnerName: i % 3 === 0 ? '(주)대한방직' : i % 3 === 1 ? '성실섬유' : '대구텍스타일',
                    productName: randomSku.productName,
                    colorName: randomSku.colorName,
                    width: randomSku.width,
                    quantity: (i + 1) * 20,
                    actualQuantity: i < 5 ? (i + 1) * 20 : undefined,
                    unit: randomSku.unit,
                    status: (i < 5 ? 'CONFIRMED' : 'PENDING') as 'PENDING' | 'CONFIRMED',
                    note: i === 0 ? '오전 도착 예정' : ''
                };
            });
            setItems(newMocks);
        }
    }, [availableSkus, items.length]);

    const filteredList = useMemo(() => {
        if (!searchQuery) return items;
        return items.filter(item =>
            item.partnerName.includes(searchQuery) ||
            item.productName.includes(searchQuery) ||
            item.colorName.includes(searchQuery)
        );
    }, [items, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: items.length,
            pending: items.filter(i => i.status === 'PENDING').length,
            confirmed: items.filter(i => i.status === 'CONFIRMED').length
        };
    }, [items]);

    // Click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.sku-search-container')) {
                setIsSkuDropdownOpen(false);
            }
        };
        if (isModalOpen) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isModalOpen]);

    // --- Handlers ---
    const handlePrevDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 1);
        setCurrentDate(newDate);
    };
    const handleNextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 1);
        setCurrentDate(newDate);
    };
    const handleToday = () => setCurrentDate(new Date());

    // --- 입고 자동생성 ---
    const handleAutoGenerate = () => {
        if (!confirm('기존 입고예약 목록을 모두 초기화하고\n상품원가에 설정된 모든 조합으로 입고예약을 새로 생성합니다.\n\n계속하시겠습니까?')) return;

        const allNodes = Object.values(nodes) as NodeData[];
        const products = allNodes.filter(n => n.attributes?.nodeType === 'product' || n.id.startsWith('prod-'));

        const partnerNames = ['(주)대한방직', '성실섬유', '대구텍스타일', '이화원단', '한국산업'];
        const todayStr = new Date().toISOString().split('T')[0];
        const newItems: ReservationItem[] = [];

        products.forEach(prod => {
            if (!isUnderRoot(prod)) return;

            let costItems: any[] = [];
            const costFabricRaw = prod.attributes?.cost_fabric_list;
            if (costFabricRaw) {
                try {
                    const parsed = JSON.parse(costFabricRaw);
                    if (Array.isArray(parsed) && parsed.length > 0) costItems.push(...parsed);
                } catch (e) { /* ignore */ }
            }
            const costCuttingRaw = prod.attributes?.cost_cutting_list;
            if (costCuttingRaw) {
                try {
                    const parsed = JSON.parse(costCuttingRaw);
                    if (Array.isArray(parsed) && parsed.length > 0) costItems.push(...parsed);
                } catch (e) { /* ignore */ }
            }
            if (costItems.length === 0) return;

            const parentNode = nodes[prod.parentId || ''];
            const displayProductName = parentNode ? `${parentNode.label} > ${prod.label}` : prod.label;

            if (prod.childrenIds && prod.childrenIds.length > 0) {
                prod.childrenIds.forEach(childId => {
                    const colorNode = nodes[childId];
                    if (!colorNode) return;
                    if (colorNode.attributes?.nodeType !== 'color' && !colorNode.attributes?.color) return;

                    let availableWidthIds: string[] = [];
                    if (colorNode.attributes?.availableWidths) {
                        try {
                            const parsed = JSON.parse(colorNode.attributes.availableWidths);
                            if (Array.isArray(parsed) && parsed.length > 0) availableWidthIds = parsed;
                        } catch (e) { /* ignore */ }
                    }

                    if (availableWidthIds.length > 0) {
                        availableWidthIds.forEach(widthId => {
                            const costItem = costItems.find((c: any) => c.id === widthId);
                            if (!costItem) return;

                            const isSlat = costItem.category === 'SLAT';
                            const widthLabel = isSlat
                                ? `${costItem.width} (${costItem.height || '-'})`
                                : costItem.width || '기본';
                            const unit = isSlat ? 'ea' : 'Roll';
                            const quantity = isSlat
                                ? Math.floor(Math.random() * 191) + 10
                                : Math.floor(Math.random() * 10) + 1;

                            // 예정일: 오늘 ~ 오늘+7일 랜덤
                            const futureDate = new Date();
                            futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 8));
                            const expectedDate = futureDate.toISOString().split('T')[0];

                            newItems.push({
                                id: `res-auto-${Date.now()}-${newItems.length}`,
                                expectedDate,
                                partnerName: partnerNames[Math.floor(Math.random() * partnerNames.length)],
                                productName: displayProductName,
                                colorName: colorNode.label,
                                width: widthLabel,
                                quantity,
                                unit,
                                status: 'PENDING',
                                note: '자동생성'
                            });
                        });
                    }
                });
            }
        });

        if (newItems.length === 0) {
            alert('생성할 입고예약 조합이 없습니다.\n표준설정 > 상품원가에서 상품원가와 칼라별 규격을 먼저 설정해주세요.');
            return;
        }

        setItems(newItems);
        alert(`입고 자동생성 완료!\n\n총 ${newItems.length}개 상품/칼라/규격 조합의 입고예약이 생성되었습니다.`);
    };

    // Registration Modal Handlers
    const handleOpenModal = (item?: ReservationItem) => {
        setSkuSearch('');
        setIsSkuDropdownOpen(false);

        if (item) {
            setEditingItem(item);
            setFormData({
                partnerName: item.partnerName,
                productName: item.productName,
                colorName: item.colorName,
                width: item.width, // Load width
                quantity: item.quantity.toString(),
                unit: item.unit,
                expectedDate: item.expectedDate,
                note: item.note
            });
        } else {
            setEditingItem(null);
            setFormData({
                partnerName: '',
                productName: '',
                colorName: '',
                width: '', // Reset width
                quantity: '',
                unit: 'Roll',
                expectedDate: new Date().toISOString().split('T')[0],
                note: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.partnerName || !formData.productName || !formData.quantity) {
            alert('필수 항목을 입력해주세요.');
            return;
        }

        if (editingItem) {
            setItems(prev => prev.map(item => item.id === editingItem.id ? {
                ...item,
                ...formData,
                quantity: parseInt(formData.quantity) || 0
            } : item));
        } else {
            const newItem: ReservationItem = {
                id: `res-${Date.now()}`,
                ...formData,
                quantity: parseInt(formData.quantity) || 0,
                status: 'PENDING'
            };
            setItems(prev => [newItem, ...prev]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('삭제하시겠습니까?')) {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    // Inspection Modal Handlers
    const handleRowDoubleClick = (item: ReservationItem) => {
        setInspectionItem(item);
        setActualQty(item.quantity); // Initialize with expected
        setStdLength(50); // Default
        setTargetWarehouse('A-01-01'); // Default
        setGeneratedLots([]); // Clear previous
        setIsInspectionOpen(true);
    };

    const handleGenerateLots = () => {
        if (!inspectionItem || actualQty <= 0) return;

        const newLots: LotItem[] = [];
        const baseLotNo = `LOT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-`;

        // Determine generation strategy based on Unit
        // If Unit is 'Roll', quantity represents count -> Generate that many items
        // If Unit is 'm', quantity represents length -> Divide by stdLength
        let count = 0;
        let defaultQty = stdLength;

        if (inspectionItem.unit === 'Roll') {
            // Case: Actual Quantity is the COUNT of rolls
            count = actualQty;
        } else {
            // Case: Actual Quantity is TOTAL LENGTH (m)
            count = Math.ceil(actualQty / stdLength);
        }

        for (let i = 0; i < count; i++) {
            let qty = defaultQty;

            // Only adjust last item quantity if unit is 'm' (length-based division)
            if (inspectionItem.unit !== 'Roll' && i === count - 1) {
                const remainder = actualQty % stdLength;
                if (remainder > 0) qty = remainder;
            }

            newLots.push({
                id: `lot-${Date.now()}-${i}`,
                lotNo: `${baseLotNo}${String(i + 1).padStart(3, '0')}`,
                quantity: qty,
                grade: 'A+',
                warehouse: targetWarehouse,
                note: ''
            });
        }
        setGeneratedLots(newLots);
    };

    const handleUpdateLot = (id: string, field: keyof LotItem, value: any) => {
        setGeneratedLots(prev => prev.map(lot => lot.id === id ? { ...lot, [field]: value } : lot));
    };

    const handleConfirmInspection = () => {
        if (!inspectionItem) return;

        setItems(prev => prev.map(item =>
            item.id === inspectionItem.id
                ? { ...item, status: 'CONFIRMED', actualQuantity: actualQty }
                : item
        ));

        alert(`[${inspectionItem.productName}] 입고 검수 및 ${generatedLots.length}개의 Lot 생성이 완료되었습니다.`);
        setIsInspectionOpen(false);
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden relative"
            style={{ background: 'var(--admin-bg)', fontSize: 'var(--theme-font-base)', fontFamily: 'inherit' }}>

            {/* 1. Header Area */}
            <div className="flex-shrink-0 border-b px-8 py-4 shadow-sm z-20 h-20 flex items-center justify-between"
                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>

                {/* Title */}
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                        <Calendar style={{ color: 'var(--theme-primary)' }} /> 입고예약
                    </h1>
                </div>

                {/* Controls */}
                <div className="flex flex-1 md:justify-end gap-3 min-w-0 items-center">
                    {/* 입고자동생성 버튼 */}
                    <button
                        onClick={handleAutoGenerate}
                        className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 h-[40px]"
                        style={{ background: 'var(--theme-primary)' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        <Zap size={16} />
                        입고자동생성
                    </button>
                    {/* Date Picker */}
                    <div className="flex items-center rounded-xl p-1 shadow-sm h-[40px] border"
                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                        <button onClick={handleToday} className="px-3 h-full rounded-lg text-xs font-bold transition-colors flex items-center"
                            style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)' }}>오늘</button>
                        <div className="w-px h-4 mx-2" style={{ background: 'var(--admin-border)' }} />
                        <div className="flex items-center gap-2 px-1">
                            <button onClick={handlePrevDay} className="p-1 rounded-full transition-colors" style={{ color: 'var(--admin-text-sub)' }}><ChevronLeft size={18} strokeWidth={2.5} /></button>
                            <div className="flex items-center justify-center gap-2 min-w-[120px]">
                                <span className="text-base font-extrabold leading-none tracking-tight" style={{ color: 'var(--admin-text)' }}>{formattedDateStr}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)' }}>{relativeDateStr}</span>
                            </div>
                            <button onClick={handleNextDay} className="p-1 rounded-full transition-colors" style={{ color: 'var(--admin-text-sub)' }}><ChevronRight size={18} strokeWidth={2.5} /></button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative w-full max-w-xs h-[40px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--admin-text-sub)' }} />
                        <input
                            type="text"
                            placeholder="거래처, 상품명 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-full pl-9 pr-4 border rounded-xl text-sm font-medium outline-none transition-all"
                            style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                        />
                    </div>
                </div>
            </div>

            {/* 2. Status Cards */}
            <div className="flex-shrink-0 px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => handleOpenModal()} className="text-white rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between items-start group text-left h-32 relative overflow-hidden"
                        style={{ background: 'var(--theme-primary)' }}>
                        <div className="absolute right-[-20px] top-[-20px] bg-white/10 w-24 h-24 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Plus size={24} className="text-white" strokeWidth={3} /></div>
                        <div><span className="text-lg font-bold block">예약등록 +</span><span className="text-xs opacity-80" style={{ color: 'var(--theme-primary-bg)' }}>신규 입고 예약</span></div>
                    </button>

                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32 border"
                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                        <div className="flex justify-between items-start"><div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><Clock size={20} /></div><span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>Pending</span></div>
                        <div><span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>입고 대기</span><div className="flex items-baseline gap-2"><span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{stats.pending}</span><span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>건</span></div></div>
                    </div>

                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32 border"
                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                        <div className="flex justify-between items-start"><div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={20} /></div><span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Confirmed</span></div>
                        <div><span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>입고 확정</span><div className="flex items-baseline gap-2"><span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{stats.confirmed}</span><span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>건</span></div></div>
                    </div>
                </div>
            </div>

            {/* 3. List Area */}
            <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
                <div className="rounded-2xl flex-1 flex flex-col shadow-sm overflow-hidden border"
                    style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                    <div className="px-5 py-3 border-b flex justify-between items-center"
                        style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}>
                        <div className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>입고 예약 리스트 (더블클릭하여 검수 및 분할)</div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-1 border px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}><Filter size={14} /> 필터</button>
                            <button className="flex items-center gap-1 border px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}><Download size={14} /> 엑셀 다운로드</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto scrollbar-hide">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="font-bold text-xs uppercase sticky top-0 z-10 shadow-sm"
                                style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                                <tr>
                                    <th className="px-4 py-3 text-center w-12">NO</th>
                                    <th className="px-4 py-3 text-center">예정일</th>
                                    <th className="px-4 py-3">거래처명</th>
                                    <th className="px-4 py-3">상품명</th>
                                    <th className="px-4 py-3 text-center">색상</th>
                                    <th className="px-4 py-3 text-center">규격</th>
                                    <th className="px-4 py-3 text-right">예정수량 (Roll/EA)</th>
                                    <th className="px-4 py-3 text-right">실입고량</th>
                                    <th className="px-4 py-3 text-center">상태</th>
                                    <th className="px-4 py-3">비고</th>
                                    <th className="px-4 py-3 text-center w-20">관리</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderColor: 'var(--admin-border)' }}>
                                {filteredList.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        onDoubleClick={() => handleRowDoubleClick(item)}
                                        className="transition-colors group cursor-pointer"
                                        style={{ borderBottom: '1px solid var(--admin-border)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-list-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                                    >
                                        <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--admin-text-sub)' }}>{index + 1}</td>
                                        <td className="px-4 py-3 text-center font-mono text-xs" style={{ color: 'var(--admin-text-sub)' }}>{item.expectedDate}</td>
                                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--admin-text)' }}>{item.partnerName}</td>
                                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--admin-text)' }}>{item.productName}</td>
                                        <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)' }}>{item.colorName}</span></td>
                                        <td className="px-4 py-3 text-center" style={{ color: 'var(--admin-text-sub)' }}>{item.width}</td>
                                        <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--admin-text)' }}>{item.quantity.toLocaleString()} <span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-sub)' }}>{item.unit}</span></td>
                                        <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--theme-primary)' }}>
                                            {item.actualQuantity ? (
                                                <>{item.actualQuantity.toLocaleString()} <span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-sub)' }}>{item.unit}</span></>
                                            ) : (
                                                <span style={{ color: 'var(--admin-border)' }}>-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.status === 'CONFIRMED' ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-600 flex items-center justify-center gap-1"><CheckCircle2 size={10} /> 확정됨</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center justify-center gap-1" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><Clock size={10} /> 대기중</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs truncate max-w-[150px]" style={{ color: 'var(--admin-text-sub)' }}>{item.note}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--theme-primary-bg)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-sub)'; e.currentTarget.style.background = ''; }}><Edit3 size={14} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredList.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: 'var(--admin-text-sub)' }}>
                                <Box size={48} className="opacity-20" />
                                <p>예약 내역이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Registration Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
                            style={{ background: 'var(--admin-modal-bg)' }}>
                            <div className="px-6 py-4 border-b flex items-center justify-between"
                                style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                                    <Plus size={18} style={{ color: 'var(--theme-primary)' }} /> {editingItem ? '입고 예약 수정' : '입고 예약 등록'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--admin-text-sub)' }}><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>거래처명</label>
                                    <input type="text" value={formData.partnerName} onChange={e => setFormData({ ...formData, partnerName: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="거래처명 입력"
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                                </div>
                                {/* SKU Search & Selection */}
                                <div className="col-span-2 relative sku-search-container">
                                    <label className="text-xs font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>상품 검색 (상품명 / 색상 / 규격)</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--theme-primary)' }} />
                                        <input
                                            type="text"
                                            value={skuSearch}
                                            placeholder="상품명, 색상, 규격으로 검색..."
                                            className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none transition-colors"
                                            style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                            onChange={(e) => { setSkuSearch(e.target.value); setIsSkuDropdownOpen(true); }}
                                            onFocus={(e) => { setIsSkuDropdownOpen(true); e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                        />
                                    </div>

                                    {/* SKU Suggestions */}
                                    {isSkuDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-1 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 border"
                                            style={{
                                                background: 'var(--admin-modal-bg)',
                                                borderColor: 'var(--theme-primary)',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                            }}
                                        >
                                            {availableSkus.filter(sku =>
                                                !skuSearch ||
                                                sku.productName.toLowerCase().includes(skuSearch.toLowerCase()) ||
                                                sku.colorName.toLowerCase().includes(skuSearch.toLowerCase()) ||
                                                sku.width.toLowerCase().includes(skuSearch.toLowerCase())
                                            ).length === 0 ? (
                                                <div className="px-4 py-4 flex flex-col items-center gap-1.5">
                                                    <Search size={18} style={{ color: 'var(--theme-primary)', opacity: 0.4 }} />
                                                    <span className="text-xs text-center" style={{ color: 'var(--admin-text-sub)' }}>검색 결과가 없습니다.</span>
                                                </div>
                                            ) : (
                                                availableSkus.filter(sku =>
                                                    !skuSearch ||
                                                    sku.productName.toLowerCase().includes(skuSearch.toLowerCase()) ||
                                                    sku.colorName.toLowerCase().includes(skuSearch.toLowerCase()) ||
                                                    sku.width.toLowerCase().includes(skuSearch.toLowerCase())
                                                ).map(sku => (
                                                    <button
                                                        key={sku.id}
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, productName: sku.productName, colorName: sku.colorName, width: sku.width }));
                                                            setSkuSearch(`${sku.productName} - ${sku.colorName} (${sku.width})`);
                                                            setIsSkuDropdownOpen(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between border-b last:border-0 transition-colors"
                                                        style={{ borderColor: 'var(--admin-border)' }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.background = 'var(--theme-primary-bg)';
                                                        }}
                                                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold" style={{ color: 'var(--admin-text)' }}>{sku.productName}</span>
                                                            <span className="text-xs" style={{ color: 'var(--admin-text-sub)' }}>{sku.category}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)' }}>{sku.colorName}</span>
                                                            <span className="font-bold text-xs" style={{ color: 'var(--theme-primary)' }}>{sku.width}</span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                    {/* 외부 클릭 시 닫기 */}
                                    {isSkuDropdownOpen && (
                                        <div className="fixed inset-0 z-40" onClick={() => setIsSkuDropdownOpen(false)} />
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>상품명</label>
                                    <input type="text" value={formData.productName} onChange={e => setFormData({ ...formData, productName: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="상품명 (검색선택)"
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>색상</label>
                                        <input type="text" value={formData.colorName} onChange={e => setFormData({ ...formData, colorName: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="색상"
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>규격 (폭)</label>
                                        <input type="text" value={formData.width} onChange={e => setFormData({ ...formData, width: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="규격"
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>예정 수량</label>
                                        <input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="0"
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>단위</label>
                                        <div className="relative">
                                            {/* 커스텀 드롭다운 트리거 */}
                                            <button
                                                type="button"
                                                onClick={() => setIsUnitDropdownOpen(prev => !prev)}
                                                className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium outline-none flex items-center justify-between transition-colors"
                                                style={{
                                                    background: 'var(--admin-input-bg)',
                                                    borderColor: isUnitDropdownOpen ? 'var(--theme-primary)' : 'var(--admin-border)',
                                                    color: 'var(--admin-text)',
                                                }}
                                            >
                                                <span>{formData.unit}</span>
                                                <svg
                                                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                    className="transition-transform"
                                                    style={{
                                                        color: 'var(--theme-primary)',
                                                        transform: isUnitDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                                    }}
                                                >
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </button>
                                            {/* 드롭다운 옵션 리스트 */}
                                            {isUnitDropdownOpen && (
                                                <div
                                                    className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg z-50 border"
                                                    style={{
                                                        background: 'var(--admin-surface)',
                                                        borderColor: 'var(--theme-primary)',
                                                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                                    }}
                                                >
                                                    {['Roll', 'm'].map(opt => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, unit: opt });
                                                                setIsUnitDropdownOpen(false);
                                                            }}
                                                            className="w-full px-4 py-2.5 text-sm font-medium text-left transition-colors"
                                                            style={{
                                                                background: formData.unit === opt ? 'var(--theme-primary-bg)' : 'transparent',
                                                                color: formData.unit === opt ? 'var(--theme-primary)' : 'var(--admin-text)',
                                                                fontWeight: formData.unit === opt ? 700 : 500,
                                                            }}
                                                            onMouseEnter={e => {
                                                                if (formData.unit !== opt) e.currentTarget.style.background = 'var(--admin-bg)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                if (formData.unit !== opt) e.currentTarget.style.background = 'transparent';
                                                            }}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {/* 외부 클릭 시 닫기 */}
                                            {isUnitDropdownOpen && (
                                                <div className="fixed inset-0 z-40" onClick={() => setIsUnitDropdownOpen(false)} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="date-picker-container-resv">
                                    <label className="text-xs font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>입고 예정일</label>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setButtonRect({ top: rect.top, left: rect.left, width: rect.width });
                                            const [y, m, d] = formData.expectedDate.split('-').map(Number);
                                            setCalViewDate(new Date(y, m - 1, d));
                                            setTempDate(formData.expectedDate);
                                            setIsDatePickerOpen(true);
                                        }}
                                        className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium text-left flex items-center justify-between transition-colors"
                                        style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: formData.expectedDate ? 'var(--admin-text)' : 'var(--admin-text-sub)' }}
                                    >
                                        <span>{formData.expectedDate ? (() => { const [y,m,d] = formData.expectedDate.split('-'); return `${y}년 ${Number(m)}월 ${Number(d)}일`; })() : '날짜 선택'}</span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--theme-primary)', flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    </button>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>비고</label>
                                    <input type="text" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="메모 입력"
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t flex justify-end gap-3"
                                style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border rounded-xl text-sm font-bold transition-colors"
                                    style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}>취소</button>
                                <button onClick={handleSave} className="px-6 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                                    style={{ background: 'var(--theme-primary)' }}><Save size={16} /> 저장</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Inspection & Lot Breakdown Modal */}
            <AnimatePresence>
                {isInspectionOpen && inspectionItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsInspectionOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">

                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <ScanBarcode className="text-blue-600" /> 입고예정 상품 검수 및 Lot 분할입고
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-1">실입고량을 입력하고 자동 분할을 통해 Lot를 생성하세요.</p>
                                </div>
                                <button onClick={() => setIsInspectionOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"><X size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col">

                                {/* 1. Summary Info */}
                                <div className="p-6 bg-gray-50 border-b border-gray-200 grid grid-cols-4 gap-6 shrink-0">
                                    <div><span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">거래처</span><span className="text-sm font-bold text-gray-800">{inspectionItem.partnerName}</span></div>
                                    <div><span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">상품명</span><span className="text-sm font-bold text-gray-800">{inspectionItem.productName}</span></div>
                                    <div><span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">색상</span><span className="text-sm font-bold text-gray-800 flex items-center gap-1"><Palette size={12} className="text-gray-400" /> {inspectionItem.colorName}</span></div>
                                    <div><span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">입고 예정량</span><span className="text-lg font-bold text-gray-500">{inspectionItem.quantity} <span className="text-xs font-normal text-gray-400">{inspectionItem.unit}</span></span></div>

                                    {/* Actual Quantity Input */}
                                    <div className="col-span-1 border-t border-gray-200 pt-4 mt-2">
                                        <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1.5">실입고량 (수정가능)</label>
                                        <div className="relative h-11">
                                            <input
                                                type="number"
                                                value={actualQty}
                                                onChange={(e) => setActualQty(parseInt(e.target.value) || 0)}
                                                className="w-full h-full bg-white border border-blue-300 rounded-lg pl-3 pr-10 text-lg font-bold text-blue-600 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">{inspectionItem.unit}</span>
                                        </div>
                                    </div>

                                    {/* Control Area */}
                                    <div className="col-span-3 pt-4 mt-2 border-t border-gray-200 flex items-end gap-4">
                                        <div className="flex-1 min-w-[150px]">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">정단량 설정 (표준롤길이)</label>
                                            <div className="relative h-11">
                                                <input
                                                    type="number"
                                                    value={stdLength}
                                                    onChange={(e) => setStdLength(parseInt(e.target.value) || 0)}
                                                    className="w-full h-full bg-white border border-gray-300 rounded-lg px-3 text-sm font-bold text-right outline-none focus:border-blue-500"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">m</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">창고위치</label>
                                            <div className="relative h-11">
                                                <input
                                                    type="text"
                                                    value={targetWarehouse}
                                                    onChange={(e) => setTargetWarehouse(e.target.value)}
                                                    className="w-32 h-full bg-white border border-gray-300 rounded-lg px-3 text-sm font-bold text-center outline-none focus:border-blue-500"
                                                />
                                                <MapPin size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleGenerateLots}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 mb-0.5 ml-auto h-11"
                                        >
                                            <Scissors size={16} /> 리스트 생성 (자동분할)
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Generated List */}
                                <div className="flex-1 overflow-y-auto p-0 scrollbar-hide bg-white">
                                    {generatedLots.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                                            <ScanBarcode size={48} className="opacity-20" />
                                            <p className="text-sm">실입고량을 확인하고 '리스트 생성' 버튼을 눌러주세요.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-6 py-3 w-16 text-center">No</th>
                                                    <th className="px-6 py-3">Lot 번호</th>
                                                    <th className="px-6 py-3 w-32 text-right">수량</th>
                                                    <th className="px-6 py-3 w-32 text-center">등급</th>
                                                    <th className="px-6 py-3 text-center">창고위치</th>
                                                    <th className="px-6 py-3">비고</th>
                                                    <th className="px-6 py-3 w-24 text-center">라벨</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {generatedLots.map((lot, idx) => (
                                                    <tr key={lot.id} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="px-6 py-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                                                        <td className="px-6 py-3 font-mono font-bold text-gray-700">{lot.lotNo}</td>
                                                        <td className="px-6 py-3">
                                                            <input
                                                                type="number"
                                                                value={lot.quantity}
                                                                onChange={(e) => handleUpdateLot(lot.id, 'quantity', parseInt(e.target.value) || 0)}
                                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-right font-bold text-blue-600 focus:border-blue-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <select
                                                                value={lot.grade}
                                                                onChange={(e) => handleUpdateLot(lot.id, 'grade', e.target.value)}
                                                                className={`w-full border rounded-lg px-2 py-1.5 text-center font-bold text-xs outline-none cursor-pointer
                                                            ${lot.grade === 'A+' || lot.grade === 'A0' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}
                                                        `}
                                                            >
                                                                <option value="A+">A+</option>
                                                                <option value="A0">A0</option>
                                                                <option value="B+">B+</option>
                                                                <option value="B0">B0</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <input
                                                                type="text"
                                                                value={lot.warehouse}
                                                                onChange={(e) => handleUpdateLot(lot.id, 'warehouse', e.target.value)}
                                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold text-gray-700 focus:border-blue-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <input
                                                                type="text"
                                                                value={lot.note}
                                                                onChange={(e) => handleUpdateLot(lot.id, 'note', e.target.value)}
                                                                className="w-full bg-transparent border-b border-transparent focus:border-gray-300 outline-none text-gray-600 placeholder-gray-300"
                                                                placeholder="비고 입력"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <button className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors" title="라벨 출력">
                                                                <Printer size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500">총 분할 입고수량 :</span>
                                    <span className="text-sm font-bold text-green-600">
                                        {generatedLots.length} Roll {generatedLots.reduce((acc, i) => acc + i.quantity, 0).toLocaleString()}m
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                                        <Printer size={16} /> 전체 라벨 출력
                                    </button>
                                    <button onClick={handleConfirmInspection} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center gap-2">
                                        <Save size={16} /> 검수 완료 저장
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- DATE PICKER OVERLAY (Fixed, above reservation modal) --- */}
            {isDatePickerOpen && buttonRect && (() => {
                const TODAY = new Date(); TODAY.setHours(0,0,0,0);
                const year = calViewDate.getFullYear();
                const month = calViewDate.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const prevMonthDays = new Date(year, month, 0).getDate();
                const cells: { date: Date; isCurrentMonth: boolean }[] = [];
                for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
                for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
                const remaining = 42 - cells.length;
                for (let d = 1; d <= remaining; d++) cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
                const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                const calWidth = 300;
                const calLeft = Math.min(buttonRect.left, window.innerWidth - calWidth - 8);
                const calBottom = window.innerHeight - buttonRect.top + 8;
                return (
                    <>
                        <div className="fixed inset-0 z-[290]" onClick={() => setIsDatePickerOpen(false)} />
                        <div
                            className="fixed z-[300] rounded-2xl shadow-2xl overflow-hidden"
                            style={{ background: 'var(--admin-modal-bg)', border: '1px solid var(--admin-border)', width: `${calWidth}px`, left: `${calLeft}px`, bottom: `${calBottom}px` }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                                <p className="text-xs font-bold mb-1" style={{ color: 'var(--admin-text-sub)' }}>날짜 선택</p>
                                <p className="text-2xl font-extrabold" style={{ color: 'var(--admin-text)' }}>
                                    {tempDate ? (() => { const [y,m,d] = tempDate.split('-'); return `${y}년 ${Number(m)}월 ${Number(d)}일`; })() : '날짜를 선택하세요'}
                                </p>
                            </div>
                            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                                <span className="font-bold text-sm" style={{ color: 'var(--admin-text)' }}>{year}년 {month+1}월</span>
                                <div className="flex items-center gap-1">
                                    <button onClick={e => { e.stopPropagation(); setCalViewDate(new Date(year, month-1, 1)); }} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e=>e.currentTarget.style.background='var(--admin-bg)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
                                    <button onClick={e => { e.stopPropagation(); setCalViewDate(new Date(year, month+1, 1)); }} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e=>e.currentTarget.style.background='var(--admin-bg)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 px-4 pb-1">
                                {['일','월','화','수','목','금','토'].map((d,i) => (
                                    <div key={d} className="text-center text-xs font-bold py-1" style={{ color: i===0?'#ef4444':i===6?'#3b82f6':'var(--admin-text-sub)' }}>{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 px-4 pb-4 gap-x-[10px]">
                                {cells.map((cell, idx) => {
                                    const ds = toStr(cell.date);
                                    const isSelected = ds === tempDate;
                                    const isToday = cell.date.getTime() === TODAY.getTime();
                                    const dow = cell.date.getDay();
                                    let textColor = cell.isCurrentMonth ? 'var(--admin-text)' : 'var(--admin-text-sub)';
                                    if (cell.isCurrentMonth && dow===0) textColor='#ef4444';
                                    if (cell.isCurrentMonth && dow===6) textColor='#3b82f6';
                                    if (isSelected) textColor='#ffffff';
                                    return (
                                        <button key={idx}
                                            onClick={e => { e.stopPropagation(); setTempDate(ds); }}
                                            onDoubleClick={e => { e.stopPropagation(); setTempDate(ds); setFormData(prev=>({...prev, expectedDate: ds})); setIsDatePickerOpen(false); }}
                                            className="flex flex-col items-center justify-center h-[34px] text-sm font-semibold rounded-full transition-all relative"
                                            style={{ background: isSelected ? 'var(--theme-primary)' : 'transparent', color: textColor, opacity: cell.isCurrentMonth?1:0.35 }}
                                            onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background='var(--theme-primary-bg)'; }}
                                            onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background='transparent'; }}
                                        >
                                            {isToday && !isSelected && <span className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'var(--theme-primary)' }}/>}
                                            {cell.date.getDate()}
                                            {isToday && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: 'var(--theme-primary)' }}/>}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="px-5 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                                <button onClick={e => { e.stopPropagation(); const t=new Date(); setTempDate(toStr(t)); setCalViewDate(t); }} className="text-sm font-bold" style={{ color: 'var(--theme-primary)' }}>오늘</button>
                                <div className="flex gap-2">
                                    <button onClick={e => { e.stopPropagation(); setIsDatePickerOpen(false); }} className="px-4 py-2 rounded-xl text-sm font-bold border" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}>취소</button>
                                    <button onClick={e => { e.stopPropagation(); setFormData(prev=>({...prev, expectedDate: tempDate})); setIsDatePickerOpen(false); }} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--theme-primary)' }}>적용</button>
                                </div>
                            </div>
                        </div>
                    </>
                );
            })()}

        </div>
    );
};

export default StockInReservation;
