
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Search, Sliders, Calendar, ChevronLeft, ChevronRight,
    MapPin, Package, ArrowUpRight, ArrowDownRight, Activity,
    Filter, Download, Edit3, History, List, FileText, X, Plus, Trash2, Save,
    CheckCircle2, AlertTriangle, Scale, ArrowRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProductContext } from './ProductContext';
import { NodeData } from '../types';
import { useAdminTheme } from './theme/AdminThemeContext';

// --- Types ---
interface StockItem {
    id: string;
    productName: string;
    colorName: string;
    width: string; // New field
    warehouse: string;
    rollCount: number;
    totalLength: number; // meters
    category?: 'SLAT' | 'ROLL'; // New field for display logic
}

interface AdjustmentLog {
    id: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    productId: string;
    productName?: string; // Denormalized for display
    colorName?: string;
    type: 'INCREASE' | 'DECREASE' | 'CORRECTION'; // 증가, 감소, 정정
    amount: number; // meters
    reason: string;
    worker: string;
}

// Internal Type for Modal
interface AdjustmentLot {
    id: string;
    lotNo: string;
    spec: string;
    qty: number;
    length: number;
}

// --- Mock Data ---
// --- Mock Data Removed ---

// Generate generic logs
const generateInitialLogs = (): AdjustmentLog[] => {
    const dateStr = new Date().toISOString().split('T')[0];
    return [
        { id: `adj-1`, date: dateStr, time: '09:30', productId: 'stk-0', productName: '암막 롤스크린 원단', colorName: 'White', type: 'INCREASE', amount: 50, reason: '입고 누락분 반영', worker: '김자재' },
        { id: `adj-2`, date: dateStr, time: '11:15', productId: 'stk-2', productName: '암막 롤스크린 원단', colorName: 'Beige', type: 'DECREASE', amount: 20, reason: '불량 폐기', worker: '이검수' },
        { id: `adj-3`, date: dateStr, time: '14:20', productId: 'stk-5', productName: '프리미엄 콤비 원단', colorName: 'Grey', type: 'CORRECTION', amount: 120, reason: '실재고 차이 조정', worker: '박관리' },
        { id: `adj-4`, date: dateStr, time: '16:45', productId: 'stk-1', productName: '프리미엄 콤비 원단', colorName: 'Grey', type: 'DECREASE', amount: 10, reason: '샘플 제공', worker: '최영업' },
    ];
};

interface StockAdjustmentProps {
    rootId?: string;
}

const StockAdjustment: React.FC<StockAdjustmentProps> = ({ rootId }) => {
    const { nodes, setNodes } = useProductContext();
    const { theme } = useAdminTheme();
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'CURRENT' | 'HISTORY'>('CURRENT');

    // rootId 기반 필터: BFS로 childrenIds + sourceIds를 통한 가상 자식까지 모두 순회
    const treeNodeIds = useMemo(() => {
        if (!rootId || !nodes[rootId]) return null; // null = 필터 비활성
        const visited = new Set<string>();
        const queue = [rootId];
        while (queue.length > 0) {
            const id = queue.shift()!;
            if (visited.has(id)) continue;
            visited.add(id);
            const node = nodes[id];
            if (!node) continue;
            // 직접 자식 순회
            if (node.childrenIds) {
                node.childrenIds.forEach(childId => queue.push(childId));
            }
            // sourceIds를 통한 가상 자식도 순회 (참조 트리의 자식들)
            if (node.sourceIds) {
                node.sourceIds.forEach(srcId => {
                    const srcNode = nodes[srcId];
                    if (srcNode) {
                        queue.push(srcId); // 원본 노드도 포함
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
        if (!treeNodeIds) return true; // 필터 비활성이면 모든 상품 포함
        return treeNodeIds.has(node.id);
    };

    // -- Data Derivation: Filter Product/Colors valid for Stock --
    const derivedStockItems = useMemo(() => {
        const allNodes = Object.values(nodes) as NodeData[];
        const items: StockItem[] = [];

        const products = allNodes.filter(n => n.attributes?.nodeType === 'product' || n.id.startsWith('prod-'));

        products.forEach(prod => {
            // rootId 필터
            if (!isUnderRoot(prod)) return;

            // Check 1: Has Cost? (fabric or cutting)
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
            if (costItems.length === 0) return; // Skip if no cost settings

            // Get Parent Name
            let parentNode = prod.parentId ? nodes[prod.parentId] : null;

            const displayProductName = parentNode ? `${parentNode.label} > ${prod.label}` : prod.label;

            // Check 2: Iterate Colors — 모든 칼라 × 모든 폭(costItem) 조합 생성
            let hasColorChildren = false;
            if (prod.childrenIds && prod.childrenIds.length > 0) {
                prod.childrenIds.forEach(childId => {
                    const colorNode = nodes[childId];
                    if (!colorNode) return;

                    // 칼라 노드인지 확인
                    const isColor = colorNode.attributes?.nodeType === 'color' || colorNode.attributes?.color;
                    if (!isColor) return;
                    hasColorChildren = true;

                    // availableWidths 확인 (설정된 경우 해당 폭만, 없으면 모든 costItem 폭)
                    const widthsRaw = colorNode.attributes?.availableWidths;
                    let widthIds: string[] = [];
                    if (widthsRaw) {
                        try {
                            const parsed = JSON.parse(widthsRaw);
                            if (Array.isArray(parsed) && parsed.length > 0) widthIds = parsed;
                        } catch (e) { /* ignore */ }
                    }

                    // availableWidths 없으면 → 모든 costItem ID를 폭으로 사용
                    if (widthIds.length === 0) {
                        widthIds = costItems.map((c: any) => c.id);
                    }

                    // -- Load Stock Data --
                    const stockDataRaw = colorNode.attributes?.stockData;
                    let stockMap: Record<string, { qty: number, length: number, warehouse: string }> = {};
                    if (stockDataRaw) {
                        try {
                            stockMap = JSON.parse(stockDataRaw);
                        } catch (e) { /* ignore */ }
                    }

                    // Create Item PER WIDTH
                    widthIds.forEach(widthId => {
                        const costItem = costItems.find((c: any) => c.id === widthId);
                        if (!costItem) return;
                        // 폭이 없는 항목은 건너뜀
                        if (!costItem.width) return;

                        const widthLabel = costItem.category === 'SLAT'
                            ? `${costItem.width} (${costItem.height || '-'})`
                            : costItem.width;

                        const category = costItem.category === 'SLAT' ? 'SLAT' : 'ROLL';
                        const currentStock = stockMap[widthId] || { qty: 0, length: 0, warehouse: '창고 미지정' };

                        items.push({
                            id: `${prod.id}-${colorNode.id}-${widthId}`,
                            productName: displayProductName,
                            colorName: colorNode.label,
                            width: widthLabel,
                            warehouse: currentStock.warehouse,
                            rollCount: currentStock.qty,
                            totalLength: currentStock.length,
                            category: category
                        } as StockItem);
                    });
                });
            }

            // Fallback: 칼라 자식이 전혀 없는 경우 costItems 직접 사용
            if (!hasColorChildren && costItems.length > 0) {
                const stockDataRaw = prod.attributes?.stockData;
                let stockMap: Record<string, { qty: number, length: number, warehouse: string }> = {};
                if (stockDataRaw) {
                    try { stockMap = JSON.parse(stockDataRaw); } catch (e) { /* ignore */ }
                }

                costItems.forEach(costItem => {
                    // 폭이 없는 항목은 건너뜀
                    if (!costItem.width) return;
                    const widthLabel = costItem.category === 'SLAT'
                        ? `${costItem.width} (${costItem.height || '-'})`
                        : costItem.width || '기본';
                    const category = costItem.category === 'SLAT' ? 'SLAT' : 'ROLL';
                    const currentStock = stockMap[costItem.id] || { qty: 0, length: 0, warehouse: '창고 미지정' };

                    items.push({
                        id: `${prod.id}-${costItem.id}`,
                        productName: displayProductName,
                        colorName: '-',
                        width: widthLabel,
                        warehouse: currentStock.warehouse,
                        rollCount: currentStock.qty,
                        totalLength: currentStock.length,
                        category: category
                    } as StockItem);
                });
            }
        });

        // Default Sort: Product Name (ASC)
        items.sort((a, b) => a.productName.localeCompare(b.productName, 'ko'));

        return items;
    }, [nodes, rootId]);

    // -- Main Data State --
    const [stockItems, setStockItems] = useState<StockItem[]>([]);

    // Sync derived items to state (simple sync for demo)
    useEffect(() => {
        setStockItems(derivedStockItems);
    }, [derivedStockItems]);
    const [logs, setLogs] = useState<AdjustmentLog[]>(generateInitialLogs);

    // -- Modal State --
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [lotList, setLotList] = useState<AdjustmentLot[]>([]); // Individual lots in modal
    const lotListRef = useRef<AdjustmentLot[]>([]);
    const [adjustReason, setAdjustReason] = useState('실재고 차이');
    const [customReason, setCustomReason] = useState('');

    // --- Derived State for Date ---
    const formattedDateStr = useMemo(() => {
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        return `${y}. ${m}. ${d}`;
    }, [currentDate]);

    const queryDateStr = useMemo(() => {
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
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

    const isToday = relativeDateStr === "오늘";
    const dateBadgeLabel = isToday ? "Today" : `${String(currentDate.getMonth() + 1).padStart(2, '0')}.${String(currentDate.getDate()).padStart(2, '0')}`;

    // --- Stats Calculation ---
    const dailyStats = useMemo(() => {
        const todaysLogs = logs.filter(l => l.date === queryDateStr);

        const count = todaysLogs.length;
        const uniqueProducts = new Set(todaysLogs.map(l => l.productId)).size;

        let netAmount = 0;
        todaysLogs.forEach(log => {
            if (log.type === 'INCREASE') netAmount += log.amount;
            else if (log.type === 'DECREASE') netAmount -= log.amount;
            else {
                // For correction, we need the diff.
                // Assuming 'amount' in log stores the ABSOLUTE difference for simplicity in display,
                // but logic usually needs signed.
                // For this mock display: assume Correction is usually + unless context says otherwise.
                // We'll treat Correction amount as net change magnitude for display.
                netAmount += log.amount;
            }
        });

        return { count, uniqueProducts, netAmount };
    }, [logs, queryDateStr]);

    // --- Filtered List (Current Stock) ---
    const filteredStock = useMemo(() => {
        if (!searchQuery) return stockItems;
        return stockItems.filter(item =>
            item.productName.includes(searchQuery) ||
            item.colorName.includes(searchQuery) ||
            item.warehouse.includes(searchQuery)
        );
    }, [searchQuery, stockItems]);

    // --- Filtered List (History) ---
    const filteredHistory = useMemo(() => {
        // Filter logs by date first
        let currentLogs = logs.filter(l => l.date === queryDateStr);

        if (searchQuery) {
            currentLogs = currentLogs.filter(item =>
                (item.productName && item.productName.includes(searchQuery)) ||
                (item.colorName && item.colorName.includes(searchQuery)) ||
                item.reason.includes(searchQuery)
            );
        }
        return currentLogs;
    }, [logs, searchQuery, queryDateStr]);

    // --- Modal Calculations ---
    const totalLengthInModal = useMemo(() => lotList.reduce((acc, lot) => acc + lot.length, 0), [lotList]);
    const totalQtyInModal = useMemo(() => lotList.reduce((acc, lot) => acc + (lot.qty || 1), 0), [lotList]);
    const originalLength = editingItem ? editingItem.totalLength : 0;
    const diffLength = totalLengthInModal - originalLength;

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

    const handleAdjustClick = (item: StockItem) => {
        setEditingItem(item);

        const generatedLots: AdjustmentLot[] = [];

        // 저장된 lots 데이터 읽기 시도
        let savedLots: AdjustmentLot[] | null = null;
        const allNodes = Object.values(nodes) as NodeData[];
        for (const node of allNodes) {
            if (node.attributes?.nodeType === 'color') {
                const prefix = `${node.parentId}-${node.id}-`;
                if (item.id.startsWith(prefix)) {
                    const widthId = item.id.replace(prefix, '');
                    try {
                        const stockData = JSON.parse(node.attributes?.stockData || '{}');
                        const widthData = stockData[widthId];
                        if (widthData?.lots && Array.isArray(widthData.lots)) {
                            savedLots = widthData.lots;
                        }
                    } catch (e) { }
                    break;
                }
            }
        }

        // Product node fallback (if no color node matched)
        if (!savedLots) {
            for (const node of allNodes) {
                if (node.attributes?.nodeType === 'product') {
                    const prefix = `${node.id}-`;
                    if (item.id.startsWith(prefix)) {
                        const widthId = item.id.replace(prefix, '');
                        try {
                            const stockData = JSON.parse(node.attributes?.stockData || '{}');
                            if (stockData[widthId]?.lots && Array.isArray(stockData[widthId].lots)) {
                                savedLots = stockData[widthId].lots;
                            }
                        } catch (e) { }
                        break;
                    }
                }
            }
        }

        if (savedLots && savedLots.length > 0) {
            // 저장된 롯트 데이터 로드
            savedLots.forEach((lot, i) => {
                generatedLots.push({
                    id: lot.id || `lot-saved-${i}`,
                    lotNo: lot.lotNo || '',
                    spec: lot.spec || '',
                    qty: lot.qty || 0,
                    length: lot.length || 0
                });
            });
        } else if (item.category === 'SLAT') {
            // 슬랫형: 규격별 단일행으로 표시
            const now = new Date();
            const lotPrefix = `LOT-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-001`;
            generatedLots.push({
                id: `lot-slat-0`,
                lotNo: lotPrefix,
                spec: item.width || '',
                qty: item.rollCount || 0,
                length: 0
            });
        } else {
            // 롤형: 기존 방식 (재고가 있을 때만 자동 생성)
            const count = item.rollCount || 0;
            const totalLen = item.totalLength || 0;

            if (count > 0 && totalLen > 0) {
                const avgLen = Math.floor(totalLen / count);
                const remainder = totalLen % count;
                const now = new Date();
                const datePrefix = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

                for (let i = 0; i < count; i++) {
                    generatedLots.push({
                        id: `lot-sim-${i}`,
                        lotNo: `LOT-${datePrefix}-${String(i + 1).padStart(3, '0')}`,
                        spec: '',
                        qty: 1,
                        length: i === count - 1 ? avgLen + remainder : avgLen
                    });
                }
            }
        }

        setLotList(generatedLots);
        lotListRef.current = generatedLots;
        setAdjustReason('실재고 차이');
        setCustomReason('');
        setIsModalOpen(true);
    };

    const updateLotList = (updater: (prev: AdjustmentLot[]) => AdjustmentLot[]) => {
        setLotList(prev => {
            const newList = updater(prev);
            lotListRef.current = newList;
            return newList;
        });
    };

    const handleLotChange = (id: string, value: string) => {
        const numVal = parseInt(value) || 0;
        updateLotList(prev => prev.map(lot => lot.id === id ? { ...lot, length: numVal } : lot));
    };

    const handleLotQtyChange = (id: string, value: string) => {
        const numVal = parseInt(value) || 0;
        updateLotList(prev => prev.map(lot => lot.id === id ? { ...lot, qty: numVal } : lot));
    };

    const handleLotNoChange = (id: string, value: string) => {
        updateLotList(prev => prev.map(lot => lot.id === id ? { ...lot, lotNo: value } : lot));
    };

    const handleLotSpecChange = (id: string, value: string) => {
        updateLotList(prev => prev.map(lot => lot.id === id ? { ...lot, spec: value } : lot));
    };

    const handleDeleteLot = (id: string) => {
        updateLotList(prev => prev.filter(lot => lot.id !== id));
    };

    const handleAddLot = () => {
        updateLotList(prev => [
            ...prev,
            editingItem?.category === 'SLAT'
                ? {
                    id: `lot-slat-${Date.now()}`,
                    lotNo: '',
                    spec: '',
                    qty: 0,
                    length: 0
                }
                : {
                    id: `lot-new-${Date.now()}`,
                    lotNo: `LOT-NEW-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
                    spec: '',
                    qty: 1,
                    length: 0
                }
        ]);
    };

    // --- 재고 자동생성 ---
    const handleAutoGenerate = () => {
        if (!confirm('기존 재고를 모두 초기화하고\n상품원가에 설정된 모든 조합으로 재고를 새로 생성합니다.\n\n계속하시겠습니까?')) return;

        const allNodes = Object.values(nodes) as NodeData[];
        const products = allNodes.filter(n => n.attributes?.nodeType === 'product' || n.id.startsWith('prod-'));

        let totalGenerated = 0;
        const updatedNodes: Record<string, NodeData> = {};

        products.forEach(prod => {
            // rootId 필터
            if (!isUnderRoot(prod)) return;

            // 상품원가 확인 (fabric + cutting)
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

            // 칼라 순회 — 모든 칼라 × 모든 폭(costItem) 조합으로 재고 생성
            let hasColorChildren = false;
            if (prod.childrenIds && prod.childrenIds.length > 0) {
                prod.childrenIds.forEach(childId => {
                    const colorNode = nodes[childId];
                    if (!colorNode) return;

                    // 칼라 노드인지 확인
                    const isColor = colorNode.attributes?.nodeType === 'color' || colorNode.attributes?.color;
                    if (!isColor) return;
                    hasColorChildren = true;

                    // availableWidths 확인 (설정된 경우 해당 폭만, 없으면 모든 costItem 폭)
                    const widthsRaw = colorNode.attributes?.availableWidths;
                    let widthIds: string[] = [];
                    if (widthsRaw) {
                        try {
                            const parsed = JSON.parse(widthsRaw);
                            if (Array.isArray(parsed) && parsed.length > 0) widthIds = parsed;
                        } catch (e) { /* ignore */ }
                    }

                    // availableWidths 없으면 → 모든 costItem ID를 폭으로 사용
                    if (widthIds.length === 0) {
                        widthIds = costItems.map((c: any) => c.id);
                    }

                    const newStockData: Record<string, any> = {};

                    widthIds.forEach(widthId => {
                        const costItem = costItems.find((c: any) => c.id === widthId);
                        if (!costItem) return;
                        // 폭이 없는 항목은 건너뜀
                        if (!costItem.width) return;

                        const isSlat = costItem.category === 'SLAT';

                        if (isSlat) {
                            const qty = Math.floor(Math.random() * 191) + 10;
                            newStockData[widthId] = {
                                qty: qty,
                                length: 0,
                                warehouse: '본사 창고'
                            };
                        } else {
                            const rollCount = Math.floor(Math.random() * 10) + 1;
                            const avgLength = Math.floor(Math.random() * 51) + 30;
                            newStockData[widthId] = {
                                qty: rollCount,
                                length: rollCount * avgLength,
                                warehouse: '본사 창고'
                            };
                        }
                        totalGenerated++;
                    });

                    // 업데이트할 칼라 노드 저장
                    updatedNodes[colorNode.id] = {
                        ...colorNode,
                        attributes: {
                            ...colorNode.attributes,
                            stockData: JSON.stringify(newStockData)
                        }
                    };
                });
            }

            // Fallback: 칼라 자식이 전혀 없는 경우 costItems 직접 사용
            if (!hasColorChildren && costItems.length > 0) {
                const newStockData: Record<string, any> = {};

                costItems.forEach(costItem => {
                    // 폭이 없는 항목은 건너뜀
                    if (!costItem.width) return;
                    const isSlat = costItem.category === 'SLAT';
                    if (isSlat) {
                        const qty = Math.floor(Math.random() * 191) + 10;
                        newStockData[costItem.id] = { qty, length: 0, warehouse: '본사 창고' };
                    } else {
                        const rollCount = Math.floor(Math.random() * 10) + 1;
                        const avgLength = Math.floor(Math.random() * 51) + 30;
                        newStockData[costItem.id] = { qty: rollCount, length: rollCount * avgLength, warehouse: '본사 창고' };
                    }
                    totalGenerated++;
                });

                // 상품 노드 자체에 stockData 저장
                updatedNodes[prod.id] = {
                    ...prod,
                    attributes: {
                        ...prod.attributes,
                        stockData: JSON.stringify(newStockData)
                    }
                };
            }
        });

        if (totalGenerated === 0) {
            alert('생성할 재고 조합이 없습니다.\n표준설정 > 상품원가에서 상품원가와 칼라별 규격을 먼저 설정해주세요.');
            return;
        }

        // 글로벌 상태 업데이트
        setNodes(prev => {
            const next = { ...prev };
            Object.keys(updatedNodes).forEach(id => {
                next[id] = updatedNodes[id];
            });
            return next;
        });

        alert(`재고 자동생성 완료!\n\n총 ${totalGenerated}개 상품/칼라/규격 조합의 재고가 생성되었습니다.`);
    };

    const handleSaveAdjustment = () => {
        if (!editingItem) return;

        const newTotalLen = totalLengthInModal;
        const newRollCount = totalQtyInModal;

        const diff = newTotalLen - (editingItem.totalLength || 0);

        const finalReason = adjustReason === '직접입력' ? customReason : adjustReason;
        if (!finalReason) {
            alert("조정 사유를 입력해주세요.");
            return;
        }

        // Determine Adjustment Type
        let type: 'INCREASE' | 'DECREASE' | 'CORRECTION' = 'CORRECTION';
        if (diff > 0) type = 'INCREASE';
        if (diff < 0) type = 'DECREASE';

        // 2. Add Log
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const newLog: AdjustmentLog = {
            id: `adj-${Date.now()}`,
            date: queryDateStr,
            time: timeStr,
            productId: editingItem.id, // This is composite ID
            productName: editingItem.productName,
            colorName: editingItem.colorName,
            type: type,
            amount: Math.abs(diff),
            reason: finalReason,
            worker: '관리자'
        };

        setLogs(prev => [newLog, ...prev]);

        // 3. Persist to Global State
        const allNodes = Object.values(nodes) as NodeData[];
        let targetColorNode: NodeData | null = null;
        let targetWidthId: string | null = null;

        for (const node of allNodes) {
            if (node.attributes?.nodeType === 'color') {
                // Check if this color node is part of the ID
                // Construct prefix: `${node.parentId}-${node.id}-`
                const prefix = `${node.parentId}-${node.id}-`;
                if (editingItem.id.startsWith(prefix)) {
                    targetColorNode = node;
                    targetWidthId = editingItem.id.replace(prefix, '');
                    break;
                }
            }
        }

        if (targetColorNode && targetWidthId) {
            setNodes(prev => {
                const next = { ...prev };
                const node = next[targetColorNode!.id];
                if (!node) return prev;

                // Get existing stock data
                let stockData: Record<string, any> = {};
                try {
                    stockData = JSON.parse(node.attributes?.stockData || '{}');
                } catch (e) { }

                // Update - lotListRef.current에서 최신 값 읽기
                let lotsToSave = lotListRef.current.map(lot => ({
                    id: lot.id,
                    lotNo: lot.lotNo,
                    spec: lot.spec,
                    qty: lot.qty,
                    length: lot.length
                }));

                // DOM에서 직접 값 수집 (추가 안전장치)
                if (editingItem.category === 'SLAT') {
                    const lotNoInputs = document.querySelectorAll('input[data-field="lotNo"]') as NodeListOf<HTMLInputElement>;
                    const specInputs = document.querySelectorAll('input[data-field="spec"]') as NodeListOf<HTMLInputElement>;

                    lotNoInputs.forEach(input => {
                        const lotId = input.getAttribute('data-lot-id');
                        const found = lotsToSave.find(l => l.id === lotId);
                        if (found) found.lotNo = input.value;
                    });
                    specInputs.forEach(input => {
                        const lotId = input.getAttribute('data-lot-id');
                        const found = lotsToSave.find(l => l.id === lotId);
                        if (found) found.spec = input.value;
                    });
                }


                // 재고량 0인 롯트 자동 삭제 (롤형: length 0, 슬랫형: qty 0)
                if (editingItem.category === 'SLAT') {
                    lotsToSave = lotsToSave.filter(lot => lot.qty > 0);
                } else {
                    lotsToSave = lotsToSave.filter(lot => lot.length > 0);
                }

                // 필터 후 남은 롯트 기준으로 qty/length 재계산
                const finalQty = lotsToSave.length > 0 ? lotsToSave.reduce((sum, l) => sum + (l.qty || 0), 0) : 0;
                const finalLength = lotsToSave.length > 0 ? lotsToSave.reduce((sum, l) => sum + (l.length || 0), 0) : 0;

                stockData[targetWidthId!] = {
                    qty: finalQty,
                    length: finalLength,
                    warehouse: editingItem.warehouse,
                    lots: lotsToSave
                };

                // Save
                next[node.id] = {
                    ...node,
                    attributes: {
                        ...node.attributes,
                        stockData: JSON.stringify(stockData)
                    }
                };

                return next;
            });
            alert("재고 조정이 완료되었습니다.");
            setIsModalOpen(false);
        } else {
            alert("오류: 대상 노드를 찾을 수 없습니다. (데이터 불일치)");
        }
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden font-sans relative" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 'var(--theme-font-base)' }}>

            {/* 1. Header Area */}
            <div className="flex-shrink-0 px-8 py-4 shadow-sm z-20 h-20 flex items-center justify-between" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>

                {/* Title */}
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                        <Sliders style={{ color: 'var(--theme-primary)' }} /> 재고조정
                    </h1>
                </div>

                {/* Controls */}
                <div className="flex flex-1 md:justify-end gap-3 min-w-0 items-center">
                    {/* 재고자동생성 버튼 */}
                    <button
                        onClick={handleAutoGenerate}
                        className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 h-[40px]"
                        style={{ background: 'var(--theme-primary)' }}
                    >
                        <Zap size={16} />
                        재고자동생성
                    </button>
                    {/* Date Picker */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm h-[40px]">
                        <button onClick={handleToday} className="px-3 h-full bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-colors flex items-center">오늘</button>
                        <div className="w-px h-4 bg-gray-200 mx-2" />
                        <div className="flex items-center gap-2 px-1">
                            <button onClick={handlePrevDay} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={18} strokeWidth={2.5} /></button>
                            <div className="flex items-center justify-center gap-2 min-w-[120px]">
                                <span className="text-base font-extrabold text-gray-800 leading-none tracking-tight">{formattedDateStr}</span>
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{relativeDateStr}</span>
                            </div>
                            <button onClick={handleNextDay} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={18} strokeWidth={2.5} /></button>
                        </div>
                    </div>


                </div>
            </div>

            {/* 2. Status Cards */}
            <div className="flex-shrink-0 px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                        <div className="flex justify-between items-start">
                            <div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><Activity size={20} /></div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>{dateBadgeLabel}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일 조정건수</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{dailyStats.count}</span>
                                <span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>건</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                        <div className="flex justify-between items-start">
                            <div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><Package size={20} /></div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>{dateBadgeLabel}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일 조정상품수</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{dailyStats.uniqueProducts}</span>
                                <span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>종</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                        <div className="flex justify-between items-start">
                            <div className={`p-2 rounded-lg ${dailyStats.netAmount >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {dailyStats.netAmount >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isToday ? (dailyStats.netAmount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-gray-100 text-gray-600'}`}>{dateBadgeLabel}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일 조정량 (+/-)</span>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-2xl font-bold ${dailyStats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {dailyStats.netAmount > 0 ? `+${dailyStats.netAmount.toLocaleString()}` : dailyStats.netAmount.toLocaleString()}
                                </span>
                                <span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>m</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. List Section */}
            <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
                <div className="rounded-2xl flex-1 flex flex-col shadow-sm overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                    <div className="px-5 py-3 flex flex-col md:flex-row justify-between items-center gap-3" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-grid-header)' }}>
                        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--admin-border)' }}>
                            <button onClick={() => setActiveTab('CURRENT')} className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all" style={activeTab === 'CURRENT' ? { background: 'var(--admin-surface)', color: 'var(--theme-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: 'var(--admin-text-sub)' }}><List size={14} /> 현재 재고 리스트</button>
                            <button onClick={() => setActiveTab('HISTORY')} className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all" style={activeTab === 'HISTORY' ? { background: 'var(--admin-surface)', color: 'var(--theme-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: 'var(--admin-text-sub)' }}><History size={14} /> 일별 조정 리스트</button>
                        </div>

                        {/* Search Bar Moved Here */}
                        <div className="relative w-full max-w-xs h-[36px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="상품명, 색상, 창고위치 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-full pl-9 pr-4 bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm font-medium outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50"><Filter size={14} /> 필터</button>
                            <button className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50"><Download size={14} /> 엑셀 다운로드</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-hide">
                        {activeTab === 'CURRENT' ? (
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="font-bold text-xs uppercase sticky top-0 z-10 shadow-sm" style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                                    <tr>
                                        <th className="px-4 py-3 text-center w-12">NO</th>
                                        <th className="px-4 py-3">상품명</th>
                                        <th className="px-4 py-3 text-center">색상</th>
                                        <th className="px-4 py-3 text-center">폭</th>
                                        <th className="px-4 py-3 text-center">창고위치</th>
                                        <th className="px-4 py-3 text-right">수량 (Roll/EA)</th>
                                        <th className="px-4 py-3 text-right">총수량 (m)</th>
                                        <th className="px-4 py-3 text-center w-24">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredStock.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="px-4 py-3 text-center text-gray-400 font-medium">{index + 1}</td>
                                            <td className="px-4 py-3 font-bold text-gray-800">{item.productName}</td>
                                            <td className="px-4 py-3 text-center"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">{item.colorName}</span></td>
                                            <td className="px-4 py-3 text-center font-mono text-gray-600 font-bold">{item.width}</td>
                                            <td className="px-4 py-3 text-center font-mono text-gray-600 text-xs"><span className="flex items-center justify-center gap-1"><MapPin size={12} className="text-gray-400" /> {item.warehouse}</span></td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-700">
                                                {item.rollCount} <span className="text-[10px] font-normal text-gray-400">{item.category === 'SLAT' ? 'EA' : 'Roll'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-600">
                                                {item.category === 'SLAT' ? (
                                                    <span className="text-gray-300">-</span>
                                                ) : (
                                                    <>{item.totalLength.toLocaleString()} <span className="text-[10px] font-normal text-blue-400">m</span></>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center"><button onClick={() => handleAdjustClick(item)} className="bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 mx-auto"><Edit3 size={12} /> 조정</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="font-bold text-xs uppercase sticky top-0 z-10 shadow-sm" style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)', borderBottom: '1px solid var(--admin-border)' }}>
                                    <tr>
                                        <th className="px-4 py-3 text-center w-12">NO</th>
                                        <th className="px-4 py-3 text-center">시간</th>
                                        <th className="px-4 py-3">상품명</th>
                                        <th className="px-4 py-3 text-center">색상</th>
                                        <th className="px-4 py-3 text-center">구분</th>
                                        <th className="px-4 py-3 text-right">조정량</th>
                                        <th className="px-4 py-3">사유</th>
                                        <th className="px-4 py-3 text-center">작업자</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredHistory.map((log, index) => (
                                        <tr key={log.id} className="hover:bg-orange-50/30 transition-colors group">
                                            <td className="px-4 py-3 text-center text-gray-400 font-medium">{index + 1}</td>
                                            <td className="px-4 py-3 text-center font-mono text-gray-500 text-xs">{log.time}</td>
                                            <td className="px-4 py-3 font-bold text-gray-800">{log.productName}</td>
                                            <td className="px-4 py-3 text-center"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">{log.colorName}</span></td>
                                            <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.type === 'INCREASE' ? 'bg-blue-100 text-blue-600' : log.type === 'DECREASE' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{log.type === 'INCREASE' ? '증가' : log.type === 'DECREASE' ? '감소' : '정정'}</span></td>
                                            <td className={`px-4 py-3 text-right font-bold font-mono ${log.type === 'INCREASE' || log.type === 'CORRECTION' ? 'text-blue-600' : 'text-red-500'}`}>{log.type === 'INCREASE' || (log.type === 'CORRECTION' && log.amount > 0) ? '+' : '-'}{Math.abs(log.amount)} <span className="text-[10px] font-normal text-gray-400">m</span></td>
                                            <td className="px-4 py-3 text-gray-600 text-xs">{log.reason}</td>
                                            <td className="px-4 py-3 text-center text-gray-500 text-xs">{log.worker}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {((activeTab === 'CURRENT' && filteredStock.length === 0) || (activeTab === 'HISTORY' && filteredHistory.length === 0)) && (<div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">{activeTab === 'CURRENT' ? <Package size={48} className="opacity-20" /> : <FileText size={48} className="opacity-20" />}<p>{activeTab === 'CURRENT' ? '검색된 재고가 없습니다.' : '조정 내역이 없습니다.'}</p></div>)}
                    </div>
                </div>
            </div>

            {/* Adjustment Modal */}
            <AnimatePresence>
                {isModalOpen && editingItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]" style={{ background: 'var(--admin-modal-bg, var(--admin-surface))', color: 'var(--admin-text)' }}>
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Scale className="text-blue-600" /> 재고 상세 조정</h2>
                                    <p className="text-xs text-gray-400 mt-1">{editingItem.productName} <span className="text-blue-500 font-bold">[{editingItem.colorName}] ({editingItem.width})</span></p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">

                                {/* Summary Bar */}
                                <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">기존 수량</span>
                                        <span className="text-lg font-bold text-gray-600">
                                            {editingItem.category === 'SLAT' ? (
                                                <>{editingItem.rollCount} EA</>
                                            ) : (
                                                <>{editingItem.totalLength.toLocaleString()}m <span className="text-xs text-gray-400">({editingItem.rollCount} Roll)</span></>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center"><ArrowRight className="text-gray-300" /></div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">조정 후 수량</span>
                                        <span className={`text-lg font-bold ${diffLength > 0 ? 'text-blue-600' : diffLength < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                                            {editingItem.category === 'SLAT' ? (
                                                <>{totalQtyInModal} EA</>
                                            ) : (
                                                <>{totalLengthInModal.toLocaleString()}m <span className="text-xs text-gray-400">({totalQtyInModal} Roll)</span></>
                                            )}
                                        </span>
                                        {diffLength !== 0 && editingItem.category !== 'SLAT' && <span className={`block text-xs font-bold ${diffLength > 0 ? 'text-blue-500' : 'text-red-500'}`}>{diffLength > 0 ? '+' : ''}{diffLength}m</span>}
                                        {(totalQtyInModal - editingItem.rollCount) !== 0 && editingItem.category === 'SLAT' && (
                                            <span className={`block text-xs font-bold ${(totalQtyInModal - editingItem.rollCount) > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                                {(totalQtyInModal - editingItem.rollCount) > 0 ? '+' : ''}{totalQtyInModal - editingItem.rollCount} EA
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Lot List */}
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-gray-600">{editingItem.category === 'SLAT' ? '규격별 수량 관리' : '개별 Roll (Lot) 관리'}</h3>
                                        <button onClick={handleAddLot} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-lg font-bold transition-colors flex items-center gap-1"><Plus size={12} /> {editingItem.category === 'SLAT' ? '재고 추가' : '재고 추가'}</button>
                                    </div>
                                    {/* SLAT 헤더 */}
                                    {editingItem.category === 'SLAT' && lotList.length > 0 && (
                                        <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                                            <div className="w-8 text-center">NO</div>
                                            <div className="w-36">롯트번호</div>
                                            <div className="flex-1">규격</div>
                                            <div className="w-24 text-right">수량 (EA)</div>
                                            <div className="w-8"></div>
                                        </div>
                                    )}
                                    {/* 롤형 헤더 */}
                                    {editingItem.category !== 'SLAT' && lotList.length > 0 && (
                                        <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                                            <div className="w-8 text-center">NO</div>
                                            <div className="flex-1">롯트번호</div>
                                            <div className="w-32 text-right">재고량 (m)</div>
                                        </div>
                                    )}
                                    <div className="max-h-[300px] overflow-y-auto scrollbar-hide p-2 space-y-1">
                                        {lotList.length === 0 ? <div className="text-center py-8 text-gray-400 text-xs">등록된 {editingItem.category === 'SLAT' ? '규격이' : '롤이'} 없습니다. 추가해주세요.</div> : lotList.map((lot, idx) => (
                                            <div key={lot.id} className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg hover:border-blue-200 transition-colors">
                                                <div className="w-8 text-center text-xs text-gray-400 font-bold">{idx + 1}</div>
                                                {editingItem.category === 'SLAT' ? (
                                                    /* 슬랫형: 롯트번호 + 규격 + 갯수 */
                                                    <>
                                                        <input
                                                            type="text"
                                                            defaultValue={lot.lotNo}
                                                            onChange={(e) => handleLotNoChange(lot.id, e.target.value)}
                                                            autoComplete="off"
                                                            data-form-type="other"
                                                            data-lot-id={lot.id}
                                                            data-field="lotNo"
                                                            className="w-36 font-mono text-xs text-gray-800 bg-white border border-gray-200 px-2 py-1.5 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors"
                                                            placeholder="LOT No."
                                                        />
                                                        <input
                                                            type="text"
                                                            defaultValue={lot.spec}
                                                            onChange={(e) => handleLotSpecChange(lot.id, e.target.value)}
                                                            autoComplete="off"
                                                            data-form-type="other"
                                                            data-lot-id={lot.id}
                                                            data-field="spec"
                                                            className="flex-1 text-sm text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded outline-none focus:border-blue-500 transition-colors"
                                                            placeholder="규격 (예: 35mm, 50mm)"
                                                        />
                                                        <div className="w-24 relative">
                                                            <input
                                                                type="number"
                                                                value={lot.qty}
                                                                onChange={(e) => handleLotQtyChange(lot.id, e.target.value)}
                                                                className="w-full pl-2 pr-7 py-1.5 bg-white border border-gray-200 rounded text-right text-sm font-bold text-gray-900 outline-none focus:border-blue-500"
                                                                min={0}
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">EA</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    /* 롤형: 롯트번호 + 재고량(m)만 표시 */
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={lot.lotNo}
                                                            onChange={(e) => handleLotNoChange(lot.id, e.target.value)}
                                                            autoComplete="off"
                                                            className="flex-1 font-mono text-xs text-gray-800 bg-white border border-gray-200 px-2 py-1.5 rounded outline-none focus:border-blue-500 transition-colors"
                                                            placeholder="LOT No."
                                                        />
                                                        <div className="w-32 relative">
                                                            <input
                                                                type="number"
                                                                value={lot.length}
                                                                onChange={(e) => handleLotChange(lot.id, e.target.value)}
                                                                autoComplete="off"
                                                                className="w-full pl-2 pr-6 py-1.5 bg-white border border-gray-200 rounded text-right text-sm font-bold text-gray-900 outline-none focus:border-blue-500"
                                                                min={0}
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m</span>
                                                        </div>
                                                    </>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase">조정 사유</label>
                                    <div className="flex gap-2 mb-2">
                                        {['실재고 차이', '입고 누락', '불량 폐기', '샘플 사용', '직접입력'].map(r => (
                                            <button key={r} onClick={() => setAdjustReason(r)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${adjustReason === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{r}</button>
                                        ))}
                                    </div>
                                    {adjustReason === '직접입력' && (
                                        <input type="text" value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="사유를 입력하세요" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" />
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 flex justify-end gap-3" style={{ background: 'var(--admin-grid-header)', borderTop: '1px solid var(--admin-border)' }}>
                                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>취소</button>
                                <button onClick={handleSaveAdjustment} className="px-6 py-2.5 text-white rounded-xl text-sm font-bold transition-transform active:scale-95 flex items-center gap-2" style={{ background: 'var(--theme-primary)' }}><CheckCircle2 size={16} /> 조정 완료</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default StockAdjustment;
