
import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, Plus, ClipboardCheck, User,
    Package, ChevronLeft, ChevronRight, Filter, Download,
    CheckCircle2, Box, MapPin, BarChart3, Truck, X, Save, Palette, ScanBarcode, ChevronDown,
    Scissors, Printer, AlertCircle, Zap
} from 'lucide-react';
import { useProductContext } from './ProductContext';
import { usePartnerContext } from '../PartnerContext'; // Partner Context Import
import { motion, AnimatePresence } from 'framer-motion';

import { NodeData } from '../types';
import { useAdminTheme } from './theme/AdminThemeContext';

// --- Types ---
interface StockConfirmationItem {
    id: string;
    stockDate: string;    // 입고일자
    partnerName: string;  // 거래처 (공급사)
    productName: string;  // 상품명
    colorName: string;    // 색상
    width: string;        // 규격 (New)
    quantity: number;     // 입고수량
    unit: string;         // 단위
    lotNo: string;        // LOT 번호 (입고 시 중요)
    warehouse: string;    // 창고위치
    manager: string;      // 담당자
    status: 'COMPLETED';  // 상태
}

// Sub-items for Lot Breakdown
interface LotBreakdownItem {
    id: string;
    lotNo: string;
    quantity: number;
    grade: 'A+' | 'A0' | 'B+' | 'B0';
    warehouse: string; // 창고위치 추가
    note: string;
}

// --- Mock Data ---
// --- Mock Data ---
const MOCK_CONFIRMATIONS: StockConfirmationItem[] = []; // Initial empty

interface StockInConfirmationProps {
    rootId?: string;
}

const StockInConfirmation: React.FC<StockInConfirmationProps> = ({ rootId }) => {
    const { nodes } = useProductContext(); // Access Product Data
    const { partners } = usePartnerContext(); // Access Partner Data
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
    const [stockList, setStockList] = useState<StockConfirmationItem[]>([]);

    // Modal State (Add/Register)
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Detail/Inspection Modal State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StockConfirmationItem | null>(null);

    // Lot Generator State
    const [standardLen, setStandardLen] = useState<number>(50); // Default 50m
    const [lotItems, setLotItems] = useState<LotBreakdownItem[]>([]);

    // Form State for Add Modal
    const [form, setForm] = useState({
        partnerId: '',
        partnerName: '',
        productId: '',
        productName: '',
        colorId: '',
        colorName: '',
        width: '',
        stockDate: new Date().toISOString().split('T')[0],
        quantity: '',
        unit: 'Roll',
        lotNo: '',
        warehouse: ''
    });

    // Search States for Modal
    const [partnerSearchTerm, setPartnerSearchTerm] = useState('');
    const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);

    // SKU Search State
    const [skuSearch, setSkuSearch] = useState('');
    const [isSkuDropdownOpen, setIsSkuDropdownOpen] = useState(false);

    // Date Picker State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [calViewDate, setCalViewDate] = useState(new Date());
    const [tempDate, setTempDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [buttonRect, setButtonRect] = useState<{ top: number; left: number; width: number } | null>(null);


    // --- 1. Available SKUs from System (Replaces product/color logic) ---
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
                } catch (e) { }

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
        if (availableSkus.length > 0 && stockList.length === 0) {
            const newMocks = Array.from({ length: 15 }).map((_, i) => {
                const randomSku = availableSkus[Math.floor(Math.random() * availableSkus.length)];
                return {
                    id: `stock-${Date.now()}-${i}`,
                    stockDate: '2024-05-20',
                    partnerName: i % 3 === 0 ? '(주)대한방직' : i % 3 === 1 ? '성실섬유' : '대구텍스타일',
                    productName: randomSku.productName,
                    colorName: randomSku.colorName,
                    width: randomSku.width,
                    quantity: (i + 1) * 20,
                    unit: randomSku.unit,
                    lotNo: `LOT-240520-${String(i).padStart(3, '0')}`,
                    warehouse: i % 2 === 0 ? 'A-01-02' : 'B-03-11',
                    manager: '이입고',
                    status: 'COMPLETED' as 'COMPLETED'
                };
            });
            setStockList(newMocks);
        }
    }, [availableSkus, stockList.length]);

    const filteredPartnerOptions = useMemo(() => {
        if (!partnerSearchTerm) return partners;
        return partners.filter(p => p.partnerName.toLowerCase().includes(partnerSearchTerm.toLowerCase()));
    }, [partners, partnerSearchTerm]);

    // --- Derived State for Date Display ---
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

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        const totalCount = stockList.length;
        const uniquePartners = new Set(stockList.map(r => r.partnerName)).size;
        const uniqueProducts = new Set(stockList.map(r => r.productName)).size;

        return { totalCount, uniquePartners, uniqueProducts };
    }, [stockList]);

    // --- Filtered List ---
    const filteredList = useMemo(() => {
        if (!searchQuery) return stockList;
        return stockList.filter(item =>
            item.partnerName.includes(searchQuery) ||
            item.productName.includes(searchQuery) ||
            item.lotNo.includes(searchQuery)
        );
    }, [searchQuery, stockList]);

    // Click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.partner-search-container')) {
                setIsPartnerDropdownOpen(false);
            }
            if (!(e.target as HTMLElement).closest('.sku-search-container')) {
                setIsSkuDropdownOpen(false);
            }
            if (!(e.target as HTMLElement).closest('.date-picker-container')) {
                setIsDatePickerOpen(false);
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
    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // --- 입고 자동생성 ---
    const handleAutoGenerate = () => {
        if (!confirm('기존 입고확인 목록을 모두 초기화하고\n상품원가에 설정된 모든 조합으로 입고확인 데이터를 새로 생성합니다.\n\n계속하시겠습니까?')) return;

        const allNodes = Object.values(nodes) as NodeData[];
        const products = allNodes.filter(n => n.attributes?.nodeType === 'product' || n.id.startsWith('prod-'));

        const partnerNames = ['(주)대한방직', '성실섬유', '대구텍스타일', '이화원단', '한국산업'];
        const managers = ['이입고', '박창고', '김검수', '최관리'];
        const warehouses = ['A-01-01', 'A-01-02', 'B-03-11', 'C-02-05'];
        const todayStr = new Date().toISOString().split('T')[0];
        const dateStr = todayStr.replace(/-/g, '').slice(2);
        const newItems: StockConfirmationItem[] = [];

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

                            const idx = newItems.length;
                            newItems.push({
                                id: `stock-auto-${Date.now()}-${idx}`,
                                stockDate: todayStr,
                                partnerName: partnerNames[Math.floor(Math.random() * partnerNames.length)],
                                productName: displayProductName,
                                colorName: colorNode.label,
                                width: widthLabel,
                                quantity,
                                unit,
                                lotNo: `LOT-${dateStr}-${String(idx).padStart(3, '0')}`,
                                warehouse: warehouses[Math.floor(Math.random() * warehouses.length)],
                                manager: managers[Math.floor(Math.random() * managers.length)],
                                status: 'COMPLETED'
                            });
                        });
                    }
                });
            }
        });

        if (newItems.length === 0) {
            alert('생성할 입고확인 조합이 없습니다.\n표준설정 > 상품원가에서 상품원가와 칼라별 규격을 먼저 설정해주세요.');
            return;
        }

        setStockList(newItems);
        alert(`입고 자동생성 완료!\n\n총 ${newItems.length}개 상품/칼라/규격 조합의 입고확인 데이터가 생성되었습니다.`);
    };

    const handleRegisterStock = () => {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2); // YYMMDD
        const randomNum = Math.floor(Math.random() * 900) + 100;
        setForm({
            partnerId: '',
            partnerName: '',
            productId: '',
            productName: '',
            colorId: '',
            colorName: '',
            width: '',
            stockDate: new Date().toISOString().split('T')[0],
            quantity: '',
            unit: 'Roll',
            lotNo: `LOT-${dateStr}-${randomNum}`, // Auto Generate LOT
            warehouse: ''
        });
        setPartnerSearchTerm('');
        setSkuSearch('');
        setIsSkuDropdownOpen(false);
        setIsModalOpen(true);
    };

    const handlePartnerSelect = (partner: any) => {
        setForm(prev => ({ ...prev, partnerId: partner.id, partnerName: partner.partnerName }));
        setPartnerSearchTerm(partner.partnerName);
        setIsPartnerDropdownOpen(false);
    };

    const handleSubmit = () => {
        if (!form.partnerName || !form.productId || !form.width || !form.quantity || !form.warehouse) {
            alert("필수 항목을 모두 입력해주세요.");
            return;
        }

        const newItem: StockConfirmationItem = {
            id: `stock-${Date.now()}`,
            stockDate: form.stockDate,
            partnerName: form.partnerName,
            productName: form.productName,
            colorName: form.colorName,
            width: form.width,
            quantity: parseInt(form.quantity),
            unit: form.unit,
            lotNo: form.lotNo,
            warehouse: form.warehouse,
            manager: '관리자',
            status: 'COMPLETED'
        };

        setStockList(prev => [newItem, ...prev]);
        setIsModalOpen(false);
    };

    // --- Logic: Generate Breakdown Items ---
    const generateBreakdown = (item: StockConfirmationItem, std: number) => {
        const isRollUnit = item.unit === 'Roll';
        let count = 0;

        // Determine number of rows based on unit
        if (isRollUnit) {
            // If Unit is 'Roll', quantity represents the number of rolls
            count = item.quantity;
        } else {
            // If Unit is 'm', calculate number of rolls based on standard length
            count = Math.floor(item.quantity / std);
            const remainder = item.quantity % std;
            if (remainder > 0) count += 1;
        }

        const newItems: LotBreakdownItem[] = [];

        // Generate Rows
        for (let i = 0; i < count; i++) {
            // If using 'm', check if it's the last one (remainder)
            let qty = std;
            if (!isRollUnit && i === count - 1) {
                const rem = item.quantity % std;
                if (rem > 0) qty = rem;
            }

            newItems.push({
                id: `sublot-${Date.now()}-${i}`,
                lotNo: `${item.lotNo}-${i + 1}`, // Auto suffix -1, -2
                quantity: qty,
                grade: 'A+',
                warehouse: item.warehouse, // Default to parent warehouse
                note: ''
            });
        }
        return newItems;
    };

    // --- Inspection Logic (New) ---
    const handleRowDoubleClick = (item: StockConfirmationItem) => {
        setSelectedItem(item);
        setStandardLen(50); // Default Reset

        // AUTO GENERATE ON OPEN
        const autoGeneratedItems = generateBreakdown(item, 50);
        setLotItems(autoGeneratedItems);

        setIsDetailOpen(true);
    };

    const handleGenerateLots = () => {
        if (!selectedItem) return;
        const std = standardLen > 0 ? standardLen : 50;
        const newItems = generateBreakdown(selectedItem, std);
        setLotItems(newItems);
    };

    const handleUpdateLotItem = (id: string, field: keyof LotBreakdownItem, value: any) => {
        setLotItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handlePrintLabel = (lotNo: string) => {
        alert(`[${lotNo}] 라벨을 출력합니다.\n프린터로 전송중...`);
    };

    const handlePrintAllLabels = () => {
        if (lotItems.length === 0) return;
        alert(`${lotItems.length}개의 라벨을 일괄 출력합니다.`);
    }

    const handleSaveInspection = () => {
        alert("검수 및 분할 정보가 저장되었습니다.");
        setIsDetailOpen(false);
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
                        <ClipboardCheck style={{ color: 'var(--theme-primary)' }} /> 입고확인
                    </h1>
                </div>

                {/* Controls: Date & Search */}
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

                    {/* Date Picker UI */}
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
                            placeholder="거래처, 상품, LOT번호 검색..."
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    {/* Add Button Card */}
                    <button onClick={handleRegisterStock} className="text-white rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between items-start group text-left h-32 relative overflow-hidden"
                        style={{ background: 'var(--theme-primary)' }}>
                        <div className="absolute right-[-20px] top-[-20px] bg-white/10 w-24 h-24 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Plus size={24} className="text-white" strokeWidth={3} /></div>
                        <div><span className="text-lg font-bold block">입고등록 +</span><span className="text-xs opacity-80">신규 재고 등록 (LOT)</span></div>
                    </button>

                    {/* Today Stats 1 */}
                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32 border"
                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                        <div className="flex justify-between items-start">
                            <div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><Truck size={20} /></div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>Today</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일 입고건수</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{stats.totalCount}</span>
                                <span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>건</span>
                            </div>
                        </div>
                    </div>

                    {/* Today Stats 2 */}
                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32 border"
                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                        <div className="flex justify-between items-start">
                            <div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><User size={20} /></div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">Today</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일 입고거래처수</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{stats.uniquePartners}</span>
                                <span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>개사</span>
                            </div>
                        </div>
                    </div>

                    {/* Today Stats 3 */}
                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32 border"
                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Package size={20} /></div>
                            <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Today</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일 입고 상품수</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{stats.uniqueProducts}</span>
                                <span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>종</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* 3. List Area */}
            <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
                <div className="rounded-2xl flex-1 flex flex-col shadow-sm overflow-hidden border"
                    style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                    <div className="px-5 py-3 border-b flex justify-between items-center"
                        style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}>
                        <div className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>입고 확정 리스트 (더블클릭하여 상세검수)</div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-1 border px-3 py-1.5 rounded-lg text-xs font-bold"
                                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}><Filter size={14} /> 필터</button>
                            <button className="flex items-center gap-1 border px-3 py-1.5 rounded-lg text-xs font-bold"
                                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}><Download size={14} /> 엑셀 다운로드</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto scrollbar-hide">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="font-bold text-xs uppercase sticky top-0 z-10 shadow-sm"
                                style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                                <tr>
                                    <th className="px-4 py-3 text-center w-12">NO</th>
                                    <th className="px-4 py-3 text-center">입고일자</th>
                                    <th className="px-4 py-3">거래처명</th>
                                    <th className="px-4 py-3">상품명</th>
                                    <th className="px-4 py-3 text-center">색상</th>
                                    <th className="px-4 py-3 text-center">규격</th>
                                    <th className="px-4 py-3 text-center">LOT 번호</th>
                                    <th className="px-4 py-3 text-right">입고수량</th>
                                    <th className="px-4 py-3 text-center">창고위치</th>
                                    <th className="px-4 py-3 text-center">담당자</th>
                                    <th className="px-4 py-3 text-center">상태</th>
                                </tr>
                            </thead>
                            <tbody>
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
                                        <td className="px-4 py-3 text-center font-mono text-xs" style={{ color: 'var(--admin-text-sub)' }}>{item.stockDate}</td>
                                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--admin-text)' }}>{item.partnerName}</td>
                                        <td className="px-4 py-3" style={{ color: 'var(--admin-text)' }}>{item.productName}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)' }}>{item.colorName}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs font-bold" style={{ color: 'var(--admin-text-sub)' }}>{item.width}</td>
                                        <td className="px-4 py-3 text-center font-mono font-bold text-xs rounded-lg" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }}>{item.lotNo}</td>
                                        <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--admin-text)' }}>
                                            {item.quantity.toLocaleString()} <span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-sub)' }}>{item.unit}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs font-mono flex items-center justify-center gap-1" style={{ color: 'var(--admin-text-sub)' }}>
                                            <MapPin size={12} style={{ color: 'var(--admin-text-sub)' }} /> {item.warehouse}
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs" style={{ color: 'var(--admin-text-sub)' }}>{item.manager}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-600 flex items-center justify-center gap-1">
                                                <CheckCircle2 size={10} /> 완료
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredList.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: 'var(--admin-text-sub)' }}>
                                <Box size={48} className="opacity-20" />
                                <p>입고 내역이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- ADD CONFIRMATION MODAL (Original) --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[90vh]" style={{ background: 'var(--admin-modal-bg)' }}>
                            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                                    <Plus size={18} style={{ color: 'var(--theme-primary)' }} /> 입고 확정 등록
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--admin-text-sub)' }}><X size={20} /></button>
                            </div>

                            <div className="p-6 space-y-4 overflow-y-auto">

                                {/* Partner Name Search */}
                                <div className="relative partner-search-container">
                                    <label className="text-xs font-bold block mb-1.5 uppercase" style={{ color: 'var(--admin-text-sub)' }}>거래처명 (공급사)</label>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-primary)' }} />
                                        <input
                                            type="text"
                                            value={partnerSearchTerm}
                                            onChange={e => { setPartnerSearchTerm(e.target.value); setIsPartnerDropdownOpen(true); }}
                                            onFocus={e => { setIsPartnerDropdownOpen(true); e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                            onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                                            className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none transition-colors"
                                            style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                            placeholder="거래처 검색..."
                                        />
                                    </div>
                                    {isPartnerDropdownOpen && filteredPartnerOptions.length > 0 && (
                                        <div className="absolute top-full left-0 w-full mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 border" style={{ background: 'var(--admin-modal-bg)', borderColor: 'var(--theme-primary)' }}>
                                            {filteredPartnerOptions.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handlePartnerSelect(p)}
                                                    className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between border-b last:border-0 transition-colors"
                                                    style={{ borderColor: 'var(--admin-border)' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-primary-bg)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = ''}
                                                >
                                                    <span className="font-bold" style={{ color: 'var(--admin-text)' }}>{p.partnerName}</span>
                                                    <span className="text-xs" style={{ color: 'var(--admin-text-sub)' }}>{p.ceoName}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* SKU Search & Selection */}
                                <div className="relative sku-search-container">
                                    <label className="text-xs font-bold block mb-1.5 uppercase" style={{ color: 'var(--admin-text-sub)' }}>상품 검색 (상품명 / 색상 / 규격)</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--theme-primary)' }} />
                                        <input
                                            type="text"
                                            value={skuSearch}
                                            placeholder="상품명, 색상, 규격으로 검색..."
                                            className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none transition-colors"
                                            style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                            onChange={(e) => { setSkuSearch(e.target.value); setIsSkuDropdownOpen(true); }}
                                            onFocus={e => { setIsSkuDropdownOpen(true); e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                            onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                                        />
                                    </div>
                                    {isSkuDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-1 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 border" style={{ background: 'var(--admin-modal-bg)', borderColor: 'var(--theme-primary)' }}>
                                            {availableSkus.filter(sku => !skuSearch || sku.productName.toLowerCase().includes(skuSearch.toLowerCase()) || sku.colorName.toLowerCase().includes(skuSearch.toLowerCase()) || sku.width.toLowerCase().includes(skuSearch.toLowerCase())).length === 0 ? (
                                                <div className="px-4 py-4 flex flex-col items-center gap-1.5">
                                                    <Search size={18} style={{ color: 'var(--theme-primary)', opacity: 0.4 }} />
                                                    <span className="text-xs" style={{ color: 'var(--admin-text-sub)' }}>검색 결과가 없습니다.</span>
                                                </div>
                                            ) : (
                                                availableSkus.filter(sku => !skuSearch || sku.productName.toLowerCase().includes(skuSearch.toLowerCase()) || sku.colorName.toLowerCase().includes(skuSearch.toLowerCase()) || sku.width.toLowerCase().includes(skuSearch.toLowerCase())).map(sku => (
                                                    <button
                                                        key={sku.id}
                                                        onClick={() => { setForm(prev => ({ ...prev, productId: sku.id, productName: sku.productName, colorName: sku.colorName, width: sku.width })); setSkuSearch(`${sku.productName} - ${sku.colorName} (${sku.width})`); setIsSkuDropdownOpen(false); }}
                                                        className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between border-b last:border-0 transition-colors"
                                                        style={{ borderColor: 'var(--admin-border)' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-primary-bg)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = ''}
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
                                </div>

                                {/* Display Selected Info (Read Only) */}
                                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl border" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>상품명</span>
                                        <div className="text-sm font-bold truncate" style={{ color: 'var(--admin-text)' }}>{form.productName || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>색상</span>
                                        <div className="text-sm font-bold truncate" style={{ color: 'var(--admin-text)' }}>{form.colorName || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>규격</span>
                                        <div className="text-sm font-bold truncate" style={{ color: 'var(--theme-primary)' }}>{form.width || '-'}</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold block mb-1.5 uppercase flex items-center gap-1" style={{ color: 'var(--theme-primary)' }}><ScanBarcode size={12} /> LOT 번호 (자동생성)</label>
                                    <input type="text" value={form.lotNo} onChange={e => setForm({ ...form, lotNo: e.target.value })} className="w-full font-bold rounded-xl px-3 py-2.5 text-sm outline-none border" style={{ background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' }} placeholder="LOT-000000" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative date-picker-container">
                                        <label className="text-xs font-bold block mb-1.5 uppercase" style={{ color: 'var(--admin-text-sub)' }}>입고 일자</label>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setButtonRect({ top: rect.top, left: rect.left, width: rect.width });
                                                const [y, m, d] = form.stockDate.split('-').map(Number);
                                                setCalViewDate(new Date(y, m - 1, d));
                                                setTempDate(form.stockDate);
                                                setIsDatePickerOpen(true);
                                            }}
                                            className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium text-left flex items-center justify-between transition-colors"
                                            style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: form.stockDate ? 'var(--admin-text)' : 'var(--admin-text-sub)' }}
                                        >
                                            <span>{form.stockDate ? (() => { const [y,m,d] = form.stockDate.split('-'); return `${y}년 ${Number(m)}월 ${Number(d)}일`; })() : '날짜 선택'}</span>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--theme-primary)', flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold block mb-1.5 uppercase" style={{ color: 'var(--admin-text-sub)' }}>수량 및 단위</label>
                                        <div className="flex items-center w-full border rounded-xl px-2 py-1.5 transition-all shadow-sm overflow-hidden" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)' }}>
                                            <input
                                                type="number"
                                                value={form.quantity}
                                                onChange={e => setForm({ ...form, quantity: e.target.value })}
                                                className="flex-1 min-w-0 bg-transparent text-sm font-bold outline-none text-right pr-3"
                                                style={{ color: 'var(--admin-text)' }}
                                                placeholder="0"
                                            />
                                            <div className="flex p-1 rounded-lg shrink-0 gap-1" style={{ background: 'var(--admin-bg)' }}>
                                                <button
                                                    onClick={() => setForm({ ...form, unit: 'Roll' })}
                                                    className="px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all"
                                                    style={{ background: form.unit === 'Roll' ? 'var(--admin-surface)' : 'transparent', color: form.unit === 'Roll' ? 'var(--theme-primary)' : 'var(--admin-text-sub)', boxShadow: form.unit === 'Roll' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                                >Roll</button>
                                                <button
                                                    onClick={() => setForm({ ...form, unit: 'm' })}
                                                    className="px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all"
                                                    style={{ background: form.unit === 'm' ? 'var(--admin-surface)' : 'transparent', color: form.unit === 'm' ? 'var(--theme-primary)' : 'var(--admin-text-sub)', boxShadow: form.unit === 'm' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                                >m</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold block mb-1.5 uppercase flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><MapPin size={10} /> 창고 위치</label>
                                    <input type="text" value={form.warehouse} onChange={e => setForm({ ...form, warehouse: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }} placeholder="예: A-01-01" onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'} />
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t flex justify-end gap-3 shrink-0" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border rounded-xl text-sm font-bold transition-colors" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}>취소</button>
                                <button onClick={handleSubmit} className="px-6 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => e.currentTarget.style.opacity='0.85'} onMouseLeave={e => e.currentTarget.style.opacity='1'}><Save size={16} /> 입고 확정</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- DATE PICKER OVERLAY (Fixed, above date button) --- */}
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
                const calHeight = 420;
                const calLeft = Math.min(buttonRect.left, window.innerWidth - calWidth - 8);
                const spaceBelow = window.innerHeight - (buttonRect.top + 40);
                const showAbove = spaceBelow < calHeight;
                const calTop = showAbove
                    ? buttonRect.top - calHeight - 8
                    : buttonRect.top + 40 + 8;
                return (
                    <>
                        {/* 배경 오버레이 - 클릭시 닫기 */}
                        <div className="fixed inset-0 z-[290]" onClick={() => setIsDatePickerOpen(false)} />
                        {/* 캘린더 본체 */}
                        <div
                            className="fixed z-[300] rounded-2xl shadow-2xl"
                            style={{
                                background: 'var(--admin-modal-bg)',
                                border: 'none',
                                borderRadius: '16px',
                                width: `${calWidth}px`,
                                left: `${calLeft}px`,
                                top: `${Math.max(8, calTop)}px`,
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                                <p className="text-xs font-bold mb-1" style={{ color: 'var(--admin-text-sub)' }}>날짜 선택</p>
                                <p className="text-2xl font-extrabold" style={{ color: 'var(--admin-text)' }}>
                                    {tempDate ? (() => { const [y,m,d] = tempDate.split('-'); return `${y}년 ${Number(m)}월 ${Number(d)}일`; })() : '날짜를 선택하세요'}
                                </p>
                            </div>
                            {/* Month Nav */}
                            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                                <span className="font-bold text-sm" style={{ color: 'var(--admin-text)' }}>{year}년 {month+1}월</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={e => { e.stopPropagation(); setCalViewDate(new Date(year, month-1, 1)); }}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ color: 'var(--admin-text-sub)' }}
                                        onMouseEnter={e=>e.currentTarget.style.background='var(--admin-bg)'}
                                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); setCalViewDate(new Date(year, month+1, 1)); }}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ color: 'var(--admin-text-sub)' }}
                                        onMouseEnter={e=>e.currentTarget.style.background='var(--admin-bg)'}
                                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                    </button>
                                </div>
                            </div>
                            {/* Day Headers */}
                            <div className="grid grid-cols-7 px-4 pb-1">
                                {['일','월','화','수','목','금','토'].map((d,i) => (
                                    <div key={d} className="text-center text-xs font-bold py-1" style={{ color: i===0?'#ef4444':i===6?'#3b82f6':'var(--admin-text-sub)' }}>{d}</div>
                                ))}
                            </div>
                            {/* Dates Grid */}
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
                                            onDoubleClick={e => { e.stopPropagation(); setTempDate(ds); setForm(prev=>({...prev, stockDate: ds})); setIsDatePickerOpen(false); }}
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
                            {/* Footer */}
                            <div className="px-5 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                                <button onClick={e => { e.stopPropagation(); const t=new Date(); setTempDate(toStr(t)); setCalViewDate(t); }} className="text-sm font-bold" style={{ color: 'var(--theme-primary)', background: 'transparent', border: 'none', padding: '0', cursor: 'pointer' }}>오늘</button>
                                <div className="flex gap-2">
                                    <button onClick={e => { e.stopPropagation(); setIsDatePickerOpen(false); }} className="px-4 py-2 rounded-xl text-sm font-bold border" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}>취소</button>
                                    <button onClick={e => { e.stopPropagation(); setForm(prev=>({...prev, stockDate: tempDate})); setIsDatePickerOpen(false); }} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--theme-primary)' }}>적용</button>
                                </div>
                            </div>
                        </div>
                    </>
                );
            })()}

            {/* --- DETAIL & INSPECTION MODAL (Double Click) --- */}
            <AnimatePresence>
                {isDetailOpen && selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]" style={{ background: 'var(--admin-modal-bg)' }}>

                            {/* Header */}
                            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                                        <ClipboardCheck style={{ color: 'var(--theme-primary)' }} /> 상세 검수 및 Lot 분할
                                    </h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--admin-text-sub)' }}>입고 상품을 검수하고 개별 Lot로 분할하여 라벨을 출력합니다.</p>
                                </div>
                                <button onClick={() => setIsDetailOpen(false)} className="p-1 rounded-full transition-colors" style={{ color: 'var(--admin-text-sub)' }}><X size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col">

                                {/* 1. Summary Info */}
                                <div className="p-6 border-b grid grid-cols-4 gap-6 shrink-0" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                                    <div><span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>거래처</span><span className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>{selectedItem.partnerName}</span></div>
                                    <div><span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>상품명</span><span className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>{selectedItem.productName}</span></div>
                                    <div><span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>색상</span><span className="text-sm font-bold flex items-center gap-1" style={{ color: 'var(--admin-text)' }}><Palette size={12} style={{ color: 'var(--admin-text-sub)' }} /> {selectedItem.colorName}</span></div>
                                    <div><span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>완료 입고량</span><span className="text-lg font-extrabold" style={{ color: 'var(--theme-primary)' }}>{selectedItem.quantity} <span className="text-xs font-normal" style={{ color: 'var(--admin-text-sub)' }}>{selectedItem.unit}</span></span></div>

                                    <div className="col-span-4 pt-4 mt-2 border-t flex items-end gap-4" style={{ borderColor: 'var(--admin-border)' }}>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>정단량 설정 (표준 롤 길이)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={standardLen}
                                                    onChange={(e) => setStandardLen(parseInt(e.target.value) || 0)}
                                                    className="w-32 border rounded-lg px-3 py-2 text-sm font-bold text-right outline-none transition-colors"
                                                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                                    onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                                                    onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--admin-text-sub)' }}>m</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleGenerateLots}
                                            className="px-4 py-2 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 mb-0.5"
                                            style={{ background: 'var(--theme-primary)' }}
                                            onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                                            onMouseLeave={e => e.currentTarget.style.opacity='1'}
                                        >
                                            <Scissors size={16} /> 리스트 생성 (자동분할)
                                        </button>
                                        <div className="flex-1 text-right text-xs pb-2 flex justify-end items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}>
                                            <AlertCircle size={12} />
                                            <span>총 입고량을 정단량으로 나누어 개별 Lot를 생성합니다.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Generated List */}
                                <div className="flex-1 overflow-y-auto p-0 scrollbar-hide" style={{ background: 'var(--admin-modal-bg)' }}>
                                    {lotItems.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-3" style={{ color: 'var(--admin-text-sub)' }}>
                                            <ScanBarcode size={48} className="opacity-20" />
                                            <p className="text-sm">상단에서 '리스트 생성' 버튼을 눈러주세요.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="font-bold text-xs uppercase sticky top-0 z-10 shadow-sm" style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                                                <tr>
                                                    <th className="px-6 py-3 w-16 text-center">No</th>
                                                    <th className="px-6 py-3">생성된 Lot 번호</th>
                                                    <th className="px-6 py-3 w-32 text-right">수량 (m)</th>
                                                    <th className="px-6 py-3 w-32 text-center">등급</th>
                                                    <th className="px-6 py-3 text-center">창고위치</th>
                                                    <th className="px-6 py-3">비고</th>
                                                    <th className="px-6 py-3 w-24 text-center">라벨</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lotItems.map((lot, idx) => (
                                                    <tr key={lot.id} className="transition-colors" style={{ borderBottom: '1px solid var(--admin-border)' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-primary-bg)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = ''}
                                                    >
                                                        <td className="px-6 py-3 text-center font-medium" style={{ color: 'var(--admin-text-sub)' }}>{idx + 1}</td>
                                                        <td className="px-6 py-3 font-mono font-bold" style={{ color: 'var(--admin-text)' }}>{lot.lotNo}</td>
                                                        <td className="px-6 py-3">
                                                            <input
                                                                type="number"
                                                                value={lot.quantity}
                                                                onChange={(e) => handleUpdateLotItem(lot.id, 'quantity', parseInt(e.target.value) || 0)}
                                                                className="w-full border rounded-lg px-2 py-1.5 text-right font-bold outline-none transition-colors"
                                                                style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--theme-primary)' }}
                                                                onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                                                                onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <select
                                                                value={lot.grade}
                                                                onChange={(e) => handleUpdateLotItem(lot.id, 'grade', e.target.value)}
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
                                                                onChange={(e) => handleUpdateLotItem(lot.id, 'warehouse', e.target.value)}
                                                                className="w-full border rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none transition-colors"
                                                                style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                                                                onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                                                                onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <input
                                                                type="text"
                                                                value={lot.note}
                                                                onChange={(e) => handleUpdateLotItem(lot.id, 'note', e.target.value)}
                                                                className="w-full bg-transparent border-b border-transparent outline-none placeholder-gray-300"
                                                                style={{ color: 'var(--admin-text-sub)' }}
                                                                onFocus={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                                                                onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                                                                placeholder="비고 입력"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <button onClick={() => handlePrintLabel(lot.lotNo)} className="p-1.5 rounded-lg transition-colors" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)' }} title="라벨 출력">
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
                            <div className="px-6 py-4 border-t flex justify-between items-center shrink-0" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                <div className="flex items-center gap-2">
                                    {selectedItem.unit === 'Roll' ? (
                                        <>
                                            <span className="text-xs font-bold" style={{ color: 'var(--admin-text-sub)' }}>생성된 롤 수:</span>
                                            <span className={`text-sm font-bold ${lotItems.length === selectedItem.quantity ? 'text-green-600' : 'text-red-500'}`}>
                                                {lotItems.length} / {selectedItem.quantity} Roll
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xs font-bold" style={{ color: 'var(--admin-text-sub)' }}>완료 분할 수량:</span>
                                            <span className={`text-sm font-bold ${lotItems.reduce((acc, i) => acc + i.quantity, 0) === selectedItem.quantity ? 'text-green-600' : 'text-red-500'}`}>
                                                {lotItems.reduce((acc, i) => acc + i.quantity, 0)} {selectedItem.unit}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handlePrintAllLabels}
                                        disabled={lotItems.length === 0}
                                        className="px-4 py-2.5 border rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}
                                    >
                                        <Printer size={16} /> 전체 라벨 출력
                                    </button>
                                    <button onClick={handleSaveInspection} className="px-6 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => e.currentTarget.style.opacity='0.85'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                                        <Save size={16} /> 검수 완료 저장
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default StockInConfirmation;
